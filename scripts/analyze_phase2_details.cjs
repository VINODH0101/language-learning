const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

function walk(dir) {
  let res = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      res.push(...walk(p));
    } else if (p.endsWith('.ts') || p.endsWith('.tsx') || p.endsWith('.py')) {
      const content = fs.readFileSync(p, 'utf8');
      const relPath = path.relative(repoRoot, p).replace(/\\/g, '/');
      
      // Match .from('...')
      const fromRegex = /\.from\(\s*['"]([^'"]+)['"]\s*\)/g;
      let match;
      while ((match = fromRegex.exec(content)) !== null) {
        const line = content.substring(0, match.index).split('\n').length;
        res.push({ file: relPath, line, table: match[1], type: 'from' });
      }

      // Match _rest_request('...')
      const restRegex = /_rest_request\(\s*['"]([^'"]+)['"]/g;
      while ((match = restRegex.exec(content)) !== null) {
        const line = content.substring(0, match.index).split('\n').length;
        res.push({ file: relPath, line, table: match[1], type: 'rest' });
      }

      // Match .rpc('...')
      const rpcRegex = /\.rpc\(\s*['"]([^'"]+)['"]/g;
      while ((match = rpcRegex.exec(content)) !== null) {
        const line = content.substring(0, match.index).split('\n').length;
        res.push({ file: relPath, line, rpc: match[1], type: 'rpc' });
      }
    }
  }
  return res;
}

const frontendCalls = walk(path.join(repoRoot, 'frontend', 'src'));
const engineCalls = walk(path.join(repoRoot, 'engine'));
const scriptCalls = walk(path.join(repoRoot, 'scripts'));

console.log('--- Database Operations Found (Multi-line aware) ---');
const allCalls = [...frontendCalls, ...engineCalls, ...scriptCalls];
const tableMap = {};
allCalls.forEach(c => {
  const target = c.table || `rpc:${c.rpc}`;
  tableMap[target] = tableMap[target] || [];
  tableMap[target].push(`${c.file}:${c.line}`);
});

for (const [t, refs] of Object.entries(tableMap).sort()) {
  console.log(`${t} (${refs.length} calls):`);
  refs.forEach(r => console.log(`   - ${r}`));
}
