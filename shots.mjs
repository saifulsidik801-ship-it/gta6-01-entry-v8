// Render the 4 v8 screenshots: genuine fresh browser renders of game.js.
// Serves the repo over localhost, opens ?shot=X&still=1 at 1280x720, waits for
// window.__gameReady, captures JPEG, checks size + cover luminance, logs errors.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire('/home/hatch/workspace/makefun/gta6-01/node_modules/playwright-core/package.json');
const { chromium } = require('playwright-core');

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SHOTS = ['cover', 'street', 'map', 'title'];
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.md': 'text/markdown' };

const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html');
  if (req.url === '/favicon.ico') { res.writeHead(204); res.end(); return; }
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

fs.mkdirSync(path.join(ROOT, 'screenshots'), { recursive: true });
let failed = false;
for (const [i, shot] of SHOTS.entries()) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(`http://127.0.0.1:${port}/game/index.html?shot=${shot}&still=1`, { waitUntil: 'load', timeout: 60000 });
  try {
    await page.waitForFunction(() => window.__gameReady === true, null, { timeout: 30000 });
  } catch (e) {
    console.log(`[${shot}] GAME NEVER READY:`, errors.join(' | '));
    failed = true; await page.close(); continue;
  }
  await page.waitForTimeout(1500);
  if (shot === 'street') { // stage the shooting moment: one click fires the tracer
    await page.mouse.click(640, 360);
    await page.waitForTimeout(400);
  }
  const lum = await page.evaluate(() => {
    const src = document.querySelector('canvas.webgl');
    const c = document.createElement('canvas'); c.width = 160; c.height = 90;
    const g = c.getContext('2d'); g.drawImage(src, 0, 0, 160, 90);
    const d = g.getImageData(0, 0, 160, 90).data;
    let sum = 0; for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    return (sum / (d.length / 4) / 255).toFixed(3);
  });
  const out = path.join(ROOT, 'screenshots', `${i + 1}-${shot}.jpg`);
  await page.screenshot({ path: out, type: 'jpeg', quality: 80 });
  const size = fs.statSync(out).size;
  console.log(`[${shot}] ${path.basename(out)} ${size} bytes (${(size / 1024).toFixed(1)} KiB) luminance=${lum} errors=${errors.length ? errors.join(' | ') : 'none'}`);
  if (size > 256 * 1024) { console.log(`[${shot}] OVER 256 KiB`); failed = true; }
  if (errors.length) failed = true;
  await page.close();
}
await browser.close();
server.close();
console.log(failed ? 'SHOTS: FAILED' : 'SHOTS: OK');
process.exit(failed ? 1 : 0);
