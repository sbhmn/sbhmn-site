// Wall Street Wars on the home page. A chiselled stock arrow draws the market as it goes: greedy rallies that accelerate
// into their highs, a spike now and then, and gut-punch dips (the floor drops out, the frame shakes, everything goes red
// for a beat). The line it leaves is a ridged 3D bar (green up, deep green pullbacks, red crashes) running off into the
// distance and fading; the camera rides the arrow and auto-ranges the visible line into its band like a real chart (pulls
// back on big moves, leans in on calm ones), so it goes on forever. At the top, the dollar amount in money-green 3D type
// rolls its digits like an odometer as the price moves. Dollar signs pop into the air and rain down, rocking and spinning
// (always facing us, so they always read as $), bouncing off the chart, a fan of them out of every spike; they always
// fall behind the sign. The name: WALL STREET on a stock-ticker LED strip over WARS in heavy bevelled ink blocks; a
// spike sends a green band across WARS, a crash flashes it red and punches it down.
// Hover: the market goes wild (bigger swings, more money) and the WARS letter under the pointer lifts and lights green.
// Click: a spike and a burst of $. Clicks (and spikes or crashes the pointer stirred up) tug the background web; the
// market on its own tugs it at most every 12 s. Reduced motion: the opening frame (a rally under way, money in the
// air) is the still.
import { loadFont } from '../text3d.js';
import { TextGeometry } from '/assets/vendor/three/addons/geometries/TextGeometry.js';

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const outBack = (t, s = 1.70158) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2;
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// two-tone vertex colours from a text geometry's face/side groups, so one material (one draw call) draws both
function bake(THREE, g, face, side) {
  const n = g.attributes.position.count, col = new Float32Array(n * 3);
  const groups = g.groups.length ? g.groups : [{ start: 0, count: n, materialIndex: 0 }];
  for (const gr of groups) {
    const c = gr.materialIndex === 0 ? face : side;
    for (let i = gr.start, e = Math.min(n, gr.start + gr.count); i < e; i++) { col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2]; }
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.clearGroups();
  return g;
}

// how the arrow travels a leg (position along it, 0..1)
const EASE = {
  greedy: (u) => 0.3 * u + 0.7 * u * u,             // slow to start, then it can't stop: accelerates into the high
  rocket: (u) => 0.08 * u + 0.92 * u * u * u,       // a breath, then straight up
  punch: (u) => 1 - (1 - u) ** 3,                   // all at once: the floor drops out
  drift: (u) => u * u * (3 - 2 * u),
};

// 5x7 ticker LEDs for WALL STREET; a heavy 7x9 block face for WARS
const LED = {
  W: ['X...X', 'X...X', 'X...X', 'X.X.X', 'X.X.X', 'X.X.X', '.X.X.'],
  A: ['.XXX.', 'X...X', 'X...X', 'XXXXX', 'X...X', 'X...X', 'X...X'],
  L: ['X....', 'X....', 'X....', 'X....', 'X....', 'X....', 'XXXXX'],
  S: ['.XXXX', 'X....', 'X....', '.XXX.', '....X', '....X', 'XXXX.'],
  T: ['XXXXX', '..X..', '..X..', '..X..', '..X..', '..X..', '..X..'],
  R: ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X.X..', 'X..X.', 'X...X'],
  E: ['XXXXX', 'X....', 'X....', 'XXXX.', 'X....', 'X....', 'XXXXX'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
};
const BLOCK = {
  W: ['XX...XX', 'XX...XX', 'XX...XX', 'XX...XX', 'XX.X.XX', 'XX.X.XX', 'XXXXXXX', 'XXX.XXX', 'XX...XX'],
  A: ['.XXXXX.', 'XXXXXXX', 'XX...XX', 'XX...XX', 'XXXXXXX', 'XXXXXXX', 'XX...XX', 'XX...XX', 'XX...XX'],
  R: ['XXXXXX.', 'XXXXXXX', 'XX...XX', 'XX...XX', 'XXXXXX.', 'XXXXX..', 'XX.XXX.', 'XX..XXX', 'XX...XX'],
  S: ['.XXXXXX', 'XXXXXXX', 'XX.....', 'XXXXXX.', '.XXXXXX', '.....XX', '.....XX', 'XXXXXXX', 'XXXXXX.'],
};

const GREEN = 0x18c964, GREEN_DEEP = 0x0d7a3e, RED = 0xff2414;
const LED_ON = 0x3dff95, LED_RED = 0xff3a22, LED_OFF = 0x2a2c2b;

export async function create({ THREE, stage, reduced }) {
  const V3 = THREE.Vector3;
  const scene = new THREE.Scene();
  scene.background = null;
  const FOV = 26;
  const camera = new THREE.PerspectiveCamera(FOV, 0.8, 0.1, 120);
  scene.add(camera);
  const font = await loadFont();
  const RES = font.data.resolution;
  const rand = rng(0x57a11);          // seeded: the same market every visit (and in screenshots)
  const rnd = rng(0xd011a5);          // the money's own stream, so tuning the rain never changes the market
  const mtx = new THREE.Matrix4(), q0 = new THREE.Quaternion(), vS = new V3(1, 1, 1), vP = new V3(), eul = new THREE.Euler();
  const _d = new V3(), _p = new V3(), ZERO = new THREE.Matrix4().makeScale(0, 0, 0);

  // ---- light: a key from high on the left (off the camera axis: no sheet of light on faces that look at us), a rim
  // from behind, and two painted studios to reflect in the gloss: a dark one for the ink, a bright one for the money
  scene.add(new THREE.HemisphereLight(0xffffff, 0x1c1c1c, 1.15));
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(-6, 7, -1); camera.add(key, key.target); key.target.position.set(0, 0, -8);
  const rim = new THREE.DirectionalLight(0xffffff, 1.5); rim.position.set(6, 3, -16); camera.add(rim, rim.target); rim.target.position.set(0, 0, -7);
  const studio = (stops, boxes) => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128;
    const g = c.getContext('2d');
    const sky = g.createLinearGradient(0, 0, 0, 128);
    stops.forEach(([s, col]) => sky.addColorStop(s, col));
    g.fillStyle = sky; g.fillRect(0, 0, 256, 128);
    for (const [col, x, y, w, h] of boxes) { g.fillStyle = col; g.fillRect(x, y, w, h); }
    const t = new THREE.CanvasTexture(c);
    t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  // (u = 0.67 is straight back at the camera: kept dim in the dark studio)
  const envDark = studio([[0, '#f4f4f4'], [0.16, '#bdbdbd'], [0.36, '#505050'], [0.5, '#2c2c2c'], [0.56, '#202020'], [1, '#0c0c0c']],
    [['#ffffff', 104, 18, 34, 30], ['#ffffff', 14, 16, 40, 26], ['#e0e0e0', 212, 22, 30, 22]]);
  const envBright = studio([[0, '#ffffff'], [0.3, '#f2f2f0'], [0.48, '#c8c8c6'], [0.54, '#7a7a78'], [0.7, '#3a3a3a'], [1, '#1a1a1a']],
    [['#ffffff', 150, 30, 50, 26], ['#ffffff', 60, 24, 40, 30], ['#5a5a5a', 0, 44, 30, 10]]);

  const std = (o) => new THREE.MeshStandardMaterial({ flatShading: true, envMap: envDark, ...o });
  const M = {
    counter: std({ color: GREEN, vertexColors: true, roughness: 0.3, metalness: 0.05, envMapIntensity: 0.9 }),
    ribbon: std({ vertexColors: true, transparent: true, roughness: 0.36, metalness: 0.05, envMapIntensity: 0.7 }),
    head: std({ color: GREEN, roughness: 0.3, metalness: 0.05, envMapIntensity: 0.8 }),
    cash: std({ color: 0x1fd06a, vertexColors: true, roughness: 0.28, metalness: 0.05, envMap: envBright, envMapIntensity: 0.8 }),
    gold: std({ color: 0xf6c75a, vertexColors: true, roughness: 0.22, metalness: 1, envMap: envBright, envMapIntensity: 1.15 }),
    board: std({ color: 0x141414, roughness: 0.45, metalness: 0.05, envMapIntensity: 0.6 }),
    led: new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }),
    ledOff: new THREE.MeshBasicMaterial({ color: LED_OFF, toneMapped: false }),
    bFace: std({ color: 0xffffff, roughness: 0.42, metalness: 0.05, envMapIntensity: 0.6, emissive: 0x000000 }),
    bSide: std({ color: 0xffffff, roughness: 0.32, metalness: 0.1, envMapIntensity: 0.9 }),
  };
  const C = (hex) => new THREE.Color(hex);
  const COL = { green: C(GREEN), deep: C(GREEN_DEEP), red: C(RED), ledOn: C(LED_ON), ledRed: C(LED_RED), ink: C(0x141414) };

  // ---- glyphs from the display face, centred on the cap height so they stack and roll cleanly
  const CAP = (() => { const s = font.generateShapes('H', 1); let lo = 1e9, hi = -1e9; for (const sh of s) for (const p of sh.getPoints()) { lo = Math.min(lo, p.y); hi = Math.max(hi, p.y); } return hi - lo; })();
  function glyphGeo(ch, depth, bev, curve = 2) {
    const g = new TextGeometry(ch, { font, size: 1, depth, curveSegments: curve, bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev * 0.7, bevelSegments: 1 });
    const gl = font.data.glyphs[ch];
    g.translate(-(gl.x_min + gl.x_max) / 2 / RES, -CAP / 2, -depth / 2);
    return g;
  }

  // =====================================================================================================================
  // THE MARKET: legs of a zig-zag, the arrow travelling them, the chart ribbon left behind
  // =====================================================================================================================
  const HT = 0.056, HD = 0.07, RZ = 0.045;          // ribbon half thickness (in the chart plane), half depth, front ridge
  const MAXSEG = 44, SEGV = 24;
  const ribPos = new Float32Array((MAXSEG + 1) * SEGV * 3), ribCol = new Float32Array((MAXSEG + 1) * SEGV * 4);
  const ribGeo = new THREE.BufferGeometry();
  ribGeo.setAttribute('position', new THREE.BufferAttribute(ribPos, 3).setUsage(THREE.DynamicDrawUsage));
  ribGeo.setAttribute('color', new THREE.BufferAttribute(ribCol, 4).setUsage(THREE.DynamicDrawUsage));
  const ribbon = new THREE.Mesh(ribGeo, M.ribbon); ribbon.frustumCulled = false; scene.add(ribbon);
  const NECK = MAXSEG;                                // the last slot: tip to the arrowhead, bends when it overshoots

  const segs = [];
  let segCount = 0;
  const nrm = (dx, dy) => { const l = Math.hypot(dx, dy) || 1; return [(-dy / l) * HT, (dx / l) * HT]; };
  function miter(ax, ay, bx, by) {
    const la = Math.hypot(ax, ay) || 1, lb = Math.hypot(bx, by) || 1;
    const nax = -ay / la, nay = ax / la, nbx = -by / lb, nby = bx / lb;
    let mx = nax + nbx, my = nay + nby; const ml = Math.hypot(mx, my);
    if (ml < 1e-4) return [nax * HT, nay * HT];
    mx /= ml; my /= ml;
    const k = HT / Math.max(0.34, mx * nax + my * nay);
    return [mx * k, my * k];
  }
  function writeSeg(slot, ax, ay, bx, by, ma, mb, col) {
    let i = slot * SEGV * 3;
    const ap = [ax + ma[0], ay + ma[1]], an = [ax - ma[0], ay - ma[1]], bp = [bx + mb[0], by + mb[1]], bn = [bx - mb[0], by - mb[1]];
    const v = (p, z) => { ribPos[i] = p[0]; ribPos[i + 1] = p[1]; ribPos[i + 2] = z; i += 3; };
    const ac = [ax, ay], bc = [bx, by];
    v(ac, HD + RZ); v(bc, HD + RZ); v(bp, HD); v(ac, HD + RZ); v(bp, HD); v(ap, HD);   // front, upper facet (a ridge runs along the bar)
    v(an, HD); v(bn, HD); v(bc, HD + RZ); v(an, HD); v(bc, HD + RZ); v(ac, HD + RZ);   // front, lower facet
    v(ap, HD); v(bp, HD); v(bp, -HD); v(ap, HD); v(bp, -HD); v(ap, -HD);        // upper side
    v(an, -HD); v(bn, -HD); v(bn, HD); v(an, -HD); v(bn, HD); v(an, HD);        // lower side
    const oc = slot * SEGV * 4;
    for (let k = 0; k < SEGV; k++) { ribCol[oc + k * 4] = col.r; ribCol[oc + k * 4 + 1] = col.g; ribCol[oc + k * 4 + 2] = col.b; }
  }
  const segColor = (kind) => (kind === 'dip' ? COL.red : kind === 'pull' || kind === 'bounce' ? COL.deep : COL.green);
  const drawSeg = (s) => writeSeg(s.slot, s.ax, s.ay, s.bx, s.by, s.ma, s.mb, segColor(s.kind));
  function newSeg(kind, x, y, dx, dy) {
    const prev = segs[segs.length - 1];
    const s = { kind, ax: x, ay: y, bx: x, by: y, dx, dy, slot: segCount++ % MAXSEG, ma: nrm(dx, dy), mb: nrm(dx, dy) };
    if (prev) { const m = miter(prev.dx, prev.dy, dx, dy); prev.mb = m; s.ma = m; drawSeg(prev); }
    segs.push(s);
    if (segs.length > MAXSEG) segs.shift();
    return s;
  }
  // the old end of the line fades away behind the arrow, so the chart never crowds the counter or the name
  const FADE0 = 1.3, FADE1 = 2.9;
  // ... and it is softly clipped to its band on screen (call after the camera is posed)
  function fadeRibbon() {
    const x0 = head.x - FADE1, span = FADE1 - FADE0, n = (MAXSEG + 1) * SEGV;
    const cp = camera.position, lo = chartLo, hi = chartHi;
    for (let v = 0; v < n; v++) {
      const i = v * 3;
      let a = clamp((ribPos[i] - x0) / span, 0, 1);
      if (a > 0) {
        _d.set(ribPos[i] - cp.x, ribPos[i + 1] - cp.y, ribPos[i + 2] - cp.z);
        const dz = Math.max(0.1, _d.dot(FWD)), ny = _d.dot(UP) / dz / tanV, nx = _d.dot(RIGHT) / dz / (tanV * aspect);
        a *= clamp((ny - lo - 0.02) / 0.12, 0, 1) * clamp((hi - 0.01 - ny) / 0.1, 0, 1) * clamp((nx + 1.02) / 0.3, 0, 1);
      }
      ribCol[v * 4 + 3] = a * a * (3 - 2 * a);
    }
  }
  function lineAt(x) {                               // the chart's height under x (newest first), or null
    for (let i = segs.length - 1; i >= 0; i--) {
      const s = segs[i];
      if (x < s.ax) continue;
      if (x > s.bx) return null;
      const sl = (s.by - s.ay) / Math.max(1e-5, s.bx - s.ax);
      return { y: s.ay + (x - s.ax) * sl, slope: sl };
    }
    return null;
  }

  // ---- the legs
  const legs = [];
  let leg = null, wild = 0;
  const push = (kind, dx, dy, dur, ease) => legs.push({ kind, dx, dy, dur, ease });
  function plan() {
    const n = 2 + Math.floor(rand() * 2.6);
    for (let i = 0; i < n; i++) {
      push('up', 0.38 + 0.2 * rand(), 0.2 + 0.24 * rand(), 0.5 + 0.18 * rand(), 'greedy');
      push('pull', 0.18 + 0.1 * rand(), -(0.06 + 0.13 * rand()), 0.28 + 0.1 * rand(), 'drift');
    }
    if (rand() < 0.5 + 0.25 * wild) {
      push('spike', 0.2 + 0.05 * rand(), 0.72 + 0.26 * rand(), 0.34, 'rocket');
      push('pull', 0.34, -(0.22 + 0.1 * rand()), 0.36, 'drift');
    } else {
      push('up', 0.3, 0.14, 0.4, 'greedy');
      push('dip', 0.2 + 0.04 * rand(), -(0.66 + 0.22 * rand()), 0.22, 'punch');
      push('bounce', 0.32, 0.18 + 0.08 * rand(), 0.46, 'drift');
      push('pull', 0.26, -(0.1 + 0.06 * rand()), 0.34, 'drift');
    }
  }

  const tip = { x: 0, y: 0, vx: 0, vy: 0 };
  let liveSeg = null, priceY = 0;
  // effects, all decaying
  const fx = { flash: 0, heat: 0, shake: 0, shakeT: 0, pulse: 0, pulseV: 0, lift: 0, liftV: 0, sweep: -1, sweepRed: 0, wave: -1, punch: 0, punchV: 0 };
  let lastRect = null, lastVisible = 0, time = 0;
  // the background web is shared by the whole page: a click always tugs it, a spike or crash the pointer stirred up
  // may (4 s apart), and the market on its own only every 12 s
  let lastTug = -9, lastAutoTug = -6, clickSpike = false;
  function tug(strength, kind) {
    if (!lastRect || reduced || lastVisible < 0.4) return;
    const since = time - lastTug;
    if (kind === 'click' ? since < 0.8 : since < 4 || (kind === 'auto' && time - lastAutoTug < 12)) return;
    lastTug = time; if (kind === 'auto') lastAutoTug = time;
    stage.emit('tug', { strength, x: lastRect.left + lastRect.width * 0.6, y: lastRect.top + lastRect.height * 0.42 });
  }

  function startLeg(L) {
    const amp = L.kind === 'pull' || L.fixed ? 1 : 1 + 0.55 * wild, pace = L.fixed ? 1 : 1 + 0.4 * wild;
    leg = { ...L, dy: L.dy * amp, dur: L.dur / pace, x0: tip.x, y0: tip.y, t: 0 };
    liveSeg = newSeg(L.kind, tip.x, tip.y, leg.dx, leg.dy);
    if (L.kind === 'dip') {
      fx.heat = 1; fx.flash = 1; fx.shake = 0.075; fx.shakeT = 0; fx.sweepRed = 1; fx.punchV -= 7; fx.liftV -= 3.5;
      tug(0.55, wild > 0.5 ? 'hover' : 'auto');
    }
    if (L.kind === 'spike') { fx.pulseV += 2.5; if (!clickSpike) tug(0.4, wild > 0.5 ? 'hover' : 'auto'); }
  }
  function endLeg() {
    if (leg.kind === 'spike') { burst(10 + Math.round(3 * wild)); fx.pulseV += 4; fx.sweep = 0; fx.wave = 0; fx.liftV += 2.5; }
    if (leg.kind === 'up') { fx.pulseV += 0.9; if (rnd() < 0.6) spawnAir(); }
    head.kick = 1;
  }

  let airT = 0.3;
  function stepMarket(dt) {
    let rem = dt;
    while (rem > 1e-9) {
      if (!leg) { if (!legs.length) plan(); startLeg(legs.shift()); }
      const take = Math.min(rem, leg.dur - leg.t);
      leg.t += take; rem -= take;
      const f = EASE[leg.ease](Math.min(1, leg.t / leg.dur));
      const nx = leg.x0 + leg.dx * f, ny = leg.y0 + leg.dy * f;
      priceY += ny - tip.y;
      tip.x = nx; tip.y = ny;
      if (leg.t >= leg.dur - 1e-9) { liveSeg.bx = tip.x; liveSeg.by = tip.y; endLeg(); leg = null; }
    }
    if (!leg) { if (!legs.length) plan(); startLeg(legs.shift()); }
    // tip velocity along the leg (for the arrowhead's follow-through)
    const u = leg.t / leg.dur, e = 1e-3, E = EASE[leg.ease];
    const d = (E(Math.min(1, u + e)) - E(Math.max(0, u - e))) / (Math.min(1, u + e) - Math.max(0, u - e)) / leg.dur;
    tip.vx = leg.dx * d; tip.vy = leg.dy * d;
    liveSeg.bx = tip.x; liveSeg.by = tip.y;
    // money in the air: more on the way up, more when it's wild
    airT -= dt * (leg.dy > 0 ? 1 : 0.45) * (1 + 1.1 * wild);
    if (airT <= 0) { spawnAir(); airT = 0.15 + 0.17 * rnd(); }
    // keep the numbers small: the world slides back under everything now and then
    if (tip.x > 40) rebase(40, 0);
    if (Math.abs(tip.y) > 40) rebase(0, Math.sign(tip.y) * 40);
  }
  function rebase(dx, dy) {
    tip.x -= dx; tip.y -= dy; head.x -= dx; head.y -= dy; camF.x -= dx; camF.y -= dy;
    if (leg) { leg.x0 -= dx; leg.y0 -= dy; }
    for (const s of segs) { s.ax -= dx; s.bx -= dx; s.ay -= dy; s.by -= dy; drawSeg(s); }
    for (const c of cash) { c.p.x -= dx; c.p.y -= dy; if (c.burst) { c.burst.x -= dx; c.burst.y -= dy; } }
  }

  // ---- the arrowhead: follows the tip on a stiff, slightly loose spring (overshoots when the market turns)
  // a chiselled arrowhead: a notched outline with thin edges, front and back rising to a ridge point (flat-shaded facets)
  const AL = 0.37, AW = 0.215, AE = 0.035, AR = 0.13, ANOTCH = 0.075;
  const headGeo = (() => {
    const P = [[AL, 0], [0, AW], [ANOTCH, 0], [0, -AW]];          // counter-clockwise
    const F = [AL * 0.3, 0, AR], Bk = [AL * 0.3, 0, -AR];
    const pos = [];
    const t = (a, b, c) => pos.push(...a, ...b, ...c);
    for (let i = 0; i < 4; i++) {
      const a = P[i], b = P[(i + 1) % 4];
      const af = [a[0], a[1], AE], bf = [b[0], b[1], AE], ab = [a[0], a[1], -AE], bb = [b[0], b[1], -AE];
      t(F, af, bf); t(Bk, bb, ab);                                 // front and back facets
      t(af, ab, bb); t(af, bb, bf);                                // the thin edge
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.translate(-0.02, 0, 0);
    return g;
  })();
  const arrow = new THREE.Group();
  const arrowMesh = new THREE.Mesh(headGeo, M.head); arrow.add(arrowMesh); scene.add(arrow);
  const head = { x: 0, y: 0, vx: 0, vy: 0, ang: 0.5, av: 0, sq: 0, sqv: 0, red: 0, kick: 0 };
  function stepHead(dt) {
    const n = 3, h = dt / n;
    for (let i = 0; i < n; i++) {
      const k = 520, c = 2 * 0.42 * Math.sqrt(k);
      head.vx += (k * (tip.x - head.x) + c * (tip.vx - head.vx)) * h; head.x += head.vx * h;
      head.vy += (k * (tip.y - head.y) + c * (tip.vy - head.vy)) * h; head.y += head.vy * h;
      let da = Math.atan2(leg.dy, leg.dx) - head.ang; da = Math.atan2(Math.sin(da), Math.cos(da));
      const ka = 320, ca = 2 * 0.36 * Math.sqrt(ka);
      head.av += (ka * da - ca * head.av) * h; head.ang += head.av * h;
      const ks = 260, cs = 2 * 0.3 * Math.sqrt(ks);
      head.sqv += (-ks * head.sq - cs * head.sqv) * h; head.sq += head.sqv * h;
    }
    if (head.kick) { head.sqv -= 3.2; head.kick = 0; }
    // the head turns red with the line: only once the drop is there to see, never as a red wedge ahead of a green line
    const crashing = leg.kind === 'dip' && leg.y0 - head.y > 0.05;
    head.red += ((crashing ? 1 : 0) - head.red) * Math.min(1, dt * (crashing ? 30 : 5));
  }

  // ---- the camera rides the arrow: fixed orientation (the chart runs off into the distance on the left)
  const DOV = 3.0, YAW = 0.52, PITCH = -0.08, DMIN = 4.3, DMAX = 8.6;
  camera.quaternion.setFromEuler(new THREE.Euler(PITCH, YAW, 0, 'YXZ'));
  const FWD = new V3(0, 0, -1).applyQuaternion(camera.quaternion), RIGHT = new V3(1, 0, 0).applyQuaternion(camera.quaternion), UP = new V3(0, 1, 0).applyQuaternion(camera.quaternion);
  const camF = new V3(), camV = new V3(), camP = new V3();
  let aspect = 0.8, tanV = Math.tan(THREE.MathUtils.degToRad(FOV / 2)), hh = DOV * tanV, hw = hh * aspect;
  let headNX = 0.24, bandNY = 0.15, chartLo = -0.3, chartHi = 0.6;
  // camF is the point the camera frames at (headNX, bandNY): x rides the arrow; y and the distance auto-range the
  // visible line into the band ON SCREEN (the line recedes into the distance, so world heights lie), like a real chart:
  // a big move makes the view pull back, a calm rally lets it lean in, slowly enough that a crash plunges down the
  // frame before the view catches up
  let camD = 6, camDV = 0, posed = false;
  // a spike keeps headroom over the arrow (screen fraction of the band top): the money needs room to fountain
  let reserve = 0, reserveHold = 0;
  const poseCam = (out) => out.copy(camF).addScaledVector(FWD, -camD).addScaledVector(RIGHT, -headNX * camD * tanV * aspect).addScaledVector(UP, -bandNY * camD * tanV);
  function stepCam(dt, settle = false) {
    const w = 4.6;
    camV.x += (w * w * (head.x - camF.x) + 2 * w * ((settle ? 0 : tip.vx) - camV.x)) * dt; camF.x += camV.x * dt;
    poseCam(camP);
    let lo = 1e9, hi = -1e9;
    const see = (x, y) => {
      _d.set(x - camP.x, y - camP.y, HD - camP.z);
      const v = _d.dot(UP) / Math.max(0.1, _d.dot(FWD)) / tanV;
      if (v < lo) lo = v; if (v > hi) hi = v;
    };
    see(head.x, head.y); see(tip.x, tip.y); see(head.x + Math.cos(head.ang) * AL, head.y + Math.sin(head.ang) * AL);
    const cut = head.x - (FADE0 + 0.6 * (FADE1 - FADE0));
    for (let i = segs.length - 1; i >= 0; i--) {
      const s = segs[i];
      if (s.bx < cut) break;
      const ya = s.ax >= cut ? s.ay : s.ay + ((s.by - s.ay) * (cut - s.ax)) / Math.max(1e-5, s.bx - s.ax);
      see(Math.max(s.ax, cut), ya); see(s.bx, s.by);
    }
    reserveHold = leg.kind === 'spike' ? 1.3 : Math.max(0, reserveHold - dt);
    reserve += ((reserveHold > 0 ? 0.36 : 0) - reserve) * Math.min(1, dt * (reserveHold > 0 ? 9 : 1.5));
    const top = chartHi - 0.1 - reserve, bot = chartLo + 0.06, want = Math.max(0.3, top - bot);
    const td = clamp((camD * Math.max(0.1, hi - lo)) / want, DMIN, DMAX);
    const wd = settle ? 4 : 1.7;
    camDV += (wd * wd * (td - camD) - 2 * wd * camDV) * dt; camD += camDV * dt;
    // (the line sits a little low in the band: the money lives above it)
    const ty = camF.y + ((lo + hi) / 2 - lerp(bot, top, 0.44)) * camD * tanV;
    const wy = settle ? 5 : 3.2;
    camV.y += (wy * wy * (ty - camF.y) - 2 * wy * camV.y) * dt; camF.y += camV.y * dt;
    // never let the arrow leave the chart band
    const span = camD * tanV;
    const dLo = (chartLo + 0.06 - bandNY) * span, dHi = (chartHi - 0.07 - reserve - bandNY) * span;
    const py = head.y + Math.sin(head.ang) * AL;     // the arrow's point counts too
    const tp = Math.max(head.y, py) - camF.y, bt = Math.min(head.y, py) - camF.y;
    // (the clamp carries the view; it hands on no momentum, so the view stops when the arrow does)
    if (tp > dHi) { camF.y += tp - dHi; camV.y = Math.max(0, Math.min(camV.y, head.vy)); }
    else if (bt < dLo) { camF.y += bt - dLo; camV.y = Math.min(0, Math.max(camV.y, head.vy)); }
  }

  // =====================================================================================================================
  // THE MONEY: $ glyphs popping into the air and raining down (two instanced pools: green bills and gold)
  // =====================================================================================================================
  const makeCash = () => { const g = new TextGeometry('$', { font, size: 1, depth: 0.3, curveSegments: 1, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.035, bevelSegments: 1 }); g.center(); return g; };
  const cashGeoG = bake(THREE, makeCash(), [1, 1, 1], [0.3, 0.3, 0.3]);
  const cashGeoY = bake(THREE, makeCash(), [1, 1, 1], [0.72, 0.57, 0.31]);
  cashGeoG.computeBoundingBox();
  const CASH_H = cashGeoG.boundingBox.max.y - cashGeoG.boundingBox.min.y;
  const NCASH = 24, NGOLD = 8, cash = [];
  const cashG = new THREE.InstancedMesh(cashGeoG, M.cash, NCASH - NGOLD), cashY = new THREE.InstancedMesh(cashGeoY, M.gold, NGOLD);
  for (const im of [cashG, cashY]) {
    im.frustumCulled = false; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < im.count; i++) im.setMatrixAt(i, ZERO);
    scene.add(im);
  }
  for (let i = 0; i < NCASH; i++) {
    const gold = i % 3 === 1;
    cash.push({ im: gold ? cashY : cashG, burst: null, alive: false, p: new V3(), v: new V3(), r0: new V3(), rz: 0, spin: 0, fx: 3, fy: 2, phx: 0, phy: 0, age: 0, s: 1, hang: 0, bounces: 0, free: false });
  }
  function takeCash() {
    let best = null;
    for (const c of cash) { if (!c.alive) return c; if (!best || c.age > best.age) best = c; }
    return best;
  }
  // a $ falls like a coin or a bill: it spins in its own plane and rocks a little, but always faces the camera (the
  // angles are offsets from the camera's own yaw and pitch: never more than ~0.75 rad off, so it always reads as $)
  function flutter(c, tx, ry, rz, spin) {
    c.r0.set(tx, ry, 0); c.rz = rz; c.spin = spin;
    c.fx = 2 + 2 * rnd(); c.fy = 1.6 + 2.2 * rnd(); c.phx = rnd() * 6.28; c.phy = rnd() * 6.28;
  }
  function spawnAir() {
    const c = takeCash();
    c.alive = true; c.age = 0; c.bounces = 0; c.free = false; c.burst = null;
    c.s = (0.22 + 0.08 * rnd()) / CASH_H;
    // above the line, around the arrow and ahead of it (nearer the camera), a little in front of the chart
    const top = camF.y + (chartHi - 0.2 - bandNY) * camD * tanV;
    c.p.set(tip.x - 1.1 + 1.6 * rnd(), Math.min(top, tip.y + 0.3 + 0.55 * rnd()), -0.1 + 0.7 * rnd());
    c.v.set(-0.15 + 0.3 * rnd(), 0.3 + 0.35 * rnd(), 0);
    flutter(c, -0.18 + 0.36 * rnd(), -0.34 + 0.68 * rnd(), -0.6 + 1.2 * rnd(), (rnd() < 0.5 ? -1 : 1) * (0.8 + 2 * rnd()));
    c.hang = 0.2 + 0.15 * rnd();
  }
  const G = 5.8;
  function burst(n) {
    // a fan of money out of the peak: each $ gets its own slot across the fan (shuffled, so the pops come in no order),
    // its own launch delay, speed and height, so the burst never clumps or flies as a tidy ring; none high enough to
    // reach the counter
    const room = clamp(camF.y + (chartHi - 0.05 - bandNY) * camD * tanV - 0.17 - head.y, 0, 1.1);
    const order = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    let delay = 0;
    for (let i = 0; i < n; i++) {
      const c = takeCash();
      c.alive = true; c.age = -delay; c.bounces = 0; c.free = false; c.hang = 0.1 * rnd();
      delay += 0.03 + 0.06 * rnd();
      c.s = (0.2 + 0.1 * rnd()) / CASH_H;
      c.burst = { x: head.x, y: head.y, room, a: lerp(0.3, 2.9, (order[i] + 0.15 + 0.7 * rnd()) / n) };
      c.p.set(head.x, head.y, 0); c.v.set(0, 0, 0);
      flutter(c, -0.25 + 0.5 * rnd(), -0.34 + 0.68 * rnd(), rnd() * 6.28, (rnd() < 0.5 ? -1 : 1) * (3 + 5 * rnd()));
    }
  }
  function popBurst(c) {
    // it pops on its slot's ray, at the distance farthest from the money already in the air, and flies out along it
    const { x, y, room, a } = c.burst;
    c.burst = null;
    const vyMax = Math.sqrt(2 * G * room * 0.8), lift = Math.min(1, room / 0.4);
    const ca = Math.cos(a), sa = Math.sin(a);
    let bestD = -1;
    for (let k = 0; k < 4; k++) {
      const r = 0.16 + 0.2 * rnd(), px = x + ca * r, py = y + (0.04 + sa * r * 0.8) * lift;
      let dmin = 9;
      for (const o of cash) if (o !== c && o.alive && o.age >= 0) dmin = Math.min(dmin, Math.hypot(o.p.x - px, o.p.y - py));
      if (dmin > bestD) { bestD = dmin; c.p.set(px, py, -0.05 + 0.35 * rnd()); }
    }
    const sp = 0.6 + 1.3 * rnd();
    c.v.set(ca * sp * (1.25 - 0.25 * lift), vyMax * (0.42 + 0.58 * sa) * (0.5 + 0.5 * rnd()), -0.25 + 0.9 * rnd());
  }
  function stepCash(dt) {
    const floor = camF.y - camD * tanV * 1.45;
    poseCam(camP);                                   // the steady view (a crash's shake must not let money through the lid)
    for (const c of cash) {
      if (!c.alive) continue;
      c.age += dt;
      if (c.age < 0) continue;
      if (c.burst) popBurst(c);
      if (c.age > c.hang) {
        c.v.y -= G * dt;
        c.v.multiplyScalar(Math.exp(-0.5 * dt));
      } else c.v.multiplyScalar(Math.exp(-4 * dt));
      c.spin *= Math.exp(-0.25 * dt);
      const py = c.p.y;
      c.p.addScaledVector(c.v, dt);
      c.rz += c.spin * dt;
      // always behind the sign: never nearer the camera than the counter and the name
      const dep = _d.copy(c.p).sub(camP).dot(FWD);
      if (posed && dep < DOV + 0.45) { c.p.addScaledVector(FWD, DOV + 0.45 - dep); if (c.v.dot(FWD) < 0) c.v.addScaledVector(FWD, -c.v.dot(FWD)); }
      // ... and never up into the counter: under the top of the chart band the air thickens (money rising into it
      // slows at its own height, never lines up), and a lid at the very top is the last resort
      if (posed) {
        const dz = Math.max(0.1, _d.copy(c.p).sub(camP).dot(FWD)), over = (_d.dot(UP) + 0.6 * c.s * CASH_H) / dz / tanV - (chartHi - 0.025);
        if (over > -0.14 && c.v.y > 0) c.v.y *= Math.exp(-dt * 40 * (over + 0.14) / 0.14);
        if (over > 0) { c.p.addScaledVector(UP, -over * dz * tanV); c.v.y = Math.min(c.v.y, 0); }
      }
      // the chart is a floor: a couple of bounces, then it slips off the front edge
      if (!c.free && c.v.y < 0 && Math.abs(c.p.z) < 0.32) {
        const L = lineAt(c.p.x);
        if (L) {
          const r = 0.1, top = L.y + HT * Math.sqrt(1 + L.slope * L.slope);
          if (c.p.y - r < top && py - r >= top - 0.12) {
            c.p.y = top + r;
            c.v.y = -c.v.y * 0.38 + 0.3;
            c.v.x += (-L.slope / Math.sqrt(1 + L.slope * L.slope)) * 0.9;
            c.spin += (rnd() < 0.5 ? -1 : 1) * (4 + 5 * rnd());
            if (++c.bounces >= 2) { c.free = true; c.v.z += 0.9; }
          }
        }
      }
      if (c.p.y < floor || c.age > 9) c.alive = false;
    }
  }
  const cEul = new THREE.Euler(0, 0, 0, 'YXZ'), cS = new V3();
  function poseCash() {
    // the live ones are packed to the front of each pool and only those are drawn
    cashG.count = 0; cashY.count = 0;
    for (const c of cash) {
      let k = 0;
      if (c.alive && c.age >= 0) {
        k = c.age < 0.34 ? Math.max(0, outBack(c.age / 0.34, 2.4)) : 1;
        // below the chart it drops into the sign: shrinks away behind the ticker instead of glinting through the blocks
        if (posed) {
          _d.copy(c.p).sub(camera.position);
          const ny = _d.dot(UP) / Math.max(0.1, _d.dot(FWD)) / tanV;
          k *= clamp((ny - chartLo + 0.1) / 0.14, 0, 1);
        }
      }
      if (k < 0.01) continue;
      cEul.set(PITCH + c.r0.x + 0.22 * Math.sin(c.age * c.fx + c.phx), YAW + c.r0.y + 0.38 * Math.sin(c.age * c.fy + c.phy), c.rz, 'YXZ');
      q0.setFromEuler(cEul);
      mtx.compose(c.p, q0, cS.setScalar(c.s * k));
      c.im.setMatrixAt(c.im.count++, mtx);
    }
    cashG.instanceMatrix.needsUpdate = true; cashY.instanceMatrix.needsUpdate = true;
  }

  // =====================================================================================================================
  // THE COUNTER: $1,284,551 in money green, an odometer (camera-fixed, top)
  // =====================================================================================================================
  const counter = new THREE.Group(); camera.add(counter);
  const counterIn = new THREE.Group(); counter.add(counterIn);
  const CD = 0.26, CB = 0.035, CSIDE = [0.27, 0.27, 0.27];
  const DIG = Array.from({ length: 10 }, (_, d) => bake(THREE, glyphGeo(String(d), CD, CB), [1, 1, 1], CSIDE));
  const COMMA = bake(THREE, glyphGeo(',', CD, CB), [1, 1, 1], CSIDE), DOLLAR = bake(THREE, glyphGeo('$', CD, CB), [1, 1, 1], CSIDE);
  const DW = 0.6, CW = 0.3, SW = 0.62;               // cell widths: digit (tabular), comma, $
  const MAXD = 12, dslots = [], cslots = [];
  for (let k = 0; k < MAXD; k++) {
    const a = new THREE.Mesh(DIG[0], M.counter), b = new THREE.Mesh(DIG[0], M.counter);
    b.visible = false;
    const g = new THREE.Group(); g.add(a, b); counterIn.add(g);
    dslots.push({ g, a, b, cur: -1, p: 0, v: 0, T: 0, rate: 0 });
  }
  for (let j = 0; j < 3; j++) { const m = new THREE.Mesh(COMMA, M.counter); counterIn.add(m); cslots.push(m); }
  const dollar = new THREE.Mesh(DOLLAR, M.counter); counterIn.add(dollar);
  let nDigits = 0, counterW = 1, lastAmount = 0;
  const AMOUNT_K = 165000;
  let amountBase = 1284551;
  function layoutCounter(nd) {
    nDigits = nd;
    let x = 0;
    for (let k = 0; k < MAXD; k++) {
      const s = dslots[k];
      s.g.visible = k < nd;
      if (k >= nd) continue;
      if (k > 0 && k % 3 === 0) { const c = cslots[k / 3 - 1]; c.visible = true; c.position.set(x - CW / 2 + 0.04, -0.02, 0); x -= CW; }
      s.g.position.set(x - DW / 2, 0, 0); x -= DW;
    }
    for (let j = 0; j < 3; j++) if ((j + 1) * 3 >= nd) cslots[j].visible = false;
    dollar.position.set(x - SW / 2 - 0.02, 0, 0); x -= SW;
    counterW = -x;
    counterIn.position.x = counterW / 2;
    if (fitW) fit(fitW, fitH);
  }
  // each digit is a drum: p is its position (digits, unbounded), T where it is going; a change in the amount moves T
  // the way the money went (up rolls forward, down rolls back), and p follows on a slightly loose spring
  function setAmount(v) {
    const n = Math.max(0, Math.floor(v));
    const str = String(n), nd = str.length;
    if (nd !== nDigits) layoutCounter(nd);
    const dir = n >= lastAmount ? 1 : -1;
    for (let k = 0; k < nd; k++) {
      const d = str.charCodeAt(nd - 1 - k) - 48, s = dslots[k];
      if (s.cur < 0) { s.cur = d; s.p = s.T = d; s.v = 0; }
      else if (d !== s.cur) { s.T += dir > 0 ? (d - s.cur + 10) % 10 : -((s.cur - d + 10) % 10); s.cur = d; s.rate += 1; }
    }
    lastAmount = n;
  }
  // the drum seen head-on: the old digit slides out over the top while it squashes away, the new one comes up from below
  // as it grows (both always inside the digit's cell, never edge-on). Digits changing faster than a roll just run.
  function poseCounter(dt) {
    const decay = Math.exp(-dt * 5);
    for (let k = 0; k < nDigits; k++) {
      const s = dslots[k];
      s.rate *= decay;
      if (dt === 0 || s.rate > 1.5) { s.p = s.T; s.v = 0; }
      else {
        if (Math.abs(s.T - s.p) > 1.4) s.p = s.T - Math.sign(s.T - s.p) * 1.4;     // never a long spin: it skips ahead
        for (let i = 0; i < 2; i++) { const h = dt / 2; s.v += (700 * (s.T - s.p) - 29 * s.v) * h; s.p += s.v * h; }
        if (Math.abs(s.T - s.p) < 2e-3 && Math.abs(s.v) < 0.03) { s.p = s.T; s.v = 0; }
      }
      if (s.p === s.T && Math.abs(s.T) > 1000) { const o = Math.round(s.T / 10) * 10; s.T -= o; s.p -= o; }
      const fl = Math.floor(s.p + 1e-6), f = clamp(s.p - fl, 0, 1), i0 = ((fl % 10) + 10) % 10;
      // the last few percent of a roll (and the spring's overshoot) show as the settled digit bumping past its seat,
      // never as a sliver of the next one
      if (f < 0.25 || f > 0.75) {
        const off = f < 0.5 ? f : f - 1;
        s.a.geometry = DIG[f < 0.5 ? i0 : (i0 + 1) % 10]; s.a.position.y = CAP * 0.4 * off; s.a.scale.y = 1; s.a.rotation.x = -0.5 * off; s.b.visible = false;
        continue;
      }
      s.a.geometry = DIG[i0]; s.a.scale.y = 1 - f; s.a.position.y = (CAP * f) / 2; s.a.rotation.x = -0.3 * f;
      s.b.geometry = DIG[(i0 + 1) % 10]; s.b.scale.y = f; s.b.position.y = (-CAP * (1 - f)) / 2; s.b.rotation.x = 0.3 * (1 - f);
      s.b.visible = true;
    }
  }

  // =====================================================================================================================
  // THE NAME: WALL STREET on a ticker LED strip, WARS in heavy blocks (camera-fixed, bottom)
  // =====================================================================================================================
  const nameRoot = new THREE.Group(); camera.add(nameRoot);
  // -- the strip (1 unit = 1 LED pitch)
  const strip = new THREE.Group(); nameRoot.add(strip);
  const ST = 'WALL STREET', PADC = 2, PADR = 1;
  const SCOLS = ST.length * 6 - 1 + 2 * PADC, SROWS = 7 + 2 * PADR;
  const litCells = [], offCells = [];
  for (let r = 0; r < SROWS; r++) for (let c = 0; c < SCOLS; c++) {
    const tc = c - PADC, tr = r - PADR, ch = ST[Math.floor(tc / 6)];
    const on = tc >= 0 && tr >= 0 && tr < 7 && tc % 6 < 5 && ch && LED[ch][tr][tc % 6] === 'X';
    (on ? litCells : offCells).push({ x: c - (SCOLS - 1) / 2, y: (SROWS - 1) / 2 - r, c });
  }
  const BW = SCOLS + 0.9, BH = SROWS + 0.9, BBEV = 0.35;
  const boardGeo = (() => {
    const w = BW, h = BH, rr = 0.9, sh = new THREE.Shape();
    sh.moveTo(-w / 2 + rr, -h / 2); sh.lineTo(w / 2 - rr, -h / 2); sh.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + rr);
    sh.lineTo(w / 2, h / 2 - rr); sh.quadraticCurveTo(w / 2, h / 2, w / 2 - rr, h / 2); sh.lineTo(-w / 2 + rr, h / 2);
    sh.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - rr); sh.lineTo(-w / 2, -h / 2 + rr); sh.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + rr, -h / 2);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 1.0, bevelEnabled: true, bevelThickness: BBEV, bevelSize: BBEV, bevelSegments: 1, curveSegments: 2 });
    g.translate(0, 0, -1.0 - BBEV);
    return g;
  })();
  const board = new THREE.Mesh(boardGeo, M.board); strip.add(board);
  const offGeo = new THREE.PlaneGeometry(0.56, 0.56);
  const offLeds = new THREE.InstancedMesh(offGeo, M.ledOff, offCells.length);
  const litGeo = new THREE.BoxGeometry(0.72, 0.72, 0.3);
  const litLeds = new THREE.InstancedMesh(litGeo, M.led, litCells.length);
  offCells.forEach((c, i) => { mtx.makeTranslation(c.x, c.y, 0.02); offLeds.setMatrixAt(i, mtx); });
  litCells.forEach((c, i) => { mtx.makeTranslation(c.x, c.y, 0.15); litLeds.setMatrixAt(i, mtx); litLeds.setColorAt(i, COL.ledOn); });
  strip.add(offLeds, litLeds);
  // -- WARS blocks (1 unit = 1 block pitch)
  const wars = new THREE.Group(); nameRoot.add(wars);
  const WT = 'WARS', BCOLS = WT.length * 8 - 1, BROWS = 9;
  const blocks = [];
  for (let li = 0; li < WT.length; li++) {
    const gl = BLOCK[WT[li]];
    for (let r = 0; r < BROWS; r++) for (let c = 0; c < 7; c++) if (gl[r][c] === 'X') {
      const col = li * 8 + c;
      blocks.push({ x: col - (BCOLS - 1) / 2, y: (BROWS - 1) / 2 - r, col, row: r, li, z: 0, vz: 0, glow: 0, kickAt: -1 });
    }
  }
  // each letter lights as one key under the pointer (a clean state, not a patchwork of springs)
  const letters = Array.from(WT, (_, li) => ({ x0: li * 8 - (BCOLS - 1) / 2 - 0.5, x1: li * 8 + 6 - (BCOLS - 1) / 2 + 0.5, glow: 0 }));
  const blockGeo = (() => {
    const s = 0.85, b = 0.12, d = 1.1, h = s / 2 - b, sh = new THREE.Shape();
    sh.moveTo(-h, -h); sh.lineTo(h, -h); sh.lineTo(h, h); sh.lineTo(-h, h); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 1, curveSegments: 1 });
    g.translate(0, 0, -(d - 2 * b) - b);              // front face at z = 0
    return g;
  })();
  const blockMesh = new THREE.InstancedMesh(blockGeo, [M.bFace, M.bSide], blocks.length);
  blocks.forEach((b, i) => blockMesh.setColorAt(i, COL.ink));
  wars.add(blockMesh);

  // name layout (strip units): strip on top, WARS under it, the same width
  const WARS_SCALE = (SCOLS - 0.5) / BCOLS;
  const GAP = 1.5;
  const SH = BH + 2 * BBEV;
  const NAME_W = BW + 2 * BBEV, NAME_H = SH + GAP + BROWS * WARS_SCALE;
  strip.position.set(0, NAME_H / 2 - SH / 2, 0);
  wars.scale.setScalar(WARS_SCALE);
  wars.position.set(0, -NAME_H / 2 + (BROWS * WARS_SCALE) / 2, 0);

  // =====================================================================================================================
  // FRAMING
  // =====================================================================================================================
  let counterScale = 1, nameScale = 1, counterY = 0, fitW = 0, fitH = 0;
  const ndcY = (p) => p.y / Math.max(0.01, -p.z) / tanV;
  function fit(w, h) {
    fitW = w; fitH = h;
    aspect = w / Math.max(1, h);
    camera.aspect = aspect; camera.updateProjectionMatrix();
    hh = DOV * tanV; hw = hh * aspect;          // the overlays sit nearer the camera than the chart: money falls behind the sign
    // the counter across the top
    const cMaxW = 2 * hw * 0.8, cMaxH = 2 * hh * 0.094;
    counterScale = Math.min(cMaxW / Math.max(counterW, 6.2), cMaxH / CAP);   // ($1,284,551 is 5.4 wide: one more digit still fits)
    counter.scale.setScalar(counterScale);
    counterY = hh - 2 * hh * 0.045 - (CAP * counterScale) / 2;
    counter.position.set(0, counterY, -DOV);
    counter.rotation.set(0.1, -0.1, 0);
    // the name across the bottom: a compact two-line lockup, under a quarter of the stage
    const nMaxW = 2 * hw * 0.84, nMaxH = 2 * hh * 0.225;
    nameScale = Math.min(nMaxW / NAME_W, nMaxH / NAME_H);
    nameRoot.scale.setScalar(nameScale);
    nameRoot.position.set(0, -hh + 2 * hh * 0.05 + (NAME_H * nameScale) / 2, -DOV);
    nameRoot.rotation.set(-0.16, -0.08, 0);
    // the chart lives between them: measured on screen, since both are tilted toward us
    counter.updateMatrix(); nameRoot.updateMatrix();
    let cb = 9, nt = -9;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      cb = Math.min(cb, ndcY(_p.set((sx * counterW) / 2, (-CAP / 2) * 1.08, sz * (CD / 2 + CB)).applyMatrix4(counter.matrix)));
      nt = Math.max(nt, ndcY(_p.set((sx * NAME_W) / 2, NAME_H / 2, sz > 0 ? BBEV : -1.0 - 2 * BBEV).applyMatrix4(nameRoot.matrix)));
    }
    chartHi = cb - 0.04; chartLo = nt + 0.045;
    bandNY = lerp(chartLo, chartHi, 0.5);
    headNX = 0.24;
  }

  // =====================================================================================================================
  // THE FILM
  // =====================================================================================================================
  function simulate(dt) {
    stepMarket(dt);
    stepHead(dt);
    stepCam(dt);
    stepCash(dt);
    // effects
    fx.heat = Math.max(leg.kind === 'dip' ? 1 : 0, fx.heat - dt * (fx.heat > 0.6 ? 1.2 : 3.5));   // holds, then lets go quickly
    fx.shake *= Math.exp(-7 * dt); fx.shakeT += dt;
    fx.pulseV += (-140 * fx.pulse - 2 * 0.3 * Math.sqrt(140) * fx.pulseV) * dt; fx.pulse += fx.pulseV * dt;
    fx.liftV += (-60 * fx.lift - 2 * 0.45 * Math.sqrt(60) * fx.liftV) * dt; fx.lift += fx.liftV * dt;
    fx.punchV += (-90 * fx.punch - 2 * 0.32 * Math.sqrt(90) * fx.punchV) * dt; fx.punch += fx.punchV * dt;
    fx.sweepRed = Math.max(0, fx.sweepRed - dt * 1.3);
    fx.flash = Math.max(0, fx.flash - dt * 2.6);
    if (fx.sweep >= 0) { fx.sweep += dt * 1.6; if (fx.sweep > 1.4) fx.sweep = -1; }
    if (fx.wave >= 0) { fx.wave += dt; if (fx.wave > 1.5) fx.wave = -1; }
  }

  // the opening (and the still for reduced motion): well into a rally, the arrow halfway up a greedy leg, money in the air
  tip.x = 0; tip.y = 0; head.x = 0; head.y = 0;
  for (let i = 0; i < 6 * 60 || !(leg.kind === 'up' && leg.t / leg.dur > 0.58 && segs.slice(-7).every((s) => s.kind !== 'dip')); i++) simulate(1 / 60);
  amountBase = 1284551 - AMOUNT_K * priceY;
  fx.pulse = fx.pulseV = fx.lift = fx.liftV = fx.punch = fx.punchV = fx.shake = fx.heat = fx.flash = fx.sweepRed = 0; fx.sweep = fx.wave = -1;
  setAmount(amountBase + AMOUNT_K * priceY);
  for (const s of dslots) { s.p = s.T; s.v = 0; s.rate = 0; }
  // a composed handful of $ around the arrow (offsets from the arrow, kept under the counter; gold every third).
  // [dx, dy, dz, tilt, turn (both off the camera's facing), spin, size, vy]
  const OPEN = [
    [-0.95, 0.2, 0.3, 0.12, -0.3, 0.2, 0.3, -0.4], [-0.52, 0.42, 0.5, -0.1, 0.32, -0.3, 0.27, -0.1], [-0.16, 0.06, 0.75, 0.08, 0.18, 0.12, 0.34, -0.7],
    [0.16, 0.38, 0.35, 0.1, -0.34, 0.35, 0.29, 0.2], [0.42, -0.16, 0.85, -0.06, 0.26, -0.4, 0.31, -1.0], [-1.3, -0.1, 0.1, 0.14, 0.3, 0.5, 0.24, -0.5],
    [-0.68, -0.3, 0.65, -0.12, -0.2, 0.7, 0.28, -0.9],
  ];
  function openStill() {
    // settle the framing for this stage's band first (the market holds still)
    const vx = tip.vx; tip.vx = 0;
    for (let i = 0; i < 150; i++) stepCam(1 / 60, true);
    tip.vx = vx; camV.set(tip.vx, 0, 0); camDV = 0;
    const top = camF.y + (chartHi - 0.16 - bandNY) * camD * tanV;
    for (const c of cash) c.alive = false;
    OPEN.forEach(([dx, dy, dz, tx, ry, rz, size, vy], i) => {
      const c = cash[i];
      c.alive = true; c.age = 1; c.hang = 0; c.bounces = 0; c.free = false; c.burst = null;
      c.s = (size * 0.84) / CASH_H;
      c.p.set(head.x + dx, Math.min(top - (0.4 - dy) * 0.25, head.y + dy), dz); c.v.set(dx * 0.2, vy, 0);
      flutter(c, tx, ry, rz, (rnd() < 0.5 ? -1 : 1) * (0.8 + 1.6 * rnd()));
      c.phx = -c.fx; c.phy = -c.fy;                 // the rock is at rest in the still: the authored angles show as written
    });
  }
  let opened = false;
  airT = 0.35;

  // ---- per-frame posing
  const tmpC = new THREE.Color();
  let pointerLocal = null;
  const invName = new THREE.Matrix4(), mWars = new THREE.Matrix4(), rayO = new V3(), rayD = new V3();
  function pointerOnWars(input) {
    if (!input.inside) return null;
    // ray from the camera through the pointer, in camera space, against the WARS plane
    nameRoot.updateMatrix(); wars.updateMatrix();
    mWars.multiplyMatrices(nameRoot.matrix, wars.matrix);
    invName.copy(mWars).invert();
    const o = rayO.set(0, 0, 0).applyMatrix4(invName), d = rayD.set(input.x * tanV * aspect, input.y * tanV, -1).transformDirection(invName);
    if (Math.abs(d.z) < 1e-5) return null;
    const t = -o.z / d.z;
    return t > 0 ? { x: o.x + d.x * t, y: o.y + d.y * t } : null;
  }

  function poseName(dt, hv) {
    // LEDs: green, a faint refresh scan every few seconds; a bright sweep after a spike; red on a crash
    const scan = lerp(-SCOLS / 2 - 8, SCOLS / 2 + 8, ((time * 0.22) % 1.6) / 1.6 * 1.6 - 0.3);
    for (let i = 0; i < litCells.length; i++) {
      const c = litCells[i];
      let b = 0.84 + 0.16 * hv + 0.18 * Math.max(0, 1 - Math.abs(c.x - scan) / 4);
      if (fx.sweep >= 0) { const sx = lerp(-SCOLS / 2 - 6, SCOLS / 2 + 6, fx.sweep / 1.4); b += 0.6 * Math.max(0, 1 - Math.abs(c.x - sx) / 5); }
      // a crash turns the board red; it comes back green the way an LED display does: off for a beat, then on
      const r = fx.sweepRed;
      tmpC.copy(r > 0.35 ? COL.ledRed : COL.ledOn).multiplyScalar(b * clamp(Math.abs(r - 0.35) * 9, 0, 1));
      litLeds.setColorAt(i, tmpC);
    }
    litLeds.instanceColor.needsUpdate = true;
    // WARS: under the pointer the whole letter lights money green and lifts like a key, as one; a spike sends a crisp
    // green band across the word; a crash punches it down (and flashes it red)
    const pl = pointerLocal;
    for (const L of letters) {
      const on = pl && pl.x > L.x0 - 0.6 && pl.x < L.x1 + 0.6 && Math.abs(pl.y) < BROWS / 2 + 1 ? hv : 0;
      L.glow += (on - L.glow) * Math.min(1, dt * 14);
    }
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i], L = letters[b.li];
      let target = 0;
      if (L.glow > 1e-3) target = L.glow * 0.55;
      if (fx.wave >= 0 && b.kickAt < 0) { const at = (b.col / BCOLS) * 0.5 + (b.row / BROWS) * 0.04; if (fx.wave >= at) { b.vz += 6; b.glow = 1; b.kickAt = 1; } }
      if (fx.wave < 0) b.kickAt = -1;
      const k = 190, c = 2 * 0.36 * Math.sqrt(k);
      b.vz += (k * (target - b.z) - c * b.vz) * dt; b.z += b.vz * dt;
      b.glow = Math.max(0, b.glow - dt * 2.4);
      const h = b.z;
      vP.set(b.x, b.y + 0.12 * h + fx.punch * 0.12 * (1 + 0.6 * Math.sin(b.col * 2.1)), 0.7 * h);
      eul.set(-0.18 * h + fx.punch * 0.05 * Math.sin(b.col * 1.7 + b.row), 0, fx.punch * 0.04 * Math.cos(b.col * 1.3));
      q0.setFromEuler(eul);
      mtx.compose(vP, q0, vS);
      blockMesh.setMatrixAt(i, mtx);
      tmpC.copy(COL.ink).lerp(COL.green, Math.max(L.glow * 0.94, smooth(0.3, 0.6, b.glow) * 0.94));
      blockMesh.setColorAt(i, tmpC);
    }
    blockMesh.instanceMatrix.needsUpdate = true;
    blockMesh.instanceColor.needsUpdate = true;
    M.bFace.emissive.copy(COL.red).multiplyScalar(0.95 * fx.flash * fx.flash);
  }

  const idle = { x: 0, y: 0, hover: 0, inside: false, clicked: false, down: false };
  return {
    scene, camera,
    resize(w, h) {
      fit(w, h);
      if (!opened) { opened = true; openStill(); }
    },
    update(dt, t, input = idle) {
      time += dt;
      if (input.rect) { lastRect = input.rect; lastVisible = input.visible ?? 1; }
      const hv = reduced ? 0 : input.hover;
      if (dt > 0) {
        wild += (hv - wild) * Math.min(1, dt * 2.5);
        if (input.clicked && leg && leg.kind !== 'spike') {
          // cut the current leg where the arrow is and go straight up
          liveSeg.bx = tip.x; liveSeg.by = tip.y;
          leg = null;
          legs.unshift({ kind: 'spike', dx: 0.22, dy: 0.95, dur: 0.32, ease: 'rocket', fixed: true }, { kind: 'pull', dx: 0.36, dy: -0.3, dur: 0.4, ease: 'drift' });
          clickSpike = true; startLeg(legs.shift()); clickSpike = false;
          burst(5);
          tug(0.7, 'click');
        }
        simulate(dt);
        setAmount(amountBase + AMOUNT_K * priceY);
      }
      pointerLocal = reduced ? null : pointerOnWars(input);
      poseCounter(dt);
      // the counter: money green, red on a crash; it bumps on spikes and rides the price a little
      // (a switch, never a blend: half-way between money green and red is brown)
      const hot = fx.heat > 0.5;
      M.counter.color.copy(hot ? COL.red : COL.green);
      M.counter.emissive.copy(COL.red).multiplyScalar(hot ? 0.3 * fx.heat : 0);
      const pul = 1 + 0.07 * fx.pulse;
      counter.scale.setScalar(counterScale * pul);
      counter.position.y = counterY + hh * 0.025 * fx.lift + hh * 0.01 * fx.punch;
      counter.position.x = fx.shake * 0.6 * Math.sin(fx.shakeT * 71);
      // the arrow and its neck (the neck turns red with the head)
      drawSeg(liveSeg);
      const ca = Math.cos(head.ang), sa = Math.sin(head.ang);
      const red = head.red > 0.5;
      writeSeg(NECK, tip.x, tip.y, head.x + ca * 0.08, head.y + sa * 0.08, nrm(leg.dx, leg.dy), nrm(ca, sa), red ? COL.red : leg.kind === 'dip' ? COL.green : segColor(leg.kind));
      arrow.position.set(head.x, head.y, 0);
      arrow.rotation.set(0, 0, head.ang);
      arrowMesh.scale.set(1 + head.sq * 0.5 + 0.04 * Math.min(4, Math.hypot(tip.vx, tip.vy)), 1 - head.sq * 0.35, 1);
      M.head.color.copy(red ? COL.red : COL.green);
      M.head.emissive.copy(COL.red).multiplyScalar(red ? 0.3 : 0);
      poseCash();
      poseName(dt, hv);
      // camera: ride the arrow, shake on a crash, lean toward the pointer
      poseCam(camera.position);
      camera.position.addScaledVector(RIGHT, fx.shake * Math.sin(fx.shakeT * 63) + 0.12 * input.x * hv);
      camera.position.addScaledVector(UP, fx.shake * 0.45 * Math.sin(fx.shakeT * 49 + 1.3) + 0.08 * input.y * hv);
      posed = true;
      fadeRibbon();
      ribGeo.attributes.position.needsUpdate = true; ribGeo.attributes.color.needsUpdate = true;
    },
    dispose() {
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      [...DIG, COMMA, DOLLAR, cashGeoG, cashGeoY, headGeo, blockGeo, litGeo, offGeo, boardGeo, ribGeo].forEach((g) => g.dispose());
      Object.values(M).forEach((m) => m.dispose());
      litLeds.dispose(); offLeds.dispose(); blockMesh.dispose(); cashG.dispose(); cashY.dispose();
      envDark.dispose(); envBright.dispose();
    },
  };
}
