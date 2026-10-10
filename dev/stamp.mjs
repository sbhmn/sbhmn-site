// Cache-busting stamps. Every file the site serves from /assets gets a fingerprint of its content in its URL
// (?v=<hash>), so a changed file has a new address and every browser fetches it at once, while unchanged files stay
// cached (Cloudflare tells browsers to keep them for hours). Run it after changing anything under /assets, before
// committing (it only rewrites what changed; running it twice changes nothing):
//   node dev/stamp.mjs            write the stamps
//   node dev/stamp.mjs --check    write nothing; list what is stale and exit 1 if anything is
// What it writes:
//   - url(...) in assets/**/*.css: the fonts and images a stylesheet uses get their stamps
//   - in every page (*.html, not under dev/): href and src pointing at /assets/... or /favicon.png get their stamps
//   - in every page with an import map: "three" and every file under /assets mapped to itself with its stamp. Scripts
//     load through it (static imports, import(), relative ones too), and assets/v.js reads it for the files scripts
//     fetch themselves (models, prints, sounds)
// The stamp: the first 10 hex digits of the file's SHA-256 (a stylesheet's taken after its own urls are stamped).
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const THREE = '/assets/vendor/three/three.module.min.js';

const walk = (dir, skip = () => false) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  if (n.startsWith('.') || skip(p)) return [];
  return statSync(p).isDirectory() ? walk(p, skip) : [p];
});
const url = (p) => '/' + relative(ROOT, p).split(sep).join('/');
const hashOf = (p) => createHash('sha256').update(readFileSync(p)).digest('hex').slice(0, 10);
const strip = (u) => u.replace(/\?v=[0-9a-f]+$/, '');

const stale = [];
function put(p, text) {
  if (readFileSync(p, 'utf8') === text) return;
  stale.push(relative(ROOT, p));
  if (!CHECK) writeFileSync(p, text);
}

// 1. stylesheets first (their stamps depend on what they point at)
const assets = walk(join(ROOT, 'assets'));
for (const css of assets.filter((p) => p.endsWith('.css'))) {
  const text = readFileSync(css, 'utf8').replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q, u) => {
    if (/^(data:|https?:|#)/.test(u)) return m;
    const file = u.startsWith('/') ? join(ROOT, strip(u)) : join(dirname(css), strip(u));
    if (!existsSync(file)) { console.warn(`${relative(ROOT, css)}: ${u} not found`); return m; }
    return `url(${q}${strip(u)}?v=${hashOf(file)}${q})`;
  });
  put(css, text);
}

// 2. every asset's stamp, as it now is
const stamp = new Map();
for (const p of [...assets, join(ROOT, 'favicon.png')]) if (existsSync(p)) stamp.set(url(p), hashOf(p));
const stamped = (u) => (stamp.has(strip(u)) ? `${strip(u)}?v=${stamp.get(strip(u))}` : null);

// 3. the pages
const pages = walk(ROOT, (p) => /[\\/](dev|node_modules)$/.test(p)).filter((p) => p.endsWith('.html'));
for (const page of pages) {
  let text = readFileSync(page, 'utf8').replace(/\b(href|src)="(\/(?:assets\/[^"#]+|favicon\.png))"/g, (m, attr, u) => {
    const s = stamped(u);
    if (!s) { console.warn(`${relative(ROOT, page)}: ${u} not found`); return m; }
    return `${attr}="${s}"`;
  });
  text = text.replace(/<script type="importmap">[\s\S]*?<\/script>/, (m) => {
    const old = JSON.parse(m.replace(/^<script type="importmap">|<\/script>$/g, '')).imports ?? {};
    const map = {};
    for (const [k, u] of Object.entries(old)) if (!k.startsWith('/assets/')) map[k] = stamped(u) ?? u;   // bare names ("three")
    map.three ??= stamped(THREE);
    for (const u of [...stamp.keys()].filter((k) => k.startsWith('/assets/')).sort()) map[u] = stamped(u);
    const lines = Object.entries(map).map(([k, u]) => `  ${JSON.stringify(k)}: ${JSON.stringify(u)}`);
    return `<script type="importmap">\n{ "imports": {\n${lines.join(',\n')}\n} }\n</script>`;
  });
  put(page, text);
}

if (CHECK) {
  if (stale.length) { console.log(`stale stamps in: ${stale.join(', ')}  (run: node dev/stamp.mjs)`); process.exit(1); }
  console.log(`stamps up to date (${stamp.size} files)`);
} else console.log(stale.length ? `stamped: ${stale.join(', ')}` : `stamps up to date (${stamp.size} files)`);
