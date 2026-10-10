// Extruded 3D names in the site's display font (Big Shoulders Display 800, assets/fonts/big-shoulders-800.typeface.json,
// made by dev/make-typeface.mjs). Low curve segments on purpose: the letters stay low poly, like everything else here.
import * as THREE from 'three';
import { FontLoader } from '/assets/vendor/three/addons/loaders/FontLoader.js';
import { TextGeometry } from '/assets/vendor/three/addons/geometries/TextGeometry.js';
import { v } from '/assets/v.js';

let fontP = null;
export const loadFont = () => (fontP ??= new FontLoader().loadAsync(v('/assets/fonts/big-shoulders-800.typeface.json')));

/**
 * A centred text mesh. `size` is the cap height-ish in world units; `depth` the extrusion.
 * Returns a Mesh whose geometry is centred on the origin (x and y), front face toward +z.
 */
export async function text3d(str, { size = 0.5, depth = 0.14, bevel = 0.014, curveSegments = 2, material, letterSpacing = 0 } = {}) {
  const font = await loadFont();
  let geo;
  if (!letterSpacing) {
    geo = new TextGeometry(str, { font, size, depth, curveSegments, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.7, bevelSegments: 1 });
  } else {
    // per-letter geometry, spaced by hand (TextGeometry has no tracking)
    const parts = []; let x = 0;
    for (const ch of str) {
      const g = new TextGeometry(ch, { font, size, depth, curveSegments, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.7, bevelSegments: 1 });
      g.translate(x, 0, 0); parts.push(g);
      const glyph = font.data.glyphs[ch] ?? font.data.glyphs['?'];
      x += (glyph.ha / font.data.resolution) * size + letterSpacing * size;
    }
    const { mergeGeometries } = await import('/assets/vendor/three/addons/utils/BufferGeometryUtils.js');
    geo = mergeGeometries(parts.map((g) => g.toNonIndexed()));
  }
  geo.computeBoundingBox();
  geo.center();
  geo.computeVertexNormals();
  const mat = material ?? new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.7, metalness: 0, flatShading: true });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = `text:${str}`;
  return mesh;
}
