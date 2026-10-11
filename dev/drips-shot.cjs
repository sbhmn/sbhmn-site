// Screenshots of the drips lab (dev/lab-drips.html) at chosen moments, stepped deterministically, plus a contact sheet
// (headless Edge or Chromium: dev/browser.cjs).
//   node dev/drips-shot.cjs <out prefix> <t1,t2,...> [--bg white|home|live|image|intro] [--seed 7] [--n 10] [--src 0]
//        [--at 9.42]   (bg intro) the intro's time when the spray starts;  [--from x,y]  where the spit comes from
//        [--fade 2.5] [--fadems 1400]   start drips.fadeOut at 2.5 s;  [--float 0]  the 8-bit fallback;  [--rm 1]
//        [--one 100]  a single head-on splat of that size;  [--gpu 1]  timings include the GPU (readPixels sync)
//        [--size 1280x800] [--dpr 1] [--port 8787] [--clip x,y,w,h] [--sheet]
// Times are seconds after the spray. --clip crops every shot (CSS px); --sheet also writes <prefix>-sheet.png, all the
// shots side by side with their times. Needs the local server (python -m http.server 8787 --directory <site>).
const { launch, dep } = require('./browser.cjs');
const sharp = dep('sharp');
const args = process.argv.slice(2);
const [prefix, times = '0'] = args;
const opt = (k, d) => { const i = args.indexOf(k); return i > 0 ? args[i + 1] : d; };
(async () => {
  const [w, h] = opt('--size', '1280x800').split('x').map(Number);
  const dpr = +opt('--dpr', '1');
  const q = new URLSearchParams({ bg: opt('--bg', 'white'), seed: opt('--seed', '7'), n: opt('--n', '10') });
  for (const k of ['src', 'fade', 'fadems', 'float', 'at', 'from', 'rm', 'one', 'gpu']) if (opt('--' + k)) q.set(k, opt('--' + k));
  const url = `http://localhost:${opt('--port', '8787')}/dev/lab-drips.html?${q}&shot`;
  const b = await launch();
  const p = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr })).newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(String(e)));
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
  await p.goto(url, { waitUntil: 'networkidle' });
  await p.waitForFunction(() => window.__stage || document.querySelector('pre'), null, { timeout: 90000 });
  const clipArg = opt('--clip');
  const clip = clipArg ? (([x, y, cw, ch]) => ({ x, y, width: cw, height: ch }))(clipArg.split(',').map(Number)) : undefined;
  const files = [];
  let t0 = 0;
  for (const t of times.split(',').map(Number)) {
    await p.evaluate((s) => window.__stage.advance(s), t - t0);
    t0 = t;
    const f = `${prefix}-${String(t).replace('.', '_')}.png`;
    await p.screenshot({ path: f, clip });
    files.push([t, f]);
    console.log(f);
  }
  if (args.includes('--sheet')) {
    const meta = await sharp(files[0][1]).metadata();
    const cols = Math.min(3, files.length), rows = Math.ceil(files.length / cols);
    const tw = Math.round(Math.min(meta.width, 900)), th = Math.round(meta.height * tw / meta.width), pad = 26;
    const tiles = await Promise.all(files.map(async ([t, f], i) => {
      const img = await sharp(f).resize(tw, th).toBuffer();
      const label = Buffer.from(`<svg width="${tw}" height="${pad}"><rect width="100%" height="100%" fill="#222"/><text x="8" y="18" font-family="Segoe UI, sans-serif" font-size="15" fill="#fff">t = ${t} s</text></svg>`);
      return [{ input: label, left: (i % cols) * tw, top: Math.floor(i / cols) * (th + pad) }, { input: img, left: (i % cols) * tw, top: Math.floor(i / cols) * (th + pad) + pad }];
    }));
    await sharp({ create: { width: cols * tw, height: rows * (th + pad), channels: 3, background: '#888' } })
      .composite(tiles.flat()).png().toFile(`${prefix}-sheet.png`);
    console.log(`${prefix}-sheet.png`);
  }
  console.log('update() ms per 1/60 step:', JSON.stringify(await p.evaluate(() => window.__perf && window.__perf())));
  if (errors.length) console.log('PAGE ERRORS:\n' + errors.join('\n'));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
