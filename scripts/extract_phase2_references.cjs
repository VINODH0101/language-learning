/**
 * Lexilume — Phase 2 Deep Dependency & Reference Extractor
 * 
 * Inspects all 799 files to extract:
 * 1. Environment variables (import.meta.env, process.env, os.environ, os.getenv, secrets)
 * 2. External API URLs, endpoints, and fetch/http call sites
 * 3. Storage keys (localStorage, sessionStorage, Dexie tables, IndexedDB)
 * 4. Routes and navigation patterns
 * 5. Dynamic runtime references (import(), React.lazy, window, document, addEventListener)
 * 6. Package usage mapping (declared vs imported packages)
 * 7. Database table references across TypeScript, Python, and SQL
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const IGNORED_DIRS = new Set(['node_modules', '.git', '.pytest_cache', 'dist', '.system_generated', '.gemini']);

function getAllFiles(dir, list = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED_DIRS.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) getAllFiles(full, list);
    else list.push(full);
  }
  return list;
}

const allFiles = getAllFiles(ROOT_DIR);
console.log('Total files to scan:', allFiles.length);

const results = {
  envVars: new Map(), // varName -> [{ file, line, raw }]
  externalUrls: new Map(), // url/domain -> [{ file, line, raw }]
  storageKeys: new Map(), // key -> [{ file, line, raw, type }]
  dynamicRefs: {
    dynamicImports: [],
    reactLazy: [],
    windowDocRefs: [],
    eventListeners: [],
    fetchCalls: [],
    httpCalls: [],
  },
  routes: [],
  packageUsage: {
    frontend: new Map(), // pkg -> [{ file, line }]
    python: new Map(),   // pkg -> [{ file, line }]
  },
  dbTableRefs: new Map(), // tableName -> [{ file, line, context }]
};

// Known database tables from Phase 1
const KNOWN_TABLES = [
  'licenses_and_sources', 'user_profiles', 'language_tracks', 'curriculum_nodes',
  'vocabulary_items', 'grammar_rules', 'exercise_templates', 'curated_materials',
  'daily_lessons', 'lesson_exercises', 'user_vocabulary_history', 'email_deliveries',
  'retention_cleanup_logs', 'lesson_assignments', 'saved_translations', 'user_roles',
  'admin_audit_logs', 'user_courses', 'cultural_bookmarks', 'user_learning_tracks',
  'srs_items', 'exercise_attempts', 'daily_published_content', 'learning_activity_events',
  'content_review_items', 'admin_background_jobs'
];

KNOWN_TABLES.forEach(t => results.dbTableRefs.set(t, []));

// Read package.json & requirements.txt
const pkgJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'frontend/package.json'), 'utf8'));
const frontendPkgs = Object.keys({ ...pkgJson.dependencies, ...pkgJson.devDependencies });
frontendPkgs.forEach(p => results.packageUsage.frontend.set(p, []));

const reqTxt = fs.readFileSync(path.join(ROOT_DIR, 'requirements.txt'), 'utf8');
const pythonPkgs = reqTxt.split('\n')
  .map(l => l.trim().split(/[=>~<]/)[0].trim())
  .filter(p => p && !p.startsWith('#'));
pythonPkgs.forEach(p => results.packageUsage.python.set(p, []));

// Regex patterns
const ENV_PATTERNS = [
  /import\.meta\.env\.([A-Z0-9_]+)/g,
  /process\.env\.([A-Z0-9_]+)/g,
  /os\.environ\.get\(['"]([A-Z0-9_]+)['"]/g,
  /os\.environ\[['"]([A-Z0-9_]+)['"]\]/g,
  /os\.getenv\(['"]([A-Z0-9_]+)['"]/g,
  /\$\{\{\s*secrets\.([A-Z0-9_]+)\s*\}\}/g,
];

const URL_PATTERN = /https?:\/\/[a-zA-Z0-9\.\-_\/:]+/g;
const STORAGE_PATTERNS = [
  /localStorage\.(getItem|setItem|removeItem)\(['"]([^'"]+)['"]/g,
  /sessionStorage\.(getItem|setItem|removeItem)\(['"]([^'"]+)['"]/g,
  /localDb\.([a-zA-Z0-9_]+)\./g,
];

allFiles.forEach(file => {
  const relPath = path.relative(ROOT_DIR, file).replace(/\\/g, '/');
  const ext = path.extname(file).toLowerCase();
  if (!/\.(ts|tsx|js|jsx|py|sql|json|md|yml|yaml|html|css)$/.test(ext)) return;
  if (relPath.includes('artifacts/')) return; // skip generated artifacts

  let content = '';
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch { return; }

  const lines = content.split('\n');

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;

    // 1. Env vars
    ENV_PATTERNS.forEach(pat => {
      pat.lastIndex = 0;
      let m;
      while ((m = pat.exec(lineText)) !== null) {
        const v = m[1];
        if (!results.envVars.has(v)) results.envVars.set(v, []);
        results.envVars.get(v).push({ file: relPath, line: lineNum, raw: lineText.trim() });
      }
    });

    // 2. URLs
    URL_PATTERN.lastIndex = 0;
    let urlMatch;
    while ((urlMatch = URL_PATTERN.exec(lineText)) !== null) {
      const u = urlMatch[0];
      if (!u.includes('localhost') && !u.includes('github.com/polyglot') && !u.includes('w3.org') && !u.includes('schema.org')) {
        const domain = u.split('/')[2];
        if (!results.externalUrls.has(domain)) results.externalUrls.set(domain, []);
        results.externalUrls.get(domain).push({ file: relPath, line: lineNum, url: u, raw: lineText.trim() });
      }
    }

    // 3. Storage
    STORAGE_PATTERNS.forEach((spat, sIdx) => {
      spat.lastIndex = 0;
      let sm;
      while ((sm = spat.exec(lineText)) !== null) {
        if (sIdx === 0 || sIdx === 1) {
          const key = sm[2];
          if (!results.storageKeys.has(key)) results.storageKeys.set(key, []);
          results.storageKeys.get(key).push({ file: relPath, line: lineNum, type: sIdx === 0 ? 'localStorage' : 'sessionStorage', raw: lineText.trim() });
        } else if (sIdx === 2) {
          const table = sm[1];
          const k = `dexie:${table}`;
          if (!results.storageKeys.has(k)) results.storageKeys.set(k, []);
          results.storageKeys.get(k).push({ file: relPath, line: lineNum, type: 'dexie', raw: lineText.trim() });
        }
      }
    });

    // 4. Dynamic refs
    if (lineText.includes('import(')) {
      results.dynamicRefs.dynamicImports.push({ file: relPath, line: lineNum, raw: lineText.trim() });
    }
    if (lineText.includes('React.lazy(') || lineText.includes('lazy(')) {
      results.dynamicRefs.reactLazy.push({ file: relPath, line: lineNum, raw: lineText.trim() });
    }
    if (lineText.includes('addEventListener(') || lineText.includes('removeEventListener(')) {
      results.dynamicRefs.eventListeners.push({ file: relPath, line: lineNum, raw: lineText.trim() });
    }
    if (lineText.includes('fetch(')) {
      results.dynamicRefs.fetchCalls.push({ file: relPath, line: lineNum, raw: lineText.trim() });
    }
    if (lineText.includes('httpx.') || lineText.includes('requests.')) {
      results.dynamicRefs.httpCalls.push({ file: relPath, line: lineNum, raw: lineText.trim() });
    }

    // 5. Package imports
    frontendPkgs.forEach(pkg => {
      const fromMatch = lineText.match(new RegExp(`from\\s+['"](${pkg}(?:\\/.*)?)['"]`)) ||
                        lineText.match(new RegExp(`import\\s+['"](${pkg}(?:\\/.*)?)['"]`));
      if (fromMatch) {
        results.packageUsage.frontend.get(pkg).push({ file: relPath, line: lineNum, imported: fromMatch[1] });
      }
    });

    pythonPkgs.forEach(pkg => {
      const pyName = pkg.replace(/-/g, '_');
      const pyMatch = lineText.match(new RegExp(`(?:from|import)\\s+(${pyName})(\\s+|\\.)`));
      if (pyMatch) {
        results.packageUsage.python.get(pkg).push({ file: relPath, line: lineNum, imported: pyMatch[1] });
      }
    });

    // 6. Database tables
    KNOWN_TABLES.forEach(tbl => {
      if (lineText.includes(tbl)) {
        results.dbTableRefs.get(tbl).push({ file: relPath, line: lineNum, raw: lineText.trim() });
      }
    });
  });
});

// Serialize results
const reportOut = {
  envVars: Object.fromEntries(results.envVars),
  externalUrls: Object.fromEntries(results.externalUrls),
  storageKeys: Object.fromEntries(results.storageKeys),
  dynamicRefs: results.dynamicRefs,
  packageUsage: {
    frontend: Object.fromEntries(results.packageUsage.frontend),
    python: Object.fromEntries(results.packageUsage.python),
  },
  dbTableRefs: Object.fromEntries(results.dbTableRefs),
};

fs.writeFileSync(path.join(ROOT_DIR, 'artifacts/phase2_reference_extraction.json'), JSON.stringify(reportOut, null, 2));
console.log('Successfully wrote artifacts/phase2_reference_extraction.json');
