// Unruled on the home page: a blunt low-poly warship caught in a living web, tearing at it.
// The ship (procedural: a white-capped hammer prow, a long spine with a raked command tower and a keel blade, a heavy
// engine block with two big bells and two pods hung on swept pylons) sits on a small orb web, glued to it at hull
// points, silk bands wrapped over its hull, long guy-rope strands the web shoots onto it. It idles against the threads
// (engines burning short, straining and swaying), then thrusts in bursts: the engines dim (anticipation) and FLARE, the
// hull lurches, threads stretch and burn red with strain, the web bows and yanks it back, it wobbles. Every third burst a
// strand snaps; a moment later the web shoots a new one back onto the hull and the broken thread knits itself again.
// UNRULED underneath in a face of its own: upright, wide, squared armour plates in gunmetal with bright machined
// chamfers and rivets, cut like a stencil, the cuts glowing hot like welds; the E's middle bar torn loose and swinging,
// the D's seams stuttering, every plate jolting with each lurch.
// Hover: it fights harder. Click: an all-out burst that snaps two strands. Reduced motion / t = 0: a lurch at full burn.
import { createWeb, createSilkLines, rng } from '../web.js';
import { ConvexGeometry } from '/assets/vendor/three/addons/geometries/ConvexGeometry.js';
import { mergeGeometries } from '/assets/vendor/three/addons/utils/BufferGeometryUtils.js';

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const H = 1 / 60;

// ---- the ship, in its own units: +x forward, +y up, +z the side we see
const STERN = [
  { x: -1.38, hw: 0.31, top: 0.21, bot: -0.19, ct: 0.09, cb: 0.06 },
  { x: -1.08, hw: 0.37, top: 0.27, bot: -0.23, ct: 0.11, cb: 0.07 },
  { x: -0.78, hw: 0.34, top: 0.245, bot: -0.21, ct: 0.1, cb: 0.065 },
  { x: -0.56, hw: 0.265, top: 0.19, bot: -0.17, ct: 0.08, cb: 0.055 },
];
const SPINE = [
  { x: -0.7, hw: 0.285, top: 0.205, bot: -0.185, ct: 0.07, cb: 0.05 },
  { x: -0.1, hw: 0.275, top: 0.2, bot: -0.18, ct: 0.07, cb: 0.05 },
  { x: 0.48, hw: 0.245, top: 0.185, bot: -0.165, ct: 0.06, cb: 0.045 },
];
const PROW = [
  { x: 0.38, hw: 0.3, top: 0.285, bot: -0.255, ct: 0.06, cb: 0.05 },
  { x: 0.6, hw: 0.4, top: 0.405, bot: -0.345, ct: 0.08, cb: 0.06 },
  { x: 1.12, hw: 0.385, top: 0.38, bot: -0.335, ct: 0.08, cb: 0.06 },
  { x: 1.36, hw: 0.3, top: 0.245, bot: -0.275, ct: 0.06, cb: 0.05 },
];
const POD_Z = 0.5, POD_Y = -0.2;
const POD = [
  { x: -1.3, hw: 0.1, top: POD_Y + 0.1, bot: POD_Y - 0.1, ct: 0.04, cb: 0.035 },
  { x: -1.08, hw: 0.13, top: POD_Y + 0.135, bot: POD_Y - 0.135, ct: 0.05, cb: 0.045 },
  { x: -0.72, hw: 0.125, top: POD_Y + 0.13, bot: POD_Y - 0.13, ct: 0.05, cb: 0.045 },
  { x: -0.5, hw: 0.07, top: POD_Y + 0.06, bot: POD_Y - 0.06, ct: 0.03, cb: 0.025 },
];
const NOZZLES = [
  { p: [-1.38, 0.025, 0.155], r: 0.128, len: 0.16, main: true },
  { p: [-1.38, 0.025, -0.155], r: 0.128, len: 0.16, main: true },
  { p: [-1.3, POD_Y, POD_Z], r: 0.086, len: 0.12 },
  { p: [-1.3, POD_Y, -POD_Z], r: 0.086, len: 0.12 },
];
// where the web is glued to the hull
const HOLDS = [
  [1.42, 0.2, 0.12], [1.04, -0.34, 0.28], [0.66, 0.41, -0.2], [-0.86, 0.98, 0], [-0.34, -0.43, 0],
  [-0.92, -0.33, POD_Z], [-1.24, 0.26, 0.16], [-1.0, -0.22, -POD_Z - 0.1], [-1.32, -0.17, -0.22], [0.12, 0.17, -0.16],
];
// silk bands wrapped over the hull: [the hull piece, x where it crosses, skew along the hull from far top to near bottom]
const DRAPES = [[PROW, 0.86, 0.14], [SPINE, -0.16, -0.12], [STERN, -0.98, 0.1]];

// ---- the name: a wide, squared stencil face. em = cap height; each letter is 2-4 heavy plates, the stencil cuts
// between them are hot seams
const TV = 0.27, TH = 0.22, G = 0.1, C = 0.13, K = 0.22, k = 0.05, SHEAR = 0.05, TRACK = 0.17;
function glyphs() {
  const x0 = TV + G;
  const mirror = (pts, w) => pts.map(([x, y]) => [w - x, y]);
  const stemTL = [[0, 0], [TV, 0], [TV, 1], [C, 1], [0, 1 - C]];
  const stemBL = [[0, 1], [0, C], [C, 0], [TV, 0], [TV, 1]];
  const stem2 = [[0, C], [C, 0], [TV, 0], [TV, 1], [C, 1], [0, 1 - C]];
  const bar = (w, y0, y1, cTop, cBot) => [[x0, y1], ...(cTop ? [[w - cTop, y1], [w, y1 - cTop]] : [[w, y1]]), ...(cBot ? [[w, y0 + cBot], [w - cBot, y0]] : [[w, y0]]), [x0, y0]];
  const bowl = (w, y0, tb) => [[x0, 1], [w - K, 1], [w, 1 - K], [w, y0 + (y0 > 0 ? 2 * k : K)], [w - (y0 > 0 ? 2 * k : K), y0], [x0, y0], [x0, y0 + tb],
    [w - TV - k, y0 + tb], [w - TV, y0 + tb + k], [w - TV, 1 - TH - k], [w - TV - k, 1 - TH], [x0, 1 - TH]];
  // a seam fills a cut: x range, y range, the plate it rides with
  const cut = (xa, xb, ya, yb, owner = 0) => ({ owner, pts: [[xa - 0.02, ya + 0.012], [xb + 0.02, ya + 0.012], [xb + 0.02, yb - 0.012], [xa - 0.02, yb - 0.012]] });
  const U = (w) => {
    const m = w / 2 - G / 2;
    const A = [[0, 1], [0, K], [K, 0], [m, 0], [m, TH], [TV + k, TH], [TV, TH + k], [TV, 1]];
    return { w, plates: [A, mirror(A, w)], seams: [cut(m, m + G, 0, TH)] };
  };
  const nW = 0.93, rW = 0.88, lW = 0.72, eW = 0.78, dW = 0.88;
  return {
    U: U(0.86),
    N: {
      w: nW,
      plates: [stemTL, [[x0, 1], [x0, 0.55], [nW - TV - G, 0], [nW - TV - G, 0.45]], [[nW - TV, 0], [nW - C, 0], [nW, C], [nW, 1], [nW - TV, 1]]],
      seams: [cut(TV, x0, 0.55, 1), cut(nW - TV - G, nW - TV, 0, 0.45, 2)],
    },
    R: {
      w: rW,
      plates: [stemTL, bowl(rW, 0.42, TH * 0.95), [[x0 + 0.09, 0.42 - G], [x0 + 0.36, 0.42 - G], [rW, 0], [rW - 0.28, 0]]],
      seams: [cut(TV, x0, 0.42, 1), { owner: 2, pts: [[x0 + 0.07, 0.42 - G - 0.02], [x0 + 0.38, 0.42 - G - 0.02], [x0 + 0.38, 0.425], [x0 + 0.07, 0.425]] }],
    },
    L: { w: lW, plates: [stemBL, bar(lW, 0, TH, 0, C * 0.7)], seams: [cut(TV, x0, 0, TH)] },
    E: {
      w: eW,
      plates: [stem2, bar(eW, 1 - TH, 1, C * 0.7, 0), bar(eW * 0.84, 0.5 - TH / 2, 0.5 + TH / 2, 0, 0), bar(eW, 0, TH, 0, C * 0.7)],
      seams: [cut(TV, x0, 1 - TH, 1), cut(TV + 0.01, x0, 0.5 - TH / 2, 0.5 + TH / 2, 2), cut(TV, x0, 0, TH)],
      torn: 2, hinge: [x0, 0.5 + TH / 2],
    },
    D: { w: dW, plates: [stem2, bowl(dW, 0, TH)], seams: [cut(TV, x0, 0, TH), cut(TV, x0, 1 - TH, 1)] },
  };
}

export async function create({ THREE, stage, reduced }) {
  const V = THREE.Vector3;
  const rand = rng(1998), jit = rng(77);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 0.8, 0.1, 80);

  // ---- light: a white key from the upper left, a rim from behind to cut the dark hull out of the white page, the
  // engines' own warm light on the stern, and their glow reaching down to the name
  scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1a1a, 1.15));
  const fill = new THREE.DirectionalLight(0xdfe6f0, 0.85); fill.position.set(4, -1.5, 3); scene.add(fill);
  const key = new THREE.DirectionalLight(0xffffff, 2.7); key.position.set(-3, 4.5, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.6); rim.position.set(3.5, 2.5, -4); scene.add(rim);
  const burner = new THREE.PointLight(0xff4418, 0, 1.15, 1.2); scene.add(burner);
  const exGlow = new THREE.PointLight(0xff3a12, 0, 2.6, 1.5); scene.add(exGlow);

  // ---- materials
  const std = (color, roughness, metalness, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true, ...extra });
  const basic = (color, extra = {}) => new THREE.MeshBasicMaterial({ color, toneMapped: false, ...extra });
  const M = {
    seam: std(0x060607, 0.9, 0),
    hull: std(0x1d1f22, 0.5, 0.3),
    plate: std(0x2a2d31, 0.42, 0.38),
    gun: std(0x40454c, 0.38, 0.45),
    bone: std(0xe6e2d8, 0.6, 0.02),
    dark: std(0x0d0e0f, 0.7, 0.2),
    window: basic(0xff4a1c),
    lamp: basic(0xff2414),
    throat: basic(0x5a0806, { side: THREE.BackSide }),
    lip: basic(0xff7a32),
    shell: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, side: THREE.BackSide }),
    mid: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, side: THREE.BackSide }),
    core: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
    chunk: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
  };

  // ---- geometry helpers
  const owned = [];
  const own = (g) => { owned.push(g); return g; };
  const convex = (pts) => new ConvexGeometry(pts.map((p) => (p.isVector3 ? p : new V(p[0], p[1], p[2]))));
  const secPts = ({ x, cz = 0, hw, top, bot, ct = 0, cb = 0 }) => [
    [x, top, cz + hw - ct], [x, top, cz - hw + ct], [x, top - ct, cz - hw], [x, bot + cb, cz - hw],
    [x, bot, cz - hw + cb], [x, bot, cz + hw - cb], [x, bot + cb, cz + hw], [x, top - ct, cz + hw],
  ];
  const secAt = (secs, x) => {
    for (let i = 0; i < secs.length - 1; i++) {
      const a = secs[i], b = secs[i + 1];
      if (x >= a.x && x <= b.x) {
        const t = (x - a.x) / (b.x - a.x), o = { x };
        for (const key2 of ['hw', 'top', 'bot', 'ct', 'cb', 'cz']) o[key2] = lerp(a[key2] ?? 0, b[key2] ?? 0, t);
        return o;
      }
    }
    return { ...secs[0], x };
  };
  const loft = (secs) => convex(secs.flatMap(secPts));
  const clean = (g) => {
    const n = g.index ? g.toNonIndexed() : g;
    for (const a of Object.keys(n.attributes)) if (a !== 'position' && a !== 'normal') n.deleteAttribute(a);
    n.computeVertexNormals();
    return n;
  };
  const xf = (pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => new THREE.Matrix4().compose(new V(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), new V(...scl));
  const parts = {};
  const add = (g, mat, m) => { if (m) g.applyMatrix4(m); (parts[mat] ??= []).push(clean(g)); };

  // plates: each face of a loft is its own slab, inset from its neighbours so the dark core shows as panel seams
  function plates(secs, pick, inset = 0.017, lift = 0.013) {
    const P = secs.map((s) => secPts(s).map((p) => new V(...p)));
    const toward = (a, b, d) => { const v = new V().subVectors(b, a); const L = v.length(); return v.multiplyScalar(Math.min(0.42, d / Math.max(L, 1e-6))); };
    for (let i = 0; i < P.length - 1; i++) {
      for (let j = 0; j < 8; j++) {
        const mat = pick(i, j);
        if (!mat) continue;
        const q = [P[i][j], P[i][(j + 1) % 8], P[i + 1][(j + 1) % 8], P[i + 1][j]];
        if (q[0].distanceTo(q[1]) < 0.02 && q[3].distanceTo(q[2]) < 0.02) continue;
        const c = q.reduce((a, p) => a.add(p), new V()).multiplyScalar(0.25);
        const n = new V().subVectors(q[2], q[0]).cross(new V().subVectors(q[3], q[1])).normalize();
        const s = secs[i], axis = new V(c.x, (s.top + s.bot) / 2, s.cz ?? 0);
        if (n.dot(new V().subVectors(c, axis)) < 0) n.negate();
        const pts = [];
        q.forEach((p, m) => {
          const across = q[m ^ 1], along = q[3 - m];
          const pp = p.clone().add(toward(p, across, inset)).add(toward(p, along, inset));
          pts.push(pp.clone().addScaledVector(n, lift), pp.clone().addScaledVector(n, -lift * 1.6));
        });
        add(convex(pts), mat);
      }
    }
  }

  // ---- the hull. Faces of a section: 0 top, 7 top chamfer (our side), 6 our side, 5 low chamfer, 4 bottom, 1-3 far side
  // the engine block
  add(loft(STERN), 'seam');
  plates(STERN, (i, j) => {
    if (j === 0) return i === 0 ? 'gun' : 'plate';
    if (j === 7) return i === 1 ? 'bone' : 'plate';
    if (j === 1) return 'plate';
    if (j === 6) return i === 1 ? 'plate' : 'hull';
    return 'hull';
  });
  add(new THREE.BoxGeometry(0.03, 0.3, 0.56), 'dark', xf([-1.39, 0.02, 0]));
  // the spine
  add(loft(SPINE), 'seam');
  plates(SPINE, (i, j) => {
    if (j === 0) return 'plate';
    if (j === 7 || j === 1) return i === 1 ? 'gun' : 'plate';
    return 'hull';
  });
  for (let v = 0; v < 5; v++) add(new THREE.BoxGeometry(0.05, 0.13, 0.03), 'dark', xf([-0.42 + v * 0.085, -0.01, 0.282]));
  // the hammer prow, taller and wider than the neck it sits on, capped in white armour
  add(loft(PROW), 'seam');
  plates(PROW, (i, j) => {
    if (j === 0) return i === 2 ? 'gun' : 'bone';
    if (j === 7 || j === 1) return i === 2 ? 'gun' : 'bone';
    if (j === 6) return i === 0 ? 'plate' : i === 1 ? 'hull' : 'gun';
    if (j === 5) return i === 1 ? 'plate' : 'hull';
    return 'hull';
  });
  add(loft([{ x: 1.35, hw: 0.265, top: 0.225, bot: -0.255, ct: 0.05, cb: 0.04 }, { x: 1.44, hw: 0.2, top: 0.15, bot: -0.18, ct: 0.04, cb: 0.03 }]), 'gun');
  add(new THREE.BoxGeometry(0.02, 0.036, 0.3), 'dark', xf([1.445, -0.01, 0]));
  add(loft([{ x: 0.31, hw: 0.3, top: 0.275, bot: -0.245, ct: 0.06, cb: 0.05 }, { x: 0.4, hw: 0.3, top: 0.275, bot: -0.245, ct: 0.06, cb: 0.05 }]), 'dark');
  // a dark armour strake down the prow's flank
  add(convex([[0.62, 0.03, 0.412], [1.2, 0.03, 0.392], [0.62, -0.07, 0.412], [1.2, -0.05, 0.392], [0.62, 0.03, 0.38], [1.2, 0.03, 0.36], [0.62, -0.07, 0.38], [1.2, -0.05, 0.36]]), 'dark');
  // an armoured ridge along the spine's back
  add(loft([{ x: -0.5, hw: 0.14, top: 0.31, bot: 0.16, ct: 0.045 }, { x: 0.26, hw: 0.13, top: 0.29, bot: 0.16, ct: 0.045 }, { x: 0.4, hw: 0.08, top: 0.21, bot: 0.16, ct: 0.03 }]), 'gun');
  // the command tower, raked back, with its bridge, red-lit windows and a mast
  add(loft([{ x: -1.06, hw: 0.17, top: 0.48, bot: 0.2, ct: 0.05 }, { x: -0.68, hw: 0.155, top: 0.56, bot: 0.2, ct: 0.05 }, { x: -0.44, hw: 0.1, top: 0.33, bot: 0.17, ct: 0.035 }]), 'plate');
  add(loft([{ x: -1.0, hw: 0.2, top: 0.68, bot: 0.52, ct: 0.05, cb: 0.02 }, { x: -0.72, hw: 0.2, top: 0.68, bot: 0.52, ct: 0.05, cb: 0.02 }, { x: -0.6, hw: 0.14, top: 0.6, bot: 0.52, ct: 0.04 }]), 'gun');
  add(new THREE.BoxGeometry(0.24, 0.022, 0.3), 'bone', xf([-0.87, 0.69, 0]));
  add(new THREE.BoxGeometry(0.05, 0.022, 0.28), 'window', xf([-0.655, 0.635, 0], [0, 0, -0.62]));
  add(new THREE.BoxGeometry(0.026, 0.34, 0.026), 'dark', xf([-0.86, 0.84, 0]));
  add(new THREE.BoxGeometry(0.022, 0.022, 0.2), 'dark', xf([-0.86, 0.93, 0]));
  // a keel blade under the spine
  add(convex([[-0.62, -0.13, 0.045], [0.18, -0.12, 0.045], [-0.5, -0.45, 0.03], [-0.24, -0.43, 0.03],
    [-0.62, -0.13, -0.045], [0.18, -0.12, -0.045], [-0.5, -0.45, -0.03], [-0.24, -0.43, -0.03]]), 'gun');
  // radiator fins on the engine block, swept back and splayed
  for (const s of [-1, 1]) {
    const base = [[-1.3, 0.24, s * 0.12], [-0.98, 0.26, s * 0.12], [-1.42, 0.52, s * 0.34], [-1.26, 0.52, s * 0.35]].map((p) => new V(...p));
    const nrm = new V(0, -0.67 * s, 0.74).multiplyScalar(0.028 * s);
    add(convex([...base, ...base.map((p) => p.clone().add(nrm))]), 'plate');
  }
  // engine pods on swept pylons
  for (const s of [-1, 1]) {
    const secs = POD.map((q) => ({ ...q, cz: s * POD_Z }));
    add(loft(secs), 'seam');
    plates(secs, (i, j) => (i === 2 ? 'gun' : (j === 0 || j === 7) && i === 1 ? 'bone' : j >= 3 && j <= 5 ? 'hull' : 'plate'), 0.014, 0.011);
    add(convex([[-1.0, -0.02, s * 0.27], [-0.64, -0.02, s * 0.27], [-1.04, -0.12, s * 0.27], [-0.7, -0.12, s * 0.27],
      [-1.08, -0.15, s * 0.42], [-0.84, -0.15, s * 0.42], [-1.1, -0.22, s * 0.42], [-0.86, -0.22, s * 0.42]]), 'gun');
  }
  // turrets: a big twin on the prow, a single on the spine
  const turret = (x, y, sc, twin) => {
    add(new THREE.CylinderGeometry(0.1 * sc, 0.115 * sc, 0.045, 6), 'plate', xf([x, y + 0.02, 0]));
    add(loft([{ x: x - 0.11 * sc, hw: 0.085 * sc, top: y + 0.04 + 0.08 * sc, bot: y + 0.04, ct: 0.03 * sc },
      { x: x + 0.08 * sc, hw: 0.08 * sc, top: y + 0.04 + 0.07 * sc, bot: y + 0.04, ct: 0.03 * sc },
      { x: x + 0.14 * sc, hw: 0.06 * sc, top: y + 0.04 + 0.035 * sc, bot: y + 0.04, ct: 0.02 * sc }]), 'gun');
    for (const z of twin ? [-0.036 * sc, 0.036 * sc] : [0]) {
      add(new THREE.BoxGeometry(0.32 * sc, 0.03, 0.03), 'dark', xf([x + 0.25 * sc, y + 0.075 * sc + 0.005, z]));
      add(new THREE.BoxGeometry(0.05, 0.04, 0.04), 'dark', xf([x + 0.4 * sc, y + 0.075 * sc + 0.005, z]));
    }
  };
  turret(0.86, 0.4, 1.25, true);
  turret(0.0, 0.29, 0.9, false);
  // engine bells, their hot lips, and the throats
  const throats = [], cores = [], lips = [];
  for (const nz of NOZZLES) {
    const [x, y, z] = nz.p;
    add(new THREE.CylinderGeometry(nz.r, nz.r * 0.8, nz.len, 8, 1, true), 'gun', xf([x - nz.len / 2, y, z], [0, 0, Math.PI / 2]));
    add(new THREE.CylinderGeometry(nz.r * 0.84, nz.r * 0.84, 0.05, 8, 1, true), 'dark', xf([x + 0.01, y, z], [0, 0, Math.PI / 2]));
    throats.push(clean(new THREE.CylinderGeometry(nz.r * 0.96, nz.r * 0.76, nz.len * 0.98, 8, 1, true).applyMatrix4(xf([x - nz.len / 2, y, z], [0, 0, Math.PI / 2]))));
    cores.push(clean(new THREE.CircleGeometry(nz.r * 0.76, 8).applyMatrix4(xf([x - 0.005, y, z], [0, -Math.PI / 2, 0]))));
    lips.push(clean(new THREE.TorusGeometry(nz.r * 0.98, nz.r * 0.13, 3, 8).applyMatrix4(xf([x - nz.len, y, z], [0, Math.PI / 2, 0]))));
  }

  const ship = new THREE.Group(), body = new THREE.Group();
  ship.add(body); scene.add(ship);
  for (const [mat, list] of Object.entries(parts)) {
    const g = own(mergeGeometries(list));
    list.forEach((x) => x.dispose());
    body.add(new THREE.Mesh(g, M[mat]));
  }
  const mergeOwn = (list) => { const g = own(mergeGeometries(list)); list.forEach((x) => x.dispose()); return g; };
  body.add(new THREE.Mesh(mergeOwn(throats), M.throat));
  const coreMat = basic(0xffb27a);
  body.add(new THREE.Mesh(mergeOwn(cores), coreMat));
  body.add(new THREE.Mesh(mergeOwn(lips), M.lip));
  // running lights (blink)
  const lampGeo = own(new THREE.BoxGeometry(0.04, 0.04, 0.04));
  const lamps = [[-0.86, 1.02, 0], [-0.5, POD_Y, POD_Z], [1.41, -0.08, 0.13]].map((p, i) => {
    const m = new THREE.Mesh(lampGeo, M.lamp); m.position.set(...p); body.add(m); return { m, ph: i * 0.41 };
  });

  // ---- flames: three nested faceted cones per engine. The red shell and the orange layer are drawn from the inside
  // (back faces), the white-hot core from the outside, so each layer shows inside the one around it: hot at the heart,
  // red at the edges, like a real exhaust, with no blending (additive light vanishes on a white page)
  const col = (h) => new THREE.Color(h);
  const ramp = (stops, x, out) => {
    for (let i = 1; i < stops.length; i++) {
      if (x <= stops[i][0] || i === stops.length - 1) return out.copy(stops[i - 1][1]).lerp(stops[i][1], clamp((x - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]), 0, 1));
    }
    return out;
  };
  const shadeBake = (g, colorAt, lit = 0.34) => {
    g.computeVertexNormals();
    const pos = g.attributes.position, nor = g.attributes.normal, n = pos.count, out = new Float32Array(n * 3), c = new THREE.Color();
    const L = new V(-0.45, 0.75, 0.5).normalize();
    for (let i = 0; i < n; i++) {
      colorAt(pos.getX(i), pos.getY(i), pos.getZ(i), c);
      const s = 1 - lit + lit * Math.max(0, nor.getX(i) * L.x + nor.getY(i) * L.y + nor.getZ(i) * L.z);
      out[i * 3] = c.r * s; out[i * 3 + 1] = c.g * s; out[i * 3 + 2] = c.b * s;
    }
    g.setAttribute('color', new THREE.BufferAttribute(out, 3));
    return g;
  };
  const lathe = (pts, stops, lit) => {
    const g = shadeBake(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), 7).toNonIndexed(), (x, y, z, c) => ramp(stops, clamp(y, 0, 1), c), lit);
    g.deleteAttribute('uv');
    return own(g.rotateZ(Math.PI / 2));   // runs along -x, out of the bell
  };
  const PROFILE = [[0, -0.06], [0.94, -0.03], [1.0, 0.1], [0.84, 0.34], [0.56, 0.6], [0.26, 0.84], [0, 1]];
  const LAYERS = [
    { mat: M.shell, rad: 1.0, len: 1.0, geo: lathe(PROFILE, [[0, col(0xff5a1e)], [0.35, col(0xff2c14)], [0.75, col(0xd8140f)], [1, col(0x7c080b)]], 0.3) },
    { mat: M.mid, rad: 0.74, len: 0.64, geo: lathe(PROFILE, [[0, col(0xffc070)], [0.5, col(0xff8a36)], [1, col(0xff4a1a)]], 0.22) },
    { mat: M.core, rad: 0.46, len: 0.34, geo: lathe(PROFILE, [[0, col(0xffffff)], [0.5, col(0xfff1cc)], [1, col(0xffc77e)]], 0.12) },
  ];
  for (const L of LAYERS) {
    L.mesh = new THREE.InstancedMesh(L.geo, L.mat, NOZZLES.length);
    L.mesh.frustumCulled = false;
    body.add(L.mesh);
  }
  const flames = NOZZLES.map((nz) => ({ at: new V(nz.p[0] - nz.len + 0.03, nz.p[1], nz.p[2]), r: nz.r * 0.9, main: !!nz.main, ph: rand() * 10 }));

  // ---- exhaust, sparks and silk scraps: one instanced batch of faceted chunks that tumble. Exhaust goes white-hot,
  // orange, red, then turns to grey smoke that swells and thins away
  const PN = 110;
  const chunkGeo = own(shadeBake(new THREE.IcosahedronGeometry(1, 0), (x, y, z, c) => c.setRGB(1, 1, 1), 0.42));
  chunkGeo.deleteAttribute('uv');
  const chunks = new THREE.InstancedMesh(chunkGeo, M.chunk, PN);
  chunks.frustumCulled = false;
  scene.add(chunks);
  const RAMPS = [
    [[0, col(0xfff4dc)], [0.09, col(0xffb060)], [0.22, col(0xff4a1a)], [0.36, col(0xc81410)], [0.5, col(0x4a1414)], [0.62, col(0x6a6a6a)], [1, col(0xc4c4c4)]],
    [[0, col(0xfff0d8)], [0.25, col(0xff8a3a)], [0.6, col(0xff2414)], [1, col(0x7c080b)]],
    [[0, col(0x8a8a8a)], [1, col(0xc8c8c8)]],
  ];
  const P = Array.from({ length: PN }, () => ({ p: new V(), v: new V(), ax: new V(1, 0, 0), spin: 0, age: 1, life: 1, size: 0, kind: 0, on: false }));
  let pNext = 0;
  const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new V(), _c = new THREE.Color(), _c2 = new THREE.Color();
  for (let i = 0; i < PN; i++) { chunks.setMatrixAt(i, _m4.makeScale(0, 0, 0)); chunks.setColorAt(i, _c.setRGB(1, 1, 1)); }
  function emit(kind, pos, vel, size, life) {
    const q = P[pNext]; pNext = (pNext + 1) % PN;
    q.p.copy(pos); q.v.copy(vel); q.size = size; q.life = life; q.age = 0; q.kind = kind; q.on = true;
    q.ax.set(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(); q.spin = (rand() - 0.5) * 16;
  }
  function stepChunks(h) {
    for (const q of P) {
      if (!q.on) continue;
      q.age += h / q.life;
      if (q.age >= 1) { q.on = false; continue; }
      const smoke = q.kind === 0 && q.age > 0.5;
      q.v.multiplyScalar(Math.exp(-(smoke ? 4.2 : q.kind === 2 ? 3 : 2.2) * h));
      if (q.kind === 1) q.v.y -= 3.2 * h;
      else if (q.kind === 2) q.v.y -= 0.8 * h;
      else if (smoke) q.v.y += 0.5 * h;
      q.p.addScaledVector(q.v, h);
    }
  }
  function drawChunks() {
    for (let i = 0; i < PN; i++) {
      const q = P[i];
      if (!q.on) { chunks.setMatrixAt(i, _m4.makeScale(0, 0, 0)); continue; }
      const a = q.age;
      let sz = q.size;
      if (q.kind === 0) sz *= (a < 0.5 ? 1 - 0.35 * a : 0.82 + 1.3 * (a - 0.5)) * (1 - smooth(0.72, 1, a));
      else sz *= (1 - a) ** 0.6;
      const stretch = q.kind === 1 ? 1 + q.v.length() * 0.5 : 1;
      _q.setFromAxisAngle(q.ax, q.spin * a * q.life);
      _m4.compose(q.p, _q, _s.set(sz, sz, sz * stretch));
      chunks.setMatrixAt(i, _m4);
      chunks.setColorAt(i, ramp(RAMPS[q.kind], a, _c));
    }
    chunks.instanceMatrix.needsUpdate = true;
    chunks.instanceColor.needsUpdate = true;
  }

  // ---- placement: the ship sits in the upper part of the stage, nose climbing to the right, seen from the side and a
  // little behind and above, so its tower, prow, keel and pods all break the outline
  const FWD = new V(0.84, 0.4, -0.36).normalize();
  const UPv = new V(-0.3, 0.93, 0.12); UPv.addScaledVector(FWD, -UPv.dot(FWD)).normalize();
  const SIDE = new V().crossVectors(FWD, UPv);
  const baseQ = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(FWD, UPv, SIDE));
  const HOME = new V(0.1, 0, 0);
  const SHIP_SCALE = 1.06;
  ship.scale.setScalar(SHIP_SCALE);

  // ---- the web: a small orb behind the ship, moored by long threads that fade out before the stage edges into the
  // page's own web (a per-thread alpha set when it is spun: a supported web.js option)
  const HUB = new V(HOME.x - 0.12, HOME.y + 0.16, -0.45);
  const frame = [], moorings = [];
  for (let i = 0; i < 7; i++) {
    const a = 0.35 + (i / 7) * Math.PI * 2 + (rand() - 0.5) * 0.4;
    const c = Math.cos(a), s = Math.sin(a), rx = 1.55, ry = s > 0 ? 1.3 : 1.55;
    const r = (1 / Math.sqrt((c / rx) ** 2 + (s / ry) ** 2)) * (0.9 + rand() * 0.2);
    frame.push([HUB.x + c * r, HUB.y + s * r, HUB.z]);
    const a2 = a + (rand() - 0.5) * 0.35, R2 = r * 2.7;
    moorings.push([i, [HUB.x + Math.cos(a2) * R2, HUB.y + Math.sin(a2) * R2, HUB.z - 0.3]]);
  }
  const webOpts = {
    hub: HUB.toArray(), frame, moorings, normal: [0.05, 0.08, 1], spokes: 12, seed: 23, irregularity: 0.55, forks: 0.2,
    spiral: { spacing: 0.15, start: 0.17, end: 0.9, follow: 0.3, growth: 0.35 },
    width: 0.0095, widths: { moor: 1.3, frame: 1.15, spiral: 0.85 },
    colors: { hub: 0x6c6c6c, spoke: 0x7e7e7e, spiral: 0x9c9c9c, frame: 0x888888, moor: 0x8a8a8a, hubring: 0x888888 },
    strainColor: 0xff2414, strainGain: 5, dangling: 2, dew: { count: 9, size: 0.015, color: 0xb8bcc0 },
    wave: { plane: 0.5, normal: 0.9 }, wind: { amp: 0.022, normal: 0.08, speed: 1 },
  };
  const probe = createWeb({ ...webOpts, dew: null, warmup: 0 });
  const R = probe.radius, PL = probe.plane;
  probe.dispose();
  // threads dissolve toward the stage edges (the stage is at least ~2.1 wide and ~2.4 tall either side of its centre)
  const fadeAt = (x, y) => (1 - smooth(1.4, 1.95, Math.abs(x - HOME.x))) * (1 - smooth(1.45, 1.9, y - HOME.y)) * (1 - smooth(1.6, 2.2, HOME.y - y));
  const web = createWeb({
    ...webOpts,
    style(info) {
      const rr = info.r * R, u = Math.cos(info.angle) * rr, v = Math.sin(info.angle) * rr;
      const al = fadeAt(PL.origin.x + PL.u.x * u + PL.v.x * v, PL.origin.y + PL.u.y * u + PL.v.y * v);
      return al < 0.999 ? { alpha: al } : null;
    },
  });
  scene.add(web.object);
  const silk = createSilkLines(72, { color: 0xa2a2a2, width: 0.0105, renderOrder: 1 });
  scene.add(silk.object);

  // ---- the ship's state
  const S = {
    off: new V(), vel: new V(), rot: [0, 0, 0], rv: [0, 0, 0], phase: 'idle', pt: 0, dur: 2, n: 0, power: 1, over: false,
    thr: 0, glow: 0.4, flame: 0.3, snapAt: null, snapDone: false, emitAcc: 0,
  };
  const holds = HOLDS.map((l) => ({ local: new V(...l), world: new V(), node: -1, handle: null, threads: [] }));
  const nozzleW = NOZZLES.map(() => ({ p: new V(), d: new V() }));
  const _a = new V(), _b = new V(), _e = new THREE.Euler(0, 0, 0, 'XYZ'), _qr = new THREE.Quaternion();
  function poseShip(jitter = 0) {
    ship.position.copy(HOME).add(S.off);
    _qr.setFromEuler(_e.set(S.rot[0], S.rot[1], S.rot[2]));
    ship.quaternion.copy(baseQ).multiply(_qr);
    body.position.set((jit() - 0.5) * jitter, (jit() - 0.5) * jitter, (jit() - 0.5) * jitter);
    ship.updateMatrixWorld(true);
    for (const hd of holds) hd.world.copy(hd.local).applyMatrix4(ship.matrixWorld);
    _a.set(-1, 0, 0).applyQuaternion(ship.quaternion);
    NOZZLES.forEach((nz, i) => { nozzleW[i].p.set(nz.p[0] - nz.len, nz.p[1], nz.p[2]).applyMatrix4(ship.matrixWorld); nozzleW[i].d.copy(_a); });
  }
  poseShip();
  // glue: the web junction nearest each hull point follows it
  const glued = new Set();
  for (const hd of holds) {
    const n = web.nearestNode(hd.world.x, hd.world.y, hd.world.z, (i) => web.junction[i] === 1 && !glued.has(i) && !web.anchors.includes(i));
    glued.add(n); hd.node = n;
    hd.handle = web.attach(n, () => hd.world);
    hd.threads = web.threads.filter((T) => T.a === n || T.b === n).map((T) => T.index);
  }
  // the web was spun round the ship where it hangs: let it settle there, then take that as its rest shape (memory and
  // strain), so the threads only burn red when the ship actually pulls
  for (let i = 0; i < 160; i++) web.update(H);
  {
    const sg = web.segments, sim = web.sim;
    if (web.rest?.length === sim?.length && sg?.rest?.length === sg?.count && sg?.a?.length === sg?.count) {
      web.rest.set(sim);
      for (let s = 0; s < sg.count; s++) {
        const a3 = sg.a[s] * 3, b3 = sg.b[s] * 3;
        const d = Math.hypot(sim[b3] - sim[a3], sim[b3 + 1] - sim[a3 + 1], sim[b3 + 2] - sim[a3 + 2]);
        if (d > sg.rest[s]) sg.rest[s] = d;
      }
    } else console.warn('unruled: web.js rest arrays changed shape; the web may read as strained at rest');
  }
  for (let i = 0; i < 30; i++) web.update(H);

  // ---- silk bands wrapped over the hull: three strands each, across the top and down our side, tied to the web above
  // and below so the ship is visibly bound
  // a free web junction near p, but well clear of the hull point it ties to (as seen from the front), so the strand
  // visibly runs off the hull into the web
  const freeJ = (p, avoid, from) => web.nearestNode(p.x, p.y, p.z, (i) => {
    if (web.junction[i] !== 1 || glued.has(i) || avoid.has(i) || web.anchors.includes(i)) return false;
    web.node(i, _a);
    return Math.hypot(_a.x - from.x, _a.y - from.y) > 0.5;
  });
  const drapes = [];
  {
    const used = new Set();
    const up = new V(), wp = new V();
    for (const [secs, x, skew] of DRAPES) {
      const sec = secAt(secs, x);
      const ring = secPts(sec);
      const cy = (sec.top + sec.bot) / 2, cz = sec.cz ?? 0;
      const idx = [1, 0, 7, 6, 5];
      const strands = [-1, 0, 1].map((o) => idx.map((j, m) => {
        const p = new V(...ring[j]);
        const out = new V(0, p.y - cy, p.z - cz).normalize().multiplyScalar(0.016);
        return p.add(out).add(new V(o * 0.026 + skew * (m / (idx.length - 1) - 0.5) + (o * o) * 0.004 * m, 0, 0));
      }));
      // the web ends: above the far top edge and below our bottom edge
      const top = strands[1][0].clone().applyMatrix4(ship.matrixWorld);
      up.copy(UPv).multiplyScalar(0.8).addScaledVector(FWD, -0.15).add(top); up.z = HUB.z;
      const A = freeJ(up, used, top); used.add(A);
      const bot = strands[1][idx.length - 1].clone().applyMatrix4(ship.matrixWorld);
      wp.copy(UPv).multiplyScalar(-0.75).addScaledVector(FWD, -0.15).add(bot); wp.z = HUB.z;
      const B = freeJ(wp, used, bot); used.add(B);
      const d = { strands, A, B, restA: 0, restB: 0, stA: 0, stB: 0 };
      web.node(A, _a); d.restA = _a.distanceTo(top) * 0.97;
      web.node(B, _a); d.restB = _a.distanceTo(bot) * 0.97;
      drapes.push(d);
    }
  }
  const glob = new THREE.Mesh(chunkGeo, new THREE.MeshBasicMaterial({ color: 0x8a8a8a, vertexColors: true, toneMapped: false }));
  glob.visible = false; scene.add(glob);
  // silk slots: drapes (3 strands x 6 segments each), then two per tether
  const DRAPE0 = 0, TETH0 = DRAPES.length * 18;
  // ---- tethers: long strands the web shoots onto the hull
  const tethers = [0, 1, 2, 3].map((i) => ({ state: 'off', node: -1, hold: null, t: 0, rest: 1, since: 0, slot: TETH0 + i * 2, src: new V(), tip: new V(), brk: new V(), mend: -1 }));
  const pending = [];
  let time = 0, snaps = 0, flash = 0;
  const camShake = new V(), camShakeV = new V();
  const _pref = new V();
  function pickSource(hd) {
    _pref.subVectors(hd.world, ship.position).setZ(0).normalize().addScaledVector(_b.set(FWD.x, FWD.y, 0).normalize(), -0.5).normalize();
    let best = -1, bs = -Infinity;
    for (const i of web.junctions) {
      if (glued.has(i) || tethers.some((t) => t.node === i && t.state !== 'off')) continue;
      web.node(i, _a);
      if (Math.abs(_a.x - HOME.x) > 1.55 || _a.y - HOME.y > 1.5 || HOME.y - _a.y > 1.7) continue;
      const d = _a.distanceTo(hd.world);
      if (d < 0.75 || d > 1.9) continue;
      _b.subVectors(_a, hd.world).setZ(0).normalize();
      const sc = _b.dot(_pref) + rand() * 0.35;
      if (sc > bs) { bs = sc; best = i; }
    }
    return best;
  }
  function shoot(mendThread = -1, holdIdx = -1) {
    const tt = tethers.find((t) => t.state === 'off');
    if (!tt) { if (mendThread >= 0) web.mend(mendThread, 0.8); return; }
    const hd = holds[holdIdx >= 0 ? holdIdx : (rand() * holds.length) | 0];
    const src = pickSource(hd);
    if (src < 0) { if (mendThread >= 0) web.mend(mendThread, 0.8); return; }
    Object.assign(tt, { state: 'fly', node: src, hold: hd, t: 0, mend: mendThread, since: time });
    web.node(src, tt.src);
    web.pluck(src, 0.05, 0.25);
  }
  function snapTether(tt) {
    web.node(tt.node, tt.src);
    tt.brk.lerpVectors(tt.src, tt.hold.world, 0.35 + rand() * 0.3);
    tt.state = 'snap'; tt.t = 0;
    web.pluck(tt.node, 0.09, 0.3);
    scraps(tt.brk, 4);
  }
  function scraps(p, n) { for (let i = 0; i < n; i++) emit(2, p, _b.set(rand() - 0.5, rand() - 0.2, rand() - 0.5).multiplyScalar(1.6), 0.014 + rand() * 0.01, 0.5 + rand() * 0.3); }
  web.onSnap = (ti) => {
    const T = web.threads[ti];
    const hi = holds.findIndex((hd) => hd.node === T.a || hd.node === T.b);
    pending.push({ at: time + 0.9 + rand() * 0.5, thread: ti, hold: hi });
    web.node(T.nodes[T.nodes.length >> 1], _a);
    scraps(_a, 5);
  };
  function doSnap(count) {
    for (let c = 0; c < count; c++) {
      // the longest-held strand whips apart (the web shoots a new one a moment later); a thread at the hull gives too
      const held = tethers.filter((t) => t.state === 'held').sort((a, b) => a.since - b.since);
      if (held.length) { const tt = held[0]; snapTether(tt); pending.push({ at: time + 0.85 + rand() * 0.4, thread: -1, hold: holds.indexOf(tt.hold) }); }
      if (c === 0) {
        let best = -1, bt = -1;
        for (const hd of holds) for (const ti of hd.threads) {
          const T = web.threads[ti];
          if (T.broken) continue;
          const ten = web.tension(ti);
          if (ten > bt) { bt = ten; best = ti; }
        }
        if (best >= 0) web.snap(best);
      }
      snaps++;
    }
    S.vel.addScaledVector(FWD, 1.5);
    S.rv[0] += (rand() - 0.5) * 3; S.rv[2] += 1.2;
    kickCam(0.06);
    flash = 1;
    tugOut = Math.max(tugOut, S.over ? 1 : 0.9);
  }

  // ---- the name: squared stencil plates; one material type picks cap / chamfer / wall / rivet / hot seam per fragment
  const NC = {
    cap: new THREE.Color(0x646b74), bevel: new THREE.Color(0xdfe3e8), wallF: new THREE.Color(0x30353b), wallB: new THREE.Color(0x0e1012),
    rivet: new THREE.Color(0x1b1d20),
  };
  const nameMat = () => {
    const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.32, flatShading: true, emissive: 0xe0280f, emissiveIntensity: 1 });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uCap = { value: NC.cap }; sh.uniforms.uBevel = { value: NC.bevel }; sh.uniforms.uWallF = { value: NC.wallF };
      sh.uniforms.uWallB = { value: NC.wallB }; sh.uniforms.uRivet = { value: NC.rivet };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aKind;\nattribute float aZ;\nattribute float aShade;\nvarying float vKind;\nvarying float vZ;\nvarying float vShade;\nvarying vec3 vON;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvKind = aKind; vZ = aZ; vShade = aShade; vON = normal;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uCap;\nuniform vec3 uBevel;\nuniform vec3 uWallF;\nuniform vec3 uWallB;\nuniform vec3 uRivet;\nvarying float vKind;\nvarying float vZ;\nvarying float vShade;\nvarying vec3 vON;')
        .replace('#include <color_fragment>', `#include <color_fragment>
  float isCap = step(0.9, abs(vON.z));
  float isBev = step(0.2, vON.z) * (1.0 - isCap);
  vec3 nc = mix(mix(uWallB, uWallF, smoothstep(0.05, 0.95, vZ)), uBevel, isBev);
  nc = mix(nc, uCap * vShade, isCap);
  float isRivet = step(0.5, vKind) * (1.0 - step(1.5, vKind));
  nc = mix(nc, uRivet, isRivet);
  nc *= 1.0 - step(1.5, vKind);
  diffuseColor.rgb = nc;`)
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance *= step(1.5, vKind) * mix(vec3(1.0), vec3(1.75, 14.0, 8.0), step(2.5, vKind));');
    };
    return m;
  };
  const GM = { main: nameMat(), flicker: nameMat(), torn: nameMat() };
  const ND = 0.3, BT = 0.05, BS = 0.036;
  const EX = { depth: ND, bevelEnabled: true, bevelThickness: BT, bevelSize: BS, bevelOffset: -BS, bevelSegments: 1, curveSegments: 1, steps: 1 };
  const shear = (pts) => pts.map(([x, y]) => [x + SHEAR * y, y]);
  const tag = (g, kind) => {
    const n = g.attributes.position.count, z = g.attributes.position;
    const kk = new Float32Array(n).fill(kind), zz = new Float32Array(n), sh = new Float32Array(n);
    for (let i = 0; i < n; i++) { zz[i] = clamp((z.getZ(i) + BT) / (ND + 2 * BT), 0, 1); sh[i] = lerp(0.78, 1.2, clamp(z.getY(i), 0, 1)); }
    g.setAttribute('aKind', new THREE.BufferAttribute(kk, 1));
    g.setAttribute('aZ', new THREE.BufferAttribute(zz, 1));
    g.setAttribute('aShade', new THREE.BufferAttribute(sh, 1));
    return g;
  };
  const prep = (g) => { const n = g.index ? g.toNonIndexed() : g; if (n !== g) g.dispose(); n.deleteAttribute('uv'); n.computeVertexNormals(); return n; };
  // two rivets per plate, in its top-left and bottom-right corners, where the plate is wide enough to take them
  function rivetSpots(pts) {
    const n = pts.length;
    const inside = (x, y) => { let c = false; for (let i = 0, j = n - 1; i < n; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
    const edgeD = (x, y) => {
      let m = Infinity;
      for (let i = 0, j = n - 1; i < n; j = i++) {
        const [ax, ay] = pts[j], [bx, by] = pts[i], ex = bx - ax, ey = by - ay;
        const t = clamp(((x - ax) * ex + (y - ay) * ey) / Math.max(1e-9, ex * ex + ey * ey), 0, 1);
        m = Math.min(m, Math.hypot(x - ax - ex * t, y - ay - ey * t));
      }
      return m;
    };
    let a = null, b = null, sa = -Infinity, sb = -Infinity;
    for (let y = 0; y <= 1.001; y += 0.02) for (let x = -0.05; x <= 1.2; x += 0.02) {
      if (!inside(x, y) || edgeD(x, y) < 0.095) continue;
      const s1 = -x + 1.5 * y, s2 = x - 1.5 * y;
      if (s1 > sa) { sa = s1; a = [x, y]; }
      if (s2 > sb) { sb = s2; b = [x, y]; }
    }
    if (!a) return [];
    return b && Math.hypot(a[0] - b[0], a[1] - b[1]) > 0.35 ? [a, b] : [a];
  }
  const GL = glyphs();
  const word = new THREE.Group(), wordIn = new THREE.Group();
  word.add(wordIn); scene.add(word);
  const plateList = [];
  {
    let x = 0;
    for (const ch of 'UNRULED') {
      const g = GL[ch];
      const list = g.plates.map(() => []);
      g.plates.forEach((pts0, pi) => {
        const pts = shear(pts0);
        list[pi].push(tag(prep(new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([px, py]) => new THREE.Vector2(px, py))), EX)), 0));
        for (const [rx, ry] of rivetSpots(pts)) {
          list[pi].push(tag(prep(new THREE.CylinderGeometry(0.04, 0.046, 0.03, 6).rotateX(Math.PI / 2).rotateZ(Math.PI / 6).translate(rx, ry, ND + BT + 0.004)), 1));
        }
      });
      // each seam: a deep red weld, and a narrower white-hot core standing a little proud of it
      const seamGeo = (pts, depth) => prep(new THREE.ExtrudeGeometry(new THREE.Shape(shear(pts).map(([px, py]) => new THREE.Vector2(px, py))), { depth, bevelEnabled: false, curveSegments: 1, steps: 1 }));
      for (const sm of g.seams) {
        list[sm.owner].push(tag(seamGeo(sm.pts, ND + BT - 0.045), 2));
        const xs = sm.pts.map((q) => q[0]), ys = sm.pts.map((q) => q[1]);
        const [xa, xb, ya, yb] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
        const across = xb - xa < yb - ya, ix = across ? 0.05 : 0.03, iy = across ? 0.03 : 0.05;
        list[sm.owner].push(tag(seamGeo([[xa + ix, ya + iy], [xb - ix, ya + iy], [xb - ix, yb - iy], [xa + ix, yb - iy]], ND + BT - 0.028), 3));
      }
      list.forEach((geos, pi) => {
        const geo = own(mergeGeometries(geos));
        geos.forEach((q) => q.dispose());
        geo.computeBoundingBox();
        const torn = g.torn === pi;
        const piv = torn ? new V(g.hinge[0] + SHEAR * g.hinge[1], g.hinge[1], 0) : geo.boundingBox.getCenter(new V()).setZ(0);
        geo.translate(-piv.x, -piv.y, 0);
        const mat = torn ? GM.torn : ch === 'D' ? GM.flicker : GM.main;
        const mesh = new THREE.Mesh(geo, mat);
        const pivot = new THREE.Group();
        pivot.add(mesh); wordIn.add(pivot);
        plateList.push({ pivot, mesh, bx: x + piv.x, by: piv.y, y: 0, vy: 0, z: 0, vz: 0, r: 0, vr: 0, rx: 0, vrx: 0, torn, kicks: [] });
      });
      x += g.w + TRACK;
    }
    const W = x - TRACK + SHEAR;
    for (const pl of plateList) { pl.bx -= W / 2; pl.by -= 0.5; }
    word.userData.w = W;
  }
  const torn = plateList.find((p) => p.torn);
  const TORN_REST = -0.3;
  torn.r = TORN_REST;
  const wordS = { y: 0, vy: 0, r: 0, vr: 0, ry: -0.3, rx: -0.2 };
  function kickWord(amp) {
    for (const pl of plateList) {
      const wx = pl.bx * word.scale.x + word.position.x;
      const delay = 0.02 + Math.abs(wx - ship.position.x) * 0.045 + rand() * 0.03;
      pl.kicks.push({ at: time + delay, a: amp * (0.7 + rand() * 0.6), s: rand() < 0.5 ? -1 : 1 });
    }
    wordS.vy -= amp * 1.4; wordS.vr += (rand() - 0.5) * amp * 2;
  }
  // the D's seams stutter now and then: two or three short blinks to ~40%
  function stutter(t) {
    const p = (t + 1.3) % 4.7, q = (t + 0.4) % 7.3;
    const win = (u) => (u < 0.09 || (u > 0.2 && u < 0.31) || (u > 0.44 && u < 0.52) ? 0.4 : 1);
    return p < 0.6 ? win(p) : q < 0.6 ? win(q) : 1;
  }

  // ---- the struggle
  let tugOut = 0;
  function go(phase, hov = 0) {
    S.phase = phase; S.pt = 0;
    if (phase === 'idle') { S.dur = lerp(1.6, 0.6, hov) * (0.8 + rand() * 0.4); S.over = false; S.power = 1; }
    else if (phase === 'wind') { S.rv[2] -= 0.6; S.rv[0] += (rand() - 0.5) * 0.6; }
    else if (phase === 'burn') {
      S.n++;
      S.power = S.over ? 1.6 : 1 + 0.3 * hov;
      S.dur = S.over ? 1.45 : 0.8 + rand() * 0.3;
      S.snapAt = S.over || S.n % 3 === 0 ? S.dur * (0.45 + rand() * 0.2) : null;
      S.snapDone = false;
      S.rv[2] += 1.6 * Math.min(S.power, 1.2); S.rv[0] += (rand() < 0.5 ? -1 : 1) * 1.4; S.rv[1] += (rand() - 0.5) * 1.2;
      for (const nz of nozzleW) for (let i = 0; i < 3; i++) {
        _b.set(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize().multiplyScalar(1.4 + rand() * 1.2).addScaledVector(nz.d, 2.2);
        emit(1, nz.p, _b, 0.016 + rand() * 0.01, 0.3 + rand() * 0.25);
      }
      kickCam(0.035 * S.power);
      kickWord(0.06 * S.power);
      tugOut = Math.max(tugOut, S.over ? 1 : 0.42 + 0.12 * hov);
    } else if (phase === 'recoil') {
      S.rv[2] -= 1.5; S.rv[1] += (rand() - 0.5) * 1.1; S.rv[0] -= (rand() - 0.5) * 1.6;
      kickWord(0.035);
    }
  }
  function kickCam(a) { camShakeV.add(_b.set(rand() - 0.5, rand() - 0.5, 0).normalize().multiplyScalar(a * 9)); }
  function overdrive() {
    if (S.over && (S.phase === 'burn' || S.phase === 'wind')) return;
    S.over = true;
    go(S.phase === 'burn' ? 'burn' : 'wind');
  }

  const acc = new V(), pull = new V();
  let accT = 0;
  function bandPull(d, endNode, hullLocal, rest, sign) {
    web.node(endNode, _a);
    _b.copy(hullLocal).applyMatrix4(ship.matrixWorld);
    const v = _a.sub(_b), L = v.length(), st = L - rest;
    if (st > 0) acc.addScaledVector(v, (st / L) * 5);
    return clamp(st / rest, 0, 1) * sign;
  }
  function step(h, hov) {
    time += h; S.pt += h;
    const flick = 0.5 + 0.5 * Math.sin(time * 2.3) * Math.sin(time * 5.1 + 1);
    const sway = Math.sin(time * 0.85) * 0.6 + Math.sin(time * 0.37 + 1) * 0.4;
    let thr = 0, glowT = 0.4, flameT = 0.3;
    switch (S.phase) {
      case 'idle':
        // straining against the threads, slowly: the engines push, ease, push
        thr = 0.22 + 0.16 * (0.5 + 0.5 * sway) + 0.06 * flick + 0.2 * hov;
        glowT = 0.45 + 0.12 * flick + 0.1 * sway + 0.25 * hov; flameT = 0.34 + 0.08 * flick + 0.1 * sway + 0.2 * hov;
        if (S.pt >= S.dur) go('wind', hov);
        break;
      case 'wind': {
        const u = Math.min(1, S.pt / 0.36);
        thr = -0.45 * Math.sin(Math.PI * u); glowT = 0.06; flameT = 0.05;
        if (u >= 1) go('burn', hov);
        break;
      }
      case 'burn': {
        const kick = Math.exp(-S.pt / 0.13);
        thr = S.power * (1 + 1.1 * kick + 0.16 * Math.sin(time * 41) * Math.sin(time * 11.3));
        glowT = 1 + 0.7 * kick; flameT = S.power * (1 + 0.55 * kick) * (0.92 + 0.08 * Math.sin(time * 37));
        if (!S.snapDone && S.snapAt != null && S.pt >= S.snapAt) { S.snapDone = true; doSnap(S.over ? 2 : 1); }
        if (S.pt >= S.dur) go('cut', hov);
        break;
      }
      case 'cut': {
        const u = Math.min(1, S.pt / 0.12);
        thr = S.power * (1 - u); glowT = 0.2; flameT = 0.12;
        if (u >= 1) go('recoil', hov);
        break;
      }
      case 'recoil': {
        const pop = Math.max(0, Math.sin(S.pt * 19)) ** 8 * (S.pt < 0.7 ? 1 : 0);
        thr = 0; glowT = 0.18 + 0.5 * pop; flameT = 0.14 + 0.3 * pop;
        if (S.pt >= 0.95) go('idle', hov);
        break;
      }
    }
    S.thr = thr;
    S.glow += (glowT - S.glow) * (glowT > S.glow ? 0.5 : 0.13);
    S.flame += (flameT - S.flame) * (flameT > S.flame ? 0.55 : 0.16);

    // forces: thrust along the nose, the web's springy hold (stiffening as it stretches), its threads' own pull,
    // the bands and the tethers
    acc.copy(FWD).multiplyScalar(thr * 12 * (1 + 0.3 * hov));
    acc.addScaledVector(UPv, 0.9 * sway);
    const r = S.off.length();
    acc.addScaledVector(S.off, -20 * (1 + 2.5 * r * r));
    acc.addScaledVector(S.vel, -3.2);
    pull.set(0, 0, 0);
    for (const hd of holds) pull.add(hd.handle.pull);
    acc.addScaledVector(pull, 0.8);
    for (const d of drapes) {
      d.stA = bandPull(d, d.A, d.strands[1][0], d.restA, 1);
      d.stB = bandPull(d, d.B, d.strands[1][d.strands[1].length - 1], d.restB, 1);
    }
    for (const tt of tethers) {
      if (tt.state !== 'held') continue;
      web.node(tt.node, _a);
      _b.subVectors(_a, tt.hold.world);
      const d = _b.length(), st = d - tt.rest;
      if (st > 0) acc.addScaledVector(_b, (st / d) * 6);
    }
    S.vel.addScaledVector(acc, h);
    S.off.addScaledVector(S.vel, h);

    // the hull rocks: kicked at each phase change, shaken while it burns, rearing and dipping with its speed
    const vU = S.vel.dot(UPv), vS = S.vel.dot(SIDE), vF = S.vel.dot(FWD);
    const shake = (S.phase === 'burn' ? S.power : 0.15 * thr) * (1 + 0.8 * hov);
    const tq = [
      1.4 * Math.sin(time * 0.9) + shake * 9 * Math.sin(time * 31) * Math.sin(time * 7.3),
      0.9 * Math.sin(time * 0.7 + 1) + shake * 5 * Math.sin(time * 23 + 1) + vS * 4,
      1.1 * sway + shake * 6 * Math.sin(time * 27 + 2) + vF * 3 - vU * 2,
    ];
    for (let i = 0; i < 3; i++) { S.rv[i] += (-55 * S.rot[i] - 3.4 * S.rv[i] + tq[i]) * h; S.rot[i] += S.rv[i] * h; }

    // exhaust: chunky, fewer, tumbling
    S.emitAcc += h * (S.phase === 'burn' ? 34 * S.flame : 3.5 * S.flame);
    while (S.emitAcc >= 1) {
      S.emitAcc -= 1;
      const i = rand() < 0.66 ? (rand() * 2) | 0 : 2 + ((rand() * 2) | 0), nz = nozzleW[i], main = NOZZLES[i].main;
      const burn = S.phase === 'burn';
      const sp = (burn ? 2.2 + 1.7 * Math.min(1.6, S.flame) : 1.1) * (0.75 + rand() * 0.5);
      _a.copy(nz.p).addScaledVector(nz.d, (burn ? 0.35 : 0.12) * S.flame + rand() * 0.08);
      _b.set(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(0.55).addScaledVector(nz.d, sp).addScaledVector(S.vel, 0.6);
      emit(0, _a, _b, (main ? 0.05 : 0.038) * (0.7 + rand() * 0.6) * (burn ? 1 : 0.7), 0.55 + rand() * 0.35);
    }
    stepChunks(h);

    // tethers
    for (const tt of tethers) {
      tt.t += h;
      if (tt.state === 'fly' && tt.t >= 0.26) {
        tt.state = 'held';
        web.node(tt.node, _a);
        tt.rest = _a.distanceTo(tt.hold.world) * 0.88;
        if (tt.mend >= 0) web.mend(tt.mend, 0.55);
        S.vel.addScaledVector(_b.subVectors(_a, tt.hold.world).normalize(), 1.1);
        S.rv[1] += (rand() - 0.5) * 2; S.rv[0] += (rand() - 0.5) * 2;
        web.pluck(tt.node, 0.06, 0.3);
        scraps(tt.hold.world, 6);
        kickCam(0.025);
      } else if (tt.state === 'snap' && tt.t >= 0.5) tt.state = 'off';
    }
    for (let i = pending.length - 1; i >= 0; i--) if (time >= pending[i].at) { const p = pending.splice(i, 1)[0]; shoot(p.thread, p.hold); }

    // the web breathes: a slow swell along its normal
    web.force(HUB.x, HUB.y, HUB.z, 0, 0, 0.55 * Math.sin(time * 1.25) + 0.3 * Math.sin(time * 0.53 + 2), R * 1.3);

    // the name: plates on stiff springs, kicked by each lurch; the torn bar swings on its hinge
    for (const pl of plateList) {
      while (pl.kicks.length && pl.kicks[0].at <= time) {
        const kk = pl.kicks.shift();
        pl.vy -= kk.a * 6; pl.vz += kk.a * 3; pl.vr += kk.s * kk.a * (pl.torn ? 40 : 6); pl.vrx += kk.a * 6;
        if (pl.torn && kk.a > 0.05) sparksAtHinge(4);
      }
      const rest = pl.torn ? TORN_REST + 0.05 * Math.sin(time * 1.3) : 0;
      const kT = pl.torn ? 26 : 300, cT = pl.torn ? 1.4 : 11;
      pl.vy += (-300 * pl.y - 11 * pl.vy) * h; pl.y += pl.vy * h;
      pl.vz += (-300 * pl.z - 11 * pl.vz) * h; pl.z += pl.vz * h;
      pl.vr += (-kT * (pl.r - rest) - cT * pl.vr) * h; pl.r += pl.vr * h;
      pl.vrx += (-240 * pl.rx - 10 * pl.vrx) * h; pl.rx += pl.vrx * h;
    }
    wordS.vy += (-90 * wordS.y - 6 * wordS.vy) * h; wordS.y += wordS.vy * h;
    wordS.vr += (-120 * wordS.r - 7 * wordS.vr) * h; wordS.r += wordS.vr * h;

    camShakeV.addScaledVector(camShake, -420 * h).multiplyScalar(Math.exp(-14 * h));
    camShake.addScaledVector(camShakeV, h);
    flash = Math.max(0, flash - h * 2.5);
  }
  function sparksAtHinge(n) {
    _a.set(torn.bx, torn.by, ND + BT).applyMatrix4(wordIn.matrixWorld);
    for (let i = 0; i < n; i++) emit(1, _a, _b.set((rand() - 0.3) * 1.6, rand() * 1.2 + 0.2, (rand() - 0.2) * 1.2), 0.016 + rand() * 0.01, 0.35 + rand() * 0.3);
  }

  // ---- framing: the ship high in the stage, the name low; tall stages pull the name up and grow the ship a little
  const VIEW = new V(0.0, 0.07, 1).normalize();
  const target = new V(), camBase = new V();
  let camD = 10;
  const NAME_Z = 0.9;
  function fit(w, h) {
    const a = w / Math.max(1, h);
    camera.aspect = a;
    const ty = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const tall = clamp((0.84 - a) / 0.15, 0, 1);
    camD = Math.max(2.12 / (ty * a), 2.42 / ty);
    const hh = camD * ty;
    ship.scale.setScalar(SHIP_SCALE * (1 + 0.12 * tall));
    target.set(HOME.x - 0.04, HOME.y - lerp(0.2, 0.17, tall) * hh, 0);
    const dn = camD - NAME_Z, hn = dn * ty;
    const sc = Math.min((0.91 * 2 * hn * a) / word.userData.w, 0.72);
    word.scale.setScalar(sc);
    // the word is turned, so its near (right) end draws bigger: nudge it left to sit centred; its foot at ~85%
    word.position.set(target.x - 0.045 * hn * a, target.y - 0.6 * hn, NAME_Z);
    camBase.copy(target).addScaledVector(VIEW, camD);
    camera.updateProjectionMatrix();
    if (exGlow) exGlow.position.set(word.position.x - 0.6, word.position.y + 0.5, NAME_Z + 0.5);
  }
  fit(400, 500);

  // ---- a lurch already under way: the still for t = 0 and reduced motion
  poseShip();
  {
    [3, 1].forEach((hi, kq) => {
      const hd = holds[hi], src = pickSource(hd);
      if (src < 0) return;
      const tt = tethers[kq];
      Object.assign(tt, { state: 'held', node: src, hold: hd, t: 1, mend: -1, since: -1 + kq });
      web.node(src, _a); tt.rest = _a.distanceTo(hd.world) * 0.94;
    });
  }
  go('burn'); S.n = 1; S.dur = 1.15; S.snapAt = null; tugOut = 0;
  for (let i = 0; i < 26; i++) { step(H, 0); poseShip(0.004); web.update(H); }

  // ---- per frame
  const _p = new V(), _fs = new V(), _fq = new THREE.Quaternion(), XA = new V(1, 0, 0);
  const strainCol = (st) => _c.set(0x606060).lerp(_c2.set(0xd0140f), clamp(st * 5, 0, 1)).getHex();
  function draw(dt, input, hov) {
    poseShip(S.phase === 'burn' && dt > 0 ? 0.006 * S.power : 0);
    // flames: three layers per engine, each flickering in length on its own
    const g = S.glow;
    flames.forEach((f, i) => {
      const fd = S.phase === 'wind' ? S.flame : Math.max(S.flame, 0.42);
      const base = fd * (f.main ? 0.72 : 0.56) + 0.06;
      const R0 = f.r * (0.66 + 0.3 * Math.min(1.4, fd));
      LAYERS.forEach((L, li) => {
        const fl = 1 + 0.12 * Math.sin(time * (31 + li * 9) + f.ph + li) + 0.08 * Math.sin(time * (57 + li * 13) + f.ph * 2);
        const len = Math.max(0.001, (base * L.len + (li === 2 ? 0.05 : 0.02)) * fl);
        _fq.setFromAxisAngle(XA, time * (7 + li * 3) + f.ph + li);
        _m4.compose(f.at, _fq, _fs.set(len, R0 * L.rad, R0 * L.rad));
        L.mesh.setMatrixAt(i, _m4);
      });
    });
    for (const L of LAYERS) L.mesh.instanceMatrix.needsUpdate = true;
    M.throat.color.setRGB(lerp(0.2, 1, Math.min(1, g)), lerp(0.01, 0.12, Math.min(1, g)) + Math.max(0, g - 1) * 0.3, 0.01 + Math.max(0, g - 1) * 0.08);
    coreMat.color.setRGB(1, lerp(0.35, 0.8, Math.min(1, g)) + Math.max(0, g - 1) * 0.3, lerp(0.12, 0.45, Math.min(1, g)) + Math.max(0, g - 1) * 0.4);
    M.lip.color.setRGB(1, lerp(0.22, 0.62, Math.min(1, g)) + Math.max(0, g - 1) * 0.4, lerp(0.06, 0.3, Math.min(1, g)) + Math.max(0, g - 1) * 0.5);
    burner.position.copy(nozzleW[0].p).lerp(nozzleW[1].p, 0.5).addScaledVector(nozzleW[0].d, 0.3);
    burner.intensity = 2 + 14 * g * g;
    exGlow.intensity = 0.9 * Math.max(0, g - 1.1) + 0.6 * flash;
    lamps.forEach((l) => { l.m.visible = reduced || Math.sin((time + l.ph) * 4.2) > 0.55; });

    // silk: bands ride the hull; tethers fly, hold and whip back
    drapes.forEach((d, di) => {
      web.node(d.A, _a); web.node(d.B, _b);
      const cA = strainCol(d.stA), cB = strainCol(d.stB);
      d.strands.forEach((pts, si) => {
        const base = DRAPE0 + (di * 3 + si) * 6;
        let prevX = _a.x, prevY = _a.y, prevZ = _a.z;
        pts.forEach((lp, m) => {
          _p.copy(lp).applyMatrix4(ship.matrixWorld);
          silk.set(base + m, prevX, prevY, prevZ, _p.x, _p.y, _p.z);
          prevX = _p.x; prevY = _p.y; prevZ = _p.z;
        });
        silk.set(base + pts.length, prevX, prevY, prevZ, _b.x, _b.y, _b.z);
        silk.style(base, { color: cA, width: si === 1 ? 0.016 : 0.011 });
        for (let m = 1; m < pts.length; m++) silk.style(base + m, { color: si === 1 ? 0xd6d6d6 : 0xb4b4b4, width: si === 1 ? 0.017 : 0.012 });
        silk.style(base + pts.length, { color: cB, width: si === 1 ? 0.016 : 0.011 });
      });
      if (dt > 0) {
        for (const [node, st] of [[d.A, d.stA], [d.B, d.stB]]) {
          if (st <= 0) continue;
          web.node(node, _a);
          _b.copy(ship.position).sub(_a).normalize();
          web.force(_a.x, _a.y, _a.z, _b.x * st * 26, _b.y * st * 26, _b.z * st * 26, 0.3);
        }
      }
    });
    glob.visible = false;
    for (const tt of tethers) {
      if (tt.state === 'off') { silk.hide(tt.slot); silk.hide(tt.slot + 1); continue; }
      web.node(tt.node, tt.src);
      const hp = tt.hold.world;
      if (tt.state === 'fly') {
        const u = Math.min(1, tt.t / 0.26), e = u * u;
        tt.tip.lerpVectors(tt.src, hp, e);
        silk.set(tt.slot, tt.src.x, tt.src.y, tt.src.z, tt.tip.x, tt.tip.y, tt.tip.z);
        silk.style(tt.slot, { color: 0x2e2e2e, width: 0.02 });
        silk.hide(tt.slot + 1);
        glob.visible = true; glob.position.copy(tt.tip); glob.scale.setScalar(0.035); glob.rotation.set(time * 9, time * 7, 0);
      } else if (tt.state === 'held') {
        // taut: straight and reddening with strain; slack: it sags
        const d = tt.src.distanceTo(hp), st = clamp((d - tt.rest) / tt.rest, 0, 1), sag = Math.max(0, tt.rest - d) * 0.6;
        _a.lerpVectors(tt.src, hp, 0.5); _a.y -= sag;
        silk.set(tt.slot, tt.src.x, tt.src.y, tt.src.z, _a.x, _a.y, _a.z);
        silk.set(tt.slot + 1, _a.x, _a.y, _a.z, hp.x, hp.y, hp.z);
        _c.set(0x2a2a2a).lerp(_c2.set(0xb3100f), clamp(st * 5, 0, 1));
        const w = 0.024 - 0.007 * clamp(st * 4, 0, 1);
        silk.style(tt.slot, { color: _c.getHex(), width: w }); silk.style(tt.slot + 1, { color: _c.getHex(), width: w });
        if (dt > 0) { _b.subVectors(hp, tt.src).normalize(); web.force(tt.src.x, tt.src.y, tt.src.z, _b.x * st * 30, _b.y * st * 30, _b.z * st * 30, 0.35); }
      } else {
        // snapped: both halves whip back to their ends, curling as they go
        const u = Math.min(1, tt.t / 0.5), e = 1 - (1 - u) ** 3, curl = Math.sin(Math.PI * u) * (1 - u) * 0.35;
        _b.subVectors(hp, tt.src).normalize();
        const px = -_b.y, py = _b.x;
        _a.lerpVectors(tt.brk, tt.src, e);
        silk.set(tt.slot, tt.src.x, tt.src.y, tt.src.z, _a.x + px * curl, _a.y + py * curl - 0.1 * Math.sin(Math.PI * u), _a.z);
        _a.lerpVectors(tt.brk, hp, e);
        silk.set(tt.slot + 1, hp.x, hp.y, hp.z, _a.x - px * curl, _a.y - py * curl - 0.1 * Math.sin(Math.PI * u), _a.z);
        silk.style(tt.slot, { color: 0x2e2e2e, width: 0.018 }); silk.style(tt.slot + 1, { color: 0x2e2e2e, width: 0.018 });
      }
    }
    silk.commit();
    if (input.inside && !reduced && web.planePoint(camera, input.x, input.y, _p)) web.poke(_p.x, _p.y, _p.z, 0.4, 0.9, { mode: 'normal' });
    web.update(dt);
    drawChunks();

    // the name: the hot seams follow the engines; the D's stutter; the torn bar sputters
    const hot = clamp((g - 0.4) / 1.0, 0, 1) + 0.6 * flash, hc = Math.min(1, hot);
    for (const m of [GM.main, GM.flicker, GM.torn]) m.emissive.setRGB(lerp(0.74, 1, hc), lerp(0.06, 0.3, hc), lerp(0.045, 0.1, hc), THREE.SRGBColorSpace);
    const heat = 1 + 0.45 * hot;
    GM.main.emissiveIntensity = heat;
    GM.flicker.emissiveIntensity = heat * (reduced ? 1 : stutter(time));
    GM.torn.emissiveIntensity = heat * (reduced ? 1 : 0.55 + 0.45 * Math.abs(Math.sin(time * 9.1 + Math.sin(time * 2.3) * 3)));
    for (const pl of plateList) {
      pl.pivot.position.set(pl.bx, pl.by + pl.y * 0.6, pl.z * 0.5);
      pl.pivot.rotation.set(pl.rx * 0.5, 0, pl.r);
    }
    const hv = reduced ? 0 : hov;
    wordS.ry += ((0.2 * clamp(input.x, -1, 1) * hv - 0.3) - wordS.ry) * 0.08;
    wordS.rx += ((-0.1 * clamp(input.y + 0.5, -1, 1) * hv - 0.2) - wordS.rx) * 0.08;
    word.rotation.set(wordS.rx, wordS.ry, wordS.r * 0.4);
    wordIn.position.y = wordS.y * 0.5 + 0.012 * Math.sin(time * 1.2);

    // camera
    camera.position.copy(camBase).add(camShake);
    camera.position.x += 0.06 * Math.sin(time * 0.21) + 0.22 * clamp(input.x, -1, 1) * hv;
    camera.position.y += 0.04 * Math.sin(time * 0.17) + 0.12 * clamp(input.y, -1, 1) * hv;
    camera.lookAt(target);

    // the page's web feels the big lurches: a normal burst tugs it gently, a snap or an all-out burst hard
    if (dt > 0 && input.rect) {
      let mx = 0;
      for (const hd of holds) mx = Math.max(mx, hd.handle.strain);
      // while it burns: a steady shudder (a normal burst stays under the spider's notice; an all-out one does not)
      const live = S.phase === 'burn' ? clamp((S.over ? 0.75 : 0.14) + mx * (S.over ? 0.8 : 0.4), 0, S.over ? 1 : 0.28) : 0;
      const sNow = Math.max(tugOut, live * (S.pt < 0.5 ? 1 : 0.7));
      if (sNow > 0.05 && (tugOut > 0 || Math.round(time * 60) % 6 === 0)) {
        _p.copy(ship.position).project(camera);
        stage.emit('tug', { strength: sNow, x: input.rect.left + ((_p.x + 1) / 2) * input.vw, y: input.rect.top + ((1 - _p.y) / 2) * input.vh });
      }
      tugOut = 0;
    }
  }

  const idle = { x: 0, y: 0, hover: 0, inside: false, clicked: false };
  return {
    scene, camera,
    resize(w, h) { fit(w, h); },
    update(dt, t, input = idle) {
      const hov = reduced ? 0 : input.hover;
      if (input.clicked && dt > 0) overdrive();
      if (dt > 0) {
        accT = Math.min(accT + dt, 0.1);
        while (accT >= H - 1e-6) { accT -= H; step(H, hov); }
      }
      draw(dt, input, hov);
    },
    dispose() {
      web.dispose(); silk.dispose();
      owned.forEach((q) => q.dispose());
      Object.values(M).forEach((m) => m.dispose());
      Object.values(GM).forEach((m) => m.dispose());
      coreMat.dispose();
      glob.material.dispose();
      chunks.dispose();
      LAYERS.forEach((L) => L.mesh.dispose());
      scene.clear();
    },
  };
}
