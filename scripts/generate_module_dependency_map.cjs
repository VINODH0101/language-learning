const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

function getFiles(dir, exts) {
  let res = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (f !== 'node_modules' && f !== '.git' && f !== 'dist' && f !== '__pycache__') {
        res.push(...getFiles(p, exts));
      }
    } else if (exts.some(ext => p.endsWith(ext))) {
      res.push(p);
    }
  }
  return res;
}

const tsFiles = getFiles(path.join(repoRoot, 'frontend', 'src'), ['.ts', '.tsx']);
const pyFiles = getFiles(path.join(repoRoot, 'engine'), ['.py']).concat(getFiles(path.join(repoRoot, 'scripts'), ['.py']));

console.log(`Found ${tsFiles.length} TS/TSX files and ${pyFiles.length} Python files.`);

// Analyze dependencies
const graph = {};
const reverseGraph = {};

tsFiles.forEach(file => {
  const rel = path.relative(repoRoot, file).replace(/\\/g, '/');
  graph[rel] = [];
  reverseGraph[rel] = reverseGraph[rel] || [];
});

tsFiles.forEach(file => {
  const rel = path.relative(repoRoot, file).replace(/\\/g, '/');
  const content = fs.readFileSync(file, 'utf8');
  const importRegex = /(?:import|from)\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = importRegex.exec(content)) !== null) {
    const imp = m[1];
    if (imp.startsWith('.')) {
      const resolved = path.resolve(path.dirname(file), imp);
      // Try extensions
      let matchedRel = null;
      for (const ext of ['', '.ts', '.tsx', '/index.ts', '/index.tsx']) {
        const candidate = resolved + ext;
        const cRel = path.relative(repoRoot, candidate).replace(/\\/g, '/');
        if (graph[cRel]) {
          matchedRel = cRel;
          break;
        }
      }
      if (matchedRel) {
        graph[rel].push(matchedRel);
        reverseGraph[matchedRel] = reverseGraph[matchedRel] || [];
        reverseGraph[matchedRel].push(rel);
      }
    }
  }
});

// Calculate reachability from entry points
const entryPoints = ['frontend/src/main.tsx', 'frontend/src/App.tsx', 'frontend/src/routes.ts'];
const reachable = new Set();
const queue = [...entryPoints];
queue.forEach(e => reachable.add(e));

while (queue.length > 0) {
  const curr = queue.shift();
  const deps = graph[curr] || [];
  deps.forEach(d => {
    if (!reachable.has(d)) {
      reachable.add(d);
      queue.push(d);
    }
  });
}

console.log(`Total reachable frontend modules from entry points: ${reachable.size} / ${tsFiles.length}`);

// Find modules only imported by tests
const testOnly = [];
const unreachableNonTest = [];

for (const rel of Object.keys(graph)) {
  if (rel.includes('__tests__') || rel.endsWith('.test.ts') || rel.endsWith('.test.tsx')) continue;
  if (!reachable.has(rel)) {
    const importers = reverseGraph[rel] || [];
    const onlyTests = importers.length > 0 && importers.every(i => i.includes('.test.') || i.includes('__tests__'));
    if (onlyTests) testOnly.push(rel);
    else unreachableNonTest.push(rel);
  }
}

console.log(`Test-only modules: ${testOnly.length}`);
console.log(`Unreachable non-test modules: ${unreachableNonTest.length}`);
testOnly.forEach(t => console.log('  [test-only]: ' + t));
unreachableNonTest.forEach(u => console.log('  [unreachable]: ' + u));
