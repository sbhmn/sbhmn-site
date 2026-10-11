// The print on the intro's paper: the live home page (intro skipped), screenshotted (headless Edge or Chromium:
// dev/browser.cjs) at the real viewport sizes of desktops and phones, each laid on an A4 sheet with white margins,
// saved as the paper's textures.
//   node dev/paper-shots.cjs [--port 8787] [--at 0.3] [--q 82] [--only <name>] [--raw <dir>]
//
// Writes (upright, top of the page at the top of the image; the print centred on the sheet):
//   assets/img/paper-desktop.webp       A4 landscape 2400x1697: the page at 1920x960 CSS px, dpr 1.25 (2400x1200)
//   assets/img/paper-desktop-1366.webp  A4 landscape 2049x1449: the page at 1366x650 CSS px, dpr 1.5  (2049x975)
//   assets/img/paper-phone.webp         A4 portrait  1492x2110: the page at 390x844 CSS px,  dpr 2.5  (975x2110)
//   assets/img/paper-phone-360.webp     A4 portrait  1308x1850: the page at 360x740 CSS px,  dpr 2.5  (900x1850)
// and writes "prints" in assets/3d/paper.json: for each, kind (desktop | phone), url, CSS viewport, dpr, the sheet's px
// size, the print's rectangle in it, the page's content column {max, pad} and its headline (.hero h1: left, top, font
// size in CSS px). assets/intro/paper.js loads the one print nearest the visitor's viewport (one texture) and lands the
// sheet so the print's headline lies on the live headline (same place, same type size), or failing that on the content
// column; exact at the print's own viewport. The bake (dev/models/paper.py) keeps "prints" when it rewrites the file.
//
// WHICH MOMENT: the print is the page at stage clock --at seconds (default 0.3: the scenes under way), saved as each
// print's "clock". When the intro hands over, the page goes in under the landed paper with its 3D stepped to that
// clock and held there (sbhmn:handoff, assets/home/stage.js hold()) while the paper fades off it, so the paper fades
// over the very same picture; then the page comes alive (sbhmn:reveal). Here requestAnimationFrame is held from the
// first script on, so nothing runs in real time, then window.__stage.advance(at) steps the scenes deterministically
// from 0 (the same pixels every run). CSS animations are frozen at their start (the "live" badges' pulse: on the page
// it starts from there once the paper is gone). Pass --raw <dir> to also keep the plain viewport PNGs.
// Re-run it whenever the home page changes. Needs the local server (python -m http.server 8787 --directory <site>).
const fs = require('fs');
const path = require('path');
const { launch, dep } = require('./browser.cjs');
const sharp = dep('sharp');

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const port = opt('--port', '8787');
const at = +opt('--at', '0.3');
const quality = +opt('--q', '82');
const only = opt('--only', null);
const raw = opt('--raw', null);
const root = path.resolve(__dirname, '..');
const A4 = Math.SQRT2; // long side / short side

const shots = [
  { name: 'paper-desktop', kind: 'desktop', width: 1920, height: 960, dpr: 1.25 },
  { name: 'paper-desktop-1366', kind: 'desktop', width: 1366, height: 650, dpr: 1.5 },
  { name: 'paper-phone', kind: 'phone', width: 390, height: 844, dpr: 2.5 },
  { name: 'paper-phone-360', kind: 'phone', width: 360, height: 740, dpr: 2.5 },
];

(async () => {
  const browser = await launch();
  const prints = [];
  for (const s of shots) {
    if (only && s.name !== only) continue;
    const mobile = s.kind === 'phone';
    const ctx = await browser.newContext({
      viewport: { width: s.width, height: s.height }, deviceScaleFactor: s.dpr, isMobile: mobile, hasTouch: mobile,
    });
    await ctx.addInitScript(() => {
      // Nothing runs in real time: the stage only moves when advance() steps it.
      window.requestAnimationFrame = () => 0;
      try { sessionStorage.setItem('sbhmn-intro', 'done'); } catch (e) {}
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(`http://localhost:${port}/?debug`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.evaluate(() => Promise.all([...document.images].map((i) => (i.decode ? i.decode().catch(() => {}) : 0))));
    // every game's 3D view registered (its still picture hidden), or 10 s: whatever is there gets printed
    await page.waitForFunction(() => [...document.querySelectorAll('.stage[data-scene]')].every((e) => e.classList.contains('live')), null, { timeout: 10000 }).catch(() => console.log('  (not every stage went live in 10 s)'));
    await page.waitForTimeout(300);
    const clock = await page.evaluate((t) => {
      const st = window.__stage;
      if (!st) return null;
      st.advance(t);
      return st.clock;
    }, at);
    // where the print is pinned to the live page: the headline (its box and type size) and the content column
    const layout = await page.evaluate(() => {
      const el = document.querySelector('main .wrap') || document.querySelector('.wrap');
      let column = null;
      if (el) {
        const cs = getComputedStyle(el), pad = parseFloat(cs.paddingLeft) || 0, mw = parseFloat(cs.maxWidth);
        const max = Number.isFinite(mw) ? (cs.boxSizing === 'border-box' ? mw - pad - (parseFloat(cs.paddingRight) || 0) : mw) : null;
        if (max) column = { max, pad };
      }
      const h = document.querySelector('.hero h1');
      let anchor = null;
      if (h) {
        const r = h.getBoundingClientRect();
        anchor = { selector: '.hero h1', left: +r.left.toFixed(2), top: +r.top.toFixed(2), font: parseFloat(getComputedStyle(h).fontSize) };
      }
      return { column, anchor };
    });
    await page.waitForTimeout(100);
    const png = await page.screenshot({ type: 'png', animations: 'disabled' });
    if (raw) { fs.mkdirSync(raw, { recursive: true }); fs.writeFileSync(path.join(raw, `${s.name}.png`), png); }
    const pw = Math.round(s.width * s.dpr), ph = Math.round(s.height * s.dpr);
    // The A4 sheet around the print: landscape for a desktop, portrait for a phone; the print fills the sheet's long
    // side or its short side, whichever it hits first.
    let sw, sh;
    if (s.kind === 'desktop') { sw = pw; sh = Math.round(pw / A4); if (sh < ph) { sh = ph; sw = Math.round(ph * A4); } }
    else { sh = ph; sw = Math.round(ph / A4); if (sw < pw) { sw = pw; sh = Math.round(pw * A4); } }
    const x = Math.floor((sw - pw) / 2), y = Math.floor((sh - ph) / 2);
    const out = path.join(root, 'assets', 'img', `${s.name}.webp`);
    const info = await sharp({ create: { width: sw, height: sh, channels: 3, background: '#ffffff' } })
      .composite([{ input: png, left: x, top: y }])
      .webp({ quality, effort: 6 })
      .toFile(out);
    prints.push({
      kind: s.kind, url: `/assets/img/${s.name}.webp`, css: [s.width, s.height], dpr: s.dpr,
      size: [sw, sh], rect: [x, y, pw, ph], clock: clock == null ? null : +clock.toFixed(3), ...layout,
    });
    console.log(`${out}  ${sw}x${sh}, print ${pw}x${ph} at ${x},${y}  ${(info.size / 1024).toFixed(0)} KB  `
      + (clock == null ? '(no window.__stage: the 3D was not stepped)' : `stage clock ${clock.toFixed(2)} s`)
      + (layout.anchor ? `  headline ${layout.anchor.font}px at ${layout.anchor.left},${layout.anchor.top}` : '  (no headline)'));
    if (errors.length) console.log('  page errors:\n  ' + errors.join('\n  '));
    await ctx.close();
  }
  await browser.close();
  // Write paper.json's "prints" (replacing the same urls, keeping any others).
  const jp = path.join(root, 'assets', '3d', 'paper.json');
  let json = {};
  try { json = JSON.parse(fs.readFileSync(jp, 'utf8')); } catch (e) {}
  const kept = (Array.isArray(json.prints) ? json.prints : []).filter((p) => !prints.some((q) => q.url === p.url));
  json.prints = [...kept, ...prints].sort((a, b) => (a.kind === b.kind ? b.css[0] - a.css[0] : a.kind < b.kind ? -1 : 1));
  delete json.print; // (the old single desktop / phone block)
  fs.writeFileSync(jp, JSON.stringify(json, null, 1));
  console.log(`${jp}  prints: ${json.prints.map((p) => `${p.kind} ${p.css.join('x')}`).join(', ')}`);
})().catch((e) => { console.error(e); process.exit(1); });
