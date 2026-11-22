// v8 playtest: title -> CONTINUE -> drive (W) -> M map -> ESC title -> street shoot.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire('/home/hatch/workspace/makefun/gta6-01/node_modules/playwright-core/package.json');
const { chromium } = require('playwright-core');
const ROOT = '/home/hatch/workspace/makefun/gta6-01-entry-v8';
const MIME = { '.html': 'text/html', '.js': 'text/javascript' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end('nf'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const browser = await chromium.launch({
  executablePath: '/home/hatch/.cache/ms-playwright/chromium-1255/chrome-linux64/chrome',
  args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
const results = [];
// 1. default load = title screen
await page.goto(`http://127.0.0.1:${port}/game/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__gameReady === true, null, { timeout: 30000 });
results.push('title visible: ' + await page.evaluate(() => getComputedStyle(document.getElementById('titleScreen')).display));
// 2. CONTINUE -> cover chase
await page.click('#btnContinue');
await page.waitForURL(/shot=cover/, { timeout: 10000 });
await page.waitForFunction(() => window.__gameReady === true, null, { timeout: 30000 });
await page.waitForTimeout(500);
results.push('after CONTINUE url: ' + page.url().split('?')[1]);
results.push('speed before W: ' + await page.evaluate(() => document.getElementById('spd').textContent));
await page.keyboard.down('w');
await page.waitForTimeout(1500);
await page.keyboard.up('w');
results.push('speed after 1.5s W: ' + await page.evaluate(() => document.getElementById('spd').textContent));
// 3. M -> map screen
await page.keyboard.press('m');
await page.waitForURL(/shot=map/, { timeout: 10000 });
await page.waitForFunction(() => window.__gameReady === true, null, { timeout: 30000 });
await page.waitForTimeout(300);
results.push('after M url: ' + page.url().split('?')[1]);
results.push('map visible: ' + await page.evaluate(() => getComputedStyle(document.getElementById('mapScreen')).display));
// 4. ESC -> title
await page.keyboard.press('Escape');
await page.waitForURL(/shot=title/, { timeout: 10000 });
await page.waitForFunction(() => window.__gameReady === true, null, { timeout: 30000 });
await page.waitForTimeout(300);
results.push('after ESC url: ' + page.url().split('?')[1]);
// 5. street: click shoots, counter advances
await page.goto(`http://127.0.0.1:${port}/game/index.html?shot=street`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__gameReady === true, null, { timeout: 30000 });
await page.waitForTimeout(800);
results.push('street obj before click: ' + await page.evaluate(() => document.getElementById('mObj').textContent));
await page.mouse.click(640, 360);
await page.waitForTimeout(500);
results.push('street obj after click: ' + await page.evaluate(() => document.getElementById('mObj').textContent));
results.push('street toast: ' + await page.evaluate(() => document.getElementById('toast').textContent));
// 6. garage
await page.goto(`http://127.0.0.1:${port}/game/index.html?shot=garage`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__gameReady === true, null, { timeout: 30000 });
results.push('garage panel visible: ' + await page.evaluate(() => getComputedStyle(document.getElementById('garagePanel')).display));
console.log(results.join('\n'));
console.log('ERRORS: ' + (errors.length ? errors.join(' | ') : 'none'));
await browser.close();
server.close();
process.exit(errors.length ? 1 : 0);
