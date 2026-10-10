// The testers' corner on the home page: a low-poly kid of fourteen or so (a kid's proportions: a big round head, a
// small face with big eyes, a button nose, a short round chin; red hoodie, messy brown hair, a red headset), hunched
// at his desk in a racing chair, playing on a chunky CRT, a Game Boy by his hand. Seen from his right, a little in
// front: his profile (eyes with whites under brows that carry the mood, a mouth that clenches its teeth or yells, hands
// with fingers that grip and ball into fists) lit by the screen, and the screen itself, swivelled toward us.
// The screen runs a little MOBA of our own (see "The game on the screen"): a lane, a river, creep waves, his robed mage
// farming and casting a fireball, chain lightning, a blink and a golden nova, and every round he dies, a different way
// each loop: ganked by three heroes out of the fog, diving under their tower, caught in their warlock's meteor. The
// screen goes grey: a respawn counter, a kill-feed line. He plays along (mashing Q W E R as the spells go off, the mouse
// hand flicking and clicking where his cursor clicks, leaning in as it heats up), tension building.
// Then he loses it, a different rage each loop:
//   A) he stares, teeth clenched, the fist coiled, rears back yelling, and PUNCHES THE SCREEN (arm straight, head held
//      back): it cracks and dies, a fireball bursts out of it (faceted white-hot/orange/red shards, expanding, turning
//      to black smoke), sparks, glass and keycaps rain onto the desk, the blast throws him back in his chair, hands
//      flying up (never across his face), soot smudged on his forehead, nose and cheekbones, his hair singed, standing
//      on end and smoking, and the dead CRT pours smoke (and sputters). He sits there, breathing hard, coughs a puff. A
//      NEW MONITOR SLAMS DOWN on the old one and pancakes it, boots, he rolls back.
//   B) the computer burns him, he grabs the GAME BOY instead (a big cartoon brick), plays it out over the desk, loses
//      again (the tiny screen blinks X), stares, cocks it high in his fist and HURLS it onto our end of the desk, clear
//      of his head: it bursts (a fireball as big as A's, smoke, the shells, the battery cover, the AAs, the red A/B
//      buttons thrown up high and raining back onto the desk). Glaring at the bits. A fresh Game Boy drops onto its
//      spot, the bits vanish in the clearing smoke.
// Comic timing in each: anticipation (the stare, the wind-up), impact (a tug on the page's web, a camera kick), hold,
// aftermath, a clean reset. Hover: he slowly turns his head to glare at you, annoyed at being watched, then back.
// Click: the next rage right now (during the aftermath: hurry the reset, the next one rages straight away).
// Reduced motion / t = 0: he has just been ganked (the screen grey, the respawn counter, three killers in the kill feed),
// he glares, teeth clenched, the fist coiled: about to lose it.
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

// ---- the screen: 80 x 60 game pixels, drawn x3 with scanlines; a 3 x 5 pixel font of our own
const SW = 80, SH = 60, SX = 3;
const FONT = {
  0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001',
  5: '111100111001111', 6: '111100111101111', 7: '111001001001001', 8: '111101111101111', 9: '111101111001111',
  A: '010101111101101', E: '111100110100111', N: '110101101101101', P: '110101110100100', R: '110101110101101',
  S: '011100010001110', W: '101101111111101', '!': '010010010000010', '+': '000010111010000', ' ': '000000000000000',
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
  // his skin and his lips; the blast leaves them a little ashen (the black goes on in smudges: M.face's soot, below) and
  // singes his hair darker
  const SKIN = new THREE.Color(0xd9a07a), SKIND = new THREE.Color(0xc8836c), ASH = new THREE.Color(0x9c8a80), ASHD = new THREE.Color(0x7a625c);
  const HAIR = new THREE.Color(0x3a2416), SINGED = new THREE.Color(0x141010);
  const M = {
    ink: std(0x161616, 0.62),
    hood: std(0xa3181d, 0.85),                                               // his hoodie: the site's red
    hoodD: std(0x5c0b0f, 0.9),                                               // its ribbing, the pocket, the inside of the hood
    jeans: std(0x272c37, 0.85),
    hair: std(HAIR.getHex(), 0.8),
    iris: std(0x22150d, 0.3),
    mouth: std(0x2a0b0b, 0.95),
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
  // his face's skin: the blast leaves soft black smudges on it, worked out per pixel in head space, so they sit on the
  // low-poly face like soot, not like painted facets. Only where a cartoon kid gets them: the forehead under his fringe,
  // the tip of his nose, high on his cheekbones toward his ears. Never round his eyes (a black eye), never on his jaw,
  // chin or upper lip (stubble): the rest of the blast reads in his hair (it stands on end and smokes)
  M.face = std(SKIN.getHex(), 0.7);
  const SOOT_SPOTS = [[0.084, 0.1, 0.032, 0.03], [0.081, 0.097, -0.03, 0.024], [0.06, 0.104, 0.062, 0.022], [0.104, 0.03, 0.0, 0.018],
    [0.032, 0.031, 0.072, 0.022], [0.034, 0.032, -0.07, 0.018]];
  const SOOT_U = { uSoot: { value: 0 }, uHeadInv: { value: new THREE.Matrix4() }, uSpots: { value: SOOT_SPOTS.map((p) => new THREE.Vector4(...p)) } };
  M.face.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, SOOT_U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform mat4 uHeadInv;\nvarying vec3 vSootP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSootP = (uHeadInv * modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\nuniform float uSoot;\nuniform vec4 uSpots[${SOOT_SPOTS.length}];\nvarying vec3 vSootP;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      float sootM = 0.0;
      for (int i = 0; i < ${SOOT_SPOTS.length}; i++) {
        float d = distance(vSootP, uSpots[i].xyz) + 0.005 * sin(vSootP.x * 170.0 + vSootP.z * 130.0) * sin(vSootP.y * 150.0 + 1.3);
        sootM += 1.0 - smoothstep(uSpots[i].w * 0.15, uSpots[i].w, d);
      }
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.05, 0.042, 0.038), min(sootM, 1.0) * uSoot * 0.92);`);
  };
  M.face.customProgramCacheKey = () => 'gamer-face';

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

  // ---- the keyboard: black base, bone keycaps (one instanced batch), Q W E R in red (his four spells)
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
  const isQWER = (k) => k.r === 1 && k.c >= 1 && k.c <= 4;
  keyList.forEach((k, i) => {
    k.press = 0; k.hop = 0; k.vh = 0; k.gone = false;
    k.col = isQWER(k) ? KEY_RED : k.c === 0 || k.c === KCOLS - 1 || k.r === 4 ? KEY_DARK : KEY_BONE;
    keys.setColorAt(i, k.col);
  });
  const QWER = keyList.map((k, i) => (isQWER(k) ? i : -1)).filter((i) => i >= 0);
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
  // The gamer: a skinny kid of fourteen or so. A rig of groups (hips > spine > chest > neck > head) seated in the chair;
  // arms and legs are solved in world space each frame (two-bone IK) onto the keyboard, the mouse, the screen, the Game
  // Boy, his lap.
  const hips = new THREE.Group(); hips.position.set(0.02, 0.12, 0); chairTop.add(hips);
  const spine = new THREE.Group(); spine.position.set(0, 0.04, 0); hips.add(spine);
  const chest = new THREE.Group(); chest.position.set(0, 0.2, 0); chest.rotation.order = 'YZX'; spine.add(chest);
  const neck = new THREE.Group(); neck.position.set(0.035, 0.23, 0); neck.rotation.order = 'YZX'; chest.add(neck);
  const HS = 1.4;                                                            // his head: a touch big for his body (stylised, still a kid's)
  const head = new THREE.Group(); head.name = 'head'; head.position.set(0.015, 0.056, 0); head.rotation.order = 'YZX'; head.scale.setScalar(HS); neck.add(head);

  // body: a red hoodie on a skinny frame: the ribbed hem, the kangaroo pocket, the hood bunched behind his neck
  kit()
    .add(hull(sym([[0.1, -0.05, 0.112], [0.11, 0.08, 0.118], [0.098, 0.2, 0.12], [-0.1, -0.05, 0.112], [-0.11, 0.1, 0.118], [-0.1, 0.22, 0.122], [0.114, 0.05, 0], [-0.116, 0.08, 0]])), 'hood')
    .add(hull(sym([[0.102, -0.072, 0.115], [-0.102, -0.072, 0.115], [0.107, -0.036, 0.118], [-0.107, -0.036, 0.118], [0.117, -0.054, 0], [-0.118, -0.054, 0]])), 'hoodD')
    .add(hull(sym([[0.1165, -0.012, 0.0], [0.114, -0.012, 0.078], [0.12, 0.072, 0.0], [0.117, 0.074, 0.062], [0.104, -0.012, 0.088], [0.106, 0.08, 0.072]])), 'hoodD')
    .build(spine);
  kit()
    .add(hull(sym([[0.09, -0.02, 0.118], [0.1, 0.09, 0.128], [0.07, 0.185, 0.122], [-0.11, -0.02, 0.122], [-0.13, 0.09, 0.132], [-0.11, 0.19, 0.13],
      [-0.02, 0.225, 0.168], [0.03, 0.205, 0.172], [-0.075, 0.21, 0.165], [0.025, 0.255, 0.072], [-0.065, 0.255, 0.078]])), 'hood')
    .add(hull(sym([[-0.05, 0.2, 0.1], [0.02, 0.24, 0.1], [-0.15, 0.2, 0.08], [-0.165, 0.27, 0.07], [-0.12, 0.325, 0.06], [-0.06, 0.3, 0.09], [0.0, 0.27, 0.08], [-0.15, 0.3, 0.0]])), 'hood')
    .add(hull(sym([[-0.03, 0.24, 0.06], [0.04, 0.25, 0.058], [-0.1, 0.25, 0.05], [-0.1, 0.3, 0.04], [0.0, 0.29, 0.06]])), 'hoodD')
    .build(chest);
  kit().add(new THREE.CylinderGeometry(0.039, 0.044, 0.096, 7), 'skin', xf([0.0, 0.025, 0])).build(neck);   // a short neck: a kid's
  const strings = [-1, 1].map((s) => {
    const m = new THREE.Mesh(own(clean(new THREE.CylinderGeometry(0.004, 0.004, 1, 4).translate(0, -0.5, 0))), M.bone);
    const tip = new THREE.Mesh(own(clean(new THREE.CylinderGeometry(0.007, 0.007, 0.022, 5).translate(0, -0.011, 0))), M.bone);
    scene.add(m); scene.add(tip);
    return { m, tip, at: new V(0.07, 0.23, s * 0.045), d: new V(0, -1, 0), v: new V(), len: 0.13 + (s > 0 ? 0.015 : 0) };
  });

  // the head: a kid's, built to a kid's proportions. A big round skull and a small face low on it: a smooth forehead
  // (no brow ridge), big eyes a little below the middle of the head, a short button nose, a short lower face (the mouth
  // close under the nose, a small round chin set back under the lips), full cheeks, a soft jaw with no angle. Eyes with
  // whites and dark irises under lids that narrow, thick brows that carry the mood, lips over two rows of teeth (the jaw
  // drops to yell; when he seethes he clenches and bares them), messy brown hair (a fringe swept to his left, a tousled
  // crown that the blast blows up), the red headset on both ears. Head space: origin at the top of the neck, +x the
  // face, +y up, +z his right. The mouth's parts are placed from MOUTH_Y, where his lips meet.
  const MOUTH_Y = -0.0015;
  const jaw = new THREE.Group(); jaw.position.set(0.006, 0.026, 0); head.add(jaw);
  /** Points round a squashed ball: centre c, radii r, nu round, nv rings from latitude lat0 up to the pole. */
  const ovoid = (c, r, nu, nv, lat0) => {
    const out = [];
    for (let j = 0; j <= nv; j++) {
      const la = lerp(lat0, Math.PI / 2, j / nv);
      for (let i = 0; i < (j === nv ? 1 : nu); i++) {
        const lo = ((i + 0.5 * (j % 2)) / nu) * Math.PI * 2;
        out.push([c[0] + r[0] * Math.cos(la) * Math.cos(lo), c[1] + r[1] * Math.sin(la), c[2] + r[2] * Math.cos(la) * Math.sin(lo)]);
      }
    }
    return out;
  };
  /** A tube of hulls through points (a headband, a mic boom): w wide across `side`, t thick. */
  const _tv = new V();
  const tube = (k, pts, w, t, mat, side = null) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = P3(pts[i]), b = P3(pts[i + 1]), along = _tv.subVectors(b, a).normalize().clone();
      const out = side ? P3(side).clone() : a.clone().add(b).multiplyScalar(0.5).sub(new V(-0.01, 0.07, 0)).normalize();
      const sd = new V().crossVectors(along, out).normalize(); out.crossVectors(sd, along).normalize();
      const q = [];
      for (const [p, e] of [[a, -0.12], [b, 0.12]]) for (const [u, v] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) q.push(p.clone().addScaledVector(along, e * t).addScaledVector(sd, (u * w) / 2).addScaledVector(out, (v * t) / 2));
      k.add(hull(q), mat);
    }
  };
  const SKULL = { c: [-0.014, 0.078, 0], r: [0.1, 0.104, 0.081] };
  const toJaw = (pts) => pts.map(([x, y, z]) => [x - jaw.position.x, y - jaw.position.y, z]);
  const atMouth = (pts) => pts.map(([x, y, z]) => [x, y + MOUTH_Y, z]);
  // where the cheeks meet the jaw, from the corner of his mouth back to under his ear: both hulls share these points, so
  // the jaw carries on the cheek's surface (no ledge, no puppet's crease from his mouth to his ear)
  const CHEEK_LOW = [[0.072, 0.0005, 0.042], [0.05, 0.0035, 0.058], [0.02, 0.0095, 0.062], [-0.005, 0.0175, 0.06]];
  {
    const k = kit();
    // the skull and the face, one hull (no seams): a few big facets, so the skin reads smooth, not crumpled. The face
    // points: the forehead, flat and upright; round the eyes (set back a little, so the eyes stand proud of it); the full
    // cheeks; the muzzle above his mouth
    k.add(hull([...ovoid(SKULL.c, SKULL.r, 10, 4, -0.95), ...sym([[0.087, 0.09, 0], [0.085, 0.088, 0.026], [0.077, 0.09, 0.05], [0.085, 0.11, 0], [0.081, 0.112, 0.03],
      [0.064, 0.062, 0.06], [0.078, 0.035, 0.022], [0.072, 0.033, 0.042], [0.058, 0.038, 0.06],
      [0.08, 0.02, 0.024], [0.07, 0.016, 0.047], [0.05, 0.02, 0.065], [0.025, 0.026, 0.07],
      ...atMouth([[0.09, 0.0095, 0.012], [0.085, 0.0015, 0.022], ...CHEEK_LOW])])]), 'face');
    k.add(hull(sym([[0.082, 0.064, 0.0065], [0.091, 0.047, 0.007], [0.1, 0.031, 0.0085], [0.104, 0.027, 0], [0.098, 0.019, 0.008],   // a short button nose
      [0.09, 0.019, 0.0135], [0.086, 0.026, 0.0145], [0.083, 0.017, 0.01], [0.08, 0.035, 0.011]])), 'face');
    k.add(hull(sym(atMouth([[0.095, 0.007, 0.007], [0.097, 0, 0.005], [0.0915, 0.007, 0.016], [0.091, 0, 0.017], [0.079, -0.003, 0.0215], [0.087, 0.009, 0.012]]))), 'skinD');   // the upper lip, thin
    k.add(hull(sym(atMouth([[0.092, 0.0015, 0.0155], [0.0955, 0.0015, 0.005], [0.091, -0.006, 0.0155], [0.0945, -0.006, 0.005], [0.083, 0.0015, 0.02], [0.083, -0.006, 0.02]]))), 'bone');   // the top teeth
    k.add(hull(sym(atMouth([[0.091, -0.0015, 0.016], [0.079, -0.026, 0.012], [0.062, -0.0005, 0.021], [0.058, -0.029, 0.017]]))), 'mouth');   // inside the mouth
    // ears: the rim stands off the head toward the back, a darker bowl inside (under the headset's cups)
    for (const s of [-1, 1]) {
      const o = [[-0.003, 0.063], [-0.012, 0.07], [-0.027, 0.067], [-0.035, 0.052], [-0.032, 0.032], [-0.021, 0.015], [-0.011, 0.012], [-0.004, 0.023]];
      const out = (x) => 0.078 + 0.22 * (-x - 0.003);
      k.add(hull(o.flatMap(([x, y]) => [[x, y, s * 0.066], [x, y, s * out(x)]])), 'skin');
      const ci = o.map(([x, y]) => [lerp(-0.018, x, 0.55), lerp(0.04, y, 0.6)]);
      k.add(hull(ci.flatMap(([x, y]) => [[x, y, s * (out(x) - 0.004)], [x, y, s * (out(x) + 0.0012)]])), 'skinD');
    }
    // the headset: the band over his crown, a cup on each ear, a boom mic from the far cup round to his mouth
    const cup = (at, n) => {
      const N = P3(n).clone().normalize(), A = P3(at), qy = new Q().setFromUnitVectors(new V(0, 1, 0), N), qz = new Q().setFromUnitVectors(new V(0, 0, 1), N);
      const put = (g, d, q, mat) => k.add(g, mat, new THREE.Matrix4().compose(A.clone().addScaledVector(N, d), q, new V(1, 1, 1)));
      put(new THREE.CylinderGeometry(0.031, 0.034, 0.014, 9), 0.006, qy, 'dark');
      put(new THREE.CylinderGeometry(0.039, 0.042, 0.024, 9), 0.023, qy, 'red');
      put(new THREE.CylinderGeometry(0.028, 0.034, 0.009, 9), 0.038, qy, 'ink');
      put(new THREE.TorusGeometry(0.034, 0.0032, 3, 14), 0.036, qz, 'led');
    };
    for (const s of [-1, 1]) cup([-0.018, 0.042, s * 0.077], [0, 0, s]);
    const band = [[-0.017, 0.082, -0.104], [-0.018, 0.15, -0.093], [-0.022, 0.196, -0.05], [-0.027, 0.212, 0.0]];
    tube(k, [...band, ...band.slice(0, 3).reverse().map(([x, y, z]) => [x, y, -z])], 0.02, 0.008, 'ink');
    tube(k, [[0.002, 0.028, -0.106], [0.044, 0.012, -0.095], [0.073, 0.0, -0.07], [0.087, MOUTH_Y - 0.003, -0.046]], 0.005, 0.005, 'ink', [0, 1, 0]);
    k.add(new THREE.IcosahedronGeometry(0.0075, 0), 'ink', xf([0.088, MOUTH_Y - 0.004, -0.042]));
    k.build(head);
    // the jaw: the lower lip, the bottom teeth, and a small round chin, set back under the lips, with a short soft jawline
    // up to his ears (a kid's: no square angle, no jut)
    kit()
      .add(hull(toJaw(sym(atMouth([[0.0935, 0, 0.0085], [0.095, -0.0025, 0.004], [0.0935, -0.009, 0.006], [0.0895, 0, 0.017], [0.087, -0.007, 0.016], [0.078, -0.003, 0.0215], [0.088, -0.011, 0.01]])))), 'skinD')   // the lower lip
      .add(hull(toJaw(sym(atMouth([[0.09, -0.009, 0.013], [0.088, -0.017, 0.012], [0.0855, -0.025, 0.0135], [0.087, -0.024, 0], [0.074, -0.032, 0.015], [0.076, -0.033, 0],
        [0.057, -0.028, 0.03], [0.035, -0.019, 0.042], [0.013, -0.006, 0.048], [0.045, -0.014, 0.05], [0.017, -0.003, 0.056], [-0.012, 0.014, 0.054], [-0.005, 0.027, 0.05],
        [0.078, -0.001, 0.026], [0.088, -0.003, 0.012], ...CHEEK_LOW])))), 'face')   // the chin, the jaw
      .add(hull(toJaw(sym(atMouth([[0.089, -0.002, 0.0145], [0.0925, -0.002, 0.005], [0.088, -0.0085, 0.0145], [0.0915, -0.0085, 0.005], [0.081, -0.002, 0.019], [0.081, -0.0085, 0.019]])))), 'bone')   // the bottom teeth
      .build(jaw);
  }
  // the hair: a cap over the skull (the top down to above his ears, the back down to his nape), a fringe of locks falling
  // over his forehead, swept to his left, locks over his ears and at the back; the crown's tufts are their own group (the
  // blast stands them up). A lock: a flat clump, wide at the root, blunt at the tip.
  const hair = new THREE.Group(); head.add(hair);
  const tufts = new THREE.Group(); tufts.position.set(-0.01, 0.184, 0); hair.add(tufts);
  {
    const k = kit(), kt = kit();
    const lock = (kk, b, t, w, o = [0, 0, 0]) => {
      const B = P3(b), T = P3(t), d = new V().subVectors(T, B).normalize();
      const u = new V().crossVectors(d, Math.abs(d.y) > 0.85 ? new V(1, 0, 0) : new V(0, 1, 0)).normalize(), v = new V().crossVectors(d, u);
      const pts = [T.clone().addScaledVector(u, w * 0.2), T.clone().addScaledVector(u, -w * 0.2)];
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; pts.push(B.clone().addScaledVector(u, Math.cos(a) * w).addScaledVector(v, Math.sin(a) * w * 0.45).addScaledVector(d, -0.01)); }
      kk.add(hull(pts.map((p) => p.sub(_tv.set(...o)))), 'hair');
    };
    const cap = ovoid([SKULL.c[0] - 0.002, SKULL.c[1] + 0.01, 0], [SKULL.r[0] * 1.1, SKULL.r[1] * 1.12, SKULL.r[2] * 1.12], 14, 6, -0.9);
    k.add(hull(cap.filter(([x, y]) => y > 0.14 || (y > 0.095 && x < 0.05))), 'hair');
    k.add(hull(cap.filter(([x, y]) => x < -0.046 && y > -0.004)), 'hair');
    for (const [b, t, w] of [[[0.072, 0.162, 0.03], [0.09, 0.104, 0.018], 0.021], [[0.076, 0.162, 0.006], [0.093, 0.1, -0.008], 0.022],       // the fringe, low on his forehead
      [[0.074, 0.162, -0.018], [0.091, 0.104, -0.034], 0.021], [[0.066, 0.159, -0.042], [0.08, 0.11, -0.058], 0.019], [[0.064, 0.158, 0.052], [0.078, 0.114, 0.05], 0.018],
      [[-0.004, 0.126, 0.08], [0.008, 0.1, 0.094], 0.02], [[-0.004, 0.126, -0.08], [0.008, 0.1, -0.094], 0.02],                                // over his ears
      [[-0.108, 0.119, 0.03], [-0.132, 0.102, 0.045], 0.022], [[-0.104, 0.064, -0.022], [-0.124, 0.038, -0.032], 0.02], [[-0.11, 0.094, -0.03], [-0.13, 0.074, -0.045], 0.018]]) lock(k, b, t, w);
    const T0 = [tufts.position.x, tufts.position.y, tufts.position.z];
    for (const [b, t, w] of [[[0.022, 0.194, 0.03], [0.046, 0.206, 0.046], 0.028], [[-0.026, 0.202, -0.012], [-0.054, 0.214, -0.026], 0.03],   // the crown
      [[-0.06, 0.19, 0.03], [-0.09, 0.194, 0.046], 0.028], [[-0.072, 0.18, -0.04], [-0.1, 0.18, -0.06], 0.026], [[0.03, 0.192, -0.034], [0.052, 0.2, -0.058], 0.024],
      [[-0.01, 0.2, 0.04], [-0.03, 0.208, 0.066], 0.024]]) lock(kt, b, t, w, T0);
    k.build(hair); kt.build(tufts);
  }
  // his eyes: whites, dark irises, an upper lid that narrows them (and blinks), a lower lid; brows of hair over them.
  // Each eye turns toward what he's looking at (the head does most of it; the eyes finish the job).
  const EYE_R = 0.0195;                                                      // big: a kid's eyes
  const eyeGeo = own(clean(new THREE.IcosahedronGeometry(EYE_R, 1)));
  const irisGeo = own(clean(new THREE.IcosahedronGeometry(EYE_R * 0.58, 1)));
  const lidGeo = own(clean(new THREE.SphereGeometry(EYE_R * 1.17, 9, 3, 0, Math.PI * 2, 0, Math.PI / 2)));
  const lowGeo = own(clean(new THREE.SphereGeometry(EYE_R * 1.1, 9, 2, 0, Math.PI * 2, Math.PI * 0.6, Math.PI * 0.4)));
  const browGeo = (s) => own(clean(hull([[-0.0045, -0.0045, -0.02 * s], [0.0045, -0.0045, -0.02 * s], [-0.0045, 0.005, -0.02 * s], [0.0045, 0.005, -0.02 * s],
    [-0.003, -0.0025, 0.02 * s], [0.003, -0.0025, 0.02 * s], [-0.003, 0.003, 0.021 * s], [0.003, 0.003, 0.021 * s]])));
  const EYE = [0.07, 0.054, 0.034], BROW = [0.087, 0.081, 0.034];
  const eyes = [-1, 1].map((s) => {
    const g = new THREE.Group(); g.position.set(EYE[0], EYE[1], s * EYE[2]); g.rotation.order = 'YZX'; head.add(g);
    g.add(new THREE.Mesh(eyeGeo, M.eye));
    const pupil = new THREE.Mesh(irisGeo, M.iris); pupil.position.set(EYE_R * 0.8, 0, 0); pupil.scale.set(0.42, 1, 1); g.add(pupil);
    const lid = new THREE.Mesh(lidGeo, M.skin); g.add(lid);
    const low = new THREE.Mesh(lowGeo, M.skin); low.rotation.z = -0.2; g.add(low);
    const brow = new THREE.Mesh(browGeo(s), M.hair); brow.rotation.order = 'YXZ'; head.add(brow);
    return { s, g, lid, pupil, brow };
  });
  // the clench: bared teeth across his mouth when he seethes (scaled open from nothing): the lips' dark edge, the two rows,
  // the bite between them
  const grin = new THREE.Group(); grin.position.set(0, MOUTH_Y, 0); head.add(grin);
  {
    const arc = (hw, hy, dx) => { const p = []; for (let i = 0; i <= 6; i++) { const z = lerp(-hw, hw, i / 6), x = 0.0983 - 21 * z * z + dx; for (const y of [-hy, hy]) p.push([x, y, z], [x - 0.004, y, z * 0.92]); } return hull(p); };
    kit().add(arc(0.0205, 0.0068, -0.0004), 'mouth').add(arc(0.0182, 0.0054, 0.0006), 'bone').add(arc(0.0172, 0.0006, 0.0012), 'mouth').build(grin);
  }

  // limbs: tapered six-sided sleeves and legs, rebuilt into place each frame
  const prism = (r0, r1) => own(clean(new THREE.CylinderGeometry(r1, r0, 1, 6, 1).translate(0, 0.5, 0)));
  const ball = (r) => own(clean(new THREE.IcosahedronGeometry(r, 0)));
  const G = {
    upper: prism(0.047, 0.041), fore: prism(0.042, 0.036), cuff: prism(0.037, 0.036), elbow: ball(0.043),
    thigh: prism(0.066, 0.054), shin: prism(0.05, 0.044), knee: ball(0.054),
  };
  const UA = 0.25, FA = 0.24, TH = 0.36, SH_ = 0.44;
  const mk = (g, m, name = '') => { const o = new THREE.Mesh(g, m); o.name = name; scene.add(o); return o; };
  // the limbs come in pairs: each kind of segment is one instanced mesh of two, posed through plain Object3D slots
  const slots = [];
  const pair = (g, m) => { const im = new THREE.InstancedMesh(g, m, 2); im.frustumCulled = false; scene.add(im); return im; };
  const slot = (...ims) => { const o = new THREE.Object3D(); o.ims = ims; slots.push(o); return o; };
  const LIMB = { upper: pair(G.upper, M.hood), fore: pair(G.fore, M.hood), cuff: pair(G.cuff, M.hoodD), elbow: pair(G.elbow, M.hood), thigh: pair(G.thigh, M.jeans), shin: pair(G.shin, M.jeans), knee: pair(G.knee, M.jeans) };
  function flushSlots() {
    for (const o of slots) { o.updateMatrix(); for (const [im, i] of o.ims) im.setMatrixAt(i, o.matrix); }
    for (const o of slots) for (const [im] of o.ims) im.instanceMatrix.needsUpdate = true;
  }
  // hands: a palm, four fingers of two joints and a thumb, that curl from open through a grip to a fist (the grip and the
  // fist are morph targets: every pose is the same pieces, moved). Hand space: from the wrist along +x to the fingertips,
  // the back of the hand +y, the thumb on the inside (-z for his right hand).
  const FINGERS = [[-0.0192, 0.029, 0.025], [-0.0064, 0.032, 0.027], [0.0064, 0.03, 0.025], [0.0192, 0.024, 0.02]];   // across, the two joints' lengths
  const CURL = [[-0.12, -0.22], [-0.95, -0.95], [-1.6, -1.8]];                                                       // open, grip, fist: each joint's bend
  const THUMB = [[[0.62, -0.12, -0.78], [0.86, -0.08, -0.5]], [[0.66, -0.5, -0.56], [0.5, -0.78, -0.1]], [[0.85, -0.45, -0.3], [0.4, -0.3, 0.86]]];
  const fingerSeg = (L, w, t) => clean(hull([[0, -t / 2, -w / 2], [0, t / 2, -w / 2], [0, -t / 2, w / 2], [0, t / 2, w / 2],
    [L, -t * 0.42, -w * 0.4], [L, t * 0.3, -w * 0.4], [L, -t * 0.42, w * 0.4], [L, t * 0.3, w * 0.4], [L + 0.003, -0.001, 0]]));
  function handGeo(s) {
    const palm = clean(hull([[0, 0.011, 0.021 * s], [0, 0.011, -0.022 * s], [0, -0.012, 0.02 * s], [0, -0.012, -0.021 * s], [0.04, 0.0135, 0.0], [0.04, -0.0145, 0.0],
      [0.072, 0.0095, -0.026 * s], [0.072, 0.0095, 0.0255 * s], [0.07, -0.0105, -0.026 * s], [0.07, -0.0105, 0.0255 * s], [0.077, 0.002, -0.012 * s], [0.077, 0.002, 0.012 * s],
      [0.028, -0.016, -0.026 * s], [0.012, -0.011, -0.027 * s]]));
    const segs = FINGERS.map(([, a, b]) => [fingerSeg(a, 0.0128, 0.0122), fingerSeg(b, 0.0118, 0.0112)]);
    const th = [fingerSeg(0.03, 0.016, 0.015), fingerSeg(0.024, 0.0135, 0.0125)];
    const _m = new THREE.Matrix4(), X = new V(1, 0, 0);
    const pose = (p) => {
      const parts = [palm.clone()];
      FINGERS.forEach(([z, a], f) => {
        const [b1, b2] = CURL[p], J = new V(0.0715, 0, z * s);
        parts.push(segs[f][0].clone().applyMatrix4(_m.makeRotationZ(b1).setPosition(J)));
        const J2 = new V(a, 0, 0).applyMatrix4(_m);
        parts.push(segs[f][1].clone().applyMatrix4(_m.makeRotationZ(b1 + b2).setPosition(J2)));
      });
      const [d1, d2] = THUMB[p].map(([x, y, z]) => new V(x, y, z * s).normalize());
      const T = new V(0.02, -0.007, -0.024 * s);
      parts.push(th[0].clone().applyMatrix4(_m.makeRotationFromQuaternion(new Q().setFromUnitVectors(X, d1)).setPosition(T)));
      parts.push(th[1].clone().applyMatrix4(_m.makeRotationFromQuaternion(new Q().setFromUnitVectors(X, d2)).setPosition(T.addScaledVector(d1, 0.029))));
      const g = mergeGeometries(parts); parts.forEach((x) => x.dispose());
      return g;
    };
    const g = pose(0), grip = pose(1), fist = pose(2);
    g.morphAttributes.position = [grip.attributes.position, fist.attributes.position];
    grip.dispose(); fist.dispose(); palm.dispose(); segs.flat().forEach((x) => x.dispose()); th.forEach((x) => x.dispose());
    return own(g);
  }
  const arms = [-1, 1].map((s) => ({
    s, upper: slot([LIMB.upper, s > 0 ? 1 : 0]), fore: slot([LIMB.fore, s > 0 ? 1 : 0]), cuff: slot([LIMB.cuff, s > 0 ? 1 : 0]), elbow: slot([LIMB.elbow, s > 0 ? 1 : 0]), hand: mk(handGeo(s), M.skin, s > 0 ? 'handR' : 'handL'),
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
  // The game on the screen: a little MOBA of our own (no real game's heroes, names, icons, fonts or screen layout). A
  // map bigger than the screen: one lane corner to corner, his tower bottom left, theirs top right, a river crossing it
  // in the middle, forest either side under a fog of war (what his side can't see is veiled, and enemies in it are
  // hidden; the towers show through it); the camera follows his hero, as in the real thing (each opening, a click on
  // the minimap glances at their tower first). Creep waves march out of the towers and clash at the river ford. HIS
  // hero, a robed mage (a tall blue hat with a gold band, a staff with a glowing orb, a green ring at his feet), takes a
  // couple of last hits, casts his spells (Q a fireball, W chain lightning hopping target to target, E a blink, R a
  // golden nova) and dies, a different way each loop (ROUNDS): ganked by three heroes out of the fog; diving under
  // their tower, locked on and shot down by it; caught in their warlock's meteor. Then the picture goes grey: a respawn
  // counter, a kill-feed line. Their heroes, all our own: a horned brute with a hook and a cleaver, a ranger in a gold
  // hood with a bow, a shadowy assassin with two daggers, a stone-skinned tank, a horned warlock. The HUD: a minimap top
  // left (the camera's box on it), along the bottom his portrait, the four spells (a cooldown drains down each, its
  // seconds on it), health and mana; his cursor on top, clicking where he plays.
  // It is a tiny deterministic simulation (the creeps fight on their own, the heroes follow a script), stepped at 60 Hz
  // to the game time u and drawn into an 80 x 60 buffer, then onto the CRT canvas x3: scanlines, a phosphor mask, a glow
  // round anything bright, the corners darker and rounded. The picture's average colour is the screen's light on him.
  const scrCanvas = document.createElement('canvas'); scrCanvas.width = SW * SX; scrCanvas.height = SH * SX;
  const sg = scrCanvas.getContext('2d');
  const scrImg = sg.createImageData(SW * SX, SH * SX);
  // mipmapped: at page size the canvas is drawn smaller than it is (the scanlines average out instead of shimmering)
  const crtTex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 8; textures.push(t); return t; };
  const screenTex = crtTex(scrCanvas);
  const liveMat = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }); extraMats.push(liveMat);
  // the smashed screen: cracks round the punch, a hole, the last picture burnt in; a second one sputtering
  const deadCanvas = [0, 1].map(() => { const c = document.createElement('canvas'); c.width = SW * SX; c.height = SH * SX; return c; });
  const deadTex = deadCanvas.map(crtTex);
  const deadMat = deadTex.map((t) => { const m = new THREE.MeshBasicMaterial({ map: t, toneMapped: false }); extraMats.push(m); return m; });
  const glow = { c: new THREE.Color(0x3c8a5a), i: 1, tc: new THREE.Color(0x3c8a5a), ti: 1 };
  const outQ = (u) => 1 - (1 - clamp(u, 0, 1)) ** 2;
  const pop = (u) => (u < 0 ? -99 : -3 * Math.exp(-u * 7) * Math.cos(u * 22));   // text drops in and bounces

  // ---- the picture: RGB 0..255 per game pixel (above 255 = glowing, clipped when it goes to the canvas). Everything on
  // the field is drawn in world pixels and lands on the screen less the camera (OX, OY); the HUD is drawn with them at 0
  const FB = new Float32Array(SW * SH * 3), BL = new Float32Array(SW * SH * 3), BT = new Float32Array(SW * SH * 3);
  let clipH = SH, OX = 0, OY = 0;                                            // the field's drawing stops above the HUD
  const C = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
  const mixC = (a, b, k, out = [0, 0, 0]) => { out[0] = a[0] + (b[0] - a[0]) * k; out[1] = a[1] + (b[1] - a[1]) * k; out[2] = a[2] + (b[2] - a[2]) * k; return out; };
  function px(x, y, c, a = 1) {
    x = Math.round(x) - OX; y = Math.round(y) - OY;
    if (x < 0 || y < 0 || x >= SW || y >= clipH || !(a > 0)) return;
    const i = (y * SW + x) * 3;
    if (a >= 1) { FB[i] = c[0]; FB[i + 1] = c[1]; FB[i + 2] = c[2]; } else { FB[i] += (c[0] - FB[i]) * a; FB[i + 1] += (c[1] - FB[i + 1]) * a; FB[i + 2] += (c[2] - FB[i + 2]) * a; }
  }
  /** Light added on top (fire, lightning, glows). */
  function lit(x, y, c, a = 1) {
    x = Math.round(x) - OX; y = Math.round(y) - OY;
    if (x < 0 || y < 0 || x >= SW || y >= clipH || !(a > 0)) return;
    const i = (y * SW + x) * 3;
    FB[i] += c[0] * a; FB[i + 1] += c[1] * a; FB[i + 2] += c[2] * a;
  }
  const rect = (x, y, w, h, c, a = 1) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, c, a); };
  function disc(cx, cy, r, c, a = 1, add = false) {
    const f = add ? lit : px;
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) f(x, y, c, a);
  }
  /** A soft glow: light falling off from the middle out to r. */
  function bloom(cx, cy, r, c, a = 1) {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const e = 1 - Math.hypot(x - cx, y - cy) / r;
      if (e > 0) lit(x, y, c, a * e * e);
    }
  }
  /** A ring of radius r, w wide, its edges soft. sy squashes it (a ring lying on the ground). */
  function ring(cx, cy, r, w, c, a = 1, add = false, sy = 1) {
    const f = add ? lit : px, o = r + w / 2 + 1;
    for (let y = Math.floor(cy - o * sy); y <= Math.ceil(cy + o * sy); y++) for (let x = Math.floor(cx - o); x <= Math.ceil(cx + o); x++) {
      const e = 1 - Math.abs(Math.hypot(x - cx, (y - cy) / sy) - r) / (w / 2 + 0.5);
      if (e > 0) f(x, y, c, a * Math.min(1, e * 1.7));
    }
  }
  function line(x0, y0, x1, y1, c, a = 1, add = false, dash = 0, ph = 0) {
    const f = add ? lit : px, n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    for (let i = 0; i <= n; i++) if (!dash || (i + ph) % dash < dash / 2) f(lerp(x0, x1, i / n), lerp(y0, y1, i / n), c, a);
  }
  function text(str, x, y, c, s = 1, shadow = null, a = 1) {
    if (shadow) text(str, x + 1, y + 1, shadow, s, null, a);
    let cx = Math.round(x);
    for (const ch of str) {
      const g = FONT[ch] ?? FONT[' '];
      for (let i = 0; i < 15; i++) if (g[i] === '1') rect(cx + (i % 3) * s, Math.round(y) + Math.floor(i / 3) * s, s, s, c, a);
      cx += 4 * s;
    }
  }
  const textW = (str, s = 1) => (str.length * 4 - 1) * s;
  const hsh = (x, y, s = 0) => { let h = Math.imul(x + 1013 * s, 374761393) ^ Math.imul(y + 7 * s, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
  const dither = (x, y, a) => a >= 1 || a > BAYER[(Math.round(x) & 3) + (Math.round(y) & 3) * 4];

  // ---- the colours: his side teal, theirs crimson; the map in fresh greens, a sandy lane, a bright river
  const P = {
    out: C(0x0b0d10), white: C(0xffffff), black: C(0x050607), skin: C(0xf2c69c), eye: C(0x16110e),
    teal: C(0x36e0c0), tealD: C(0x13786a), tealL: C(0xb8fff0),
    blue: C(0x4a7cff), blueM: C(0x2f5ad8), blueD: C(0x1c3490), gold: C(0xf6c84c), goldD: C(0xa8781e), orb: C(0xe0fffa), wood: C(0x8a5a2a), woodD: C(0x5a3818),
    crim: C(0xee4a3c), crimD: C(0x921f19), crimL: C(0xffa48e),
    rust: C(0xcc6438), rustD: C(0x84381e), iron: C(0x939aa4), ironD: C(0x545a62), bone: C(0xeee4ca), steel: C(0xeef3f8), steelD: C(0x98a2ac), hide: C(0x4a3020),
    amb: C(0xf2b23a), ambD: C(0xa86e1c), fireY: C(0xffe27a),
    shade: C(0x6a48a0), shadeD: C(0x33205a), mag: C(0xff4fe0), scarf: C(0xc02a80),
    stone: C(0x8e99a6), stoneD: C(0x56606c), stoneL: C(0xc4ced8), ambE: C(0xffb12e),
    red: C(0xff2a20), fire: C(0xff8a1e), ember: C(0xd23214), smoke: C(0x3a3634),
    zap: C(0x7ae8ff), arc: C(0x5c9cff), arcL: C(0xc4dcff), violet: C(0xb57bff), violetD: C(0x6a2ed8), nova: C(0xffd860), novaL: C(0xfff6c4),
    hp: [C(0x4ce462), C(0xe83c30)], hpBg: C(0x1a0c0c), mana: C(0x3e8dff), manaBg: C(0x0b1020),
    hud: C(0x12161c), hudE: C(0x3e4854), hudD: C(0x07090c), sel: C(0x6cff8a),
  };

  // ---- the map, built once: WW x WH world pixels, the screen's field (SW x FH, the HUD below) a window on it. The lane
  // runs from his tower (bottom left) to theirs (top right); the river crosses it square in the middle, edge to edge
  const FH = 50, WW = 128, WH = 100;
  const T1 = [22, 76], T2 = [105, 26];                                       // his tower, theirs
  const LD = [T2[0] - T1[0], T2[1] - T1[1]], LL = Math.hypot(LD[0], LD[1]);
  const LU = [LD[0] / LL, LD[1] / LL], LP = [-LU[1], LU[0]];                 // along the lane; across it (+ = down-right)
  const LM = [(T1[0] + T2[0]) / 2, (T1[1] + T2[1]) / 2];                     // the river crosses the lane here
  const lane = (s, d = 0) => [T1[0] + LD[0] * s + LP[0] * d, T1[1] + LD[1] * s + LP[1] * d];
  const laneD = (x, y) => (x - T1[0]) * LP[0] + (y - T1[1]) * LP[1];
  const laneS = (x, y) => ((x - T1[0]) * LU[0] + (y - T1[1]) * LU[1]) / LL;
  const riverD = (x, y) => (x - LM[0]) * LU[0] + (y - LM[1]) * LU[1];
  const BASE0 = [-4, WH + 4], BASE1 = [WW + 4, -4], ANC0 = [9, 90], ANC1 = [119, 10];
  const MAP = new Float32Array(WW * WH * 3);
  {
    const r = rng(311), trees = [], cell = new Map();                        // cell: the trees in each 6 px square
    const crowded = (x, y) => { for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) for (const t of cell.get((Math.floor(x / 6) + i) * 64 + Math.floor(y / 6) + j) ?? []) if (Math.hypot(t[0] - x, t[1] - y) < 5.6) return true; return false; };
    for (let i = 0; i < 12000 && trees.length < 200; i++) {
      const x = -2 + r() * (WW + 4), y = -2 + r() * (WH + 4);
      if (Math.abs(laneD(x, y)) < 9 || Math.abs(riverD(x, y)) < 7.5) continue;
      if (Math.hypot(x - BASE0[0], y - BASE0[1]) < 21 || Math.hypot(x - BASE1[0], y - BASE1[1]) < 21) continue;
      if (crowded(x, y)) continue;
      const t = [x, y, 2.9 + 1.4 * r()], k = Math.floor(x / 6) * 64 + Math.floor(y / 6);
      trees.push(t); if (!cell.has(k)) cell.set(k, []); cell.get(k).push(t);
    }
    trees.sort((a, b) => a[1] - b[1]);
    const GR = [C(0x4f8c40), C(0x56934a), C(0x4b8641)], GL = C(0x6eac56), JG = C(0x3a6a34);
    const DIRT = [C(0xc8a872), C(0xd0b27c), C(0xbe9e68)], PEB = C(0xe8d29c), EDGE = C(0x8e7448);
    const WAT = C(0x2a78c8), WAT2 = C(0x3a92e2), GLINT = C(0xb4e2ff), FORD = [C(0x76b6c6), C(0x6aaabc)], BANK = C(0x2e5a3a);
    const TR = C(0x2c6c32), TRL = C(0x4e9c46), TRD = C(0x1b4a24);
    const STONE0 = [C(0x627e86), C(0x6e8c94)], STONE1 = [C(0x866262), C(0x946e6e)], RIM = C(0x3a4446);
    const c = [0, 0, 0], open = new Uint8Array(WW * WH), near = new Float32Array(WW * WH).fill(9);
    for (let y = 0; y < WH; y++) for (let x = 0; x < WW; x++) {
      const n = hsh(x, y), dl = Math.abs(laneD(x, y)), s = laneS(x, y), dr = Math.abs(riverD(x, y));
      const k = hsh(x, y, 1) < 0.05 ? GL : n < 0.34 ? GR[0] : n < 0.67 ? GR[1] : GR[2];
      c[0] = k[0]; c[1] = k[1]; c[2] = k[2];
      let o = 0;
      const b0 = Math.hypot(x - BASE0[0], y - BASE0[1]), b1 = Math.hypot(x - BASE1[0], y - BASE1[1]);
      if (b0 < 17) mixC(c, STONE0[((x >> 1) + (y >> 1)) & 1], 1, c); else if (b0 < 18.2) mixC(c, RIM, 1, c);
      if (b1 < 17) mixC(c, STONE1[((x >> 1) + (y >> 1)) & 1], 1, c); else if (b1 < 18.2) mixC(c, RIM, 1, c);
      if (b0 < 18.2 || b1 < 18.2) o = 1;
      if (dl < 3.6 && s > -0.45 && s < 1.45) { mixC(c, hsh(x, y, 2) < 0.045 ? PEB : DIRT[(n * 3) | 0], 1, c); o = 1; }
      else if (dl < 4.6 && s > -0.45 && s < 1.45) { mixC(c, EDGE, 0.55, c); o = 1; }
      if (dr < 3.3) {
        o = 1;
        if (dl < 3.6) mixC(c, FORD[(x + y) & 1], 1, c);
        else { mixC(c, dr < 1.5 ? WAT2 : WAT, 1, c); if (hsh(x, y, 3) < 0.05) mixC(c, GLINT, 0.7, c); }
      } else if (dr < 4.3 && dl >= 3.6) { mixC(c, BANK, 0.6, c); o = 1; }
      MAP.set(c, (y * WW + x) * 3); open[y * WW + x] = o;
    }
    // the forest floor darker round the trees: the woods read as masses, the lane and the river as open ground
    const box = (tx, ty, R, fn) => { for (let y = Math.max(0, Math.floor(ty - R)); y <= Math.min(WH - 1, Math.ceil(ty + R)); y++) for (let x = Math.max(0, Math.floor(tx - R)); x <= Math.min(WW - 1, Math.ceil(tx + R)); x++) fn(x, y, (y * WW + x) * 3); };
    for (const [tx, ty, tr] of trees) box(tx, ty, tr + 2.6, (x, y) => { const i = y * WW + x; near[i] = Math.min(near[i], Math.hypot(x - tx, y - ty) - tr); });
    const mixAt = (j, col, k) => { MAP[j] += (col[0] - MAP[j]) * k; MAP[j + 1] += (col[1] - MAP[j + 1]) * k; MAP[j + 2] += (col[2] - MAP[j + 2]) * k; };
    for (let i = 0; i < WW * WH; i++) if (!open[i] && near[i] < 2.6) mixAt(i * 3, JG, 0.6 * (1 - Math.max(0, near[i]) / 2.6));
    // trees: a round canopy, lit top left, its shadow down and right on the ground
    for (const [tx, ty, tr] of trees) box(tx, ty, tr + 2, (x, y, i) => {
      const dx = x - tx, dy = y - ty, d = Math.hypot(dx, dy);
      if (d >= tr && Math.hypot(dx - 1, dy - 1.2) < tr) mixAt(i, P.black, 0.35);
      if (d < tr) MAP.set(dx + dy < -tr * 0.5 ? TRL : dx + dy > tr * 0.65 ? TRD : TR, i);
    });
  }

  // ---- sprites: strings of palette letters, drawn feet-centred, facing right (flipped for left), with a dark outline
  function sprite(rows, pal) {
    const h = rows.length, w = Math.max(...rows.map((r) => r.length)), pts = [], seen = new Set();
    rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') { pts.push([x, y, pal[ch]]); seen.add(x * 64 + y); } }));
    const out = [];
    for (const [x, y] of pts) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (x + dx) * 64 + y + dy; if (!seen.has(k)) { seen.add(k); out.push([x + dx, y + dy]); } }
    return { w, h, pts, out };
  }
  const _sc = [0, 0, 0];
  /** o: face (1 right, -1 left), a (dithered alpha), flash (toward white, or o.tint), dim (fog), outline, tl (x, y is the top left). */
  function drawSprite(sp, x, y, o = {}) {
    const face = o.face ?? 1, a = o.a ?? 1, fl = o.flash ?? 0, dim = o.dim ?? 1;
    const ox = o.tl ? Math.round(x) : Math.round(x - (sp.w - 1) / 2), oy = o.tl ? Math.round(y) : Math.round(y) - sp.h + 1;
    const X = (sx) => (face < 0 ? ox + sp.w - 1 - sx : ox + sx);
    if (o.outline !== false) for (const [sx, sy] of sp.out) { const gx = X(sx), gy = oy + sy; if (dither(gx, gy, a)) px(gx, gy, P.out, 0.85); }
    for (const [sx, sy, c] of sp.pts) {
      const gx = X(sx), gy = oy + sy;
      if (!dither(gx, gy, a)) continue;
      _sc[0] = c[0] * dim; _sc[1] = c[1] * dim; _sc[2] = c[2] * dim;
      if (fl > 0) mixC(_sc, o.tint ?? P.white, fl, _sc);
      px(gx, gy, _sc);
    }
    return [ox, oy];
  }
  // his mage: a tall pointed hat with a gold band, his face under the brim, the robe flaring, a gold sash, the staff
  // with its orb held out front
  const pMage = { h: P.blue, H: P.blueM, t: P.gold, f: P.skin, e: P.eye, r: P.blueM, R: P.blueD, g: P.gold, k: P.skin, s: P.wood, o: P.orb };
  const MAGE_TOP = ['...h.....', '..hh...o.', '..hhh.ooo', '.hhhhh.o.', 'HtttttHs.', '..ffe..s.', '.rrrrkks.', '.rrgrr.s.', '.rrrgr.s.', 'rrrrrrrs.', 'rRrrrRr..'];
  const MAGE = [sprite([...MAGE_TOP, '.RR..RR..'], pMage), sprite([...MAGE_TOP, '..RRRR...'], pMage)];
  const MAGE_DEAD = sprite(['..........hh.', 'RrrrgrrrffHhh', 'rRrrrgrrfeHH.', '.sssssssss..o'], pMage);
  // the brute: a horned iron helm with a slit of yellow eye, a hulking rust-red body and belly, a cleaver up in his
  // front fist, the hook on its chain hanging from the other
  const pBrute = { b: P.bone, m: P.iron, y: P.fireY, s: P.rust, S: P.rustD, k: P.rust, C: P.steel, c: P.steelD, h: P.woodD, i: P.iron, J: P.steel, L: P.hide };
  const BRUTE_TOP = ['..b....b.CCC', '..bb..bb.CCC', '...mmmm..CCc', '...mmmy..h..', '..sssssss.k.', '.sssssssssk.', 'ksssSSSSss..', 'i.sSSSSSSs..', 'i.sSSSSSSs..', 'i..ssssss...'];
  const BRUTE = [sprite([...BRUTE_TOP, 'J..LL..LL...', 'JJ.LL..LL...'], pBrute), sprite([...BRUTE_TOP, 'J...LLLL....', 'JJ.LL..LL...'], pBrute)];
  // the ranger: a gold hood and cloak, a bow held out front, its string drawn
  const pRanger = { a: P.amb, A: P.ambD, f: P.skin, e: P.eye, w: P.wood, t: P.bone, k: P.skin, y: P.fireY, L: P.hide };
  const RANGER_TOP = ['...aa....', '..aaaa.w.', '.aaaaa..w', '..afe.t.w', '..AaA.t.w', '.aAAAkkkw', '.aAyA.t.w', '.aAAA.t.w', 'aaaAaa.w.', '..AAA....'];
  const RANGER = [sprite([...RANGER_TOP, '..L.L....', '.LL.LL...'], pRanger), sprite([...RANGER_TOP, '..LL.....', '..LLL....'], pRanger)];
  // the assassin: a shadow in a hood, two magenta eyes, a scarf flying behind, a dagger in each hand
  const pSin = { p: P.shade, P: P.shadeD, E: P.mag, s: P.scarf, d: P.steel };
  const SIN_TOP = ['...pp...', '..pppp..', '..pEpE..', 'ssppppd.', '.sPPPPd.', 'dPPpPP..', 'd.PpPP..', '..PPPP..'];
  const SIN = [sprite([...SIN_TOP, '..pp.pp.', '.pp...pp'], pSin), sprite([...SIN_TOP, '..pp.pp.', '..ppp...'], pSin)];
  // the tank: a block of slate with amber eyes, a small head on huge shoulders, fists like boulders
  const pTank = { l: P.stoneL, s: P.stone, S: P.stoneD, a: P.ambE };
  const TANK_TOP = ['...lll.....', '..lssss....', '..ssasa....', '.lsssssl...', 'llsssssssll', 'lsSsssSssSs', 'ss.sSss.ss.', 'SS.ssss.SS.', 'SS.sSSs.SS.'];
  const TANK = [sprite([...TANK_TOP, '...ss.ss...', '..SSS.SSS..'], pTank), sprite([...TANK_TOP, '...sssss...', '...SS.SS...'], pTank)];
  // the warlock: a crimson hood with bone horns through it, a face in shadow with eyes like coals, a wine-dark robe
  // with a gold trim, fire in his hand; arms up to call down the meteor
  const pLock = { b: P.bone, c: P.crim, C: P.crimD, D: C(0x5a1420), g: P.gold, K: C(0x1a0a0e), y: P.fireY, f: P.fire, F: P.fireY };
  const LOCK_TOP = ['b.......b.', 'bb.ccc.bb.', '.bccccccb.', '..cKKKKc..', '..cKyKyc.F', '..ccccc.fF', '.cDDcDDcf.', '.cDDgDDc..', '.cDDgDDc..', 'cDDDgDDDc.', 'cDDDgDDDc.', 'cDDDgDDDc.'];
  const LOCK = [sprite([...LOCK_TOP, '.CC...CC..'], pLock), sprite([...LOCK_TOP, '..CC.CC...'], pLock)];
  const LOCK_UP = sprite(['F........F', 'c.b....b.c', 'c.bccccb.c', 'c.cKKKKc.c', 'c.cKyKyc.c', '.cccccccc.', '..cDDDDc..', '..cDDgDc..', '..cDDgDc..', '.cDDDgDDc.', '.cDDDgDDc.', 'cDDDDgDDDc', '.CC....CC.'], pLock);
  // creeps: little helmeted soldiers with a blade; the casters robed, a glowing tip on a stick
  const CREEP = [0, 1].map((t) => {
    const pal = { a: t ? P.crim : P.teal, d: t ? P.crimD : P.tealD, l: t ? P.crimL : P.tealL, o: t ? P.fireY : P.orb, w: P.steel, '|': P.wood };
    return {
      melee: [sprite(['.lll.', 'laaal', '.aaaw', '.ddd.', '.d.d.'], pal), sprite(['.lll.', 'laaal', '.aaaw', '.ddd.', '..dd.'], pal)],
      ranged: [sprite(['...o.', '.ll|.', '.aa|.', 'aaaa.', '.d.d.'], pal), sprite(['...o.', '.ll|.', '.aa|.', 'aaaa.', '..dd.'], pal)],
    };
  });
  // towers: a stone pillar with battlements, the side's crystal floating on top
  const TOWER = [0, 1].map((t) => sprite(['...c...', '..cCc..', '..cCc..', '...c...', '.s.s.s.', '.sssss.', '..sls..', '..sSs..', '..sls..', '..sSs..', '.sssss.', 'sssssss', 'SSSSSSS'],
    { c: t ? P.crimL : P.tealL, C: t ? P.crim : P.teal, s: P.stone, l: P.stoneL, S: P.stoneD }));
  // portraits (7 x 7): the HUD, the kill feed
  const ICON = {
    mage: sprite(['...h...', '..hhh..', '.hhhhh.', 'HtttttH', '.ffeff.', '.fffff.', 'rrrrrrr'], { h: P.blue, H: P.blueM, t: P.gold, f: P.skin, e: P.eye, r: P.blueD }),
    brute: sprite(['b.....b', 'bb...bb', '.mmmmm.', '.mymmy.', '.mmmmm.', 'sssssss', 'sSSSSSs'], { b: P.bone, m: P.iron, y: P.fireY, s: P.rust, S: P.rustD }),
    ranger: sprite(['...a...', '..aaa..', '.aaaaa.', '.afefa.', 'aaffffa', 'aAAAAAa', 'AAAAAAA'], { a: P.amb, A: P.ambD, f: P.skin, e: P.eye }),
    sin: sprite(['..ppp..', '.ppppp.', 'ppppppp', 'pEpppEp', 'ppppppp', '.PPPPP.', 'PPPPPPP'], { p: P.shade, P: P.shadeD, E: P.mag }),
    tank: sprite(['..lll..', '.lssss.', 'lssssss', 'sasssas', 'sssSsss', 'SsssssS', 'SSSSSSS'], { l: P.stoneL, s: P.stone, S: P.stoneD, a: P.ambE }),
    lock: sprite(['b.....b', 'bbcccbb', '.ccccc.', '.cKKKc.', '.cyKyc.', 'ccDgDcc', 'cDDgDDc'], { b: P.bone, c: P.crim, D: C(0x5a1420), g: P.gold, K: C(0x1a0a0e), y: P.fireY }),
    tower: sprite(['...c...', '..cCc..', '...c...', '.s.s.s.', '.sssss.', '..sls..', '.sssss.'], { c: P.crimL, C: P.crim, s: P.stone, l: P.stoneL }),
  };
  const HERO_ART = { mage: MAGE, brute: BRUTE, ranger: RANGER, sin: SIN, tank: TANK, lock: LOCK };
  // the spells' buttons (7 x 7): Q a fireball streaking, W a bolt, E a blink's swirl, R a ring of gold
  const ABIL = [
    sprite(['....yy.', '...yWWy', '..ofWWy', '.ofoyy.', 'ofo....', 'fo.....', 'o......'], { W: P.white, y: P.fireY, f: P.fire, o: P.ember }),
    sprite(['...zzz.', '..zzz..', '.zzWzz.', '...zz..', '..zz...', '.zz....', '.z.....'], { z: P.zap, W: P.white }),
    sprite(['..vvvv.', '.v....v', 'v..vv.v', 'v.v.W.v', 'v.vvv..', '.v.....', '..vvvv.'], { v: P.violet, W: P.white }),
    sprite(['..nnn..', '.n...n.', 'n..N..n', 'n.NWN.n', 'n..N..n', '.n...n.', '..nnn..'], { n: P.nova, N: P.novaL, W: P.white }),
  ];
  const ABIL_BG = [C(0x40160c), C(0x0e2440), C(0x26123e), C(0x382a08)];
  const CD = [4, 6, 8, 9], COST = [0.1, 0.14, 0.09, 0.26];
  const CURSOR = sprite(['w...', 'wg..', 'wgg.', 'wggg', 'wgg.', '..g.'], { w: P.white, g: P.gold });

  // ---- the simulation
  const sim = { ri: -1, t: 0 };
  const T0 = -3;                                                             // a round starts 3 s before its play
  const ROUNDS = [], FAILS = [6.0, 5.3, 5.45];
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function addUnit(o) {
    const u = { alive: true, x: 0, y: 0, gx: null, gy: null, spd: 14, face: 1, walk: 0, moving: false, flash: 0, atk: 0, cd: 0, vis: 0, stun: -9, lift: 0, deadT: -9, tg: null, max: 100, chase: null, keep: 3, ...o };
    u.hp = u.max; sim.units.push(u); return u;
  }
  const when = (t, fn) => sim.q.push([t, fn]);
  const efx = (kind, o) => { const f = { kind, t0: sim.t, age: 0, ...o }; sim.fx.push(f); return f; };
  function part(x, y, vx, vy, life, c0, c1, add = false, drag = 3) { sim.parts.push({ x, y, vx, vy, life, age: 0, c0, c1, add, drag }); }
  function spray(x, y, n, spd, life, c0, c1, add = true) { for (let i = 0; i < n; i++) { const a = sim.rr() * 6.283, v = spd * (0.4 + 0.6 * sim.rr()); part(x, y, Math.cos(a) * v, Math.sin(a) * v, life * (0.6 + 0.6 * sim.rr()), c0, c1, add); } }
  function float(x, y, str, c) { sim.floats.push({ x, y, str, c, age: 0 }); }
  // where a point of a hero's sprite is on the field (his staff's orb, a fist): sprite column sx, row sy
  function at(u, sx, sy) {
    const sp = HERO_ART[u.id][0], ox = Math.round(u.x - (sp.w - 1) / 2);
    return [u.face < 0 ? ox + sp.w - 1 - sx : ox + sx, Math.round(u.y - u.lift) - sp.h + 1 + sy];
  }
  const orb = (h) => at(h, 7, 2);
  function move(u, x, y, spd, dt) {
    const dx = x - u.x, dy = y - u.y, d = Math.hypot(dx, dy);
    if (d < 0.05) { u.moving = false; return; }
    const st = Math.min(d, spd * dt);
    u.x += (dx / d) * st; u.y += (dy / d) * st; u.moving = true; u.walk += dt;
    if (Math.abs(dx) > 0.05) u.face = dx > 0 ? 1 : -1;
  }
  function hurt(u, dmg, src) {
    if (!u.alive) return;
    u.flash = u === sim.hero ? 0.07 : 0.12; u.hp -= dmg;
    if (src && src.team === 0) u.hitBy = sim.t;                              // hit by his side: seen for a while
    if (u === sim.hero) { u.hp = Math.max(u.hp, 4); u.hitT = sim.t; }      // he dies when the script says so
    else if (u.minHp) u.hp = Math.max(u.hp, u.minHp);
    if (u.hp <= 0) die(u, src);
  }
  function die(u, src) {
    u.alive = false; u.deadT = sim.t; u.hp = 0;
    if (u.kind === 'creep') {
      spray(u.x, u.y - 2, 6, 13, 0.35, u.team ? P.crimL : P.tealL, P.smoke, false);
      if (src === sim.hero && u.team) spray(u.x, u.y - 3, 6, 10, 0.45, P.fireY, P.goldD);   // gold
    }
  }
  /** His death: the script's moment. */
  function kill(killers) {
    const h = sim.hero; sim.killers = killers; sim.death = sim.t;
    h.flash = 0.25; die(h); spray(h.x, h.y - 5, 18, 18, 0.6, P.tealL, P.tealD); efx('ghost', { x: h.x, y: h.y - 6, dur: 1.4 });
  }
  function wave(team, s0) {
    const back = team ? 1 : -1;
    for (const [ranged, d, ds] of [[0, -4.6, 0], [0, -1.5, 0.02], [0, 1.6, 0.015], [0, 4.7, 0], [1, -2.6, 0.11], [1, 2.7, 0.115]]) {
      const [x, y] = lane(s0 + back * ds, d);
      addUnit({ kind: 'creep', team, ranged: !!ranged, x, y, d, max: 200, spd: 11.5, range: ranged ? 13 : 4.6, dmg: ranged ? 4 : 5, aggro: 18, cd: sim.rr() * 0.6 });
    }
  }
  function nearestFoe(from, pred = () => true, r = 99) {
    let best = null, bd = r;
    for (const u of sim.units) if (u.alive && u.team === 1 && u.kind !== 'tower' && u.vis > 0.5 && pred(u)) { const d = dist(u, from); if (d < bd) { bd = d; best = u; } }
    return best;
  }
  const creepFoe = (u) => u.kind === 'creep';

  // his commands. Each one is a click of his (and maybe a key): the screen's cursor goes there and clicks (TRACK keeps
  // where on the screen), and the boy's mouse hand and fingers do the same (see activity())
  function click(x, y, kind, key = -1) {
    sim.rec.push({ t: sim.t, x: x - sim.cx, y: y - sim.cy, key, kind });
    if (kind === 'move' || kind === 'attack') efx('mark', { x, y, c: kind === 'move' ? P.sel : P.red, dur: 0.32 });
  }
  const order = (t, s, d) => when(t, () => { const [x, y] = lane(s, d), h = sim.hero; click(x, y, 'move'); h.gx = x; h.gy = y; h.chase = null; });
  function lastHit(t) {
    when(t, () => {
      const h = sim.hero;
      let best = null;
      for (const u of sim.units) if (u.alive && u.kind === 'creep' && u.team === 1 && u.vis > 0.5 && dist(u, h) < 34 && (!best || u.hp < best.hp)) best = u;
      if (!best) return;
      click(best.x, best.y - 2, 'attack'); h.face = best.x > h.x ? 1 : -1; h.atk = 0.2; h.gx = h.x; h.gy = h.y; h.castT = sim.t;
      const [ox, oy] = orb(h);
      efx('bolt', { src: h, tg: best, x: ox, y: oy, spd: 62, dmg: 999, c: P.tealL, big: true });
    });
  }
  function cast(k, x, y) {
    const h = sim.hero;
    click(x, y, 'cast', k); sim.cast[k] = sim.t; sim.mana = Math.max(0, sim.mana - COST[k]);
    h.castT = sim.t; if (Math.abs(x - h.x) > 0.5) h.face = x > h.x ? 1 : -1; h.gx = h.x; h.gy = h.y;
  }
  /** Q: a fireball, homing; it bursts on what it hits. */
  const castQ = (t, pick) => when(t, () => {
    const tg = pick(), h = sim.hero; if (!tg) return;
    cast(0, tg.x, tg.y - 3);
    const [ox, oy] = orb(h);
    efx('fire', { src: h, tg, x: ox, y: oy, spd: 54, dmg: tg.kind === 'hero' ? 34 : 999, trail: [] });
  });
  /** W: lightning from his staff to the first target, then jumping on to the nearest one it hasn't hit (at least 6 px
   *  from the last, so no jump is lost inside a sprite), n times; a jump every HOP seconds, each arc lit for ARC. */
  const HOP = 0.1, ARC = 0.32;
  const castW = (t, pick, n = 4, dmg = 55) => when(t, () => {
    const first = pick(), h = sim.hero; if (!first) return;
    cast(1, first.x, first.y - 3);
    const pts = [h, first];
    while (pts.length < n + 1) { const last = pts[pts.length - 1], nx = nearestFoe(last, (u) => !pts.includes(u) && dist(u, last) >= 6, 24); if (!nx) break; pts.push(nx); }
    efx('chain', { pts, pos: pts.map((u, i) => (i ? [u.x, u.y - 3] : orb(h))), hit: 1, dmg });
  });
  /** E: blink to a point on the lane. */
  const castE = (t, s, d) => when(t, () => {
    const h = sim.hero, [x, y] = lane(s, d);
    cast(2, x, y);
    efx('blink', { x0: h.x, y0: h.y, x1: x, y1: y, dur: 0.5 });
    spray(h.x, h.y - 5, 14, 18, 0.4, P.violet, P.violetD); spray(x, y - 5, 10, 14, 0.35, P.white, P.violet);
    h.x = x; h.y = y; h.gx = x; h.gy = y; h.blinkT = sim.t; h.drag = null;
  });
  /** R: a golden nova round him: it rolls out and hits everything of theirs it crosses. */
  const castR = (t, dmg = 70) => when(t, () => { const h = sim.hero; cast(3, h.x + h.face * 4, h.y - 4); efx('nova', { x: h.x, y: h.y - 3, r1: 19, dur: 0.5, hit: new Set(), dmg }); });

  // their heroes
  const foe = (id, s, d, o = {}) => { const [x, y] = lane(s, d); return addUnit({ kind: 'hero', id, team: 1, x, y, gx: x, gy: y, spd: 13, minHp: 3, ...o }); };
  const goTo = (u, s, d, spd) => { const [x, y] = lane(s, d); u.gx = x; u.gy = y; u.chase = null; if (spd) u.spd = spd; };
  const walkTo = (t, u, s, d, spd) => when(t, () => goTo(u, s, d, spd));
  const chase = (t, u, keep, spd) => when(t, () => { u.chase = sim.hero; u.keep = keep; if (spd) u.spd = spd; });
  const shoot = (t, u, dmg = 4) => when(t, () => { const h = sim.hero; if (!u.alive) return; u.face = h.x > u.x ? 1 : -1; u.atk = 0.2; const [x, y] = at(u, 8, 5); efx('arrow', { src: u, tg: h, x, y, spd: 100, dmg }); });
  const melee = (t, u, dmg, c = P.steel) => when(t, () => { const h = sim.hero; u.face = h.x > u.x ? 1 : -1; u.atk = 0.2; efx('slash', { x: (u.x + h.x) / 2, y: h.y - 5, face: u.face, c, dur: 0.2 }); hurt(h, dmg, u); });
  /** A tower's bolt at him: a fat crimson orb from its crystal, straight in over TSHOT s, the crystal flaring as it
   *  fires; it bursts on him. `last`: the one that kills him. */
  const TSHOT = 0.22;
  function towerShot(tw, dmg, last) { tw.shotT = sim.t; efx('tshot', { src: tw, x0: tw.x, y0: tw.y - 10.5, x: tw.x, y: tw.y - 10.5, dur: TSHOT, dmg, last }); }
  /** Pull the camera toward a point (k: how far, 0 = back on his hero). */
  const pan = (t, s, d, k) => when(t, () => { sim.focus = k > 0 ? [...lane(s, d), k] : null; });

  // the rounds: what happens, when. All three open the same way: the waves march out and meet at the river ford; he
  // walks up behind his, right-clicking along, and takes two last hits from the back. On the way, a glance up the lane:
  // a click on the minimap jumps the view to their tower (in the fog, at the far end of the lane), and a moment later it
  // snaps back to him, as players do.
  function opening() {
    when(-1.15, () => { sim.rec.push({ t: sim.t, x: 1 + (T2[0] / WW) * 13, y: 1 + (T2[1] / WH) * 13, key: -1, kind: 'mini' }); sim.peek = [T2[0] - 4, T2[1] + 6]; [sim.cx, sim.cy] = camGoal(); });
    when(-0.3, () => { sim.peek = null; [sim.cx, sim.cy] = camGoal(); });
    order(-2.8, 0.1, 3); order(-1.5, 0.2, 2.6); order(0.55, 0.27, 3.1);   // (no clicks on the field while he looks away)
    lastHit(1.75); order(2.0, 0.3, 2); lastHit(2.35);
  }
  const SCRIPTS = [
    // 0. the gank: he farms greedy past the ford; three of theirs step out of the fog (the brute out of the woods below
    // the lane, the ranger out of the woods above it, the assassin unseen behind him); he blinks away, the brute's hook
    // drags him back, the assassin appears behind him, the ranger's arrows, the cleaver. His nova in a panic. Dead.
    () => {
      opening();
      const br = foe('brute', 0.66, 16), as = foe('sin', 0.42, -16, { spd: 15, invis: true }), rg = foe('ranger', 0.56, -19, { spd: 12 });
      castQ(2.6, () => nearestFoe(sim.hero, (u) => u.ranged) ?? nearestFoe(sim.hero, creepFoe));
      order(2.95, 0.4, -1);
      castW(3.45, () => nearestFoe(sim.hero, (u) => u.ranged) ?? nearestFoe(sim.hero, creepFoe));   // over the melee line to their caster, then back along it
      order(3.6, 0.6, 0);
      chase(4.0, br, 12, 13); chase(4.0, as, 6, 15); chase(4.05, rg, 20, 12);
      when(4.15, () => efx('ping', { u: sim.hero, dur: 0.9 }));
      castE(4.42, 0.3, 5);
      when(4.6, () => { br.chase = null; br.gx = br.x; br.gy = br.y; const h = sim.hero, [x, y] = at(br, 9, 3), d = Math.hypot(h.x - x, h.y - 5 - y); efx('hook', { src: br, x, y, dx: (h.x - x) / d, dy: (h.y - 5 - y) / d, len: 0, max: 52, out: true }); });
      when(5.2, () => { as.invis = false; const h = sim.hero; as.x = h.x - h.face * 8; as.y = h.y + 0.6; as.gx = as.x; as.gy = as.y; as.chase = null; as.face = h.face; efx('poof', { x: as.x, y: as.y - 5, c: P.mag, dur: 0.4 }); });
      melee(5.28, as, 18, P.mag); melee(5.7, as, 18, P.mag);
      melee(5.36, br, 14); melee(5.82, br, 14);
      shoot(5.0, rg); shoot(5.28, rg); shoot(5.55, rg); shoot(5.8, rg);
      castR(5.45, 18);
      when(FAILS[0], () => kill([br, as, rg]));
      when(FAILS[0] + 0.3, () => { br.taunt = sim.t; as.invis = true; goTo(rg, 0.62, -16, 9); });
    },
    // 1. the dive: their ranger harasses him from the ford; he fireballs her, she runs for her tower, he chases her with
    // lightning, blinks in under their tower and novas her down to a sliver. The tower locks on to him (a red beam from
    // its crystal, red brackets closing on him) and opens fire, big crimson bolts; their tank leaps out of the fog behind
    // it and stuns him; he clicks away, going nowhere, and the tower's bolts take him apart. Dead (the tower's kill);
    // she lives.
    () => {
      opening();
      const rg = foe('ranger', 0.82, 7, { spd: 15 }), tk = foe('tank', 1.13, -6, { spd: 12 });
      walkTo(0.3, rg, 0.56, 6, 11.5);
      harass(1.35); harass(2.15);
      function harass(t) { when(t, () => { const h = sim.hero; rg.face = h.x > rg.x ? 1 : -1; rg.atk = 0.2; const [x, y] = at(rg, 8, 5); efx('arrow', { src: rg, tg: h, x, y, spd: 100, dmg: 4 }); }); }
      castQ(2.55, () => rg);
      walkTo(2.8, rg, 0.95, -10, 16);
      order(2.9, 0.6, 2.7);
      castW(3.3, () => rg, 3, 26);
      pan(3.3, 0.98, -4, 0.5);
      order(3.5, 0.72, 2);
      castE(3.75, 0.84, 4);
      when(3.82, () => { sim.t2.aggro = sim.hero; efx('aggro', { src: sim.t2, tg: sim.hero }); });
      castR(3.98, 22);
      // the tower's bolts: 0.36 s apart, from before the tank lands; the fourth lands at FAILS[1] and kills him
      for (let k = 0; k < 4; k++) when(FAILS[1] - TSHOT - (3 - k) * 0.36, () => towerShot(sim.t2, 22, k === 3));
      when(4.1, () => { const h = sim.hero; efx('leap', { u: tk, x0: tk.x, y0: tk.y, x1: h.x - 9, y1: h.y + 2, dur: 0.45, onLand() { efx('shock', { x: tk.x - 1, y: tk.y, r1: 12, c: P.stoneL }); hurt(h, 4, tk); h.stun = 9; efx('stars', { u: h }); } }); });
      walkTo(4.15, rg, 1.0, -16, 14);
      harass(4.62); harass(4.95);
      order(4.58, 0.74, 3); order(4.78, 0.7, 7); order(4.98, 0.77, 0); order(5.16, 0.69, 5);   // stunned: clicking away, going nowhere
      when(FAILS[1] + 0.3, () => { rg.taunt = sim.t; tk.taunt = sim.t; sim.t2.aggro = null; });
    },
    // 2. the ultimate: he novas their whole wave at the ford, their tank lumbers out of the fog, he fireballs and zaps
    // it, it stomps (stunned); their warlock steps out of the fog and calls down a meteor on him; he blinks, not far
    // enough.
    () => {
      opening();
      const tk = foe('tank', 0.5, -22), wl = foe('lock', 0.74, 26, { spd: 11.5 }), T = FAILS[2] - 0.05;   // T: the meteor lands
      order(2.45, 0.42, 2);
      castR(2.95);
      chase(3.0, tk, 9.5, 14); pan(3.0, 0.48, -14, 0.35); pan(4.3, 0, 0, 0);
      castQ(3.3, () => tk);
      castW(3.75, () => tk, 4, 40);
      when(4.3, () => { const h = sim.hero; tk.atk = 0.3; efx('shock', { x: tk.x, y: tk.y, r1: 13, c: P.stoneL }); hurt(h, 12, tk); h.stun = sim.t + 0.55; efx('stars', { u: h, t1: sim.t + 0.55 }); });
      when(4.35, () => { const h = sim.hero; goTo(wl, 0.66, 15, 11.5); wl.channel = sim.t; sim.warn = efx('warn', { x: h.x, y: h.y - 1, r: 17, t1: T }); });
      pan(4.35, 0.62, 10, 0.3);
      when(T - 0.55, () => efx('meteor', { x: sim.warn.x, y: sim.warn.y, t1: T }));
      order(4.55, 0.36, 4);                                                  // stunned, clicking
      castE(4.9, 0.3, 3);
      order(5.1, 0.26, 3);
      when(FAILS[2], () => kill([wl]));
      when(FAILS[2] + 0.4, () => { wl.channel = -9; wl.taunt = sim.t; tk.chase = null; tk.gx = tk.x; tk.gy = tk.y; });
    },
  ];

  // the camera: his hero a little left of and below the middle (the fight is ahead of him, up the lane), eased; a
  // script can pull it toward something it wants seen (their tower, the warlock)
  function camGoal() {
    const h = sim.hero; let x = h.x + 10, y = h.y - 9;
    if (sim.focus) { x = lerp(x, sim.focus[0], sim.focus[2]); y = lerp(y, sim.focus[1], sim.focus[2]); }
    if (sim.peek) [x, y] = sim.peek;                                          // the minimap glance (opening)
    return [clamp(x - SW / 2, 0, WW - SW), clamp(y - FH / 2, 0, WH - FH)];
  }
  function reset(ri) {
    Object.assign(sim, { ri, t: T0, rr: rng(4242 + ri * 77), units: [], fx: [], parts: [], floats: [], decals: [], q: [], qi: 0, rec: [], shake: 0, flash: 0, death: -1, killers: [], mana: 1, cast: [-99, -99, -99, -99], hpTrail: 1, warn: null, focus: null, peek: null });
    sim.t1 = addUnit({ kind: 'tower', team: 0, x: T1[0], y: T1[1], range: 18, cd: 0 });
    sim.t2 = addUnit({ kind: 'tower', team: 1, x: T2[0], y: T2[1], range: 18, cd: 0, minHp: 20 });
    wave(0, 0.06); wave(1, 0.94);                                            // out in front of the towers
    const [hx, hy] = lane(0.02, 8);                                            // beside his tower
    sim.hero = addUnit({ kind: 'hero', id: 'mage', team: 0, x: hx, y: hy, gx: hx, gy: hy, spd: 15, vis: 1 });
    [sim.cx, sim.cy] = camGoal();
    SCRIPTS[ri]();
    sim.q.sort((a, b) => a[0] - b[0]);
  }

  function stepUnit(u, dt) {
    u.flash = Math.max(0, u.flash - dt); u.atk = Math.max(0, u.atk - dt);
    // theirs are seen where his side sees; a creep of theirs fighting one of his gives itself away, and so does a hero
    // of theirs coming for him (chasing, leaping, calling down the meteor) or just hit by his spells
    if (u.team === 1) u.vis += (Math.max(clamp(visAt(u.x, u.y - 3) * 1.3 - 0.15, 0, 1), u.alive && (u.kind === 'creep' ? u.tg && u.tg.team === 0 : u.chase || u.leaping || u.channel > 0 || sim.t - (u.hitBy ?? -9) < 1.5) ? 1 : 0) - u.vis) * Math.min(1, dt * 12);
    if (u.kx) { u.x += u.kx * dt; u.y += u.ky * dt; u.kx *= Math.exp(-dt * 12); u.ky *= Math.exp(-dt * 12); if (Math.abs(u.kx) + Math.abs(u.ky) < 0.1) u.kx = u.ky = 0; }
    if (!u.alive) return;
    if (u.kind === 'creep') {
      u.cd -= dt;
      let tg = u.tg;
      if (!tg || !tg.alive || dist(u, tg) > u.aggro + 5) {
        tg = null; let bd = u.aggro;
        for (const o of sim.units) if (o.alive && o.team !== u.team && (o.kind === 'creep' || o.kind === 'tower')) { const d = dist(u, o); if (d < bd) { bd = d; tg = o; } }
        u.tg = tg;
      }
      if (tg) {
        const d = dist(u, tg), r = u.range + (tg.kind === 'tower' ? 2.4 : 0);
        if (d > r) move(u, tg.x, tg.y, u.spd, dt);
        else {
          u.moving = false; u.face = tg.x >= u.x ? 1 : -1;
          if (u.cd <= 0) {
            u.cd = 0.95 + 0.3 * sim.rr(); u.atk = 0.16;
            if (u.ranged) efx('bolt', { src: u, tg, x: u.x + u.face * 1.5, y: u.y - 4, spd: 44, dmg: u.dmg, c: u.team ? P.fireY : P.tealL });
            else hurt(tg, u.dmg, u);
          }
        }
      } else { const [gx, gy] = lane(u.team ? -0.25 : 1.25, u.d); move(u, gx, gy, u.spd, dt); }
    } else if (u.kind === 'tower') {
      u.cd -= dt;
      if (u.aggro) return;                                                     // locked on to him: the script fires (towerShot)
      let tg = null, bd = u.range;
      for (const o of sim.units) if (o.alive && o.team !== u.team && o.kind === 'creep') { const d = dist(u, o); if (d < bd) { bd = d; tg = o; } }
      if (tg && u.cd <= 0) { u.cd = 0.9; u.shotT = sim.t; efx('shot', { src: u, tg, x: u.x, y: u.y - 11, spd: 64, dmg: 28, c: u.team ? P.crimL : P.tealL, c2: u.team ? P.crim : P.teal }); }
    } else {
      if (u.drag || u.leaping) { u.moving = false; return; }
      if (u.stun > sim.t) { u.moving = false; return; }
      let gx = u.gx, gy = u.gy;
      if (u.chase) {
        const t = u.chase, d = dist(u, t);
        if (d > u.keep + 0.3) { gx = t.x + ((u.x - t.x) / d) * u.keep; gy = t.y + ((u.y - t.y) / d) * u.keep; } else { gx = u.x; gy = u.y; }
      }
      if (gx !== null && Math.hypot(gx - u.x, gy - u.y) > 0.25) move(u, gx, gy, u.spd, dt); else u.moving = false;
      if (u.chase && !u.moving) u.face = u.chase.x > u.x ? 1 : -1;
    }
  }
  /** Bolts, arrows and tower shots: they home in, then hit. */
  function homing(f, dt) {
    const tg = f.tg, tx = tg.x, ty = tg.y - (tg.kind === 'tower' ? 8 : tg.kind === 'hero' ? 5 : 3);
    const dx = tx - f.x, dy = ty - f.y, d = Math.hypot(dx, dy);
    f.vx = dx / Math.max(d, 1e-6); f.vy = dy / Math.max(d, 1e-6);
    if (!tg.alive && tg !== sim.hero) return false;
    if (d <= f.spd * dt + 0.4) { f.x = tx; f.y = ty; return true; }
    f.x += f.vx * f.spd * dt; f.y += f.vy * f.spd * dt;
    return null;
  }
  function stepEfx(f, dt) {
    f.age += dt;
    switch (f.kind) {
      case 'bolt': case 'arrow': case 'shot': {
        const r = homing(f, dt);
        if (r === false) return false;
        if (r) {
          hurt(f.tg, f.dmg, f.src);
          if (f.kind === 'shot') { efx('burst', { x: f.x, y: f.y, r1: 4.5, dur: 0.24, c: f.c2 }); if (f.tg === sim.hero) sim.shake = Math.max(sim.shake, 0.14); }
          else if (f.big) {                                                   // his last hit: the gold it pays
            spray(f.x, f.y, 6, 12, 0.3, P.tealL, P.tealD); efx('burst', { x: f.x, y: f.y, r1: 3, dur: 0.18, c: P.teal });
            if (!f.tg.alive) float(f.tg.x - 5, f.tg.y - 10, '+' + (38 + ((f.tg.x * 7) | 0) % 9), P.gold);
          }
          return false;
        }
        return true;
      }
      case 'fire': {
        f.trail.unshift([f.x, f.y]); if (f.trail.length > 16) f.trail.pop();
        if (sim.rr() < 0.8) part(f.x, f.y, (sim.rr() - 0.5) * 7, (sim.rr() - 0.5) * 7, 0.45, P.fire, P.smoke, true, 2);
        const r = homing(f, dt);
        if (r === false) return false;
        if (r) {
          hurt(f.tg, f.dmg, f.src);
          efx('burst', { x: f.x, y: f.y, r1: 10, dur: 0.45, c: P.fire, big: true });
          spray(f.x, f.y, 20, 26, 0.55, P.fireY, P.ember);
          sim.decals.push({ x: f.x, y: f.y + 2, r: 3.4, age: 0, life: 2.5, kind: 'scorch' });
          sim.shake = Math.max(sim.shake, 0.12);
          return false;
        }
        return true;
      }
      case 'chain': {
        // a jump every HOP: each target is hit (and frozen where it stood) as the arc reaches it, a few sparks off it
        while (f.hit < f.pts.length && f.age >= (f.hit - 1) * HOP) {
          const u = f.pts[f.hit]; f.pos[f.hit] = [u.x, u.y - 3];
          hurt(u, u.kind === 'creep' ? 999 : f.dmg, sim.hero); spray(u.x, u.y - 3, 5, 18, 0.26, P.white, P.arc, false); f.hit++;
        }
        return f.age < (f.pts.length - 2) * HOP + ARC;
      }
      case 'nova': {
        const r = 2 + (f.r1 - 2) * outQ(f.age / f.dur);
        for (const u of sim.units) if (u.alive && u.team === 1 && u.kind !== 'tower' && u.vis > 0.3 && !f.hit.has(u) && Math.hypot(u.x - f.x, u.y - 3 - f.y) < r) {
          f.hit.add(u); hurt(u, u.kind === 'creep' ? 999 : f.dmg, sim.hero);
          const d = Math.max(0.5, Math.hypot(u.x - f.x, u.y - f.y)); u.kx = ((u.x - f.x) / d) * 20; u.ky = ((u.y - f.y) / d) * 20;
        }
        if (f.age < dt * 1.5) spray(f.x, f.y, 22, 30, 0.5, P.novaL, P.nova);
        return f.age < f.dur + 0.3;
      }
      case 'hook': {
        const b = f.src, [hx, hy] = at(b, 9, 3), h = sim.hero;
        if (f.out) {
          f.len += 150 * dt; f.x = hx + f.dx * f.len; f.y = hy + f.dy * f.len;
          if (Math.hypot(f.x - h.x, f.y - (h.y - 5)) < 3.5) { f.out = false; f.caught = true; h.drag = f; hurt(h, 12, b); efx('burst', { x: f.x, y: f.y, r1: 4.5, dur: 0.22, c: P.steel }); sim.shake = Math.max(sim.shake, 0.16); }
          else if (f.len >= f.max) f.out = false;
        } else {
          const dx = hx - f.x, dy = hy - f.y, d = Math.hypot(dx, dy), st = 105 * dt;
          if (d <= st + 2.6) { if (f.caught) { h.drag = null; h.x = b.x + b.face * 8; h.y = b.y + 0.4; h.gx = h.x; h.gy = h.y; h.face = -b.face; } return false; }
          f.x += (dx / d) * st; f.y += (dy / d) * st;
          if (f.caught) { h.x = f.x; h.y = f.y + 5; }
        }
        return true;
      }
      case 'leap': {
        const k = clamp(f.age / f.dur, 0, 1), u = f.u;
        u.leaping = k < 1; u.x = lerp(f.x0, f.x1, k); u.y = lerp(f.y0, f.y1, k); u.lift = 13 * Math.sin(Math.PI * k); u.face = f.x1 > f.x0 ? 1 : -1;
        if (k >= 1) { u.lift = 0; u.gx = u.x; u.gy = u.y; sim.shake = Math.max(sim.shake, 0.3); f.onLand(); return false; }
        return true;
      }
      case 'tshot': {
        const h = sim.hero, e = clamp(f.age / f.dur, 0, 1);
        f.x = lerp(f.x0, h.x, e); f.y = lerp(f.y0, h.y - 5, e);
        if (e < 1) return true;
        hurt(h, f.dmg, f.src); if (f.last) kill([f.src]);
        efx('burst', { x: f.x, y: f.y, r1: 6.5, dur: 0.3, c: P.crim });
        spray(f.x, f.y, 12, 22, 0.4, P.crimL, P.crimD);
        sim.shake = Math.max(sim.shake, 0.2);
        return false;
      }
      case 'aggro': return sim.hero.alive && !!f.src.aggro;                    // held until he dies
      case 'shock': if (f.age < dt * 1.5) { spray(f.x, f.y - 1, 16, 20, 0.5, f.c, P.stoneD, false); sim.shake = Math.max(sim.shake, 0.25); } return f.age < 0.5;
      case 'stars': return sim.hero.alive && sim.hero.stun > sim.t;
      case 'meteor': {
        if (sim.t >= f.t1) {
          sim.flash = 1; sim.shake = 0.7;
          efx('burst', { x: f.x, y: f.y, r1: 30, dur: 0.75, c: P.fire, big: true, huge: true });
          spray(f.x, f.y, 60, 44, 0.9, P.fireY, P.ember);
          sim.decals.push({ x: f.x, y: f.y, r: 10, age: 0, life: 99, kind: 'crater' });
          for (const u of sim.units) if (u.alive && u.kind === 'creep' && Math.hypot(u.x - f.x, u.y - f.y) < 17) hurt(u, 999, null);
          hurt(sim.hero, 999, null);
          return false;
        }
        const k = meteorK(f);
        if (k > 0) for (let i = 0; i < 2; i++) { const [mx, my] = meteorAt(f, k); part(mx + (sim.rr() - 0.5) * 3, my + (sim.rr() - 0.5) * 3, (sim.rr() - 0.5) * 8 + 12, (sim.rr() - 0.5) * 8 - 16, 0.5, P.fire, P.smoke, true, 1.5); }
        return true;
      }
      case 'warn': return sim.t < f.t1;
      default: return f.age < (f.dur ?? 0.5);
    }
  }
  // the meteor: it comes in from off the top right, faster and faster, over its last 0.55 s
  const meteorK = (f) => clamp((sim.t - (f.t1 - 0.55)) / 0.55, 0, 1);
  const meteorAt = (f, k) => { const e = k * k; return [f.x + 40 * (1 - e), f.y - 60 * (1 - e)]; };
  function stepSim(dt) {
    sim.t += dt;
    seers();
    while (sim.qi < sim.q.length && sim.q[sim.qi][0] <= sim.t) sim.q[sim.qi++][1]();
    for (const u of sim.units) stepUnit(u, dt);
    // creeps of a side keep a little apart
    for (let i = 0; i < sim.units.length; i++) {
      const a = sim.units[i]; if (!a.alive || a.kind !== 'creep') continue;
      for (let j = i + 1; j < sim.units.length; j++) {
        const b = sim.units[j]; if (!b.alive || b.kind !== 'creep' || b.team !== a.team) continue;
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
        if (d < 4.8 && d > 1e-4) { const p = (4.8 - d) * 3 * dt; a.x -= (dx / d) * p; a.y -= (dy / d) * p; b.x += (dx / d) * p; b.y += (dy / d) * p; }
      }
    }
    const live = sim.fx; sim.fx = [];                                         // what the effects spawn (a burst, a shock ring) joins after
    sim.fx = live.filter((f) => stepEfx(f, dt)).concat(sim.fx);
    for (const p of sim.parts) { p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; const k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; }
    sim.parts = sim.parts.filter((p) => p.age < p.life);
    for (const f of sim.floats) f.age += dt;
    sim.floats = sim.floats.filter((f) => f.age < 0.7);
    for (const d of sim.decals) d.age += dt;
    sim.decals = sim.decals.filter((d) => d.age < d.life);
    sim.shake = Math.max(0, sim.shake - dt); sim.flash = Math.max(0, sim.flash - dt * 4);
    const hp = clamp(sim.hero.hp / 100, 0, 1);
    sim.hpTrail = sim.hpTrail > hp && sim.t - (sim.hero.hitT ?? -9) > 0.35 ? Math.max(hp, sim.hpTrail - dt * 0.8) : Math.max(sim.hpTrail, hp);
    const [gx, gy] = camGoal(), e = 1 - Math.exp(-dt * 3);
    sim.cx += (gx - sim.cx) * e; sim.cy += (gy - sim.cy) * e;
  }

  // ---- the fog of war: what his side sees (his hero, his creeps, his tower, his base)
  const SEERS = [];
  function seers() {
    SEERS.length = 0;
    const h = sim.hero; SEERS.push(h.x, h.y - 3, 18);
    SEERS.push(T1[0], T1[1] - 4, 16, ANC0[0], ANC0[1], 15);
    for (const u of sim.units) if (u.alive && u.team === 0 && u.kind === 'creep') SEERS.push(u.x, u.y - 2, 12);
  }
  function visAt(x, y) {
    let v = 0;
    for (let i = 0; i < SEERS.length; i += 3) { const d = Math.hypot(x - SEERS[i], y - SEERS[i + 1]), e = (SEERS[i + 2] - d) / 3.5; if (e > v) { v = e; if (v >= 1) return 1; } }
    return clamp(v, 0, 1);
  }

  // ---- drawing a frame of the round
  const FOG = C(0x1c2a48), RIPPLE = C(0x9cd4f4), _c2 = [0, 0, 0];
  const FIRE_R = [P.white, P.fireY, P.fire, P.ember, C(0x5a1a10), P.smoke];
  const rampC = (R, k, out) => { k = clamp(k, 0, 0.9999) * (R.length - 1); const i = k | 0; return mixC(R[i], R[i + 1], k - i, out); };
  function drawHero(u, t) {
    const art = HERO_ART[u.id], fr = u.moving ? ((u.walk * 7) | 0) % 2 : 0;
    let y = u.y - u.lift, x = u.x;
    const a = u.team ? u.vis : 1;
    if (u.taunt && t - u.taunt < 1.6) y -= Math.abs(Math.sin((t - u.taunt) * 9)) * 2;
    if (u.atk > 0.08) x += u.face;
    if (u.blinkT !== undefined && t - u.blinkT < 0.08) return;
    if (u.invis) {                                                            // a shimmer: a few brighter pixels, sliding
      if (a < 0.4) return;
      const sp = art[0], ox = Math.round(x - (sp.w - 1) / 2), oy = Math.round(y) - sp.h + 1;
      for (const [sx, sy] of sp.pts) if ((sx + sy + ((t * 12) | 0)) % 4 === 0) lit(ox + sx, oy + sy, P.white, 0.14 * a);
      return;
    }
    if (!u.alive) {
      if (u.id === 'mage') drawSprite(MAGE_DEAD, x, y + 1, { face: u.face });
      return;
    }
    const sp = u.id === 'lock' && u.channel > 0 ? LOCK_UP : art[fr];
    const [ox, oy] = drawSprite(sp, x, y, { face: u.face, a, flash: u.flash > 0 ? (u.team ? 0.8 : 0.5) : 0, tint: u.team ? null : P.red });   // he flashes red when hit, theirs white
    if (a < 0.35) return;
    if (u.id === 'mage') {                                                    // the orb glows; brighter as he casts
      const ix = u.face > 0 ? ox + 7 : ox + sp.w - 8, k = Math.max(0, 1 - (t - (u.castT ?? -9)) / 0.3);
      bloom(ix, oy + 2, 2.6 + 2.4 * k, P.zap, 0.5 + 0.7 * k);
    }
    if (u.id === 'lock' && u.channel > 0) {                                   // a ball of fire swelling over his horns
      const k = clamp((t - u.channel) / 1, 0, 1), fx0 = Math.round(x), fy = oy - 8 - 2 * k, fl = 0.85 + 0.15 * Math.sin(t * 30);
      bloom(fx0, fy, 4 + 4 * k, P.fire, 1.1 * fl); disc(fx0, fy, 1.2 + 1.6 * k, P.fireY, 1); disc(fx0, fy, 0.6 + 0.6 * k, P.white, 1);
    }
    // the health bar over the head: green his, red theirs
    const bw = 9, bx = Math.round(x) - 4, by = oy - 3;
    rect(bx - 1, by - 1, bw + 2, 4, P.out, 0.85 * a);
    rect(bx, by, bw, 2, P.hpBg, a);
    rect(bx, by, Math.max(u.hp > 0 ? 1 : 0, Math.round((bw * u.hp) / u.max)), 2, P.hp[u.team], a);
  }
  /** The ring at a hero's feet: green round his, red round theirs. */
  function drawFeet(u, t) {
    if (u.kind !== 'hero' || !u.alive || u.invis || (u.blinkT !== undefined && t - u.blinkT < 0.08)) return;
    const a = u.team ? u.vis : 1; if (a < 0.35) return;
    if (u.lift > 0.5) disc(u.x, u.y + 0.5, 3 - u.lift * 0.1, P.black, 0.4);                      // the leap's shadow on the ground
    ring(u.x, u.y + 0.5, 4.6, 1, u.team ? P.red : P.sel, (u.team ? 0.55 : 0.9) * a, false, 0.42);
  }
  function drawCreep(u, t) {
    const a = u.team ? u.vis : 1;
    const art = CREEP[u.team][u.ranged ? 'ranged' : 'melee'];
    if (!u.alive) {                                                           // the body, sinking away
      const k = (t - u.deadT) / 0.5; if (k > 1) return;
      drawSprite(art[0], u.x, u.y, { face: u.face, a: a * (1 - k), dim: 0.5, outline: false });
      return;
    }
    const fr = u.moving ? ((u.walk * 6) | 0) % 2 : 0;
    const x = u.x + (u.atk > 0.08 && !u.ranged ? u.face : 0);
    const [ox, oy] = drawSprite(art[fr], x, u.y, { face: u.face, a, flash: u.flash > 0 ? 0.85 : 0 });
    if (u.ranged && a > 0.5) lit(u.face > 0 ? ox + 3 : ox + 1, oy, u.team ? P.fire : P.zap, 0.5);
    if (u.hp < u.max && a > 0.5) { rect(ox, oy - 2, 5, 1, P.hpBg, a); rect(ox, oy - 2, Math.max(1, Math.round((5 * u.hp) / u.max)), 1, P.hp[u.team], a); }
  }
  function drawTower(u, t) {
    const dim = u.team ? 0.85 + 0.15 * visAt(u.x, u.y - 6) : 1;                // a building: seen through the fog, as in the real thing
    const [ox, oy] = drawSprite(TOWER[u.team], u.x, u.y, { dim, flash: u.flash > 0 ? 0.5 : 0 });
    // the crystal glows; brighter locked on to him; it flares white-hot as it fires
    const fl = clamp(1 - (t - (u.shotT ?? -9)) / 0.2, 0, 1);
    bloom(ox + 3, oy + 1.5, 3.4 + 0.5 * Math.sin(t * 4 + u.team) + (u.aggro ? 1.2 : 0) + 1.6 * fl, u.team ? P.crim : P.teal, 0.7 * dim + (u.aggro ? 0.3 : 0) + 0.6 * fl);
    if (fl > 0) { disc(ox + 3, oy + 1.5, 1.2, P.white, fl); bloom(ox + 3, oy + 1.5, 2, P.white, 0.6 * fl); }
    rect(ox - 2, oy - 4, 11, 4, P.out, 0.85); rect(ox - 1, oy - 3, 9, 2, P.hpBg); rect(ox - 1, oy - 3, Math.round((9 * u.hp) / u.max), 2, P.hp[u.team], dim);
  }
  /** A lightning bolt from (x0, y0) to (x1, y1): a joint every 2.5 px or so, mostly zigzagging from side to side of the
   *  straight line (1 to 3.5 px off it, less near the ends), its shape fixed by `seed`. Pass 0 paints its electric-blue
   *  edge (the 4 neighbours of the core, painted, not added: it never blows out to a white band, and it stands apart from
   *  his teal creeps); pass 1 its 1 px core, white while it flares (a spur forking off a joint), pale blue as it fades. */
  const ZJ = [], N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  function zig(x0, y0, x1, y1, seed, pass, flare) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.max(1, Math.hypot(dx, dy)), ux = dx / L, uy = dy / L, n = Math.max(3, Math.round(L / 2.5));
    ZJ.length = 0; ZJ.push(x0, y0);
    let s = hsh(seed, 0, 5) < 0.5 ? 1 : -1;
    for (let j = 1; j < n; j++) {
      const off = s * (1 + 2.5 * hsh(seed, j, 5)) * Math.min(1, j / 1.5, (n - j) / 1.5);
      ZJ.push(x0 + (dx * j) / n - uy * off, y0 + (dy * j) / n + ux * off);
      if (hsh(seed, j, 6) < 0.8) s = -s;
    }
    ZJ.push(x1, y1);
    for (let j = 0; j + 3 < ZJ.length; j += 2) {
      if (pass === 0) for (const [ox, oy] of N4) line(ZJ[j] + ox, ZJ[j + 1] + oy, ZJ[j + 2] + ox, ZJ[j + 3] + oy, P.arc, flare ? 0.6 : 0.4);
      else line(ZJ[j], ZJ[j + 1], ZJ[j + 2], ZJ[j + 3], flare ? P.white : P.arcL);
    }
    if (pass && flare && n > 3) {
      const j = 1 + Math.floor(hsh(seed, 9, 5) * (n - 2)), jx = ZJ[j * 2], jy = ZJ[j * 2 + 1], sd = hsh(seed, 10, 5) < 0.5 ? 1 : -1;
      const ex = jx + ux * 2 - uy * sd * 2.5, ey = jy + uy * 2 + ux * sd * 2.5;
      line(jx, jy, ex, ey, P.arcL); px(ex + ux * 1.5 + uy * sd, ey + uy * 1.5 - ux * sd, P.arc, 0.8);
    }
  }
  function drawEfx(f, t) {
    const k = f.age / (f.dur ?? 0.5);
    switch (f.kind) {
      case 'bolt': {
        if (f.big) { line(f.x - f.vx * 4, f.y - f.vy * 4, f.x, f.y, f.c, 0.7, true); bloom(f.x, f.y, 2.8, P.zap, 1); px(f.x, f.y, P.white); }
        else { px(f.x - f.vx, f.y - f.vy, f.c, 0.5); px(f.x, f.y, f.c); }
        break;
      }
      case 'arrow': line(f.x - f.vx * 4, f.y - f.vy * 4, f.x - f.vx, f.y - f.vy, P.bone, 0.95); px(f.x, f.y, P.white); break;
      case 'shot': line(f.x - f.vx * 5, f.y - f.vy * 5, f.x, f.y, f.c2, 0.6, true); bloom(f.x, f.y, 3, f.c2, 1); disc(f.x, f.y, 1, f.c); break;
      case 'fire': {
        // the trail: older is smaller, redder, then smoke; the ball: a white-hot core in a yellow and orange blaze
        f.trail.forEach(([x, y], i) => { const q = i / 16; rampC(FIRE_R, 0.25 + q * 0.75, _c2); disc(x, y, 2.5 * (1 - q) + 0.4, _c2, 0.9 * (1 - q * 0.55), i < 6); });
        bloom(f.x, f.y, 6, P.fire, 1); disc(f.x, f.y, 2.4, P.fireY); disc(f.x, f.y, 1.2, P.white);
        break;
      }
      case 'burst': {
        if (f.age < 0.08) disc(f.x, f.y, f.huge ? 13 : f.big ? 5 : 2.2, P.white, 1);
        const r = 1 + f.r1 * outQ(k);
        rampC(f.huge ? [P.white, P.fireY, P.fire, P.ember, P.smoke] : [P.fireY, f.c, P.ember, P.smoke], k, _c2);
        if (f.big || f.huge) disc(f.x, f.y, r * 0.85, _c2, 0.5 * (1 - k), true);
        ring(f.x, f.y, r, f.huge ? 3.6 : 2, _c2, 1 - k * k, true);
        break;
      }
      case 'chain': {
        // each jump a thin zigzag bolt (zig), re-jagged every other frame: it flares as it lands (white, a spur forking
        // off, a small flash on the target), then flickers out paler. The jumps land HOP apart, so the arc is seen
        // hopping from one target to the next. All the edges first, then the cores, so no bolt's edge covers another's core
        const fr = (t * 15) | 0;
        for (let pass = 0; pass < 2; pass++) for (let i = 1; i < f.hit; i++) {
          const age = f.age - (i - 1) * HOP;
          if (age > ARC || (age > 0.15 && Math.floor(age * 30) % 2)) continue;
          const [x0, y0] = f.pos[i - 1], [x1, y1] = f.pos[i];
          zig(x0, y0, x1, y1, fr * 31 + i, pass, age < 0.15);
          if (pass && age < 0.1) { bloom(x1, y1, 2.5, P.arc, 0.8); px(x1, y1, P.white); }
        }
        if (f.age < 0.1) bloom(f.pos[0][0], f.pos[0][1], 2.5, P.arc, 0.8);
        break;
      }
      case 'blink': {
        // gone in a violet puff (a flash, a ring, sparks flung out), a dotted streak to where he lands, a second puff
        // there. The rings are painted, not added, so they stay violet over the grass
        const e = clamp(f.age / 0.42, 0, 1), y0 = f.y0 - 5, y1 = f.y1 - 5;
        if (f.age < 0.2) bloom(f.x0, y0, 10, P.violet, 1.4 * (1 - f.age / 0.2));
        ring(f.x0, y0, 1.5 + 7 * outQ(e), 1.8, P.violet, 1 - e * e);
        for (let i = 0; i < 10; i++) { const an = (i / 10) * 6.283 + 0.3, rr = 2 + 10 * outQ(e); px(f.x0 + Math.cos(an) * rr, y0 + Math.sin(an) * rr * 0.8, i % 2 ? P.white : P.violet, 1 - e); }
        if (f.age < 0.18) line(f.x0, y0, f.x1, y1, P.violet, 0.9, false, 3, (f.age * 40) | 0);
        if (f.age < 0.06) disc(f.x0, y0, 2.4, P.white);
        const g = clamp((f.age - 0.05) / 0.37, 0, 1);
        if (f.age > 0.05) { ring(f.x1, y1, 1.5 + 5.5 * outQ(g), 1.6, P.violet, 1 - g * g); if (f.age < 0.22) bloom(f.x1, y1, 8, P.violet, 1.1); }
        break;
      }
      case 'nova': {
        const e = clamp(f.age / f.dur, 0, 1), r = 2 + (f.r1 - 2) * outQ(e), a = 1 - e * e;
        disc(f.x, f.y, r, P.nova, 0.2 * a, true);
        ring(f.x, f.y, r, 2.8, P.nova, a, true); ring(f.x, f.y, r - 0.5, 1, P.novaL, a, true);
        for (let i = 0; i < 12; i++) { const an = (i / 12) * 6.283 + f.age * 5; px(f.x + Math.cos(an) * (r + 1.5), f.y + Math.sin(an) * (r + 1.5), P.white, a); }
        if (f.age < 0.08) { disc(f.x, f.y, 4, P.white); bloom(f.x, f.y, 9, P.nova, 1); }
        break;
      }
      case 'hook': {
        // the chain: bright links over a dark shadow line (it reads over grass and water); the hook's barb at its head
        const b = f.src, [hx, hy] = at(b, 9, 3), n = Math.max(1, Math.ceil(Math.hypot(f.x - hx, f.y - hy)));
        line(hx + 1, hy + 1, f.x + 1, f.y + 1, P.out, 0.8);
        for (let i = 0; i <= n; i++) px(lerp(hx, f.x, i / n), lerp(hy, f.y, i / n), i % 2 ? P.steelD : P.steel);
        disc(f.x, f.y, 1.6, P.steel); px(f.x + f.dx * 2, f.y + f.dy * 2 - 1, P.white); px(f.x - f.dy * 2, f.y + f.dx * 2, P.steel); px(f.x - f.dy * 2 - f.dx, f.y + f.dx * 2 - f.dy, P.steel);
        break;
      }
      case 'slash': {
        for (let i = 0; i < 7; i++) { const an = -1.3 + i * 0.42; lit(f.x + f.face * Math.cos(an) * 4, f.y + Math.sin(an) * 4, i < 4 ? P.white : f.c, 1 - k); lit(f.x + f.face * Math.cos(an) * 3, f.y + Math.sin(an) * 3, f.c, 0.6 * (1 - k)); }
        break;
      }
      case 'poof': ring(f.x, f.y, 1 + 5 * outQ(k), 1.4, f.c, 1 - k, true); if (f.age < 0.08) { disc(f.x, f.y, 3, P.white, 0.9); bloom(f.x, f.y, 6, f.c, 1); } break;
      case 'shock': { const e = clamp(f.age / 0.5, 0, 1); ring(f.x, f.y, 1 + f.r1 * outQ(e), 2, f.c, 1 - e, true, 0.6); break; }
      case 'stars': {                                                         // stunned: three little stars circling over his health bar
        const u = sim.hero, h = HERO_ART.mage[0].h;
        for (let i = 0; i < 3; i++) {
          const an = t * 7 + (i / 3) * 6.283, x = u.x + Math.cos(an) * 4.5, y = u.y - h - 6 + Math.sin(an) * 1.3;
          for (const [ox, oy] of N4) px(x + ox, y + oy, P.fireY); px(x, y, P.white);
        }
        break;
      }
      case 'mark': { const d = 3.5 - 3.5 * outQ(k); for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) px(f.x + sx * (d + 0.6), f.y + sy * (d * 0.6 + 0.6), f.c, 1 - k * 0.6); break; }
      case 'ping': {
        const u = sim.hero;
        if (Math.floor(f.age * 8) % 2 === 0 || f.age > 0.6) text('!', u.x - 1, u.y - 21, P.red, 1, P.black, f.age > 0.6 ? 1 - (f.age - 0.6) / 0.3 : 1);
        ring(u.x, u.y - 5, 2 + 9 * outQ(f.age / 0.5), 1.4, P.red, Math.max(0, 1 - f.age / 0.5), true);
        break;
      }
      case 'aggro': {
        // the tower locked on to him: a solid red beam from its crystal to his chest over a dark shadow line, pulsing,
        // sparks running down it to him; four red brackets snapping in round him
        const s = f.src, h = f.tg; if (!h.alive) break;
        const x0 = s.x, y0 = s.y - 10.5, x1 = h.x, y1 = h.y - 5, pul = 0.5 + 0.5 * Math.sin(t * 16), n = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
        line(x0 + 1, y0 + 1, x1 + 1, y1 + 1, P.out, 0.45);
        line(x0, y0, x1, y1, P.red, 0.7 + 0.3 * pul);
        for (let i = 0; i <= n; i++) if ((i - Math.floor(t * 30)) % 5 === 0) px(lerp(x0, x1, i / n), lerp(y0, y1, i / n), P.crimL);
        const e = outQ(f.age / 0.25), rx = 6 + 6 * (1 - e), ry = 7 + 6 * (1 - e), cy = h.y - 5.5, a = 0.75 + 0.25 * pul;
        for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          const bx = h.x + sx * rx, by = cy + sy * ry;
          px(bx, by, P.red, a); px(bx - sx, by, P.red, a); px(bx - 2 * sx, by, P.red, a); px(bx, by - sy, P.red, a); px(bx, by - 2 * sy, P.red, a);
        }
        break;
      }
      case 'tshot': {                                                         // a fat crimson orb, a fading tail
        const h = sim.hero, e = clamp(f.age / f.dur, 0, 1);
        for (let i = 3; i >= 1; i--) { const q = Math.max(0, e - i * 0.12); disc(lerp(f.x0, h.x, q), lerp(f.y0, h.y - 5, q), 1.7 - i * 0.35, P.crim, 0.8 - i * 0.2, true); }
        bloom(f.x, f.y, 4, P.crim, 1.1); disc(f.x, f.y, 1.5, P.crimL); px(f.x, f.y, P.white);
        break;
      }
      case 'warn': {
        const left = f.t1 - sim.t, e = 1 - clamp(left / 1.1, 0, 1), pul = 0.5 + 0.5 * Math.sin(t * (10 + 18 * e));
        disc(f.x, f.y, f.r, P.red, (0.1 + 0.14 * e) * (0.6 + 0.4 * pul), true);
        ring(f.x, f.y, f.r, 1.4, P.red, 0.6 + 0.4 * pul);
        for (let i = 0; i < 16; i++) { const an = (i / 16) * 6.283 - t * 1.5; px(f.x + Math.cos(an) * (f.r - 2.5), f.y + Math.sin(an) * (f.r - 2.5), P.crimL, 0.6 * pul); }
        line(f.x - 3, f.y, f.x + 3, f.y, P.red, 0.8); line(f.x, f.y - 3, f.x, f.y + 3, P.red, 0.8);
        break;
      }
      case 'meteor': {
        const k2 = meteorK(f); if (k2 <= 0) break;
        const [mx, my] = meteorAt(f, k2), [tx, ty] = meteorAt(f, Math.max(0, k2 - 0.3));
        const n = Math.ceil(Math.hypot(mx - tx, my - ty));
        for (let i = 0; i <= n; i++) { const q = i / Math.max(1, n); rampC(FIRE_R, 0.15 + 0.8 * q, _c2); disc(lerp(mx, tx, q), lerp(my, ty, q), 3.4 * (1 - q) + 0.5, _c2, 0.9 * (1 - q * 0.5), q < 0.5); }
        bloom(mx, my, 8, P.fire, 1); disc(mx, my, 3.4, C(0x5a2010)); disc(mx - 0.8, my - 0.8, 1.8, P.fireY); px(mx - 1, my - 1, P.white);
        break;
      }
      case 'ghost': { const e = clamp(f.age / 1.4, 0, 1); bloom(f.x, f.y - 10 * e, 3, P.tealL, (1 - e) * 0.8); break; }
    }
  }
  /** One frame of round `sim.ri` at the sim's time. opts.respawn: seconds to his respawn (the counter). */
  function render(opts = {}) {
    const t = sim.t, h = sim.hero;
    // the camera, whole pixels (the art never swims); impacts shake it
    let cx = Math.round(sim.cx), cy = Math.round(sim.cy);
    if (sim.shake > 0) {
      const a = Math.min(2, sim.shake * 6);
      cx = clamp(cx + Math.round((hsh((t * 60) | 0, 1, 6) - 0.5) * 2 * a), 0, WW - SW); cy = clamp(cy + Math.round((hsh((t * 60) | 0, 2, 6) - 0.5) * 2 * a), 0, WH - FH);
    }
    clipH = FH; OX = cx; OY = cy;
    for (let y = 0; y < FH; y++) FB.set(MAP.subarray(((y + cy) * WW + cx) * 3, ((y + cy) * WW + cx + SW) * 3), y * SW * 3);
    // the river's glints drift downstream; the bases' crystals pulse
    for (let i = 0; i < 30; i++) {
      const along = (((i * 0.137 + t * 0.045) % 1) - 0.5) * 130, off = (hsh(i, 1, 9) - 0.5) * 4;
      const x = LM[0] + LP[0] * along + LU[0] * off, y = LM[1] + LP[1] * along + LU[1] * off;
      if (Math.abs(laneD(x, y)) > 3.8) { px(x, y, RIPPLE, 0.6); px(x + LP[0], y + LP[1], RIPPLE, 0.3); }
    }
    for (const [ax, ay, c, cl] of [[ANC0[0], ANC0[1], P.teal, P.tealL], [ANC1[0], ANC1[1], P.crim, P.crimL]]) {
      bloom(ax, ay - 1, 6 + 0.8 * Math.sin(t * 3), c, 0.7);
      rect(ax - 1, ay - 4, 3, 7, c); rect(ax, ay - 6, 1, 10, c); px(ax, ay - 3, cl); px(ax - 1, ay - 2, P.white);
    }
    for (const d of sim.decals) {
      const e = d.age / d.life;
      if (d.kind === 'scorch') disc(d.x, d.y, d.r, P.black, 0.45 * (1 - e));
      else { disc(d.x, d.y, d.r, C(0x161210), 0.85); ring(d.x, d.y, d.r, 1.4, C(0x4a3424), 0.8); for (let i = 0; i < 12; i++) if (hsh(i, (t * 6) | 0, 4) < 0.6) px(d.x + (hsh(i, 2, 4) - 0.5) * d.r * 1.4, d.y + (hsh(i, 3, 4) - 0.5) * d.r * 1.2, P.fire, clamp(1.5 - d.age * 0.5, 0, 1)); }
    }
    // the fog of war: a cold veil over what his side can't see
    seers();
    for (let y = 0; y < FH; y++) for (let x = 0; x < SW; x++) {
      const v = visAt(x + cx, y + cy); if (v >= 1) continue;
      const i = (y * SW + x) * 3, m = 0.5 + 0.5 * v, f = (1 - v) * 0.5;
      FB[i] = FB[i] * m + FOG[0] * f; FB[i + 1] = FB[i + 1] * m + FOG[1] * f; FB[i + 2] = FB[i + 2] * m + FOG[2] * f;
    }
    // on the ground: the meteor's warning, the click marks, the rings at the heroes' feet
    for (const f of sim.fx) if (f.kind === 'warn' || f.kind === 'mark') drawEfx(f, t);
    for (const u of sim.units) drawFeet(u, t);
    // the units, back to front; his hero (or his body) over the rest: in a scrum it's him we follow
    const list = sim.units.slice().sort((a, b) => (a === h) - (b === h) || a.y - b.y);
    for (const u of list) { if (u.kind === 'tower') drawTower(u, t); else if (u.kind === 'creep') drawCreep(u, t); else drawHero(u, t); }
    for (const f of sim.fx) if (f.kind !== 'warn' && f.kind !== 'mark') drawEfx(f, t);
    for (const p of sim.parts) { const e = p.age / p.life; mixC(p.c0, p.c1, e, _c2); (p.add ? lit : px)(p.x, p.y, _c2, p.add ? 1 - e : 1 - e * e); }
    for (const f of sim.floats) text(f.str, f.x, f.y - f.age * 9, f.c, 1, P.black, f.age > 0.45 ? 1 - (f.age - 0.45) / 0.25 : 1);
    // the screen from here on: low health pulses red round the field's edges; the moment he dies the whole field flashes
    // red (then it greys, below); the meteor whites it out
    OX = OY = 0;
    const low = h.alive ? clamp((0.4 - h.hp / 100) / 0.3, 0, 1) : 0;
    if (low > 0) {
      const pul = (0.55 + 0.45 * Math.sin(t * 11)) * low;
      for (let y = 0; y < FH; y++) for (let x = 0; x < SW; x++) { const e = 1 - Math.min(x, y, SW - 1 - x, FH - 1 - y) / 8; if (e > 0) px(x, y, P.red, e * e * 0.6 * pul); }
    }
    const hit = sim.death >= 0 ? 1 - (t - sim.death) / 0.25 : 0;
    if (hit > 0) for (let i = 0; i < SW * FH * 3; i += 3) { FB[i] += (255 - FB[i]) * 0.55 * hit; FB[i + 1] *= 1 - 0.45 * hit; FB[i + 2] *= 1 - 0.45 * hit; }
    if (sim.flash > 0) for (let i = 0; i < SW * FH * 3; i++) FB[i] += (300 - FB[i]) * sim.flash;
    // the HUD: his portrait, the four spells (each draining its cooldown, its seconds on it), health over mana
    clipH = SH;
    rect(0, FH, SW, SH - FH, P.hud); rect(0, FH, SW, 1, P.hudE); rect(0, SH - 1, SW, 1, P.hudD);
    rect(1, FH + 1, 9, 9, P.hudE); rect(2, FH + 2, 7, 7, C(0x1a2846));
    drawSprite(ICON.mage, 2, FH + 2, { tl: true, outline: false, flash: t - (h.hitT ?? -9) < 0.12 ? 0.6 : 0 });
    for (let k = 0; k < 4; k++) {
      const x = 13 + k * 9, y = FH + 2, left = sim.cast[k] + CD[k] - t;
      rect(x - 1, y - 1, 9, 9, k === 3 ? P.goldD : P.hudE); rect(x, y, 7, 7, ABIL_BG[k]);
      drawSprite(ABIL[k], x, y, { tl: true, outline: false });
      if (left > 0) {
        rect(x, y, 7, Math.ceil((7 * left) / CD[k]), P.black, 0.66);
        text(String(Math.ceil(left)), x + 2, y + 1, P.white, 1, null, 0.95);
      }
      if (t - sim.cast[k] < 0.18) rect(x - 1, y - 1, 9, 9, P.white, 0.8 * (1 - (t - sim.cast[k]) / 0.18));
    }
    const hp = clamp(h.hp / 100, 0, 1), bx = 50, bw = 28;
    rect(bx - 1, FH + 2, bw + 2, 5, P.hudD); rect(bx, FH + 3, bw, 3, P.hpBg);
    rect(bx, FH + 3, Math.round(bw * sim.hpTrail), 3, C(0xf6e6a8)); rect(bx, FH + 3, Math.round(bw * hp), 3, P.hp[0]);
    for (let i = 1; i < 4; i++) rect(bx + i * 7, FH + 3, 1, 3, P.black, 0.35);
    rect(bx, FH + 7, bw, 2, P.manaBg); rect(bx, FH + 7, Math.round(bw * sim.mana), 2, P.mana);
    // the minimap: the side lanes round a square, this lane across it, the river, the bases, the towers, the heroes,
    // the camera's box
    const MM = 15, mm = (x, y) => [1 + (x / WW) * 13, 1 + (y / WH) * 13];
    rect(0, 0, MM, MM, C(0x173a1c)); rect(MM, 0, 1, MM + 1, P.hudE); rect(0, MM, MM + 1, 1, P.hudE);
    const ML = C(0x8e7650);
    for (let i = 2; i <= 12; i++) { px(2, i, ML); px(i, 2, ML); px(12, i, ML); px(i, 12, ML); }
    for (let i = 0; i <= 12; i++) { const [x, y] = mm(...lane(-0.2 + i * 0.12)); px(x, y, ML); }
    for (let i = 0; i <= 12; i++) { const [x, y] = mm(LM[0] + LP[0] * (i - 6) * 10, LM[1] + LP[1] * (i - 6) * 10); if (i !== 6) px(x, y, C(0x3a86c8)); }
    rect(1, 11, 3, 3, P.teal); rect(11, 1, 3, 3, P.crim);
    for (const [x, y, c] of [[...mm(...T1), P.teal], [2, 7, P.teal], [7, 12, P.teal], [...mm(...T2), P.crim], [7, 2, P.crim], [12, 7, P.crim]]) px(x, y, c);
    for (const u of sim.units) if (u.alive && u.kind === 'hero' && u.team === 1 && u.vis > 0.5 && !u.invis) px(...mm(u.x, u.y), P.red);
    px(...mm(h.x, h.y), Math.floor(t * 4) % 2 ? P.white : P.sel);
    { const [x0, y0] = mm(cx, cy), [x1, y1] = mm(cx + SW, cy + FH); for (let x = Math.round(x0); x <= Math.round(x1); x++) { px(x, y0, P.white, 0.45); px(x, y1, P.white, 0.45); } for (let y = Math.round(y0) + 1; y < Math.round(y1); y++) { px(x0, y, P.white, 0.45); px(x1, y, P.white, 0.45); } }
    // dead: the picture goes grey (his cursor stays gold); the respawn counter over it; the kill feed
    const [mx, my] = cursorAt(sim.ri, t);
    if (sim.death >= 0) {
      const g = smooth(0, 0.45, t - sim.death);
      for (let i = 0; i < SW * SH * 3; i += 3) { const l = 0.3 * FB[i] + 0.59 * FB[i + 1] + 0.11 * FB[i + 2]; FB[i] += (l * 0.74 - FB[i]) * g; FB[i + 1] += (l * 0.74 - FB[i + 1]) * g; FB[i + 2] += (l * 0.8 - FB[i + 2]) * g; }
      drawSprite(CURSOR, mx, my, { tl: true });
      const k = t - sim.death - 0.3;
      if (k > 0) {
        const n = String(Math.max(1, Math.ceil(opts.respawn ?? 9 - (t - sim.death))));
        disc(SW / 2, 29, 16, P.black, 0.5 * clamp(k * 4, 0, 1));
        text('RESPAWN', SW / 2 - textW('RESPAWN') / 2, 15, C(0xd8d8d8), 1, P.black);
        text(n, SW / 2 - textW(n, 4) / 2, 23 + pop(k), P.white, 4, P.black);
      }
      const e = outQ((t - sim.death - 0.5) / 0.22);
      if (e > 0) {
        const ks = sim.killers, w = ks.length * 9 + 19, x0 = Math.round(SW / 2 + 6 - w / 2 + (1 - e) * 40);
        rect(x0 - 2, 1, w + 3, 10, P.black, 0.75);
        ks.forEach((u, i) => drawSprite(u.kind === 'tower' ? ICON.tower : ICON[u.id], x0 + i * 9, 2, { tl: true, outline: false }));
        const sx = x0 + ks.length * 9;                                       // a red blade: killed
        for (let i = 0; i < 6; i++) px(sx + i, 8 - i, i < 2 ? C(0xffd0c0) : P.red);
        px(sx, 5, P.red); px(sx + 1, 6, P.red); px(sx + 2, 7, P.red); px(sx + 3, 8, P.red);
        drawSprite(ICON.mage, sx + 9, 2, { tl: true, outline: false, dim: 0.75 });
      }
    }
    // his cursor: a little gold arrow, where he last clicked (or on its way to the next click)
    if (sim.death < 0) drawSprite(CURSOR, mx, my, { tl: true });
    if (opts.fade > 0) for (let i = 0; i < FB.length; i++) FB[i] += (255 - FB[i]) * opts.fade;   // respawned: a flash
  }

  // the cursor's path, on the screen: it travels to each click a moment before it lands, and rests there. Each round's
  // clicks (TRACK) come from running it once, the first time they're needed (not all three in create: a page-load cost).
  // That run leaves the sim where a drawn run would be at that time (drawing never changes the sim), so a draw can carry on
  const TRACK = [];
  function track(ri) {
    if (!TRACK[ri]) { reset(ri); while (sim.t < FAILS[ri] + 0.5) stepSim(H); TRACK[ri] = sim.rec.slice(); }
    return TRACK[ri];
  }
  function cursorAt(ri, u) {
    const tr = track(ri); if (!tr.length) return [44, 30];
    let i = 0; while (i < tr.length && tr[i].t <= u) i++;
    const prev = tr[i - 1] ?? { t: -9, x: 38, y: 36 }, next = tr[i];
    if (!next) return [prev.x, prev.y];
    const lead = Math.min(0.26, (next.t - prev.t) * 0.7), e = smooth(next.t - lead, next.t, u);
    return [lerp(prev.x, next.x, e), lerp(prev.y, next.y, e)];
  }
  for (let ri = 0; ri < SCRIPTS.length; ri++) ROUNDS.push({ ri, fail: FAILS[ri], draw: (u, opts) => drawRound(ri, u, opts) });
  function drawRound(ri, u, opts) {
    track(ri);                                                                 // first, so it never resets the round mid-draw
    if (sim.ri !== ri || u < sim.t - H * 1.5) reset(ri);
    while (sim.t < u - 1e-6) stepSim(H);
    render(opts);
    present();
  }

  // ---- onto the CRT: each game pixel 3 x 3 (a phosphor triad across, a dark scanline under), a glow round anything
  // bright, the corners darkened and rounded. The picture's average colour lights the room.
  const CW = SW * SX, CH = SH * SX, VIG = new Float32Array(CW * CH);
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
    const u = (x + 0.5) / CW * 2 - 1, v = (y + 0.5) / CH * 2 - 1;
    const cx = Math.max(0, Math.abs(u) - 0.86) / 0.14, cy = Math.max(0, Math.abs(v) - 0.82) / 0.18;   // rounded corners
    VIG[y * CW + x] = (1 - 0.26 * (u * u * 0.6 + v * v * 0.8)) * (Math.hypot(cx, cy) > 1 ? 0 : 1 - 0.5 * smooth(0.6, 1, Math.hypot(cx, cy))) * (y % SX === SX - 1 ? 0.66 : y % SX === 0 ? 1.05 : 1);
  }
  const TRIAD = [[1.06, 0.93, 0.93], [0.93, 1.06, 0.93], [0.93, 0.93, 1.06]];
  function present() {
    // the glow: what's brighter than a bright pixel, blurred out a pixel or two, added back
    for (let i = 0; i < FB.length; i++) BL[i] = Math.max(0, FB[i] - 170);
    for (let pass = 0; pass < 2; pass++) {
      for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) for (let c = 0; c < 3; c++) { const i = (y * SW + x) * 3 + c; BT[i] = (BL[i] * 2 + (x > 0 ? BL[i - 3] : 0) + (x < SW - 1 ? BL[i + 3] : 0)) / 4; }
      for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) for (let c = 0; c < 3; c++) { const i = (y * SW + x) * 3 + c; BL[i] = (BT[i] * 2 + (y > 0 ? BT[i - SW * 3] : 0) + (y < SH - 1 ? BT[i + SW * 3] : 0)) / 4; }
    }
    const d = scrImg.data;
    let sr = 0, sgn = 0, sb = 0;
    for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
      const i = (y * SW + x) * 3, r = FB[i] + BL[i] * 1.6, g = FB[i + 1] + BL[i + 1] * 1.6, b = FB[i + 2] + BL[i + 2] * 1.6;
      sr += r; sgn += g; sb += b;
      for (let j = 0; j < SX; j++) for (let k = 0; k < SX; k++) {
        const o = (y * SX + j) * CW + x * SX + k, m = VIG[o], tr = TRIAD[k], q = o * 4;
        d[q] = r * m * tr[0]; d[q + 1] = g * m * tr[1]; d[q + 2] = b * m * tr[2]; d[q + 3] = 255;
      }
    }
    sg.putImageData(scrImg, 0, 0);
    const n = SW * SH * 255, mx = Math.max(sr, sgn, sb, 1);
    glow.tc.setRGB(sr / mx, sgn / mx, sb / mx);
    glow.ti = clamp(0.45 + 2.2 * ((0.3 * sr + 0.59 * sgn + 0.11 * sb) / n), 0.45, 2.2);
  }

  /** The CRT coming on: a bright line that opens into the picture. */
  function drawBoot(k, g, pre) {
    if (k < 1) {
      FB.fill(5);
      const hh = Math.max(1, Math.round(SH * smooth(0.35, 1, k))), ww = Math.round(SW * smooth(0, 0.35, k));
      clipH = SH; rect((SW - ww) / 2, (SH - hh) / 2, ww, hh, k > 0.8 ? C(0xcfd8d2) : P.white);
      present(); glow.tc.set(0xdfe8ff); glow.ti = 0.4 + k;
    } else g.draw(pre);
  }
  /** Smash the picture: the last frame, burnt and darkened, cracks from the punch, a black hole with a glinting rim. */
  function drawDead(px0, py0) {
    const r2 = rng(Math.floor(px0 * 31 + py0 * 17)), K = (SW * SX) / 96;
    deadCanvas.forEach((c, v) => {
      const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
      g.drawImage(scrCanvas, 0, 0);
      g.fillStyle = v ? 'rgba(10,30,24,0.45)' : 'rgba(8,8,8,0.82)'; g.fillRect(0, 0, c.width, c.height);
      if (v) for (let y = 0; y < c.height; y += 6 * K) g.drawImage(scrCanvas, 0, y, c.width, 3 * K, (((y / K) * 13) % 11 - 5) * K, y, c.width, 3 * K);   // a torn sputter
      g.strokeStyle = v ? 'rgba(235,255,245,0.9)' : 'rgba(210,214,212,0.85)'; g.lineWidth = K;
      for (let i = 0; i < 11; i++) {
        let a = (i / 11) * Math.PI * 2 + r2() * 0.4, x = px0, y = py0;
        g.beginPath(); g.moveTo(x, y);
        const L = (14 + r2() * 46) * K;
        for (let s = 0; s < L; s += 5 * K) { a += (r2() - 0.5) * 0.7; x += Math.cos(a) * 5 * K; y += Math.sin(a) * 5 * K; g.lineTo(Math.round(x) + 0.5, Math.round(y) + 0.5); }
        g.stroke();
      }
      g.beginPath();
      for (let i = 0; i < 4; i++) {                                           // a broken ring
        const a0 = r2() * 6.3, rr = (8 + r2() * 6) * K;
        g.moveTo(px0 + Math.cos(a0) * rr, py0 + Math.sin(a0) * rr); g.arc(px0, py0, rr, a0, a0 + 0.6 + r2());
      }
      g.stroke();
      g.fillStyle = '#020202'; g.beginPath();
      for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2, rr = (5 + r2() * 5) * K; g[i ? 'lineTo' : 'moveTo'](px0 + Math.cos(a) * rr, py0 + Math.sin(a) * rr * 0.9); }
      g.closePath(); g.fill();
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
  // The loop: cycles alternate rage A (punch the CRT) and rage B (spike the Game Boy), the rounds (his three deaths)
  // rotate under them.
  const SEQ = {
    A: [['play', 0], ['stare', 0.85], ['windup', 0.5], ['punch', 0.1], ['blown', 0.6], ['after', 2.3], ['reset', 1.6], ['resume', 0.45]],
    B: [['play', 0], ['recoil', 0.45], ['grab', 0.75], ['gbplay', 1.7], ['stare', 0.5], ['windup', 0.6], ['throw', 0.6], ['flinch', 0.5], ['after', 2.0], ['reset', 1.4], ['resume', 0.45]],
  };
  const PLAYING = new Set(['play', 'recoil', 'grab', 'gbplay']);
  const cyc = { i: 0, kind: 'A', game: ROUNDS[0], ph: [], pi: 0, pu: 0, gu: 0, gbu: 0, rush: false };
  const cur = () => cyc.ph[cyc.pi];
  const phase = () => cyc.ph[cyc.pi].n;
  const gbFail = () => cyc.ph.find((p) => p.n === 'gbplay').d - 0.25;

  // the gamer's state: springs on every channel, so each move has weight, overshoot and settle
  const sp = {
    lean: spring(0.4, 60, 0.8), hunch: spring(0.5, 60, 0.8), twist: spring(0.05, 50, 0.8),
    yaw: spring(0, 60, 0.85), pitch: spring(0, 60, 0.85), roll: spring(0, 60, 0.8),
    recline: spring(0, 40, 0.5), swivel: spring(0, 30, 0.45), rollX: spring(0, 25, 0.9),
    jaw: spring(0.1, 120, 0.7), brow: spring(-0.35, 120, 0.7), lids: spring(0.3, 160, 0.8), grit: spring(0, 140, 0.75), soot: spring(0, 30, 1), rise: spring(0, 70, 0.7),
  };
  // each hand: where it is (x, y, z) and how far its fingers curl (c: 0 open, 0.5 a grip, 1 a fist)
  const hands = [-1, 1].map(() => ({ x: spring(0, 160, 0.75), y: spring(0, 160, 0.75), z: spring(0, 160, 0.75), c: spring(0.3, 260, 0.8) }));
  const setHand = (i, p) => { hands[i].x.to = p.x; hands[i].y.to = p.y; hands[i].z.to = p.z; };
  const handK = (i, k, z) => { for (const c of ['x', 'y', 'z']) hands[i][c].set(k, z); };
  const getHand = (i, out) => out.set(hands[i].x.x, hands[i].y.x, hands[i].z.x);
  const wob = { kb: spring(0, 500, 0.2), can: spring(0, 120, 0.12), mouse: spring(0, 600, 0.3) };
  const kbLocal = (i, out) => out.set(keyList[i].x, keyList[i].y + 0.012, keyList[i].z).applyMatrix4(keyboard.matrixWorld);
  keyboard.updateMatrixWorld(true);
  const KEY_HOME = new V(); kbLocal(QWER[1], KEY_HOME).lerp(kbLocal(QWER[2], _p), 0.5);   // over W and E
  const LH_HOME = KEY_HOME.clone().add(new V(-0.085, 0.01, 0.0));
  const RH_HOME = MOUSE0.clone().add(new V(-0.08, 0.046, -0.005));
  // rage B's marks: the spot on our side of the desk where the Game Boy goes off (in front of the monitor, clear of
  // his head), the fist cocked high in front of the chair, the follow-through
  const SPIKE = new V(0.93, DESK_Y + 0.035, 0.42);
  const WIND_B = new V(-0.1, 1.3, 0.28), THROW_FT = new V(0.5, 0.92, 0.42), T_FLY = 0.15;
  const SCREEN_W = new V(), SCREEN_N = new V(), SCREEN_X = new V(), EYE_W = new V(), MOUTH_W = new V();
  const gaze = new V();                                                      // what his eyes are on (world)
  const look = { w: spring(0, 14, 0.95), t: -1, cool: 0 };
  const mash = { t: 0, next: 0, key: QWER[1], lh: new V(), rate: 0, cast: -1 };
  const mouseAt = MOUSE0.clone(), mouseDir = { yaw: -0.1 };
  const gbs = { mode: 'desk', grab: 0, one: 0, wait: 0, pop: 1, p: GB_HOME.clone(), q: GB_HOME_Q.clone(), dropY: 0, dropV: 0, landT: -1, sq: spring(1, 500, 0.3), on: false, f0: new V(), q0: new Q(), ft: 0 };
  const fx = { boomT: -1, boomAt: new V(), boomPeak: 0, flashT: -1, flashAt: new V(), flashS: 0, sootT: -1, sootAt: new V(), sootN: 0, sootS: 0, sootDir: new V(), sootUp: false, plume: 0, plumeAt: new V(), plumeDark: 0, crackle: 0, sputter: 0, cough: -1, singe: 0 };
  let time = 0, tugOut = 0, clickQ = false;
  const tugAt = new V();
  const camShake = new V(), camShakeV = new V();

  function newCycle(i, rushed) {
    cyc.i = i; cyc.kind = i % 2 ? 'B' : 'A'; cyc.game = ROUNDS[i % ROUNDS.length];
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
    drawDead(clamp(cx, SW * SX * 0.23, SW * SX * 0.77), clamp(cy, SH * SX * 0.22, SH * SX * 0.78));
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
    fx.plume = 1; fx.plumeAt.copy(_p); fx.plumeDark = 1; fx.crackle = 0.5; fx.cough = 1.25; fx.singe = 1.6;
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

  // what his hands do while he plays, synced to the screen: the mouse follows his cursor there (pushed forward: up the
  // screen; to his right: right) and clicks when it clicks; each spell is its key (Q W E R) struck as it goes off; the
  // mashing and the lean build as the fight heats up; a start back when the gank steps out of the fog
  function activity(out) {
    const u = cyc.gu, g = cyc.game, tr = track(g.ri);
    out.mash = 0; out.mx = 0; out.mz = 0; out.click = false; out.lean = 0; out.cast = -1; out.castId = -1;
    if (u > g.fail) return out;
    const heat = smooth(1.2, g.fail - 0.9, u);
    out.mash = 0.2 + 0.75 * heat;
    out.lean = 0.03 + 0.14 * heat;
    const [cx, cy] = cursorAt(g.ri, u);
    out.mz = ((cx - SW / 2) / (SW / 2)) * 0.03; out.mx = -((cy - FH / 2) / (FH / 2)) * 0.022;
    for (let i = 0; i < tr.length; i++) {
      const v = u - tr[i].t;
      if (v < -0.06) break;
      if (v >= 0 && v < 0.09) out.click = true;
      if (tr[i].key >= 0 && v < 0.14) { out.cast = tr[i].key; out.castId = i; }
    }
    if (g.ri === 0) out.lean -= 0.1 * Math.sin(Math.PI * clamp((u - 4.1) / 0.45, 0, 1));
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
    EYE_W.set(EYE[0], EYE[1], 0); head.localToWorld(EYE_W);
    MOUTH_W.set(0.1, MOUTH_Y - 0.0075, 0); head.localToWorld(MOUTH_W);
    const toScreen = aim(SCREEN_W), toYou = aim(camera.position);
    const tense = n === 'play' ? smooth(0.5, cyc.game.fail, cyc.gu) : 1;
    let yaw = toScreen.yaw, pitch = toScreen.pitch + 0.03 * Math.sin(time * 2 * Math.PI * 1.9) * (1 - tense * 0.7);
    let lean = 0.14 + act.lean + 0.03 * Math.sin(time * 0.6), hunch = 0.42 + 0.06 * tense, twist = 0.05;
    // the face: mouth a little open while he plays, brows knitting and eyes narrowing as it goes wrong, then the jaw clenches
    let recline = 0, swivel = 0.025 * Math.sin(time * 0.37), rollX = 0, jawT = 0.04 + 0.07 * act.mash, browT = lerp(-0.3, -0.85, tense), lidsT = lerp(0.3, 0.14, tense), rollH = 0;
    let gritT = 0.5 * smooth(0.6, 1, tense);
    let cL = 0.34, cR = 0.4;                                                   // fingers: on the keys, round the mouse
    gaze.copy(SCREEN_W);
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
      // A: the game burns him. Freeze. Lean in. Teeth clenched. The mouse hand comes off, balls into a fist, trembles. An
      // eye twitch.
      mashOn = 0; onMouse = k < 0.12 ? 1 : 0;
      const c = smooth(0.05, 0.35, k);
      lean += 0.06 * smooth(0, 0.6, k); lidsT = pu > pd * 0.6 && pu < pd * 0.6 + 0.08 ? 0.6 : 0.05; browT = -1.1; jawT = 0.0; gritT = 1;
      rh.lerp(_t.set(0.22, 0.86, 0.33), c);                 // the fist comes up off the mouse, coiled
      rh.y += 0.004 * Math.sin(pu * 70) * c; rh.z += 0.003 * Math.sin(pu * 53) * c;
      pitch += 0.02 * Math.sin(pu * 40) * smooth(0.3, 0.6, k);
      cR = lerp(0.4, 1, smooth(0.05, 0.25, k)); cL = 0.55;
      kR = 300; zR = 0.7;
    } else if (n === 'stare') {
      // B: the Game Boy too. Freeze, staring into it, squeezing it, teeth clenched.
      mashOn = 0; onMouse = 0; gbHold = true; gbs.on = true;
      holdHands(inChair(_t, HOLD[0], HOLD[1], HOLD[2]));
      swivel = TURN; twist = -0.05; lean = 0.08; hunch = 0.42;
      const a = aim(gbs.p); yaw = a.yaw; pitch = a.pitch * 0.7 + 0.02 * Math.sin(pu * 40) * smooth(0.3, 0.6, k);
      lidsT = pu > pd * 0.5 && pu < pd * 0.5 + 0.08 ? 0.6 : 0; browT = -1.1; jawT = 0; gritT = 1;
      cL = cR = 0.62; gaze.copy(gbs.p);
      kL = kR = 300;
    } else if (n === 'windup' && !isB) {
      // A: rears back, the right fist cocked by his ear, the left hand gripping the desk edge; a silent yell
      mashOn = 0; onMouse = 0;
      const w = smooth(0, 0.6, k);
      lean = lerp(lean, -0.12, w); recline = 0.1 * w; twist = lerp(twist, -0.45, w); rollX = -0.03 * w;
      rh.lerp(_t.set(0.06, 1.2, 0.27), w); lh.lerp(_t.set(DX0 + 0.04, DESK_Y + 0.04, -0.12), w);
      jawT = 0.85; browT = -1.1; lidsT = 0.0; gritT = 0;
      cR = 1; cL = lerp(0.55, 0.75, w);
      kR = 120; zR = 0.7; kL = 140;
      sp.lean.set(90, 0.7);
    } else if (n === 'punch') {
      // A: the lunge: chest square, head held back and turned from the blow, the arm straight, the fist into the glass
      mashOn = 0; onMouse = 0;
      lean = 0.38; hunch = 0.12; twist = 0.5; rollX = 0.07; recline = -0.03;
      rh.copy(SCREEN_W).addScaledVector(SCREEN_X, -0.05).addScaledVector(SCREEN_N, -0.03);
      lh.set(DX0 + 0.04, DESK_Y + 0.04, -0.12);
      yaw = lerp(toScreen.yaw, toYou.yaw, 0.45); pitch = toScreen.pitch + 0.12;
      jawT = 1.0; browT = -1.1; lidsT = 0.0; gritT = 0;
      cR = 1; cL = 0.75;
      kR = 2600; zR = 0.85;
      sp.lean.set(900, 0.75); sp.twist.set(700, 0.8); sp.rollX.set(300, 0.8); sp.yaw.set(400, 0.8);
    } else if (n === 'blown') {
      // A: blown back by his own explosion; the fist hangs a beat in the hole, then his open hands fly up: the near one
      // up and back beside his head (never across his face: we keep his wide eyes and open mouth), the far one up in
      // front of him
      mashOn = 0; onMouse = 0;
      lean = -0.18; recline = 0.17; rollX = -0.1; twist = 0.1; hunch = 0.45;
      const hang = pu < 0.12;
      if (hang) rh.copy(SCREEN_W).addScaledVector(SCREEN_X, -0.05).addScaledVector(SCREEN_N, 0.03);
      else rh.set(-0.13, 1.27, 0.32);
      lh.set(0.22, 1.2, -0.2);
      jawT = 0.7; browT = 0.9; lidsT = -0.1; gritT = 0; pitch = toScreen.pitch + 0.3;
      cR = hang ? 1 : 0.06; cL = 0.06;
      kR = hang ? 2000 : 140; zR = 0.6; kL = 140;
      sp.lean.set(70, 0.45); sp.recline.set(40, 0.5); sp.rollX.set(30, 0.7);
    } else if (n === 'after') {
      // slumped, breathing hard through his mouth, deadpan, sooty; a cough
      mashOn = 0; onMouse = 0;
      const heave = Math.sin(pu * 8.5) * lerp(1, 0.4, k);
      lean = (isB ? 0.05 : -0.1) + 0.03 * heave; hunch = 0.72 + 0.05 * heave; recline = isB ? 0.08 : 0.16; rollX = isB ? -0.06 : -0.13; twist = 0.05;
      if (isB) swivel = TURN * 0.4;
      lh.copy(lap(0)); rh.copy(lap(1)); lh.y += 0.01 * heave; rh.y += 0.01 * heave;
      cL = cR = 0.3;
      // a glare at the wreck, then the deadpan look at us (a slow blink)
      const at = aim(isB ? SPIKE : SCREEN_W);
      const toUs = smooth(isB ? 0.9 : 0.35, isB ? 1.3 : 0.75, pu);
      yaw = lerp(at.yaw, toYou.yaw * 0.8, toUs); pitch = lerp(at.pitch + 0.05, toYou.pitch, toUs) + 0.03 * heave;
      gaze.copy(toUs > 0.5 ? camera.position : isB ? SPIKE : SCREEN_W);
      jawT = 0.3 + 0.12 * heave; browT = lerp(-1.0, -0.2, toUs); lidsT = lerp(0.2, 0.42, toUs); gritT = 0;
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
      if (flinch) { lidsT = -0.1; browT = 0.8; jawT = 0.5; } else { lidsT = 0.32; browT = -0.4; jawT = 0.06; }
      gritT = 0;
      lh.lerp(lap(0), 1 - back); rh.lerp(lap(1), 1 - back);
      mashOn = back; onMouse = back > 0.8 ? 1 : 0;
      const a = aim(isB ? gbs.p : SCREEN_W); yaw = lerp(a.yaw, yaw, back); pitch = lerp(a.pitch, pitch, back);
      if (!isB && pu < 0.55) pitch = toScreen.pitch + 0.45 * smooth(0, 0.3, pu);           // looks up at it coming
      if (isB) gaze.copy(gbs.p);
      sp.recline.set(30, 0.7); sp.rollX.set(20, 0.85);
    } else if (n === 'recoil') {
      // B: the crash hits him: hands off the board, open, a gasp; then a sneer
      mashOn = 0; onMouse = 0;
      const w = smooth(0, 0.15, k);
      lean = lerp(lean, 0.05, w); recline = 0.05 * w; hunch = 0.4;
      rh.lerp(_t.set(0.34, 0.98, 0.3), w); lh.lerp(_t.set(0.34, 0.98, -0.24), w);   // open hands up off the board: whoa
      jawT = k < 0.5 ? 0.85 : 0.04; browT = k < 0.5 ? 0.8 : -1.0; lidsT = k < 0.5 ? -0.1 : 0.22; gritT = k < 0.5 ? 0 : 0.7;
      cL = cR = 0.1;
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
      jawT = 0.05; browT = -0.8; lidsT = 0.25; gritT = 0.3;
      cR = lerp(0.1, 0.55, smooth(0.3, 0.45, k)); cL = lerp(0.1, 0.55, lift);
      gaze.copy(lift > 0.5 ? gbs.p : GB_HOME);
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
      jawT = 0.08; browT = lerp(-0.6, -1.05, t2); lidsT = lerp(0.25, 0.1, t2); gritT = 0.6 * smooth(0.4, 1, t2);
      if (cyc.gbu > fail) { browT = -1.1; lidsT = 0; jawT = 0; gritT = 1; }
      cL = cR = 0.55; gaze.copy(gbs.p);
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
      const a = aim(SPIKE); yaw = lerp(yaw, a.yaw, w); pitch = lerp(pitch, a.pitch + 0.15, w); jawT = 0.9; browT = -1.1; lidsT = 0; gritT = 0;
      cR = 0.8; cL = lerp(0.55, 0.35, w); gaze.copy(SPIKE);
      kL = kR = 140; zL = zR = 0.7;
      sp.swivel.set(60, 0.8);
    } else if (n === 'throw') {
      // B: the whip: the arm comes over and down, lets go (the fingers fly open); it flies spinning onto the desk
      mashOn = 0; onMouse = 0; gbHold = gbs.mode === 'held';
      gbs.one = 1; gbs.on = gbs.mode === 'held';
      rh.copy(THROW_FT); lh.copy(inChair(_t, 0.3, 0.45, -0.12));
      swivel = -0.05; lean = 0.2; hunch = 0.36; twist = 0.4; rise = 0.03;
      const a = aim(SPIKE); yaw = a.yaw; pitch = a.pitch;
      jawT = 1.0; browT = -1.1; lidsT = 0; gritT = 0;
      cR = gbHold ? 0.8 : 0.02; cL = 0.35; gaze.copy(SPIKE);
      kL = 600; kR = 1500; zL = zR = 0.8;
      sp.lean.set(500, 0.75); sp.swivel.set(300, 0.8); sp.twist.set(400, 0.8);
    } else if (n === 'flinch') {
      // B: it goes off: he flinches back from it, open hands up, eyes screwed shut, teeth bared
      mashOn = 0; onMouse = 0;
      lean = -0.08; recline = 0.08; rollX = -0.05; hunch = 0.48; swivel = TURN * 0.3;
      inChair(rh, 0.28, 0.66, 0.16); inChair(lh, 0.28, 0.64, -0.14);
      jawT = 0.12; browT = -0.7; lidsT = 0.95; gritT = 0.9; yaw = lerp(aim(SPIKE).yaw, toYou.yaw, 0.6); pitch = 0.15;
      cL = cR = 0.05; gaze.copy(SPIKE);
      kL = kR = 150; zL = zR = 0.6;
      sp.lean.set(70, 0.5);
    } else if (n === 'resume') {
      lean = lerp(lean - 0.1, lean, k);
    }
    // the stare at the viewer (hover) wins over the head, briefly: brows down, mouth shut, eyes locked on you
    const L = look.w.x;
    if (L > 0.001) {
      const y2 = clamp(toYou.yaw, -2.2, 2.2);
      yaw = lerp(yaw, y2 * 0.75, L); pitch = lerp(pitch, toYou.pitch, L);
      twist = lerp(twist, y2 * 0.2, L);
      browT = lerp(browT, -0.95, L); lidsT = lerp(lidsT, 0.3, L); jawT = lerp(jawT, 0.0, L); gritT = lerp(gritT, 0, L);
      if (L > 0.3) gaze.copy(camera.position);
      mashOn *= 1 - L * 0.7;
      if (look.t > 1.3 && look.t < 1.75) rollH = 0.1 * Math.sin((look.t - 1.3) * 28) * L;
    }

    // ---- mashing: the left hand hops between Q, W, E and R; each press drops the key under it. A spell going off on
    // the screen is its own key, struck right then.
    mash.rate = act.mash * mashOn;
    mash.t += h;
    if (act.cast >= 0 && act.castId !== mash.cast && mashOn > 0.5) {
      mash.cast = act.castId; mash.t = 0; mash.next = Math.max(mash.next, 0.12);
      mash.key = QWER[act.cast]; keyList[mash.key].press = 1;
    } else if (mash.rate > 0.02 && mash.t >= mash.next) {
      mash.t = 0; mash.next = 1 / (3 + 11 * mash.rate);
      mash.key = QWER[((time * 977) | 0) % 4];
      keyList[mash.key].press = 1;
    }
    kbLocal(mash.key, mash.lh);
    lh.lerp(_c.copy(mash.lh).add(_t.set(-0.085, 0.01, 0)), mashOn * 0.8);
    const tap = mash.rate > 0.02 ? Math.max(0, Math.sin((mash.t / mash.next) * Math.PI)) : 0;
    lh.y += 0.014 * tap * mashOn;
    if (act.click && onMouse > 0.5) { rh.y -= 0.004; wob.mouse.x = -0.002; cR += 0.12; }

    // ---- targets into springs
    handK(0, kL, zL); handK(1, kR, zR);
    setHand(0, lh); setHand(1, rh);
    hands[0].c.to = cL; hands[1].c.to = cR;
    sp.lean.to = lean; sp.hunch.to = hunch; sp.twist.to = twist; sp.yaw.to = yaw; sp.pitch.to = pitch; sp.roll.to = rollH;
    sp.rise.to = rise; sp.recline.to = recline; sp.swivel.to = swivel; sp.rollX.to = rollX; sp.jaw.to = jawT; sp.brow.to = browT; sp.lids.to = lidsT; sp.grit.to = gritT;
    if (n === 'resume' || (n === 'play' && cyc.gu < 0.5)) sp.soot.to = 0;
    if (n === 'reset') sp.soot.to = Math.min(sp.soot.to, 1 - smooth(0.6, 1.4, pu));
    if (L > 0.01) sp.yaw.set(40, 0.85);
    for (const s of Object.values(sp)) s.step(h);
    for (const hd of hands) for (const c of ['x', 'y', 'z', 'c']) hd[c].step(h);
    for (const hd of hands) if (hd.x.x > DX0 - 0.02 && hd.y.x < DESK_Y + 0.03) { hd.y.x = DESK_Y + 0.03; if (hd.y.v < 0) hd.y.v *= -0.15; }
    if (onMouse > 0.5) {                                                       // the mouse goes where his palm is (it rides under his hand)
      const hd = arms[1].hand;
      _p.set(0.05, 0, 0).applyQuaternion(hd.quaternion).add(hd.position); _a.set(1, 0, 0).applyQuaternion(hd.quaternion);
      mouseAt.x += (_p.x - mouseAt.x) * 0.5; mouseAt.z += (_p.z - mouseAt.z) * 0.5; mouseDir.yaw += (Math.atan2(-_a.z, _a.x) - mouseDir.yaw) * 0.5;
    }

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
    // the cough: little grey puffs out of his mouth, off past the front of his face as we see it (over his chin they'd
    // read as a beard)
    if (fx.cough >= 0 && n === 'after' && pu > fx.cough) {
      fx.cough = -1;
      for (let i = 0; i < 3; i++) puff(_c.copy(MOUTH_W).addScaledVector(cRight, 0.035 + 0.03 * i).addScaledVector(cUp, 0.01 + 0.008 * i), 0.011 + 0.007 * i, 0.8, 0.2, cRight.x * 0.3, 0.14, cRight.z * 0.3);
    }
    // his singed hair smokes: thin grey wisps curling up off his crown, dying away
    if (fx.singe > 0) {
      fx.singe = Math.max(0, fx.singe - h);
      if (rand() < 8 * h * smooth(0, 0.8, fx.singe)) {
        head.localToWorld(_c.set(-0.02 + 0.09 * (rand() - 0.5), 0.2, 0.11 * (rand() - 0.5)));
        puff(_c, 0.016 + 0.012 * rand(), 1.0 + 0.4 * rand(), 0, (rand() - 0.5) * 0.05, 0.16 + 0.08 * rand(), (rand() - 0.5) * 0.05, 1.4);
      }
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
    jaw.rotation.z = -0.36 * clamp(sp.jaw.x, 0, 1.25);
    // the face: the upper lids (-0.2 wide, 0 a hard stare, 0.4 deadpan, 1 shut), the brows (down and in when he's cross,
    // up in shock; tilted round the forehead), the clench (bared teeth, scaled open from nothing)
    const lids = clamp(sp.lids.x, -0.2, 1.1), brow = sp.brow.x, grit = clamp(sp.grit.x, 0, 1.1);
    for (const e of eyes) {
      e.lid.rotation.set(0, 0, lerp(0.95, -1.5, lids));
      e.brow.position.set(BROW[0] - 0.002 * brow, BROW[1] + 0.0055 * brow, e.s * BROW[2]);
      e.brow.rotation.set(e.s * 0.42 * brow, -e.s * 0.3, 0);
    }
    grin.visible = grit > 0.03; grin.scale.set(1, Math.max(0.03, grit), lerp(0.85, 1, clamp(grit, 0, 1)));
    const soot = clamp(sp.soot.x, 0, 1);
    M.skin.color.copy(SKIN).lerp(ASH, 0.25 * soot); M.skinD.color.copy(SKIND).lerp(ASHD, 0.25 * soot);
    M.face.color.copy(M.skin.color); SOOT_U.uSoot.value = soot;
    tufts.scale.set(1 + 0.08 * soot, 1 + 0.5 * soot, 1 + 0.12 * soot); tufts.rotation.z = 0.12 * soot;   // the blast stands his hair on end, up and back
    M.hair.color.copy(HAIR).lerp(SINGED, 0.6 * soot);
    chairBase.updateMatrixWorld(true);
    // his eyes turn to what he's looking at (the head turns most of the way; the eyes finish it)
    _inv.copy(head.matrixWorld).invert();
    SOOT_U.uHeadInv.value.copy(_inv);
    for (const e of eyes) {
      _p.copy(gaze).applyMatrix4(_inv).sub(e.g.position);
      e.g.rotation.set(0, clamp(Math.atan2(-_p.z, _p.x), -0.55, 0.55), clamp(Math.atan2(_p.y, Math.hypot(_p.x, _p.z)), -0.35, 0.3));
    }

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
      const c = clamp(hands[i].c.x, 0, 1), inf = arm.hand.morphTargetInfluences;   // open > grip > fist
      inf[0] = c < 0.5 ? 2 * c : 2 - 2 * c; inf[1] = c < 0.5 ? 0 : 2 * c - 1;
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
    mouse.rotation.y = mouseDir.yaw;
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

  // ---- the screens: the live CRT at 20 fps. Dead, the counter runs down to the reset (rage B: he respawns as it
  // begins, in a flash). Between cycles (the reset, the resume) the screen already plays the next round's opening, the
  // waves marching out of the towers, so the next play carries straight on from it.
  const scrStat = { ms: 0, n: 0, max: 0 };                                   // the screen's redraw cost (for ?debug)
  const toEnd = () => cyc.ph.slice(cyc.pi + 1).reduce((s, p) => s + p.d, cur().d - cyc.pu);
  function toPhase(name) {
    let s = cur().d - cyc.pu;
    for (let i = cyc.pi + 1; i < cyc.ph.length && cyc.ph[i].n !== name; i++) s += cyc.ph[i].d;
    return s;
  }
  function drawScreens() {
    const mon = mons[monI], n = phase(), between = n === 'reset' || n === 'resume', next = ROUNDS[(cyc.i + 1) % ROUNDS.length];
    const t0 = performance.now();
    if (mon.state === 'boot') drawBoot(clamp((mon.landT - 0.3) / 0.45, 0, 1), between ? next : cyc.game, between ? -toEnd() : cyc.gu);
    else if (mon.state === 'live') {
      if (between) next.draw(-toEnd(), { fade: cyc.kind === 'B' && n === 'reset' ? 1 - cyc.pu / 0.18 : 0 });
      else cyc.game.draw(cyc.gu, { respawn: toPhase('reset') });
    } else return;
    screenTex.needsUpdate = true;
    const ms = performance.now() - t0; scrStat.ms += ms; scrStat.n++; scrStat.max = Math.max(scrStat.max, ms);
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

  // ---- the opening frame (and the reduced-motion still): ganked, the screen grey, the respawn counter, the three of
  // them in the kill feed; he has frozen, glaring, the mouse hand off the mouse and clenched. About to lose it.
  newCycle(0, false);
  setD('stare', 1.0);
  mons[0].screen.material = liveMat;
  drawGB(0, 9, false);
  {
    const quiet = { hover: 0 };
    cyc.gu = cyc.pu = cyc.game.fail - 0.6;
    for (let i = 0; i < 75; i++) { step(H, quiet); stepStrings(H); pose(); }   // the springs settle; the screen once, after
  }
  drawScreens();
  glow.c.copy(glow.tc); glow.i = glow.ti;
  pose();
  // debug (?debug, or the lab's &shot): the screen's canvas, its redraw cost, any round's frame on demand, a jump to the
  // start of any cycle (while the monitor is live)
  if (/[?&](debug|shot)\b/.test(location.search)) window.__gamer = { screen: scrCanvas, raw: () => FB, stat: scrStat, track: TRACK, rounds: ROUNDS, sim, cyc, phase, cycle: (i) => newCycle(i, false) };

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
      const f = Math.floor(time * 20);
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
