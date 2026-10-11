// Screenshots of the wiper lab (dev/lab-wiper.html) at chosen moments, stepped deterministically.
//   node dev/wiper-shot.cjs "<query, e.g. view=wipe>" <out prefix> <t1,t2,...> [--size 1280x800] [--port 8787] [--dpr 1]
// Times are seconds of lab time ("&shot" is added for you). For view=model with &yaw just pass 0.
const { chromium } = require('C:/Ideas/Shapeshot/node_modules/playwright-core');
const args = process.argv.slice(2);
const [query, prefix, times = '0'] = args;
const opt = (k, d) => { const i = args.indexOf(k); return i > 0 ? args[i + 1] : d; };
(async () => {
  const [w, h] = opt('--size', '1280x800').split('x').map(Number);
  const b = await chromium.launch({ channel: 'msedge', headless: true, args: ['--use-angle=d3d11', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: +opt('--dpr', '1') })).newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e)));
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  await p.addInitScript(() => { if (location.pathname.startsWith('/dev/')) window.requestAnimationFrame = () => 0; });
  await p.goto(`http://localhost:${opt('--port', '8787')}/dev/lab-wiper.html?${query}&shot`, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__ready, null, { timeout: 60000 }).catch(() => {});
  if (!(await p.evaluate(() => !!window.__ready))) { console.log('NOT READY\n' + errors.join('\n')); await b.close(); process.exit(1); }
  let t0 = 0;
  for (const t of times.split(',').map(Number)) {
    await p.evaluate((s) => window.__lab.advance(s), t - t0);
    t0 = t;
    const f = `${prefix}-${String(t).replace('.', '_')}.png`;
    await p.screenshot({ path: f });
    console.log(f);
  }
  if (errors.length) console.log('PAGE ERRORS:\n' + errors.join('\n'));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
