// The site's display font as a three.js typeface (for the extruded 3D names): woff2 -> glyph outlines -> typeface JSON
// (the facetype.js format FontLoader reads). Needs `wawoff2` and `opentype.js` (npm i --no-save, or FONT_TOOLS=<folder
// with them>/package.json).
//   node dev/make-typeface.mjs assets/fonts/big-shoulders-display-800.woff2 assets/fonts/big-shoulders-800.typeface.json
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(process.env.FONT_TOOLS ?? import.meta.url);
const wawoff2 = require('wawoff2');
const opentype = require('opentype.js');

const [src, out] = process.argv.slice(2);
const ttf = await wawoff2.decompress(readFileSync(src));
const font = opentype.parse(ttf.buffer.slice(ttf.byteOffset, ttf.byteOffset + ttf.byteLength));
const scale = (1000 * 100) / ((font.unitsPerEm || 2048) * 72);
const r = (v) => Math.round(v * scale);
const chars = " ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:;!?'\"-–—&/()$%+*#@·→";
const glyphs = {};
for (const ch of chars) {
  const g = font.charToGlyph(ch);
  if (!g || g.index === 0) continue;
  let o = '';
  for (const c of g.path.commands) {
    // FontLoader reads the end point first, then the control points.
    if (c.type === 'M') o += `m ${r(c.x)} ${r(c.y)} `;
    else if (c.type === 'L') o += `l ${r(c.x)} ${r(c.y)} `;
    else if (c.type === 'Q') o += `q ${r(c.x)} ${r(c.y)} ${r(c.x1)} ${r(c.y1)} `;
    else if (c.type === 'C') o += `b ${r(c.x)} ${r(c.y)} ${r(c.x1)} ${r(c.y1)} ${r(c.x2)} ${r(c.y2)} `;
  }
  const bb = g.getBoundingBox();
  glyphs[ch] = { ha: r(g.advanceWidth), x_min: r(bb.x1), x_max: r(bb.x2), o: o.trim() };
}
const json = {
  glyphs,
  familyName: font.names.fontFamily?.en ?? 'Big Shoulders Display',
  ascender: r(font.ascender), descender: r(font.descender),
  underlinePosition: r(font.tables.post.underlinePosition), underlineThickness: r(font.tables.post.underlineThickness),
  boundingBox: { xMin: r(font.tables.head.xMin), yMin: r(font.tables.head.yMin), xMax: r(font.tables.head.xMax), yMax: r(font.tables.head.yMax) },
  resolution: 1000, cssFontWeight: 'bold', cssFontStyle: 'normal',
  original_font_information: { format: 0, copyright: font.names.copyright?.en ?? '', license: 'SIL Open Font License 1.1' },
};
writeFileSync(out, JSON.stringify(json));
console.log(`${Object.keys(glyphs).length} glyphs -> ${out} (${(JSON.stringify(json).length / 1024).toFixed(0)} KB)`);
