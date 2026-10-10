// The testers' corner on the home page: a low-poly gremlin of a gamer, hunched at his desk in a racing chair, red
// headphones on, playing on a chunky CRT, a Game Boy by his hand. Seen from his right, a little in front: his profile
// (the long hooked nose, the big eye, the bat ear) lit by the screen, and the screen itself, swivelled toward us.
// The screen runs a little pixel-art game of the studio's (a paper ball at a black bin with red eyes, a pool shot on the
// 8, a stock chart), and every game goes wrong: the ball rims out and the bin laughs, the 8 rattles in the jaws and the
// cue ball drops (FOUL), the chart climbs and climbs and the floor drops out (-99%). He plays along (WASD mashing, the
// mouse hand pulling back with the cue and flicking the throws, leaning in, nodding to his music), tension building.
// Then he loses it, a different rage each loop:
//   A) he stares, the fist coiled, rears back, and PUNCHES THE SCREEN (arm straight, head held back): it cracks and
//      dies, a fireball bursts out of it (faceted white-hot/orange/red shards, expanding, turning to black smoke),
//      sparks, glass and keycaps rain onto the desk, the blast throws him back in his chair, sooty, and the dead CRT
//      pours smoke (and sputters). He sits there, breathing hard, coughs a puff. A NEW MONITOR SLAMS DOWN on the old one
//      and pancakes it, boots, he rolls back to the desk.
//   B) the computer burns him, he grabs the GAME BOY instead (a big cartoon brick), plays it out over the desk, loses
//      again (the tiny screen blinks X), stares, cocks it high in his fist and HURLS it onto our end of the desk, clear
//      of his head: it bursts (a fireball as big as A's, smoke, the shells, the battery cover, the AAs, the red A/B
//      buttons thrown up high and raining back onto the desk). Glaring at the bits. A fresh Game Boy drops onto its
//      spot, the bits vanish in the clearing smoke.
// Comic timing in each: anticipation (the stare, the wind-up), impact (a tug on the page's web, a camera kick), hold,
// aftermath, a clean reset. Hover: he slowly turns his head to glare at you, annoyed at being watched, then back.
// Click: the next rage right now (during the aftermath: hurry the reset, the next one rages straight away).
// Reduced motion / t = 0: the shot rimmed out (MISS, the bin laughing), he glares, the fist coiled: about to lose it.
// Smoke: puffs are clusters of faceted blobs, darker underneath, that swell and thin out (per-puff alpha, drawn back to
// front); smoke, sparks, flames and the flash all fade or shrink before the box's edges, which are invisible on the page.
import { ConvexGeometry } from '/assets/vendor/three/addons/geometries/ConvexGeometry.js';
import { mergeGeometries } from '/assets/vendor/three/addons/utils/BufferGeometryUtils.js';

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const H = 1 / 60;

/** A small seeded random, so every loop (and every screenshot) is the same. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- the screen: 32 x 24 chunky game pixels, drawn x3 with scanlines
const SW = 32, SH = 24, SX = 3;
const FONT = {
  0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001',
  5: '111100111001111', 6: '111100111101111', 7: '111001001001001', 8: '111101111101111', 9: '111101111001111',
  A: '010101111101101', F: '111100110100100', H: '101101111101101', I: '111010010010111', L: '100100100100111',
  M: '101111111101101', O: '010101101101010', S: '011100010001110', U: '101101101101111', X: '101101010101101',
  '!': '010010010000010', '+': '000010111010000', '-': '000000111000000', '%': '101001010100101',
  $: '011110010011110', ' ': '000000000000000',
};

/** A spring on one value: k stiffness, z damping ratio (below 1 it overshoots: weight). */
function spring(x, k, z) {
  return {
    x, v: 0, to: x, k, z,
    step(h) { this.v += (this.k * (this.to - this.x) - 2 * this.z * Math.sqrt(this.k) * this.v) * h; this.x += this.v * h; },
    set(k, z) { this.k = k; this.z = z; },
  };
}

export async function create({ THREE, stage, reduced }) {
  const V = THREE.Vector3, Q = THREE.Quaternion;
  const scene = new THREE.Scene();
  scene.background = null;
  const camera = new THREE.PerspectiveCamera(24, 1.37, 0.1, 60);
  const rand = rng(1907);

  // ---- light: a white key from our upper left, a cool fill, a rim from behind; the screen's own coloured light on
  // his face, hands and the desk; the Game Boy's little green glow; the explosion's flash
  scene.add(new THREE.HemisphereLight(0xffffff, 0x262626, 1.05));
  const key = new THREE.DirectionalLight(0xffffff, 1.9); key.position.set(-2.2, 4.2, 3.2); scene.add(key);
  const fill = new THREE.DirectionalLight(0xe4e8ee, 0.55); fill.position.set(2.5, 1.2, 4); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 1.3); rim.position.set(1.5, 3, -4); scene.add(rim);
  // the screen's light is short and soft: it catches the front of his face and his hands, never floods the set
  const glowL = new THREE.PointLight(0x22c46a, 0, 0.85, 2); scene.add(glowL);
  const gbL = new THREE.PointLight(0x9bbc0f, 0, 0.45, 2); scene.add(gbL);
  const GLOW_I = 0.28, GB_I = 0.05;
  const boomL = new THREE.PointLight(0xff7a22, 0, 1.3, 1.6); scene.add(boomL);

  // ---- materials
  const std = (color, roughness = 0.55, metalness = 0.05, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true, ...extra });
  const SKIN = new THREE.Color(0xc2bcae), SKIND = new THREE.Color(0x7f7a70), SOOT = new THREE.Color(0x4a4542), SOOTD = new THREE.Color(0x2a2624);
  const M = {
    ink: std(0x161616, 0.62),
    hood: std(0x1a1a1a, 0.8),
    ink2: std(0x1c1c1c, 0.45, 0.1),
    graphite: std(0x2c2e32, 0.6),
    gun: std(0x44484e, 0.38, 0.5),
    bone: std(0xe6e2d8, 0.55),
    gb: std(0xcfcbc0, 0.5),
    gb2: std(0xb9b5aa, 0.55),
    skin: std(SKIN.getHex(), 0.7),
    skinD: std(SKIND.getHex(), 0.8),
    eye: new THREE.MeshBasicMaterial({ color: 0xeeeae0, toneMapped: false }),
    dark: std(0x070707, 0.9),
    red: std(0x7c080b, 0.45, 0.1),
    glass: std(0xc9d2d2, 0.12, 0.25),
    led: new THREE.MeshBasicMaterial({ color: 0xff2414, toneMapped: false }),
    keys: std(0xffffff, 0.5),
    off: new THREE.MeshBasicMaterial({ color: 0x0b0d0c, toneMapped: false }),
    lcdDead: new THREE.MeshBasicMaterial({ color: 0x23301c, toneMapped: false }),
  };

  // ---- geometry helpers
  const owned = [];
  const own = (g) => { owned.push(g); return g; };
  const P3 = (p) => (p.isVector3 ? p : new V(p[0], p[1], p[2]));
  const hull = (pts) => new ConvexGeometry(pts.map(P3));
  const sym = (pts) => pts.flatMap((p) => (p[2] ? [p, [p[0], p[1], -p[2]]] : [p]));
  const clean = (g) => {
    const n = g.index ? g.toNonIndexed() : g;
    if (n !== g) g.dispose();
    for (const a of Object.keys(n.attributes)) if (a !== 'position' && a !== 'normal') n.deleteAttribute(a);
    n.computeVertexNormals();
    return n;
  };
  const xf = (pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) => new THREE.Matrix4().compose(new V(...pos), new Q().setFromEuler(new THREE.Euler(...rot)), new V(...scl));
  const box = (w, h, d, pos, rot) => new THREE.BoxGeometry(w, h, d).applyMatrix4(xf(pos, rot));
  /** A slab with chamfered edges: x0..x1, y0..y1, z0..z1, chamfer c. */
  const slab = (x0, x1, y0, y1, z0, z1, c = 0.01) => hull([
    [x0 + c, y0, z0 + c], [x1 - c, y0, z0 + c], [x0 + c, y0, z1 - c], [x1 - c, y0, z1 - c],
    [x0 + c, y1, z0 + c], [x1 - c, y1, z0 + c], [x0 + c, y1, z1 - c], [x1 - c, y1, z1 - c],
    [x0, y0 + c, z0 + c], [x0, y1 - c, z0 + c], [x0, y0 + c, z1 - c], [x0, y1 - c, z1 - c],
    [x1, y0 + c, z0 + c], [x1, y1 - c, z0 + c], [x1, y0 + c, z1 - c], [x1, y1 - c, z1 - c],
    [x0 + c, y0 + c, z0], [x1 - c, y0 + c, z0], [x0 + c, y1 - c, z0], [x1 - c, y1 - c, z0],
    [x0 + c, y0 + c, z1], [x1 - c, y0 + c, z1], [x0 + c, y1 - c, z1], [x1 - c, y1 - c, z1],
  ]);
  /** Collects pieces per material, merges them into one geometry per material. */
  function kit() {
    const parts = {};
    return {
      add(g, mat, m) { if (m) g.applyMatrix4(m); (parts[mat] ??= []).push(clean(g)); return this; },
      geos() {
        return Object.entries(parts).map(([mat, list]) => { const g = own(mergeGeometries(list)); list.forEach((x) => x.dispose()); return [g, mat]; });
      },
      build(group = new THREE.Group()) { for (const [g, mat] of this.geos()) group.add(new THREE.Mesh(g, M[mat])); return group; },
    };
  }
  const inst = (geos, group = new THREE.Group()) => { for (const [g, mat] of geos) group.add(new THREE.Mesh(g, M[mat])); return group; };

  // ---- faked contact shadows: one soft radial texture
  const textures = [];
  const cv = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; textures.push(t); return t; };
  const blobTex = cv(128, 128, (g) => {
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    [[0, 1], [0.2, 0.8], [0.45, 0.4], [0.7, 0.12], [1, 0]].forEach(([s, a]) => r.addColorStop(s, `rgba(0,0,0,${a})`));
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  });
  const flat = own(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2));
  const extraMats = [];
  const blob = (parent, x, y, z, sx, sz, opacity) => {
    const m = new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, opacity, toneMapped: false });
    extraMats.push(m);
    const s = new THREE.Mesh(flat, m); s.position.set(x, y, z); s.scale.set(sx, 1, sz); s.renderOrder = -1; parent.add(s);
    return s;
  };

  // =====================================================================================================================
  // The set. World units ~ metres. Origin on the floor under the chair; +x toward the desk (his forward), +z his right
  // (our side), +y up.
  const DESK_Y = 0.74, DX0 = 0.42, DX1 = 1.02, DZ = 0.6;
  const PAD = { x: 0.62, z: 0.25 };

  // ---- the desk
  const desk = new THREE.Group(); scene.add(desk);
  {
    const k = kit();
    k.add(slab(DX0, DX1, DESK_Y - 0.045, DESK_Y, -DZ, DZ, 0.012), 'ink2');
    k.add(box(0.006, 0.012, 2 * DZ - 0.03, [DX0 - 0.001, DESK_Y - 0.016, 0]), 'bone');            // a bone edge band
    k.add(box(DX1 - DX0 - 0.03, 0.012, 0.006, [(DX0 + DX1) / 2, DESK_Y - 0.016, DZ + 0.001]), 'bone');
    for (const [x, z] of [[DX0 + 0.05, -DZ + 0.05], [DX0 + 0.05, DZ - 0.05], [DX1 - 0.05, -DZ + 0.05], [DX1 - 0.05, DZ - 0.05]]) {
      k.add(box(0.045, DESK_Y - 0.045, 0.045, [x, (DESK_Y - 0.045) / 2, z]), 'gun');
      k.add(box(0.07, 0.012, 0.07, [x, 0.006, z]), 'ink');
    }
    k.add(box(0.03, 0.05, 2 * DZ - 0.1, [DX1 - 0.05, DESK_Y - 0.07, 0]), 'gun');                 // a back rail
    k.add(box(DX1 - DX0 - 0.1, 0.05, 0.03, [(DX0 + DX1) / 2, DESK_Y - 0.07, DZ - 0.05]), 'gun');
    k.add(slab(PAD.x - 0.12, PAD.x + 0.12, DESK_Y, DESK_Y + 0.004, PAD.z - 0.12, PAD.z + 0.12, 0.003), 'graphite');   // the mouse pad
    k.build(desk);
  }

  // ---- the monitor: a chunky CRT, a deep tapered back, a thick bezel; swivelled toward us. Two of them share the
  // geometry: one on the desk, one waiting to drop in when the first is smashed.
  const SCR_W = 0.4, SCR_H = 0.3, MON_TOP = 0.445;
  const MON = { x: 0.78, z: -0.08, yaw: 0.98 };                // cheated toward us: we see the game, he still sees it
  const SCR_C = new V(-0.04, 0.27, 0);                       // screen centre, monitor space (it faces -x)
  const monGeos = (() => {
    const k = kit();
    k.add(hull(sym([[-0.09, 0, 0.11], [0.09, 0, 0.11], [-0.1, 0.012, 0.12], [0.1, 0.012, 0.12], [-0.09, 0.024, 0.1], [0.09, 0.024, 0.1]])), 'gun');
    k.add(box(0.05, 0.1, 0.07, [0.02, 0.06, 0], [0, 0, 0.12]), 'gun');
    k.add(slab(-0.06, 0.0, 0.095, MON_TOP, -0.245, 0.245, 0.018), 'ink');
    k.add(hull(sym([[-0.01, 0.105, 0.235], [-0.01, 0.435, 0.235], [0.2, 0.17, 0.14], [0.2, 0.39, 0.14], [0.24, 0.2, 0.11], [0.24, 0.36, 0.11]])), 'ink');
    for (let i = 0; i < 4; i++) k.add(box(0.012, 0.008, 0.18, [0.11 + i * 0.025, 0.4 - i * 0.012, 0], [0, 0, -0.3]), 'graphite');   // vents
    k.add(box(0.01, 0.008, 0.02, [-0.061, 0.11, -0.2]), 'led');                // power LED
    k.add(box(0.004, 0.006, 0.07, [-0.062, 0.11, 0.15]), 'bone');              // a badge
    k.add(box(0.004, 0.012, 0.42, [-0.061, 0.433, 0]), 'graphite');            // the bezel's lip
    return k.geos();
  })();
  const scrGeo = own(new THREE.PlaneGeometry(SCR_W, SCR_H));
  function makeMonitor() {
    const root = new THREE.Group(); root.position.set(MON.x, DESK_Y, MON.z); root.rotation.y = MON.yaw; scene.add(root);
    const body = new THREE.Group(); root.add(body);
    inst(monGeos, body);
    const screen = new THREE.Mesh(scrGeo, M.off);
    screen.rotation.y = -Math.PI / 2; screen.position.copy(SCR_C).setX(-0.0615);
    body.add(screen);
    const shadow = blob(root, 0.06, 0.002, 0, 0.42, 0.62, 0.5);
    return { root, body, screen, shadow, state: 'live', drop: 0, vy: 0, landT: -1, wait: 0, pop: 1, tilt: spring(0, 160, 0.22), knock: spring(0, 120, 0.3), squash: spring(1, 500, 0.35) };
  }
  let DROP_H = 0.3;                                                          // where a new monitor pops in (under the frame's top)
  const mons = [makeMonitor(), makeMonitor()];
  mons[1].root.visible = false; mons[1].state = 'gone';
  let monI = 0;

  // ---- the keyboard: black base, bone keycaps (one instanced batch), WASD in red
  const KB = { x: 0.565, z: -0.04, yaw: 0.06 };
  const keyboard = new THREE.Group(); keyboard.position.set(KB.x, DESK_Y, KB.z); keyboard.rotation.y = KB.yaw; scene.add(keyboard);
  kit().add(hull(sym([[-0.085, 0, 0.235], [0.085, 0, 0.235], [-0.085, 0.016, 0.235], [0.085, 0.026, 0.235], [-0.08, 0.02, 0.24], [0.08, 0.03, 0.24]])), 'ink').build(keyboard);
  const KP = 0.031, KCOLS = 14, KROWS = 4;
  const keyList = [];
  for (let r = 0; r < KROWS; r++) for (let c = 0; c < KCOLS - (r === 3 ? 1 : 0); c++) {
    const x = 0.05 - r * KP, z = -0.2 + (c + (r === 3 ? 0.5 : r * 0.18)) * KP;
    keyList.push({ x, z, y: 0.032 - r * 0.0028, sw: 1, r, c });
  }
  keyList.push({ x: 0.05 - 4 * KP, z: 0.0, y: 0.032 - 4 * 0.0028, sw: 6.2, r: 4, c: 6 });   // space bar
  const keyGeo = own(new THREE.BoxGeometry(0.025, 0.014, 0.025));
  const keys = new THREE.InstancedMesh(keyGeo, M.keys, keyList.length);
  keyboard.add(keys);
  const KEY_RED = new THREE.Color(0x9a0c10), KEY_BONE = new THREE.Color(0xe6e2d8), KEY_DARK = new THREE.Color(0x3a3c40);
  const isW = (k) => k.r === 1 && k.c === 2, isASD = (k) => k.r === 2 && k.c >= 1 && k.c <= 3;
  keyList.forEach((k, i) => {
    k.press = 0; k.hop = 0; k.vh = 0; k.gone = false;
    k.col = isW(k) || isASD(k) ? KEY_RED : k.c === 0 || k.c === KCOLS - 1 || k.r === 4 ? KEY_DARK : KEY_BONE;
    keys.setColorAt(i, k.col);
  });
  const WASD = [keyList.findIndex(isW), ...keyList.map((k, i) => (isASD(k) ? i : -1)).filter((i) => i >= 0)];
  const _m4 = new THREE.Matrix4(), _q = new Q(), _q2 = new Q(), _s = new V(), _p = new V(), _a = new V(), _b = new V(), _c = new V(), _d = new V(), _dir = new V();
  function drawKeys() {
    keyList.forEach((k, i) => {
      _m4.compose(_p.set(k.x, k.y - 0.006 * k.press + k.hop, k.z), _q.identity(), k.gone ? _s.set(0, 0, 0) : _s.set(1, 1, k.sw));
      keys.setMatrixAt(i, _m4);
    });
    keys.instanceMatrix.needsUpdate = true;
  }

  // ---- the mouse pad, the mouse

  const mouse = new THREE.Group(); scene.add(mouse);
  kit()
    .add(hull(sym([[-0.05, 0, 0.025], [0.05, 0, 0.022], [-0.045, 0.022, 0.022], [0.03, 0.03, 0.018], [0.05, 0.012, 0.016], [-0.02, 0.036, 0.012], [0.055, 0.004, 0]])), 'ink')
    .add(box(0.03, 0.006, 0.008, [0.03, 0.033, 0]), 'led')
    .add(box(0.07, 0.004, 0.003, [-0.01, 0.02, 0.026]), 'red')
    .build(mouse);
  const MOUSE0 = new V(PAD.x - 0.02, DESK_Y + 0.004, PAD.z - 0.02);
  mouse.position.copy(MOUSE0);

  // ---- the Game Boy: a portrait brick, bone shell, the rounded bottom-right corner, a dark bezel round a pea-green LCD,
  // a black D-pad, red A/B. Built as parts (each centred on itself) so it can burst: the intact one is a group of them,
  // the debris is a second set of meshes sharing the geometry. Its frame: x across, y up the face, z out of the screen.
  const gbCanvas = document.createElement('canvas'); gbCanvas.width = 20; gbCanvas.height = 18;
  const gg = gbCanvas.getContext('2d');
  const gbTex = new THREE.CanvasTexture(gbCanvas); textures.push(gbTex);
  gbTex.colorSpace = THREE.SRGBColorSpace; gbTex.magFilter = THREE.NearestFilter; gbTex.minFilter = THREE.NearestFilter; gbTex.generateMipmaps = false;
  M.lcd = new THREE.MeshBasicMaterial({ map: gbTex, toneMapped: false });
  const GB_T = 0.032;
  const gbOutline = (z, e) => {
    const c = 0.007, k = 0.03, x0 = -0.045 + e, x1 = 0.045 - e, y0 = -0.074 + e, y1 = 0.074 - e;
    return [[x0 + c, y1], [x1 - c, y1], [x1, y1 - c], [x1, y0 + k], [x1 - k, y0], [x0 + c, y0], [x0, y0 + c], [x0, y1 - c]].map(([x, y]) => [x, y, z]);
  };
  const gbShell = (z0, z1) => hull([...gbOutline(z0, 0.003), ...gbOutline(z0 + 0.003, 0), ...gbOutline(z1 - 0.003, 0), ...gbOutline(z1, 0.003)]);
  const GBS = 1.5;                                                           // a cartoon brick: big enough to read at stage size
  const gbParts = (() => {
    const part = (name, build, r, flatAxis) => {
      let geos;
      if (typeof build === 'function') { const k = kit(); build(k); geos = k.geos(); } else geos = build;
      const bb = new THREE.Box3();
      geos.forEach(([g]) => { g.scale(GBS, GBS, GBS); g.computeBoundingBox(); bb.union(g.boundingBox); });
      const ctr = bb.getCenter(new V());
      geos.forEach(([g]) => g.translate(-ctr.x, -ctr.y, -ctr.z));
      return { name, geos, at: ctr, r: r * GBS, flat: flatAxis };
    };
    const Z = new V(0, 0, 1);
    return [
      part('front', (k) => {
        k.add(gbShell(0, GB_T / 2), 'gb');
        k.add(slab(-0.037, 0.037, 0.004, 0.066, GB_T / 2 - 0.001, GB_T / 2 + 0.0025, 0.004), 'graphite');
        k.add(box(0.005, 0.005, 0.002, [-0.031, 0.044, GB_T / 2 + 0.003]), 'led');
        k.add(box(0.014, 0.004, 0.003, [-0.008, -0.052, GB_T / 2 + 0.0015], [0, 0, 0.5]), 'graphite');
        k.add(box(0.014, 0.004, 0.003, [0.009, -0.052, GB_T / 2 + 0.0015], [0, 0, 0.5]), 'graphite');
        for (let i = 0; i < 5; i++) k.add(box(0.003, 0.02, 0.002, [0.02 + i * 0.006, -0.058 + i * 0.002, GB_T / 2 + 0.001], [0, 0, 0.5]), 'graphite');
        k.add(box(0.07, 0.003, 0.002, [0, 0.07, GB_T / 2 + 0.0008]), 'graphite');
      }, 0.008, Z),
      part('lcd', [[own(new THREE.PlaneGeometry(0.044, 0.04).translate(0, 0.035, GB_T / 2 + 0.0027)), 'lcd']], 0.004, Z),
      part('back', (k) => k.add(gbShell(-GB_T / 2, 0), 'gb2'), 0.008, Z),
      part('cover', (k) => k.add(slab(-0.03, 0.03, -0.062, -0.006, -GB_T / 2 - 0.004, -GB_T / 2 + 0.001, 0.003), 'gb2'), 0.003, Z),
      part('dpad', (k) => { k.add(box(0.026, 0.0085, 0.006, [-0.022, -0.022, GB_T / 2 + 0.002]), 'ink'); k.add(box(0.0085, 0.026, 0.006, [-0.022, -0.022, GB_T / 2 + 0.002]), 'ink'); }, 0.004, Z),
      part('btnA', (k) => k.add(new THREE.CylinderGeometry(0.0078, 0.0078, 0.007, 8), 'red', xf([0.026, -0.015, GB_T / 2 + 0.002], [Math.PI / 2, 0, 0])), 0.004, Z),
      part('btnB', (k) => k.add(new THREE.CylinderGeometry(0.0078, 0.0078, 0.007, 8), 'red', xf([0.009, -0.025, GB_T / 2 + 0.002], [Math.PI / 2, 0, 0])), 0.004, Z),
      part('bat1', (k) => { k.add(new THREE.CylinderGeometry(0.0072, 0.0072, 0.046, 7), 'ink', xf([-0.011, -0.034, -0.006])); k.add(new THREE.CylinderGeometry(0.0073, 0.0073, 0.012, 7), 'bone', xf([-0.011, -0.016, -0.006])); }, 0.0072, null),
      part('bat2', (k) => { k.add(new THREE.CylinderGeometry(0.0072, 0.0072, 0.046, 7), 'ink', xf([0.011, -0.034, -0.006])); k.add(new THREE.CylinderGeometry(0.0073, 0.0073, 0.012, 7), 'bone', xf([0.011, -0.016, -0.006])); }, 0.0072, null),
    ];
  })();
  const gb = new THREE.Group(); scene.add(gb);
  const gbPer = {};
  gbParts.forEach((pt) => {
    if (pt.name.startsWith('bat')) return;                                   // inside: only seen when it bursts
    for (const [g, mat] of pt.geos) (gbPer[mat] ??= []).push(g.clone().translate(pt.at.x, pt.at.y, pt.at.z));
  });
  for (const [mat, list] of Object.entries(gbPer)) { gb.add(new THREE.Mesh(own(mergeGeometries(list)), M[mat])); list.forEach((x) => x.dispose()); }
  const GB_HOME = new V(0.57, DESK_Y + (GB_T * GBS) / 2, 0.44);
  const GB_HOME_Q = new Q().setFromEuler(new THREE.Euler(-Math.PI / 2, -Math.PI / 2 + 0.35, 0, 'YXZ'));
  gb.position.copy(GB_HOME); gb.quaternion.copy(GB_HOME_Q);
  const gbShadow = blob(scene, GB_HOME.x, DESK_Y + 0.002, GB_HOME.z, 0.26, 0.26, 0.45);

  // ---- an energy can, two paper balls
  const can = new THREE.Group(); can.position.set(0.94, DESK_Y, -0.42); scene.add(can);
  kit()
    .add(new THREE.CylinderGeometry(0.032, 0.032, 0.12, 8), 'ink', xf([0, 0.064, 0]))
    .add(new THREE.CylinderGeometry(0.026, 0.032, 0.008, 8), 'gun', xf([0, 0.128, 0]))
    .add(new THREE.CylinderGeometry(0.0325, 0.0325, 0.03, 8), 'bone', xf([0, 0.07, 0]))
    .add(new THREE.CylinderGeometry(0.028, 0.032, 0.006, 8), 'gun', xf([0, 0.003, 0]))
    .build(can);
  const paperGeo = own(clean(new THREE.IcosahedronGeometry(0.026, 0)));
  const papers = [[0.95, 0.3, 0.2], [0.68, -0.5, -0.9]].map(([x, z, r]) => {
    const m = new THREE.Mesh(paperGeo, M.bone); m.position.set(x, DESK_Y + 0.022, z); m.rotation.set(r, r * 2, 0.3); scene.add(m);
    return { m, y0: DESK_Y + 0.022, hop: 0, vh: 0 };
  });

  // ---- the chair: a five-star base on casters, the lift, a racing seat and back with bone piping; the top swivels and
  // tilts, the whole chair rolls
  const chairBase = new THREE.Group(); scene.add(chairBase);
  const chairTop = new THREE.Group(); chairTop.position.set(0, 0.4, 0); chairTop.rotation.order = 'YZX'; chairBase.add(chairTop);
  {
    const k = kit();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3, c = Math.cos(a), s = Math.sin(a);
      k.add(hull([[0.03 * -s, 0.07, 0.03 * c], [-0.03 * -s, 0.07, -0.03 * c], [0.3 * c + 0.018 * -s, 0.05, 0.3 * s + 0.018 * c], [0.3 * c - 0.018 * -s, 0.05, 0.3 * s - 0.018 * c],
        [0.03 * -s, 0.1, 0.03 * c], [-0.03 * -s, 0.1, -0.03 * c], [0.3 * c, 0.07, 0.3 * s]]), 'ink');
      k.add(hull([[0.3 * c - 0.025, 0.0, 0.3 * s - 0.012], [0.3 * c + 0.025, 0.0, 0.3 * s - 0.012], [0.3 * c - 0.025, 0.0, 0.3 * s + 0.012], [0.3 * c + 0.025, 0.0, 0.3 * s + 0.012],
        [0.3 * c - 0.02, 0.045, 0.3 * s - 0.014], [0.3 * c + 0.02, 0.045, 0.3 * s - 0.014], [0.3 * c - 0.02, 0.045, 0.3 * s + 0.014], [0.3 * c + 0.02, 0.045, 0.3 * s + 0.014]]), 'graphite');
    }
    k.add(new THREE.CylinderGeometry(0.05, 0.06, 0.06, 7), 'ink', xf([0, 0.1, 0]));
    k.add(new THREE.CylinderGeometry(0.024, 0.024, 0.28, 7), 'gun', xf([0, 0.26, 0]));
    k.build(chairBase);
  }
  {
    const k = kit();
    k.add(hull(sym([[-0.25, 0.03, 0.2], [0.21, 0.03, 0.19], [-0.25, 0.1, 0.23], [0.22, 0.09, 0.22], [0.25, 0.06, 0.2], [-0.2, 0.075, 0.12], [0.18, 0.068, 0.12]])), 'ink');
    k.add(hull(sym([[-0.24, 0.02, 0.17], [0.2, 0.02, 0.16], [-0.24, 0.035, 0.17], [0.2, 0.035, 0.16]])), 'ink2');
    k.add(new THREE.CylinderGeometry(0.04, 0.05, 0.04, 7), 'gun', xf([0, 0.0, 0]));
    const back = (o) => o.map(([x, y, z]) => [x - 0.12 * y, y, z]);
    k.add(hull(back(sym([[-0.27, 0.12, 0.2], [-0.2, 0.12, 0.2], [-0.29, 0.6, 0.25], [-0.2, 0.6, 0.26], [-0.29, 0.72, 0.21], [-0.21, 0.74, 0.22], [-0.28, 0.12, 0.08]]))), 'ink');
    k.add(hull(back(sym([[-0.27, 0.72, 0.16], [-0.21, 0.72, 0.17], [-0.27, 0.83, 0.15], [-0.22, 0.83, 0.15], [-0.27, 0.87, 0.11], [-0.22, 0.87, 0.11]]))), 'ink');
    k.add(hull(back(sym([[-0.24, 0.32, 0.25], [-0.15, 0.3, 0.27], [-0.24, 0.62, 0.27], [-0.16, 0.62, 0.285], [-0.24, 0.5, 0.24], [-0.15, 0.48, 0.24]]))), 'ink');
    for (const s of [-1, 1]) {
      k.add(hull(back([[-0.293, 0.14, s * 0.135], [-0.293, 0.14, s * 0.155], [-0.307, 0.85, s * 0.075], [-0.307, 0.85, s * 0.095], [-0.283, 0.14, s * 0.145], [-0.297, 0.85, s * 0.085]])), 'bone');
      k.add(hull(back([[-0.198, 0.13, s * 0.205], [-0.198, 0.13, s * 0.22], [-0.195, 0.6, s * 0.262], [-0.195, 0.6, s * 0.275], [-0.21, 0.37, s * 0.25]])), 'bone');
    }
    k.add(hull(back(sym([[-0.29, 0.75, 0.05], [-0.2, 0.75, 0.05], [-0.29, 0.79, 0.05], [-0.2, 0.79, 0.05]]))), 'dark');
    for (const s of [-1, 1]) {
      k.add(box(0.03, 0.17, 0.03, [-0.06, 0.16, s * 0.25]), 'gun');
      k.add(slab(-0.17, 0.1, 0.24, 0.27, s * 0.25 - 0.035, s * 0.25 + 0.035, 0.01), 'ink2');
    }
    k.build(chairTop);
  }

  // =====================================================================================================================
  // The gamer. A rig of groups (hips > spine > chest > neck > head) seated in the chair; arms and legs are solved in
  // world space each frame (two-bone IK) onto the keyboard, the mouse, the screen, the Game Boy, his lap.
  const hips = new THREE.Group(); hips.position.set(0.02, 0.12, 0); chairTop.add(hips);
  const spine = new THREE.Group(); spine.position.set(0, 0.04, 0); hips.add(spine);
  const chest = new THREE.Group(); chest.position.set(0, 0.2, 0); chest.rotation.order = 'YZX'; spine.add(chest);
  const neck = new THREE.Group(); neck.position.set(0.035, 0.23, 0); neck.rotation.order = 'YZX'; chest.add(neck);
  const head = new THREE.Group(); head.position.set(0.015, 0.07, 0); head.rotation.order = 'YZX'; head.scale.setScalar(1.36); neck.add(head);

  // body: a pot-bellied hoodie, a hunched back, the hood bunched behind the neck
  kit()
    .add(hull(sym([[0.12, 0.0, 0.11], [0.14, 0.08, 0.1], [0.11, 0.18, 0.12], [-0.12, 0.0, 0.12], [-0.13, 0.12, 0.13], [-0.12, 0.24, 0.13],
      [0.0, -0.08, 0.12], [0.08, -0.06, 0.1], [-0.09, -0.07, 0.1], [0.07, 0.25, 0.12]])), 'hood')
    .add(hull(sym([[0.0, 0.02, 0.0], [0.155, 0.04, 0.0], [0.14, 0.0, 0.07], [0.13, 0.1, 0.07], [0.06, 0.05, 0.08]])), 'ink')
    .build(spine);
  kit()
    .add(hull(sym([[0.09, -0.02, 0.12], [0.1, 0.09, 0.135], [0.07, 0.19, 0.12], [-0.12, -0.02, 0.13], [-0.16, 0.09, 0.14], [-0.14, 0.19, 0.135],
      [-0.02, 0.235, 0.175], [0.03, 0.215, 0.19], [-0.08, 0.215, 0.18], [0.02, 0.265, 0.08], [-0.07, 0.265, 0.09]])), 'hood')
    .add(hull(sym([[-0.05, 0.2, 0.1], [0.02, 0.24, 0.1], [-0.15, 0.2, 0.08], [-0.17, 0.27, 0.07], [-0.12, 0.33, 0.06], [-0.06, 0.3, 0.09], [0.0, 0.27, 0.08], [-0.15, 0.3, 0.0]])), 'hood')
    .add(hull(sym([[-0.03, 0.24, 0.06], [0.04, 0.25, 0.06], [-0.1, 0.25, 0.05], [-0.1, 0.3, 0.04], [0.0, 0.29, 0.06]])), 'dark')
    .build(chest);
  kit().add(new THREE.CylinderGeometry(0.035, 0.042, 0.11, 6), 'skin', xf([0.0, 0.04, 0])).build(neck);
  const strings = [-1, 1].map((s) => {
    const m = new THREE.Mesh(own(clean(new THREE.CylinderGeometry(0.004, 0.004, 1, 4).translate(0, -0.5, 0))), M.bone);
    const tip = new THREE.Mesh(own(clean(new THREE.CylinderGeometry(0.007, 0.007, 0.022, 5).translate(0, -0.011, 0))), M.bone);
    scene.add(m); scene.add(tip);
    return { m, tip, at: new V(0.07, 0.23, s * 0.045), d: new V(0, -1, 0), v: new V(), len: 0.13 + (s > 0 ? 0.015 : 0) };
  });

  // the head: a wide gremlin skull, a long hooked nose, big eyes under heavy lids, bat ears out the back of red
  // headphones, a jaw that drops, fangs. Head space: origin at the top of the neck, +x the face.
  const jaw = new THREE.Group(); jaw.position.set(0.0, 0.045, 0); head.add(jaw);
  {
    const k = kit();
    k.add(hull(sym([[-0.13, 0.13, 0], [-0.12, 0.2, 0.07], [-0.11, 0.07, 0.07], [-0.06, 0.255, 0.05], [-0.07, 0.27, 0], [0.03, 0.27, 0.065],
      [0.03, 0.28, 0], [0.1, 0.24, 0.06], [0.135, 0.19, 0.08], [0.15, 0.2, 0], [0.13, 0.115, 0.09], [0.06, 0.12, 0.115], [-0.03, 0.15, 0.11],
      [0.11, 0.05, 0.075], [0.135, 0.06, 0.03], [0.14, 0.055, 0], [0.02, 0.035, 0.085], [-0.05, 0.02, 0.06], [-0.02, -0.01, 0.03]])), 'skin');
    k.add(hull(sym([[0.13, 0.175, 0.018], [0.14, 0.11, 0.03], [0.225, 0.1, 0], [0.25, 0.074, 0], [0.232, 0.06, 0.01], [0.17, 0.07, 0.024], [0.2, 0.12, 0.0]])), 'skin');
    k.add(hull(sym([[0.02, 0.02, 0.06], [0.125, 0.025, 0.05], [0.125, 0.06, 0.05], [0.02, 0.06, 0.06]])), 'dark');
    k.add(hull([[0.128, 0.058, 0.03], [0.128, 0.058, 0.048], [0.138, 0.058, 0.04], [0.133, 0.026, 0.04]]), 'bone');
    for (const z of [-0.036, -0.013, 0.011]) k.add(hull([[0.118, 0.06, z - 0.009], [0.118, 0.06, z + 0.009], [0.134, 0.06, z], [0.127, 0.041, z]]), 'bone');   // a crooked row of teeth
    for (const s of [-1, 1]) {
      k.add(hull([[0.15, 0.13, s * 0.03], [0.14, 0.12, s * 0.085], [0.128, 0.105, s * 0.075], [0.133, 0.13, s * 0.09], [0.14, 0.11, s * 0.04]]), 'skinD');
    }
    for (const s of [-1, 1]) {
      const e = [[0.0, 0.17, 0.09], [-0.05, 0.09, 0.09], [0.0, 0.1, 0.1], [-0.2, 0.25, 0.27], [-0.1, 0.22, 0.18]];
      const n = new V(0.35, -0.3, -0.1).normalize().multiplyScalar(0.018);
      k.add(hull([...e, ...e.map((p) => [p[0] + n.x, p[1] + n.y, p[2] + n.z])].map(([x, y, z]) => [x, y, s * z])), 'skin');
      const ei = [[-0.03, 0.155, 0.11], [-0.055, 0.115, 0.11], [-0.17, 0.235, 0.245], [-0.1, 0.205, 0.175]];
      k.add(hull([...ei, ...ei.map((p) => [p[0] + n.x * 1.4, p[1] + n.y * 1.4, p[2] + n.z * 1.4 - 0.004])].map(([x, y, z]) => [x, y, s * z])), 'skinD');
    }
    for (const [x, z, tx, tz, h] of [[0.04, 0.03, 0.03, 0.06, 0.07], [-0.02, -0.03, -0.07, -0.05, 0.08], [0.0, 0.02, -0.04, 0.03, 0.09], [0.07, -0.02, 0.1, -0.04, 0.05], [-0.06, 0.02, -0.12, 0.04, 0.06]]) {
      k.add(hull([[x - 0.025, 0.25, z - 0.02], [x + 0.025, 0.25, z - 0.02], [x, 0.25, z + 0.025], [tx, 0.27 + h * 0.75, tz]]), 'graphite');
    }
    k.add(new THREE.TorusGeometry(0.152, 0.014, 4, 10, Math.PI), 'ink', xf([-0.02, 0.15, 0], [0, Math.PI / 2, 0]));
    k.add(new THREE.TorusGeometry(0.152, 0.006, 3, 10, Math.PI), 'gun', xf([-0.02, 0.15, 0], [0, Math.PI / 2, 0], [1, 1.04, 1.04]));
    for (const s of [-1, 1]) {
      k.add(new THREE.CylinderGeometry(0.05, 0.052, 0.024, 8), 'dark', xf([-0.02, 0.135, s * 0.117], [Math.PI / 2, 0, 0]));
      k.add(new THREE.CylinderGeometry(0.06, 0.064, 0.04, 8), 'red', xf([-0.02, 0.135, s * 0.148], [Math.PI / 2, 0, 0]));
      k.add(new THREE.CylinderGeometry(0.044, 0.05, 0.012, 8), 'ink', xf([-0.02, 0.135, s * 0.172], [Math.PI / 2, 0, 0]));
      k.add(new THREE.TorusGeometry(0.047, 0.0045, 3, 12), 'led', xf([-0.02, 0.135, s * 0.18]));
    }
    k.add(hull([[0.0, 0.1, 0.16], [0.0, 0.11, 0.17], [0.11, 0.035, 0.11], [0.11, 0.045, 0.115], [0.01, 0.1, 0.17]]), 'ink');
    k.add(new THREE.IcosahedronGeometry(0.014, 0), 'ink', xf([0.12, 0.038, 0.105]));
    k.build(head);
    kit()
      .add(hull(sym([[0.02, 0.0, 0.08], [-0.005, -0.04, 0.065], [0.105, 0.0, 0.07], [0.135, 0.0, 0.035], [0.142, -0.005, 0], [0.125, -0.06, 0.04],
        [0.13, -0.07, 0], [0.07, -0.075, 0.06], [0.03, -0.065, 0.05]])), 'skin')
      .add(hull(sym([[0.03, 0.002, 0.055], [0.12, 0.002, 0.04], [0.12, -0.012, 0.04], [0.03, -0.012, 0.055]])), 'dark')
      .add(hull([[0.118, 0.0, 0.028], [0.118, 0.0, 0.045], [0.128, 0.0, 0.036], [0.124, 0.022, 0.036]]), 'bone')
      .build(jaw);
  }
  const EYE_R = 0.034;
  const eyeGeo = own(clean(new THREE.IcosahedronGeometry(EYE_R, 1)));
  const pupilGeo = own(clean(new THREE.IcosahedronGeometry(EYE_R * 0.38, 0)));
  const lidGeo = own(clean(new THREE.SphereGeometry(EYE_R * 1.14, 8, 3, 0, Math.PI * 2, 0, Math.PI / 2)));
  const browGeo = own(clean(slab(-0.012, 0.012, -0.008, 0.008, -0.03, 0.03, 0.004)));
  const eyes = [-1, 1].map((s) => {
    const g = new THREE.Group(); g.position.set(0.118, 0.152, s * 0.06); head.add(g);
    g.add(new THREE.Mesh(eyeGeo, M.eye));
    const pupil = new THREE.Mesh(pupilGeo, M.dark); pupil.position.set(EYE_R * 0.86, 0, s * EYE_R * 0.32); pupil.scale.set(0.45, 1, 1); g.add(pupil);
    const lid = new THREE.Mesh(lidGeo, M.skin); g.add(lid);
    const brow = new THREE.Mesh(browGeo, M.graphite); head.add(brow);
    return { s, g, lid, pupil, brow };
  });

  // limbs: tapered six-sided sleeves and legs, rebuilt into place each frame
  const prism = (r0, r1) => own(clean(new THREE.CylinderGeometry(r1, r0, 1, 6, 1).translate(0, 0.5, 0)));
  const ball = (r) => own(clean(new THREE.IcosahedronGeometry(r, 0)));
  const G = {
    upper: prism(0.052, 0.044), fore: prism(0.046, 0.04), cuff: prism(0.042, 0.042), elbow: ball(0.046),
    thigh: prism(0.07, 0.058), shin: prism(0.052, 0.046), knee: ball(0.058),
  };
  const UA = 0.25, FA = 0.24, TH = 0.36, SH_ = 0.44;                    // long gremlin arms
  const mk = (g, m) => { const o = new THREE.Mesh(g, m); scene.add(o); return o; };
  // the limbs come in pairs: each kind of segment is one instanced mesh of two, posed through plain Object3D slots
  const slots = [];
  const pair = (g, m) => { const im = new THREE.InstancedMesh(g, m, 2); im.frustumCulled = false; scene.add(im); return im; };
  const slot = (...ims) => { const o = new THREE.Object3D(); o.ims = ims; slots.push(o); return o; };
  const LIMB = { upper: pair(G.upper, M.hood), fore: pair(G.fore, M.hood), cuff: pair(G.cuff, M.graphite), elbow: pair(G.elbow, M.hood), thigh: pair(G.thigh, M.graphite), shin: pair(G.shin, M.graphite), knee: pair(G.knee, M.graphite) };
  function flushSlots() {
    for (const o of slots) { o.updateMatrix(); for (const [im, i] of o.ims) im.setMatrixAt(i, o.matrix); }
    for (const o of slots) for (const [im] of o.ims) im.instanceMatrix.needsUpdate = true;
  }
  const handGeo = (s) => own(mergeGeometries([
    clean(hull([[0, 0.016, 0.024 * s], [0, 0.016, -0.026 * s], [0, -0.014, 0.022 * s], [0, -0.014, -0.022 * s], [0.055, 0.022, 0.034 * s], [0.055, 0.022, -0.032 * s],
      [0.06, -0.016, 0.03 * s], [0.06, -0.016, -0.03 * s], [0.092, 0.006, 0.026 * s], [0.092, 0.006, -0.026 * s], [0.088, -0.022, 0.022 * s], [0.088, -0.022, -0.022 * s], [0.098, -0.012, 0]])),
    clean(hull([[0.015, 0.0, -0.022 * s], [0.03, -0.012, -0.03 * s], [0.058, -0.006, -0.05 * s], [0.07, -0.02, -0.046 * s], [0.04, 0.008, -0.034 * s]])),
  ]));
  const arms = [-1, 1].map((s) => ({
    s, upper: slot([LIMB.upper, s > 0 ? 1 : 0]), fore: slot([LIMB.fore, s > 0 ? 1 : 0]), cuff: slot([LIMB.cuff, s > 0 ? 1 : 0]), elbow: slot([LIMB.elbow, s > 0 ? 1 : 0]), hand: mk(handGeo(s), M.skin),
    sh: new V(), el: new V(), wr: new V(), tgt: new V(),
  }));
  const shoeGeo = own(clean(hull(sym([[-0.05, 0.02, 0.04], [0.15, 0.02, 0.045], [0.17, 0.035, 0.035], [0.12, 0.07, 0.035], [-0.04, 0.1, 0.035], [0.02, 0.1, 0.04], [-0.06, 0.06, 0.04]]))));
  const soleGeo = own(clean(hull(sym([[-0.06, 0.0, 0.045], [0.165, 0.0, 0.05], [0.18, 0.02, 0.04], [-0.06, 0.025, 0.047], [0.16, 0.025, 0.05]]))));
  const SHOE = pair(shoeGeo, M.bone), SOLE = pair(soleGeo, M.ink);
  const legs = [-1, 1].map((s) => ({
    s, thigh: slot([LIMB.thigh, s > 0 ? 1 : 0]), shin: slot([LIMB.shin, s > 0 ? 1 : 0]), knee: slot([LIMB.knee, s > 0 ? 1 : 0]),
    shoe: slot([SHOE, s > 0 ? 1 : 0], [SOLE, s > 0 ? 1 : 0]),
    hip: new V(), kn: new V(), an: new V(),
  }));

  // floor shadows: under the desk, the chair and his feet
  blob(scene, (DX0 + DX1) / 2, 0.002, 0, 0.9, 1.6, 0.2);
  blob(chairBase, 0, 0.003, 0, 0.8, 0.8, 0.42);
  const feetShadow = blob(scene, 0.42, 0.004, 0, 0.36, 0.5, 0.3);

  // =====================================================================================================================
  // FX, all instanced: fire shards (unlit, a baked facet shade x a hot colour ramp), sparks (stretched along their
  // flight), smoke puffs (lit, faceted clusters; they swell as they rise and thin away), and debris that tumbles and
  // bounces: CRT glass, keycaps, the Game Boy's parts.
  /** A baked facet shade (unlit materials still read as faceted solids). */
  const shade = (g, lo = 0.55) => {
    const n = g.attributes.normal, col = new Float32Array(n.count * 3);
    for (let i = 0; i < n.count; i++) { const b = lo + (1 - lo) * clamp(0.5 + 0.5 * (n.getY(i) * 0.75 + n.getX(i) * 0.25 + n.getZ(i) * 0.3), 0, 1); col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return own(g);
  };
  const fireGeo = shade(clean(new THREE.IcosahedronGeometry(1, 0)));
  // the flash: a twelve-pointed star (an icosahedron's corners pulled out of its subdivided ball)
  const flashGeo = (() => {
    const g = new THREE.IcosahedronGeometry(1, 1), pos = g.attributes.position, tips = new THREE.IcosahedronGeometry(1, 0).attributes.position;
    const tipDirs = []; for (let i = 0; i < tips.count; i++) tipDirs.push(new V().fromBufferAttribute(tips, i).normalize());
    for (let i = 0; i < pos.count; i++) {
      const v = new V().fromBufferAttribute(pos, i), d = v.clone().normalize();
      const tip = tipDirs.some((t) => t.dot(d) > 0.999);
      v.multiplyScalar(tip ? 1.9 : 0.8); pos.setXYZ(i, v.x, v.y, v.z);
    }
    return shade(clean(g), 0.7);
  })();
  // a puff of smoke: three or four overlapping faceted blobs of uneven size, its underside baked darker, so one puff
  // reads as a lump of cloud (not a ball), and neighbours merge as they grow
  const smokeGeo = (() => {
    const blobs = [[1, 0, 0, 0], [0.74, 0.66, -0.2, 0.22], [0.68, -0.6, -0.14, -0.3], [0.56, 0.08, 0.46, -0.12], [0.5, -0.2, -0.3, 0.55]];
    const g = mergeGeometries(blobs.map(([r, x, y, z], i) => clean(new THREE.DodecahedronGeometry(r, 0).rotateY(i * 1.3).rotateX(i * 0.7).translate(x, y, z))));
    const pos = g.attributes.position, n = g.attributes.normal, col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const up = clamp(0.5 + 0.5 * n.getY(i), 0, 1), low = smooth(-0.9, 0.5, pos.getY(i));
      const b = 0.5 + 0.3 * up + 0.2 * low;
      col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = b;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return own(g);
  })();
  const NK = 96;
  const smokeAlpha = new THREE.InstancedBufferAttribute(new Float32Array(NK), 1);
  smokeGeo.setAttribute('iAlpha', smokeAlpha);
  const sparkGeo = own(new THREE.BoxGeometry(1, 1, 1));
  const shardGeo = own(clean(hull([[0, 0, -0.002], [0.042, 0.008, -0.002], [0.015, 0.04, -0.002], [0, 0, 0.002], [0.042, 0.008, 0.002], [0.015, 0.04, 0.002]]).translate(-0.019, -0.016, 0)));
  const fxMat = {
    fire: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
    flash: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, color: 0xfff6d0 }),
    spark: new THREE.MeshBasicMaterial({ toneMapped: false }),
    smoke: std(0xffffff, 1, 0, { vertexColors: true, transparent: true, depthWrite: false }),
  };
  // each puff thins out on its own: a per-instance alpha
  fxMat.smoke.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float iAlpha;\nvarying float vIAlpha;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvIAlpha = iAlpha;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vIAlpha;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.a *= vIAlpha;');
  };
  fxMat.smoke.customProgramCacheKey = () => 'gamer-smoke';
  const WHITE = new THREE.Color(1, 1, 1);
  function pool(geo, mat, n) {
    const m = new THREE.InstancedMesh(geo, mat, n); m.frustumCulled = false;
    for (let i = 0; i < n; i++) { m.setColorAt(i, WHITE); m.setMatrixAt(i, _m4.makeScale(0, 0, 0)); }
    m.count = 1; scene.add(m);
    return m;
  }
  const NF = 72, NS = 56;
  const fireMesh = pool(fireGeo, fxMat.fire, NF), sparkMesh = pool(sparkGeo, fxMat.spark, NS), smokeMesh = pool(smokeGeo, fxMat.smoke, NK);
  smokeMesh.renderOrder = 2;
  const glassMesh = pool(shardGeo, M.glass, 16), capMesh = pool(keyGeo, M.keys, 10);
  const flash = new THREE.Mesh(flashGeo, fxMat.flash); flash.visible = false; flash.frustumCulled = false; scene.add(flash);
  const mkP = () => ({ on: false, p: new V(), v: new V(), q: new Q(), w: new V(), age: 0, life: 1, s: 1, hot: 0, dark: 0 });
  const fire = Array.from({ length: NF }, mkP), sparks = Array.from({ length: NS }, mkP), smoke = Array.from({ length: NK }, mkP);
  const take = (arr) => { let best = arr[0]; for (const p of arr) { if (!p.on) return p; if (p.age / p.life > best.age / best.life) best = p; } return best; };
  const rUnit = (out) => { const u = rand() * 2 - 1, a = rand() * Math.PI * 2, r = Math.sqrt(1 - u * u); return out.set(r * Math.cos(a), u, r * Math.sin(a)); };
  const _eu = new THREE.Euler();
  const rQuat = (out) => out.setFromEuler(_eu.set(rand() * 6.3, rand() * 6.3, rand() * 6.3));
  const _fd = new V();

  /** A fireball from `at`, flung around `dir` (spread 0 = all along it, 1 = everywhere), size ~ its radius: a white star
   * flash, a hot core, a ball of puffs and a ring of spikes; the puffs die into black smoke. */
  function boom(at, dir, n, size, speed, spread, onGround = false) {
    fx.flashT = 0; fx.flashAt.copy(at); fx.flashS = size * 1.5; rQuat(flash.quaternion);
    fx.sootT = 0.09; fx.sootAt.copy(at); fx.sootN = Math.round(n * 0.3); fx.sootS = size; fx.sootDir.copy(dir); fx.sootUp = onGround;
    for (let i = 0; i < n; i++) {
      const f = take(fire); f.on = true; f.age = 0;
      const kind = i < n * 0.25 ? 0 : i < n * 0.72 ? 1 : 2;              // 0 core, 1 fireball, 2 spikes
      rUnit(_fd); if (onGround) _fd.y = Math.abs(_fd.y) * 0.85 + 0.15;   // off a desk, it all goes up and out
      _fd.lerp(dir, 1 - spread).normalize();
      f.spike = kind === 2;
      f.p.copy(at).addScaledVector(_fd, size * (kind === 0 ? 0.12 : 0.35) * rand());
      f.v.copy(_fd).multiplyScalar(speed * (kind === 0 ? 0.2 + 0.3 * rand() : kind === 1 ? 0.4 + 0.45 * rand() : 1.7 + 1.2 * rand()));
      f.v.y += 0.25 * rand();
      rQuat(f.q); rUnit(f.w).multiplyScalar(4 + 8 * rand());
      f.life = kind === 0 ? 0.3 + 0.2 * rand() : kind === 1 ? 0.38 + 0.3 * rand() : 0.2 + 0.14 * rand();
      f.s = size * (kind === 0 ? 0.65 + 0.35 * rand() : kind === 1 ? 0.45 + 0.45 * rand() : 0.45 + 0.35 * rand());
      f.hot = kind === 0 ? 1 : kind === 2 ? 0.85 : 0.35 * rand();
      f.smoked = kind === 1 ? rand() < 0.75 : kind === 0 && rand() < 0.5;
    }
  }
  function spit(at, dir, n, speed, spread = 0.7) {
    for (let i = 0; i < n; i++) {
      const s = take(sparks); s.on = true; s.age = 0;
      rUnit(_fd); _fd.lerp(dir, 1 - spread).normalize();
      s.p.copy(at); s.v.copy(_fd).multiplyScalar(speed * (0.5 + 0.8 * rand())); s.v.y += 0.6 * rand();
      s.life = 0.3 + 0.55 * rand();
    }
  }
  /** One smoke puff. dark: 1 = black from the fire, 0 = grey; (vx, vy, vz) its first push. */
  function puff(at, size, life, dark, vx = 0, vy = 0.3, vz = 0, flat = 1) {
    const s = take(smoke); s.on = true; s.age = 0;
    s.p.copy(at); s.v.set(vx, vy, vz);
    s.q.setFromEuler(_eu.set((rand() - 0.5) * 0.5, rand() * 6.3, (rand() - 0.5) * 0.5));   // it keeps its dark underside down
    s.w.set(0, (rand() - 0.5) * 1.4, 0);
    s.s = size; s.life = life; s.dark = dark; s.sx = 0.85 + 0.3 * rand(); s.sy = (0.72 + 0.22 * rand()) * flat;
  }
  const FIRE_RAMP = [[0, 0xffffff], [0.06, 0xfff1b0], [0.15, 0xffc03a], [0.27, 0xff7a18], [0.4, 0xe8401a], [0.52, 0x8c1c10], [0.66, 0x3a1714], [1, 0x1c1a1a]].map(([f, c]) => [f, new THREE.Color(c)]);
  const ramp = (R, f, out) => {
    for (let i = 1; i < R.length; i++) if (f <= R[i][0]) return out.copy(R[i - 1][1]).lerp(R[i][1], (f - R[i - 1][0]) / (R[i][0] - R[i - 1][0]));
    return out.copy(R[R.length - 1][1]);
  };
  const SMOKE_DARK = new THREE.Color(0x242323), SMOKE_MID = new THREE.Color(0x7c7c7c), SMOKE_LIGHT = new THREE.Color(0xc4c4c4);
  const smokeOrder = [];
  const SPARK_A = new THREE.Color(0xfff6c8), SPARK_B = new THREE.Color(0xff7a1a);
  const _col = new THREE.Color();

  // debris: rigid little bodies. Each knows its ground (the desk if it's over it, else the floor) and settles flat.
  const bodies = [];
  const ground = (b) => (b.p.x > DX0 && b.p.x < DX1 && Math.abs(b.p.z) < DZ && b.p.y > DESK_Y - 0.06 ? DESK_Y : 0);
  function body(write, r, flatAxis) { const b = { ...mkP(), write, r, flatAxis, sc: 1, shrinkT: null }; bodies.push(b); return b; }
  const glass = Array.from({ length: 16 }, () => body(null, 0.003, new V(0, 0, 1)));
  const caps = Array.from({ length: 10 }, () => body(null, 0.011, new V(0, 1, 0)));
  const gbDebris = gbParts.map((pt) => {
    const g = inst(pt.geos); g.visible = false; scene.add(g);
    const b = body((bb) => { g.visible = bb.on && bb.sc > 0.01; g.position.copy(bb.p); g.quaternion.copy(bb.q); g.scale.setScalar(Math.max(1e-4, bb.sc)); }, pt.r, pt.flat);
    b.part = pt; b.g = g;
    if (pt.name === 'lcd') g.children[0].material = M.lcdDead;
    return b;
  });
  function stepBody(b, h) {
    if (!b.on) return;
    b.age += h;
    if (b.shrinkT !== null) { b.shrinkT += h; b.sc = 1 - smooth(0, 0.35, b.shrinkT); if (b.sc <= 0) { b.on = false; return; } }
    else if (b.p.y < 0.05 && b.v.lengthSq() < 0.01 && (b.floorT = (b.floorT ?? 0) + h) > 0.5) b.shrinkT = 0;   // a bit on the floor doesn't lie there as dirt
    b.v.y -= 9.8 * h;
    b.p.addScaledVector(b.v, h);
    const g = ground(b) + b.r;
    let rest = false;
    if (b.p.y < g) {
      b.p.y = g;
      if (b.v.y < -0.5) { b.v.y *= -0.36; b.v.x *= 0.62; b.v.z *= 0.62; b.w.multiplyScalar(0.55); }
      else { b.v.y = 0; b.v.x *= 0.8; b.v.z *= 0.8; b.w.multiplyScalar(0.75); rest = true; }
    }
    const wl = b.w.length();
    if (wl > 1e-4) { _q.setFromAxisAngle(_a.copy(b.w).divideScalar(wl), wl * h); b.q.premultiply(_q); }
    if (rest && b.flatAxis) {                                                  // settle flat on its wide side
      _a.copy(b.flatAxis).applyQuaternion(b.q);
      _q.setFromUnitVectors(_a, _b.set(0, _a.y >= 0 ? 1 : -1, 0));
      b.q.premultiply(_q2.identity().slerp(_q, 0.25));
    } else if (rest) {                                                         // a battery: lie on its side
      _a.set(0, 1, 0).applyQuaternion(b.q);
      _b.copy(_a).setY(0);
      if (_b.lengthSq() > 0.01) { _q.setFromUnitVectors(_a, _b.normalize()); b.q.premultiply(_q2.identity().slerp(_q, 0.25)); }
    }
  }
  function launch(b, at, v, spin) {
    b.on = true; b.age = 0; b.sc = 1; b.shrinkT = null; b.floorT = 0;
    b.p.copy(at); b.v.copy(v); rUnit(b.w).multiplyScalar(spin);
  }

  // =====================================================================================================================
  // Two-bone IK: shoulder S, target T, lengths a, b, pole direction (where the elbow points). Writes the elbow into E and
  // the reachable wrist into W.
  const _u = new V(), _n = new V();
  function ik(S, T, a, b, pole, E, W) {
    _u.subVectors(T, S);
    let d = _u.length();
    _u.divideScalar(Math.max(d, 1e-6));
    d = clamp(d, Math.abs(a - b) + 0.01, a + b - 0.002);
    const ca = clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1), sa = Math.sqrt(1 - ca * ca);
    _n.copy(pole).addScaledVector(_u, -pole.dot(_u)).normalize();
    E.copy(S).addScaledVector(_u, a * ca).addScaledVector(_n, a * sa);
    W.copy(S).addScaledVector(_u, d);
  }
  const Y = new V(0, 1, 0);
  function seg(mesh, A, B) {
    _a.subVectors(B, A);
    const L = _a.length();
    mesh.position.copy(A);
    mesh.quaternion.setFromUnitVectors(Y, _a.divideScalar(Math.max(L, 1e-6)));
    mesh.scale.set(1, L, 1);
  }
  const _f = new V(), _hu = new V(), _sd = new V(), _bm = new THREE.Matrix4();
  /** Orient a hand at the wrist: fingers along the forearm (flattened toward the desk when low), back of the hand up. */
  function placeHand(arm, flatten) {
    _f.subVectors(arm.wr, arm.el).normalize();
    _f.y *= 1 - flatten; _f.normalize();
    const vert = smooth(0.55, 0.92, Math.abs(_f.y));
    _hu.set(-vert, 1 - vert, arm.s * 0.25 * (1 - vert)).normalize();
    _hu.addScaledVector(_f, -_hu.dot(_f)).normalize();
    _sd.crossVectors(_f, _hu);
    _bm.makeBasis(_f, _hu, _sd);
    arm.hand.quaternion.setFromRotationMatrix(_bm);
    arm.hand.position.copy(arm.wr);
  }

  // =====================================================================================================================
  // The games on the screen. Each is a little scripted loop that goes wrong at `fail` (s).
  const pxCanvas = document.createElement('canvas'); pxCanvas.width = SW; pxCanvas.height = SH;
  const pg = pxCanvas.getContext('2d');
  const scrCanvas = document.createElement('canvas'); scrCanvas.width = SW * SX; scrCanvas.height = SH * SX;
  const sg = scrCanvas.getContext('2d');
  sg.imageSmoothingEnabled = false;
  const screenTex = new THREE.CanvasTexture(scrCanvas); textures.push(screenTex);
  screenTex.colorSpace = THREE.SRGBColorSpace; screenTex.magFilter = THREE.NearestFilter; screenTex.minFilter = THREE.LinearFilter; screenTex.generateMipmaps = false;
  const liveMat = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }); extraMats.push(liveMat);
  // the smashed screen: cracks round the punch, a hole, the last picture burnt in; a second one sputtering
  const deadCanvas = [0, 1].map(() => { const c = document.createElement('canvas'); c.width = SW * SX; c.height = SH * SX; return c; });
  const deadTex = deadCanvas.map((c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; textures.push(t); return t; });
  const deadMat = deadTex.map((t) => { const m = new THREE.MeshBasicMaterial({ map: t, toneMapped: false }); extraMats.push(m); return m; });

  const R = (x, y, w, h, c) => { pg.fillStyle = c; pg.fillRect(Math.round(x), Math.round(y), w, h); };
  function text(str, x, y, c, s = 1, shadow = null) {
    if (shadow) text(str, x + s / 2, y + s / 2, shadow, s);
    let cx = Math.round(x);
    for (const ch of str) {
      const g = FONT[ch] ?? FONT[' '];
      for (let i = 0; i < 15; i++) if (g[i] === '1') R(cx + (i % 3) * s, Math.round(y) + Math.floor(i / 3) * s, s, s, c);
      cx += 4 * s;
    }
  }
  const textW = (str, s = 1) => (str.length * 4 - 1) * s;
  /** The verdict: big red letters dropping in, with a black shadow so they read on any picture. */
  const verdict = (str, y, u) => text(str, Math.floor((SW - textW(str, 2)) / 2), y + pop(u), '#ff2414', 2, '#000');
  function line(x0, y0, x1, y1, c, every = 1, phase = 0) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0;
    for (let i = 0; i <= n; i++) if ((i + phase) % every === 0) R(x0 + ((x1 - x0) * i) / Math.max(1, n), y0 + ((y1 - y0) * i) / Math.max(1, n), 1, 1, c);
  }
  const pop = (u) => (u < 0 ? -99 : -3 * Math.exp(-u * 7) * Math.cos(u * 22));   // text drops in and bounces
  const outQ = (u) => 1 - (1 - clamp(u, 0, 1)) ** 2;
  const glow = { c: new THREE.Color(0x22c46a), i: 1, tc: new THREE.Color(0x22c46a), ti: 1 };
  // the fail: the picture flashes red (on the screen only: the room's light just blinks brighter)
  const failFlash = (u, f) => { const x = u - f; if (x > 0 && x < 0.25) { pg.fillStyle = 'rgba(255,36,20,0.4)'; pg.fillRect(0, 0, SW, SH); glow.ti = 1.25; } };

  // pool: the 8 on a cut to the top corner. It rattles in the jaws and stays out, the cue ball rolls on into the
  // bottom corner. FOUL.
  const P_CB = [6, 15], P_OB = [18, 9], P_PK = [30, 1], P_ST = 2.6, P_HIT = 2.9, P_JAW = [27.5, 3];
  const pd = [P_PK[0] - P_OB[0], P_PK[1] - P_OB[1]], pdl = Math.hypot(...pd);
  const P_G = [P_OB[0] - (pd[0] / pdl) * 2, P_OB[1] - (pd[1] / pdl) * 2];
  const pe = [P_G[0] - P_CB[0], P_G[1] - P_CB[1]], pel = Math.hypot(...pe), PE = [pe[0] / pel, pe[1] / pel];
  const P_BR = [30, 21.5], P_DROP = 3.95, P_FAIL = 4.05;
  function cuePull(u) {
    if (u < 1.6) return 1.2 + 1 * Math.sin(u * 6.2);
    if (u < 2.3) return lerp(1.2 + 1 * Math.sin(1.6 * 6.2), 5, smooth(1.6, 2.25, u));
    if (u < P_ST) return lerp(5, -1, ((u - 2.3) / (P_ST - 2.3)) ** 2);
    return -1;
  }
  function drawPool(u) {
    R(0, 0, SW, SH, '#0c0c0c');
    R(1, 1, SW - 2, SH - 2, '#11804a');
    R(2, 2, SW - 4, SH - 4, '#169b55');
    for (const [x, y] of [[0, 0], [SW - 2, 0], [0, SH - 2], [SW - 2, SH - 2], [SW / 2 - 1, 0], [SW / 2 - 1, SH - 2]]) R(x, y, 2, 2, '#000');
    let cb = P_CB, ob = P_OB, cbIn = true;
    if (u >= P_ST) {
      const a = outQ((u - P_ST) / (P_HIT - P_ST));
      cb = [lerp(P_CB[0], P_G[0], a), lerp(P_CB[1], P_G[1], a)];
      if (u >= P_HIT) {
        const b = 1 - (1 - clamp((u - P_HIT) / (P_DROP - P_HIT), 0, 1)) ** 1.6;
        cb = [lerp(P_G[0], P_BR[0] - 1, b), lerp(P_G[1], P_BR[1] - 1, b)];
        if (u >= P_DROP) cbIn = false;
        const o = clamp((u - P_HIT) / 0.4, 0, 1);
        ob = [lerp(P_OB[0], P_JAW[0], outQ(o)), lerp(P_OB[1], P_JAW[1], outQ(o))];
        const rat = u - P_HIT - 0.4;
        if (rat > 0 && rat < 0.35) ob = [ob[0] + (Math.floor(rat * 30) % 2 ? 1 : 0), ob[1] - (Math.floor(rat * 30) % 2 ? 1 : 0)];
      }
    }
    if (u < P_ST) {
      const wob = 0.6 * Math.sin(u * 3.1) * (1 - smooth(1.2, 2.0, u));
      const ex = PE[0] - wob * PE[1] * 0.08, ey = PE[1] + wob * PE[0] * 0.08;
      line(cb[0] + 0.5 + ex * 3, cb[1] + 0.5 + ey * 3, cb[0] + 0.5 + ex * 11, cb[1] + 0.5 + ey * 11, '#d8f5e2', 2, Math.floor(u * 8) % 2);
    }
    if (u < P_ST + 0.35) {
      const q = cuePull(u);
      const x0 = cb[0] + 0.5 - PE[0] * (2 + q), y0 = cb[1] + 0.5 - PE[1] * (2 + q);
      line(x0, y0, x0 - PE[0] * 13, y0 - PE[1] * 13, '#d9b06a');
      R(x0, y0, 1, 1, '#5d7489');
    }
    R(ob[0], ob[1], 2, 2, '#0a0a0a'); R(ob[0] + 1, ob[1], 1, 1, '#f4f4f4');
    if (cbIn) R(cb[0], cb[1], 2, 2, '#ffffff');
    if (u > P_DROP && u < P_DROP + 0.15) R(SW - 2, SH - 2, 2, 2, '#ffffff');
    glow.tc.set(0x1fbf63); glow.ti = 1;
    if (u > P_FAIL) verdict('FOUL', 8, u - P_FAIL);
    failFlash(u, P_FAIL);
  }

  // the bin: paper balls at a black bin with red eyes. The first goes in. The second hits the rim; the bin laughs.
  const B_X = 24, B_Y = 10;
  const T1 = 1.0, T2 = 2.9, FL = 0.8, T_FAIL = T2 + FL + 0.12;
  const arc = (s, x0, y0, x1, y1, h) => [lerp(x0, x1, s), lerp(y0, y1, s) - h * 4 * s * (1 - s)];
  function drawToss(u) {
    R(0, 0, SW, SH, '#1b2236');
    R(0, 0, SW, 6, '#171d2f');
    for (const [x, y] of [[3, 3], [10, 1], [16, 4], [21, 2], [29, 4]]) R(x, y, 1, 1, '#7484b4');
    R(0, 19, SW, SH - 19, '#10141f');
    const laugh = u > T2 + FL ? u - T2 - FL : -1;
    const chomp = u > T1 + FL && u < T1 + FL + 0.25;
    const hop = chomp ? -1 : laugh > 0 ? -(Math.floor(laugh * 9) % 2) : 0;
    R(B_X - 4, 19, 9, 1, '#06080e');
    for (let y = 0; y <= 8; y++) {
      const hw = 4 - y * 0.12;
      R(B_X - hw, B_Y + y + hop, Math.round(hw * 2), 1, y === 0 ? '#5a5a5a' : '#0b0b0b');
    }
    R(B_X - 3, B_Y + 2 + hop, 1, 5, '#222');
    const eyeC = chomp ? '#ffd8c8' : '#ff2414';
    const squint = laugh > 0;
    R(B_X - 3, B_Y + 2 + hop, 2, squint ? 1 : 2, eyeC); R(B_X + 1, B_Y + 2 + hop, 2, squint ? 1 : 2, eyeC);
    if (squint) R(B_X - 2, B_Y + 5 + hop, 4, 1 + (Math.floor(laugh * 9) % 2), '#ff2414');
    const score = u > T1 + FL ? 1 : 0;
    if (u > T1 && u < T1 + FL) { const [x, y] = arc((u - T1) / FL, 4, 14, B_X - 1, B_Y - 1, 10); R(x, y, 2, 2, '#f2efe6'); }
    if (u > T1 + FL && u < T1 + FL + 0.8) text('+1', B_X - 3, B_Y - 7 - (u - T1 - FL) * 5, '#ffffff');
    if (u > T2 && u < T2 + FL) { const [x, y] = arc((u - T2) / FL, 4, 14, B_X + 4, B_Y - 1, 10); R(x, y, 2, 2, '#f2efe6'); }
    else if (u >= T2 + FL && u < T2 + FL + 0.6) { const [x, y] = arc((u - T2 - FL) / 0.6, B_X + 4, B_Y - 1, SW + 2, 18, 5); R(x, y, 2, 2, '#f2efe6'); }
    if (u < T1 + 0.05 || (u > T1 + FL + 0.3 && u < T2 + 0.05)) R(3, 14, 2, 2, '#f2efe6');
    text(String(score), 1, 1, '#c9d3ff');
    if (laugh > 0.45) text('HA', 2 + (Math.floor(laugh * 5) % 2), 15, '#ff2414');
    glow.tc.set(0x5a6fb0); glow.ti = 1;
    if (u > T_FAIL) verdict('MISS', 2, u - T_FAIL);
    failFlash(u, T_FAIL);
  }

  // the market: a green line that climbs and climbs, then the floor drops out. -99%.
  const S_CR = 3.6, S_FAIL = S_CR + 0.25;
  const series = (() => { let y = 20; const out = []; for (let i = 0; i < 27; i++) { y -= 0.5 + 1.1 * Math.sin(i * 1.7) * Math.sin(i * 0.37 + 1) * (i % 6 === 3 ? -1.6 : 1); y = clamp(y, 5, 21); out.push(y); } return out; })();
  function drawStocks(u) {
    R(0, 0, SW, SH, '#060d09');
    for (let x = 4; x < SW; x += 5) R(x, 0, 1, SH, '#0d2016');
    for (let y = 4; y < SH; y += 5) R(0, y, SW, 1, '#0d2016');
    const n = Math.min(series.length, Math.floor((Math.min(u, S_CR) / S_CR) * series.length));
    for (let i = 1; i < n; i++) line(2 + i - 1, series[i - 1], 2 + i, series[i], series[i] > series[i - 1] + 0.6 ? '#0f9a4a' : '#2bff7a');
    const crash = u - S_CR;
    let price = 1000 + n * 312;
    if (crash > 0) {
      const lx = 2 + n - 1, ly = series[n - 1], k = outQ(crash / 0.3);
      line(lx, ly, lx + 2, lerp(ly, 23, k), '#ff2414');
      line(lx + 1, ly, lx + 3, lerp(ly, 23, k), '#ff2414');
      price = Math.round(lerp(price, 12, k));
    } else if (n > 0) R(2 + n - 1, series[n - 1] - 0.5, 2, 2, '#c8ffdc');
    text('$' + price, 1, 1, crash > 0 ? '#ff2414' : '#2bff7a');
    glow.tc.set(0x2fb86a); glow.ti = crash > 0 ? lerp(0.9, 0.3, smooth(0.3, 1.2, crash)) : 0.9;
    if (crash > 0 && crash < 0.3) { pg.fillStyle = 'rgba(255,36,20,0.45)'; pg.fillRect(0, 0, SW, SH); glow.ti = 1.25; }
    if (crash > 0.25) verdict('-99%', 8, crash - 0.25);
  }

  const GAMES = [
    { name: 'toss', draw: drawToss, fail: T_FAIL },
    { name: 'stocks', draw: drawStocks, fail: S_FAIL },
    { name: 'pool', draw: drawPool, fail: P_FAIL },
  ];

  /** The CRT coming on: a bright line that opens into the picture. */
  function drawBoot(k, g) {
    if (k < 1) {
      R(0, 0, SW, SH, '#050505');
      const hh = Math.max(1, Math.round(SH * smooth(0.35, 1, k)));
      const ww = Math.round(SW * smooth(0, 0.35, k));
      R((SW - ww) / 2, (SH - hh) / 2, ww, hh, k > 0.8 ? '#cfd8d2' : '#ffffff');
      glow.tc.set(0xdfe8ff); glow.ti = 0.4 + k;
    } else g.draw(0);
  }
  function blit() {
    sg.drawImage(pxCanvas, 0, 0, SW * SX, SH * SX);
    sg.fillStyle = 'rgba(0,0,0,0.24)';
    for (let y = SX - 1; y < SH * SX; y += SX) sg.fillRect(0, y, SW * SX, 1);
  }
  /** Smash the picture: the last frame, burnt and darkened, cracks from the punch, a black hole with a glinting rim. */
  function drawDead(px, py) {
    const r2 = rng(Math.floor(px * 31 + py * 17));
    deadCanvas.forEach((c, v) => {
      const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
      g.drawImage(scrCanvas, 0, 0);
      g.fillStyle = v ? 'rgba(10,30,24,0.45)' : 'rgba(8,8,8,0.82)'; g.fillRect(0, 0, c.width, c.height);
      if (v) for (let y = 0; y < c.height; y += 6) g.drawImage(scrCanvas, 0, y, c.width, 3, ((y * 13) % 11) - 5, y, c.width, 3);   // a torn sputter
      g.strokeStyle = v ? 'rgba(235,255,245,0.9)' : 'rgba(210,214,212,0.85)'; g.lineWidth = 1;
      for (let i = 0; i < 11; i++) {
        let a = (i / 11) * Math.PI * 2 + r2() * 0.4, x = px, y = py;
        g.beginPath(); g.moveTo(x, y);
        const L = 14 + r2() * 46;
        for (let s = 0; s < L; s += 5) { a += (r2() - 0.5) * 0.7; x += Math.cos(a) * 5; y += Math.sin(a) * 5; g.lineTo(Math.round(x) + 0.5, Math.round(y) + 0.5); }
        g.stroke();
      }
      g.beginPath();
      for (let i = 0; i < 4; i++) {                                           // a broken ring
        const a0 = r2() * 6.3, rr = 8 + r2() * 6;
        g.moveTo(px + Math.cos(a0) * rr, py + Math.sin(a0) * rr); g.arc(px, py, rr, a0, a0 + 0.6 + r2());
      }
      g.stroke();
      g.fillStyle = '#020202'; g.beginPath();
      for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, rr = 5 + r2() * 5; g[i ? 'lineTo' : 'moveTo'](px + Math.cos(a) * rr, py + Math.sin(a) * rr * 0.9); }
      g.closePath(); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = SX - 1; y < c.height; y += SX) g.fillRect(0, y, c.width, 1);
    });
    deadTex.forEach((t) => { t.needsUpdate = true; });
  }

  // the Game Boy's game: blocks stacking up a well, a piece falling; at `fail` the stack tops out: it blinks an X
  const GBP = ['#9bbc0f', '#8bac0f', '#306230', '#0f380f'];
  function drawGB(u, fail, on) {
    gg.fillStyle = GBP[0]; gg.fillRect(0, 0, 20, 18);
    if (!on) { gg.fillStyle = GBP[1]; gg.fillRect(5, 6, 10, 5); gg.fillStyle = GBP[3]; gg.fillRect(6, 7, 8, 1); gg.fillRect(6, 9, 5, 1); gbTex.needsUpdate = true; return; }
    gg.fillStyle = GBP[2]; gg.fillRect(3, 0, 1, 18); gg.fillRect(16, 0, 1, 18);
    const rows = Math.min(17, 5 + Math.floor(Math.max(0, u) * 5.5));
    gg.fillStyle = GBP[3];
    for (let y = 0; y < rows; y++) for (let x = 4; x < 16; x++) if ((x * 7 + y * 13) % 5 !== 0) gg.fillRect(x, 17 - y, 1, 1);
    if (u < fail) { const py = Math.floor((u * 16) % Math.max(1, 17 - rows)); gg.fillStyle = GBP[2]; gg.fillRect(8, py, 3, 1); gg.fillRect(9, py + 1, 1, 1); }
    else if (Math.floor((u - fail) * 7) % 2 === 0) {
      gg.fillStyle = GBP[3]; gg.fillRect(0, 0, 20, 18);
      gg.fillStyle = GBP[0]; for (let i = 0; i < 7; i++) { gg.fillRect(6 + i, 5 + i, 2, 1); gg.fillRect(12 - i, 5 + i, 2, 1); }
    }
    gbTex.needsUpdate = true;
  }

  // =====================================================================================================================
  // The loop: cycles alternate rage A (punch the CRT) and rage B (spike the Game Boy), the games rotate under them.
  const SEQ = {
    A: [['play', 0], ['stare', 0.85], ['windup', 0.5], ['punch', 0.1], ['blown', 0.6], ['after', 2.3], ['reset', 1.6], ['resume', 0.45]],
    B: [['play', 0], ['recoil', 0.45], ['grab', 0.75], ['gbplay', 1.7], ['stare', 0.5], ['windup', 0.6], ['throw', 0.6], ['flinch', 0.5], ['after', 2.0], ['reset', 1.4], ['resume', 0.45]],
  };
  const PLAYING = new Set(['play', 'recoil', 'grab', 'gbplay']);
  const cyc = { i: 0, kind: 'A', game: GAMES[0], ph: [], pi: 0, pu: 0, gu: 0, gbu: 0, rush: false };
  const cur = () => cyc.ph[cyc.pi];
  const phase = () => cyc.ph[cyc.pi].n;
  const gbFail = () => cyc.ph.find((p) => p.n === 'gbplay').d - 0.25;

  // the gamer's state: springs on every channel, so each move has weight, overshoot and settle
  const sp = {
    lean: spring(0.4, 60, 0.8), hunch: spring(0.5, 60, 0.8), twist: spring(0.05, 50, 0.8),
    yaw: spring(0, 60, 0.85), pitch: spring(0, 60, 0.85), roll: spring(0, 60, 0.8),
    recline: spring(0, 40, 0.5), swivel: spring(0, 30, 0.45), rollX: spring(0, 25, 0.9),
    jaw: spring(0.1, 120, 0.7), brow: spring(-0.35, 120, 0.7), lids: spring(0.42, 160, 0.8), soot: spring(0, 30, 1), rise: spring(0, 70, 0.7),
  };
  const hands = [-1, 1].map(() => ({ x: spring(0, 160, 0.75), y: spring(0, 160, 0.75), z: spring(0, 160, 0.75) }));
  const setHand = (i, p) => { hands[i].x.to = p.x; hands[i].y.to = p.y; hands[i].z.to = p.z; };
  const handK = (i, k, z) => { for (const c of ['x', 'y', 'z']) hands[i][c].set(k, z); };
  const getHand = (i, out) => out.set(hands[i].x.x, hands[i].y.x, hands[i].z.x);
  const wob = { kb: spring(0, 500, 0.2), can: spring(0, 120, 0.12), mouse: spring(0, 600, 0.3) };
  const kbLocal = (i, out) => out.set(keyList[i].x, keyList[i].y + 0.012, keyList[i].z).applyMatrix4(keyboard.matrixWorld);
  keyboard.updateMatrixWorld(true);
  const KEY_HOME = new V(); kbLocal(WASD[2], KEY_HOME);
  const LH_HOME = KEY_HOME.clone().add(new V(-0.085, 0.01, 0.0));
  const RH_HOME = MOUSE0.clone().add(new V(-0.08, 0.028, -0.005));
  // rage B's marks: the spot on our side of the desk where the Game Boy goes off (in front of the monitor, clear of
  // his head), the fist cocked high in front of the chair, the follow-through
  const SPIKE = new V(0.93, DESK_Y + 0.035, 0.42);
  const WIND_B = new V(-0.1, 1.3, 0.28), THROW_FT = new V(0.5, 0.92, 0.42), T_FLY = 0.15;
  const SCREEN_W = new V(), SCREEN_N = new V(), SCREEN_X = new V(), EYE_W = new V(), MOUTH_W = new V();
  const look = { w: spring(0, 14, 0.95), t: -1, cool: 0 };
  const mash = { t: 0, next: 0, key: WASD[2], lh: new V(), rate: 0 };
  const mouseAt = MOUSE0.clone();
  const gbs = { mode: 'desk', grab: 0, one: 0, wait: 0, pop: 1, p: GB_HOME.clone(), q: GB_HOME_Q.clone(), dropY: 0, dropV: 0, landT: -1, sq: spring(1, 500, 0.3), on: false, f0: new V(), q0: new Q(), ft: 0 };
  const fx = { boomT: -1, boomAt: new V(), boomPeak: 0, flashT: -1, flashAt: new V(), flashS: 0, sootT: -1, sootAt: new V(), sootN: 0, sootS: 0, sootDir: new V(), sootUp: false, plume: 0, plumeAt: new V(), plumeDark: 0, crackle: 0, sputter: 0, cough: -1 };
  let time = 0, tugOut = 0, clickQ = false;
  const tugAt = new V();
  const camShake = new V(), camShakeV = new V();

  function newCycle(i, rushed) {
    cyc.i = i; cyc.kind = i % 2 ? 'B' : 'A'; cyc.game = GAMES[i % GAMES.length];
    cyc.ph = SEQ[cyc.kind].map(([n, d]) => ({ n, d: n === 'play' ? cyc.game.fail + 0.2 : d }));
    cyc.pi = 0; cyc.pu = 0; cyc.gu = 0; cyc.gbu = 0;
    if (rushed) rage(true);
  }
  function jumpTo(name) { cyc.pi = cyc.ph.findIndex((p) => p.n === name); cyc.pu = 0; enter(name); }
  const setD = (name, d) => { const p = cyc.ph.find((q) => q.n === name); if (p) p.d = d; };
  /** Skip to the rage of this cycle (a click, or a rushed cycle). */
  function rage(fromStart = false) {
    const n = phase();
    if (!fromStart && n === 'after') { cyc.rush = true; jumpTo('reset'); return; }
    if (cyc.kind === 'A') {
      if (fromStart) { cyc.gu = Math.max(cyc.gu, cyc.game.fail + 0.05); setD('stare', 0.3); jumpTo('stare'); }
      else if (n === 'play' || n === 'stare') { cyc.gu = Math.max(cyc.gu, cyc.game.fail + 0.05); jumpTo('windup'); }
      else cyc.rush = true;
    } else {
      const hurry = () => { setD('grab', Math.min(cur().n === 'grab' ? cur().d : 9, 0.6)); setD('gbplay', 0.45); setD('stare', 0.2); setD('windup', 0.5); };
      if (fromStart || n === 'play' || n === 'recoil') { cyc.gu = Math.max(cyc.gu, cyc.game.fail + 0.05); jumpTo('grab'); hurry(); }
      else if (n === 'grab') hurry();
      else if (n === 'gbplay' || n === 'stare') { cyc.gbu = Math.max(cyc.gbu, gbFail() + 0.05); jumpTo('windup'); }
      else cyc.rush = true;
    }
  }

  /** Entering a phase: the one-off events. */
  function enter(n) {
    if (n === 'blown') smashA();
    else if (n === 'flinch') smashB();
    else if (n === 'reset' && cyc.kind === 'A') {
      const nu = mons[1 - monI];
      nu.root.visible = true; nu.state = 'drop'; nu.drop = DROP_H; nu.vy = -2.2; nu.landT = -1; nu.wait = 0.4; nu.pop = 0;   // its shadow first, then it pops in at the frame's top and slams down
      for (const s of [nu.tilt, nu.knock]) { s.x = s.v = s.to = 0; }
      nu.squash.x = 1; nu.squash.v = 0; nu.screen.material = M.off;
    } else if (n === 'reset' && cyc.kind === 'B') {
      gbDebris.forEach((b, i) => { if (b.on) b.shrinkT = -0.05 * i; });
      gbs.mode = 'drop'; gbs.dropY = 0.3; gbs.dropV = -1; gbs.landT = -1; gbs.wait = 0.3; gbs.pop = 0;
      gbs.p.copy(GB_HOME); gbs.q.copy(GB_HOME_Q);
    }
    if (n === 'reset') { fx.plume = 0; for (const q of smoke) if (q.on) q.age = Math.max(q.age, q.life * 0.62); }   // the air clears for the new one
    if (n === 'reset') { glass.forEach((b, i) => { if (b.on && b.shrinkT === null) b.shrinkT = -0.03 * i; }); caps.forEach((b, i) => { if (b.on && b.shrinkT === null) b.shrinkT = -0.04 * i; }); }
  }

  /** Rage A lands: the fist goes through the glass. */
  function smashA() {
    const m = mons[monI];
    m.state = 'dead';
    // the punch point on the screen, in canvas px (the screen faces -x; its canvas runs along +z, top at +y)
    _p.copy(arms[1].wr).addScaledVector(_c.subVectors(arms[1].wr, arms[1].el).normalize(), 0.08); m.body.worldToLocal(_p);
    const cx = (_p.z / SCR_W + 0.5) * SW * SX, cy = (0.5 - (_p.y - SCR_C.y) / SCR_H) * SH * SX;
    drawDead(clamp(cx, 22, SW * SX - 22), clamp(cy, 16, SH * SX - 16));
    m.screen.material = deadMat[0];
    m.tilt.v -= 3.2; m.knock.v += 2.4; m.tilt.to = -0.1; m.knock.to = 0.14;
    _p.set(-0.07, SCR_C.y, clamp(_p.z, -0.12, 0.12)); m.body.localToWorld(_p);
    fx.boomAt.copy(_p); fx.boomT = 0; fx.boomPeak = 2.4;
    boom(_p, _dir.copy(SCREEN_N).add(_b.set(0, 0.45, 0)).normalize(), 40, 0.1, 1.5, 0.6);
    spit(_p, SCREEN_N, 26, 3.4, 0.75);
    for (let i = 0; i < 8; i++) { rUnit(_c); puff(_b.copy(_p).addScaledVector(_c, 0.06), 0.045 + 0.025 * rand(), 1.8 + rand(), 1, _c.x * 0.2, 0.12 + 0.1 * rand(), _c.z * 0.2); }
    // glass: up and out along the screen, a little toward us: it rains on the desk in front of the monitor
    glass.forEach((b) => {
      _c.copy(_p).addScaledVector(SCREEN_X, (rand() - 0.5) * 0.2).add(_d.set(0, (rand() - 0.5) * 0.14, 0));
      launch(b, _c, _d.copy(SCREEN_N).multiplyScalar(0.1 + 0.3 * rand()).addScaledVector(SCREEN_X, (rand() - 0.5) * 1.3).add(_a.set(0.15, 0.7 + 1.1 * rand(), 0)), 10 + 20 * rand());
      rQuat(b.q); b.s = 0.7 + 0.6 * rand();
    });
    // the jolt pops keycaps off the board: up and back, onto the desk
    const pick = [16, 18, 20, 22, 24, 31, 33, 35, 37, 39];
    caps.forEach((b, i) => {
      const ki = pick[i] % keyList.length, kk = keyList[ki]; if (kk.sw > 1) return;
      kk.gone = true; b.key = kk;
      kbLocal(ki, _c);
      launch(b, _c, _d.set(0.2 + 0.45 * rand(), 1.2 + 1.0 * rand(), (rand() - 0.5) * 0.7), 14 + 14 * rand());
      b.q.copy(keyboard.quaternion); b.s = 1.45;
    });
    fx.plume = 1; fx.plumeAt.copy(_p); fx.plumeDark = 1; fx.crackle = 0.5; fx.cough = 1.25;
    jolt(1.25);
    tugOut = 1; tugAt.copy(_p);
    // the blast throws him back in the chair
    sp.lean.v -= 9; sp.recline.v += 1.9; sp.rollX.v -= 0.9; sp.pitch.v += 5; sp.jaw.v += 8;
    sp.soot.to = 1; sp.soot.x = 0.9;
  }

  /** Rage B lands: the Game Boy hits the desk, on our side, and goes off. */
  function smashB() {
    gbs.mode = 'gone';
    _p.copy(SPIKE);
    fx.boomAt.copy(_p); fx.boomAt.y += 0.05; fx.boomT = 0; fx.boomPeak = 2.2;
    boom(_p, _dir.set(0, 1, 0.45).normalize(), 40, 0.1, 1.5, 0.62, true);
    spit(_p, _dir, 24, 3.0, 0.8);
    for (let i = 0; i < 8; i++) { rUnit(_c); puff(_b.copy(_p).addScaledVector(_c, 0.05).setY(DESK_Y + 0.05), 0.045 + 0.025 * rand(), 1.6 + rand(), 1, _c.x * 0.25, 0.12 + 0.1 * rand(), _c.z * 0.25); }
    // the bits: up high and toward us, so they read against the page, then rain back onto the desk
    gbDebris.forEach((b, i) => {
      _c.copy(b.part.at).applyQuaternion(gbs.q).add(_p);
      _c.y = Math.max(_c.y, DESK_Y + 0.04);
      const big = b.part.name === 'front' || b.part.name === 'back';
      const up = b.part.name === 'cover' ? 3.0 : big ? 1.5 + 0.4 * rand() : 2.0 + 0.9 * rand();
      const a = (i / gbDebris.length) * Math.PI * 2 + 0.4;
      launch(b, _c, _d.set(-0.13 + Math.cos(a) * (big ? 0.12 : 0.2), up, 0.05 + 0.08 * rand()), (big ? 6 : 10) + 14 * rand());   // stays on the desk
      b.q.copy(gbs.q);
    });
    fx.plume = 0.75; fx.plumeAt.copy(_p); fx.plumeDark = 0.9;
    jolt(1.0);
    tugOut = 0.85; tugAt.copy(_p);
    sp.lean.v -= 4; sp.jaw.v += 6; sp.soot.to = 0.3;
  }

  /** The desk jumps: keys, papers, the can, the mouse, the camera. */
  function jolt(strength) {
    wob.kb.v += 0.45 * strength; wob.can.v += 5 * strength; wob.mouse.v += 0.3 * strength;
    keyList.forEach((kk, i) => { kk.vh += (0.2 + ((i * 37) % 11) / 11 * 0.35) * strength; });
    papers.forEach((p, i) => { p.vh += (0.5 + i * 0.25) * strength; });
    camShakeV.set(0.3, -0.7, 0).multiplyScalar(strength);
  }

  // what his hands do while he plays (mash rate, mouse moves), synced to the screen
  function activity(out) {
    const u = cyc.gu, g = cyc.game.name;
    out.mash = 0.3; out.mx = 0; out.mz = 0; out.click = false; out.lean = 0;
    if (u > cyc.game.fail) { out.mash = 0; return out; }
    const tense = smooth(0, cyc.game.fail, u);
    if (g === 'pool') {
      const q = cuePull(u);
      out.mx = -0.008 * q + 0.004 * Math.sin(u * 2.3); out.mz = 0.006 * Math.sin(u * 3.1) * (1 - smooth(1.2, 2.0, u));
      out.click = u > P_ST - 0.02 && u < P_ST + 0.1;
      out.lean = 0.12 * smooth(1.4, 2.4, u);
      out.mash = 0.15;
    } else if (g === 'toss') {
      for (const t0 of [T1, T2]) {
        const v = u - t0;
        if (v > -0.25 && v < 0.2) { out.mx += v < 0 ? -0.025 * smooth(-0.25, -0.05, v) : lerp(-0.025, 0.03, smooth(0, 0.08, v)) * (1 - smooth(0.1, 0.2, v)); out.click = v > -0.02 && v < 0.06; }
      }
      out.mz = 0.004 * Math.sin(u * 2.7);
      out.lean = 0.1 * tense;
      out.mash = 0.3 + 0.3 * tense;
    } else {
      out.mash = 0.5 + 0.5 * tense;
      out.click = Math.floor(u * 6) % 2 === 0;
      out.mx = 0.004 * Math.sin(u * 13); out.mz = 0.006 * Math.sin(u * 7.3);
      out.lean = 0.12 * tense;
    }
    return out;
  }
  const act = {};

  // the head's angles to look at a world point, in the chest's frame
  const _inv = new THREE.Matrix4(), _hp = new V(), _lp = new V();
  function aim(pt) {
    neck.getWorldPosition(_hp);
    _inv.copy(chest.matrixWorld).invert();
    _lp.copy(pt).applyMatrix4(_inv);
    _a.copy(_hp).applyMatrix4(_inv);
    _lp.sub(_a);
    _lp.y -= 0.14;
    return { yaw: Math.atan2(-_lp.z, _lp.x), pitch: Math.atan2(_lp.y, Math.hypot(_lp.x, _lp.z)) };
  }

  // the Game Boy in his hands: between them, a little ahead of the wrists, its face turned halfway between his eyes and
  // us (a stage cheat: he sees his game, we see a Game Boy)
  const _gq = new Q(), _gp = new V();
  const _gp2 = new V(), _gq2 = new Q();
  function gbHeld(outP, outQ) {
    outP.addVectors(arms[0].wr, arms[1].wr).multiplyScalar(0.5);
    _f.subVectors(arms[0].wr, arms[0].el).add(_a.subVectors(arms[1].wr, arms[1].el)).normalize();
    outP.addScaledVector(_f, 0.06); outP.y += 0.015;
    _f.subVectors(EYE_W, outP).normalize();
    _a.subVectors(camera.position, outP).normalize();
    _f.addScaledVector(_a, 1.6).normalize();
    _hu.set(0, 1, 0).addScaledVector(_f, -_f.y);
    if (_hu.lengthSq() < 0.01) _hu.set(1, 0, 0);
    _hu.normalize();
    _sd.crossVectors(_hu, _f).normalize();
    _hu.crossVectors(_f, _sd);
    _bm.makeBasis(_sd, _hu, _f);
    outQ.setFromRotationMatrix(_bm);
    if (gbs.one <= 0) return;
    // in the right fist, for the throw: along the forearm, past the knuckles, its face to us
    _f.subVectors(arms[1].wr, arms[1].el).normalize();
    _gp2.copy(arms[1].wr).addScaledVector(_f, 0.1);
    _hu.subVectors(camera.position, _gp2).addScaledVector(_f, -_a.subVectors(camera.position, _gp2).dot(_f)).normalize();
    _sd.crossVectors(_f, _hu);
    _bm.makeBasis(_sd, _f, _hu);
    _gq2.setFromRotationMatrix(_bm);
    outP.lerp(_gp2, gbs.one); outQ.slerp(_gq2, gbs.one);
  }

  const _t = new V(), LH = new V(), RH = new V();
  function step(h, input) {
    time += h;
    // ---- the loop
    cyc.pu += h; cyc.gu += h;
    while (cyc.pu >= cur().d) {
      cyc.pu -= cur().d; cyc.pi++;
      if (cyc.pi >= cyc.ph.length) { const r = cyc.rush; cyc.rush = false; newCycle(cyc.i + 1, r); break; }
      enter(phase());
    }
    const n = phase(), pu = cyc.pu, pd = cur().d, k = clamp(pu / pd, 0, 1);
    const isB = cyc.kind === 'B';

    // ---- hover: he turns to look at you, then back to his game
    look.cool -= h;
    const hov = input.hover ?? 0;
    const lookable = n === 'play' || n === 'after' || n === 'gbplay';
    if (!reduced && hov > 0.5 && look.t < 0 && look.cool <= 0 && lookable) look.t = 0;
    let lookW = 0;
    if (look.t >= 0) {
      look.t += h;
      lookW = look.t < 2.3 && lookable ? 1 : 0;
      if (look.t > 2.9 || !lookable) { look.t = -1; look.cool = 2.2; }
    }
    look.w.to = lookW; look.w.set(lookW > look.w.x ? 10 : 22, 0.95); look.w.step(h);

    // ---- base: playing
    activity(act);
    const mon = mons[monI];
    mon.root.updateMatrixWorld(true);
    SCREEN_W.copy(SCR_C).applyMatrix4(mon.body.matrixWorld);
    SCREEN_N.set(-1, 0, 0).transformDirection(mon.body.matrixWorld);
    SCREEN_X.set(0, 0, 1).transformDirection(mon.body.matrixWorld);
    EYE_W.set(0.13, 0.15, 0); head.localToWorld(EYE_W);
    MOUTH_W.set(0.16, 0.04, 0); head.localToWorld(MOUTH_W);
    const toScreen = aim(SCREEN_W), toYou = aim(camera.position);
    const tense = n === 'play' ? smooth(0.5, cyc.game.fail, cyc.gu) : 1;
    let yaw = toScreen.yaw, pitch = toScreen.pitch + 0.03 * Math.sin(time * 2 * Math.PI * 1.9) * (1 - tense * 0.7);
    let lean = 0.14 + act.lean + 0.03 * Math.sin(time * 0.6), hunch = 0.42 + 0.06 * tense, twist = 0.05;
    let recline = 0, swivel = 0.025 * Math.sin(time * 0.37), rollX = 0, jawT = 0.08 + 0.08 * act.mash, browT = lerp(-0.35, -0.85, tense), lidsT = lerp(0.48, 0.25, tense), rollH = 0;
    const lh = LH.copy(LH_HOME), rh = RH.copy(RH_HOME);
    rh.x += act.mx; rh.z += act.mz;
    let mashOn = 1, onMouse = 1, kL = 160, zL = 0.75, kR = 220, zR = 0.8, rise = 0;
    sp.lean.set(60, 0.8); sp.recline.set(40, 0.5); sp.rollX.set(25, 0.9); sp.yaw.set(70, 0.85); sp.pitch.set(60, 0.85); sp.twist.set(50, 0.8); sp.swivel.set(30, 0.6);
    gbs.on = false; gbs.one = 0;
    let gbHold = false;
    const lap = (i) => hips.localToWorld(_c.set(0.24, 0.07, i ? 0.12 : -0.12));
    // the Game Boy's grip, in the chair's frame (so it turns with him): x ahead, y up from the seat's lift
    const inChair = (out, x, y, z = 0) => chairTop.localToWorld(out.set(x, y, z));
    const holdHands = (hp) => { _d.set(0, 0, 0.08).applyQuaternion(chairTop.getWorldQuaternion(_q2)); lh.copy(hp).sub(_d); rh.copy(hp).add(_d); };
    const TURN = -0.25;                                                        // the swivel toward us, Game Boy in hand
    const HOLD = [0.53, 0.5, 0.12];                                            // where he holds it to play: out over the desk, on our side of his face

    // ---- the loop's beats
    if (n === 'stare' && !isB) {
      // A: the game burns him. Freeze. Lean in. The mouse hand comes off, clenches, trembles. An eye twitch.
      mashOn = 0; onMouse = k < 0.12 ? 1 : 0;
      const c = smooth(0.05, 0.35, k);
      lean += 0.06 * smooth(0, 0.6, k); lidsT = pu > pd * 0.6 && pu < pd * 0.6 + 0.08 ? 0.6 : 0.05; browT = -1.1; jawT = 0.0;
      rh.lerp(_t.set(0.22, 0.86, 0.33), c);                 // the fist comes up off the mouse, coiled
      rh.y += 0.004 * Math.sin(pu * 70) * c; rh.z += 0.003 * Math.sin(pu * 53) * c;
      pitch += 0.02 * Math.sin(pu * 40) * smooth(0.3, 0.6, k);
      kR = 300; zR = 0.7;
    } else if (n === 'stare') {
      // B: the Game Boy too. Freeze, staring into it.
      mashOn = 0; onMouse = 0; gbHold = true; gbs.on = true;
      holdHands(inChair(_t, HOLD[0], HOLD[1], HOLD[2]));
      swivel = TURN; twist = -0.05; lean = 0.08; hunch = 0.42;
      const a = aim(gbs.p); yaw = a.yaw; pitch = a.pitch * 0.7 + 0.02 * Math.sin(pu * 40) * smooth(0.3, 0.6, k);
      lidsT = pu > pd * 0.5 && pu < pd * 0.5 + 0.08 ? 0.6 : 0; browT = -1.1; jawT = 0;
      kL = kR = 300;
    } else if (n === 'windup' && !isB) {
      // A: rears back, the right fist cocked by his ear, the left hand grabbing the desk edge; a silent yell
      mashOn = 0; onMouse = 0;
      const w = smooth(0, 0.6, k);
      lean = lerp(lean, -0.12, w); recline = 0.1 * w; twist = lerp(twist, -0.45, w); rollX = -0.03 * w;
      rh.lerp(_t.set(0.06, 1.2, 0.27), w); lh.lerp(_t.set(DX0 + 0.04, DESK_Y + 0.04, -0.12), w);
      jawT = 0.85; browT = -1.1; lidsT = 0.0;
      kR = 120; zR = 0.7; kL = 140;
      sp.lean.set(90, 0.7);
    } else if (n === 'punch') {
      // A: the lunge: chest square, head held back and turned from the blow, the arm straight, the fist into the glass
      mashOn = 0; onMouse = 0;
      lean = 0.38; hunch = 0.12; twist = 0.5; rollX = 0.07; recline = -0.03;
      rh.copy(SCREEN_W).addScaledVector(SCREEN_X, -0.05).addScaledVector(SCREEN_N, -0.03);
      lh.set(DX0 + 0.04, DESK_Y + 0.04, -0.12);
      yaw = lerp(toScreen.yaw, toYou.yaw, 0.45); pitch = toScreen.pitch + 0.12;
      jawT = 1.0; browT = -1.1; lidsT = 0.0;
      kR = 2600; zR = 0.85;
      sp.lean.set(900, 0.75); sp.twist.set(700, 0.8); sp.rollX.set(300, 0.8); sp.yaw.set(400, 0.8);
    } else if (n === 'blown') {
      // A: blown back by his own explosion; the fist hangs a beat in the hole, then he shields his face
      mashOn = 0; onMouse = 0;
      lean = -0.18; recline = 0.17; rollX = -0.1; twist = 0.1; hunch = 0.45;
      const hang = pu < 0.12;
      if (hang) rh.copy(SCREEN_W).addScaledVector(SCREEN_X, -0.05).addScaledVector(SCREEN_N, 0.03);
      else rh.set(0.12, 1.34, 0.27);
      lh.set(0.14, 1.3, -0.22);
      jawT = 0.7; browT = 0.9; lidsT = -0.1; pitch = toScreen.pitch + 0.3;
      kR = hang ? 2000 : 140; zR = 0.6; kL = 140;
      sp.lean.set(70, 0.45); sp.recline.set(40, 0.5); sp.rollX.set(30, 0.7);
    } else if (n === 'after') {
      // slumped, breathing hard, deadpan, sooty; a cough
      mashOn = 0; onMouse = 0;
      const heave = Math.sin(pu * 8.5) * lerp(1, 0.4, k);
      lean = (isB ? 0.05 : -0.1) + 0.03 * heave; hunch = 0.72 + 0.05 * heave; recline = isB ? 0.08 : 0.16; rollX = isB ? -0.06 : -0.13; twist = 0.05;
      if (isB) swivel = TURN * 0.4;
      lh.copy(lap(0)); rh.copy(lap(1)); lh.y += 0.01 * heave; rh.y += 0.01 * heave;
      // a glare at the wreck, then the deadpan look at us (a slow blink)
      const at = aim(isB ? SPIKE : SCREEN_W);
      const toUs = smooth(isB ? 0.9 : 0.35, isB ? 1.3 : 0.75, pu);
      yaw = lerp(at.yaw, toYou.yaw * 0.8, toUs); pitch = lerp(at.pitch + 0.05, toYou.pitch, toUs) + 0.03 * heave;
      jawT = 0.25 + 0.1 * heave; browT = lerp(-1.0, -0.15, toUs); lidsT = lerp(0.3, 0.42, toUs);
      const blink = (isB ? 1.7 : 1.9);
      if (pu > blink && pu < blink + 0.13) lidsT = 1.05;
      if (!isB && pu > 1.25 && pu < 1.55) { const c = Math.sin(((pu - 1.25) / 0.3) * Math.PI); jawT = 0.9 * c; pitch -= 0.25 * c; lean += 0.12 * c; lidsT = 0.85; }
      kL = 60; kR = 60; zL = zR = 0.9;
    } else if (n === 'reset') {
      // the replacement arrives; a flinch when it lands; he rolls back in, back to work
      const landed = isB ? gbs.landT >= 0 : mons[monI].state !== 'drop' && mons[monI].landT >= 0;
      const sinceLand = isB ? gbs.landT : mons[monI].landT;
      const flinch = landed && sinceLand < 0.25;
      const back = smooth(0.6, 1.35, pu);
      lean = lerp(isB ? 0.05 : -0.1, lean, back); recline = lerp(isB ? 0.06 : 0.16, 0, back); rollX = lerp(isB ? -0.04 : -0.13, 0, back); hunch = lerp(0.72, hunch, back);
      if (flinch) { lidsT = -0.1; browT = 0.8; jawT = 0.5; } else { lidsT = 0.5; browT = -0.4; jawT = 0.1; }
      lh.lerp(lap(0), 1 - back); rh.lerp(lap(1), 1 - back);
      mashOn = back; onMouse = back > 0.8 ? 1 : 0;
      const a = aim(isB ? gbs.p : SCREEN_W); yaw = lerp(a.yaw, yaw, back); pitch = lerp(a.pitch, pitch, back);
      if (!isB && pu < 0.55) pitch = toScreen.pitch + 0.45 * smooth(0, 0.3, pu);           // looks up at it coming
      sp.recline.set(30, 0.7); sp.rollX.set(20, 0.85);
    } else if (n === 'recoil') {
      // B: the crash hits him: hands off the board, recoil, then a sneer
      mashOn = 0; onMouse = 0;
      const w = smooth(0, 0.15, k);
      lean = lerp(lean, 0.05, w); recline = 0.05 * w; hunch = 0.4;
      rh.lerp(_t.set(0.3, 1.08, 0.26), w); lh.lerp(_t.set(0.3, 1.08, -0.2), w);
      jawT = k < 0.5 ? 0.85 : 0.2; browT = k < 0.5 ? 0.8 : -1.0; lidsT = k < 0.5 ? -0.1 : 0.3;
      kL = kR = 200;
    } else if (n === 'grab') {
      // B: fine. The Game Boy, then: the right hand snatches it (no dive: a reach from the shoulder), both hands take it,
      // he swivels round toward us with it
      mashOn = 0; onMouse = 0;
      const reach = smooth(0, 0.4, k), lift = smooth(0.48, 1, k);
      gbs.grab = smooth(0.38, 0.52, k);
      _t.copy(GB_HOME).add(_a.set(-0.075, 0.03, 0));
      inChair(_b, HOLD[0], HOLD[1], HOLD[2]); _d.set(0, 0, 0.08).applyQuaternion(chairTop.getWorldQuaternion(_q2));
      rh.copy(_t).lerp(_c.copy(_b).add(_d), lift);
      lh.lerp(_c.copy(_b).sub(_d), lift);
      if (reach < 1) rh.lerp(_b.set(0.3, 1.08, 0.26), 1 - reach);
      swivel = TURN * lift; twist = lerp(0.25, -0.05, lift); lean = lerp(0.18, 0.06, lift); hunch = lerp(0.38, 0.4, lift);
      const a = aim(lift > 0.5 ? gbs.p : GB_HOME); yaw = a.yaw; pitch = a.pitch * 0.5;
      jawT = 0.05; browT = -0.8; lidsT = 0.3;
      kL = kR = 180;
      sp.swivel.set(40, 0.75);
      gbHold = gbs.grab > 0;
    } else if (n === 'gbplay') {
      // B: hunched over it, thumbs going, lit green from below
      mashOn = 0; onMouse = 0; gbHold = true; gbs.on = true;
      cyc.gbu += h;
      const fail = gbFail();
      const t2 = smooth(0, fail, cyc.gbu);
      const th = (i) => 0.006 * Math.max(0, Math.sin(time * (i ? 31 : 37)));
      holdHands(inChair(_t, HOLD[0] - 0.03 * t2, HOLD[1] + 0.02 * t2, HOLD[2]));
      lh.y += th(0); rh.y += th(1);
      swivel = TURN + 0.03 * Math.sin(time * 1.3); twist = -0.05; lean = 0.06 + 0.06 * t2; hunch = 0.4 + 0.06 * t2;
      const a = aim(gbs.p); yaw = a.yaw; pitch = a.pitch * 0.7;
      jawT = 0.12; browT = lerp(-0.6, -1.05, t2); lidsT = lerp(0.3, 0.1, t2);
      if (cyc.gbu > fail) { browT = -1.1; lidsT = 0; jawT = 0; }
      kL = kR = 400;
      sp.swivel.set(40, 0.75);
    } else if (n === 'windup') {
      // B: half up out of the chair, the Game Boy cocked high in his fist, in front of the chair back, eyes on the spot
      mashOn = 0; onMouse = 0; gbHold = true; gbs.on = true;
      const w = smooth(0, 0.6, k);
      holdHands(inChair(_t, HOLD[0], HOLD[1], HOLD[2]));
      gbs.one = smooth(0, 0.3, k);
      rh.lerp(_t.copy(WIND_B).add(_d.set(0, 0.006 * Math.sin(pu * 60) * w, 0)), w);
      lh.lerp(inChair(_t, 0.46, 0.58, -0.06), w);
      rise = 0.03 * w;
      swivel = lerp(TURN, -0.05, w); lean = lerp(0.08, -0.1, w); recline = 0.05 * w; hunch = lerp(0.48, 0.4, w); twist = lerp(-0.05, -0.35, w);
      const a = aim(SPIKE); yaw = lerp(yaw, a.yaw, w); pitch = lerp(pitch, a.pitch + 0.15, w); jawT = 0.9; browT = -1.1; lidsT = 0;
      kL = kR = 140; zL = zR = 0.7;
      sp.swivel.set(60, 0.8);
    } else if (n === 'throw') {
      // B: the whip: the arm comes over and down, lets go; it flies spinning onto the desk
      mashOn = 0; onMouse = 0; gbHold = gbs.mode === 'held';
      gbs.one = 1; gbs.on = gbs.mode === 'held';
      rh.copy(THROW_FT); lh.copy(inChair(_t, 0.3, 0.45, -0.12));
      swivel = -0.05; lean = 0.2; hunch = 0.36; twist = 0.4; rise = 0.03;
      const a = aim(SPIKE); yaw = a.yaw; pitch = a.pitch;
      jawT = 1.0; browT = -1.1; lidsT = 0;
      kL = 600; kR = 1500; zL = zR = 0.8;
      sp.lean.set(500, 0.75); sp.swivel.set(300, 0.8); sp.twist.set(400, 0.8);
    } else if (n === 'flinch') {
      // B: it goes off: he flinches back from it, hands up, face screwed up
      mashOn = 0; onMouse = 0;
      lean = -0.08; recline = 0.08; rollX = -0.05; hunch = 0.48; swivel = TURN * 0.3;
      inChair(rh, 0.28, 0.66, 0.16); inChair(lh, 0.28, 0.64, -0.14);
      jawT = 0.6; browT = 0.8; lidsT = 0.9; yaw = lerp(aim(SPIKE).yaw, toYou.yaw, 0.6); pitch = 0.15;
      kL = kR = 150; zL = zR = 0.6;
      sp.lean.set(70, 0.5);
    } else if (n === 'resume') {
      lean = lerp(lean - 0.1, lean, k);
    }
    // the stare at the viewer (hover) wins over the head, briefly
    const L = look.w.x;
    if (L > 0.001) {
      const y2 = clamp(toYou.yaw, -2.2, 2.2);
      yaw = lerp(yaw, y2 * 0.75, L); pitch = lerp(pitch, toYou.pitch, L);
      twist = lerp(twist, y2 * 0.2, L);
      browT = lerp(browT, -0.95, L); lidsT = lerp(lidsT, 0.55, L); jawT = lerp(jawT, 0.0, L);
      mashOn *= 1 - L * 0.7;
      if (look.t > 1.3 && look.t < 1.75) rollH = 0.1 * Math.sin((look.t - 1.3) * 28) * L;
    }

    // ---- mashing: the left hand hops between W, A, S and D; each press drops the key under it
    mash.rate = act.mash * mashOn;
    mash.t += h;
    if (mash.rate > 0.02 && mash.t >= mash.next) {
      mash.t = 0; mash.next = 1 / (3 + 11 * mash.rate);
      mash.key = WASD[((time * 977) | 0) % 4];
      keyList[mash.key].press = 1;
    }
    kbLocal(mash.key, mash.lh);
    lh.lerp(_c.copy(mash.lh).add(_t.set(-0.085, 0.01, 0)), mashOn * 0.8);
    const tap = mash.rate > 0.02 ? Math.max(0, Math.sin((mash.t / mash.next) * Math.PI)) : 0;
    lh.y += 0.014 * tap * mashOn;
    if (act.click && onMouse > 0.5) { rh.y -= 0.004; wob.mouse.x = -0.002; }

    // ---- targets into springs
    handK(0, kL, zL); handK(1, kR, zR);
    setHand(0, lh); setHand(1, rh);
    sp.lean.to = lean; sp.hunch.to = hunch; sp.twist.to = twist; sp.yaw.to = yaw; sp.pitch.to = pitch; sp.roll.to = rollH;
    sp.rise.to = rise; sp.recline.to = recline; sp.swivel.to = swivel; sp.rollX.to = rollX; sp.jaw.to = jawT; sp.brow.to = browT; sp.lids.to = lidsT;
    if (n === 'resume' || (n === 'play' && cyc.gu < 0.5)) sp.soot.to = 0;
    if (n === 'reset') sp.soot.to = Math.min(sp.soot.to, 1 - smooth(0.6, 1.4, pu));
    if (L > 0.01) sp.yaw.set(40, 0.85);
    for (const s of Object.values(sp)) s.step(h);
    for (const hd of hands) for (const c of ['x', 'y', 'z']) hd[c].step(h);
    for (const hd of hands) if (hd.x.x > DX0 - 0.02 && hd.y.x < DESK_Y + 0.03) { hd.y.x = DESK_Y + 0.03; if (hd.y.v < 0) hd.y.v *= -0.15; }
    if (onMouse > 0.5) mouseAt.set(hands[1].x.x + 0.08, MOUSE0.y, hands[1].z.x + 0.005);

    // ---- the Game Boy: on the desk, in his hands, flying, gone, or dropping in fresh
    if (gbs.mode === 'desk' || gbs.mode === 'held') {
      if (gbHold) {
        gbs.mode = 'held';
        gbHeld(_gp, _gq);
        const a = n === 'grab' ? gbs.grab : 1;
        gbs.p.copy(GB_HOME).lerp(_gp, a); gbs.q.copy(GB_HOME_Q).slerp(_gq, a);
        if (n === 'throw' && pu > 0.06) { gbs.mode = 'fly'; gbs.ft = 0; gbs.f0.copy(gbs.p); gbs.q0.copy(gbs.q); }   // let go
      } else { gbs.mode = 'desk'; gbs.p.copy(GB_HOME); gbs.q.copy(GB_HOME_Q); }
    } else if (gbs.mode === 'fly') {
      gbs.ft += h;
      const s = Math.min(1, gbs.ft / T_FLY), e = s * (0.75 + 0.25 * s);
      gbs.p.lerpVectors(gbs.f0, SPIKE, e); gbs.p.y += 0.05 * 4 * s * (1 - s);
      gbs.q.copy(gbs.q0).premultiply(_q.setFromAxisAngle(_a.set(0.2, 0.3, 1).normalize(), -gbs.ft * 26));
      if (s >= 1 && n === 'throw') cyc.pu = cur().d;                         // it hit: straight to the burst
    } else if (gbs.mode === 'drop' && gbs.wait > 0) gbs.wait -= h;
    else if (gbs.mode === 'drop') {
      gbs.pop = Math.min(1, gbs.pop + h / 0.08);
      gbs.dropV -= 9.8 * h; gbs.dropY += gbs.dropV * h;
      if (gbs.dropY <= 0) {
        if (gbs.landT < 0) { gbs.landT = 0; gbs.sq.v -= 4; jolt(0.25); }
        gbs.dropY = 0; gbs.dropV = gbs.dropV < -1 ? -gbs.dropV * 0.25 : 0;
      }
      if (gbs.landT >= 0) gbs.landT += h;
      gbs.p.copy(GB_HOME).setY(GB_HOME.y + gbs.dropY);
      gbs.q.copy(GB_HOME_Q).premultiply(_q.setFromAxisAngle(_a.set(0, 1, 0), gbs.dropY * 2.5));
      if (n !== 'reset' && gbs.landT > 0.3) gbs.mode = 'desk';
    }
    gbs.sq.to = 1; gbs.sq.step(h);

    // ---- the monitors
    for (const m of mons) {
      m.tilt.step(h); m.knock.step(h); m.squash.step(h);
      if (m.state === 'drop' && m.wait > 0) m.wait -= h;
      else if (m.state === 'drop') {
        m.pop = Math.min(1, m.pop + h / 0.02);                                  // there at once, stretched with speed
        m.vy -= 9.8 * h; m.drop += m.vy * h;
        const old = mons[monI];
        if (m !== old) { old.squash.x = clamp(m.drop / (MON_TOP + 0.02), 0.04, 1); old.squash.v = 0; }
        if (m.drop <= 0) {
          m.drop = 0; m.vy = 0; m.state = 'boot'; m.landT = 0; m.squash.x = 0.78; m.squash.v = 0;
          old.state = 'crushed'; old.crushT = 0; old.squash.x = 0.07; old.squash.v = 0;   // a pancake under the new one, a beat, then gone
          monI = mons.indexOf(m);
          jolt(0.45); tugOut = Math.max(tugOut, 0.35); tugAt.set(MON.x, DESK_Y, MON.z);
          // the old one's last breath, squeezed out flat to the sides
          for (let i = 0; i < 4; i++) { const a = (i / 4) * 6.28 + 0.5; puff(_c.set(MON.x + Math.cos(a) * 0.14, DESK_Y + 0.04, MON.z + Math.sin(a) * 0.16), 0.04, 0.9, 0.7, Math.cos(a) * 0.3, 0.04, Math.sin(a) * 0.3, 0.55); }
          fx.plume = 0; fx.crackle = 0;
          for (const q of smoke) if (q.on && q.p.distanceTo(fx.plumeAt) < 0.35) q.age = Math.max(q.age, q.life * 0.8);   // the old smoke goes with it
        }
      }
      if (m.state === 'boot') { m.landT += h; if (m.landT > 0.3) m.screen.material = liveMat; if (m.landT > 0.9) m.state = 'live'; }
      if (m.state === 'crushed') { m.crushT += h; m.squash.x = 0.07; m.squash.v = 0; m.pop = 1 - smooth(0.4, 0.62, m.crushT); if (m.crushT > 0.62) { m.root.visible = false; m.state = 'gone'; m.pop = 1; } }
    }

    // ---- the desk's things: jolts
    for (const w of Object.values(wob)) w.step(h);
    keyList.forEach((kk) => {
      kk.press = Math.max(0, kk.press - h * 14);
      kk.vh -= 9.8 * h; kk.hop += kk.vh * h;
      if (kk.hop < 0) { kk.hop = 0; kk.vh = kk.vh < -0.2 ? -kk.vh * 0.3 : 0; }
    });
    papers.forEach((p) => { p.vh -= 9.8 * h; p.hop += p.vh * h; if (p.hop < 0) { p.hop = 0; p.vh = p.vh < -0.2 ? -p.vh * 0.35 : 0; } });
    camShakeV.addScaledVector(camShake, -500 * h).multiplyScalar(Math.exp(-12 * h));
    camShake.addScaledVector(camShakeV, h);

    stepFX(h, n, pu);
    // the screen's light follows its picture
    glow.c.lerp(glow.tc, 1 - Math.exp(-h * 14));
    glow.i += (glow.ti - glow.i) * (1 - Math.exp(-h * 12));
  }

  function stepFX(h, n, pu) {
    // smoke from the wreck: thick at first, thinning; the reset clears it
    if (fx.plume > 0) {
      fx.plume = Math.max(0, fx.plume - h * (n === 'reset' ? 2 : 0.22));
      const rate = 3 + 13 * fx.plume;
      if (rand() < rate * h) {
        const m = mons[monI];
        if (cyc.kind === 'A') { if (rand() < 0.4) _c.set(0.2, 0.42, 0).applyMatrix4(m.body.matrixWorld); else _c.copy(fx.plumeAt).addScaledVector(SCREEN_N, 0.02); }   // out of the hole, and the vents
        else _c.copy(rand() < 0.3 && gbDebris[0].on ? gbDebris[0].p : fx.plumeAt);                           // the scorch, and the smouldering shell
        puff(_c.add(_d.set((rand() - 0.5) * 0.06, 0, (rand() - 0.5) * 0.06)), 0.035 + 0.035 * rand() * (0.5 + fx.plume), 1.7 + 0.7 * rand(), fx.plumeDark * (0.3 + 0.7 * fx.plume), (rand() - 0.5) * 0.06, 0.12 + 0.1 * rand(), (rand() - 0.5) * 0.06);
      }
    }
    // the dead CRT sputters: a crackle of sparks, its picture flickers back for a frame
    if (fx.crackle > 0 && mons[monI].state === 'dead') {
      fx.crackle -= h;
      fx.sputter -= h;
      if (fx.crackle <= 0) {
        fx.crackle = 0.55 + 0.6 * rand();
        spit(fx.plumeAt, SCREEN_N, 4 + ((rand() * 4) | 0), 1.6, 0.8);
        fx.sputter = 0.07;
      }
      mons[monI].screen.material = fx.sputter > 0 ? deadMat[1] : deadMat[0];
    }
    if (fx.sootT >= 0 && (fx.sootT -= h) < 0) {
      for (let i = 0; i < fx.sootN; i++) {
        rUnit(_fd); if (fx.sootUp) _fd.y = Math.abs(_fd.y); _fd.lerp(fx.sootDir, 0.4).normalize();
        puff(_c.copy(fx.sootAt).addScaledVector(_fd, fx.sootS * (0.5 + 0.6 * rand())), fx.sootS * (0.35 + 0.3 * rand()), 1.2 + 0.6 * rand(), 1, _fd.x * 0.3, 0.12 + _fd.y * 0.2, _fd.z * 0.3);
      }
    }
    // the cough: little puffs out of his mouth
    if (fx.cough >= 0 && n === 'after' && pu > fx.cough) {
      fx.cough = -1;
      for (let i = 0; i < 3; i++) puff(_c.copy(MOUTH_W).add(_d.set(0.02 * i, 0, 0)), 0.018 + 0.008 * i, 0.9, 0.6, 0.25, 0.12, 0.02);
    }
    for (const f of fire) {
      if (!f.on) continue;
      f.age += h;
      // a fire puff that smokes turns to smoke while it's still big (not a dark red rock shrinking away)
      if (f.age >= f.life || (f.smoked && f.age >= f.life * 0.5)) { f.on = false; if (f.smoked) puff(f.p, f.s * 0.8, 1.3 + 0.6 * rand(), 0.95, f.v.x * 0.2, 0.3, f.v.z * 0.2); continue; }
      f.v.multiplyScalar(Math.exp(-5.5 * h)); f.v.y += 0.7 * h;
      f.p.addScaledVector(f.v, h);
      const wl = f.w.length(); if (wl > 0) { _q.setFromAxisAngle(_a.copy(f.w).divideScalar(wl), wl * h); f.q.premultiply(_q); }
    }
    for (const s of sparks) {
      if (!s.on) continue;
      s.age += h;
      if (s.age >= s.life) { s.on = false; continue; }
      s.v.y -= 7.5 * h; s.v.multiplyScalar(Math.exp(-1.2 * h));
      s.p.addScaledVector(s.v, h);
      const g = ground(s);
      if (s.p.y < g) { s.p.y = g; s.v.y *= -0.35; s.v.x *= 0.6; s.v.z *= 0.6; }
    }
    const clear = n === 'reset' ? 2.2 : 1;                                    // the reset hurries the smoke away
    for (const s of smoke) {
      if (!s.on) continue;
      s.age += h * clear;
      if (s.age >= s.life) { s.on = false; continue; }
      s.v.y += (0.14 + 0.2 * s.dark * (1 - s.age / s.life) - s.v.y) * 1.1 * h;   // hot black smoke billows up, then drifts
      s.v.x += (-0.05 - s.v.x) * 0.6 * h; s.v.z += (-0.03 - s.v.z) * 0.6 * h;   // a slow draught toward the back
      s.p.addScaledVector(s.v, h);
      const wl = s.w.length(); if (wl > 0) { _q.setFromAxisAngle(_a.copy(s.w).divideScalar(wl), wl * h); s.q.premultiply(_q); }
    }
    bodies.forEach((b) => stepBody(b, h));
    if (fx.boomT >= 0) { fx.boomT += h; if (fx.boomT > 1.2) fx.boomT = -1; }
    if (fx.flashT >= 0) { fx.flashT += h; if (fx.flashT > 0.3) fx.flashT = -1; else flash.rotateOnAxis(_a.set(0.3, 1, 0.2).normalize(), h * 3); }
  }

  // ---- pose everything from the state
  const lpole = new V(), feet = [new V(0.4, 0.075, -0.13), new V(0.42, 0.075, 0.14)];
  /** How much a ball of radius r at p must shrink to stay inside the box (1 = it fits). */
  const _ib = new V(), _ic = new V();
  function inBox(p, r) {
    _ib.copy(p).project(camera);
    let k = 1;
    for (const [v, sx, sy] of [[cRight, 1, 0], [cRight, -1, 0], [cUp, 0, 1]]) {
      _ic.copy(p).addScaledVector(v, r * (sx || sy)).project(camera);
      const d = sx ? (_ic.x - _ib.x) * sx : _ic.y - _ib.y, room = sx ? 0.96 - _ib.x * sx : 0.96 - _ib.y;
      if (d > room) k = Math.min(k, Math.max(0.05, room / d));
    }
    return k;
  }
  function writePool(mesh, list, fn) {
    let i = 0;
    for (const p of list) { if (p.on) { fn(p, i); i++; } }
    mesh.visible = i > 0;
    if (i === 0) { mesh.setMatrixAt(0, _m4.makeScale(0, 0, 0)); i = 1; }
    mesh.count = i;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }
  function pose() {
    chairBase.position.x = sp.rollX.x;
    hips.position.set(0.02 + sp.rise.x * 0.6, 0.12 + sp.rise.x, 0);
    chairTop.rotation.set(0, sp.swivel.x, sp.recline.x);
    spine.rotation.z = -sp.lean.x;
    chest.rotation.set(0, sp.twist.x, -sp.hunch.x);
    const yaw = sp.yaw.x, pitch = sp.pitch.x;
    neck.rotation.set(0, yaw * 0.35, pitch * 0.3 - 0.25);
    head.rotation.set(sp.roll.x, yaw * 0.65, pitch * 0.7 + 0.25 * 0.95);
    jaw.rotation.z = -0.5 * clamp(sp.jaw.x, 0, 1.2);
    const lids = clamp(sp.lids.x, -0.2, 1.1), brow = sp.brow.x;
    for (const e of eyes) {
      e.lid.rotation.set(0, 0, lerp(0.75, -1.5, lids));
      e.brow.position.set(0.148, 0.208 + 0.012 * brow, e.s * 0.062);
      e.brow.rotation.set(-e.s * 0.32 * brow, 0, -0.15);
    }
    const soot = clamp(sp.soot.x, 0, 1);
    M.skin.color.copy(SKIN).lerp(SOOT, soot); M.skinD.color.copy(SKIND).lerp(SOOTD, soot);
    chairBase.updateMatrixWorld(true);

    arms.forEach((arm, i) => {
      arm.sh.set(-0.01, 0.2, arm.s * 0.155); chest.localToWorld(arm.sh);
      getHand(i, arm.tgt);
      lpole.set(-0.35, -0.6, arm.s * 0.9).normalize();
      ik(arm.sh, arm.tgt, UA, FA, lpole, arm.el, arm.wr);
      seg(arm.upper, arm.sh, arm.el);
      _c.subVectors(arm.wr, arm.el).normalize();
      _p.copy(arm.wr).addScaledVector(_c, -0.035);
      seg(arm.fore, arm.el, _p);
      seg(arm.cuff, _p, arm.wr);
      arm.elbow.position.copy(arm.el);
      const low = smooth(DESK_Y + 0.2, DESK_Y + 0.06, arm.wr.y);
      placeHand(arm, 0.75 * low);
    });
    const calm = PLAYING.has(phase());
    legs.forEach((leg, i) => {
      leg.hip.set(0.03, -0.02, leg.s * 0.09); hips.localToWorld(leg.hip);
      _t.copy(feet[i]); _t.x += sp.rollX.x;
      const jig = i === 1 && calm ? 0.018 * Math.max(0, Math.sin(time * 15)) : 0;
      _t.y += jig;
      lpole.set(1, 0.4, leg.s * 0.25).normalize();
      ik(leg.hip, _t, TH, SH_, lpole, leg.kn, leg.an);
      seg(leg.thigh, leg.hip, leg.kn); seg(leg.shin, leg.kn, leg.an);
      leg.knee.position.copy(leg.kn);
      leg.shoe.position.set(leg.an.x - 0.01, leg.an.y - 0.075 - jig * 0.3, leg.an.z);
      leg.shoe.rotation.set(0, leg.s * -0.15, -jig * 3);
    });
    flushSlots();
    strings.forEach((s) => {
      _p.copy(s.at); chest.localToWorld(_p);
      s.m.position.copy(_p); s.m.quaternion.setFromUnitVectors(_c.set(0, -1, 0), s.d); s.m.scale.set(1, s.len, 1);
      s.tip.position.copy(_p).addScaledVector(s.d, s.len); s.tip.quaternion.copy(s.m.quaternion);
    });

    // the desk's things
    for (const m of mons) {
      m.body.position.y = m.drop;
      m.body.rotation.set(0, m.knock.x, m.tilt.x);
      const sq = m.squash.x;
      const st = m.state === 'drop' ? clamp(0.06 - m.vy * 0.03, 0, 0.16) : 0, pp = Math.max(1e-4, m.pop);   // stretched as it falls
      m.body.scale.set(pp * (1 + (1 - sq) * 0.35 - st * 0.4), pp * (sq + st), pp * (1 + (1 - sq) * 0.35 - st * 0.4));
      // a falling thing's shadow arrives first: it darkens and tightens on the desk before the monitor appears
      const pre = m.state === 'drop' && m.pop <= 0 ? 1 - clamp(m.wait / 0.4, 0, 1) : 1;
      m.shadow.visible = m.state !== 'gone' && m.state !== 'crushed';
      m.shadow.material.opacity = 0.5 * pre * (m.state === 'drop' ? lerp(0.55, 1, clamp(1 - m.drop / DROP_H, 0, 1)) : 1);
      m.shadow.scale.set(0.42 * (1.5 - 0.5 * pre), 1, 0.62 * (1.5 - 0.5 * pre));
    }
    keyboard.position.y = DESK_Y + Math.max(0, wob.kb.x * 0.02);
    can.rotation.set(wob.can.x * 0.06, 0, wob.can.x * 0.04);
    mouse.position.set(mouseAt.x, MOUSE0.y + Math.max(0, wob.mouse.x * 0.02), mouseAt.z);
    mouse.rotation.y = -0.1 + (mouseAt.z - MOUSE0.z) * 2;
    papers.forEach((p) => { p.m.position.y = p.y0 + p.hop; });
    caps.forEach((b) => { if (!b.on && b.key) { b.key.gone = false; b.key = null; } });
    drawKeys();
    if (gbs.mode === 'held') {
      gbHeld(_gp, _gq);
      const a = phase() === 'grab' ? gbs.grab : 1;
      gbs.p.copy(GB_HOME).lerp(_gp, a); gbs.q.copy(GB_HOME_Q).slerp(_gq, a);
    }
    gb.position.copy(gbs.p); gb.quaternion.copy(gbs.q);
    const gsq = gbs.sq.x;
    const gp = gbs.mode === 'drop' ? Math.max(1e-4, gbs.pop) : 1;
    gb.scale.set(gp * (1 + (1 - gsq) * 0.3), gp * (1 + (1 - gsq) * 0.3), gp * gsq);
    gb.visible = gbs.mode !== 'gone';
    gbShadow.visible = gb.visible && gbs.mode !== 'held';
    gbShadow.material.opacity = 0.45 * (gbs.mode === 'drop' ? gbs.pop * clamp(1 - gbs.dropY * 1.5, 0, 1) : 1);

    // lights: the screen's glow, the Game Boy's, the blast
    const mon = mons[monI];
    mon.root.updateMatrixWorld(true);
    glowL.position.set(-0.12, 0.27, 0).applyMatrix4(mon.body.matrixWorld);
    glowL.color.copy(glow.c).lerp(WHITE, 0.5);                               // a hint of the game's colour, not a wash
    const live = mon.state === 'live' || (mon.state === 'boot' && mon.landT > 0.3);
    glowL.intensity = live ? GLOW_I * glow.i : mon.state === 'dead' && fx.sputter > 0 ? GLOW_I * 1.2 : 0;
    gbL.position.copy(gbs.p).add(_a.set(0, 0, 0.07).applyQuaternion(gbs.q));
    gbL.color.set(0x9bbc0f).lerp(WHITE, 0.45);
    gbL.intensity = gbs.on ? GB_I : 0;
    if (fx.boomT >= 0) {
      const t = fx.boomT;
      boomL.position.copy(fx.boomAt);
      boomL.intensity = fx.boomPeak * Math.exp(-t * 6) * (0.75 + 0.25 * Math.sin(t * 70)) * smooth(0, 0.02, t);
      boomL.color.setRGB(1, lerp(0.75, 0.35, smooth(0, 0.4, t)), lerp(0.4, 0.08, smooth(0, 0.3, t)));
    } else boomL.intensity = 0;
    feetShadow.position.x = 0.42 + sp.rollX.x * 0.5;
    if (fx.flashT >= 0 && fx.flashT < 0.2) {
      const t = fx.flashT, sc = fx.flashS * (t < 0.035 ? 0.3 + 0.7 * t / 0.035 : 1 - smooth(0.035, 0.2, t) * 0.92);
      flash.visible = true; flash.position.copy(fx.flashAt); flash.scale.setScalar(sc * inBox(fx.flashAt, sc * 1.9));
      fxMat.flash.color.setRGB(1, lerp(0.97, 0.78, smooth(0, 0.15, t)), lerp(0.85, 0.3, smooth(0, 0.15, t)));
    } else flash.visible = false;

    // FX instances
    writePool(fireMesh, fire, (f, i) => {
      const u = f.age / f.life;
      let sc = Math.max(1e-4, f.s * (0.35 + 0.65 * smooth(0, 0.18, u)) * (1 - smooth(0.5, 1, u)));
      if (f.spike) {
        const v = f.v.length();
        _b.copy(f.v).divideScalar(Math.max(v, 1e-4));
        _a.copy(f.p).addScaledVector(_b, sc * (0.9 + 0.5 * v) * 0.6).project(camera);                    // its tip burns out before the box's edge
        sc *= 1 - smooth(0.82, 0.97, Math.max(Math.abs(_a.x), Math.abs(_a.y)));
        _q.setFromUnitVectors(_a.set(0, 0, 1), _b);
        fireMesh.setMatrixAt(i, _m4.compose(f.p, _q, _s.set(sc * 0.26 + 1e-5, sc * 0.26 + 1e-5, sc * (0.9 + 0.5 * v) + 1e-5)));
      } else fireMesh.setMatrixAt(i, _m4.compose(f.p, f.q, _s.setScalar(sc)));
      fireMesh.setColorAt(i, ramp(FIRE_RAMP, clamp(u * (1.2 - 0.45 * f.hot), 0, 1), _col));
    });
    writePool(sparkMesh, sparks, (s, i) => {
      const u = s.age / s.life, v = s.v.length();
      _q.setFromUnitVectors(_a.set(0, 0, 1), _b.copy(s.v).divideScalar(Math.max(v, 1e-4)));
      _a.copy(s.p).project(camera);
      const edge = 1 - smooth(0.8, 0.94, Math.max(Math.abs(_a.x), Math.abs(_a.y)));   // sparks burn out before the box's edge
      const th = 0.007 * (1 - u * 0.6) * edge + 1e-5;
      sparkMesh.setMatrixAt(i, _m4.compose(s.p, _q, _s.set(th, th, clamp(v * 0.022, 0.01, 0.07) * edge + 1e-5)));
      sparkMesh.setColorAt(i, _col.copy(SPARK_A).lerp(SPARK_B, u));
    });
    // smoke: back to front (it's see-through), each puff swelling as it rises and thinning away, never shrinking
    smokeOrder.length = 0;
    camera.getWorldDirection(_dir);
    for (const s of smoke) if (s.on) { s.depth = _a.subVectors(s.p, camera.position).dot(_dir); smokeOrder.push(s); }
    smokeOrder.sort((a, b) => b.depth - a.depth);
    writePool(smokeMesh, smokeOrder, (s, i) => {
      const u = s.age / s.life;
      const sc = Math.max(1e-4, s.s * (0.75 + 1.0 * Math.sqrt(u)));
      smokeMesh.setMatrixAt(i, _m4.compose(s.p, s.q, _s.set(sc * s.sx, sc * s.sy, sc)));
      _col.copy(SMOKE_MID).lerp(SMOKE_LIGHT, smooth(0.1, 0.9, u));
      smokeMesh.setColorAt(i, _col.lerp(SMOKE_DARK, s.dark * (1 - smooth(0.1, 0.8, u))));
      // it thins out before it reaches the box's top or sides (the box's edges are invisible on the page: no slicing)
      const r = sc * 1.35;
      const ey = _a.copy(s.p).addScaledVector(cUp, r).project(camera).y;
      const ex = Math.max(_a.copy(s.p).addScaledVector(cRight, r).project(camera).x, -_b.copy(s.p).addScaledVector(cRight, -r).project(camera).x);
      const edge = (1 - smooth(0.8, 0.98, ey)) * (1 - smooth(0.84, 0.99, ex));
      smokeAlpha.setX(i, (0.55 + 0.35 * s.dark) * smooth(0, 0.025, u) * (1 - smooth(0.35, 1, u)) * edge);
    });
    smokeAlpha.needsUpdate = true;
    writePool(glassMesh, glass, (b, i) => { glassMesh.setMatrixAt(i, _m4.compose(b.p, b.q, _s.setScalar(Math.max(1e-4, b.s * b.sc)))); });
    writePool(capMesh, caps, (b, i) => { capMesh.setMatrixAt(i, _m4.compose(b.p, b.q, _s.setScalar(Math.max(1e-4, b.s * b.sc)))); capMesh.setColorAt(i, b.key ? b.key.col : KEY_BONE); });
    gbDebris.forEach((b) => b.write(b));
  }
  function stepStrings(h) {
    strings.forEach((s) => {
      _c.set(0, -1, 0).addScaledVector(s.d, -1);
      s.v.addScaledVector(_c, 60 * h).multiplyScalar(Math.exp(-5 * h));
      s.d.addScaledVector(s.v, h).normalize();
    });
  }

  // ---- the screens: the live CRT at 15 fps
  function drawScreens() {
    const mon = mons[monI], n = phase();
    if (mon.state === 'boot') {
      const nextGame = n === 'reset' || n === 'resume' ? GAMES[(cyc.i + 1) % GAMES.length] : cyc.game;
      drawBoot(clamp((mon.landT - 0.3) / 0.45, 0, 1), nextGame);
    } else if (mon.state === 'live') {
      if (n === 'reset' || n === 'resume') {
        if (cyc.kind === 'B' && n === 'reset' && cyc.pu < 0.14) {                                  // a channel flick to the next game
          for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x += 3) R(x, y, 3, 1, ((x * 7 + y * 13 + ((time * 60) | 0) * 5) % 9) > 4 ? '#bdbdbd' : '#222');
          glow.tc.set(0xffffff); glow.ti = 0.8;
        } else GAMES[(cyc.i + 1) % GAMES.length].draw(0);
      } else cyc.game.draw(cyc.gu);
    } else return;
    blit();
    screenTex.needsUpdate = true;
  }

  // ---- framing: a three-quarter view from his right, a little in front, fitted to the view's box (smoke included)
  const AZ = 1.3, EL = 0.15;                         // azimuth from his forward (+x) round toward +z; elevation
  const camDir = new V(Math.cos(EL) * Math.cos(AZ), Math.sin(EL), Math.cos(EL) * Math.sin(AZ));
  const camTarget = new V(), camBase = new V();
  const cRight = new V().crossVectors(new V(0, 1, 0), camDir).normalize();
  const cUp = new V().crossVectors(camDir, cRight);
  const FRAME_PTS = [
    [-0.42, 1.27, 0], [-0.6, 1.22, -0.11], [-0.64, 1.15, 0], [-0.76, 1.08, 0.15], [0.12, 1.5, 0.05], [-0.02, 1.5, 0.34], [-0.32, 0.0, 0.3], [-0.32, 0.0, -0.3], [0.3, 0.0, 0.3], [DX0, DESK_Y, DZ], [DX1, DESK_Y, DZ], [DX0, 0, DZ], [DX1, 0, DZ],
    [DX1, DESK_Y, -DZ], [DX1, 0, -DZ], [MON.x, 1.42, MON.z], [0.1, 1.42, 0.3],
  ].map((p) => new V(...p));
  let camD = 5;
  const tmp = new V();
  function place(target, d) { camera.position.copy(target).addScaledVector(camDir, d); camera.lookAt(target); camera.updateMatrixWorld(); }
  function fit(w, h) {
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
    const [bx0, bx1, by0, by1] = [-0.955, 0.975, -0.965, 0.95];
    const ty = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), tx = ty * camera.aspect;
    camTarget.set(0.35, 0.75, 0); let d = 5;
    for (let it = 0; it < 14; it++) {
      place(camTarget, d);
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const p of FRAME_PTS) { tmp.copy(p).project(camera); x0 = Math.min(x0, tmp.x); x1 = Math.max(x1, tmp.x); y0 = Math.min(y0, tmp.y); y1 = Math.max(y1, tmp.y); }
      const kk = Math.max((x1 - x0) / (bx1 - bx0), (y1 - y0) / (by1 - by0));
      camTarget.addScaledVector(cRight, ((x0 + x1) / 2 - (bx0 + bx1) / 2) * tx * d).addScaledVector(cUp, ((y0 + y1) / 2 - (by0 + by1) / 2) * ty * d);
      d *= kk;
    }
    camD = d;
    place(camTarget, d);
    camBase.copy(camera.position);
    // the world height of the frame's top over the desk: a new monitor pops in just below it
    let lo = DESK_Y, hi = 3;
    for (let it = 0; it < 24; it++) { const m = (lo + hi) / 2; if (tmp.set(MON.x, m, MON.z).project(camera).y < 0.97) lo = m; else hi = m; }
    DROP_H = clamp(lo - 0.03 - DESK_Y - MON_TOP * 1.06, 0.08, 0.4);
  }
  fit(520, 380);

  // ---- the opening frame (and the reduced-motion still): the shot rimmed out, MISS on the screen, the bin laughing;
  // he has frozen, glaring, the mouse hand off the mouse and clenched. About to lose it.
  newCycle(0, false);
  setD('stare', 1.0);
  mons[0].screen.material = liveMat;
  drawGB(0, 9, false);
  {
    const quiet = { hover: 0 };
    cyc.gu = cyc.pu = cyc.game.fail - 0.6;
    for (let i = 0; i < 75; i++) { step(H, quiet); stepStrings(H); pose(); if (i % 4 === 0) drawScreens(); }
  }
  drawScreens();
  glow.c.copy(glow.tc); glow.i = glow.ti;
  pose();

  // ---- per frame
  let accT = 0, frameS = -1, frameG = -1;
  const idle = { x: 0, y: 0, hover: 0, inside: false, clicked: false };
  return {
    scene, camera,
    resize(w, h) { fit(w, h); },
    update(dt, t, input = idle) {
      if (input.clicked && !reduced) clickQ = true;                         // kept until a tick runs (dt = 0 frames too)
      if (clickQ && dt > 0) { clickQ = false; rage(false); }
      if (dt > 0) {
        accT = Math.min(accT + dt, 0.1);
        while (accT >= H - 1e-6) { accT -= H; step(H, input); stepStrings(H); }
      }
      pose();
      const f = Math.floor(time * 15);
      if (f !== frameS) { frameS = f; drawScreens(); }
      const g = Math.floor(time * 10);
      if (g !== frameG) {
        frameG = g;
        const n = phase();
        if (cyc.kind === 'B' && (n === 'gbplay' || n === 'stare' || n === 'windup' || n === 'throw')) drawGB(cyc.gbu, gbFail(), true);
        else if (gbs.mode === 'drop') drawGB(0, 9, false);
      }
      // camera: a slow drift, a lean toward the pointer, the impacts' kick
      const hv = reduced ? 0 : input.hover ?? 0;
      camera.position.copy(camBase)
        .addScaledVector(cRight, camD * (0.007 * Math.sin(time * 0.23) + 0.012 * clamp(input.x ?? 0, -1, 1) * hv + 0.012 * camShake.x))
        .addScaledVector(cUp, camD * (0.004 * Math.sin(time * 0.17) + 0.008 * clamp(input.y ?? 0, -1, 1) * hv + 0.012 * camShake.y));
      camera.lookAt(camTarget);
      // the page's web feels the impacts
      if (tugOut > 0 && dt > 0 && input.rect && (input.visible ?? 1) > 0.3) {
        _p.copy(tugAt).project(camera);
        stage.emit('tug', { strength: tugOut, x: input.rect.left + ((_p.x + 1) / 2) * input.vw, y: input.rect.top + ((1 - _p.y) / 2) * input.vh });
      }
      tugOut = 0;
    },
    dispose() {
      scene.traverse((o) => { if (o.isInstancedMesh) o.dispose(); });
      owned.forEach((g) => g.dispose());
      Object.values(M).forEach((m) => m.dispose());
      Object.values(fxMat).forEach((m) => m.dispose());
      extraMats.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      scene.clear();
    },
  };
}
