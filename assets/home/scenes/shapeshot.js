// Shapeshot on the home page: a measle cue ball, a cue, the 8 and a corner pocket on an invisible table, the game's
// name in 3D underneath. A little film loop of real cue-ball shots (stun, follow, power draw), chained so the cue ball
// plays each shot from where the last one left it, and every shot pots the 8. The balls run on a 1D sliding/rolling
// model: a ball struck off-centre slides with its spin until cloth friction makes it roll; on the hit, the balls swap
// speed and the spin carries on, so a stun stops dead, a follow pauses and runs on, a draw grips and screws back.
// Framed for a portrait column, seen from a 3/4 view a little above: the cue comes in from the lower left, the shot
// climbs to the pocket at the upper right. Nothing leaves the frame: the 8 drops into the pocket, the next 8 is set
// down on its spot, the cue stays in the player's hands (it follows the cue ball to its next address) and its butt
// fades out before the frame's edge. When a played follow leaves no room for the next 8, the cue ball is rolled back.
// The phases overlap: the next 8 goes down as soon as the cue ball is clear of its spot, the cue walks up meanwhile.
// The name is the game's own wordmark (Oswald SemiBold tracked 0.24em, from the game's wordmark.svg), turned into a
// set of ivory-and-ebony pieces: cue-ball ivory faces, lamp-lit from above, on deep ebony bodies with a chamfer, upright
// and wide-spaced. Each piece stands on its own soft shadow. They take every impact: when the cue ball meets the 8 a
// wave runs through them the way the 8 went (each hops and leans with it, the lamp catching their tops as the crest
// passes), the pot knocks them from the pocket's side, a ball set down nudges them.
// Hover: the cue tip follows the pointer's height on the ball (above = follow, below = draw), the measle dots glow, the
// name turns toward the pointer. Click: play it now. A played shot tugs the background web (stage 'tug').
import { text3d } from '../text3d.js';

// <physics> (pure: dev tests extract this block)
const R = 0.22;            // ball radius, world units
const A_S = 6.0;           // sliding friction deceleration (mu_s * g), units/s^2
const A_R = 0.42;          // rolling resistance deceleration
const E_BB = 0.94;         // ball-ball restitution
const SIM_DT = 1 / 240;
const D_MIN = 0.62;        // closest object-ball spot (centre to centre)
const V_MIN = 1.0, V_MAX = 6.8;

const newBall = (s) => ({ s, v: 0, w: 0, moving: false });
/** One step of a ball on the cloth. `w` is the spin as surface speed (w = v when rolling). Returns the roll angle. */
function stepBall(b, dt) {
  if (!b.moving) return 0;
  const u = b.v - b.w;                                   // slip at the cloth
  if (Math.abs(u) > 1e-6) {
    if (Math.abs(u) <= 3.5 * A_S * dt) { b.v = b.w = (5 * b.v + 2 * b.w) / 7; }   // friction catches: it rolls
    else { const sg = Math.sign(u); b.v -= A_S * sg * dt; b.w += 2.5 * A_S * sg * dt; }
  } else if (Math.abs(b.v) <= A_R * dt) { b.v = b.w = 0; b.moving = false; }
  else { b.v -= A_R * Math.sign(b.v) * dt; b.w = b.v; }
  b.s += b.v * dt;
  return (b.w * dt) / R;
}
/** Head-on hit: equal masses swap speed (less restitution loss); spins are untouched. Returns the closing speed. */
function collide(cb, ob) {
  if (cb.s + 2 * R < ob.s || cb.v <= ob.v) return 0;
  const v1 = cb.v, v2 = ob.v;
  cb.v = ((1 - E_BB) * v1 + (1 + E_BB) * v2) / 2;
  ob.v = ((1 + E_BB) * v1 + (1 - E_BB) * v2) / 2;
  cb.s = ob.s - 2 * R; cb.moving = ob.moving = true;
  return v1 - v2;
}
/** Cue ball at p struck at speed v0, tip h above centre; object ball at o; all along +s. */
function simulate(p, o, v0, h, exitS, tMax = 9) {
  const cb = newBall(p), ob = newBall(o);
  cb.v = v0; cb.w = (2.5 * v0 * h) / R; cb.moving = true;
  let t = 0, hit = null, exitT = null, exitV = 0;
  while (t < tMax) {
    stepBall(cb, SIM_DT); stepBall(ob, SIM_DT);
    const rel = collide(cb, ob);
    if (rel && !hit) hit = { t, s: ob.s - R, w: cb.w, v: rel };
    t += SIM_DT;
    if (exitT === null && ob.s >= exitS) { exitT = t; exitV = ob.v; }
    if (!cb.moving && (exitT !== null || !ob.moving)) break;
  }
  return { end: cb.s, t, hit, exitT, exitV, obEnd: ob.s };
}
/** Pick speed (and, for a scripted stun, tip height) so the shot reads well and the cue ball stays in frame. */
function planShot(sh, hUser, S, exitS) {
  const { pl, ol } = sh;
  const run = (v, hh) => simulate(pl, ol, v, hh, exitS);
  const kind = hUser == null ? sh.kind : hUser < -0.12 * R ? 'draw' : hUser > 0.12 * R ? 'follow' : 'stun';
  let h, v0;
  if (hUser == null && kind === 'stun') {
    // just below centre, so the spin is gone at the hit; as soft as still sends the 8 off the table
    for (v0 = 3.0; ; v0 += 0.15) {
      let lo = -0.7 * R, hi = 0.3 * R;
      for (let i = 0; i < 22; i++) { const m = (lo + hi) / 2; const r = run(v0, m); if (!r.hit || r.hit.w > 0) hi = m; else lo = m; }
      h = (lo + hi) / 2;
      const r = run(v0, h);
      if ((r.exitT !== null && r.exitV >= 1.0) || v0 >= V_MAX) break;
    }
  } else {
    h = hUser ?? (kind === 'follow' ? 0.42 * R : -0.6 * R);
    if (kind === 'stun') v0 = 3.3;
    else {
      const target = hUser == null ? sh.target : kind === 'draw' ? -S : Math.max(0.21 * S, ol - 2 * R + 0.35);
      const f = (v) => run(v, h).end - target;
      let lo = V_MIN, hi = V_MAX, flo = f(lo), fhi = f(hi);
      if (Math.sign(flo) === Math.sign(fhi)) v0 = Math.abs(flo) < Math.abs(fhi) ? lo : hi;
      else {
        for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2, fm = f(m); if (Math.sign(fm) === Math.sign(flo)) { lo = m; flo = fm; } else hi = m; }
        v0 = (lo + hi) / 2;
      }
    }
  }
  let res = run(v0, h);
  while ((res.exitT === null || res.exitV < 1.0) && v0 < V_MAX) { v0 = Math.min(V_MAX, v0 + 0.15); res = run(v0, h); }
  if (hUser == null && kind === 'follow' && res.end > sh.target + 0.03) {
    // the 8 needed more pace than the follow wanted: hit a touch less top so the cue ball still stops on its mark
    let lo = 0, hi = h;
    for (let i = 0; i < 22; i++) { const m = (lo + hi) / 2; if (run(v0, m).end > sh.target) hi = m; else lo = m; }
    h = (lo + hi) / 2; res = run(v0, h);
  }
  for (let i = 0; i < 8 && (res.end > S + 0.25 || res.end < -S - 0.2); i++) { h *= 0.7; res = run(v0, h); }
  return { h, v0, res, kind };
}
// </physics>

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const ease = {
  outCubic: (t) => 1 - (1 - t) ** 3,
  outQuad: (t) => 1 - (1 - t) ** 2,
  inQuad: (t) => t * t,
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  outBack: (t, s = 1.9) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2,
};
/** A critically damped spring step toward `to` (state {x, v}); `k` is the stiffness. */
function spring(st, to, k, dt) { st.v += (k * (to - st.x) - 2 * Math.sqrt(k) * st.v) * dt; st.x += st.v * dt; }

// ---- framing constants
const EL = 0.6;            // camera elevation (rad): a player's eye standing at the table, a little above the shot
const YAW0 = 0.95;         // the shot line turned this far into the table: it climbs from lower left to upper right
const HR = 0.31;           // the pocket's hole radius (the ball is R = 0.22)
const G = 16;              // gravity for the drops, units/s^2 (a touch slow, like the rest of the film)
const G0 = 0.12;           // address gap, tip to ball
const PLAY = 0.5;          // the planner's half-span, as a share of S: a played draw stops where the cue stays in view

// The game's own wordmark (Shapeshot style guide: Oswald SemiBold, tracking 0.24em), as outlines: the game repo's
// src/assets/img/wordmark.svg, rounded to half units. SVG units, y down: baseline at 810, cap height 810.
const WM_CAP = 810;
const WORDMARK = 'M270.5 821.5Q196 821.5 146 793.5Q95.5 766 70 710.5Q44.5 654.5 41.5 569L183 545Q184.5 595 193.5 629Q202.5 662.5 219.5 679Q237 695.5 263.5 695.5Q295 695.5 306.5 675Q318 655 318 628.5Q318 577.5 293.5 543.5Q269.5 509 229 474.5L145 400.5Q100.5 362.5 71.5 315Q42.5 267 42.5 196.5Q42.5 96.5 101.5 43Q160.5 -10 261.5 -10Q323 -10 362 10Q401 30 422 63.5Q443.5 97 452.5 136.5Q461.5 176 463.5 215.5L321.5 236Q320.5 199 315.5 171Q311 143 297.5 127.5Q284 111.5 257 111.5Q228.5 111.5 214.5 133Q200 154 200 180Q200 223.5 220 251Q239.5 278.5 273 308L355 380Q406.5 424 442.5 480.5Q478.5 537.5 478.5 619.5Q478.5 677.5 453 723Q427 769 380.5 795Q334 821.5 270.5 821.5ZM808 810V0H973V332.5H1116.5V0H1281.5V810H1116.5V450.5H973V810ZM1605.5 810 1762.5 0H1946.5L2102 810H1949.5L1920.5 632H1791.5L1761 810ZM1807.5 530.5H1903.5L1855.5 204ZM2423.5 810V0H2680.5Q2753.5 0 2800 27.5Q2846 54.5 2868.5 106.5Q2891 158.5 2891 232.5Q2891 320.5 2861.5 369Q2832.5 418 2781.5 438.5Q2730 459 2664 459H2588.5V810ZM2588.5 343.5H2647Q2683.5 343.5 2702.5 331.5Q2722 320 2729 295Q2735.5 270.5 2735.5 230.5Q2735.5 194 2730.5 168.5Q2725 143.5 2706 130Q2687 116.5 2646.5 116.5H2588.5ZM3215.5 810V0H3569V114H3380.5V329H3526.5V444H3380.5V697.5H3571V810ZM4103.5 821.5Q4029 821.5 3979 793.5Q3928.5 766 3903 710.5Q3877.5 654.5 3874.5 569L4016 545Q4017.5 595 4026.5 629Q4035.5 662.5 4052.5 679Q4070 695.5 4096.5 695.5Q4128 695.5 4139.5 675Q4151 655 4151 628.5Q4151 577.5 4126.5 543.5Q4102.5 509 4062 474.5L3978 400.5Q3933.5 362.5 3904.5 315Q3875.5 267 3875.5 196.5Q3875.5 96.5 3934.5 43Q3993.5 -10 4094.5 -10Q4156 -10 4195 10Q4234 30 4255 63.5Q4276.5 97 4285.5 136.5Q4294.5 176 4296.5 215.5L4154.5 236Q4153.5 199 4148.5 171Q4144 143 4130.5 127.5Q4117 111.5 4090 111.5Q4061.5 111.5 4047.5 133Q4033 154 4033 180Q4033 223.5 4053 251Q4072.5 278.5 4106 308L4188 380Q4239.5 424 4275.5 480.5Q4311.5 537.5 4311.5 619.5Q4311.5 677.5 4286 723Q4260 769 4213.5 795Q4167 821.5 4103.5 821.5ZM4641 810V0H4806V332.5H4949.5V0H5114.5V810H4949.5V450.5H4806V810ZM5705.5 821.5Q5616 821.5 5564 789.5Q5512 757.5 5489.5 697.5Q5467 637.5 5467 555V253Q5467 170 5489.5 111Q5512 52.5 5564 21Q5616 -10 5705.5 -10Q5795 -10 5847.5 21Q5900 52.5 5922.5 111Q5945 170 5945 253V555.5Q5945 637.5 5922.5 697.5Q5900 757 5847.5 789.5Q5795 821.5 5705.5 821.5ZM5705.5 702.5Q5737 702.5 5752 687.5Q5767 672.5 5772 648Q5777 623.5 5777 596V213.5Q5777 185 5772 161Q5767 137.5 5752 122.5Q5737 108 5705.5 108Q5675.5 108 5660 122.5Q5645 137.5 5640 161Q5635 185 5635 213.5V596Q5635 623.5 5639.5 648Q5644 672.5 5659 687.5Q5673.5 702.5 5705.5 702.5ZM6364 810V122.5H6239V0H6653.5V122.5H6530V810Z';

/** The wordmark as one ShapePath per letter (counters go with the letter whose box holds them), in cap heights. */
function wordmarkLetters(THREE) {
  const subs = []; let cur, x = 0, y = 0;
  for (const [, c, a] of WORDMARK.matchAll(/([MLHVQZ])([^MLHVQZ]*)/g)) {
    const n = (a.match(/-?\d*\.?\d+/g) ?? []).map(Number);
    if (c === 'M') { cur = { cmds: [], x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity }; subs.push(cur); }
    const pt = (px, py) => { cur.x0 = Math.min(cur.x0, px); cur.x1 = Math.max(cur.x1, px); cur.y0 = Math.min(cur.y0, py); cur.y1 = Math.max(cur.y1, py); };
    if (c === 'M' || c === 'L') for (let i = 0; i < n.length; i += 2) { x = n[i]; y = n[i + 1]; cur.cmds.push([c === 'M' && i === 0 ? 'M' : 'L', x, y]); pt(x, y); }
    else if (c === 'H') for (const v of n) { x = v; cur.cmds.push(['L', x, y]); pt(x, y); }
    else if (c === 'V') for (const v of n) { y = v; cur.cmds.push(['L', x, y]); pt(x, y); }
    else if (c === 'Q') for (let i = 0; i < n.length; i += 4) { cur.cmds.push(['Q', n[i], n[i + 1], n[i + 2], n[i + 3]]); x = n[i + 2]; y = n[i + 3]; pt(x, y); }
  }
  const inside = (s, o) => s !== o && s.x0 >= o.x0 && s.x1 <= o.x1 && s.y0 >= o.y0 && s.y1 <= o.y1;
  return subs.filter((s) => !subs.some((o) => inside(s, o))).sort((a, b) => a.x0 - b.x0).map((o) => {
    const cx = (o.x0 + o.x1) / 2, sp = new THREE.ShapePath();
    for (const s of subs) if (s === o || inside(s, o)) for (const [c, ...v] of s.cmds) {
      const X = (i) => (v[i] - cx) / WM_CAP, Y = (i) => (WM_CAP - v[i]) / WM_CAP;
      if (c === 'M') sp.moveTo(X(0), Y(1)); else if (c === 'L') sp.lineTo(X(0), Y(1)); else sp.quadraticCurveTo(X(0), Y(1), X(2), Y(3));
    }
    return { shapes: sp.toShapes(), x: cx / WM_CAP, w: (o.x1 - o.x0) / WM_CAP };
  });
}

export async function create({ THREE, stage, reduced }) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(22, 0.8, 0.1, 80);
  const V = THREE.Vector3;
  const table = new THREE.Group(); scene.add(table);   // the shot runs along this group's x

  // ---- light: a soft key from the camera side (white facets stay off-white, so the ball keeps its edge on the
  // white page), a dark ground, a rim from behind to cut the black shapes out, and the table lamp above and a little
  // behind: the crowns of the balls, the tops of the name's pieces
  scene.add(new THREE.HemisphereLight(0xffffff, 0x1c1c1c, 1.0));
  const key = new THREE.DirectionalLight(0xffffff, 1.8); key.position.set(-2.6, 4.0, 6.0); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.4); rim.position.set(3.5, 3.0, -4.5); scene.add(rim);
  const lamp = new THREE.DirectionalLight(0xffffff, 1.1); lamp.position.set(0, 9, -3.2); scene.add(lamp);

  // ---- materials
  const cv = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  // the cue (and its shadow) fade out over the last stretch before the frame's edge, wherever the frame is
  const uEdge = { value: new THREE.Vector4(0.8, 0.97, 0.8, 0.97) };
  const edgeFade = (m) => {
    m.transparent = true;
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uEdge = uEdge;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec4 vClipP;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvClipP = gl_Position;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec4 vClipP;\nuniform vec4 uEdge;')
        .replace('#include <color_fragment>', `#include <color_fragment>
vec2 nd = abs(vClipP.xy / vClipP.w);
diffuseColor.a *= (1.0 - smoothstep(uEdge.x, uEdge.y, nd.x)) * (1.0 - smoothstep(uEdge.z, uEdge.w, nd.y));`);
    };
    m.customProgramCacheKey = () => 'shapeshot-edge';
    return m;
  };
  const M = {
    ivory: new THREE.MeshStandardMaterial({ color: 0xf1eee7, roughness: 0.3, metalness: 0, flatShading: true }),
    dot: new THREE.MeshStandardMaterial({ color: 0x8f0a0d, roughness: 0.4, flatShading: true, emissive: 0xff2414, emissiveIntensity: 0 }),
    black: new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.34, metalness: 0.05, flatShading: true }),
    white: new THREE.MeshStandardMaterial({ color: 0xf0ede6, roughness: 0.36, flatShading: true }),
    shaft: edgeFade(new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.5, metalness: 0.05, flatShading: true })),
    ferrule: edgeFade(new THREE.MeshStandardMaterial({ color: 0xece8de, roughness: 0.45, flatShading: true })),
    tip: edgeFade(new THREE.MeshStandardMaterial({ color: 0x5d7489, roughness: 0.95, flatShading: true })),   // chalked
    inlay: edgeFade(new THREE.MeshStandardMaterial({ color: 0x7c080b, roughness: 0.5, flatShading: true })),
    lip: new THREE.MeshStandardMaterial({ color: 0x1e1d1c, roughness: 0.8, flatShading: true }),
    well: new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.95, flatShading: true, side: THREE.BackSide }),
    floor: new THREE.MeshBasicMaterial({ color: 0x0b0b0b }),
    hide: new THREE.MeshBasicMaterial({ colorWrite: false }),
  };

  // The name's two materials: ivory faces, ebony bodies. The faces darken a touch toward the foot (the lamp is above),
  // the lamp draws one fine line on the front chamfer of each piece's top; when the hit's wave passes, the lamp
  // catches the tops of the pieces it lifts (a light running along their tops).
  const LD = 0.2, LB = 0.035;                          // the name's pieces: depth, chamfer (cap heights)
  const NU = { uGlintC: { value: -99 }, uGlintW: { value: 0.1 }, uGlintA: { value: 0 } };
  function nameMat(role, params) {
    const m = new THREE.MeshStandardMaterial({ flatShading: true, ...params });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, NU);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vLoc;\nvarying vec3 vNrmL;\nvarying vec3 vWld;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLoc = position; vNrmL = normal; vWld = (modelMatrix * vec4(position, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vLoc;\nvarying vec3 vNrmL;\nvarying vec3 vWld;\nuniform float uGlintC, uGlintW, uGlintA;')
        .replace('#include <color_fragment>', role === 'face'
          ? '#include <color_fragment>\ndiffuseColor.rgb *= mix(vec3(0.83, 0.8, 0.75), vec3(1.0), smoothstep(-0.05, 0.95, vLoc.y));'
          : '#include <color_fragment>')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
float gs = (vWld.x - uGlintC) / uGlintW;
float band = 1.0 - smoothstep(0.2, 1.0, abs(gs));
totalEmissiveRadiance += vec3(1.0, 0.95, 0.86) * uGlintA * band * ${role === 'face' ? '0.05' : `0.15 * smoothstep(0.3, 0.85, vNrmL.y) * smoothstep(-0.02, ${(LD / 2).toFixed(3)}, vLoc.z)`};
${role === 'face' ? '' : 'totalEmissiveRadiance += vec3(0.2, 0.2, 0.19) * smoothstep(0.35, 0.6, vNrmL.y) * smoothstep(0.35, 0.6, vNrmL.z) * smoothstep(0.55, 0.85, vLoc.y);'}`);
    };
    m.customProgramCacheKey = () => `shapeshot-name-${role}`;
    return m;
  }
  // matte charcoal (the owner: not the game's ivory): charcoal faces, near-black bodies, no sheen
  M.face = nameMat('face', { color: 0x3a3937, roughness: 0.95, metalness: 0, emissive: 0x3a3937, emissiveIntensity: 0.12 });
  M.body = nameMat('body', { color: 0x141414, roughness: 0.95, metalness: 0 });

  // ---- faked contact shadows (one soft radial texture, one soft strip for the cue), a soft puff for the chalk
  const blobTex = cv(128, 128, (g) => {
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    [[0, 1], [0.14, 0.86], [0.3, 0.5], [0.52, 0.18], [0.76, 0.05], [1, 0]].forEach(([s, a]) => r.addColorStop(s, `rgba(0,0,0,${a})`));
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  });
  const puffTex = cv(64, 64, (g) => {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    [[0, 1], [0.35, 0.7], [0.7, 0.18], [1, 0]].forEach(([s, a]) => r.addColorStop(s, `rgba(255,255,255,${a})`));
    g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  });
  const stripTex = cv(256, 32, (g, w, h) => {
    const img = g.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const across = Math.exp(-((((y + 0.5) / h - 0.5) / 0.2) ** 2)), along = (1 - x / w) ** 1.6 * Math.min(1, x / 6);
      img.data[(y * w + x) * 4 + 3] = Math.round(255 * across * along);
    }
    g.putImageData(img, 0, 0);
  });
  const shadowMat = (tex, opacity) => new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity, toneMapped: false });
  const flat = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const makeShadow = (opacity, parent = table) => { const m = new THREE.Mesh(flat, shadowMat(blobTex, opacity)); m.renderOrder = -1; parent.add(m); return m; };
  /** A ball's shadow: it only shows once the ball is visible and close to the cloth (steep falloff, capped spread). */
  function ballShadow(sh, x, y, scale, speed, base) {
    const up = Math.max(0, y), k = 1 - Math.min(1, up / 0.7);
    sh.position.set(x + 0.03, 0.002, -0.05);
    const sp = 1 + Math.min(up, 0.5) * 0.6;
    sh.scale.set(R * 3.3 * sp * (1 + speed * 0.07) * scale, 1, R * 2.9 * sp * scale);
    sh.material.opacity = base * k * k * scale * scale;
    sh.visible = sh.material.opacity > 0.004;
  }

  // ---- the cue ball: faceted icosphere, measle dots as little polygon caps riding the surface
  const ballGeo = new THREE.IcosahedronGeometry(R, 3);
  const capGeo = (angle, segs, rings = 1) => new THREE.SphereGeometry(R * 1.012, segs, rings, 0, Math.PI * 2, 0, angle).rotateX(Math.PI / 2);
  const dotGeo = capGeo(0.2, 8);
  const cb = new THREE.Group(), cbSpin = new THREE.Group(), cbBody = new THREE.Group();
  cbBody.add(new THREE.Mesh(ballGeo, M.ivory));
  for (const d of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const m = new THREE.Mesh(dotGeo, M.dot);
    m.quaternion.setFromUnitVectors(new V(0, 0, 1), new V(...d).normalize());
    cbBody.add(m);
  }
  cbBody.rotation.set(0.5, 0.62, 0.15);
  cbSpin.add(cbBody); cb.add(cbSpin); table.add(cb);
  const cbShadow = makeShadow(0.62);

  // ---- the 8: black, a white roundel with the 8 in the display face (turned to face the camera, not the line)
  const ob = new THREE.Group(), obSpin = new THREE.Group(), obBody = new THREE.Group();
  obBody.add(new THREE.Mesh(ballGeo, M.black));
  obBody.add(new THREE.Mesh(capGeo(0.5, 14, 4), M.white));
  const eight = await text3d('8', { size: 1, depth: 0.02, bevel: 0, curveSegments: 3, material: M.black });
  eight.geometry.computeBoundingBox();
  const e8 = (R * 0.5) / (eight.geometry.boundingBox.max.y - eight.geometry.boundingBox.min.y);
  eight.scale.setScalar(e8); eight.position.z = R * 1.03;
  obBody.add(eight);
  obBody.rotation.set(-0.42, -YAW0 * 0.7, 0);
  obSpin.add(obBody); ob.add(obSpin); table.add(ob);
  const obShadow = makeShadow(0.62);

  // ---- the corner pocket, cut into the page (the page is the cloth): a crisp hole, its inside lit at the lip and
  // falling into the dark, a thin rubber liner on the rim. A depth-only ring of table around it hides whatever sinks
  // below the cloth outside the hole (the 8 drops in, not through).
  const SEG = 18;
  const pocket = new THREE.Group(); table.add(pocket);
  const hide = new THREE.Mesh(new THREE.RingGeometry(HR, HR + 1.4, SEG, 2).rotateX(-Math.PI / 2), M.hide);
  hide.renderOrder = -3; pocket.add(hide);
  const lathe = (pts, mat, segs = 9) => new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), segs), mat);
  pocket.add(lathe([[HR + 0.035, 0], [HR + 0.022, 0.012], [HR + 0.004, 0.01], [HR, -0.03]], M.lip, SEG));
  const wellGeo = new THREE.CylinderGeometry(HR, HR * 0.92, 0.62, SEG, 3, true).translate(0, -0.31, 0);
  {
    const pos = wellGeo.attributes.position, col = new Float32Array(pos.count * 3), c = new THREE.Color();
    const stops = [[0, 0xa8a39c], [-0.207, 0x3e3b38], [-0.413, 0x121110], [-0.62, 0x070707]];
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i), st = stops.reduce((b, s) => (Math.abs(s[0] - y) < Math.abs(b[0] - y) ? s : b));
      c.setHex(st[1], THREE.SRGBColorSpace); col.set([c.r, c.g, c.b], i * 3);
    }
    wellGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  pocket.add(new THREE.Mesh(wellGeo, M.well));
  const floor = new THREE.Mesh(new THREE.CircleGeometry(HR * 0.93, SEG).rotateX(-Math.PI / 2), M.floor); floor.position.y = -0.6; pocket.add(floor);

  // ---- the cue: lathe-turned, tip at the origin pointing +x. The profiles run tip to butt (y falling); the lathe wants
  // them climbing in y for its faces to point outward, so they're turned around before it spins them.
  const cue = new THREE.Group();
  const cueLathe = (pts, mat) => { const g = new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)).reverse(), 9).rotateZ(-Math.PI / 2); return new THREE.Mesh(g, mat); };
  cue.add(cueLathe([[0, 0.004], [0.026, 0.002], [0.046, -0.008], [0.05, -0.034]], M.tip));
  cue.add(cueLathe([[0.05, -0.034], [0.051, -0.13]], M.ferrule));
  cue.add(cueLathe([[0.052, -0.13], [0.0575, -1.1]], M.shaft));
  cue.add(cueLathe([[0.0576, -1.1], [0.0578, -1.125]], M.ferrule));             // a thin inlay: ivory, red, ivory
  cue.add(cueLathe([[0.0578, -1.125], [0.0583, -1.2]], M.inlay));
  cue.add(cueLathe([[0.0583, -1.2], [0.0585, -1.225]], M.ferrule));
  cue.add(cueLathe([[0.0585, -1.225], [0.064, -2.2], [0.08, -4.6], [0.085, -6], [0, -6]], M.shaft));
  cue.rotation.order = 'YZX';
  table.add(cue);
  const cueShadow = new THREE.Mesh(flat, edgeFade(shadowMat(stripTex, 0.3))); cueShadow.renderOrder = -1; table.add(cueShadow);

  // ---- a puff of chalk off the tip at the strike: a few soft blue-grey wisps that burst out around the tip, drift up
  // and back, spread and thin out
  const puffs = Array.from({ length: 7 }, (_, i) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: puffTex, color: 0x7f9ab1, transparent: true, depthWrite: false, opacity: 0 }));
    s.visible = false; table.add(s);
    return { s, v: new V(), age: 9, size: 0.07 + 0.03 * ((i * 5) % 3) };
  });
  const PUFF_T = 0.75;
  function puff(x, y, v0) {
    const k = Math.min(1, v0 / 5);
    puffs.forEach((p, i) => {
      const a = (i / puffs.length) * Math.PI * 2 + 0.5, sp = (0.45 + 0.25 * ((i * 7) % 3) / 2) * (0.6 + 0.6 * k);
      p.s.position.set(x - 0.05, y + 0.02, 0);
      p.v.set(-sp * (0.5 + 0.3 * Math.cos(a * 1.7)), sp * (0.35 + 0.55 * Math.abs(Math.sin(a))), sp * Math.cos(a) * 1.1);
      p.age = -0.01 * i; p.s.visible = false;
    });
  }
  function stepPuffs(dt) {
    for (const p of puffs) {
      if (p.age > PUFF_T) { p.s.visible = false; continue; }
      p.age += dt; if (p.age < 0) continue;
      const u = p.age / PUFF_T;
      p.v.multiplyScalar(Math.exp(-5 * dt)); p.v.y += 0.15 * dt;
      p.s.position.addScaledVector(p.v, dt);
      p.s.scale.setScalar(p.size * (0.45 + 1.4 * ease.outCubic(u)));
      p.s.material.opacity = 0.75 * (1 - u) ** 1.6 * Math.min(1, p.age / 0.03);
      p.s.visible = true;
    }
  }

  // ---- SHAPESHOT: one piece per letter so each can carry a little motion of its own
  const word = new THREE.Group(); scene.add(word);
  const letters = wordmarkLetters(THREE).map((g, i) => {
    const geo = new THREE.ExtrudeGeometry(g.shapes, { depth: LD, curveSegments: 4, bevelEnabled: true, bevelThickness: LB, bevelSize: LB * 0.62, bevelOffset: -LB * 0.3, bevelSegments: 1 });
    geo.translate(0, 0, -LD / 2);
    const mesh = new THREE.Mesh(geo, [M.face, M.body]);
    const pivot = new THREE.Group(); pivot.add(mesh); word.add(pivot);
    const shadow = new THREE.Mesh(flat, shadowMat(blobTex, 0.4)); shadow.renderOrder = -1; word.add(shadow);
    return { i, pivot, mesh, shadow, x: g.x, w: g.w, y: 0, vy: 0, rx: 0, vrx: 0, ry: 0, vry: 0, lz: 0, vlz: 0, kicks: [] };
  });
  const capH = 1 + LB;
  const wx0 = letters[0].x - letters[0].w / 2, wx1 = letters.at(-1).x + letters.at(-1).w / 2;
  const wordW = wx1 - wx0;
  for (const l of letters) {
    l.x -= wx0 + wordW / 2; l.pivot.position.x = l.x;
    l.shadowW = l.w * 1.25;
    l.shadow.scale.set(l.shadowW, 1, 0.75); l.shadow.position.set(l.x + 0.02, 0.002, -0.02);
  }

  // ---- framing (resize): the camera keeps its angle and is fitted so the table (the cue's address, the balls' strip,
  // the pocket) fills the upper part of the view and the name the lower part. S is the half-span the balls play in.
  let S = 1.0, P = 1.8, lipS = 1.5, wordScale = 1, camD = 8;
  const camBase = new V(), camTarget = new V();
  let YAW = YAW0;
  const camDir = new V(0, Math.sin(EL), Math.cos(EL));
  const cRight = new V(1, 0, 0), cUp = new V(0, Math.cos(EL), -Math.sin(EL));
  const tmp = new V(), tmp2 = new V();

  function place(target, d) {
    camera.position.copy(target).addScaledVector(camDir, d);
    camera.lookAt(target);
    camera.updateMatrixWorld();
  }
  /** Fit points into an NDC box [x0, x1] x [y0, y1] by moving the camera (angle fixed). */
  function fitPoints(pts, box) {
    const [bx0, bx1, by0, by1] = box;
    const ty = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), tx = ty * camera.aspect;
    camTarget.set(0, 0, 0); let d = 8;
    for (let it = 0; it < 14; it++) {
      place(camTarget, d);
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const p of pts) { tmp.copy(p).project(camera); x0 = Math.min(x0, tmp.x); x1 = Math.max(x1, tmp.x); y0 = Math.min(y0, tmp.y); y1 = Math.max(y1, tmp.y); }
      const k = Math.max((x1 - x0) / (bx1 - bx0), (y1 - y0) / (by1 - by0));
      camTarget.addScaledVector(cRight, ((x0 + x1) / 2 - (bx0 + bx1) / 2) * tx * d).addScaledVector(cUp, ((y0 + y1) / 2 - (by0 + by1) / 2) * ty * d);
      d *= k;
    }
    place(camTarget, d);
    return d;
  }

  function fit(w, h) {
    const aspect = w / Math.max(1, h);
    camera.aspect = aspect; camera.updateProjectionMatrix();
    const tall = aspect < 1.1;
    YAW = clamp(YAW0 + (0.82 - aspect) * 1.2, YAW0, 1.12);   // a narrow column: the shot turns further into the table
    table.rotation.y = YAW; obBody.rotation.y = -YAW * 0.7;
    S = tall ? 0.96 : 1.1;
    P = S + 0.85; lipS = P - HR + 0.02;                 // the cue ball always stops short of the lip (planShot: <= S + 0.25)
    pocket.position.x = P;
    table.updateMatrixWorld();
    const pts = [], at = (x, y, z) => pts.push(table.localToWorld(new V(x, y, z)));
    for (const s of [-(0.5 * S + 0.95), S]) for (const y of [0, 2 * R + 0.1]) for (const z of [-R, R]) at(s, y, z);   // the cue's run-in, the 8's spots
    at(S * 0.5, 2 * R + 0.4, 0);                       // the next 8 is set down from about here
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; at(P + (HR + 0.12) * Math.cos(a), 0.04, (HR + 0.12) * Math.sin(a)); }
    // one composition, centred in the view: the table as wide as the view allows, a gap, the name under it.
    // NDC: name width as a share of the view's width; its height follows from the word's proportions.
    const MX = 0.92, TOP = 0.9, BOT = -0.9;
    const nameW = Math.min(tall ? 1.72 : 1.2, (0.36 * wordW) / (capH * aspect)), nameH = (capH / wordW) * nameW * aspect * 1.12;
    const gap = 0.12;
    camD = fitPoints(pts, [-MX, MX, -50, 50]);
    let y0 = 1e9, y1 = -1e9;
    for (const p of pts) { tmp.copy(p).project(camera); y0 = Math.min(y0, tmp.y); y1 = Math.max(y1, tmp.y); }
    let hs = y1 - y0;
    const avail = TOP - BOT;
    if (hs + gap + nameH > avail) hs = avail - gap - nameH;   // a squat view: the table gives way to the name
    const slack = Math.max(0, avail - hs - gap - nameH);
    const sTop = TOP - slack * 0.75;                  // spare room goes above (the next 8 is set down from there)
    camD = fitPoints(pts, [-MX, MX, sTop - hs, sTop]);
    const ty = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), tx = ty * aspect;
    // the name: centred, in front of the table
    const dW = camD * 0.84;
    wordScale = (nameW * tx * dW) / wordW;
    word.scale.setScalar(wordScale);
    const ndcY = sTop - hs - gap - nameH / 2;
    word.position.copy(camera.position).addScaledVector(camDir, -dW)
      .addScaledVector(cUp, ndcY * ty * dW - (capH * wordScale) / 2);
    camBase.copy(camera.position);
    NU.uGlintW.value = 0.55 * wordScale;
    uEdge.value.set(1 - 64 / w, 1 - 4 / w, 1 - 64 / h, 1 - 4 / h);
  }

  // ---- the state: the cue ball (C), the 8 (E), the cue, and the shot being played / the one being set up (next)
  const C = { x: 0, rot: 0, mode: 'rest', roll: null };                // rest | sim | roll
  const E = { x: 0, y: 0, vx: 0, vy: 0, rot: 0.2, scale: 1, mode: 'rest', t: 0 };   // rest | sim | sink | gone | pop
  const cueAt = { x: 0, v: 0 }, qS = { x: G0, v: 0 }, liftS = { x: 0, v: 0 };
  let shot = null, next = null, phase = 'aim', pt = 0, quick = false;
  let sim = null, q0 = G0, tilt = 0, hTip = 0, hVel = 0, hLock = null, plan = null;
  let B = 0.3, Tl = 0.25, F = 0.15, Tf = 0.1, holdT = 0.4, time = 0, started = false;
  const hover = { on: 0, h: 0 };
  let clickH = null, lastInput = null;
  const glint = { t: 9, amp: 0, dur: 0.6 };
  const wt = { rx: 0, vrx: 0, ry: 0, vry: 0 };        // the word's own turn toward the pointer

  /** The shot for a cue ball at pl: a stun from far back, a follow from the middle, a draw from up the table. */
  function makeShot(pl) {
    let kind, D, target;
    if (pl < -0.35 * S) { kind = 'stun'; target = 0; D = clamp(target + 2 * R - pl, D_MIN, 1.4); }
    else if (pl < 0.05 * S) { kind = 'follow'; D = 0.68 * S; target = Math.min(0.33 * S, S - D_MIN - 0.06); }
    else { kind = 'draw'; D = Math.max(D_MIN, S - pl); target = -0.45 * S; }   // back, but the cue stays in view
    if (pl + D > S) D = Math.max(D_MIN, S - pl);
    const sh = { pl, ol: pl + D, kind, target, exit: lipS };
    sh.script = planShot(sh, null, S * PLAY, sh.exit);
    return sh;
  }
  function begin(sh) {                                // the cue on the ball, the 8 on its spot: aim
    shot = sh; next = null; hLock = null; plan = null; pt = 0;
    C.x = sh.pl; cueAt.x = sh.pl; cueAt.v = 0;
    if (quick) { phase = 'back'; q0 = qS.x; strike(); } else phase = 'aim';
  }

  // letters feel the table: a small knock at table x reaches each letter a moment later, from that side
  function thump(x, amp) {
    if (amp <= 0.001) return;
    tmp.set(x, 0, 0); table.localToWorld(tmp);
    for (const l of letters) {
      const lx = word.position.x + l.x * wordScale;
      l.kicks.push({ at: time + Math.abs(lx - tmp.x) / 7 + 0.02, a: amp, lean: 0 });
    }
  }
  // the cue ball meets the 8: a wave runs through the name the way the 8 went, the lamp riding its crest
  const glintHalf = () => (wordW * wordScale) / 2 + 0.4 * wordScale;
  function wave(k) {
    glint.t = 0; glint.amp = 0.45 + 0.55 * k; glint.dur = 0.7 - 0.25 * k;
    const half = glintHalf();
    for (const l of letters) {
      const u = (l.x * wordScale + half) / (2 * half);
      l.kicks.push({ at: time + u * glint.dur, a: 0.26 * k, lean: k });
    }
  }
  /** The background web feels a played shot (viewport px of the impact). */
  function tug(x, strength) {
    const r = lastInput?.rect;
    if (!r || !(lastInput.visible > 0.3) || reduced) return;
    tmp.set(x, R, 0); table.localToWorld(tmp); tmp.project(camera);
    stage.emit('tug', { strength, x: r.left + (tmp.x + 1) / 2 * r.width, y: r.top + (1 - tmp.y) / 2 * r.height });
  }

  function strike() {
    const hu = clickH ?? (hover.on > 0.5 ? hover.h : null);
    clickH = null;
    plan = planShot(shot, hu, S * PLAY, shot.exit);
    plan.clicked = quick;
    hLock = plan.h;
    B = clamp(0.085 * plan.v0, 0.1, 0.42);
    Tl = clamp((2.5 * (G0 + B)) / plan.v0, 0.12, 0.4);
    F = plan.kind === 'draw' ? 0.08 : clamp(0.06 * plan.v0, 0.08, 0.3);
  }

  function hit() {
    const v0 = plan.v0, h = hLock;
    sim = { cb: newBall(shot.pl), ob: newBall(shot.ol), acc: 0, t: 0 };
    sim.cb.v = v0; sim.cb.w = (2.5 * v0 * h) / R; sim.cb.moving = true;
    C.mode = 'sim'; E.mode = 'sim';
    const vTip = (2 * (G0 + B)) / Tl;
    Tf = (2 * F) / vTip;
    holdT = plan.kind === 'draw' ? Tf + 0.06 : 0.5;
    thump(C.x, 0.1 * Math.min(1, v0 / 5));
    puff(C.x - Math.sqrt(R * R - h * h), R + h, v0);
    // where the cue ball will stop is known now: set up the next shot from there (or from the start, rolled back)
    const end = plan.res.end, roll = end > S - D_MIN;
    next = { end, roll, pl: roll ? -0.5 * S : end };
    next.shot = makeShot(next.pl);
    quick = false;
    phase = 'run'; pt = 0;
  }

  function stepSim(dt) {
    sim.acc += dt;
    while (sim.acc >= SIM_DT) {
      sim.acc -= SIM_DT; sim.t += SIM_DT;
      if (C.mode === 'sim') C.rot -= stepBall(sim.cb, SIM_DT);
      if (E.mode === 'sim') {
        E.rot -= stepBall(sim.ob, SIM_DT);
        const rel = collide(sim.cb, sim.ob);
        if (rel) {
          const k = Math.min(1, rel / 5); sim.hit = true;
          wave(k);
          if (plan.clicked) tug(sim.ob.s - R, 0.1 + 0.22 * k);   // a played shot only; a hard one can wake the spider
        }
        if (sim.ob.s >= lipS) { E.mode = 'sink'; E.vx = sim.ob.v; E.vy = 0; E.y = 0; }   // over the lip: it drops
        else if (sim.hit && !sim.ob.moving) { E.mode = 'gone'; E.t = 0; }                // never: it is planned to drop
      }
    }
    if (C.mode === 'sim') { C.x = sim.cb.s; if (!sim.cb.moving) C.mode = next.roll ? 'roll' : 'rest'; }
    if (E.mode === 'sim') E.x = sim.ob.s;
  }

  function stepBalls(dt) {
    if (C.mode === 'sim' || E.mode === 'sim') stepSim(dt);
    if (C.mode === 'roll') {                         // rolled back by hand: a push, then it rolls to a stop
      if (!C.roll) { const d = C.x - next.pl, a = 2.4, v0 = Math.sqrt(2 * a * d); C.roll = { x0: C.x, a, v0, T: v0 / a, t: 0 }; }
      const r = C.roll; r.t = Math.min(r.T, r.t + dt);
      const x = r.x0 - (r.v0 * r.t - 0.5 * r.a * r.t * r.t);
      C.rot -= (x - C.x) / R; C.x = x;
      if (r.t >= r.T) { C.x = next.pl; C.mode = 'rest'; C.roll = null; }
    }
    if (E.mode === 'sink') {                         // into the pocket: it drops, knocks the back of the well, is gone
      E.vy -= G * 1.4 * dt; E.y += E.vy * dt; E.x += E.vx * dt; E.rot -= (E.vx * dt) / R;
      const back = P + HR * 0.93 - R;
      if (E.x > back) { E.x = back; if (E.vx > 0.3) thump(P, 0.07 * Math.min(1, E.vx / 3)); E.vx *= -0.2; }
      if (E.y < -2.4 * R) { E.mode = 'gone'; E.t = 0; }
    } else if (E.mode === 'gone' && next) {           // the next 8 goes down as soon as the cue ball is clear of its spot
      E.t += dt;
      const ol = next.shot.ol, fwd = C.mode === 'sim' && sim.cb.v > 0, ahead = fwd ? next.end : C.x;
      if (E.t > 0.3 && Math.max(C.x, ahead) < ol - 2 * R - (fwd || C.mode === 'rest' ? 0.1 : 0.03)) {
        E.mode = 'pop'; E.t = 0; E.x = ol; E.y = 0.36; E.vy = 0; E.vx = 0; E.rot = 0.2; E.scale = 0;
      }
    } else if (E.mode === 'pop') {                    // set down on its spot: it grows in as it drops, two short bounces
      E.t += dt; E.scale = ease.outBack(Math.min(1, E.t / 0.26));
      E.vy -= G * dt; E.y += E.vy * dt;
      if (E.y <= 0) {
        const imp = -E.vy; E.y = 0;
        thump(E.x, 0.08 * Math.min(1, imp / 6));
        if (imp > 1.0) E.vy = imp * 0.3; else { E.vy = 0; if (E.t > 0.3) { E.mode = 'rest'; E.scale = 1; } }
      }
    }
  }

  function updateHover(input) {
    hover.on = input.hover;
    if (!input.inside) return;
    tmp.set(C.x, R, 0); table.localToWorld(tmp).project(camera);
    tmp2.set(C.x, 2 * R, 0); table.localToWorld(tmp2).project(camera);
    const range = Math.max(0.16, 2.6 * (tmp2.y - tmp.y));
    hover.h = clamp((input.y - tmp.y) / range, -1, 1) * 0.58 * R;
  }

  function stepCue(dt) {
    pt += dt;
    const hAim = clickH ?? (hover.on > 0.5 ? hover.h : (next ? next.shot.script.h : shot.script.h));
    if (hLock == null) {                                // tip height eases to the aim (a critically damped spring)
      const k = 140, c = 2 * Math.sqrt(k);
      hVel += (k * (hAim - hTip) - c * hVel) * dt; hTip += hVel * dt;
    }
    switch (phase) {
      case 'aim': {                                     // two practice strokes, the second shorter
        const T = 0.55, k = Math.floor(pt / T), u = (pt % T) / T;
        qS.x = k < 2 ? G0 + (k ? 0.085 : 0.12) * (1 - Math.cos(2 * Math.PI * u)) / 2 : G0;
        if (pt >= 2 * T) { phase = 'hold'; pt = 0; qS.x = G0; }
        break;
      }
      case 'hold':
        if (pt >= 0.28) { phase = 'back'; pt = 0; q0 = qS.x; strike(); }
        break;
      case 'back': {
        const T = quick ? 0.3 : 0.48, u = Math.min(1, pt / T);
        qS.x = q0 + (G0 + B - q0) * ease.inOutSine(u);
        if (u >= 1 && pt >= T + (quick ? 0.04 : 0.1)) { phase = 'lunge'; pt = 0; }
        break;
      }
      case 'lunge': {
        const u = Math.min(1, pt / Tl);
        qS.x = (G0 + B) * (1 - ease.inQuad(u));
        if (u >= 1) { qS.x = 0; hit(); }
        break;
      }
      case 'run':                                       // the follow-through, held a moment
        qS.x = pt < Tf ? -F * ease.outQuad(pt / Tf) : -F; qS.v = 0;
        if (pt >= holdT) { phase = 'recover'; pt = 0; hTip = hLock; hVel = 0; hLock = null; }   // the tip eases to the next aim
        break;
      case 'recover': {                                 // stand up, walk to the next address, settle on the ball
        const moving = C.mode !== 'rest';
        spring(cueAt, C.mode === 'sim' ? next.end : next.pl, moving ? 26 : 34, dt);
        spring(qS, moving ? G0 + 0.24 : G0, 30, dt);
        spring(liftS, moving ? 0.07 + Math.min(0.12, Math.abs(cueAt.v) * 0.1) : 0, 40, dt);
        tilt += ((moving ? 0.05 : 0) - tilt) * Math.min(1, 6 * dt);
        if (!moving && E.mode === 'rest' && Math.abs(cueAt.x - next.pl) < 0.006 && Math.abs(cueAt.v) < 0.04
          && Math.abs(qS.x - G0) < 0.01 && liftS.x < 0.008) { liftS.x = liftS.v = qS.v = 0; tilt = 0; begin(next.shot); }
        break;
      }
    }
    // never let the cue ball touch the tip (a draw coming back, a ball rolled back)
    const h = hLock ?? hTip, th = 0.085 + Math.max(0, -h / R) * 0.07 + tilt;
    if (liftS.x < 0.3) {
      const qMin = (cueAt.x - C.x + 0.03) / Math.cos(th);
      if (qS.x < qMin) { qS.x = qMin; qS.v = Math.max(qS.v, 0); }
    }
  }

  function stepWord(dt, input) {
    // springs: idle bob, hover tilt toward the pointer, kicks (a hop, and a lean the way the shot went)
    // The word turns toward the pointer as one piece; each letter follows on its own softer spring, so a quick move
    // ripples through them and settles.
    const hv = reduced ? 0 : hover.on;
    const tiltY = 0.11 * clamp(input.x, -1, 1) * hv, tiltX = -0.08 * clamp(input.y + 0.5, -1, 1) * hv;
    if (dt > 0) {
      wt.vry += (60 * (tiltY - wt.ry) - 2 * Math.sqrt(60) * 0.8 * wt.vry) * dt; wt.ry += wt.vry * dt;
      wt.vrx += (60 * (tiltX - wt.rx) - 2 * Math.sqrt(60) * 0.8 * wt.vrx) * dt; wt.rx += wt.vrx * dt;
    }
    for (const l of letters) {
      while (l.kicks.length && l.kicks[0].at <= time) { const k = l.kicks.shift(); l.vy += k.a * 9; l.vlz -= k.lean * 1.5; }
      if (dt > 0) {
        l.vy += (-240 * l.y - 8.5 * l.vy) * dt; l.y += l.vy * dt;
        l.vlz += (-170 * l.lz - 7 * l.vlz) * dt; l.lz += l.vlz * dt;
        const lag = 26 + 8 * Math.sin(l.i * 1.7);
        l.vry += (lag * (tiltY - l.ry) - 2 * Math.sqrt(lag) * 0.6 * l.vry) * dt; l.ry += l.vry * dt;
        l.vrx += (lag * (tiltX - l.rx) - 2 * Math.sqrt(lag) * 0.6 * l.vrx) * dt; l.rx += l.vrx * dt;
      }
      const bob = 0.012 * Math.sin(time * 1.3 - l.i * 0.55);
      l.pivot.position.y = bob + l.y * 0.3;
      l.pivot.rotation.set((l.rx - wt.rx) * 1.4 - l.y * 0.5, (l.ry - wt.ry) * 1.4, l.lz * 0.45);
      const up = Math.max(0, l.pivot.position.y) / capH;
      l.shadow.material.opacity = 0.4 / (1 + up * 10);
      l.shadow.scale.set(l.shadowW * (1 + up * 0.8), 1, 0.75 * (1 + up));
    }
    word.rotation.set(-EL * 0.42 + wt.rx, 0.03 * Math.sin(time * 0.5) + wt.ry, 0);
    // the lamp's light along the tops: it rides the wave's crest the way the 8 went
    glint.t += dt;
    const half = glintHalf(), u = glint.t / glint.dur;
    NU.uGlintC.value = word.position.x - half + 2 * half * u;
    NU.uGlintA.value = u < 1 ? glint.amp * Math.sin(Math.PI * Math.min(1, u * 1.15)) ** 0.5 : 0;
  }

  function pose(input) {
    cb.position.set(C.x, R, 0); cbSpin.rotation.z = C.rot;
    const vc = sim && C.mode === 'sim' ? Math.abs(sim.cb.v) : C.roll ? C.roll.v0 - C.roll.a * C.roll.t : 0;
    ballShadow(cbShadow, C.x, 0, 1, vc, 0.62);
    ob.visible = E.mode !== 'gone';
    ob.position.set(E.x, R + E.y, 0); ob.scale.setScalar(Math.max(1e-3, E.scale)); obSpin.rotation.z = E.rot;
    const vo = sim && E.mode === 'sim' ? Math.abs(sim.ob.v) : 0;
    if (E.mode === 'sink' || E.mode === 'gone') obShadow.visible = false;
    else ballShadow(obShadow, E.x, E.y, E.scale, vo, 0.62);
    const hv = reduced ? 0 : hover.on;                 // reduced motion: a true still, no hover jumps on scroll
    M.dot.emissiveIntensity = 0.55 * hv;

    const h = hLock ?? hTip, q = qS.x, lift = liftS.x;
    const th = 0.085 + Math.max(0, -h / R) * 0.07 + tilt;
    const cx = cueAt.x - Math.sqrt(Math.max(0, R * R - h * h)), cy = R + h;
    cue.position.set(cx - q * Math.cos(th), cy + q * Math.sin(th) + lift, 0);
    cue.rotation.set(0, 0, -th);
    // its shadow: tight under the cue near the cloth, gone as the cue lifts off it
    const ty = cue.position.y;
    cueShadow.position.set(cue.position.x - 1.5 + 0.02, 0.003, -0.05); cueShadow.scale.set(3, 1, 0.18 + ty * 0.12);
    cueShadow.rotation.y = Math.PI;                    // dark under the tip, fading toward the raised butt
    cueShadow.material.opacity = 0.32 * clamp(1 - (ty - 0.2) / 0.3, 0, 1) * clamp(1 - lift / 0.045, 0, 1);
    cueShadow.visible = cueShadow.material.opacity > 0.004;

    camera.position.copy(camBase);
    camera.position.addScaledVector(cRight, camD * (0.006 * Math.sin(time * 0.21) + 0.018 * input.x * hv));
    camera.position.addScaledVector(cUp, camD * (0.004 * Math.sin(time * 0.17) + 0.01 * input.y * hv));
    camera.lookAt(camTarget);
  }

  const idle = { x: 0, y: 0, hover: 0, inside: false, clicked: false };
  return {
    scene, camera,
    resize(w, h) {
      fit(w, h);
      if (!started) { const sh = makeShot(-0.12 * S); begin(sh); E.x = sh.ol; hTip = sh.script.h; }
      else if (shot) { shot.exit = lipS; if (next) next.shot.exit = lipS; }
    },
    update(dt, t, input = idle) {
      if (!shot) return;                                 // the stage always sizes a view before its first frame
      started = true; time += dt; lastInput = input;
      updateHover(input);
      if (input.clicked && dt > 0 && phase !== 'back' && phase !== 'lunge') {   // the tap's height on the ball is the spin
        clickH = hover.h; quick = true;
        if (phase === 'aim' || phase === 'hold') { phase = 'back'; pt = 0; q0 = qS.x; strike(); }
      }
      if (dt > 0) { stepCue(dt); stepBalls(dt); stepPuffs(dt); }
      stepWord(dt, input);
      pose(input);
    },
    dispose() {
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.isSprite) o.material.dispose(); });
      Object.values(M).forEach((m) => m.dispose());
      [blobTex, stripTex, puffTex].forEach((t) => t.dispose());
      [cbShadow, obShadow, cueShadow].forEach((m) => m.material.dispose());
      letters.forEach((l) => l.shadow.material.dispose());
    },
  };
}
