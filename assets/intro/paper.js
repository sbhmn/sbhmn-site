// The intro's paper: a real A4 sheet with the home page printed on it, crumpled into a ball. The monster spits it at
// you, it smashes onto the screen and unfolds there, stop motion, flap after flap, into a flat sheet right where the
// live page will be.
//
//   import { createPaper, createPaperBall } from '/assets/intro/paper.js';
//
//   // the throw (small: assets/3d/paper-ball.glb 31 KB + one print 64-156 KB, both cached for the spit):
//   const ball = await createPaperBall();        // object3d: the crumpled ball, radius 0.07, centred on its origin
//   scene.add(ball.object3d);                    // place / spin it like any object (it is dry: no spit yet)
//
//   // the spit (assets/3d/paper.glb 333 KB: start loading at the intro's start, it is needed only at the end):
//   const paper = await createPaper();           // object3d starts hidden; spit() and land() show it
//   scene.add(paper.object3d);                   // the scene root, or any parent: world placement is handled
//   each frame of your loop, before rendering:   paper.update(dt);       // dt in seconds
//   await paper.spit({ camera, from: mouth, onFrame });   // resolves on the first flat frame, the sheet on the screen
//   then put the page in under the sheet (at once: the sheet covers it), drawn as printed (its 3D at print.clock),
//   and fade only the canvas off it (assets/intro.js, the end of spit()).
//
// WHAT spit() DOES (stop motion at 12 fps: the poses, the flight and the nudges change only on its frames):
//   the ball leaves `from` (a world point: the monster's mouth, (0, 0.84, 0.42)) and flies at the camera as a ball,
//   tumbling, its size on screen growing at a steady rate, along a slight arc; it SMASHES onto the screen (the glass:
//   one frame squashed flat against it; onFrame's slap), spreads on it into a folded-up wad and unfolds there, stuck to
//   the glass, flap after flap, one after another, quickly and unevenly (each swings open from behind in one to three
//   frames; the bake folded the page up behind the glass flap by flap and crushed it into the ball: this is that,
//   backwards), and lies flat, pressed onto the glass. It leaves the mouth wet (darker soaked splotches with a tide
//   line, glossier, where the ball's outside was) and dries as it opens. At the end its shading goes from lit paper
//   (never quite the page's white, so it reads on white; an ink edge where it turns edge-on) to the plain print: the
//   last frame is the page's own pixels. The shading is smooth across each panel, sharp only along real creases.
//   Timing (paper.json "sequences", [pose, frames] at 12 fps): 'short' (default) and 'full' (the intro's).
//
// WHERE IT LANDS: one print is loaded, the one nearest the window (paper.json "prints": the page at 1920x960 and
// 1366x650 for desktops, 390x844 and 360x740 for phones; whole windows, a desktop scrollbar's gutter included). At
// landing the print's headline is put on the live headline (`anchor`, measured live: the page is laid out under the
// intro), same place and same type size; without one, its content column on the live column. If the sheet would leave a
// gap at an edge it grows until it covers. Exact at a print's own viewport; elsewhere the headline matches and the rest
// is within some px (the page is fluid). It stays registered to the camera after landing (camera shake, resize).
//
// createPaper(opts) / createPaperBall(opts), opts (all optional):
//   portrait     boolean  default innerWidth < innerHeight: the sheet stands up (turned 90 degrees) with a phone
//                         print; otherwise landscape with a desktop print
//   radius       0.07     the ball's radius in your units (the intro's BALL_R); the flat sheet is then 0.59 x 0.42
//   seed         7        the jitter, tumble and wet splotches (same seed + same update(dt) steps = same frames)
//   castShadow   true
//   anisotropy   4        for the print
//   viewport     () => [innerWidth, innerHeight]   the canvas's CSS size (the landing fits it). Pass the canvas's own
//                         box: on a desktop with a classic scrollbar a fixed, inset 0 canvas stops at the scrollbar's
//                         gutter, ~15 px short of innerWidth
//   screen       () => [innerWidth, innerHeight]   the window's size (picks the print, as the prints are windows)
//   anchor       '.hero h1'   (createPaper) the live headline: a selector, an element or a function returning one
//   edge         0.5      (createPaper) the ink edge's strength
//   base         '/assets/3d/'   where paper.json, paper.glb and paper-ball.glb live
//
// createPaper -> paper:
//   object3d               the paper (a Group). spit() places it (position, quaternion); scale = radius / ballRadius.
//   spit({ camera, from, sequence = 'short', spin = 1, onFrame }) -> Promise   from: a THREE.Vector3 (world).
//                          spin: how much it tumbles out of the mouth (0 = none). onFrame({ step, pose, name, landed,
//                          slap }) on every stop-motion frame; slap is true on the frame it hits the glass (a thud, a
//                          camera shake); landed: on the glass from then on. Calling spit() again restarts it.
//   update(dt)             steps the show; while landed, keeps the sheet on the screen. Call every frame, always.
//   land(camera)           show the flat sheet on the screen at once (e.g. on skip, or to check the registration)
//   setPose(k, { wet })    a pose by hand: 0 = the ball ... T-1 = 'settle'; -1 = the flat sheet (base mesh).
//                          Sets the shading for that pose too; wet 0..1 (default: as it was). Don't mix with spit().
//   bounds(k)              a pose's bounds (THREE.Box3, sheet units)
//   poses                  the pose names; info: paper.json; print: the chosen print; landed: on the screen
//   dispose()              geometry, materials, the print
// createPaperBall -> { object3d, dispose() }
//
// THE ASSETS (dev/models/paper.py bakes them; dev/paper-shots.cjs prints the page; dev/lab-paper.html shows them):
//   paper.glb: one mesh "paper": the FLAT A4 sheet (0.297 x 0.21, landscape, centred, print facing +z, uv (0,0)
//   bottom-left), ~1950 vertices, ~3700 triangles; morph targets = the poses (positions only; applied here on the
//   CPU, one at a time, with the normals); attribute _wet (how much of the ball's outside each point was). Pose 0, the
//   flying ball, is centred on the origin (no tumble baked in); from the impact pose on, the poses lie in the flat
//   sheet's own place (the glass is the plane z = paper.json "glass" in front of it). paper-ball.glb: pose 0 alone,
//   only its visible outer layers (quantized; the node scale restores it).
//   paper.json: names, fps, sequences {short, full}, landingPose (the impact), impact {pose, centre}, glass, unlit[k]
//   (0 lit paper .. 1 the plain print), core {radius, poses, centres}, ballRadius, creases (the crease web: vertex
//   pairs), prints [{kind, url, css, dpr, size, rect, column, anchor}].
// Budget: two draws of ~3.7k triangles (front and back share one geometry, every triangle's corners its own: ~11k
// vertices) + an 80-triangle core while it is a ball, plus their shadow pass; one print texture (desktop 2400x1697 or
// 2049x1449, phone 1492x2110 or 1308x1850) and a 128 px wet mask. Per frame: a few matrix ops (and one
// getBoundingClientRect while landed); per pose change (at most 12 a second) ~1 ms setting the points and normals.
import * as THREE from 'three';
import { GLTFLoader } from '/assets/vendor/three/addons/loaders/GLTFLoader.js';
import { v } from '/assets/v.js';

const W = 0.297, H = 0.21; // A4 landscape, paper units
const TAU = Math.PI * 2;

// --- loading, shared by the ball and the paper
const cache = new Map();
function once(key, make) { if (!cache.has(key)) cache.set(key, make()); return cache.get(key); }
const loadInfo = (base) => once(`info:${base}`, () => fetch(v(`${base}paper.json`)).then((r) => { if (!r.ok) throw new Error('paper.json'); return r.json(); }));
const loadGltf = (url) => once(`glb:${url}`, () => new GLTFLoader().loadAsync(v(url)));

// The prints (dev/paper-shots.cjs): the page at a few real viewports, each on its A4 sheet. One is loaded: of the right
// kind (phone when portrait), whose sheet covers the viewport at the page's own scale, the widest no wider than the
// viewport (else the narrowest): the closest layout.
function printsOf(info) {
  if (Array.isArray(info.prints) && info.prints.length) return info.prints;
  const old = info.print ?? {}; // an older paper.json
  return ['desktop', 'phone'].map((kind) => {
    const p = old[kind];
    if (p && typeof p === 'object') return { kind, ...p };
    return { kind, url: typeof p === 'string' ? p : `/assets/img/paper-${kind}.webp`, css: kind === 'phone' ? [390, 552] : [1414, 1000], size: [1, 1], rect: [0, 0, 1, 1] };
  });
}
function choosePrint(info, portrait, [vw, vh]) {
  const all = printsOf(info);
  const list = all.filter((p) => p.kind === (portrait ? 'phone' : 'desktop'));
  if (!list.length) return all[0];
  const covers = (p) => {
    const [sx, sy] = p.size, [, ry, rw, rh] = p.rect;
    return p.css[0] * (sx / rw) >= vw - 0.5 && p.css[1] * ((sy - ry) / rh) >= vh - 0.5;
  };
  const pool = list.some(covers) ? list.filter(covers) : list;
  const under = pool.filter((p) => p.css[0] <= vw).sort((a, b) => b.css[0] - a.css[0]);
  return under[0] ?? [...pool].sort((a, b) => a.css[0] - b.css[0])[0];
}
function loadPrint(P, portrait, anisotropy) {
  return once(`tex:${P.url}:${portrait}`, () => new THREE.TextureLoader().loadAsync(v(P.url)).then((t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = anisotropy;
    // the sheet is turned +90 degrees on a portrait screen: turn the portrait print back so it reads upright
    if (portrait) { t.center.set(0.5, 0.5); t.rotation = -Math.PI / 2; }
    return t;
  }));
}

function mulberry(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// The damp patches' fine shape: soft blobs on a small canvas (the bake's _wet says where the spit touched).
function wetMask(seed) {
  const n = 128, c = document.createElement('canvas');
  c.width = c.height = n;
  const g = c.getContext('2d'), r = mulberry(seed * 7 + 3);
  g.fillStyle = '#000'; g.fillRect(0, 0, n, n);
  g.globalCompositeOperation = 'lighter';
  // a dozen splotches, each a cluster of overlapping soft ellipses (irregular, like soaked-in spit)
  for (let i = 0; i < 13; i++) {
    const cx = r() * n, cy = r() * n, size = n * (0.05 + 0.09 * r());
    for (let j = 0, m = 2 + Math.floor(r() * 4); j < m; j++) {
      const x = cx + (r() - 0.5) * size * 1.6, y = cy + (r() - 0.5) * size * 1.6, rad = size * (0.45 + 0.7 * r()), a = 0.3 + 0.35 * r();
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.55, `rgba(255,255,255,${a * 0.6})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rad, rad * (0.55 + 0.45 * r()), r() * Math.PI, 0, TAU); g.fill();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// Paper: lit, flat shaded, but never quite the page's white (a soft knee keeps lit facets just under it, so the sheet
// reads on white), darker where a facet turns edge-on (an ink edge that follows the silhouette and the folds), wet
// splotches darker and glossier. uLift = 1: the plain print, unlit: the page's own pixels.
function paperMaterial(U, { map = null, color = 0xffffff, side = THREE.FrontSide, flat = false } = {}) {
  const m = new THREE.MeshStandardMaterial({ map, color, side, roughness: 0.88, metalness: 0, flatShading: flat });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float _wet;\nvarying float vPWet;\nvarying vec2 vPUv;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvPWet = _wet;\nvPUv = uv;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
uniform float uLift, uRim, uWet; uniform sampler2D uWetMap;
varying float vPWet; varying vec2 vPUv;`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
vec3 paperFlat = diffuseColor.rgb;
// damp patches: where the ball's outside was (vPWet), broken up by the blobs; they shrink as uWet dries
float pwf = vPWet * (0.15 + 1.0 * texture2D(uWetMap, vPUv * vec2(1.41, 1.0)).r);
float pth = mix(1.05, 0.5, uWet);
float pwet = smoothstep(pth, pth + 0.05, pwf) * step(0.001, uWet);
float pring = (smoothstep(pth - 0.015, pth + 0.01, pwf) - smoothstep(pth + 0.01, pth + 0.05, pwf)) * step(0.001, uWet);
roughnessFactor = mix(roughnessFactor, 0.32, pwet);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
float pface = abs(dot(normal, normalize(vViewPosition)));
diffuseColor.rgb *= 1.0 - uRim * (1.0 - smoothstep(0.06, 0.5, pface));`)
      .replace('#include <opaque_fragment>', `#include <opaque_fragment>
vec3 pover = max(gl_FragColor.rgb - 0.52, 0.0);
gl_FragColor.rgb = min(gl_FragColor.rgb, vec3(0.52)) + 0.33 * (1.0 - exp(-pover / 0.33));
// wet: soaked darker (after the knee, so it shows on lit facets too) with a darker tide line at the edge; the low
// roughness above gives the soaked facets the sun's sheen
gl_FragColor.rgb *= (1.0 - 0.3 * pwet) * (1.0 - 0.2 * pring);
gl_FragColor.rgb = mix(gl_FragColor.rgb, paperFlat, uLift);`);
  };
  m.customProgramCacheKey = () => (flat ? 'sbhmn-paper-flat' : 'sbhmn-paper');
  return m;
}

// The sheet as drawn: every triangle's corners its own (a non-indexed copy of the mesh), so a corner's normal can be
// its own: smooth across each panel, sharp only along a real crease. Recomputed for each pose on the CPU (stop motion:
// at most 12 times a second; ~1 ms): each corner takes the area-weighted normals of the triangles round its point,
// walking round from its own until an edge that is a crease: an edge of the crease web (opts.creases, vertex pairs)
// bent more than WEB_SHARP, or any edge bent more than ANY_SHARP (the crumple's own creases). (Flat shaded, every
// triangle of the mesh showed as a facet: the sheet read as a mosaic, seams everywhere.)
const WEB_SHARP = Math.cos(THREE.MathUtils.degToRad(7)), ANY_SHARP = Math.cos(THREE.MathUtils.degToRad(28));
function cornerMesh(src, creases = []) {
  const F = src.index.array, nF = F.length / 3, C = nF * 3, nV = src.attributes.position.count;
  const key = (a, b) => (a < b ? a * nV + b : b * nV + a);
  const webKeys = new Set();
  for (let i = 0; i + 1 < creases.length; i += 2) webKeys.add(key(creases[i], creases[i + 1]));
  // edges: the faces either side (-1: none) and whether it is on the web
  const ids = new Map(), f0 = [], f1 = [], web = [], faceEdge = new Int32Array(C);
  for (let f = 0; f < nF; f++) {
    for (let j = 0; j < 3; j++) {
      const k = key(F[f * 3 + j], F[f * 3 + ((j + 1) % 3)]);
      let e = ids.get(k);
      if (e === undefined) { e = f0.length; ids.set(k, e); f0.push(f); f1.push(-1); web.push(webKeys.has(k)); } else f1[e] = f;
      faceEdge[f * 3 + j] = e;
    }
  }
  const nE = f0.length;
  // each corner's fans: the faces round its point, walking either way from its own (edge crossed, face reached)
  const fans = [[], []], offs = [new Int32Array(C + 1), new Int32Array(C + 1)], closed = new Uint8Array(C);
  for (let c = 0; c < C; c++) {
    const f = (c / 3) | 0, j = c % 3, v = F[c];
    for (let dir = 0; dir < 2; dir++) {
      offs[dir][c] = fans[dir].length;
      let cf = f, e = faceEdge[f * 3 + (dir ? (j + 2) % 3 : j)];
      for (let guard = 0; guard < 40; guard++) {
        const g = f0[e] === cf ? f1[e] : f0[e];
        if (g < 0) break;
        if (g === f) { if (!dir) closed[c] = 1; break; }
        fans[dir].push(e, g);
        const gj = F[g * 3] === v ? 0 : F[g * 3 + 1] === v ? 1 : 2;
        const a = faceEdge[g * 3 + gj], b = faceEdge[g * 3 + ((gj + 2) % 3)];
        e = a === e ? b : a; cf = g;
      }
    }
  }
  for (let dir = 0; dir < 2; dir++) { offs[dir][C] = fans[dir].length; fans[dir] = Int32Array.from(fans[dir]); }
  const geometry = new THREE.BufferGeometry();
  const pos = new THREE.BufferAttribute(new Float32Array(C * 3), 3).setUsage(THREE.DynamicDrawUsage);
  const nrm = new THREE.BufferAttribute(new Float32Array(C * 3), 3).setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('position', pos); geometry.setAttribute('normal', nrm);
  for (const name of ['uv', '_wet']) {
    const a = src.attributes[name];
    if (!a) continue;
    const out = new Float32Array(C * a.itemSize);
    for (let c = 0; c < C; c++) for (let k = 0; k < a.itemSize; k++) out[c * a.itemSize + k] = a.getComponent(F[c], k);
    geometry.setAttribute(name, new THREE.BufferAttribute(out, a.itemSize));
  }
  const fn = new Float32Array(nF * 3), fu = new Float32Array(nF * 3), sharp = new Uint8Array(nE);
  // pose the sheet: P = the points (Float32Array, 3 per point of the source mesh)
  function set(P) {
    const pa = pos.array, na = nrm.array;
    for (let c = 0; c < C; c++) { const v = F[c] * 3; pa[c * 3] = P[v]; pa[c * 3 + 1] = P[v + 1]; pa[c * 3 + 2] = P[v + 2]; }
    for (let f = 0; f < nF; f++) {
      const a = F[f * 3] * 3, b = F[f * 3 + 1] * 3, d = F[f * 3 + 2] * 3;
      const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
      const wx = P[d] - P[a], wy = P[d + 1] - P[a + 1], wz = P[d + 2] - P[a + 2];
      const x = uy * wz - uz * wy, y = uz * wx - ux * wz, z = ux * wy - uy * wx, l = Math.hypot(x, y, z) || 1;
      fn[f * 3] = x; fn[f * 3 + 1] = y; fn[f * 3 + 2] = z; fu[f * 3] = x / l; fu[f * 3 + 1] = y / l; fu[f * 3 + 2] = z / l;
    }
    for (let e = 0; e < nE; e++) {
      const a = f0[e] * 3, b = f1[e] * 3;
      sharp[e] = b >= 0 && fu[a] * fu[b] + fu[a + 1] * fu[b + 1] + fu[a + 2] * fu[b + 2] < (web[e] ? WEB_SHARP : ANY_SHARP) ? 1 : 0;
    }
    for (let c = 0; c < C; c++) {
      const f = ((c / 3) | 0) * 3;
      let x = fn[f], y = fn[f + 1], z = fn[f + 2], whole = true;
      for (let dir = 0; dir < 2; dir++) {
        if (dir && whole && closed[c]) break; // walked all the way round already
        const A = fans[dir];
        for (let i = offs[dir][c]; i < offs[dir][c + 1]; i += 2) {
          if (sharp[A[i]]) { whole = false; break; }
          const g = A[i + 1] * 3;
          x += fn[g]; y += fn[g + 1]; z += fn[g + 2];
        }
      }
      const l = Math.hypot(x, y, z) || 1;
      na[c * 3] = x / l; na[c * 3 + 1] = y / l; na[c * 3 + 2] = z / l;
    }
    pos.needsUpdate = true; nrm.needsUpdate = true;
  }
  return { geometry, set };
}

// The poses' points (Float32Array, 3 per point): the base mesh plus each morph target (dequantized).
function posesOf(src) {
  const base = src.attributes.position, M = src.morphAttributes.position ?? [], n = base.count;
  const flat = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { flat[i * 3] = base.getX(i); flat[i * 3 + 1] = base.getY(i); flat[i * 3 + 2] = base.getZ(i); }
  const poses = M.map((m) => {
    const out = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { out[i * 3] = flat[i * 3] + m.getX(i); out[i * 3 + 1] = flat[i * 3 + 1] + m.getY(i); out[i * 3 + 2] = flat[i * 3 + 2] + m.getZ(i); }
    return out;
  });
  return { flat, poses };
}

function makeMeshes(geo, U, tex, castShadow) {
  const front = new THREE.Mesh(geo, paperMaterial(U, { map: tex }));
  const back = new THREE.Mesh(geo, paperMaterial(U, { color: 0xf1efea, side: THREE.BackSide }));
  for (const m of [front, back]) { m.castShadow = castShadow; m.frustumCulled = false; }
  return { front, back };
}

function uniforms(wetTex) {
  return { uLift: { value: 0 }, uRim: { value: 0.5 }, uWet: { value: 0 }, uWetMap: { value: wetTex } };
}

// ------------------------------------------------------------------------------------------------- the throw's ball
export async function createPaperBall(opts = {}) {
  const {
    portrait = innerWidth < innerHeight, radius = 0.07, castShadow = true, anisotropy = 4, base = '/assets/3d/', seed = 7,
    screen = () => [innerWidth, innerHeight],
  } = opts;
  const info = await loadInfo(base);
  const P = choosePrint(info, portrait, screen());
  const [gltf, tex] = await Promise.all([loadGltf(`${base}${info.ball?.file ?? 'paper-ball.glb'}`), loadPrint(P, portrait, anisotropy)]);
  let src = null;
  gltf.scene.traverse((o) => { if (o.isMesh && !src) src = o; });
  const mesh = cornerMesh(src.geometry); // (no crease web here: only the crumple's own creases are sharp)
  mesh.set(posesOf(src.geometry).flat);
  const geo = mesh.geometry;
  const wetTex = wetMask(seed);
  const U = uniforms(wetTex);
  const { front, back } = makeMeshes(geo, U, tex, castShadow);
  const core = makeCore(info, U, castShadow);
  const object3d = new THREE.Group();
  const turn = new THREE.Group();
  if (portrait) turn.rotation.z = Math.PI / 2;
  const dequant = new THREE.Group(); // the file's positions are quantized: its node scale restores them
  dequant.scale.copy(src.scale);
  dequant.add(front, back);
  turn.add(dequant, core);
  object3d.add(turn);
  object3d.scale.setScalar(radius / info.ballRadius);
  object3d.name = 'paperBall';
  return {
    object3d,
    dispose() { object3d.removeFromParent(); geo.dispose(); src.geometry.dispose(); front.material.dispose(); back.material.dispose(); core.geometry.dispose(); core.material.dispose(); wetTex.dispose(); },
  };
}

// A plain paper core inside the ball: where two layers of the crumple part, you see more paper, not the background.
function makeCore(info, U, castShadow) {
  const r = info.core?.radius ?? info.ballRadius * 0.72;
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), paperMaterial(U, { color: 0xe9e6df, flat: true }));
  core.castShadow = castShadow;
  return core;
}

// ------------------------------------------------------------------------------------------------- the spit
export async function createPaper(opts = {}) {
  const {
    portrait = innerWidth < innerHeight, radius = 0.07, seed = 7, castShadow = true, anisotropy = 4,
    viewport = () => [innerWidth, innerHeight], screen = () => [innerWidth, innerHeight], base = '/assets/3d/', edge = 0.5,
    anchor = '.hero h1',
  } = opts;
  const info = await loadInfo(base);
  const P = choosePrint(info, portrait, screen());
  const [gltf, tex] = await Promise.all([loadGltf(`${base}paper.glb`), loadPrint(P, portrait, anisotropy)]);
  let src = null;
  gltf.scene.traverse((o) => { if (o.isMesh && o.name === 'paper') src = o; });
  if (!src) gltf.scene.traverse((o) => { if (o.isMesh && !src) src = o; });
  const T = src.morphTargetInfluences.length;
  const names = info.names?.length === T ? info.names : Object.keys(src.morphTargetDictionary ?? {});
  const fps = info.fps ?? 12;
  const unlit = info.unlit ?? new Array(T).fill(0);
  const corePoses = info.core?.poses ?? [0];
  const coreAt = new Map(corePoses.map((k, i) => [k, info.core?.centres?.[i] ?? [0, 0, 0]]));
  const landingPose = info.landingPose ?? -1;
  const centre = info.impact?.centre ?? [0, 0, 0]; // the ball's centre where it hits the glass (sheet units)
  const glassZ = info.glass ?? 0;
  const { flat, poses } = posesOf(src.geometry);
  const mesh = cornerMesh(src.geometry, info.creases ?? []);
  const geo = mesh.geometry;

  const wetTex = wetMask(seed);
  const U = uniforms(wetTex);
  const { front, back } = makeMeshes(geo, U, tex, castShadow);
  const core = makeCore(info, U, castShadow);
  // object3d (placed by spit) > jig (the stop-motion nudges, the squash) > turn (portrait) > the meshes
  const object3d = new THREE.Group(); object3d.name = 'paper';
  const jig = new THREE.Group(), turn = new THREE.Group();
  if (portrait) turn.rotation.z = Math.PI / 2;
  turn.add(front, back, core); jig.add(turn); object3d.add(jig);
  const scale = radius / info.ballRadius;
  object3d.scale.setScalar(scale);
  object3d.visible = false;

  let pose = null;
  function setPose(k, { wet = U.uWet.value } = {}) {
    if (k !== pose) {
      mesh.set(k >= 0 && k < T ? poses[k] : flat);
      core.visible = coreAt.has(k);
      if (core.visible) core.position.fromArray(coreAt.get(k));
      pose = k;
    }
    const lift = k < 0 ? 1 : unlit[k] ?? 0;
    U.uLift.value = lift;
    U.uRim.value = edge * (1 - lift);
    U.uWet.value = lift >= 1 ? 0 : wet;
  }
  setPose(0, { wet: 0 });
  // a pose's bounds (sheet units; -1 = the flat sheet), for the lab
  function bounds(k) {
    const P = k >= 0 && k < T ? poses[k] : flat, box = new THREE.Box3(), v = new THREE.Vector3();
    for (let i = 0; i < P.length; i += 3) box.expandByPoint(v.set(P[i], P[i + 1], P[i + 2]));
    return box;
  }

  // Where the flat sheet lies when it has landed, in camera space. Registration, in viewport CSS px: the print's
  // headline on the live headline (the page is laid out under the intro: same place, same type size), or, without one,
  // the print's content column on the live column (scaled by their widths, left edges together, top aligned). Then,
  // if the sheet would leave a gap at a screen edge, it grows about that point until it covers.
  const disp = portrait ? [H, W] : [W, H]; // the sheet's width and height as seen (paper units)
  function register(vw, vh) {
    const [sx, sy] = P.size, [rx, ry, rw, rh] = P.rect, [cw, ch] = P.css;
    let k, ox, oy, ax, ay, live = null;
    const el = P.anchor && anchor ? (typeof anchor === 'string' ? document.querySelector(anchor) : typeof anchor === 'function' ? anchor() : anchor) : null;
    if (el) {
      const r = el.getBoundingClientRect(), f = parseFloat(getComputedStyle(el).fontSize);
      if (r.width > 0 && f > 0) live = { left: r.left, top: r.top, font: f };
    }
    if (live) {
      k = live.font / P.anchor.font;
      ax = live.left; ay = live.top;
      ox = ax - P.anchor.left * k; oy = ay - P.anchor.top * k;
    } else {
      const col = P.column ?? { max: Infinity, pad: 0 };
      const colAt = (w) => Math.min(w - 2 * col.pad, col.max);
      k = colAt(cw) > 0 && colAt(vw) > 0 ? colAt(vw) / colAt(cw) : vw / cw;
      ax = (vw - colAt(vw)) / 2; ay = 0;
      ox = ax - ((cw - colAt(cw)) / 2) * k; oy = 0;
    }
    // the sheet on screen (CSS px): the print's CSS px per texture px across and down
    const ux = (cw / rw) * k, uy = (ch / rh) * k;
    const L = ox - rx * ux, T = oy - ry * uy, R = L + sx * ux, B = T + sy * uy;
    let g = 1;
    if (L > 0) g = Math.max(g, ax / Math.max(1e-6, ax - L));
    if (R < vw) g = Math.max(g, (vw - ax) / Math.max(1e-6, R - ax));
    if (T > 0) g = Math.max(g, ay / Math.max(1e-6, ay - T));
    if (B < vh) g = Math.max(g, (vh - ay) / Math.max(1e-6, B - ay));
    if (g > 1) { k *= g; ox = ax + (ox - ax) * g; oy = ay + (oy - ay) * g; }
    return { k, ox, oy };
  }
  function landing(camera) {
    const [vw, vh] = viewport();
    const { k, ox, oy } = register(vw, vh);
    const [sx] = P.size, [rx, ry, rw, rh] = P.rect, [cw, ch] = P.css;
    const u = disp[0] / sx; // paper units per texture px (the sheet is A4 both ways: the same across and down)
    // the print's centre on screen (CSS px from the viewport centre, y up), and in paper units from the sheet centre
    const scrX = ox + (cw * k) / 2 - vw / 2, scrY = vh / 2 - (oy + (ch * k) / 2);
    const pcx = -disp[0] / 2 + (rx + rw / 2) * u, pcy = disp[1] / 2 - (ry + rh / 2) * u;
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    // world units per CSS px at distance d: 2 d t / vh; the print (rh * u * scale world units) spans ch * k CSS px
    const d = (rh * u * scale * vh) / (ch * k * 2 * t);
    const wpp = (2 * d * t) / vh;
    return new THREE.Vector3(scrX * wpp - pcx * scale, scrY * wpp - pcy * scale, -d);
  }

  // The ball's centre where it hits the glass, in the sheet's frame as placed (the turn applied)
  const hit = portrait ? new THREE.Vector3(-centre[1], centre[0], centre[2]) : new THREE.Vector3(...centre);

  // --- the show
  const rand = mulberry(seed);
  let show = null; // { camera, seq, steps, t, frame, ... }
  let landedCam = null;
  const tmpQ = new THREE.Quaternion(), tmpQ2 = new THREE.Quaternion(), tmpV = new THREE.Vector3(), tmpM = new THREE.Matrix4(), tmpM2 = new THREE.Matrix4(), tmpS = new THREE.Vector3();
  const ident = new THREE.Quaternion();

  function place(camera, posCam, quatCam) {
    camera.updateMatrixWorld();
    const wp = tmpV.copy(posCam).applyMatrix4(camera.matrixWorld);
    const wq = camera.getWorldQuaternion(tmpQ2).multiply(quatCam);
    if (object3d.parent) {
      object3d.parent.updateMatrixWorld();
      tmpM.compose(wp, wq, tmpS.setScalar(scale)).premultiply(tmpM2.copy(object3d.parent.matrixWorld).invert());
      tmpM.decompose(object3d.position, object3d.quaternion, object3d.scale);
    } else {
      object3d.position.copy(wp); object3d.quaternion.copy(wq); object3d.scale.setScalar(scale);
    }
  }

  function sequenceFor(name) {
    const s = info.sequences?.[name] ?? info.sequences?.short;
    if (s) return s;
    return [...Array.from({ length: T }, (_, k) => [k, 1]), [-1, 2]];
  }

  function spit({ camera, from = null, sequence = 'short', spin = 1, onFrame = null } = {}) {
    const seq = sequenceFor(sequence);
    const starts = []; let n = 0;
    for (const [, f] of seq) { starts.push(n); n += f; }
    let landStep = seq.findIndex(([k]) => k === landingPose);
    if (landStep < 0) landStep = seq.findIndex(([k]) => k < 0);
    if (landStep < 0) landStep = seq.length - 1;
    camera.updateMatrixWorld();
    const startCam = from ? camera.worldToLocal(from.clone()) : new THREE.Vector3(0, -0.2, -3);
    if (startCam.z > -0.05) startCam.z = -0.05;
    // the tumble out of the mouth: a random turn that unwinds by the landing
    const axis = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
    const axis2 = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize();
    let resolve;
    const done = new Promise((r) => { resolve = r; });
    show = { camera, seq, starts, total: n, landStep, landFrame: starts[landStep], startCam, axis, axis2, spin, onFrame, t: 0, frame: -1, step: -1, resolve, posCam: new THREE.Vector3(), quatCam: new THREE.Quaternion() };
    landedCam = null;
    paper.landed = false;
    object3d.visible = true;
    stepShow(0);
    return done;
  }

  function stepShow(dt) {
    const s = show;
    s.t += dt;
    const frame = Math.min(s.total - 1, Math.floor(s.t * fps + 1e-6));
    if (frame !== s.frame) {
      s.frame = frame;
      let step = s.seq.length - 1;
      for (let i = 0; i < s.seq.length; i++) if (frame < s.starts[i] + s.seq[i][1]) { step = i; break; }
      const k = s.seq[step][0];
      const p = Math.min(1, frame / Math.max(1, s.landFrame)); // flight progress, stepped: stop motion
      const landed = step >= s.landStep;
      // wet as it flies, drying as it opens on the glass
      setPose(k, { wet: 1 - THREE.MathUtils.smoothstep(frame / Math.max(1, s.total - 1), 0.35, 0.95) });
      const L = landing(s.camera);
      if (!landed) {
        // THE FLIGHT: the ball (it stays a ball) from the mouth to where it hits the glass, its size on screen growing
        // at a steady rate (log space), along a slight arc, tumbling, the tumble unwinding as it arrives (it hits the
        // glass as the impact pose lies)
        const e = 1 - Math.pow(1 - p, 1.5);
        const end = tmpV.copy(hit).multiplyScalar(scale).add(L);
        const z0 = -s.startCam.z, z1 = -end.z;
        const z = Math.exp(Math.log(z0) + (Math.log(z1) - Math.log(z0)) * e);
        const t = Math.tan(THREE.MathUtils.degToRad(s.camera.fov / 2));
        const ax = s.startCam.x / z0 + (end.x / z1 - s.startCam.x / z0) * e;
        const ay = s.startCam.y / z0 + (end.y / z1 - s.startCam.y / z0) * e + 0.3 * t * Math.sin(Math.PI * e) * (1 - e);
        s.posCam.set(ax * z, ay * z, -z);
        const a = s.spin * (1 - e);
        s.quatCam.setFromAxisAngle(s.axis, a * a * 2.6).multiply(tmpQ.setFromAxisAngle(s.axis2, a * 1.3));
        // a hand-posed prop: nudged a little differently on every frame
        const j = 0.6 + 0.4 * (1 - p);
        jig.position.set((rand() - 0.5) * 0.004 * j, (rand() - 0.5) * 0.004 * j, (rand() - 0.5) * 0.003 * j);
        jig.rotation.set((rand() - 0.5) * 0.06 * j, (rand() - 0.5) * 0.06 * j, (rand() - 0.5) * 0.05 * j);
        jig.scale.setScalar(1);
      } else {
        // ON THE GLASS, in the sheet's own place (the poses are baked there): the impact frame squashed flat against
        // the glass about where it hits (a smash), then it spreads into the folded packet and the flaps open one
        // after another, nudged a hair on each frame (less and less), and it lies flat
        s.posCam.copy(L);
        s.quatCam.identity();
        const squash = frame === s.landFrame;
        const sx = squash ? 1.38 : 1, sz = squash ? 0.32 : 1;
        jig.scale.set(sx, sx, sz);
        const j = k < 0 ? 0 : Math.max(0, 1 - (frame - s.landFrame) / Math.max(1, s.total - s.landFrame - 4));
        jig.position.set(hit.x * (1 - sx) + (rand() - 0.5) * 0.002 * j, hit.y * (1 - sx) + (rand() - 0.5) * 0.002 * j, glassZ * (1 - sz));
        jig.rotation.set(0, 0, (rand() - 0.5) * 0.012 * j);
      }
      s.step = step;
      s.onFrame?.({ step, pose: k, name: k < 0 ? 'flat' : names[k], landed, slap: landed && frame === s.landFrame });
      if (step === s.seq.length - 1 && k < 0) {
        landedCam = s.camera; paper.landed = true;
        const r = s.resolve; show = null; r();
      }
    }
    if (show) place(s.camera, s.posCam, s.quatCam);
    else place(landedCam, landing(landedCam), ident);
  }

  function land(camera) {
    show = null;
    setPose(-1);
    jig.position.set(0, 0, 0); jig.rotation.set(0, 0, 0); jig.scale.setScalar(1);
    landedCam = camera; paper.landed = true;
    object3d.visible = true;
    place(camera, landing(camera), ident);
  }

  const paper = {
    object3d, info, print: P, poses: names, landed: false, ballRadius: info.ballRadius,
    setPose: (k, o) => setPose(k, o),
    bounds,
    spit, land,
    update(dt) {
      if (show) stepShow(dt);
      else if (landedCam) place(landedCam, landing(landedCam), ident);
    },
    dispose() {
      show = null; landedCam = null;
      object3d.removeFromParent();
      geo.dispose(); src.geometry.dispose(); front.material.dispose(); back.material.dispose(); core.geometry.dispose();
      core.material.dispose(); wetTex.dispose(); tex.dispose(); cache.delete(`tex:${P.url}:${portrait}`);
    },
  };
  return paper;
}
