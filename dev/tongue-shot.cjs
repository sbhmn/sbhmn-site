// Screenshots of the tongue lab (dev/lab-tongue.html) at chosen moments, stepped deterministically (headless Edge).
//   node dev/tongue-shot.cjs <out prefix> <t1,t2,...> [--view both|throw|front|side|three] [--size 1600x800]
//        [--sheet cols] [--cell 480] [--port 8787] [--q "speed=1&mirror&spread=0.76&fps=20&fxscene"]
// Times are seconds after the lick starts. --sheet: one contact sheet <prefix>-sheet.png instead of one PNG a moment.
const { chromium } = require('C:/Ideas/Shapeshot/node_modules/playwright-core');
const fs = require('fs');
const args = process.argv.slice(2);
const [prefix, times = '0'] = args;
const opt = (k, d) => { const i = args.indexOf(k); return i > 0 ? args[i + 1] : d; };
(async () => {
  const [w, h] = opt('--size', '1600x800').split('x').map(Number);
  const at = 0.1;
  const url = `http://localhost:${opt('--port', '8787')}/dev/lab-tongue.html?shot&at=${at}&view=${opt('--view', 'both')}${opt('--q') ? '&' + opt('--q') : ''}`;
  const b = await chromium.launch({ channel: 'msedge', headless: true, args: ['--use-angle=d3d11', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })).newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e)));
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__ready, null, { timeout: 20000 });
  const ts = times.split(',').map((t) => +t + at);
  if (args.includes('--sheet')) {
    const data = await p.evaluate(([ts, cols, cell]) => window.__stage.sheet(ts, cols, cell), [ts, +opt('--sheet', 4), +opt('--cell', 480)]);
    const f = `${prefix}-sheet.png`;
    fs.writeFileSync(f, Buffer.from(data.split(',')[1], 'base64'));
    console.log(f);
  } else {
    let t0 = 0;
    for (const t of ts) {
      await p.evaluate((s) => window.__stage.advance(s), t - t0); t0 = t;
      const f = `${prefix}-${(t - at).toFixed(2).replace('.', '_')}.png`;
      await p.screenshot({ path: f }); console.log(f);
    }
  }
  console.log('cues:', (await p.evaluate(() => window.__stage.cues)).join(' | '));
  if (errors.length) console.log('PAGE ERRORS:\n' + errors.join('\n'));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
