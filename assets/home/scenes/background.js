// The page background: one big living web off-centre (upper right on desktop, upper area on phones), a smaller partial
// web in the opposite corner, and a small low-poly spider that lives on the big one. Orthographic camera, 1 world unit
// = 1 CSS px, world y = -(viewport y + parallax shift). Light grey silk so the black type and the game stages read on top.
//
// Alive: slow wind sway; the cursor pushes threads aside (they slip off and twang); random tremors travel along the
// threads; a click plucks the web; stage.emit('tug', { strength 0..1, x, y }) (viewport CSS px of something struggling in
// its own web) makes the web shudder from that side; the spider rests head-down at the hub, wanders in bursts along the
// threads, flees the cursor, comes to look at plucks, and sometimes drops on a dragline toward a tugging stage.
// The page scrolls over it with a gentle parallax (15% of scrollY, softly capped).
import { createWeb, createSilkLines, rng } from '../web.js';

const PARALLAX = 0.15;
const softCap = (x, m) => m * Math.tanh(x / m);
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const ease = (x) => x * x * (3 - 2 * x);
const smooth = (a, b, x) => ease(clamp((x - a) / (b - a), 0, 1));

// ── layouts: fractions of the viewport (x right, y down); anchors are kept outside every parallax position ──
function layout(w, h) {
  const P = (x, y) => [x * w, -y * h, 0];
  const phone = w < 700 || h > w * 1.15;
  if (!phone) {
    return {
      phone,
      main: {
        hub: P(0.735, 0.3),
        frame: [P(0.47, -0.05), P(1.06, -0.1), P(1.09, 0.62), P(0.9, 1.18), P(0.45, 1.0), P(0.31, 0.44)],
        moorings: [[0, P(0.37, -0.35)], [0, P(0.6, -0.4)], [1, P(1.2, -0.3)], [2, P(1.3, 0.7)], [3, P(1.0, 1.75)],
          [4, P(0.22, 1.7)], [4, P(0.52, 1.75)], [5, P(-0.08, 0.3)], [5, P(-0.06, 0.7)]],
        spokes: 32, spacing: clamp(Math.min(w, h) * 0.024, 15, 26), width: 1.0,
      },
      corner: {
        hub: P(0.085, 0.94),
        frame: [P(-0.04, 0.5), P(0.44, 1.7), P(-0.04, 1.7)],
        spokes: 20, spacing: clamp(Math.min(w, h) * 0.02, 13, 20), width: 0.9,
      },
      spider: 1.4, poke: 52, flee: 95,
    };
  }
  return {
    phone,
    main: {
      // the hub sits in the gap under the header, so the spider hangs above the headline instead of hiding in it
      hub: [0.7 * w, -clamp(0.135 * h, 96, 124), 0],
      frame: [P(-0.12, -0.05), P(1.14, -0.07), P(1.2, 0.44), P(0.82, 0.7), P(-0.14, 0.58)],
      moorings: [[2, P(1.45, 0.6)], [3, P(1.35, 1.2)], [3, P(0.42, 1.75)], [4, P(-0.35, 0.8)]],
      spokes: 24, spacing: 15, width: 0.95,
    },
    corner: {
      hub: P(0.08, 0.98),
      frame: [P(-0.06, 0.72), P(0.62, 1.7), P(-0.06, 1.7)],
      spokes: 15, spacing: 13, width: 0.85,
    },
    spider: 1.15, poke: 40, flee: 72,
  };
}

function webOptions(cfg, seed, extra = {}) {
  const sp = cfg.spacing;
  return {
    hub: cfg.hub, frame: cfg.frame, moorings: cfg.moorings, spokes: cfg.spokes, seed,
    spiral: { spacing: sp, start: 0.155, end: 0.9, follow: 0.3, growth: 0.18 },
    hubRadius: 0.045, hubRings: 3, irregularity: 0.55, missing: 0.025, dangling: 0,
    maxSegment: sp * 1.25, width: cfg.width,
    colors: { hub: 0x959595, spoke: 0xa8a8a8, spiral: 0xbcbcbc, frame: 0x9c9c9c, moor: 0x8f8f8f, hubring: 0xadadad },
    widths: { hub: 1.1, spoke: 1.15, spiral: 0.9, frame: 1.45, moor: 1.6, hubring: 0.9 },
    waveColor: 0x5c5c5c, wave: { glint: 1.4 },
    sheen: { amount: 0.55, angle: 0.55, speed: 0.045 },
    // the capture spiral thins out toward the frame, so the web dissolves into the page instead of ending on a rim
    style: (q) => (q.kind === 2 || q.kind === 1 ? { alpha: 1 - 0.42 * smooth(0.5, 1.05, q.r) } : null),
    wind: { amp: 4.5, speed: 1 },
    gravity: 900, memory: 0.05, damping: 0.05, iterations: 5,
    ...extra,
  };
}

export async function create({ THREE, stage, reduced }) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, 100, 0, -100, -400, 400);
  camera.position.set(0, 0, 200);
  const sun = new THREE.DirectionalLight(0xffffff, 2.6);
  sun.position.set(-0.45, 0.7, 1);
  const rim = new THREE.DirectionalLight(0xffffff, 0.9);
  rim.position.set(0.8, -0.4, 0.6);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3a3a, 1.3), sun, rim);

  let W = 0, H = 0, builtW = 0, builtH = 0, L = null;
  let main = null, corner = null, spider = null;
  let shift = 0;
  const rand = rng(91);
  const tugs = [];
  let tremorT = 1.2, lastPtr = null;
  const pv = { x: 0, y: 0 };

  function build(w, h) {
    teardown();
    L = layout(w, h);
    builtW = w; builtH = h;
    main = createWeb(webOptions(L.main, 7));
    corner = createWeb(webOptions(L.corner, 23));
    scene.add(main.object, corner.object);
    spider = createSpider(THREE, main, { scale: L.spider, flee: L.flee, rand, reduced });
    scene.add(spider.group, spider.lines.object);
  }
  function teardown() {
    for (const web of [main, corner]) if (web) { scene.remove(web.object); web.dispose(); }
    if (spider) { scene.remove(spider.group, spider.lines.object); spider.dispose(); }
    main = corner = spider = null;
  }

  const offTug = stage.on('tug', (d = {}) => {
    const x = +d.x, y = +d.y;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const s = clamp(Number.isFinite(+d.strength) ? +d.strength : 0.5, 0, 2);
    let src = tugs.find((q) => Math.hypot(q.x - x, q.y - y) < 180);
    if (!src) { src = { x, y, level: 0, next: 0, near: null, nearT: 0 }; tugs.push(src); }
    src.x = x; src.y = y;
    src.level = Math.max(src.level, s);
    if (s >= 0.3 && spider) spider.noticeTug(x, -(y + shift), s);
  });

  const toWorldY = (py) => -(py + shift);
  // the stage keeps a touch point after a scroll cancels it; a lifted or scrolling finger should not haunt the web
  let touchGone = false;
  const onPDown = (e) => { if (e.pointerType === 'touch') touchGone = false; };
  const onPEnd = (e) => { if (e.pointerType === 'touch') touchGone = true; };
  const onPMove = (e) => { if (e.pointerType !== 'touch') touchGone = false; };
  addEventListener('pointerdown', onPDown, { passive: true });
  addEventListener('pointerup', onPEnd, { passive: true });
  addEventListener('pointercancel', onPEnd, { passive: true });
  addEventListener('pointermove', onPMove, { passive: true });

  function update(dt, t, input) {
    if (!main) return;
    // parallax: the canvas stays fixed, the web drifts up at a fraction of the scroll, softly capped
    const sy = typeof window !== 'undefined' ? window.scrollY || 0 : 0;
    shift = softCap(sy * PARALLAX, H * 0.5);
    camera.top = -shift; camera.bottom = -shift - H;
    camera.updateProjectionMatrix();
    const view = { x0: 0, x1: W, y0: -shift, y1: -shift - H };

    // the cursor
    const on = input.seen && !touchGone && input.px >= 0 && input.py >= 0 && input.px <= input.vw && input.py <= input.vh;
    const ptr = { on, x: input.px, y: toWorldY(input.py), speed: 0 };
    if (on && lastPtr && dt > 0) {
      // the pointer's velocity in the page (scrolling moves the web under a still pointer too), lightly smoothed
      const k = Math.min(1, dt * 30);
      pv.x += ((ptr.x - lastPtr.x) / dt - pv.x) * k; pv.y += ((ptr.y - lastPtr.y) / dt - pv.y) * k;
    } else { pv.x = 0; pv.y = 0; }
    ptr.speed = Math.hypot(pv.x, pv.y);
    lastPtr = on ? { x: ptr.x, y: ptr.y } : null;
    if (on && dt > 0) {
      const o = { vx: pv.x, vy: pv.y, max: L.poke * 0.3, dent: L.poke * 0.1, drag: 0.5 };
      main.poke(ptr.x, ptr.y, 0, L.poke, 1, o);
      corner.poke(ptr.x, ptr.y, 0, L.poke, 1, o);
    }
    if (input.clicked && on) {
      for (const web of [main, corner]) {
        const n = web.nearest(ptr.x, ptr.y, 0, { maxDist: 70 });
        if (n) { web.pluck([n.x, n.y, 0], 4.5, 26); if (web === main) spider.noticePluck(n.x, n.y); }
      }
    }

    if (dt > 0) {
      // tremors: a small insect, a breath of air, somewhere on the web
      tremorT -= dt;
      if (tremorT <= 0) {
        tremorT = 0.9 + rand() * 2.6;
        const web = rand() < 0.8 ? main : corner;
        const js = web.junctions;
        for (let k = 0; k < 8; k++) {
          const i = js[(rand() * js.length) | 0];
          const x = web.points[i * 3], y = web.points[i * 3 + 1];
          if (x < view.x0 - 40 || x > view.x1 + 40 || y > view.y0 + 40 || y < view.y1 - 40) continue;
          const big = rand() < 0.14;
          web.pluck(i, big ? 2.6 + rand() * 1.4 : 0.7 + rand() * 1.1);
          if (big) web.impulse(x, y, 0, (rand() - 0.5) * 70, (rand() - 0.5) * 70, 0, web.spacing * 3);
          break;
        }
      }
      // tugs: the side of the web nearest something struggling shudders, in proportion
      for (let k = tugs.length - 1; k >= 0; k--) {
        const q = tugs[k];
        q.level *= Math.exp(-dt * 2.6);
        if (q.level < 0.02) { tugs.splice(k, 1); continue; }
        const wx = q.x, wy = toWorldY(q.y);
        for (const web of [main, corner]) {
          const n = web.nearest(wx, wy, 0);
          if (!n) continue;
          const dx = wx - n.x, dy = wy - n.y, d = Math.hypot(dx, dy) || 1;
          const reach = clamp(1 - (d - web.radius * 0.15) / (web.radius * 1.1), 0, 1);
          if (reach <= 0) continue;
          const lv = q.level * reach * (web === main ? 1 : 0.8);
          const osc = Math.sin(t * 2 * Math.PI * 11.5 + k * 1.7) * 0.6 + Math.sin(t * 2 * Math.PI * 7.3 + k) * 0.4;
          const F = 5200 * lv * osc;
          web.force(n.x, n.y, 0, (dx / d) * F - (dy / d) * F * 0.35, (dy / d) * F + (dx / d) * F * 0.35, 0, web.radius * 0.38);
          web.force(n.x, n.y, 0, (dx / d) * 900 * lv, (dy / d) * 900 * lv, 0, web.radius * 0.5);
          if (t >= (q.next ?? 0)) web.pluck([n.x, n.y, 0], 1.4 + 3.4 * lv, web.spacing * 2.2);
        }
        if (t >= (q.next ?? 0)) q.next = t + 0.085 + rand() * 0.05;
      }
    }

    spider.think(dt, t, { ptr, view });
    main.update(dt);
    corner.update(dt);
    spider.pose(dt, t);
  }

  return {
    scene, camera,
    resize(w, h) {
      W = w; H = h;
      camera.left = 0; camera.right = w;
      camera.top = -shift; camera.bottom = -shift - h;
      camera.updateProjectionMatrix();
      // rebuild on a new width or a big height change (not for a phone's toolbar sliding in and out)
      if (!main || Math.abs(w - builtW) > 1 || Math.abs(h - builtH) > builtH * 0.22) build(w, h);
    },
    update,
    /** Lab only: the spider's state and the webs. */
    debug: () => (spider ? { ...spider.state, main, corner, shift } : null),
    dispose() {
      offTug(); teardown();
      removeEventListener('pointerdown', onPDown); removeEventListener('pointerup', onPEnd);
      removeEventListener('pointercancel', onPEnd); removeEventListener('pointermove', onPMove);
    },
  };
}

// ── the spider ───────────────────────────────────────────────────────────────────────────────────────────────────────
// Local space: forward +y, right +x, its back toward the viewer (+z). Units: about a pixel at scale 1 (×scale).
const LEGS = [ // right side, front to back (mirrored for the left)
  { hip: [1.0, 3.0], ang: 24, reach: 0.8, l1: 7.6, l2: 9.8, bend: -1 },
  { hip: [1.4, 2.4], ang: 64, reach: 0.78, l1: 7.0, l2: 9.0, bend: 1 },
  { hip: [1.4, 1.6], ang: 118, reach: 0.76, l1: 5.4, l2: 6.8, bend: -1 },
  { hip: [1.05, 1.0], ang: 157, reach: 0.8, l1: 6.6, l2: 8.6, bend: 1 },
];
const HIP_Z = 2.0, SWING = 0.42, SPIN = [0, -7.0], STRIDE = 11;

function spiderBody(THREE, rand) {
  const g = new THREE.Group();
  const black = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.32, metalness: 0.35, flatShading: true });
  const lumpy = (geo, sx, sy, sz, j, taper) => {
    const p = geo.attributes.position;
    const seen = new Map();
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const key = `${x.toFixed(3)},${y.toFixed(3)},${z.toFixed(3)}`;
      if (!seen.has(key)) seen.set(key, 1 + (rand() - 0.5) * j);
      const k = seen.get(key);
      const tp = taper ? 1 - taper * Math.max(0, y) : 1;
      p.setXYZ(i, x * sx * k * tp, y * sy * k, (z > 0 ? z * 1.0 : z * 0.55) * sz * k);
    }
    geo.computeVertexNormals();
    return geo;
  };
  const abd = new THREE.Mesh(lumpy(new THREE.IcosahedronGeometry(1, 1), 3.05, 3.85, 2.4, 0.07, 0.14), black);
  const abdPivot = new THREE.Group();
  abdPivot.position.set(0, -0.15, 0);
  abd.position.set(0, -3.4, HIP_Z + 0.3);
  const ceph = new THREE.Mesh(lumpy(new THREE.IcosahedronGeometry(1, 1), 1.7, 2.15, 1.25, 0.08, 0.12), black);
  ceph.position.set(0, 2.05, HIP_Z);
  const ped = new THREE.Mesh(new THREE.OctahedronGeometry(0.7, 0), black);
  ped.position.set(0, -0.15, HIP_Z);
  ped.scale.set(0.9, 1.2, 0.6);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2414, toneMapped: false });
  const eyeGeo = new THREE.OctahedronGeometry(0.42, 0);
  const eyes = [-1, 1].map((s) => { const e = new THREE.Mesh(eyeGeo, eyeMat); e.position.set(s * 0.52, 3.75, HIP_Z + 1.05); return e; });
  // the redback's mark: a slim red hourglass down the back of the abdomen
  const sh = new THREE.Shape();
  sh.moveTo(0, 2.3); sh.lineTo(0.62, 1.1); sh.lineTo(0.18, 0.05); sh.lineTo(0.7, -1.3); sh.lineTo(0, -2.5);
  sh.lineTo(-0.7, -1.3); sh.lineTo(-0.18, 0.05); sh.lineTo(-0.62, 1.1); sh.closePath();
  const markMat = new THREE.MeshBasicMaterial({ color: 0x7c080b });
  const mark = new THREE.Mesh(new THREE.ShapeGeometry(sh), markMat);
  mark.position.set(0, -3.45, HIP_Z + 0.3 + 2.45);
  abdPivot.add(abd, mark);
  g.add(abdPivot, ceph, ped, ...eyes);
  return { group: g, abd, abdPivot, mats: [black, eyeMat, markMat], geos: [abd.geometry, ceph.geometry, ped.geometry, eyeGeo, mark.geometry] };
}

function createSpider(THREE, web, { scale: sc = 1, flee: fleeR = 90, rand, reduced }) {
  const body = spiderBody(THREE, rand);
  const group = new THREE.Group();
  group.add(body.group);
  group.scale.setScalar(sc);
  // 8 legs × 3 bones (femur, tibia, metatarsus: thick to thin), 2 palps, 1 dragline
  const lines = createSilkLines(27, { color: 0x151515, width: 1.0 * sc, minPx: 1.2, renderOrder: 4 });
  const PALP = 24, DRAG = 26;
  lines.style(DRAG, { color: 0x8f8f8f, width: 0.9 });
  const legs = [];
  for (const side of [1, -1]) {
    LEGS.forEach((d, k) => {
      const a = (d.ang * Math.PI) / 180;
      const reach = d.reach * (d.l1 + d.l2);
      legs.push({
        side, pair: k, l1: d.l1 * sc, l2: d.l2 * sc, bend: d.bend * side,
        group: (k % 2) ^ (side > 0 ? 0 : 1),
        hip: [d.hip[0] * side, d.hip[1]],
        rest: [d.hip[0] * side + Math.sin(a) * reach * side, d.hip[1] + Math.cos(a) * reach],
        plant: null, foot: [0, 0, 0], from: [0, 0, 0], swing: -1, idle: null, tgt: null,
      });
    });
  }
  const st = {
    mode: 'rest', // rest | walk | drop
    x: 0, y: 0, heading: -Math.PI / 2, node: web.hub,
    restT: 4 + rand() * 4, tapT: 1.5 + rand() * 2,
    walk: null, reason: '', speed: 0, phase: 0.45,
    lastFlee: -9, tugCool: 0, look: null, lookT: 0,
    drop: null, settle: null, sway: 0, prevHeading: null,
  };
  const P = new THREE.Vector3();
  web.node(web.hub, P);
  st.x = P.x; st.y = P.y;

  // ── helpers ──
  const fwd = () => [Math.cos(st.heading), Math.sin(st.heading)];
  const toWorld = (lx, ly, out) => {
    const c = Math.cos(st.heading), s = Math.sin(st.heading);
    out[0] = st.x + (s * lx + c * ly) * sc; out[1] = st.y + (-c * lx + s * ly) * sc;
    return out;
  };
  const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
  const ptPos = (w, k, out) => {
    if (k === 0 && w.startSeg >= 0) web.segmentPoint(w.startSeg, w.startT, out);
    else web.node(w.pts[k], out);
    return out;
  };
  const A = new THREE.Vector3(), B = new THREE.Vector3();
  const tmp = [0, 0];

  // a foothold on a thread near (x, y) that this leg can actually use: on its own side of the body, within reach
  const loc2 = [0, 0];
  function toLocal(x, y, out) {
    const c = Math.cos(st.heading), s = Math.sin(st.heading), dx = (x - st.x) / sc, dy = (y - st.y) / sc;
    out[0] = s * dx - c * dy; out[1] = c * dx + s * dy;
    return out;
  }
  function plantNear(x, y, maxD, L) {
    const filter = L ? (fx, fy) => {
      toLocal(fx, fy, loc2);
      if (loc2[0] * L.side < Math.abs(L.hip[0]) + 0.9) return false;
      const d = Math.hypot(loc2[0] - L.hip[0], loc2[1] - L.hip[1]) * sc;
      return d < (L.l1 + L.l2) * 0.93 && d > (L.l1 + L.l2) * 0.32;
    } : null;
    const n = web.nearest(x, y, 0, { maxDist: maxD, loose: false, filter });
    return n ? { seg: n.segment, t: n.t } : null;
  }
  function footAt(pl, out) { web.segmentPoint(pl.seg, pl.t, P); out[0] = P.x; out[1] = P.y; out[2] = 0.25 * sc; return out; }
  function plantAll() {
    for (const L of legs) {
      toWorld(L.rest[0], L.rest[1], tmp);
      L.plant = plantNear(tmp[0], tmp[1], (L.l1 + L.l2) * 0.6, L);
      if (L.plant) footAt(L.plant, L.foot); else { L.foot[0] = tmp[0]; L.foot[1] = tmp[1]; L.foot[2] = 0; }
      L.swing = -1; L.idle = null;
    }
  }
  plantAll();

  function location() {
    const w = st.walk;
    if (st.mode !== 'walk' || !w) return { node: st.node };
    const a = w.k === 0 && w.startSeg >= 0 ? -1 : w.pts[w.k];
    const b = w.pts[Math.min(w.k + 1, w.pts.length - 1)];
    return { a, b, w };
  }

  function goTo(goal, reason) {
    if (goal == null || goal < 0) return false;
    const loc = location();
    let pts = null, startSeg = -1, startT = 0;
    if (loc.node != null) pts = web.path(loc.node, goal);
    else {
      // mid-thread: continue from whichever end gives the shorter way
      ptPos(loc.w, loc.w.k, A); ptPos(loc.w, loc.w.k + 1, B);
      const here = [st.x, st.y];
      const cands = [];
      if (loc.a >= 0) cands.push([loc.a, Math.hypot(A.x - here[0], A.y - here[1])]);
      cands.push([loc.b, Math.hypot(B.x - here[0], B.y - here[1])]);
      let best = Infinity;
      for (const [n, d0] of cands) {
        const p = web.path(n, goal);
        if (!p) continue;
        let len = d0;
        for (let k = 0; k + 1 < p.length; k++) { web.node(p[k], A); web.node(p[k + 1], B); len += A.distanceTo(B); }
        if (len < best) { best = len; pts = p; }
      }
      if (pts) {
        const n = web.nearest(st.x, st.y, 0, { maxDist: 30 * sc, loose: false });
        if (n) { startSeg = n.segment; startT = n.t; pts = [-1, ...pts]; }
      }
    }
    if (!pts || pts.length < 2) return false;
    st.mode = 'walk';
    st.reason = reason;
    st.walk = { pts, k: 0, t: 0, startSeg, startT, dash: 0.6 + rand() * 0.8, pause: 0 };
    return true;
  }

  function visibleJunction(view, filter) {
    const js = web.junctions;
    for (let k = 0; k < 60; k++) {
      const i = js[(rand() * js.length) | 0];
      const x = web.points[i * 3], y = web.points[i * 3 + 1];
      if (x < view.x0 + 40 || x > view.x1 - 40 || y > view.y0 - 50 || y < view.y1 + 50) continue;
      if (filter && !filter(i, x, y)) continue;
      return i;
    }
    return -1;
  }

  function flee(ptr, view) {
    st.lastFlee = st.clock;
    const js = web.junctions;
    let best = -1, bestScore = -Infinity;
    for (let k = 0; k < 70; k++) {
      const i = js[(rand() * js.length) | 0];
      const x = web.points[i * 3], y = web.points[i * 3 + 1];
      if (x < view.x0 + 30 || x > view.x1 - 30 || y > view.y0 - 30 || y < view.y1 + 30) continue;
      const dp = Math.hypot(x - ptr.x, y - ptr.y), ds = Math.hypot(x - st.x, y - st.y);
      if (dp < fleeR * 2.2 || ds > 520) continue;
      // away from the cursor, not too far to run, and away from the direction of the cursor
      const away = ((x - st.x) * (st.x - ptr.x) + (y - st.y) * (st.y - ptr.y)) / ((ds || 1) * (Math.hypot(st.x - ptr.x, st.y - ptr.y) || 1));
      const score = dp - ds * 0.3 + away * 120 + (i === web.hub ? 60 : 0);
      if (score > bestScore) { bestScore = score; best = i; }
    }
    if (best >= 0) goTo(best, 'flee');
  }

  // ── the mind: decides where to go (before the web steps) ──
  function think(dt, t, env) {
    st.clock = t;
    if (dt <= 0 || reduced) return;
    const { ptr, view } = env;
    st.view = view;
    st.tugCool = Math.max(0, st.tugCool - dt);
    const dPtr = ptr.on ? Math.hypot(ptr.x - st.x, ptr.y - st.y) : Infinity;
    if (st.mode === 'drop') {
      const d = st.drop;
      if (d.phase !== 'up' && ptr.on && Math.hypot(ptr.x - d.x, ptr.y - d.y) < fleeR * 1.3) { d.phase = 'up'; d.climb = 260; }
      return;
    }
    if (dPtr < fleeR && !(st.mode === 'walk' && st.reason === 'flee') && t - st.lastFlee > 0.3) { flee(ptr, view); return; }
    if (st.mode === 'walk' && st.reason === 'look' && dPtr < fleeR * 1.9) { arrive(); st.restT = 1.5 + rand() * 2; return; }
    if (st.mode === 'rest') {
      st.restT -= dt;
      st.tapT -= dt;
      if (st.tapT <= 0) { st.tapT = 1.2 + rand() * 3.5; tap(); }
      if (st.restT <= 0) {
        const atHub = st.node === web.hub;
        if (!atHub && rand() < 0.55) goTo(web.hub, 'home');
        else {
          const j = visibleJunction(view, (i, x, y) => {
            const d = Math.hypot(x - st.x, y - st.y);
            return d > 90 && d < 420 && (!ptr.on || Math.hypot(x - ptr.x, y - ptr.y) > fleeR * 2.5);
          });
          if (!goTo(j, 'wander')) st.restT = 1 + rand() * 2;
        }
      }
    }
  }

  function arrive() {
    const w = st.walk;
    st.node = w ? w.pts[Math.min(w.k + (w.t > 0.5 ? 1 : 0), w.pts.length - 1)] : st.node;
    if (st.node < 0) st.node = w.pts[1];
    st.mode = 'rest';
    st.walk = null;
    st.speed = 0;
    const r = st.reason;
    st.reason = '';
    st.restT = r === 'flee' ? 3 + rand() * 3 : r === 'home' ? 9 + rand() * 12 : 4.5 + rand() * 6;
    if (r === 'drop' && st.dropTo) { startDrop(st.dropTo); st.dropTo = null; }
    else if (r === 'watch' && st.dropTo) { st.look = st.dropTo; st.lookT = 3; st.dropTo = null; }
  }

  function tap() {
    const L = legs[rand() < 0.5 ? 0 : 4];
    if (st.mode !== 'rest' || !L.plant || L.idle) return;
    L.idle = { t: 0, dur: 0.32, from: L.foot.slice(), to: L.plant, lift: 3.2, tap: true };
  }

  // the spider's interest in plucks and tugs
  function noticePluck(x, y) {
    if (reduced || st.mode === 'drop' || (st.mode === 'walk' && st.reason === 'flee')) return;
    const n = web.nearestNode(x, y, 0, (i) => web.junction[i] === 1);
    if (n >= 0 && Math.hypot(x - st.x, y - st.y) > fleeR * 1.6) { st.look = { x, y }; st.lookT = 4; goTo(n, 'look'); }
  }
  function noticeTug(x, y, s) {
    if (reduced || st.tugCool > 0 || st.mode === 'drop' || (st.mode === 'walk' && (st.reason === 'flee' || st.reason === 'drop'))) return;
    if (rand() > 0.35 + s * 0.3) { st.tugCool = 4; return; }
    st.tugCool = 18 + rand() * 10;
    const view = st.view;
    if (!view) return;
    // the lowest visible junction above the struggle, close to it in x
    let best = -1, by = Infinity;
    for (const i of web.junctions) {
      const nx = web.points[i * 3], ny = web.points[i * 3 + 1];
      if (Math.abs(nx - x) > 150 || ny < y + 90 || ny > view.y0 - 40 || nx < view.x0 + 30 || nx > view.x1 - 30) continue;
      if (ny < by) { by = ny; best = i; }
    }
    if (best >= 0) {
      const ny = web.points[best * 3 + 1];
      st.dropTo = { x, y, len: clamp(ny - y - 50, 70, (view.y0 - view.y1) * 0.42) };
      goTo(best, 'drop');
    } else {
      const n = web.nearestNode(x, y, 0, (i) => web.junction[i] === 1);
      st.dropTo = { x, y };
      goTo(n, 'watch');
    }
  }

  // ── drop on a dragline (spinneret hangs from a web node) ──
  function startDrop(to) {
    web.node(st.node, P);
    const f = fwd();
    st.mode = 'drop';
    st.drop = { node: st.node, phase: 'down', len: 4, max: to.len, x: st.x + SPIN[1] * sc * f[0], y: st.y + SPIN[1] * sc * f[1], vx: 0, vy: 0, t: 0, climb: 75, ax: P.x, ay: P.y };
    st.drop.x = P.x; st.drop.y = P.y - 2;
  }
  function stepDrop(dt) {
    const d = st.drop;
    web.node(d.node, P);
    d.ax = P.x; d.ay = P.y;
    d.t += dt;
    if (d.phase === 'down') {
      d.len = Math.min(d.max, d.len + dt * (60 + 420 * Math.min(1, d.t * 2.5)));
      if (d.len >= d.max && d.t > 0.6) { d.phase = 'hang'; d.hang = 2.6 + rand() * 2.4; }
    } else if (d.phase === 'hang') {
      d.hang -= dt;
      if (d.hang <= 0) { d.phase = 'up'; d.climb = 70; }
    } else if (d.phase === 'up') d.len = Math.max(0, d.len - d.climb * dt);
    // the body: a weight on an elastic thread
    let ax = 0, ay = -900;
    const dx = d.x - d.ax, dy = d.y - d.ay, dist = Math.hypot(dx, dy) || 1;
    if (dist > d.len) {
      const stretch = dist - d.len, nx = dx / dist, ny = dy / dist;
      const vr = d.vx * nx + d.vy * ny;
      const k = d.phase === 'up' ? 900 : 190, c = d.phase === 'up' ? 50 : 4.5;
      ax -= nx * (stretch * k + vr * c);
      ay -= ny * (stretch * k + vr * c);
      web.force(d.ax, d.ay, 0, nx * Math.min(stretch * k, 3000) * 0.5, ny * Math.min(stretch * k, 3000) * 0.5 - 300, 0, web.spacing * 2.5);
    }
    const drag = Math.exp(-dt * (d.phase === 'down' ? 0.9 : 1.6));
    d.vx = (d.vx + ax * dt) * drag; d.vy = (d.vy + ay * dt) * drag;
    d.x += d.vx * dt; d.y += d.vy * dt;
    // head down, abdomen (spinneret) up the thread
    const hx = d.x - d.ax, hy = d.y - d.ay;
    const want = Math.hypot(hx, hy) > 3 ? Math.atan2(hy, hx) : -Math.PI / 2;
    st.heading += angDiff(st.heading, want) * Math.min(1, dt * 6);
    const f = fwd();
    st.x = d.x - SPIN[1] * sc * f[0];
    st.y = d.y - SPIN[1] * sc * f[1];
    if (d.phase === 'up' && d.len <= 0.5 && Math.hypot(d.x - d.ax, d.y - d.ay) < 4) {
      st.mode = 'rest'; st.drop = null; st.restT = 1.5 + rand() * 2; st.node = d.node;
      st.settle = { x: st.x, y: st.y, t: 0 };
      plantAll();
    }
  }

  // ── the body moves (after think, before the web steps) ──
  function move(dt) {
    if (st.mode === 'drop') { stepDrop(dt); return; }
    let dHead = 0;
    if (st.mode === 'walk') {
      const w = st.walk;
      // speed: bursts of running and short freezes for a wander; one long run otherwise
      let vmax = { flee: 290, look: 140, drop: 120, watch: 120, home: 80, wander: 70 }[st.reason] ?? 75;
      if (st.reason === 'wander' || st.reason === 'home') {
        if (w.pause > 0) { w.pause -= dt; vmax = 0; if (w.pause <= 0) w.dash = 0.4 + rand() * 1.1; }
        else { w.dash -= dt; if (w.dash <= 0) w.pause = 0.12 + rand() * 0.55; }
      }
      // look ahead along the path for a heading
      ptPos(w, w.k, A); ptPos(w, Math.min(w.k + 1, w.pts.length - 1), B);
      let lx = B.x, ly = B.y;
      if (Math.hypot(B.x - st.x, B.y - st.y) < 6 * sc && w.k + 2 < w.pts.length) { ptPos(w, w.k + 2, B); lx = B.x; ly = B.y; }
      const want = Math.atan2(ly - st.y, lx - st.x);
      const err = angDiff(st.heading, want);
      const turn = (st.reason === 'flee' ? 11 : 6) * dt;
      dHead = clamp(err, -turn, turn);
      st.heading += dHead;
      const align = clamp((Math.cos(err) - 0.25) / 0.6, 0, 1);
      const accel = st.reason === 'flee' ? 14 : 9;
      st.speed += (vmax * align - st.speed) * Math.min(1, dt * accel);
      let ds = st.speed * sc * dt / 1.4;
      while (ds > 0 && st.mode === 'walk') {
        ptPos(w, w.k, A); ptPos(w, w.k + 1, B);
        const segL = Math.max(1e-4, A.distanceTo(B));
        const left = (1 - w.t) * segL;
        if (ds < left) { w.t += ds / segL; ds = 0; }
        else {
          ds -= left; w.k++; w.t = 0;
          if (w.k >= w.pts.length - 1) { st.walk = w; w.k = w.pts.length - 1; ptPos(w, w.k, A); st.x = A.x; st.y = A.y; arrive(); break; }
        }
      }
      if (st.mode === 'walk') {
        ptPos(w, w.k, A); ptPos(w, w.k + 1, B);
        st.x = A.x + (B.x - A.x) * w.t; st.y = A.y + (B.y - A.y) * w.t;
      }
      st.phase += (st.speed * dt) / (STRIDE * 1.4) + Math.abs(dHead) * 0.62;
    } else {
      // resting: stay on the node, turn slowly to face down at the hub (orb weavers wait head-down) or toward a sound
      web.node(st.node, P);
      let tx = P.x, ty = P.y;
      if (st.settle) {
        st.settle.t += dt;
        const k = ease(Math.min(1, st.settle.t / 0.35));
        tx = st.settle.x + (P.x - st.settle.x) * k; ty = st.settle.y + (P.y - st.settle.y) * k;
        if (k >= 1) st.settle = null;
      }
      st.x = tx; st.y = ty;
      let want = null;
      if (st.look && st.lookT > 0) { st.lookT -= dt; want = Math.atan2(st.look.y - st.y, st.look.x - st.x); if (st.lookT <= 0) st.look = null; }
      else if (st.node === web.hub) want = -Math.PI / 2;
      if (want != null) {
        const err = angDiff(st.heading, want);
        dHead = clamp(err, -1.6 * dt, 1.6 * dt) * (Math.abs(err) > 0.05 ? 1 : 0);
        st.heading += dHead;
      }
      // finish the step in progress, then freeze in a stance window (all feet down)
      const ph = ((st.phase % 0.5) + 0.5) % 0.5;
      if (ph < SWING) st.phase += Math.min(dt * 3.2, SWING - ph + 0.001);
      st.phase += Math.abs(dHead) * 0.3;
    }
    // the spider's weight on the web
    web.force(st.x, st.y, 0, 0, -1500, 0, 16 * sc);
  }

  // ── legs: phase-driven tetrapod gait while walking, single corrective steps and taps at rest ──
  const hipW = [0, 0], restW = [0, 0];
  function poseLegs(dt) {
    const walking = st.mode === 'walk';
    const f = fwd();
    for (let li = 0; li < legs.length; li++) {
      const L = legs[li];
      toWorld(L.hip[0], L.hip[1], hipW);
      toWorld(L.rest[0], L.rest[1], restW);
      const reach = L.l1 + L.l2;
      if (st.mode === 'drop') {
        // hanging: legs drawn in, slowly feeling the air; climbing: the hind legs haul on the thread
        const d = st.drop;
        const k = (L.pair < 2 ? 0.78 : 0.6) + 0.07 * Math.sin(st.clock * (d.phase === 'down' ? 7 : 2.3) + li * 1.3);
        let fx = hipW[0] + (restW[0] - hipW[0]) * k, fy = hipW[1] + (restW[1] - hipW[1]) * k;
        if (d.phase === 'up' && L.pair >= 2) {
          const c = 0.5 + 0.5 * Math.sin(st.clock * 14 + (L.side > 0 ? 0 : Math.PI) + L.pair);
          const ux = d.ax - d.x, uy = d.ay - d.y, ul = Math.hypot(ux, uy) || 1;
          fx = d.x + (ux / ul) * (3 + 5 * c) * sc; fy = d.y + (uy / ul) * (3 + 5 * c) * sc;
        }
        L.foot[0] += (fx - L.foot[0]) * Math.min(1, dt * 12 + (dt === 0 ? 1 : 0));
        L.foot[1] += (fy - L.foot[1]) * Math.min(1, dt * 12 + (dt === 0 ? 1 : 0));
        L.foot[2] = 1.2 * sc;
        L.plant = null; L.swing = -1; L.idle = null;
        continue;
      }
      if (walking || L.swing >= 0) {
        const p = (((st.phase + L.group * 0.5) % 1) + 1) % 1;
        if (p < SWING && walking) {
          const tau = p / SWING;
          if (L.swing < 0) {
            // lift off: aim half a stride ahead of the rest pose
            L.swing = 0;
            L.from[0] = L.foot[0]; L.from[1] = L.foot[1];
            const ax = restW[0] + f[0] * STRIDE * 0.5 * sc, ay = restW[1] + f[1] * STRIDE * 0.5 * sc;
            L.tgt = plantNear(ax, ay, reach * 0.45, L);
            L.aim = [ax, ay];
          }
          L.swing = tau;
          const to = L.tgt ? footAt(L.tgt, [0, 0, 0]) : [L.aim[0], L.aim[1], 0];
          const e = ease(tau), lift = Math.sin(Math.PI * tau);
          let x = L.from[0] + (to[0] - L.from[0]) * e, y = L.from[1] + (to[1] - L.from[1]) * e;
          x += (hipW[0] - x) * 0.22 * lift; y += (hipW[1] - y) * 0.22 * lift;
          L.foot[0] = x; L.foot[1] = y; L.foot[2] = 2.6 * sc * lift;
          continue;
        }
        if (L.swing >= 0) {
          // touch down
          L.swing = -1;
          L.plant = L.tgt;
          if (L.plant && walking && st.speed > 120) web.pluck([L.foot[0], L.foot[1], 0], 0.12);
        }
      }
      if (L.idle) {
        const s = L.idle;
        s.t += dt;
        const tau = Math.min(1, s.t / s.dur), e = ease(tau), lift = Math.sin(Math.PI * tau);
        const to = s.to ? footAt(s.to, [0, 0, 0]) : [restW[0], restW[1], 0];
        let x = s.from[0] + (to[0] - s.from[0]) * e, y = s.from[1] + (to[1] - s.from[1]) * e;
        x += (hipW[0] - x) * (s.tap ? 0.32 : 0.2) * lift; y += (hipW[1] - y) * (s.tap ? 0.32 : 0.2) * lift;
        L.foot[0] = x; L.foot[1] = y; L.foot[2] = s.lift * sc * lift;
        if (tau >= 1) {
          L.plant = s.to; L.idle = null;
          if (s.tap) web.pluck([to[0], to[1], 0], 0.9);
        }
        continue;
      }
      if (L.plant && !web.segments.alive[L.plant.seg]) L.plant = null;
      if (L.plant) footAt(L.plant, L.foot);
      // at rest: re-place a foot that drifted too far from where it wants to be (one per gait group at a time)
      if (!walking && dt > 0) {
        const off = Math.hypot(L.foot[0] - restW[0], L.foot[1] - restW[1]);
        const busy = legs.some((M) => M !== L && M.idle && M.group === L.group);
        if ((off > reach * 0.32 || !L.plant) && !busy) {
          const to = plantNear(restW[0], restW[1], reach * 0.5, L);
          L.idle = { t: 0, dur: 0.15, from: L.foot.slice(), to, lift: 2.2 };
        }
      }
    }
  }

  // two-bone IK: hip -> knee -> foot, the knee lifted toward the viewer and bowed out sideways
  const kn = [0, 0, 0];
  function knee(L, hx, hy, hz, fx, fy, fz) {
    let dx = fx - hx, dy = fy - hy, dz = fz - hz;
    let D = Math.hypot(dx, dy, dz) || 1e-4;
    const maxD = (L.l1 + L.l2) * 0.995;
    if (D > maxD) { const k = maxD / D; dx *= k; dy *= k; dz *= k; D = maxD; }
    const ux = dx / D, uy = dy / D, uz = dz / D;
    const a = (L.l1 * L.l1 - L.l2 * L.l2 + D * D) / (2 * D);
    const hk = Math.sqrt(Math.max(0, L.l1 * L.l1 - a * a));
    const pl = Math.hypot(dx, dy) || 1;
    let bx = (-dy / pl) * L.bend * 0.6, by = (dx / pl) * L.bend * 0.6, bz = 1;
    const dp = bx * ux + by * uy + bz * uz;
    bx -= ux * dp; by -= uy * dp; bz -= uz * dp;
    const bl = Math.hypot(bx, by, bz) || 1;
    kn[0] = hx + ux * a + (bx / bl) * hk; kn[1] = hy + uy * a + (by / bl) * hk; kn[2] = hz + uz * a + (bz / bl) * hk;
    return kn;
  }

  function pose(dt, t) {
    if (dt > 0 && !reduced) move(dt);
    else if (st.mode === 'rest') { web.node(st.node, P); st.x = P.x; st.y = P.y; }
    poseLegs(reduced ? 0 : dt);
    group.position.set(st.x, st.y, 0);
    group.rotation.z = st.heading - Math.PI / 2;
    // secondary motion: the heavy abdomen swings behind turns, bobs with the gait, and breathes at rest
    if (dt > 0 && !reduced) {
      const rate = angDiff(st.prevHeading ?? st.heading, st.heading) / dt;
      st.sway += (clamp(-rate * 0.07, -0.32, 0.32) - st.sway) * Math.min(1, dt * 7);
    }
    st.prevHeading = st.heading;
    const walkBob = st.mode === 'walk' ? Math.sin(st.phase * Math.PI * 4) * Math.min(1, st.speed / 80) * 0.05 : 0;
    const br = reduced ? 1 : 1 + 0.025 * Math.sin(t * 2.2);
    body.abd.scale.set(br, 1 + (br - 1) * 0.5 + walkBob, br);
    body.abdPivot.rotation.z = reduced ? 0 : st.sway;
    const hz = HIP_Z * sc;
    for (let li = 0; li < legs.length; li++) {
      const L = legs[li];
      toWorld(L.hip[0], L.hip[1], hipW);
      const k = knee(L, hipW[0], hipW[1], hz, L.foot[0], L.foot[1], L.foot[2]);
      const kx = k[0], ky = k[1], kz = k[2];
      // the lower leg keeps arching: an ankle a little outward of the knee-foot line, a little raised
      const fx = L.foot[0], fy = L.foot[1], fz = L.foot[2];
      const lx = fx - kx, ly = fy - ky, ll = Math.hypot(lx, ly) || 1;
      const bow = 0.11 * ll * L.bend;
      const ax = kx + lx * 0.56 + (-ly / ll) * bow, ay = ky + ly * 0.56 + (lx / ll) * bow, az = kz + (fz - kz) * 0.56 + 0.18 * ll;
      lines.set(li * 3, hipW[0], hipW[1], hz, kx, ky, kz);
      lines.set(li * 3 + 1, kx, ky, kz, ax, ay, az);
      lines.set(li * 3 + 2, ax, ay, az, fx, fy, fz);
    }
    for (let s = 0; s < 2; s++) {
      const side = s ? -1 : 1, tw = reduced ? 0 : 0.35 * Math.sin(t * 5.3 + s * 2.1) * Math.max(0, Math.sin(t * 0.9 + s));
      const a = toWorld(0.55 * side, 3.9, [0, 0]);
      const b = toWorld((1.05 + tw) * side, 5.6 - tw * 0.4, [0, 0]);
      lines.set(PALP + s, a[0], a[1], hz + 0.4 * sc, b[0], b[1], hz + 0.2 * sc);
    }
    if (st.mode === 'drop') lines.set(DRAG, st.drop.ax, st.drop.ay, 0.2, st.drop.x, st.drop.y, hz);
    else lines.hide(DRAG);
    lines.commit();
  }
  lines.style(PALP, { width: 0.95 * sc }); lines.style(PALP + 1, { width: 0.95 * sc });
  legs.forEach((L, li) => {
    lines.style(li * 3, { width: 1.3 * sc }); lines.style(li * 3 + 1, { width: 1.0 * sc }); lines.style(li * 3 + 2, { width: 0.7 * sc });
  });

  return {
    group, lines, state: st,
    think(dt, t, env) { think(dt, t, env); },
    pose,
    noticePluck, noticeTug,
    dispose() { body.geos.forEach((g) => g.dispose()); body.mats.forEach((m) => m.dispose()); lines.dispose(); },
  };
}
