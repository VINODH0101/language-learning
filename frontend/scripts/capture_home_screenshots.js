import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:4173';
const ROOT_DIR = process.cwd().endsWith('frontend') ? path.resolve('..') : process.cwd();

const DOCS_DIR = path.join(ROOT_DIR, 'docs', 'ui', 'screenshots');
const FRONTEND_SCREENSHOTS = path.join(ROOT_DIR, 'frontend', 'screenshots');

for (const dir of [DOCS_DIR, FRONTEND_SCREENSHOTS]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('=== Lexilume Home Page Redesign Screenshot Capture ===');
  console.log(`Connecting to Chrome at: ${CHROME_PATH}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--disable-animations',
    ],
  });

  const page = await browser.newPage();

  // Set local storage flags to avoid onboarding modals blocking screen
  await page.goto(`${BASE_URL}/?dismiss_modals=true`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.setItem('lexilume_onboarding_completed', 'true');
    localStorage.setItem('polyglot_onboarding_completed', 'true');
    localStorage.setItem('polyglot_interface_lang', 'en');
  });

  // Navigate to Home / Dashboard
  await page.goto(`${BASE_URL}/?tab=dashboard`, { waitUntil: 'networkidle0' });
  await sleep(1500);

  const viewports = [
    { name: 'desktop', width: 1440, height: 1000, isMobile: false },
    { name: 'tablet', width: 768, height: 1024, isMobile: false },
    { name: 'mobile', width: 390, height: 844, isMobile: true },
  ];

  for (const vp of viewports) {
    console.log(`Capturing Home page in ${vp.name} (${vp.width}x${vp.height})...`);
    await page.setViewport({
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      isMobile: vp.isMobile,
    });
    await sleep(800);

    const filename = `01-home-dashboard-${vp.name}.png`;
    const target1 = path.join(DOCS_DIR, filename);
    const target2 = path.join(FRONTEND_SCREENSHOTS, filename);

    await page.screenshot({
      path: target1,
      fullPage: true,
    });
    fs.copyFileSync(target1, target2);
    console.log(`✓ Saved ${filename} (${fs.statSync(target1).size} bytes)`);
  }

  await browser.close();
  console.log('=== Capture complete ===');
}

run().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
