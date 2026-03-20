import puppeteer from 'C:/Users/nateh/AppData/Local/Temp/puppeteer-test/node_modules/puppeteer/lib/esm/puppeteer/puppeteer.js';

const browser = await puppeteer.launch({ executablePath: 'C:/Users/nateh/.cache/puppeteer/chrome/win64-136.0.7103.92/chrome-win64/chrome.exe' });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 500));

// Crop to navbar
const clip = { x: 0, y: 0, width: 1440, height: 80 };
await page.screenshot({ path: 'temporary screenshots/navbar-crop.png', clip });

// Crop to hero
const heroClip = { x: 0, y: 0, width: 1440, height: 500 };
await page.screenshot({ path: 'temporary screenshots/hero-crop.png', clip: heroClip });

// Crop to footer
const footerHeight = await page.evaluate(() => document.body.scrollHeight);
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await new Promise(r => setTimeout(r, 300));
const footerClip = { x: 0, y: 900 - 80, width: 1440, height: 500 };
// just scroll to bottom
const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
await page.screenshot({ path: 'temporary screenshots/footer-crop.png', clip: { x: 0, y: scrollHeight - 400, width: 1440, height: 400 } });

await browser.close();
console.log('Done');
