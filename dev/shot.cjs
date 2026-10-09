// Screenshots of a lab scene at chosen moments, stepped deterministically (headless Edge via playwright-core).
//   node dev/shot.cjs "<lab url with &shot>" <out prefix> <t1,t2,...> [--size 1280x800] [--pointer x,y] [--click x,y] [--dpr 1]
// Times are seconds of scene time; --pointer / --click are CSS px in the window (pointer is set before the first shot).
// The local server: python -m http.server 8787 --directory C:\Ideas\sbhmn-site  (or .claude/launch.json "sbhmn-site").
const { chromium } = require('C:/Ideas/Shapeshot/node_modules/playwright-core');
const args = process.argv.slice(2);
const [url, prefix, times = '0'] = args;
const opt = (k, d) => { const i = args.indexOf(k); return i > 0 ? args[i + 1] : d; };
(async () => {
  const [w, h] = opt('--size', '1280x800').split('x').map(Number);
  const b = await chromium.launch({ channel: 'msedge', headless: true, args: ['--use-angle=d3d11', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: +opt('--dpr', '1') })).newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e)));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__ready, null, { timeout: 20000 });
  await p.evaluate(() => window.__ready);
  const ptr = opt('--pointer'); const clk = opt('--click');
  if (ptr) { const [x, y] = ptr.split(',').map(Number); await p.mouse.move(x, y); }
  let t0 = 0;
  for (const t of times.split(',').map(Number)) {
    if (clk && t0 === 0) { const [x, y] = clk.split(',').map(Number); await p.mouse.click(x, y); }
    await p.evaluate((s) => window.__stage.advance(s), t - t0);
    t0 = t;
    await p.screenshot({ path: `${prefix}-${String(t).replace('.', '_')}.png` });
    console.log(`${prefix}-${String(t).replace('.', '_')}.png`);
  }
  if (errors.length) console.log('PAGE ERRORS:\n' + errors.join('\n'));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
