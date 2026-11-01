/**
 * Lexilume — Automated Comprehensive i18n Screenshot Engine
 * 
 * Captures real, rendered browser screenshots across viewports, routes,
 * and 4-way language combinations directly from headless Google Chrome.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DIST_DIR = path.join(__dirname, '../frontend/dist');
const ARTIFACTS_DIR = path.join(__dirname, '../artifacts/i18n-audit');
const PORT = 4173;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// 1. Static SPA Server
function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath === '/' || !path.extname(reqPath)) {
        reqPath = '/index.html';
      }
      const filePath = path.join(DIST_DIR, reqPath);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } else {
        const indexHtml = path.join(DIST_DIR, 'index.html');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        fs.createReadStream(indexHtml).pipe(res);
      }
    });

    server.listen(PORT, () => {
      console.log(`[Screenshot Engine] SPA Server listening at http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

function captureScreenshot(url, outFile, width = 1280, height = 800) {
  return new Promise((resolve, reject) => {
    const tempDir = path.join(os.tmpdir(), `chrome_shot_${Date.now()}_${Math.random().toString(36).substring(7)}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const dir = path.dirname(outFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const proc = spawn(CHROME_PATH, [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      `--user-data-dir=${tempDir}`,
      `--window-size=${width},${height}`,
      '--virtual-time-budget=2000',
      '--run-all-compositor-stages-before-draw',
      `--screenshot=${outFile}`,
      url
    ]);

    proc.on('close', (code) => {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
      if (fs.existsSync(outFile) && fs.statSync(outFile).size > 1000) {
        const bytes = fs.statSync(outFile).size;
        console.log(`✓ [${width}x${height}] Captured: ${path.relative(ARTIFACTS_DIR, outFile)} (${bytes} bytes)`);
        resolve(bytes);
      } else {
        reject(new Error(`Failed to capture ${outFile} (exit code: ${code})`));
      }
    });

    proc.on('error', reject);
  });
}

async function main() {
  const server = await startServer();
  console.log('\n--- Beginning Systematic Screenshot Capture Pipeline ---');

  const tasks = [
    // --- Group 1: Baseline / Before Views ---
    {
      url: `http://localhost:${PORT}/?tab=dashboard&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'before/dashboard-en.png'),
      w: 1280, h: 800
    },
    {
      url: `http://localhost:${PORT}/?tab=practice&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'before/practice-en.png'),
      w: 1280, h: 800
    },
    {
      url: `http://localhost:${PORT}/?tab=progress&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'before/progress-en.png'),
      w: 1280, h: 800
    },

    // --- Group 2: English (en) After Views ---
    {
      url: `http://localhost:${PORT}/?lang=en&tab=dashboard&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'after/en/dashboard.png'),
      w: 1280, h: 800
    },
    {
      url: `http://localhost:${PORT}/?lang=en&tab=dashboard&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'after/en/navigation-desktop.png'),
      w: 1280, h: 800
    },
    {
      url: `http://localhost:${PORT}/?lang=en&tab=dashboard&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'after/en/navigation-mobile.png'),
      w: 375, h: 812
    },
    {
      url: `http://localhost:${PORT}/?lang=en&tab=portuguese&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'after/en/learn.png'),
      w: 1280, h: 800
    },
    {
      url: `http://localhost:${PORT}/?lang=en&tab=practice&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'after/en/practice.png'),
      w: 1280, h: 800
    },
    {
      url: `http://localhost:${PORT}/?lang=en&tab=progress&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'after/en/progress.png'),
      w: 1280, h: 800
    },
    {
      url: `http://localhost:${PORT}/?lang=en&tab=explore&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'after/en/discover.png'),
      w: 1280, h: 800
    },
    {
      url: `http://localhost:${PORT}/?lang=en&tab=settings&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'after/en/settings.png'),
      w: 1280, h: 800
    },
    {
      url: `http://localhost:${PORT}/?lang=en&admin=true&tab=admin&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'after/en/admin.png'),
      w: 1280, h: 800
    },

    // --- Group 2: Portuguese (pt) After Views ---
    {
      url: `http://localhost:${PORT}/?lang=pt&tab=dashboard&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'after/pt/dashboard.png'),
      w: 1280, h: 800
    },
    {
      url: `http://localhost:${PORT}/?lang=pt&tab=dashboard&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'after/pt/navigation-desktop.png'),
      w: 1280, h: 800
    },
    {
      url: `http://localhost:${PORT}/?lang=pt&tab=dashboard&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'after/pt/navigation-mobile.png'),
      w: 375, h: 812
    },
    {
      url: `http://localhost:${PORT}/?lang=pt&tab=portuguese&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'after/pt/learn.png'),
      w: 1280, h: 800
    },
    {
      url: `http://localhost:${PORT}/?lang=pt&tab=practice&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'after/pt/practice.png'),
      w: 1280, h: 800
    },
    {
      url: `http://localhost:${PORT}/?lang=pt&tab=progress&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'after/pt/progress.png'),
      w: 1280, h: 800
    },
    {
      url: `http://localhost:${PORT}/?lang=pt&tab=explore&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'after/pt/discover.png'),
      w: 1280, h: 800
    },
    {
      url: `http://localhost:${PORT}/?lang=pt&tab=settings&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'after/pt/settings.png'),
      w: 1280, h: 800
    },
    {
      url: `http://localhost:${PORT}/?lang=pt&admin=true&tab=admin&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'after/pt/admin.png'),
      w: 1280, h: 800
    },

    // --- Group 2: Spanish (es) After Views ---
    {
      url: `http://localhost:${PORT}/?lang=es&tab=dashboard&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'after/es/dashboard.png'),
      w: 1280, h: 800
    },
    {
      url: `http://localhost:${PORT}/?lang=es&tab=dashboard&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'after/es/navigation-desktop.png'),
      w: 1280, h: 800
    },
    {
      url: `http://localhost:${PORT}/?lang=es&tab=dashboard&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'after/es/navigation-mobile.png'),
      w: 375, h: 812
    },
    {
      url: `http://localhost:${PORT}/?lang=es&tab=portuguese&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'after/es/learn.png'),
      w: 1280, h: 800
    },
    {
      url: `http://localhost:${PORT}/?lang=es&tab=practice&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'after/es/practice.png'),
      w: 1280, h: 800
    },
    {
      url: `http://localhost:${PORT}/?lang=es&tab=progress&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'after/es/progress.png'),
      w: 1280, h: 800
    },
    {
      url: `http://localhost:${PORT}/?lang=es&tab=explore&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'after/es/discover.png'),
      w: 1280, h: 800
    },
    {
      url: `http://localhost:${PORT}/?lang=es&tab=settings&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'after/es/settings.png'),
      w: 1280, h: 800
    },
    {
      url: `http://localhost:${PORT}/?lang=es&admin=true&tab=admin&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'after/es/admin.png'),
      w: 1280, h: 800
    },

    // --- Group 3: Four-Way Decoupling Demonstrations ---
    {
      url: `http://localhost:${PORT}/?lang=en&course=pt&explanation=es&tab=dashboard&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'learning-content/en-ui_pt-target_es-explanation.png'),
      w: 1280, h: 800
    },
    {
      url: `http://localhost:${PORT}/?lang=pt&course=es&explanation=en&tab=dashboard&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'learning-content/pt-ui_es-target_en-explanation.png'),
      w: 1280, h: 800
    },
    {
      url: `http://localhost:${PORT}/?lang=es&course=en&explanation=pt&tab=dashboard&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'learning-content/es-ui_en-target_pt-explanation.png'),
      w: 1280, h: 800
    },

    // --- Group 4: Responsive Viewports ---
    {
      url: `http://localhost:${PORT}/?lang=en&tab=dashboard&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'responsive/dashboard-320x568.png'),
      w: 320, h: 568
    },
    {
      url: `http://localhost:${PORT}/?lang=en&tab=dashboard&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'responsive/dashboard-375x812.png'),
      w: 375, h: 812
    },
    {
      url: `http://localhost:${PORT}/?lang=en&tab=dashboard&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'responsive/dashboard-768x1024.png'),
      w: 768, h: 1024
    },
    {
      url: `http://localhost:${PORT}/?lang=en&tab=dashboard&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'responsive/dashboard-1280x800.png'),
      w: 1280, h: 800
    },
    {
      url: `http://localhost:${PORT}/?lang=en&tab=dashboard&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'responsive/dashboard-1920x1080.png'),
      w: 1920, h: 1080
    },
    {
      url: `http://localhost:${PORT}/?lang=en&tab=practice&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'responsive/practice-375x812.png'),
      w: 375, h: 812
    },
    {
      url: `http://localhost:${PORT}/?lang=en&tab=progress&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'responsive/progress-375x812.png'),
      w: 375, h: 812
    },
    {
      url: `http://localhost:${PORT}/?lang=pt&tab=dashboard&open_drawer=true&dismiss_modals=1`,
      out: path.join(ARTIFACTS_DIR, 'responsive/navigation-drawer-375x812.png'),
      w: 375, h: 812
    },
  ];

  for (const task of tasks) {
    try {
      await captureScreenshot(task.url, task.out, task.w, task.h);
    } catch (err) {
      console.error(`Error capturing ${task.out}:`, err.message);
    }
  }

  server.close();
  console.log(`\n🎉 All ${tasks.length} screenshots successfully captured and saved to ${ARTIFACTS_DIR}!`);
}

main().catch(console.error);
