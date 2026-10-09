// Screenshots of the intro (the bin game) at chosen moments after a perfect throw, stepped deterministically.
//   node dev/intro-shot.cjs <out prefix> <t1,t2,...> [--size 1280x800] [--port 8787] [--q tongue=low]
// It waits for the tongue and the paper sheet to load first (they load in the background on the real page).
const { chromium } = require('C:/Ideas/Shapeshot/node_modules/playwright-core');
const args = process.argv.slice(2);
const [prefix, times = '0'] = args;
const opt = (k, d) => { const i = args.indexOf(k); return i > 0 ? args[i + 1] : d; };
(async () => {
  const [w, h] = opt('--size', '1280x800').split('x').map(Number);
  const b = await chromium.launch({ channel: 'msedge', headless: true });
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e)));
  await p.goto(`http://localhost:${opt('--port', '8787')}/?debug${opt('--q') ? '&' + opt('--q') : ''}`, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__intro, null, { timeout: 20000 });
  await p.waitForFunction(() => window.__intro.tongue && window.__intro.sheet, null, { timeout: 30000 }).catch(() => console.log('tongue/sheet not loaded in 30 s'));
  await p.evaluate(() => window.__intro.throwBall(0, 3.35, -3.35));
  let t0 = 0; const ts = times.split(',').map(Number);
  for (const t of ts) {
    await p.evaluate((s) => window.__intro.advance(s), t - t0); t0 = t;
    await p.waitForTimeout(150);
    const f = `${prefix}-${String(t).replace('.', '_')}.png`;
    await p.screenshot({ path: f }); console.log(f);
  }
  if (errors.length) console.log('PAGE ERRORS:\n' + errors.join('\n'));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
