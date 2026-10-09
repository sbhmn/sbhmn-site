// A living low-poly orb web for three.js scenes: the page background and the game stages (a ship stuck in a web, a bull
// caught in one) all build on this. Verlet nodes + rope constraints + a soft shape memory, a travelling-wave layer for
// plucks, and ONE ribbon mesh for every thread (constant world width, anti-aliased, never thinner than ~1 device px).
//
// ── Make one (a game stage: perspective camera, something stuck in the web) ────────────────────────────────────────
//   import { createWeb } from '/assets/home/web.js';
//   const web = createWeb({ hub: [0, 0.2, 0], radius: 2.2, spokes: 26, width: 0.008, seed: 7, normal: [0.15, 0, 1],
//                           strainColor: 0xff2414, wave: { normal: 1, plane: 0.4 }, wind: { amp: 0.008, normal: 0.04 } });
//   scene.add(web.object);                       // keep web.object at identity: all coordinates are its parent's space
//   const grip = web.attach(web.nearestNode(ship.position.x, ship.position.y, ship.position.z), () => ship.position);
//   web.onSnap = (thread) => setTimeout(() => web.mend(thread, 1.5), 3000);
//   // every frame, in update(dt, t, input):
//   const p = input.inside && web.planePoint(camera, input.x, input.y);
//   if (p) web.poke(p.x, p.y, p.z, 0.3, 1, { mode: 'normal' });     // the cursor presses into the web
//   if (grip.strain > 0.25) stage.emit('tug', { strength: grip.strain * 2, x: input.rect.left + sx, y: input.rect.top + sy });
//   web.update(dt);                              // dt in seconds; 0 is fine (redraw only); steps are fixed 1/60 s
//   // dispose(): web.dispose()
// A live, tested example of all of this: /dev/lab-tug.html?web3d (the web3d() function in that page).
//
// ── Options (all optional; lengths are world units; defaults scale with the web's mean radius R) ─────────────────────
//   hub [x,y,z]            centre of the orb (default 0,0,0)
//   normal, up [x,y,z]     the web's plane: normal (default +z) and the in-plane "up" (default +y)
//   frame [[x,y,z]...]     frame polygon corners, in order around the hub (the hub must be inside). Without it:
//   radius, sides, rotation    a regular-ish polygon of `sides` (6) corners at `radius` (1) around the hub
//   moorings [[k, [x,y,z]]...] pinned anchor threads from frame corner k to a fixed point. Corners with no mooring
//                          are pinned themselves (so with no moorings, the frame corners are the anchors)
//   spokes                 radial count (24)
//   spiral { spacing, start, end, follow, growth }   capture spiral: gap between turns (R/24), first turn at
//                          start*R (0.2), clipped at end*spoke length (0.9), follow 0..1 = how much the turns take the
//                          frame's shape (0.35), growth = spacing widening outward (0.3)
//   hubRadius, hubRings    the dense hub mesh: radius as a fraction of R (0.075) and its ring count (3); the spokes
//   hubMat                 start on the innermost ring, which `hubMat` short threads tie to the hub node (spokes / 4)
//   irregularity 0..1      spoke angle jitter, spacing jitter, skipped hub threads, forks (0.5)
//   forks 0..1             share of spokes that split in a Y before the frame (0.3 * irregularity * 2)
//   missing 0..1           share of capture-spiral threads left out (0.02)
//   dangling               broken spiral threads hanging loose at creation (2)
//   maxSegment             threads longer than this are subdivided into nodes (R/20): sag, waves, poke resolution
//   sag                    multiplier on the built-in gravity sag of long threads (1)
//   width                  base thread width (R*0.003); per kind: widths { hub, spoke, spiral, frame, moor, hubring }
//                          (multipliers on width, defaults 1, 1.05, 0.8, 1.3, 1.45, 0.85)
//   color                  every thread; or colors { hub, spoke, spiral, frame, moor, hubring } (greys by default)
//   style(info) -> { color?, width?, alpha? } | null   per-segment override at build time; info: { segment, thread,
//                          kind, kindName, r (distance from the hub / R), angle (radians in the plane), color, width }
//   sheen { amount, angle, speed, color }   silk catching light by thread direction: threads near `angle` (radians,
//                          screen space) blend toward `color` (white) by `amount` (0 = off); speed > 0 drifts the angle
//   opacity (1), minPx (1.15 device px: thinner lines fade instead), feather (1 device px edge AA), renderOrder (0),
//   depthTest (true: threads hide behind solid objects; the threads never write depth)
//   gravity                number (world units/s², down -Y; default 1.2*R) or [x,y,z]
//   damping (0.045 per 1/60 s step), memory (0.045: pull back to the rest shape per step), iterations (6)
//   stiffness (1: rope constraint stiffness per iteration)
//   wind { amp, normal, speed }  sway: in-plane amplitude (R*0.006), out-of-plane amplitude (0), time scale (1)
//   wave { speed, damping, viscosity, plane, normal, glint }   pluck waves: speed (22 segments/s worth), damping per
//                          s (1.7), viscosity (0.12, smooths zigzags), display amplitude in the plane (1) and along the
//                          normal (0), how much a passing wave tints threads toward waveColor (1)
//   waveColor              colour threads shift to while a wave passes (0x5a5a5a; use a light colour on dark scenes)
//   strainColor            colour a stretched thread shifts to (null = off), strainGain (6: strain 1/6 = full colour)
//   breakStrain            threads snap by themselves above this strain (Infinity); see onSnap
//   dew { count, size, gap, color }   tiny faceted drops strung along capture threads, big and small in turn (count 0);
//                          lit by the scene's lights (MeshStandardMaterial), best on darker scenes
//   seed                   deterministic layout (1)
//   warmup                 settle steps at creation (90) so the first frame is a still, hanging web
//
// ── The web object ───────────────────────────────────────────────────────────────────────────────────────────────────
//   object                 THREE.Group (threads mesh + dew). Add it to the scene. mesh, dew: its parts
//   update(dt)             simulate (fixed 1/60 s steps, at most 4 per call) and refresh the GPU data. Call once a frame
//   count                  node count; points: Float32Array xyz of DISPLAYED positions (sim + wave), sim: simulated xyz
//   rest                   Float32Array xyz rest positions
//   node(i, out?)          displayed position of node i -> THREE.Vector3
//   kind: Uint8Array per node (KIND.*), junction: Uint8Array per node (1 = where threads meet, 0 = subdivision)
//   hub                    node index of the hub; anchors: pinned node indices; corners: frame corner node indices
//   junctions              Int32Array of junction nodes (good places to walk to)
//   threads[]              { index, kind, a, b, nodes: [a ... b], segs: [segment ids], broken }
//   segments               { count, a: Int32Array, b, thread, alive: Uint8Array, rest: Float32Array, strain: Float32Array }
//   segmentPoint(s, t, out?)   displayed point at t (0..1) along segment s -> THREE.Vector3
//   segmentBetween(i, j)   segment id joining nodes i and j, or -1; toPlane(x, y, z) -> [u, v] around the hub
//   time                   simulated seconds
//   radius, spacing, plane { origin, u, v, normal } (Vector3s)
//
//   poke(x, y, z, radius, strength = 1, { vx, vy, vz, drag, max, dent, twang, mode } = {})
//                          the cursor, for this update (call it every frame while it applies). Threads within radius
//                          are dragged along the pointer's velocity (vx, vy, vz in world units/s; drag 0..1 = how much
//                          they follow, default 0.6) and nudged out of its
//                          way (dent, default radius*0.12), up to `max` from their place (radius*0.4); beyond that they
//                          slip off and twang back, starting a wave (twang scales it, default 1). mode 'normal' presses
//                          into the web along -normal instead (strength < 0 pulls toward the viewer).
//   pluck(target, amount, radius = 0)
//                          a wave that travels along the threads. target: node index or [x,y,z] / Vector3 (nearest node);
//                          amount ~ peak displacement in world units; radius > 0 spreads it over nearby nodes.
//   impulse(x, y, z, vx, vy, vz, radius)   add velocity (world units/s) to nodes near a point, smooth falloff
//   force(x, y, z, fx, fy, fz, radius)     a force (units/s²) on nodes near a point, for this update only
//   attach(target, getPos, { stiffness = 1 } = {})  -> handle
//                          make a node follow a moving thing: target = node index or point (nearest node); getPos()
//                          returns a Vector3 or [x,y,z] each update. handle: { node, pull: Vector3 (direction and
//                          size of the web's pull on it, in strain units), strain (max strain of its threads), detach() }
//   pin(i, pos?) / unpin(i)  fix a node in place (optionally moving it to pos) / free it
//   snap(thread, segIndex?)  break a thread (its middle segment by default); the halves recoil and hang. -> bool
//   cut(segment)           break one segment; mend(thread, seconds = 1.2): re-spin a broken thread (fades back, re-tightens)
//   onSnap                 (threadIndex, segmentIndex) => {}, called when a thread breaks (snap, cut or breakStrain)
//   tension(thread)        max strain (0 = slack/rest, 0.1 = 10% stretched) of a thread; nodeTension(i); stats(): { max, mean }
//   nearest(x, y, z, { maxDist, loose = true, filter }) -> { segment, thread, t, node, x, y, z, dist } | null
//                          closest point on a live thread (loose = include dangling threads; filter(x, y, z, seg, t)
//                          -> bool rejects candidate points). nearestNode(x, y, z, filter?(i) -> bool)
//   path(from, to)         node indices along live threads from node `from` to node `to` (Dijkstra), or null
//   neighbors(i)           node indices connected to i by live segments
//   planePoint(camera, nx, ny, out?)  where the pointer (NDC -1..1, y up: the stage's input.x/input.y) meets the web's
//                          plane -> Vector3 or null. Feed it to poke() for a cursor in a 3D scene
//   setWind({ amp, normal, speed }), setOpacity(a)
//   dispose()              frees geometry, materials, textures
//
// ── Extra loose lines (draglines, tethers, legs) in the same silk style ─────────────────────────────────────────────
//   const lines = createSilkLines(8, { color: 0x141414, width: 1.2, opacity: 1, minPx: 1 });
//   scene.add(lines.object);
//   lines.set(i, ax, ay, az, bx, by, bz);  lines.style(i, { color, width, alpha });  lines.hide(i);  lines.commit();
//
// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────
//   KIND { HUB, SPOKE, SPIRAL, FRAME, MOOR, HUBRING }, rng(seed) -> () => [0, 1)
import * as THREE from 'three';

export const KIND = Object.freeze({ HUB: 0, SPOKE: 1, SPIRAL: 2, FRAME: 3, MOOR: 4, HUBRING: 5 });
const KIND_KEYS = ['hub', 'spoke', 'spiral', 'frame', 'moor', 'hubring'];
const DEF_COLOR = { hub: 0x9a9a9a, spoke: 0xa9a9a9, spiral: 0xb9b9b9, frame: 0x9a9a9a, moor: 0x8e8e8e, hubring: 0xababab };
const DEF_WIDTH = { hub: 1, spoke: 1.05, spiral: 0.8, frame: 1.3, moor: 1.45, hubring: 0.85 };
const DEF_SAG = [0, 0.003, 0.004, 0.006, 0.012, 0.004];
const TAU = Math.PI * 2;
const STEP = 1 / 60;

/** Deterministic random numbers in [0, 1) (mulberry32). */
export function rng(seed = 1) {
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const vec = (p, d) => (p == null ? d.slice() : Array.isArray(p) || ArrayBuffer.isView(p) ? [p[0], p[1], p[2] ?? 0] : [p.x, p.y, p.z ?? 0]);
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const mul3 = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const nrm3 = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

// ── The silk ribbon renderer (shared by webs and loose lines) ────────────────────────────────────────────────────────
// Node positions live in a float texture (xyz + packed glint/strain in w); each segment is a quad whose 4 vertices only
// carry (nodeA, nodeB, corner code). The vertex shader expands it in screen space to the thread's world width at that
// depth (plus a 1 px feather for anti-aliasing), so lines stay silk-thin at any distance and never alias into dashes.
const VERT = /* glsl */ `
uniform highp sampler2D uPos;
uniform int uTexW;
uniform vec2 uViewport;
uniform float uMinPx;
uniform float uFeather;
uniform float uOpacity;
uniform float uCap;
uniform vec3 uWaveColor;
uniform vec3 uStrainColor;
uniform vec3 uSheenColor;
uniform float uSheen;
uniform float uSheenAngle;
attribute vec4 aStyle;
attribute float aWidth;
varying vec4 vCol;
varying float vEdge;
varying float vHalf;
vec4 nodeAt(float f) { int i = int(f + 0.5); return texelFetch(uPos, ivec2(i % uTexW, i / uTexW), 0); }
void main() {
  float code = position.z;
  float side = (code > 0.5 && code < 1.5) || code > 2.5 ? 1.0 : -1.0;
  bool atB = code > 1.5;
  vec4 A = nodeAt(position.x);
  vec4 B = nodeAt(position.y);
  mat4 mvp = projectionMatrix * modelViewMatrix;
  vec4 ca = mvp * vec4(A.xyz, 1.0);
  vec4 cb = mvp * vec4(B.xyz, 1.0);
  vec4 c = atB ? cb : ca;
  vec2 hv = 0.5 * uViewport;
  vec2 sa = ca.xy / max(ca.w, 1e-5) * hv;
  vec2 sb = cb.xy / max(cb.w, 1e-5) * hv;
  vec2 d = sb - sa;
  float len = length(d);
  vec2 dir = len > 1e-5 ? d / len : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  float ppu = abs(projectionMatrix[1][1]) * hv.y / max(c.w, 1e-5);
  float hw0 = 0.5 * aWidth * ppu;
  float hw = max(hw0, 0.5 * uMinPx);
  float ext = hw + uFeather;
  vec2 off = nrm * side * ext + dir * (atB ? 1.0 : -1.0) * min(hw * uCap, 0.5 * len);
  c.xy += off / hv * c.w;
  gl_Position = c;
  vEdge = side * ext;
  vHalf = hw;
  float w = atB ? B.w : A.w;
  float glint = floor(w) / 255.0;
  float strain = fract(w);
  vec3 col = aStyle.rgb;
  if (uSheen > 0.0) {
    // silk catches the light by its direction: threads at one angle melt into the light, across it they stand out
    float sh = 0.5 + 0.5 * cos(2.0 * (atan(dir.y, dir.x) - uSheenAngle));
    col = mix(col, uSheenColor, uSheen * sh * sh);
  }
  col = mix(col, uStrainColor, strain);
  col = mix(col, uWaveColor, clamp(glint, 0.0, 1.0));
  vCol = vec4(col, aStyle.a * uOpacity * (hw0 / hw));
}`;
const FRAG = /* glsl */ `
uniform float uFeather;
varying vec4 vCol;
varying float vEdge;
varying float vHalf;
void main() {
  float cov = clamp((vHalf - abs(vEdge)) / max(uFeather, 1e-3) + 0.5, 0.0, 1.0);
  float a = vCol.a * cov;
  if (a < 0.004) discard;
  gl_FragColor = vec4(vCol.rgb, a);
  #include <colorspace_fragment>
}`;

const _vp = new THREE.Vector4();
function makeRibbons(nodeCap, segA, segB, segCount, { opacity = 1, minPx = 1.15, feather = 1, cap = 0.5, waveColor = 0x5a5a5a, strainColor = 0xff2414, renderOrder = 0, depthTest = true, sheen = null } = {}) {
  const texW = nodeCap > 4096 ? 256 : nodeCap > 256 ? 64 : 16;
  const texH = Math.max(1, Math.ceil(nodeCap / texW));
  const data = new Float32Array(texW * texH * 4);
  const tex = new THREE.DataTexture(data, texW, texH, THREE.RGBAFormat, THREE.FloatType);
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  const pos = new Float32Array(segCount * 12), style = new Float32Array(segCount * 16), width = new Float32Array(segCount * 4);
  const index = new Uint32Array(segCount * 6);
  for (let s = 0; s < segCount; s++) {
    for (let c = 0; c < 4; c++) { const o = (s * 4 + c) * 3; pos[o] = segA[s]; pos[o + 1] = segB[s]; pos[o + 2] = c; }
    const b = s * 4, o = s * 6;
    index[o] = b; index[o + 1] = b + 1; index[o + 2] = b + 2; index[o + 3] = b + 2; index[o + 4] = b + 1; index[o + 5] = b + 3;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const styleAttr = new THREE.BufferAttribute(style, 4); styleAttr.setUsage(THREE.DynamicDrawUsage);
  const widthAttr = new THREE.BufferAttribute(width, 1); widthAttr.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aStyle', styleAttr);
  geo.setAttribute('aWidth', widthAttr);
  geo.setIndex(new THREE.BufferAttribute(index, 1));
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT, fragmentShader: FRAG,
    uniforms: {
      uPos: { value: tex }, uTexW: { value: texW }, uViewport: { value: new THREE.Vector2(1, 1) },
      uMinPx: { value: minPx }, uFeather: { value: feather }, uOpacity: { value: opacity }, uCap: { value: cap },
      uWaveColor: { value: new THREE.Color(waveColor) }, uStrainColor: { value: new THREE.Color(strainColor ?? 0xff2414) },
      uSheenColor: { value: new THREE.Color(sheen?.color ?? 0xffffff) }, uSheen: { value: sheen?.amount ?? 0 }, uSheenAngle: { value: sheen?.angle ?? 0.7 },
    },
    transparent: true, depthWrite: false, depthTest, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = renderOrder;
  mesh.onBeforeRender = (renderer) => { renderer.getCurrentViewport(_vp); mat.uniforms.uViewport.value.set(Math.max(1, _vp.z), Math.max(1, _vp.w)); };
  const _c = new THREE.Color();
  return {
    mesh, tex, data, mat, styleAttr, widthAttr,
    setStyle(s, color, alpha, w) {
      _c.set(color);
      for (let c = 0; c < 4; c++) { const o = (s * 4 + c) * 4; style[o] = _c.r; style[o + 1] = _c.g; style[o + 2] = _c.b; style[o + 3] = alpha; width[s * 4 + c] = w; }
    },
    setAlpha(s, alpha) { for (let c = 0; c < 4; c++) style[(s * 4 + c) * 4 + 3] = alpha; },
    commitStyle() { styleAttr.needsUpdate = true; widthAttr.needsUpdate = true; },
    dispose() { geo.dispose(); mat.dispose(); tex.dispose(); },
  };
}

/**
 * Free-standing silk lines (draglines, tethers, spider legs...) drawn like the web's threads.
 * `max` segments; each is set by its two end points every frame you need it.
 */
export function createSilkLines(max, { color = 0x9a9a9a, width = 1, opacity = 1, minPx = 1.15, feather = 1, renderOrder = 1, depthTest = true, cap = 0.5 } = {}) {
  const a = new Int32Array(max), b = new Int32Array(max);
  for (let i = 0; i < max; i++) { a[i] = i * 2; b[i] = i * 2 + 1; }
  const r = makeRibbons(max * 2, a, b, max, { opacity, minPx, feather, renderOrder, depthTest, cap, strainColor: 0, waveColor: 0 });
  for (let i = 0; i < max; i++) r.setStyle(i, color, 0, width);
  r.commitStyle();
  const styles = Array.from({ length: max }, () => ({ color, width, alpha: 1 }));
  const shown = new Uint8Array(max);
  const d = r.data;
  return {
    object: r.mesh,
    count: max,
    /** Set segment i's end points (world). Shows it if hidden. */
    set(i, ax, ay, az, bx, by, bz) {
      const o = i * 8;
      d[o] = ax; d[o + 1] = ay; d[o + 2] = az; d[o + 3] = 0;
      d[o + 4] = bx; d[o + 5] = by; d[o + 6] = bz; d[o + 7] = 0;
      if (!shown[i]) { shown[i] = 1; const s = styles[i]; r.setStyle(i, s.color, s.alpha, s.width); r.commitStyle(); }
    },
    /** Change a segment's look: { color, width, alpha }. */
    style(i, { color, width: w, alpha } = {}) {
      const s = styles[i];
      if (color != null) s.color = color; if (w != null) s.width = w; if (alpha != null) s.alpha = alpha;
      if (shown[i]) { r.setStyle(i, s.color, s.alpha, s.width); r.commitStyle(); }
    },
    hide(i) { if (shown[i]) { shown[i] = 0; r.setAlpha(i, 0); r.commitStyle(); } },
    /** Upload the end points set this frame. */
    commit() { r.tex.needsUpdate = true; },
    setOpacity(o) { r.mat.uniforms.uOpacity.value = o; },
    dispose() { r.dispose(); },
  };
}

/** Build a living orb web. See the header of this file for every option and method. */
export function createWeb(o = {}) {
  const rand = rng(o.seed ?? 1);
  const irr = clamp(o.irregularity ?? 0.5, 0, 1);
  const hub = vec(o.hub, [0, 0, 0]);
  const Nn = nrm3(vec(o.normal, [0, 0, 1]));
  let Vv = vec(o.up, [0, 1, 0]);
  Vv = nrm3(sub3(Vv, mul3(Nn, dot3(Vv, Nn))));
  const Uu = cross3(Vv, Nn);
  const toPlane = (p) => { const d = sub3(p, hub); return [dot3(d, Uu), dot3(d, Vv)]; };
  const fromPlane = (u, v) => [hub[0] + Uu[0] * u + Vv[0] * v, hub[1] + Uu[1] * u + Vv[1] * v, hub[2] + Uu[2] * u + Vv[2] * v];

  // ── frame polygon (plane coords) ──
  let corners;
  if (o.frame && o.frame.length >= 3) corners = o.frame.map((p) => toPlane(vec(p)));
  else {
    const R = o.radius ?? 1, sides = Math.max(3, o.sides ?? 6), rot = o.rotation ?? rand() * TAU;
    corners = [];
    for (let k = 0; k < sides; k++) {
      const a = rot + (k / sides) * TAU + (rand() - 0.5) * irr * 0.6 * (TAU / sides);
      const r = R * (1 + (rand() - 0.5) * irr * 0.4);
      corners.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }
  const NC = corners.length;
  function ray(a) {
    const dx = Math.cos(a), dy = Math.sin(a);
    let best = Infinity, edge = -1, s = 0;
    for (let k = 0; k < NC; k++) {
      const p = corners[k], q = corners[(k + 1) % NC];
      const ex = q[0] - p[0], ey = q[1] - p[1];
      const den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-12) continue;
      const t = (p[0] * ey - p[1] * ex) / den, u = (p[0] * dy - p[1] * dx) / den;
      if (t > 1e-9 && u >= -1e-9 && u <= 1 + 1e-9 && t < best) { best = t; edge = k; s = u; }
    }
    if (edge < 0) throw new Error('web.js: the hub must be inside the frame polygon');
    return { dist: best, edge, s: clamp(s, 0, 1), u: dx * best, v: dy * best };
  }

  // ── spokes ──
  const S = Math.max(3, Math.round(o.spokes ?? 24));
  const a0 = o.spokeAngle ?? rand() * TAU;
  const spokes = [];
  for (let i = 0; i < S; i++) {
    const a = a0 + (i / S) * TAU + (rand() - 0.5) * 2 * irr * 0.28 * (TAU / S);
    const h = ray(a);
    spokes.push({ a, L: h.dist, hit: h, c: Math.cos(a), s: Math.sin(a), nodes: [], fork: 0, lim: 0 });
  }
  const R = spokes.reduce((m, sp) => m + sp.L, 0) / S;
  const maxSeg = o.maxSegment ?? R / 20;
  const baseW = o.width ?? R * 0.003;
  const widthOf = KIND_KEYS.map((k) => baseW * (o.widths?.[k] ?? DEF_WIDTH[k]));
  const colorOf = KIND_KEYS.map((k) => o.colors?.[k] ?? o.color ?? DEF_COLOR[k]);
  const g0 = typeof o.gravity === 'number' || o.gravity == null ? [0, -(o.gravity ?? R * 1.2), 0] : vec(o.gravity);
  const gDir = nrm3(g0);

  // ── node + thread builders ──
  const P = [], nKind = [], nJunc = [], nFree = [], nPin = [];
  function addNode(p, kind, junc, free, pin = 0) {
    P.push(p[0], p[1], p[2]); nKind.push(kind); nJunc.push(junc); nFree.push(free); nPin.push(pin);
    return nKind.length - 1;
  }
  const segA = [], segB = [], segT = [];
  const threads = [];
  function addThread(a, b, kind) {
    const ax = P[a * 3], ay = P[a * 3 + 1], az = P[a * 3 + 2], bx = P[b * 3], by = P[b * 3 + 1], bz = P[b * 3 + 2];
    const L = Math.hypot(bx - ax, by - ay, bz - az);
    const n = Math.max(1, Math.ceil(L / maxSeg - 0.2));
    const ids = [a];
    for (let k = 1; k < n; k++) {
      const u = k / n;
      ids.push(addNode([ax + (bx - ax) * u, ay + (by - ay) * u, az + (bz - az) * u], kind, 0, nFree[a] + (nFree[b] - nFree[a]) * u));
    }
    ids.push(b);
    const T = { index: threads.length, kind, a, b, nodes: ids, segs: [], broken: false, cuts: [] };
    for (let k = 0; k < n; k++) { T.segs.push(segA.length); segA.push(ids[k]); segB.push(ids[k + 1]); segT.push(T.index); }
    threads.push(T);
    return T;
  }

  const hubNode = addNode(hub, KIND.HUB, 1, 1);
  // hub rings
  const hubR = (o.hubRadius ?? 0.075) * R, rings = Math.max(0, Math.round(o.hubRings ?? 3));
  const ringIds = [];
  for (let k = 0; k < rings; k++) {
    const base = hubR * (rings === 1 ? 1 : 0.3 + 0.7 * (k / (rings - 1)));
    ringIds.push(spokes.map((sp) => {
      const r = Math.min(base * (1 + (rand() - 0.5) * irr * 0.3), sp.L * 0.4);
      const id = addNode(fromPlane(sp.c * r, sp.s * r), KIND.HUBRING, 1, 1 - r / sp.L);
      sp.nodes.push({ r, id });
      return id;
    }));
  }
  // forks + spiral limits
  const forkP = o.forks ?? 0.3 * irr * 2;
  for (const sp of spokes) {
    sp.fork = rand() < forkP ? sp.L * (0.86 + rand() * 0.07) : 0;
    sp.lim = Math.min((o.spiral?.end ?? 0.9) * sp.L, sp.fork ? sp.fork - 0.6 * (o.spiral?.spacing ?? R / 24) : Infinity);
  }
  // capture spiral junctions
  const spc = o.spiral ?? {};
  const spacing = spc.spacing ?? R / 24;
  const rStart = Math.max(hubR * 1.7, (spc.start ?? 0.2) * R);
  const follow = spc.follow ?? 0.35, growth = spc.growth ?? 0.3;
  const J = new Map();
  const lastR = spokes.map((sp) => (sp.nodes.length ? sp.nodes[sp.nodes.length - 1].r : 0));
  for (let n = 0; n < 2000; n++) {
    let any = false;
    for (let i = 0; i < S; i++) {
      const sp = spokes[i];
      const uu = n + i / S;
      const rb = rStart + spacing * uu * (1 + (growth * uu * spacing) / R);
      const g = 1 + follow * (sp.L / R - 1);
      if (rb * g < sp.lim) any = true;
      let r = rb * g + (rand() - 0.5) * irr * 0.4 * spacing;
      r = Math.max(r, lastR[i] + spacing * 0.35);
      if (r < sp.lim) {
        lastR[i] = r;
        const id = addNode(fromPlane(sp.c * r, sp.s * r), KIND.SPIRAL, 1, 1 - r / sp.L);
        sp.nodes.push({ r, id });
        J.set(n * S + i, id);
      }
    }
    if (!any) break;
  }
  // frame corners, spoke ends on the frame
  const moorings = o.moorings ?? null;
  const moored = new Set((moorings ?? []).map((m) => m[0]));
  const cornerIds = corners.map((c, k) => addNode(fromPlane(c[0], c[1]), KIND.FRAME, 1, 0.03, moored.has(k) ? 0 : 1));
  const edgeHits = corners.map(() => []);
  const frameNode = (h) => { const id = addNode(fromPlane(h.u, h.v), KIND.FRAME, 1, 0.06); edgeHits[h.edge].push({ s: h.s, id }); return id; };
  const branches = [];
  for (const sp of spokes) {
    if (sp.fork) {
      const id = addNode(fromPlane(sp.c * sp.fork, sp.s * sp.fork), KIND.SPOKE, 1, 1 - sp.fork / sp.L);
      sp.nodes.push({ r: sp.fork, id });
      const d = (TAU / S) * (0.16 + rand() * 0.14);
      branches.push([id, frameNode(ray(sp.a - d))], [id, frameNode(ray(sp.a + d))]);
    } else sp.nodes.push({ r: sp.L, id: frameNode(sp.hit) });
  }

  // ── threads ──
  // spokes run from the innermost hub ring outward; the hub node holds that ring with a few short threads (the hub mat)
  const hubMat = Math.max(3, Math.round(o.hubMat ?? S / 4));
  spokes.forEach((sp, i) => {
    let prev = rings ? -1 : hubNode;
    for (const nd of sp.nodes) {
      if (prev >= 0) addThread(prev, nd.id, nd.r <= hubR * 1.05 ? KIND.HUB : KIND.SPOKE);
      prev = nd.id;
    }
    if (rings && i % Math.max(1, Math.round(S / hubMat)) === 0) addThread(hubNode, sp.nodes[0].id, KIND.HUB);
  });
  for (const [a, b] of branches) addThread(a, b, KIND.SPOKE);
  for (let k = 0; k < rings; k++) {
    for (let i = 0; i < S; i++) if (rand() > 0.12 * irr) addThread(ringIds[k][i], ringIds[k][(i + 1) % S], KIND.HUBRING);
  }
  const missing = o.missing ?? 0.02;
  for (const [key, id] of J) {
    const nb = J.get(key + 1);
    if (nb != null && rand() >= missing) addThread(id, nb, KIND.SPIRAL);
  }
  for (let k = 0; k < NC; k++) {
    const hits = edgeHits[k].sort((p, q) => p.s - q.s);
    let prev = cornerIds[k];
    for (const h of hits) { addThread(prev, h.id, KIND.FRAME); prev = h.id; }
    addThread(prev, cornerIds[(k + 1) % NC], KIND.FRAME);
  }
  const anchorIds = [];
  for (const [k, p] of moorings ?? []) {
    const id = addNode(vec(p), KIND.MOOR, 1, 0, 1);
    anchorIds.push(id);
    addThread(cornerIds[k], id, KIND.MOOR);
  }
  cornerIds.forEach((id) => { if (nPin[id]) anchorIds.push(id); });

  // ── gravity sag on long threads ──
  const sagMul = o.sag ?? 1;
  for (const T of threads) {
    if (T.nodes.length < 3) continue;
    const a = T.a * 3, b = T.b * 3;
    const tx = P[b] - P[a], ty = P[b + 1] - P[a + 1], tz = P[b + 2] - P[a + 2];
    const L = Math.hypot(tx, ty, tz) || 1;
    const td = [tx / L, ty / L, tz / L];
    const gp = sub3(gDir, mul3(td, dot3(gDir, td)));
    const amt = DEF_SAG[T.kind] * sagMul * L;
    const n = T.nodes.length - 1;
    for (let k = 1; k < n; k++) {
      const u = k / n, f = 4 * u * (1 - u) * amt, id = T.nodes[k] * 3;
      P[id] += gp[0] * f; P[id + 1] += gp[1] * f; P[id + 2] += gp[2] * f;
    }
  }

  // ── typed state ──
  const count = nKind.length, SC = segA.length;
  const pos = new Float32Array(P), prev = new Float32Array(P), rest = new Float32Array(P), disp = new Float32Array(P);
  const inv = new Float32Array(count), mem = new Float32Array(count), memBase = new Float32Array(count).fill(1);
  const kind = Uint8Array.from(nKind), junc = Uint8Array.from(nJunc), pinned = Uint8Array.from(nPin);
  const free = Float32Array.from(nFree);
  for (let i = 0; i < count; i++) { inv[i] = pinned[i] ? 0 : 1; mem[i] = 1; }
  const sa = Int32Array.from(segA), sb = Int32Array.from(segB), sThread = Int32Array.from(segT);
  const sRest = new Float32Array(SC), sRest0 = new Float32Array(SC), sAlive = new Uint8Array(SC).fill(1), sStrain = new Float32Array(SC);
  const sWave = new Float32Array(SC), sBaseAlpha = new Float32Array(SC).fill(1);
  for (let s = 0; s < SC; s++) {
    const a = sa[s] * 3, b = sb[s] * 3;
    sRest[s] = sRest0[s] = Math.hypot(pos[b] - pos[a], pos[b + 1] - pos[a + 1], pos[b + 2] - pos[a + 2]);
  }
  const sortedLen = Array.from(sRest0).sort((x, y) => x - y);
  const Lref = sortedLen[sortedLen.length >> 1] || maxSeg;
  for (let s = 0; s < SC; s++) sWave[s] = clamp(Lref / Math.max(1e-6, sRest0[s]), 0.35, 2.5);
  // adjacency (CSR)
  const deg = new Int32Array(count);
  for (let s = 0; s < SC; s++) { deg[sa[s]]++; deg[sb[s]]++; }
  const adjStart = new Int32Array(count + 1);
  for (let i = 0; i < count; i++) adjStart[i + 1] = adjStart[i] + deg[i];
  const adjSeg = new Int32Array(adjStart[count]), fill = adjStart.slice(0, count);
  for (let s = 0; s < SC; s++) { adjSeg[fill[sa[s]]++] = s; adjSeg[fill[sb[s]]++] = s; }
  const other = (s, i) => (sa[s] === i ? sb[s] : sa[s]);
  // display direction for the wave (transverse to the thread, in the plane) and plane coords of rest
  const wdir = new Float32Array(count * 3), wdirS = new Float32Array(count);
  const restU = new Float32Array(count), restV = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const pl = toPlane([rest[i * 3], rest[i * 3 + 1], rest[i * 3 + 2]]);
    restU[i] = pl[0]; restV[i] = pl[1];
  }
  for (const T of threads) {
    const a = T.a * 3, b = T.b * 3;
    const td = nrm3([rest[b] - rest[a], rest[b + 1] - rest[a + 1], rest[b + 2] - rest[a + 2]]);
    const tr = nrm3(cross3(Nn, td));
    for (let k = 1; k < T.nodes.length - 1; k++) { const i = T.nodes[k]; wdir.set(tr, i * 3); wdirS[i] = 1; }
  }
  for (let i = 0; i < count; i++) {
    if (!junc[i] || pinned[i] || i === hubNode) continue;
    const r = Math.hypot(restU[i], restV[i]) || 1;
    const rad = [(Uu[0] * restU[i] + Vv[0] * restV[i]) / r, (Uu[1] * restU[i] + Vv[1] * restV[i]) / r, (Uu[2] * restU[i] + Vv[2] * restV[i]) / r];
    wdir.set(nrm3(cross3(Nn, rad)), i * 3); wdirS[i] = 0.35;
  }
  const junctions = Int32Array.from([...Array(count).keys()].filter((i) => junc[i] && !pinned[i]));

  // wind: a few global sinusoids with per-node phases (cheap per frame)
  const WK = 3;
  const wPh = new Float32Array(count * WK * 3 * 2);
  const wFreq = [0.37, 0.23, 0.13], wAmp = [0.5, 0.33, 0.22];
  for (let i = 0; i < count; i++) {
    const u = restU[i] / R, v = restV[i] / R;
    for (let k = 0; k < WK; k++) {
      for (let c = 0; c < 3; c++) {
        const ph = (c === 0 ? v * (1.9 - k * 0.4) + u * 0.6 : c === 1 ? u * (1.7 - k * 0.3) - v * 0.5 : (u + v) * 1.4) + k * 2.1 + c * 1.3;
        const o2 = ((i * WK + k) * 3 + c) * 2;
        wPh[o2] = Math.cos(ph); wPh[o2 + 1] = Math.sin(ph);
      }
    }
  }
  const wind = { amp: R * 0.006, normal: 0, speed: 1, ...(o.wind ?? {}) };
  const tgt = new Float32Array(count * 3);

  // wave layer
  const wu = new Float32Array(count), wv = new Float32Array(count), wacc = new Float32Array(count), vacc = new Float32Array(count), wsum = new Float32Array(count);
  const waveO = { speed: 22 * Lref, damping: 1.7, viscosity: 0.12, plane: 1, normal: 0, glint: 1, ...(o.wave ?? {}) };
  let waveK = Math.min(2 * (waveO.speed / Lref) ** 2, 0.9 / (STEP * STEP));
  const recomputeWsum = (i) => {
    let w = 0;
    for (let k = adjStart[i]; k < adjStart[i + 1]; k++) { const s = adjSeg[k]; if (sAlive[s]) w += sWave[s]; }
    wsum[i] = w;
  };
  for (let i = 0; i < count; i++) recomputeWsum(i);

  // forces, pokes, attachments
  const fAcc = new Float32Array(count * 3);
  let hasForce = false;
  const pokes = [];
  const attachments = [];
  const mending = [];
  const nodeStrain = new Float32Array(count);
  const damping = o.damping ?? 0.045, memK = o.memory ?? 0.045, iters = Math.max(1, o.iterations ?? 6), stiff = clamp(o.stiffness ?? 1, 0.05, 1);
  const breakStrain = o.breakStrain ?? Infinity;
  const strainGain = o.strainGain ?? 6;
  const useStrainColor = o.strainColor != null;
  let simT = 0, acc = 0;

  // ── renderer ──
  const ribbons = makeRibbons(count, sa, sb, SC, {
    opacity: o.opacity ?? 1, minPx: o.minPx ?? 1.15, feather: o.feather ?? 1, renderOrder: o.renderOrder ?? 0,
    waveColor: o.waveColor ?? 0x5a5a5a, strainColor: o.strainColor ?? 0xff2414, depthTest: o.depthTest ?? true, sheen: o.sheen,
  });
  const sheenO = { amount: 0, angle: 0.7, speed: 0, color: 0xffffff, ...(o.sheen ?? {}) };
  const info = { segment: 0, thread: 0, kind: 0, kindName: '', r: 0, angle: 0, color: 0, width: 0, alpha: 1 };
  for (let s = 0; s < SC; s++) {
    const k = threads[sThread[s]].kind;
    let col = colorOf[k], w = widthOf[k], al = 1;
    if (typeof o.style === 'function') {
      const a = sa[s], b = sb[s];
      const mu = (restU[a] + restU[b]) / 2, mv = (restV[a] + restV[b]) / 2;
      Object.assign(info, { segment: s, thread: sThread[s], kind: k, kindName: KIND_KEYS[k], r: Math.hypot(mu, mv) / R, angle: Math.atan2(mv, mu), color: col, width: w, alpha: 1 });
      const r = o.style(info);
      if (r) { if (r.color != null) col = r.color; if (r.width != null) w = r.width; if (r.alpha != null) al = r.alpha; }
    }
    sBaseAlpha[s] = al;
    ribbons.setStyle(s, col, al, w);
  }
  ribbons.commitStyle();
  const object = new THREE.Group();
  object.name = 'web';
  object.add(ribbons.mesh);

  // dew
  let dew = null;
  const dewO = o.dew ?? null;
  const drops = [];
  if (dewO && dewO.count > 0) {
    // strings of beads along a few capture threads, big and small in turn, like dew really sits on silk
    const cand = threads.filter((T) => T.kind === KIND.SPIRAL && T.segs.length >= 2);
    const dsize = dewO.size ?? R * 0.006, gap = dewO.gap ?? dsize * 3.4;
    for (let tries = 0; drops.length < dewO.count && tries < 200 && cand.length; tries++) {
      const T = cand.splice((rand() * cand.length) | 0, 1)[0];
      const base = dsize * (0.75 + rand() * 0.4);
      let k = 0;
      for (const s of T.segs) {
        const L = sRest0[s], n = Math.max(1, Math.floor(L / gap));
        for (let j = 0; j < n && drops.length < dewO.count; j++, k++) {
          if (rand() < 0.18) continue;
          const t = (j + 0.5 + (rand() - 0.5) * 0.3) / n;
          drops.push({ s, t, size: base * (k % 2 ? 0.5 + rand() * 0.2 : 0.9 + rand() * 0.2), ph: rand() * TAU, ax: nrm3([rand() - 0.5, rand() - 0.5, rand() - 0.5]) });
        }
      }
    }
    const dg = new THREE.OctahedronGeometry(1, 0);
    const dm = new THREE.MeshStandardMaterial({ color: dewO.color ?? 0xcfd3d6, roughness: 0.18, metalness: 0.05, flatShading: true });
    dew = new THREE.InstancedMesh(dg, dm, drops.length);
    dew.frustumCulled = false;
    dew.renderOrder = (o.renderOrder ?? 0) - 1;
    object.add(dew);
  }

  // ── simulation ──
  function updateMem(i) {
    if (!junc[i]) return;
    let alive = 0, total = 0;
    for (let k = adjStart[i]; k < adjStart[i + 1]; k++) { total++; if (sAlive[adjSeg[k]]) alive++; }
    const f = total ? alive / total : 1;
    memBase[i] = f * f;
    mem[i] = memBase[i];
  }

  function windTargets() {
    const t = simT * wind.speed;
    const cs = [], sn = [];
    for (let k = 0; k < WK; k++) { cs.push(Math.cos(t * wFreq[k] * TAU * 0.25)); sn.push(Math.sin(t * wFreq[k] * TAU * 0.25)); }
    const gust = 1 + 0.9 * Math.pow(Math.max(0, Math.sin(t * 0.071 * TAU + 1.3)), 6);
    const A = wind.amp * gust, An = wind.normal * gust;
    for (let i = 0; i < count; i++) {
      const f = free[i];
      const i3 = i * 3;
      if (f <= 0.0001 || (A === 0 && An === 0)) { tgt[i3] = rest[i3]; tgt[i3 + 1] = rest[i3 + 1]; tgt[i3 + 2] = rest[i3 + 2]; continue; }
      let du = 0, dv = 0, dn = 0;
      for (let k = 0; k < WK; k++) {
        const o2 = (i * WK + k) * 6;
        // sin(wt + ph) = sin wt cos ph + cos wt sin ph
        du += wAmp[k] * (sn[k] * wPh[o2] + cs[k] * wPh[o2 + 1]);
        dv += wAmp[k] * (sn[k] * wPh[o2 + 2] + cs[k] * wPh[o2 + 3]);
        dn += wAmp[k] * (sn[k] * wPh[o2 + 4] + cs[k] * wPh[o2 + 5]);
      }
      const ff = Math.pow(f, 0.8);
      du *= A * ff; dv *= A * ff; dn *= An * ff;
      tgt[i3] = rest[i3] + Uu[0] * du + Vv[0] * dv + Nn[0] * dn;
      tgt[i3 + 1] = rest[i3 + 1] + Uu[1] * du + Vv[1] * dv + Nn[1] * dn;
      tgt[i3 + 2] = rest[i3 + 2] + Uu[2] * du + Vv[2] * dv + Nn[2] * dn;
    }
  }

  // The cursor (or a finger, a claw...): threads near it are dragged along its motion and nudged out of its way, up to
  // p.max from where they belong; past that they slip off it and twang back (a wave starts there).
  const held = new Uint8Array(count);
  function applyPoke(p, h) {
    const r = p.r, r2 = r * r, maxD = p.max, s = p.s;
    const vl = Math.hypot(p.vx, p.vy, p.vz);
    const adv = Math.min(vl * h, r * 0.3);
    const vx = vl > 1e-6 ? (p.vx / vl) * adv : 0, vy = vl > 1e-6 ? (p.vy / vl) * adv : 0, vz = vl > 1e-6 ? (p.vz / vl) * adv : 0;
    for (let i = 0; i < count; i++) {
      if (inv[i] === 0) continue;
      const i3 = i * 3;
      let dx = pos[i3] - p.x, dy = pos[i3 + 1] - p.y, dz = pos[i3 + 2] - p.z;
      const dn = dx * Nn[0] + dy * Nn[1] + dz * Nn[2];
      dx -= Nn[0] * dn; dy -= Nn[1] * dn; dz -= Nn[2] * dn;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 >= r2) { if (held[i]) held[i] = 0; continue; }
      const d = Math.sqrt(d2);
      const k = 1 - d / r, fall = k * k * (3 - 2 * k);
      const ex = pos[i3] - tgt[i3], ey = pos[i3 + 1] - tgt[i3 + 1], ez = pos[i3 + 2] - tgt[i3 + 2];
      const disp0 = Math.sqrt(ex * ex + ey * ey + ez * ez);
      if (disp0 >= maxD) {
        if (held[i]) {
          // slipped off: let it go with a twang
          held[i] = 0;
          const tw = (ex * wdir[i3] + ey * wdir[i3 + 1] + ez * wdir[i3 + 2]) >= 0 ? 1 : -1;
          wv[i] -= tw * Math.min(disp0, maxD) * Math.sqrt(waveK) * 0.35 * p.twang;
        }
        continue;
      }
      held[i] = 1;
      const room = 1 - disp0 / maxD;
      if (p.mode === 'normal') {
        const push = -s * maxD * fall * memK * 1.6 * room;
        pos[i3] += Nn[0] * push; pos[i3 + 1] += Nn[1] * push; pos[i3 + 2] += Nn[2] * push;
        continue;
      }
      let nx, ny, nz;
      if (d > 1e-6) { nx = dx / d; ny = dy / d; nz = dz / d; } else { nx = Uu[0]; ny = Uu[1]; nz = Uu[2]; }
      const dent = p.dent * fall * s * memK * 1.3;
      const drag = fall * s * p.drag * room;
      pos[i3] += nx * dent + vx * drag; pos[i3 + 1] += ny * dent + vy * drag; pos[i3 + 2] += nz * dent + vz * drag;
    }
  }

  function step(h, frac) {
    simT += h;
    const ret = 1 - damping;
    const h2 = h * h;
    const gx = g0[0] * h2, gy = g0[1] * h2, gz = g0[2] * h2;
    for (let i = 0; i < count; i++) {
      if (inv[i] === 0) continue;
      const i3 = i * 3;
      const x = pos[i3], y = pos[i3 + 1], z = pos[i3 + 2];
      const gw = 1 - mem[i];
      let nx = x + (x - prev[i3]) * ret + gx * gw, ny = y + (y - prev[i3 + 1]) * ret + gy * gw, nz = z + (z - prev[i3 + 2]) * ret + gz * gw;
      if (hasForce) { nx += fAcc[i3] * h2; ny += fAcc[i3 + 1] * h2; nz += fAcc[i3 + 2] * h2; }
      const m = mem[i] * memK;
      if (m > 0) { nx += (tgt[i3] - nx) * m; ny += (tgt[i3 + 1] - ny) * m; nz += (tgt[i3 + 2] - nz) * m; }
      prev[i3] = x; prev[i3 + 1] = y; prev[i3 + 2] = z;
      pos[i3] = nx; pos[i3 + 1] = ny; pos[i3 + 2] = nz;
    }
    for (const p of pokes) applyPoke(p, h);
    for (const at of attachments) {
      const i3 = at.node * 3;
      const tx = at.prev[0] + (at.cur[0] - at.prev[0]) * frac, ty = at.prev[1] + (at.cur[1] - at.prev[1]) * frac, tz = at.prev[2] + (at.cur[2] - at.prev[2]) * frac;
      if (at.stiffness >= 1) {
        prev[i3] = pos[i3]; prev[i3 + 1] = pos[i3 + 1]; prev[i3 + 2] = pos[i3 + 2];
        pos[i3] = tx; pos[i3 + 1] = ty; pos[i3 + 2] = tz;
      } else {
        const k = at.stiffness;
        pos[i3] += (tx - pos[i3]) * k; pos[i3 + 1] += (ty - pos[i3 + 1]) * k; pos[i3 + 2] += (tz - pos[i3 + 2]) * k;
      }
    }
    for (let it = 0; it < iters; it++) {
      for (let s = 0; s < SC; s++) {
        if (!sAlive[s]) continue;
        const a = sa[s], b = sb[s];
        const wa = inv[a], wb = inv[b], W = wa + wb;
        if (W === 0) continue;
        const a3 = a * 3, b3 = b * 3;
        const dx = pos[b3] - pos[a3], dy = pos[b3 + 1] - pos[a3 + 1], dz = pos[b3 + 2] - pos[a3 + 2];
        const d2 = dx * dx + dy * dy + dz * dz, r = sRest[s];
        if (d2 <= r * r) continue;
        const d = Math.sqrt(d2);
        const c = ((d - r) / (d * W)) * stiff;
        pos[a3] += dx * c * wa; pos[a3 + 1] += dy * c * wa; pos[a3 + 2] += dz * c * wa;
        pos[b3] -= dx * c * wb; pos[b3 + 1] -= dy * c * wb; pos[b3 + 2] -= dz * c * wb;
      }
    }
    // waves (symplectic Euler on the weighted graph Laplacian, plus a little viscosity that eats zigzag modes)
    for (let s = 0; s < SC; s++) {
      if (!sAlive[s]) continue;
      const a = sa[s], b = sb[s], ws = sWave[s], w = ws * (wu[b] - wu[a]), v = ws * (wv[b] - wv[a]);
      wacc[a] += w; wacc[b] -= w;
      vacc[a] += v; vacc[b] -= v;
    }
    const wret = Math.exp(-waveO.damping * h), visc = waveO.viscosity;
    for (let i = 0; i < count; i++) {
      if (pinned[i] || wsum[i] === 0) { wu[i] = 0; wv[i] = 0; wacc[i] = 0; vacc[i] = 0; continue; }
      const iw = 1 / wsum[i];
      wv[i] = (wv[i] + h * waveK * wacc[i] * iw + visc * vacc[i] * iw) * wret;
      wu[i] += h * wv[i];
      wacc[i] = 0; vacc[i] = 0;
    }
  }

  function measure() {
    let worst = 0, worstS = -1;
    nodeStrain.fill(0);
    for (let s = 0; s < SC; s++) {
      if (!sAlive[s]) { sStrain[s] = 0; continue; }
      const a3 = sa[s] * 3, b3 = sb[s] * 3;
      const d = Math.hypot(pos[b3] - pos[a3], pos[b3 + 1] - pos[a3 + 1], pos[b3 + 2] - pos[a3 + 2]);
      const st = Math.max(0, d / sRest0[s] - 1);
      sStrain[s] = st;
      if (st > nodeStrain[sa[s]]) nodeStrain[sa[s]] = st;
      if (st > nodeStrain[sb[s]]) nodeStrain[sb[s]] = st;
      if (st > worst && !mendingSeg(s)) { worst = st; worstS = s; }
    }
    if (worst > breakStrain && worstS >= 0) cutSeg(worstS, false);
    for (const at of attachments) {
      const i = at.node, i3 = i * 3;
      let px = 0, py = 0, pz = 0, mx = 0;
      for (let k = adjStart[i]; k < adjStart[i + 1]; k++) {
        const s = adjSeg[k];
        if (!sAlive[s]) continue;
        const j3 = other(s, i) * 3;
        const dx = pos[j3] - pos[i3], dy = pos[j3 + 1] - pos[i3 + 1], dz = pos[j3 + 2] - pos[i3 + 2];
        const d = Math.hypot(dx, dy, dz) || 1;
        const st = sStrain[s];
        px += (dx / d) * st; py += (dy / d) * st; pz += (dz / d) * st;
        if (st > mx) mx = st;
      }
      at.handle.pull.set(px, py, pz);
      at.handle.strain = mx;
    }
  }
  const mendingSeg = (s) => mending.some((m) => m.segs.includes(s));

  const glintRef = Lref * 0.3;
  function publish() {
    const d = ribbons.data;
    const pa = waveO.plane, na = waveO.normal, gl = waveO.glint;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3, u = wu[i];
      const k = u * wdirS[i] * pa;
      const x = pos[i3] + wdir[i3] * k + Nn[0] * u * na, y = pos[i3 + 1] + wdir[i3 + 1] * k + Nn[1] * u * na, z = pos[i3 + 2] + wdir[i3 + 2] * k + Nn[2] * u * na;
      disp[i3] = x; disp[i3 + 1] = y; disp[i3 + 2] = z;
      const o4 = i * 4;
      d[o4] = x; d[o4 + 1] = y; d[o4 + 2] = z;
      const g = Math.min(0.8, (Math.abs(u) / glintRef) * gl);
      d[o4 + 3] = Math.floor(g * 254) + (useStrainColor ? Math.min(0.999, nodeStrain[i] * strainGain) : 0);
    }
    ribbons.tex.needsUpdate = true;
    if (dew) {
      for (let k = 0; k < drops.length; k++) {
        const dp = drops[k];
        const a3 = sa[dp.s] * 3, b3 = sb[dp.s] * 3;
        const sc = sAlive[dp.s] ? dp.size : 0;
        _p.set(disp[a3] + (disp[b3] - disp[a3]) * dp.t, disp[a3 + 1] + (disp[b3 + 1] - disp[a3 + 1]) * dp.t, disp[a3 + 2] + (disp[b3 + 2] - disp[a3 + 2]) * dp.t);
        const wob = (wu[sa[dp.s]] + wu[sb[dp.s]]) / (glintRef * 2);
        _q.setFromAxisAngle(_ax.set(dp.ax[0], dp.ax[1], dp.ax[2]), dp.ph + simT * 0.35 + wob * 0.9);
        _s.set(sc, sc * 1.1, sc);
        _m.compose(_p, _q, _s);
        dew.setMatrixAt(k, _m);
      }
      dew.instanceMatrix.needsUpdate = true;
    }
  }
  const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _m = new THREE.Matrix4(), _ax = new THREE.Vector3();
  const _ray = new THREE.Ray(), _pl = new THREE.Plane();

  function cutSeg(s, silent) {
    if (s < 0 || s >= SC || !sAlive[s]) return false;
    sAlive[s] = 0;
    const T = threads[sThread[s]];
    T.broken = true;
    T.cuts.push(s);
    for (let k = 1; k < T.nodes.length - 1; k++) { const i = T.nodes[k]; memBase[i] = 0; mem[i] = 0; }
    updateMem(sa[s]); updateMem(sb[s]);
    recomputeWsum(sa[s]); recomputeWsum(sb[s]);
    ribbons.setAlpha(s, 0); ribbons.commitStyle();
    if (!silent && typeof api.onSnap === 'function') api.onSnap(T.index, s);
    return true;
  }

  // ── nearest-point grid (rest positions, plane coords) ──
  const cell = Math.max(maxSeg * 1.6, 1e-6);
  let gMinU = Infinity, gMinV = Infinity, gMaxU = -Infinity, gMaxV = -Infinity;
  for (let i = 0; i < count; i++) { gMinU = Math.min(gMinU, restU[i]); gMaxU = Math.max(gMaxU, restU[i]); gMinV = Math.min(gMinV, restV[i]); gMaxV = Math.max(gMaxV, restV[i]); }
  const gW = Math.max(1, Math.ceil((gMaxU - gMinU) / cell) + 1), gH = Math.max(1, Math.ceil((gMaxV - gMinV) / cell) + 1);
  const gridOK = gW * gH < 4e6;
  const cellStart = gridOK ? new Int32Array(gW * gH + 1) : null;
  let cellItems = null;
  if (gridOK) {
    const cellsOf = (s, fn) => {
      const a = sa[s], b = sb[s];
      const u0 = Math.floor((Math.min(restU[a], restU[b]) - gMinU) / cell), u1 = Math.floor((Math.max(restU[a], restU[b]) - gMinU) / cell);
      const v0 = Math.floor((Math.min(restV[a], restV[b]) - gMinV) / cell), v1 = Math.floor((Math.max(restV[a], restV[b]) - gMinV) / cell);
      for (let v = v0; v <= v1; v++) for (let u = u0; u <= u1; u++) fn(v * gW + u);
    };
    const cnt = new Int32Array(gW * gH);
    for (let s = 0; s < SC; s++) cellsOf(s, (c) => cnt[c]++);
    for (let c = 0; c < gW * gH; c++) cellStart[c + 1] = cellStart[c] + cnt[c];
    cellItems = new Int32Array(cellStart[gW * gH]);
    const f2 = cellStart.slice(0, gW * gH);
    for (let s = 0; s < SC; s++) cellsOf(s, (c) => { cellItems[f2[c]++] = s; });
  }
  let _nt = 0;
  function segDist2(s, x, y, z) {
    const a3 = sa[s] * 3, b3 = sb[s] * 3;
    const ax = disp[a3], ay = disp[a3 + 1], az = disp[a3 + 2];
    const ex = disp[b3] - ax, ey = disp[b3 + 1] - ay, ez = disp[b3 + 2] - az;
    const L2 = ex * ex + ey * ey + ez * ez;
    let t = L2 > 1e-12 ? ((x - ax) * ex + (y - ay) * ey + (z - az) * ez) / L2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    _nt = t;
    const dx = ax + ex * t - x, dy = ay + ey * t - y, dz = az + ez * t - z;
    return dx * dx + dy * dy + dz * dz;
  }
  const isLoose = (s) => mem[sa[s]] < 0.5 || mem[sb[s]] < 0.5 || (inv[sa[s]] && memBase[sa[s]] < 0.5) || (inv[sb[s]] && memBase[sb[s]] < 0.5);

  // ── API ──
  const api = {
    object, mesh: ribbons.mesh, dew,
    count, points: disp, sim: pos, rest, kind, junction: junc, hub: hubNode, anchors: anchorIds, corners: cornerIds, junctions,
    threads,
    segments: { count: SC, a: sa, b: sb, thread: sThread, alive: sAlive, rest: sRest0, strain: sStrain },
    radius: R, spacing,
    plane: { origin: new THREE.Vector3(...hub), u: new THREE.Vector3(...Uu), v: new THREE.Vector3(...Vv), normal: new THREE.Vector3(...Nn) },
    onSnap: null,

    update(dt = 0) {
      for (const at of attachments) at.read();
      windTargets();
      let n = 0;
      if (dt > 0) {
        acc = Math.min(acc + dt, STEP * 4);
        n = Math.min(4, Math.floor((acc + 1e-6) / STEP));
        acc -= n * STEP;
        if (acc < 0) acc = 0;
      }
      for (let k = 0; k < n; k++) step(STEP, (k + 1) / n);
      if (sheenO.speed) ribbons.mat.uniforms.uSheenAngle.value = sheenO.angle + Math.sin(simT * sheenO.speed) * 0.6;
      // mending threads
      for (let m = mending.length - 1; m >= 0; m--) {
        const md = mending[m];
        md.t = Math.min(md.dur, md.t + (dt > 0 ? dt : 0));
        const e = md.t / md.dur, k = e * e * (3 - 2 * e);
        md.segs.forEach((s, j) => { sRest[s] = md.r0[j] + (sRest0[s] - md.r0[j]) * k; ribbons.setAlpha(s, k * sBaseAlpha[s]); });
        for (let q = 1; q < md.T.nodes.length - 1; q++) { const i = md.T.nodes[q]; memBase[i] = k; mem[i] = k; }
        ribbons.commitStyle();
        if (md.t >= md.dur) { md.T.broken = false; md.T.cuts.length = 0; mending.splice(m, 1); }
      }
      for (const at of attachments) { at.prev[0] = at.cur[0]; at.prev[1] = at.cur[1]; at.prev[2] = at.cur[2]; }
      measure();
      publish();
      pokes.length = 0;
      if (hasForce) { fAcc.fill(0); hasForce = false; }
    },

    poke(x, y, z, radius, strength = 1, opts = {}) {
      if (!(radius > 0) || !strength) return;
      const q = typeof opts === 'string' ? { mode: opts } : opts;
      pokes.push({
        x, y, z, r: radius, s: strength, mode: q.mode ?? 'plane', vx: q.vx ?? 0, vy: q.vy ?? 0, vz: q.vz ?? 0,
        max: q.max ?? radius * 0.4, dent: q.dent ?? radius * 0.12, twang: q.twang ?? 1, drag: q.drag ?? 0.6,
      });
    },

    pluck(target, amount, radius = 0) {
      let i = typeof target === 'number' ? target : api.nearestNode(...vec(target));
      if (i == null || i < 0) return;
      const v0 = amount * Math.sqrt(waveK) * 0.9;
      if (radius > 0) {
        const c3 = i * 3, r2 = radius * radius;
        for (let j = 0; j < count; j++) {
          const j3 = j * 3;
          const d2 = (disp[j3] - disp[c3]) ** 2 + (disp[j3 + 1] - disp[c3 + 1]) ** 2 + (disp[j3 + 2] - disp[c3 + 2]) ** 2;
          if (d2 < r2) { const k = 1 - Math.sqrt(d2 / r2); wv[j] += v0 * k * k; }
        }
      } else {
        wv[i] += v0;
        for (let k = adjStart[i]; k < adjStart[i + 1]; k++) { const s = adjSeg[k]; if (sAlive[s]) wv[other(s, i)] += v0 * 0.5; }
      }
    },

    impulse(x, y, z, vx, vy, vz, radius) {
      const r2 = radius * radius;
      for (let i = 0; i < count; i++) {
        if (inv[i] === 0) continue;
        const i3 = i * 3;
        const d2 = (pos[i3] - x) ** 2 + (pos[i3 + 1] - y) ** 2 + (pos[i3 + 2] - z) ** 2;
        if (d2 >= r2) continue;
        const k = 1 - Math.sqrt(d2 / r2), f = k * k * STEP;
        prev[i3] -= vx * f; prev[i3 + 1] -= vy * f; prev[i3 + 2] -= vz * f;
      }
    },

    force(x, y, z, fx, fy, fz, radius) {
      const r2 = radius * radius;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const d2 = (pos[i3] - x) ** 2 + (pos[i3 + 1] - y) ** 2 + (pos[i3 + 2] - z) ** 2;
        if (d2 >= r2) continue;
        const k = 1 - Math.sqrt(d2 / r2), f = k * k;
        fAcc[i3] += fx * f; fAcc[i3 + 1] += fy * f; fAcc[i3 + 2] += fz * f;
        hasForce = true;
      }
    },

    attach(target, getPos, { stiffness = 1 } = {}) {
      const node = typeof target === 'number' ? target : api.nearestNode(...vec(target));
      const at = {
        node, stiffness: clamp(stiffness, 0.01, 1), cur: [0, 0, 0], prev: [0, 0, 0],
        read() { const p = getPos(); const v = vec(p, [0, 0, 0]); at.cur[0] = v[0]; at.cur[1] = v[1]; at.cur[2] = v[2]; },
      };
      at.read();
      at.prev[0] = at.cur[0]; at.prev[1] = at.cur[1]; at.prev[2] = at.cur[2];
      if (at.stiffness >= 1) inv[node] = 0;
      const handle = {
        node, pull: new THREE.Vector3(), strain: 0,
        detach() {
          const k = attachments.indexOf(at);
          if (k >= 0) attachments.splice(k, 1);
          if (!pinned[node] && !attachments.some((x) => x.node === node && x.stiffness >= 1)) inv[node] = 1;
        },
      };
      at.handle = handle;
      attachments.push(at);
      return handle;
    },

    pin(i, p) {
      pinned[i] = 1; inv[i] = 0;
      if (p) { const v = vec(p); pos.set(v, i * 3); prev.set(v, i * 3); }
    },
    unpin(i) { pinned[i] = 0; if (!attachments.some((x) => x.node === i && x.stiffness >= 1)) inv[i] = 1; },

    snap(t, segIndex) {
      const T = threads[t];
      if (!T) return false;
      const s = segIndex != null ? segIndex : T.segs[(T.segs.length - 1) >> 1];
      return cutSeg(s, false);
    },
    cut(s) { return cutSeg(s, false); },
    mend(t, seconds = 1.2) {
      const T = threads[t];
      if (!T || !T.broken || mending.some((m) => m.T === T)) return false;
      const segs = T.cuts.slice();
      const r0 = segs.map((s) => {
        sAlive[s] = 1;
        const a3 = sa[s] * 3, b3 = sb[s] * 3;
        return Math.max(sRest0[s], Math.hypot(pos[b3] - pos[a3], pos[b3 + 1] - pos[a3 + 1], pos[b3 + 2] - pos[a3 + 2]));
      });
      segs.forEach((s) => { updateMem(sa[s]); updateMem(sb[s]); recomputeWsum(sa[s]); recomputeWsum(sb[s]); });
      mending.push({ T, segs, r0, t: 0, dur: Math.max(0.05, seconds) });
      return true;
    },

    tension(t) { const T = threads[t]; let m = 0; if (T) for (const s of T.segs) m = Math.max(m, sStrain[s]); return m; },
    nodeTension(i) { return nodeStrain[i]; },
    stats() {
      let m = 0, sum = 0, n = 0;
      for (let s = 0; s < SC; s++) if (sAlive[s]) { m = Math.max(m, sStrain[s]); sum += sStrain[s]; n++; }
      return { max: m, mean: n ? sum / n : 0 };
    },

    nearest(x, y, z = 0, { maxDist = Infinity, loose = true, filter = null } = {}) {
      let best = Infinity, bs = -1, bt = 0;
      const test = (s) => {
        if (!sAlive[s] || (!loose && isLoose(s))) return;
        const d2 = segDist2(s, x, y, z);
        if (d2 >= best) return;
        if (filter) {
          const a3 = sa[s] * 3, b3 = sb[s] * 3, t = _nt;
          if (!filter(disp[a3] + (disp[b3] - disp[a3]) * t, disp[a3 + 1] + (disp[b3 + 1] - disp[a3 + 1]) * t, disp[a3 + 2] + (disp[b3 + 2] - disp[a3 + 2]) * t, s, t)) return;
        }
        best = d2; bs = s; bt = _nt;
      };
      if (gridOK && Number.isFinite(maxDist)) {
        const pl = toPlane([x, y, z]);
        const m = maxDist + maxSeg + R * 0.08;
        const u0 = Math.max(0, Math.floor((pl[0] - m - gMinU) / cell)), u1 = Math.min(gW - 1, Math.floor((pl[0] + m - gMinU) / cell));
        const v0 = Math.max(0, Math.floor((pl[1] - m - gMinV) / cell)), v1 = Math.min(gH - 1, Math.floor((pl[1] + m - gMinV) / cell));
        for (let v = v0; v <= v1; v++) for (let u = u0; u <= u1; u++) {
          const c = v * gW + u;
          for (let k = cellStart[c]; k < cellStart[c + 1]; k++) test(cellItems[k]);
        }
        if (loose) for (const T of threads) if (T.broken) for (const s of T.segs) test(s);
        // attached nodes can be dragged far from where the grid filed them
        for (const at of attachments) for (let k = adjStart[at.node]; k < adjStart[at.node + 1]; k++) test(adjSeg[k]);
      } else for (let s = 0; s < SC; s++) test(s);
      if (bs < 0 || best > maxDist * maxDist) return null;
      const a3 = sa[bs] * 3, b3 = sb[bs] * 3;
      return {
        segment: bs, thread: sThread[bs], t: bt, node: bt < 0.5 ? sa[bs] : sb[bs], dist: Math.sqrt(best),
        x: disp[a3] + (disp[b3] - disp[a3]) * bt, y: disp[a3 + 1] + (disp[b3 + 1] - disp[a3 + 1]) * bt, z: disp[a3 + 2] + (disp[b3 + 2] - disp[a3 + 2]) * bt,
      };
    },
    nearestNode(x, y, z = 0, filter) {
      let best = Infinity, bi = -1;
      for (let i = 0; i < count; i++) {
        if (filter && !filter(i)) continue;
        const i3 = i * 3;
        const d2 = (disp[i3] - x) ** 2 + (disp[i3 + 1] - y) ** 2 + (disp[i3 + 2] - z) ** 2;
        if (d2 < best) { best = d2; bi = i; }
      }
      return bi;
    },
    neighbors(i) {
      const out = [];
      for (let k = adjStart[i]; k < adjStart[i + 1]; k++) { const s = adjSeg[k]; if (sAlive[s]) out.push(other(s, i)); }
      return out;
    },
    /** Segment id joining nodes i and j (live or not), or -1. */
    segmentBetween(i, j) {
      for (let k = adjStart[i]; k < adjStart[i + 1]; k++) { const s = adjSeg[k]; if (other(s, i) === j) return s; }
      return -1;
    },
    path(from, to) {
      if (from === to) return [from];
      const dist = new Float64Array(count).fill(Infinity), via = new Int32Array(count).fill(-1);
      const heap = [];
      const push = (i, d) => { heap.push([d, i]); let c = heap.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (heap[p][0] <= heap[c][0]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; } };
      const pop = () => {
        const top = heap[0], last = heap.pop();
        if (heap.length) { heap[0] = last; let c = 0; for (;;) { const l = c * 2 + 1, r = l + 1; let m = c; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === c) break; [heap[m], heap[c]] = [heap[c], heap[m]]; c = m; } }
        return top;
      };
      dist[from] = 0; push(from, 0);
      while (heap.length) {
        const [d, i] = pop();
        if (d > dist[i]) continue;
        if (i === to) break;
        for (let k = adjStart[i]; k < adjStart[i + 1]; k++) {
          const s = adjSeg[k];
          if (!sAlive[s] || isLoose(s)) continue;
          const j = other(s, i), nd = d + sRest0[s] * (sThread[s] >= 0 && threads[sThread[s]].kind === KIND.SPIRAL ? 1.12 : 1);
          if (nd < dist[j]) { dist[j] = nd; via[j] = i; push(j, nd); }
        }
      }
      if (!Number.isFinite(dist[to])) return null;
      const out = [to];
      for (let i = to; via[i] >= 0; i = via[i]) out.push(via[i]);
      return out.reverse();
    },

    node(i, out = new THREE.Vector3()) { return out.set(disp[i * 3], disp[i * 3 + 1], disp[i * 3 + 2]); },
    segmentPoint(s, t, out = new THREE.Vector3()) {
      const a3 = sa[s] * 3, b3 = sb[s] * 3;
      return out.set(disp[a3] + (disp[b3] - disp[a3]) * t, disp[a3 + 1] + (disp[b3 + 1] - disp[a3 + 1]) * t, disp[a3 + 2] + (disp[b3 + 2] - disp[a3 + 2]) * t);
    },
    setWind(w = {}) { Object.assign(wind, w); },
    setOpacity(a) { ribbons.mat.uniforms.uOpacity.value = a; if (dew) { dew.material.transparent = a < 1; dew.material.opacity = a; } },
    /** Plane coordinates (u, v) of a world point, relative to the hub. */
    toPlane(x, y, z = 0) { return toPlane([x, y, z]); },
    /**
     * Where a screen point hits the web's plane: camera + pointer in NDC (-1..1, y up: the stage's input.x / input.y)
     * -> Vector3 in the web's space (assumes web.object's parent is the scene root), or null if the ray misses.
     */
    planePoint(camera, nx, ny, out = new THREE.Vector3()) {
      camera.updateMatrixWorld();
      _ray.origin.setFromMatrixPosition(camera.matrixWorld);
      _ray.direction.set(nx, ny, 0.5).unproject(camera);
      if (camera.isOrthographicCamera) {
        _ray.origin.set(nx, ny, -1).unproject(camera);
        _ray.direction.set(0, 0, -1).transformDirection(camera.matrixWorld);
      } else _ray.direction.sub(_ray.origin).normalize();
      _pl.setFromNormalAndCoplanarPoint(api.plane.normal, api.plane.origin);
      return _ray.intersectPlane(_pl, out);
    },
    get time() { return simT; },
    dispose() {
      ribbons.dispose();
      if (dew) { dew.geometry.dispose(); dew.material.dispose(); dew.dispose?.(); }
      object.clear();
    },
  };

  // broken threads hanging loose from the start
  const nDangle = o.dangling ?? 2;
  if (nDangle > 0) {
    const cand = threads.filter((T) => T.kind === KIND.SPIRAL && T.segs.length >= 3 && free[T.a] < 0.45);
    for (let k = 0; k < nDangle && cand.length; k++) {
      const T = cand.splice((rand() * cand.length) | 0, 1)[0];
      cutSeg(T.segs[1 + ((rand() * (T.segs.length - 2)) | 0)], true);
    }
  }
  // settle
  windTargets();
  const warm = o.warmup ?? 90;
  const keep = simT;
  for (let k = 0; k < warm; k++) { step(STEP, 1); simT = keep; }
  for (let i = 0; i < count; i++) { wu[i] = 0; wv[i] = 0; }
  prev.set(pos);
  measure();
  publish();
  return api;
}
