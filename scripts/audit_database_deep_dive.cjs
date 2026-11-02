const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.resolve(__dirname, '../supabase/migrations');
const files = fs.readdirSync(MIGRATIONS_DIR)
  .filter(f => f.endsWith('.sql') && !f.includes('rollback'))
  .sort();

console.log('Analyzing', files.length, 'migration files:');

const inventory = {
  migrations: [],
  tables: {},
  functions: [],
  triggers: [],
  indexes: [],
  policies: [],
};

files.forEach(file => {
  const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
  inventory.migrations.push(file);

  // Tables
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_\.]+)\s*\(([\s\S]*?)\);/gi;
  let tMatch;
  while ((tMatch = tableRegex.exec(content)) !== null) {
    const rawName = tMatch[1].replace(/public\./, '');
    const body = tMatch[2];
    const columns = [];
    body.split('\n').forEach(line => {
      const trimmed = line.trim();
      const colMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s+([A-Z0-9_]+(\(.*?\))?)/i);
      if (colMatch && !/^(PRIMARY|FOREIGN|CONSTRAINT|UNIQUE|CHECK|REFERENCES)/i.test(colMatch[1])) {
        columns.push({
          name: colMatch[1],
          type: colMatch[2],
          raw: trimmed.replace(/,$/, ''),
        });
      }
    });
    if (!inventory.tables[rawName]) {
      inventory.tables[rawName] = {
        name: rawName,
        createdIn: file,
        columns: columns,
      };
    }
  }

  // Alter Table Add Column
  const alterColRegex = /ALTER\s+TABLE\s+(?:ONLY\s+)?([a-zA-Z0-9_\.]+)\s+ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)\s+([^;]+);/gi;
  let aMatch;
  while ((aMatch = alterColRegex.exec(content)) !== null) {
    const rawName = aMatch[1].replace(/public\./, '');
    const colName = aMatch[2];
    const colDef = aMatch[3].trim();
    if (inventory.tables[rawName]) {
      inventory.tables[rawName].columns.push({
        name: colName,
        type: colDef.split(' ')[0],
        raw: `${colName} ${colDef} (added in ${file})`,
      });
    }
  }

  // Policies
  const polRegex = /CREATE\s+POLICY\s+["']?([^"']+)["']?\s+ON\s+([a-zA-Z0-9_\.]+)([\s\S]*?);/gi;
  let pMatch;
  while ((pMatch = polRegex.exec(content)) !== null) {
    inventory.policies.push({
      policy: pMatch[1],
      table: pMatch[2].replace(/public\./, ''),
      details: pMatch[3].trim().replace(/\s+/g, ' '),
      migration: file,
    });
  }

  // Functions
  const funcRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+([a-zA-Z0-9_\.]+)\s*\(([\s\S]*?)\)\s+RETURNS\s+([a-zA-Z0-9_]+)/gi;
  let fMatch;
  while ((fMatch = funcRegex.exec(content)) !== null) {
    inventory.functions.push({
      function: fMatch[1].replace(/public\./, ''),
      args: fMatch[2].trim().replace(/\s+/g, ' '),
      returns: fMatch[3],
      migration: file,
    });
  }

  // Indexes
  const idxRegex = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)\s+ON\s+([a-zA-Z0-9_\.]+)\s*\((.*?)\);/gi;
  let iMatch;
  while ((iMatch = idxRegex.exec(content)) !== null) {
    inventory.indexes.push({
      index: iMatch[1],
      table: iMatch[2].replace(/public\./, ''),
      columns: iMatch[3],
      migration: file,
    });
  }
});

console.log('Tables:', Object.keys(inventory.tables).length);
console.log('Policies:', inventory.policies.length);
console.log('Functions:', inventory.functions.length);
console.log('Indexes:', inventory.indexes.length);

fs.writeFileSync(
  path.resolve(__dirname, '../artifacts/database_deep_dive.json'),
  JSON.stringify(inventory, null, 2)
);
console.log('Saved artifacts/database_deep_dive.json');
