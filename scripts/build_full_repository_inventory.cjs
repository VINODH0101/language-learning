/**
 * Lexilume — Automated Complete Repository Inventory & Architectural Graph Engine
 * 
 * Inspects every file, component, service, route, database object, migration,
 * dependency, and test in the repository. Generates structural dependency maps,
 * reverse import graphs, and object inventories.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.pytest_cache',
  'dist',
  '.system_generated',
  '.gemini',
]);

const FILE_CATEGORIES = {
  frontend_page: /frontend\/src\/pages\//,
  frontend_component: /frontend\/src\/components\//,
  frontend_feature: /frontend\/src\/features\//,
  frontend_hook: /frontend\/src\/hooks\//,
  frontend_context: /frontend\/src\/context|frontend\/src\/i18n\/i18nContext/,
  frontend_service: /frontend\/src\/services\//,
  frontend_integration: /frontend\/src\/integrations\//,
  frontend_type: /frontend\/src\/types\//,
  frontend_data: /frontend\/src\/data\//,
  frontend_config: /frontend\/src\/config\//,
  frontend_i18n_locale: /frontend\/src\/i18n\/locales\//,
  frontend_test: /frontend\/src\/tests\//,
  backend_engine: /engine\//,
  backend_test: /tests\//,
  database_migration: /supabase\/migrations\//,
  workflow: /\.github\/workflows\//,
  script: /scripts\//,
  doc: /\.md$/,
  asset: /\.(png|jpg|jpeg|svg|ico|webp|mp3|wav|json)$/,
};

function classifyFile(relPath) {
  const normalized = relPath.replace(/\\/g, '/');
  for (const [cat, regex] of Object.entries(FILE_CATEGORIES)) {
    if (regex.test(normalized)) return cat;
  }
  return 'other';
}

function getAllFiles(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function countLines(content) {
  return content.split('\n').length;
}

console.log('[Inventory] Scanning full repository at:', ROOT_DIR);
const allFiles = getAllFiles(ROOT_DIR);
console.log(`[Inventory] Discovered ${allFiles.length} files across repository.`);

// Extract Imports & Dependencies
const fileCatalog = [];
const importGraph = new Map(); // file -> [importedFiles]
const reverseImportGraph = new Map(); // file -> [filesImportingThis]

allFiles.forEach(file => {
  const relPath = path.relative(ROOT_DIR, file).replace(/\\/g, '/');
  const stat = fs.statSync(file);
  const ext = path.extname(file).toLowerCase();
  const category = classifyFile(relPath);

  let lines = 0;
  let content = '';
  const isText = /\.(ts|tsx|js|jsx|py|sql|json|md|yml|yaml|css|html|txt|toml)$/i.test(ext);

  if (isText && stat.size < 5 * 1024 * 1024) {
    try {
      content = fs.readFileSync(file, 'utf8');
      lines = countLines(content);
    } catch {}
  }

  fileCatalog.push({
    relPath,
    fullPath: file,
    size: stat.size,
    lines,
    ext,
    category,
    content,
  });

  importGraph.set(relPath, new Set());
  reverseImportGraph.set(relPath, new Set());
});

// Build Dependency Graph for Frontend & Backend
const jsTsFiles = fileCatalog.filter(f => /\.(ts|tsx|js|jsx)$/.test(f.ext));

jsTsFiles.forEach(fileObj => {
  const fileDir = path.dirname(fileObj.relPath);
  const importRegex = /(?:import|from)\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(fileObj.content)) !== null) {
    const importTarget = match[1];
    if (importTarget.startsWith('.')) {
      // Relative import
      const resolved = path.normalize(path.join(fileDir, importTarget)).replace(/\\/g, '/');
      const candidates = [
        resolved,
        `${resolved}.ts`,
        `${resolved}.tsx`,
        `${resolved}.js`,
        `${resolved}.jsx`,
        `${resolved}/index.ts`,
        `${resolved}/index.tsx`,
        `${resolved}/index.js`,
      ];
      for (const cand of candidates) {
        if (importGraph.has(cand)) {
          importGraph.get(fileObj.relPath).add(cand);
          reverseImportGraph.get(cand).add(fileObj.relPath);
          break;
        }
      }
    }
  }
});

// Build Python Dependency Graph
const pyFiles = fileCatalog.filter(f => f.ext === '.py');
pyFiles.forEach(fileObj => {
  const importRegex = /(?:from\s+([a-zA-Z0-9_\.]+)\s+import|import\s+([a-zA-Z0-9_\.]+))/g;
  let match;
  while ((match = importRegex.exec(fileObj.content)) !== null) {
    const mod = match[1] || match[2];
    if (mod && mod.startsWith('engine')) {
      const modPath = mod.replace(/\./g, '/');
      const candidates = [
        `${modPath}.py`,
        `${modPath}/__init__.py`,
      ];
      for (const cand of candidates) {
        if (importGraph.has(cand)) {
          importGraph.get(fileObj.relPath).add(cand);
          reverseImportGraph.get(cand).add(fileObj.relPath);
          break;
        }
      }
    }
  }
});

// Scan Database Migrations
const migrationFiles = fileCatalog
  .filter(f => f.category === 'database_migration')
  .sort((a, b) => a.relPath.localeCompare(b.relPath));

const dbTables = new Map();
const dbPolicies = [];
const dbFunctions = [];
const dbIndexes = [];

migrationFiles.forEach(m => {
  const sql = m.content;
  // Tables
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_\.]+)\s*\(([\s\S]*?)\);/gi;
  let tMatch;
  while ((tMatch = createTableRegex.exec(sql)) !== null) {
    const tableName = tMatch[1].replace(/public\./, '');
    const body = tMatch[2];
    const columns = [];
    const lines = body.split('\n');
    lines.forEach(l => {
      const colMatch = l.trim().match(/^([a-zA-Z0-9_]+)\s+([A-Z0-9_]+(\(.*?\))?)/i);
      if (colMatch && !/^(PRIMARY|FOREIGN|CONSTRAINT|UNIQUE|CHECK)/i.test(colMatch[1])) {
        columns.push({ name: colMatch[1], type: colMatch[2] });
      }
    });
    dbTables.set(tableName, {
      name: tableName,
      migration: m.relPath,
      columns,
    });
  }

  // Policies
  const policyRegex = /CREATE\s+POLICY\s+["']?([^"']+)["']?\s+ON\s+([a-zA-Z0-9_\.]+)/gi;
  let pMatch;
  while ((pMatch = policyRegex.exec(sql)) !== null) {
    dbPolicies.push({ policy: pMatch[1], table: pMatch[2].replace(/public\./, ''), migration: m.relPath });
  }

  // Functions
  const funcRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+([a-zA-Z0-9_\.]+)\s*\(/gi;
  let fMatch;
  while ((fMatch = funcRegex.exec(sql)) !== null) {
    dbFunctions.push({ function: fMatch[1].replace(/public\./, ''), migration: m.relPath });
  }

  // Indexes
  const idxRegex = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)\s+ON\s+([a-zA-Z0-9_\.]+)/gi;
  let iMatch;
  while ((iMatch = idxRegex.exec(sql)) !== null) {
    dbIndexes.push({ index: iMatch[1], table: iMatch[2].replace(/public\./, ''), migration: m.relPath });
  }
});

// Check SQL table usage in codebase
const sqlTableUsage = new Map();
dbTables.forEach((tbl, name) => {
  sqlTableUsage.set(name, []);
  fileCatalog.forEach(f => {
    if (f.category !== 'database_migration' && f.content.includes(name)) {
      sqlTableUsage.get(name).push(f.relPath);
    }
  });
});

console.log(`[Inventory] Parsed ${dbTables.size} tables, ${dbPolicies.length} policies, ${dbFunctions.length} functions, ${dbIndexes.length} indexes.`);

// Analyze Unused Code Candidates
const unusedCandidates = [];
fileCatalog.forEach(f => {
  // Ignore docs, migrations, tests, configs, workflows, scripts, assets
  if ([
    'doc',
    'database_migration',
    'frontend_test',
    'backend_test',
    'workflow',
    'script',
    'frontend_config',
    'frontend_i18n_locale',
    'asset',
  ].includes(f.category)) {
    return;
  }

  // Entrypoints that are never directly imported
  if ([
    'frontend/src/main.tsx',
    'frontend/src/App.tsx',
    'frontend/src/setupTests.ts',
    'frontend/src/index.css',
    'frontend/src/App.css',
  ].includes(f.relPath)) {
    return;
  }

  const reverseDeps = Array.from(reverseImportGraph.get(f.relPath) || []);
  // Check string references across whole repo (dynamic imports, routes, etc.)
  const baseName = path.basename(f.relPath, path.extname(f.relPath));
  let stringRefs = 0;
  fileCatalog.forEach(other => {
    if (other.relPath !== f.relPath && other.content.includes(baseName)) {
      stringRefs++;
    }
  });

  if (reverseDeps.length === 0 && stringRefs === 0) {
    unusedCandidates.push({
      path: f.relPath,
      category: f.category,
      lines: f.lines,
      reason: 'Zero direct imports and zero text references anywhere in repository',
    });
  }
});

console.log(`[Inventory] Identified ${unusedCandidates.length} completely unreferenced file candidates.`);

// Write Machine-Readable JSON
const outDir = path.join(ROOT_DIR, 'artifacts');
fs.mkdirSync(outDir, { recursive: true });

const reportData = {
  totalFiles: fileCatalog.length,
  totalLines: fileCatalog.reduce((sum, f) => sum + f.lines, 0),
  categories: {},
  database: {
    totalMigrations: migrationFiles.length,
    migrations: migrationFiles.map(m => m.relPath),
    totalTables: dbTables.size,
    tables: Array.from(dbTables.values()),
    totalPolicies: dbPolicies.length,
    totalFunctions: dbFunctions.length,
    totalIndexes: dbIndexes.length,
    tableUsage: Object.fromEntries(sqlTableUsage),
  },
  files: fileCatalog.map(f => ({
    path: f.relPath,
    category: f.category,
    size: f.size,
    lines: f.lines,
    directDeps: Array.from(importGraph.get(f.relPath) || []),
    reverseDeps: Array.from(reverseImportGraph.get(f.relPath) || []),
  })),
  unusedCandidates,
};

fileCatalog.forEach(f => {
  reportData.categories[f.category] = (reportData.categories[f.category] || 0) + 1;
});

fs.writeFileSync(path.join(outDir, 'repository_inventory.json'), JSON.stringify(reportData, null, 2));
console.log(`[Inventory] Generated artifacts/repository_inventory.json (${fs.statSync(path.join(outDir, 'repository_inventory.json')).size} bytes)`);
