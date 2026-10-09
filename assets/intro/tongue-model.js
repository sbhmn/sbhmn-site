// The monster's tongue, made from the owner's 3D model: a sculpted, glossy, pink-red tongue with taste buds and a
// groove down the middle (assets/3d/tongue-model.glb, built by dev/models/tongue-rig.py from the owner's FBX: relaxed
// out of its S-twist into a gently curved, left-right symmetric rest pose, a stalk added at the root, skinned to a
// chain of 11 bones, with twin bones along the front third that cup the tip). Same job and API as the procedural one
// (assets/intro/tongue.js), so the intro can use either.
// The paper goes in: the tip slides out over the front lip, tastes it (a wiggle) and tucks under; the tongue ERUPTS up
// and over the front in a big hook, unrolls down it and SLAPS onto the lip; it hangs there, a wave running down it,
// drags greedily across the lip to one side and back to the other (the tip trailing and curling); laps up off the lip,
// curling over, and SLAPS down again; then it is SLURPED back up the front and over the lip, into the dark. Its top
// (the groove and the taste buds) faces the camera in every pose: it never stands up as a bare column, nor points
// straight at the camera. Animated here, not baked: keyframed bends at every joint chased by springs (the tip lags,
// whips and overshoots), kept out of the rim and the walls. Spit flies off it on the fast moves, falls and splashes on
// the floor (a crown, a few droplets, a puddle that dries away); a fat drop lets go of the hanging tip; strings of spit
// stretch from the lip to it and snap.
//
//   import { createTongue } from '/assets/intro/tongue-model.js';
//   const tongue = createTongue(THREE, { fxParent: scene });  // returns at once; its model (~0.36 MB) loads behind
//   bin.add(tongue.object3d);                   // a parent with no rotation/scale of its own
//   tongue.object3d.position.set(0, 0.78, 0);   // the centre of the opening, on the rim plane
//   await tongue.ready;                         // optional: the model has arrived (rejects if it can't load)
//   tongue.warm(renderer, camera);              // once, after it is in the scene (see warm below)
//   tongue.update(dt);                          // every frame, always (the drips outlive the lick); dt in seconds
//   await tongue.lick();                        // ~1.58 s; resolves when the tongue is back inside (slam the lid)
// `const tongue = await createTongue(...)` works too (it is not a promise; await just hands it back).
//
// Coordinates: bin units (1 unit ~ the bin's height). object3d's origin is the centre of the opening on the rim
// plane, +y up, +z toward the front (the camera). The floor is at local y = -rimY. The tongue lives inside the opening
// below the rim (drawn sinking into black there, the dark in the bin; it never goes below the bin's floor inside, so
// nothing shows through the slots in the base) and reaches (measured, both mirror sides) ~0.41 above the rim, ~0.37 in
// front of the rim (z up to 0.87), 0.42 below the rim hanging down the front, and 0.48 to either side (dragging across
// the lip). Above the rim it never leans back past z = 0.12 (the open lid is behind). Hidden until lick(); hidden
// again when the promise resolves.
//
// createTongue(THREE, opts):
//   url      '/assets/3d/tongue-model.glb'
//   rimY     0.78              height of the rim above the floor (drips splash on the floor at local y = -rimY)
//   open     [0.439, 0.395]    half size (x, z) of the opening   outer [0.554, 0.5]  half size of the rim's outside
//   seed     7                 the same seed and the same dt steps give the same frames (warm() doesn't change them)
//   shadows  true              the tongue and the drops cast shadows
//   fxParent null              where the drips live (see below); null: inside object3d
//   tint     0xe8a4ac          multiplies the model's colour map: a touch deeper and redder, so it reads on white
//                              (0xffffff = the model's own colours)
//   wait     1.5               lick() called before the model has arrived waits up to this long (seconds of update
//                              time) for it, then gives up (the promise resolves, nothing shows)
//   onCue    (name, info) => {} for sounds or a shake (times at speed 1): 'peek' 0.07, 'erupt' 0.23, 'slap' 0.44 and
//                              1.2 (it lands on the lip: a wet thump), 'lick' 0.66 and 0.84 (the drags across the lip),
//                              'flick' 1.08 (the lap curls over), 'slurp' 1.34, 'snap' (a string of spit breaks),
//                              'splat' { x, y, z, size } (fx space) when a drop lands, at most one per 60 ms.
//                              Errors thrown by the hook are swallowed.
// returns {
//   object3d                   the tongue (and, by default, the drips)
//   fx                         the group holding the drops, crowns, puddles and strings
//   ready                      a promise: resolves (to this object) when the model has arrived, rejects if it can't
//                              load (then lick() resolves at once and nothing shows; the procedural tongue is the
//                              fallback)
//   lick({ speed = 1, mirror = false }) => Promise
//                              speed: playback rate. mirror: left and right swapped (exact). Called while busy:
//                              returns the running lick's promise. Resolves when the tongue is back inside AND no
//                              drop is left in the air over the opening (any still there is removed), so the lid can
//                              slam at once.
//   update(dt)                 dt clamped to 0.05; frame-rate independent (springs stepped at 240 Hz)
//   warm(renderer, camera)     once, after object3d (and fx) are in the scene: compiles every shader it uses, makes
//                              the env's PMREM, uploads the model's textures and the shadow-pass variants by rendering
//                              one frame with its pieces present but too small to see, and runs the lick's code once
//                              silently (no cues, state restored). Called before the model has arrived, it is done in
//                              the first update() after it arrives (so `await tongue.ready` first if you want it done
//                              during setup). Without it the first lick frame stalls (~260 ms in headless Edge; with it, ~1 ms).
//   stop()                     for a Skip button: the tongue goes, every drip goes, the running lick's promise resolves
//   dispose()                  stop() + removes object3d and fx from their parents and frees its GPU resources
//   busy                       (getter) true while licking (or waiting for the model to lick)
//   debug                      for dev/lab-tongue-model.html; ignore it
// }
// Where the drips live: they are simulated in fx's local space, which matches object3d's at the start of each lick.
// By default fx is a child of object3d. If the intro moves the bin afterwards (rattle) while puddles are still drying
// (up to ~2.6 s), pass opts.fxParent = scene: fx is then added to the scene and placed at object3d's world transform at
// each lick() start, and the drips stay put when the bin moves.
// Budget: one skinned mesh (10.7k vertices, 17.6k triangles, 21 bones; skinning on the GPU), one draw call each for
// drops, crowns, puddles and strings (a small unlit liquid shader) + the shadow pass for the tongue and the drops.
// Per frame on the CPU: ~0.05 ms (11 joints on springs, 21 bone matrices, up to 56 drops).
import { GLTFLoader } from '/assets/vendor/three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '/assets/vendor/three/addons/libs/meshopt_decoder.module.js';

const T_END = 1.58;

// The lick, keyframed: a row per moment (seconds at speed 1), each with the numbers that have a key there (Hermite
// between keys, flat at a key that is a peak or a valley, so every overshoot is drawn on purpose).
//   root  [x, y, z]  the base of the stalk, down in the bin (its top comes out of the opening)
//   lean  radians    the stalk tipped forward (+, toward the camera) or back (-) about x
//   side  radians    the stalk tipped about z (+: toward -x)
//   grow             overall size: it swells as it comes out of the dark (and shrinks as it goes back)
//   reach            length (bones stretched) relative to its rest length; the girth goes the other way
//   drape  radians   the bend just above the opening: - rolls it forward over the lip (its top outside), + back
//   arch   radians   a bend spread along the body (- forward/down, + back/up)
//   curl   radians   the front third curling toward its top (+) or under (-)
//   yaw    radians   the body sweeping to the tongue's left (+) or right (-)
//   hook   radians   the front third bending to its left (+) or right (-)
//   wave   radians   a wave running from root to tip (per joint); its phase runs at 'ws' cycles a second
//   cup    radians   the tip's edges rolled up (a spoon)
//   doff / dsig      where the drape bends (arclength past the opening) and over how long
// The top faces the back as it comes up through the opening, so every big pose rolls it forward over the lip: the
// camera sees its top (the groove, the taste buds), never a bare column of underside.
const HIDDEN = { root: [0, -0.47, 0.06], lean: 0.1, side: 0, grow: 0.32, reach: 0.9, drape: -2.0, arch: -1.4, curl: -1.2, yaw: 0, hook: 0, wave: 0, ws: 1.8, doff: 0.05, dsig: 0.2, cup: 0.1 };
const POSES = [
  [0, HIDDEN],                                                           // small, rolled forward, down in the dark
  // PEEK: the tip slides out over the front lip and tastes it (a wiggle), then tucks under: the wind-up
  [0.09, { root: [0, -0.45, 0.2], lean: 0.2, grow: 0.85, reach: 1, drape: -1.9, arch: 0, curl: 0.2, hook: 0.35, cup: 0.3, doff: 0.1 }],
  [0.13, { hook: -0.3, curl: -0.1 }],
  [0.16, { hook: 0.2 }],
  [0.2, { root: [0, -0.45, 0.2], lean: 0.2, grow: 0.8, reach: 0.97, drape: -1.8, curl: -0.3, hook: 0, cup: 0.1, doff: 0.1 }],
  // ERUPT: bursts up and over the front in a big hook, its tip hanging in front; unrolls down the front, SLAPS the lip
  [0.3, { root: [0, -0.35, 0.11], lean: 0.35, grow: 1, reach: 1.03, drape: -0.3, arch: -2.1, curl: -2.1, cup: 0, doff: 0.22 }],
  [0.37, { root: [0, -0.38, 0.16], lean: 0.3, drape: -1.2, arch: -1.4, curl: -1.3 }],
  [0.45, { root: [0, -0.42, 0.22], lean: 0.25, reach: 1, drape: -2.6, arch: -0.2, curl: -0.4, cup: 0.2, wave: 0.05 }],
  [0.52, { drape: -2.45, curl: 0.25, cup: 0.35 }],
  [0.6, { wave: 0.25 }],
  // greedy licks: drags across the lip to its left, the tip trailing and curling ... and back across to its right
  [0.7, { root: [0.16, -0.42, 0.22], side: -0.2, yaw: 0.75, hook: 0.55, curl: 0.45, cup: 0.55 }],
  [0.78, { hook: 0.15, curl: 0.2 }],
  [0.88, { root: [-0.16, -0.42, 0.22], side: 0.2, yaw: -0.75, hook: -0.55, curl: 0.45, cup: 0.55 }],
  [0.96, { hook: -0.15, curl: 0.2 }],
  [1.03, { root: [0, -0.42, 0.22], side: 0, yaw: 0, hook: 0, drape: -2.45, arch: -0.2, curl: 0.3, cup: 0.3, wave: 0.2 }],
  // a big lap: up off the lip and over to its left, curling over, and SLAP down again
  [1.12, { root: [0.04, -0.33, 0.12], lean: 0.33, side: -0.05, drape: -0.5, arch: -2.0, curl: -1.9, yaw: 0.4, hook: 0.35, cup: 0.15, wave: 0.08 }],
  [1.21, { root: [0, -0.42, 0.22], lean: 0.25, side: 0, drape: -2.6, arch: -0.2, curl: -0.4, yaw: 0, hook: 0, cup: 0.2 }],
  [1.28, { drape: -2.45, curl: 0.2, wave: 0.12 }],
  // SLURP: sucked back up the front and over the lip, the tip trailing, and down into the dark
  [1.33, { root: [0, -0.42, 0.22], lean: 0.25, grow: 1, reach: 1, drape: -2.45, arch: -0.2, curl: 0.2, doff: 0.22 }],
  [1.39, { root: [0, -0.46, 0.15], lean: 0.18, grow: 0.8, reach: 0.95, drape: -1.6, arch: -0.3, curl: -0.3, doff: 0.15 }],
  [1.44, { root: [0, -0.47, 0.08], lean: 0.05, grow: 0.55, reach: 0.92, drape: -0.9, arch: -0.6, curl: -0.6, wave: 0.04, cup: 0.2, doff: 0.1 }],
  [1.52, { ...HIDDEN, drape: -0.6 }],
  [T_END, HIDDEN],
];
const CUES = [[0.07, 'peek'], [0.23, 'erupt'], [0.44, 'slap'], [0.66, 'lick'], [0.84, 'lick'], [1.08, 'flick'], [1.2, 'slap'], [1.34, 'slurp']];
// spit (time, how many, from where): off the tip at the end of a move, off the edges of the tongue as it slaps the
// lip, or a fat drop letting go of the hanging tip
const BURSTS = [[0.31, 3, 'tip'], [0.44, 8, 'slap'], [0.56, 1, 'drool'], [0.72, 3, 'tip'], [0.9, 3, 'tip'], [1.12, 3, 'tip'], [1.2, 6, 'slap'], [1.27, 1, 'drool'], [1.4, 4, 'tip']];
// strings of spit from the lip to the tongue's underside (time, across: -1..1): one as it is slurped back up the front
// (the others come by themselves wherever it lifts off the lip)
const STRINGS = [[1.36, 0.15]];

export function createTongue(THREE, opts = {}) {
  const O = Object.assign({
    url: '/assets/3d/tongue-model.glb', rimY: 0.78, open: [0.439, 0.395], outer: [0.554, 0.5], seed: 7, shadows: true,
    tint: 0xe8a4ac, onCue: null, fxParent: null, wait: 1.5,
  }, opts);
  const [OX, OZ] = O.open, [UX, UZ] = O.outer, FLOOR = -O.rimY, G = 9.8;
  let seedState = O.seed | 0;
  const rng = () => { // mulberry32, its state kept here so warm() can put it back
    seedState = (seedState + 0x6d2b79f5) | 0;
    let t = Math.imul(seedState ^ (seedState >>> 15), 1 | seedState);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rnd = (a = 0, b = 1) => a + (b - a) * rng();
  let silent = false, clock = 0, lastSplat = -1, disposed = false;
  const cue = (name, info) => {
    if (silent) return;
    if (name === 'splat') { if (clock - lastSplat < 0.06) return; lastSplat = clock; }
    try { O.onCue?.(name, info); } catch (e) { /* a sound hook must never stop the show */ }
  };
  const V = () => new THREE.Vector3();
  const tracks = buildTracks(POSES);

  const object3d = new THREE.Group();
  object3d.name = 'tongue';
  const fx = new THREE.Group();
  fx.name = 'tongue-fx';
  (O.fxParent || object3d).add(fx);
  const rig = new THREE.Group();
  rig.name = 'tongue-rig';
  object3d.add(rig);
  const env = makeEnv(THREE);
  const owned = [env];

  // ------------------------------------------------------------------------------------------ wet things
  // Spit is a cartoon liquid (its own little unlit shader): a see-through light body, a darker blue-grey edge so it
  // reads on the white page, a crisp white highlight dot and a soft bounce.
  const liquid = (o) => { const m = liquidMaterial(THREE, o); owned.push(m); return m; };
  const dropMat = liquid({ tint: 0xd9e3ef, edge: 0x5a7090, alpha: 0.4, edgeAlpha: 0.95, defines: { DROP: '' } });
  const crownMat = liquid({ tint: 0xe3eaf3, edge: 0x6a7f9a, alpha: 0.3, edgeAlpha: 0.9, defines: { FADE: '', CROWN: '' }, side: THREE.DoubleSide });
  const puddleMat = liquid({ tint: 0xb6c6da, edge: 0x6f86a3, alpha: 0.5, edgeAlpha: 0.92, defines: { FADE: '', PUDDLE: '' } });
  puddleMat.polygonOffset = true; puddleMat.polygonOffsetFactor = -2; puddleMat.polygonOffsetUnits = -2;
  const stringMat = liquid({ tint: 0xe6edf5, edge: 0x6a809c, alpha: 0.55, edgeAlpha: 0.95 });

  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V1 = V(), V2 = V(), V3 = V(), SC = V();
  const UP = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0), Y = UP, Z = new THREE.Vector3(0, 0, 1);
  const instanced = (geo, m, n, fade) => {
    if (fade) geo.setAttribute('aFade', new THREE.InstancedBufferAttribute(new Float32Array(n).fill(1), 1).setUsage(THREE.DynamicDrawUsage));
    const im = new THREE.InstancedMesh(geo, m, n);
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    im.frustumCulled = false; im.count = 0;
    fx.add(im); owned.push(geo);
    return im;
  };
  const MAXD = 56, MAXC = 16, MAXP = 28, MAXS = 4;
  const puddles = instanced(puddleGeometry(THREE, rng), puddleMat, MAXP, true);
  puddles.renderOrder = 1;
  const crowns = instanced(crownGeometry(THREE), crownMat, MAXC, true);
  crowns.renderOrder = 2;
  const drops = instanced(new THREE.IcosahedronGeometry(1, 2), dropMat, MAXD);
  drops.castShadow = O.shadows; drops.renderOrder = 3;

  const D = [], C = [], PD = [], STR = [];
  for (let k = 0; k < MAXD; k++) D.push({ on: false, p: V(), v: V(), r: 0, kind: 0, age: 0 });
  for (let k = 0; k < MAXC; k++) C.push({ on: false, p: V(), t: 0, life: 0.3, R: 0, H: 0, rot: 0 });
  for (let k = 0; k < MAXP; k++) PD.push({ on: false, p: V(), t: 0, life: 2, R: 0, rot: 0 });
  const take = (pool, age) => { let best = null; for (const o of pool) { if (!o.on) return o; if (!best || age(o) > age(best)) best = o; } return best; };
  function spawnDrop(p, v, r, kind = 0) {
    const d = take(D, (o) => o.age);
    d.on = true; d.p.copy(p); d.v.copy(v); d.r = Math.min(r, 0.024); d.kind = kind; d.age = 0;
    if (d.p.y > -0.05) d.v.z = Math.max(d.v.z, -0.25); // never back into the open lid
    const sp = d.v.length(); if (sp > 5) d.v.multiplyScalar(5 / sp);
  }
  function puddle(x, y, z, R0, life) {
    const p = take(PD, (o) => o.t);
    p.on = true; p.p.set(x, y + 0.002, z); p.t = 0; p.life = life; p.R = R0; p.rot = rng() * 6.28;
  }
  function splash(x, y, z, r, speed, onRim) {
    const big = r * (0.75 + 0.1 * Math.min(6, speed));
    if (r > 0.01 && !onRim) { // a crown and droplets thrown from its points (on the rim: just the puddle)
      const c = take(C, (o) => o.t);
      c.on = true; c.p.set(x, y, z); c.t = 0; c.life = 0.24 + 0.08 * rng(); c.R = big * 2.4; c.H = big * (1.7 + 0.5 * rng()); c.rot = rng() * 6.28;
      const n = r > 0.02 ? 4 : r > 0.014 ? 3 : 2;
      for (let k = 0; k < n; k++) {
        const a = rng() * 6.28, out = 0.5 + rng() * 0.9;
        spawnDrop(V1.set(x + Math.cos(a) * c.R * 0.8, y + c.H * 0.5, z + Math.sin(a) * c.R * 0.8), V2.set(Math.cos(a) * out, 0.9 + rng() * 1.1, Math.sin(a) * out), r * (0.3 + 0.15 * rng()), 1);
      }
    }
    puddle(x, y, z, Math.min(onRim ? 0.06 : 0.14, r * (2.3 + 0.35 * Math.min(6, speed))), (onRim ? 1.0 : 1.5) + rng() * 0.7);
    cue('splat', { x, y, z, size: r });
  }

  // strings of spit between the tongue's underside and the lip: one indexed mesh, 4 strings of 12 x 6
  const SEG = 12, SS = 6, SV = (SEG + 1) * SS;
  const sPos = new Float32Array(MAXS * SV * 3), sNrm = new Float32Array(MAXS * SV * 3), sIdx = [];
  for (let k = 0; k < MAXS; k++) for (let u = 0; u < SEG; u++) for (let j = 0; j < SS; j++) {
    const a = k * SV + u * SS + j, b = k * SV + u * SS + (j + 1) % SS;
    sIdx.push(a, a + SS, b, b, a + SS, b + SS);
  }
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3).setUsage(THREE.DynamicDrawUsage));
  sGeo.setAttribute('normal', new THREE.BufferAttribute(sNrm, 3).setUsage(THREE.DynamicDrawUsage));
  sGeo.setIndex(sIdx);
  const strings = new THREE.Mesh(sGeo, stringMat);
  strings.frustumCulled = false; strings.visible = false; strings.renderOrder = 3;
  fx.add(strings); owned.push(sGeo);
  for (let k = 0; k < MAXS; k++) STR.push({ on: false, joint: 0, side: 0, a: V(), b: V(), av: V(), t: 0, snapAt: -1, snapLen: 0.3, sag: 0, bead: 0.5, ph: 0 });

  // ------------------------------------------------------------------------------------------ the tongue (its model)
  // Everything below is filled in by build() when the GLB arrives.
  let mesh = null, mat = null, failed = null, pendingWarm = null;
  let NJ = 0, L = 1, STALK = 0, restP = [], restQ = [], restLen = [], hw = [], hh = [], sAt = [], relQ = [];
  let cupInfo = [], chainBones = [], cupBones = [], springF = [], archW = [], curlN = [];
  let pos = [], rot = [], tgtP, tgtY, angP, angY, velP, velY, contact, wasContact, cpt;
  let tipPin = null, EMIT = [], emitPrev = [], emitAcc = new Float32Array(0);
  const par = { root: V(), lean: 0, side: 0, grow: 1, reach: 1, drape: 0, arch: 0, curl: 0, yaw: 0, hook: 0, wave: 0, ws: 0, cup: 0, doff: 0, dsig: 1 };
  let phase = 0, sx = 1, primed = false;
  const BASE = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1)));

  function build(gltf) {
    let m = null, rigNode = null;
    gltf.scene.traverse((o) => { if (o.isSkinnedMesh && !m) m = o; if (o.userData?.rig) rigNode = o; });
    if (!m || !rigNode) throw new Error('tongue-model: no skinned mesh or rig data in ' + O.url);
    const RIG = JSON.parse(rigNode.userData.rig);

    // the rig at rest. Rest frames (glTF space): x = across (the tongue's right), y = along (root -> tip), z = its top.
    NJ = RIG.joints.length; // chain joints, root .. last; bone k runs from joint k to joint k+1 (or the tip end)
    restP = [...RIG.joints.map((j) => new THREE.Vector3(...j.p)), new THREE.Vector3(...RIG.tipEnd.p)];
    const frameQ = (p0, p1, up) => {
      const y = V().subVectors(p1, p0).normalize();
      const z = up.clone().addScaledVector(y, -up.dot(y)).normalize();
      const x = V().crossVectors(y, z);
      return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
    };
    for (let k = 0; k < NJ; k++) {
      restQ.push(frameQ(restP[k], restP[k + 1], new THREE.Vector3(...RIG.joints[k].up)));
      restLen.push(restP[k].distanceTo(restP[k + 1]));
      hw.push(RIG.joints[k].hw); hh.push(RIG.joints[k].hh); sAt.push(RIG.joints[k].s);
    }
    L = RIG.length; STALK = RIG.stalk;
    relQ = [new THREE.Quaternion()]; // the rest bend at each joint (bone k-1 -> bone k)
    for (let k = 1; k < NJ; k++) relQ.push(restQ[k - 1].clone().invert().multiply(restQ[k]));
    // the cups: twins of the front chain bones (same rest frame) holding the edges; rolled about the bone's own axis
    const restM = (k) => new THREE.Matrix4().compose(restP[k], restQ[k], new THREE.Vector3(1, 1, 1));
    cupInfo = (RIG.cups || []).map((c) => ({ name: c.name, parent: RIG.joints.findIndex((j) => j.name === c.joint), sign: c.sign }));

    // my own bones (flat, in object3d space), in the GLB skin's joint order so the weights still point right
    const bones = [], inverses = [], boneOf = {}, jointOfBone = [];
    for (const b of m.skeleton.bones) {
      const bone = new THREE.Bone();
      bone.name = b.name; bone.matrixAutoUpdate = false;
      const k = RIG.joints.findIndex((j) => j.name === b.name);
      const kk = k >= 0 ? k : cupInfo.find((c) => c.name === b.name).parent;
      const rest = restM(kk);
      bone.matrix.copy(rest);
      boneOf[b.name] = bone; jointOfBone.push(kk);
      bones.push(bone); inverses.push(rest.clone().invert());
      rig.add(bone);
    }
    chainBones = RIG.joints.map((j) => boneOf[j.name]);
    cupBones = cupInfo.map((c) => boneOf[c.name]);
    m.skeleton.dispose?.();
    m.removeFromParent();
    m.position.set(0, 0, 0); m.quaternion.identity(); m.scale.set(1, 1, 1);
    m.bind(new THREE.Skeleton(bones, inverses), new THREE.Matrix4());
    m.frustumCulled = false;
    m.castShadow = O.shadows;
    m.visible = false;
    m.name = 'tongue-model';
    rig.add(m);
    owned.push(m.geometry, m.skeleton);

    // where each vertex sits, from its rest position in its main bone's frame: how far up the tongue's sides (-1: the
    // middle of its underside, +1: the middle of its top; the shader deepens the underside's colour, a pale, dull pink
    // in the map) and how far along it (the stalk, stretched from the root's cross-section, has flat sides: the shader
    // draws it sinking into the dark, a throat, wherever it shows)
    const geo = m.geometry, P = geo.attributes.position, SI = geo.attributes.skinIndex, SW = geo.attributes.skinWeight;
    const top = new Float32Array(P.count * 2), qi = restQ.map((q) => q.clone().invert());
    for (let i = 0; i < P.count; i++) {
      let b = SI.getX(i), w = SW.getX(i);
      if (SW.getY(i) > w) { b = SI.getY(i); w = SW.getY(i); }
      if (SW.getZ(i) > w) { b = SI.getZ(i); w = SW.getZ(i); }
      if (SW.getW(i) > w) { b = SI.getW(i); }
      const k = jointOfBone[b] ?? 0;
      V1.fromBufferAttribute(P, i).sub(restP[k]).applyQuaternion(qi[k]);
      top[i * 2] = clamp(V1.z / Math.max(1e-3, hh[k]), -1.5, 1.5);
      top[i * 2 + 1] = sAt[k] + clamp(V1.y, -0.05, restLen[k] + 0.05);
    }
    geo.setAttribute('aWhere', new THREE.BufferAttribute(top, 2));

    // the material: the model's own maps (colour, normal, roughness) under a wet clear coat; a studio env for crisp
    // highlights; the colour map tinted toward a meatier red; inside the opening, below the rim, it sinks into the black
    mat = m.material;
    owned.push(mat);
    for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap']) if (mat[k]) owned.push(mat[k]);
    if (mat.map) mat.map.anisotropy = 4;
    mat.color.set(O.tint);
    mat.envMap = env;
    mat.envMapIntensity = 1;
    mat.metalness = 0;
    mat.roughness = 3.5; // x the roughness map (~0.1): a satin flesh under the wet coat
    if (mat.isMeshPhysicalMaterial) {
      // the coat takes the bumps of the taste buds: the wet highlights break up into glints
      mat.clearcoat = 1; mat.clearcoatRoughness = 0.08;
      if (mat.normalMap) { mat.clearcoatNormalMap = mat.normalMap; mat.clearcoatNormalScale = new THREE.Vector2(2.5, 2.5); }
      mat.specularIntensity = 0.5;
    }
    mat.normalScale?.multiplyScalar(1.5);
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uHole = { value: new THREE.Vector2(OX, OZ) };
      sh.uniforms.uStalk = { value: STALK };
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute vec2 aWhere;\nvarying vec3 vRig;\nvarying vec2 vWhere;')
        .replace('#include <project_vertex>', 'vRig = transformed;\nvWhere = aWhere;\n#include <project_vertex>');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vRig;\nvarying vec2 vWhere;\nuniform vec2 uHole;\nuniform float uStalk;')
        // the underside: a deeper, richer red than the pale pink baked into the map
        .replace('#include <map_fragment>', `#include <map_fragment>
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.92, 0.6, 0.62), smoothstep(-0.05, -0.65, vWhere.x));`)
        // the studio lights the gloss more than the flesh: a deep, wet red rather than a bright pink
        .replace('#include <lights_fragment_maps>', '#include <lights_fragment_maps>\niblIrradiance *= 0.35;')
        // inside the opening, below the rim, it sinks into the black of the bin; the stalk (the throat) is dark anywhere
        .replace('#include <opaque_fragment>', `
          float inHole = (1.0 - smoothstep(uHole.x - 0.05, uHole.x + 0.01, abs(vRig.x))) * (1.0 - smoothstep(uHole.y - 0.05, uHole.y + 0.01, abs(vRig.z)));
          outgoingLight *= mix(1.0, mix(0.02, 1.0, smoothstep(-0.26, 0.01, vRig.y)), inHole);
          outgoingLight *= mix(0.06, 1.0, smoothstep(uStalk - 0.14, uStalk + 0.06, vWhere.y));
          #include <opaque_fragment>`);
    };
    mat.customProgramCacheKey = () => 'tongue-model-2';
    mat.needsUpdate = true;

    // the chain's state
    pos = Array.from({ length: NJ + 1 }, V); rot = Array.from({ length: NJ }, () => new THREE.Quaternion());
    tgtP = new Float32Array(NJ); tgtY = new Float32Array(NJ); angP = new Float32Array(NJ); angY = new Float32Array(NJ);
    velP = new Float32Array(NJ); velY = new Float32Array(NJ);
    contact = new Uint8Array(NJ + 1); wasContact = new Uint8Array(NJ + 1); cpt = Array.from({ length: NJ + 1 }, V);
    // where each bend lives (weights over the joints, by arclength); springs softer toward the tip
    const bodyW = sAt.map((s) => smooth(STALK - 0.05, STALK + 0.1, s));
    const curlW = sAt.map((s) => smooth(STALK + 0.45 * (L - STALK), L - 0.05, s));
    const norm = (w) => { const t = w.reduce((a, b) => a + b, 0) || 1; return w.map((x) => x / t); };
    archW = norm(bodyW); curlN = norm(curlW);
    springF = sAt.map((s) => 10 - 5 * smooth(STALK, L, s));
    // points on the tongue, carried by their bones: the tip, the edges of the front, the top (spit flies off them)
    tipPin = pin(NJ - 1, new THREE.Vector3(0, restLen[NJ - 1] + 0.03, 0.01));
    EMIT = [
      [tipPin, 2.2],
      [pin(NJ - 2, new THREE.Vector3(hw[NJ - 2] * 0.95, 0, 0)), 0.8], [pin(NJ - 2, new THREE.Vector3(-hw[NJ - 2] * 0.95, 0, 0)), 0.8],
      [pin(NJ - 4, new THREE.Vector3(hw[NJ - 4] * 0.95, 0, 0)), 0.5], [pin(NJ - 4, new THREE.Vector3(-hw[NJ - 4] * 0.95, 0, 0)), 0.5],
      [pin(NJ - 6, new THREE.Vector3(0, 0, hh[NJ - 6])), 0.3],
    ];
    emitPrev = EMIT.map(() => V()); emitAcc = new Float32Array(EMIT.length);
    evalPose(0); targets(); settle(); solve();
    mesh = m; // now it can lick
  }

  const ready = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(O.url).then((gltf) => {
    if (!disposed) build(gltf);
    return api;
  });
  ready.catch((e) => { failed = e || new Error('tongue-model: could not load ' + O.url); if (!disposed) console.warn('tongue-model:', failed); });

  // ------------------------------------------------------------------------------------------ posing the chain
  function evalPose(t) {
    for (const k in tracks) {
      const tr = tracks[k];
      if (Array.isArray(tr)) par[k].set(tr[0](t), tr[1](t), tr[2](t));
      else par[k] = tr(t);
    }
    par.root.x *= sx; par.side *= sx; par.yaw *= sx; par.hook *= sx;
  }

  // The bend at every joint (pitch: toward the top +, yaw: to the tongue's left +): targets from the keys, and the
  // bends actually drawn, which chase them on springs: softer toward the tip, so the tip lags, whips and overshoots.
  const ZETA = 0.42;
  function targets() {
    const g = par.grow;
    // the drape sits just above where the stalk comes out of the opening
    const sExit = Math.max(0.05, (-par.root.y / g) / Math.max(0.3, Math.cos(par.lean)));
    // (spread over the joints out of the opening; while only the tip is out, it takes no more than its share, so the
    // emerging tip curves over the lip instead of folding flat on itself)
    let dw = 0, full = 0;
    for (let k = 1; k < NJ; k++) {
      const s = sAt[k], gw = Math.exp(-0.5 * ((s - sExit - par.doff) / par.dsig) ** 2);
      tgtY[k] = s > sExit - 0.06 ? gw : 0; dw += tgtY[k]; full += gw;
    }
    dw = Math.max(dw, 0.4 * full, 1e-6);
    for (let k = 1; k < NJ; k++) {
      const s = sAt[k], en = smooth(STALK, STALK + 0.3, s);
      const wv = par.wave * en * Math.sin(2 * Math.PI * ((s - STALK) / 0.55 - phase));
      tgtP[k] = par.drape * tgtY[k] / dw + par.arch * archW[k] + par.curl * curlN[k] + wv;
      tgtY[k] = par.yaw * archW[k] + par.hook * curlN[k] + 0.4 * par.wave * en * Math.sin(2 * Math.PI * ((s - STALK) / 0.7 - 0.8 * phase) + 1.3) * sx;
    }
  }
  function springs(dt) {
    const n = Math.max(1, Math.ceil(dt / (1 / 240))), h = dt / n;
    for (let i = 0; i < n; i++) {
      for (let k = 1; k < NJ; k++) {
        const w = 2 * Math.PI * springF[k];
        velP[k] += (w * w * (tgtP[k] - angP[k]) - 2 * ZETA * w * velP[k]) * h; angP[k] += velP[k] * h;
        velY[k] += (w * w * (tgtY[k] - angY[k]) - 2 * ZETA * w * velY[k]) * h; angY[k] += velY[k] * h;
      }
    }
  }
  const settle = () => { angP.set(tgtP); angY.set(tgtY); velP.fill(0); velY.fill(0); };

  const eul = new THREE.Euler(), dbg = { collide: true }; // (the lab can switch the bin off: &nocollide)
  function solve() {
    const g = par.grow, girth = 1 / Math.sqrt(par.reach);
    rot[0].copy(BASE);
    Q.setFromAxisAngle(X, par.lean); rot[0].premultiply(Q);
    Q.setFromAxisAngle(Z, par.side); rot[0].premultiply(Q);
    pos[0].copy(par.root);
    for (let k = 1; k < NJ; k++) {
      rot[k].copy(rot[k - 1]).multiply(relQ[k]).multiply(Q.setFromEuler(eul.set(angP[k], 0, angY[k], 'XZY')));
      pos[k].copy(Y).applyQuaternion(rot[k - 1]).multiplyScalar(restLen[k - 1] * g * par.reach).add(pos[k - 1]);
    }
    pos[NJ].copy(Y).applyQuaternion(rot[NJ - 1]).multiplyScalar(restLen[NJ - 1] * g * par.reach).add(pos[NJ - 1]);
    if (dbg.collide) collide(g * girth);
    // write the bones: each one along its (possibly pushed) chord, scaled
    for (let k = 0; k < NJ; k++) {
      V1.copy(Y).applyQuaternion(rot[k]);
      V2.subVectors(pos[k + 1], pos[k]);
      const len = V2.length();
      V2.divideScalar(len || 1);
      Q.setFromUnitVectors(V1, V2); rot[k].premultiply(Q);
      SC.set(g * girth, len / restLen[k], g * girth);
      chainBones[k].matrix.compose(pos[k], rot[k], SC);
      chainBones[k].matrixWorldNeedsUpdate = true;
    }
    for (let c = 0; c < cupInfo.length; c++) {
      const ci = cupInfo[c];
      // more cup toward the tip
      M4.makeRotationAxis(Y, par.cup * ci.sign * (0.6 + 0.4 * (ci.parent - cupInfo[0].parent) / Math.max(1, NJ - 1 - cupInfo[0].parent)));
      cupBones[c].matrix.copy(chainBones[ci.parent].matrix).multiply(M4);
      cupBones[c].matrixWorldNeedsUpdate = true;
    }
  }

  // The bin: the tongue lies on the rim, never through it; hangs down the front, not through it; stays off the walls
  // inside the opening and above the floor in there. The bin is a block (the rim's outside, all the way down) with
  // the opening cut into it, and the tongue a tube round its spine: points along every bone are kept at least its
  // thickness away from the block by its distance field (so a push changes smoothly as the tongue moves: no pops),
  // and each push is shared by the bone's two ends; a few passes settle it.
  const RIMH = 0.084, INFLOOR = -0.5; // the rim's depth; the bin's floor inside (the dark), from the rim plane
  const CARRY = 0.45; // how much of a push the next joint along takes (and the next, x0.45 again...)
  const PU = V(), SP = V(), N2 = V(), CP = V();
  // seen from above (first quadrant): the distance from (ax, az) to the rim's ring and the way away from it (N2);
  // 0 on the ring
  function ring2(ax, az) {
    if (ax > UX || az > UZ) { const dx = Math.max(ax - UX, 0), dz = Math.max(az - UZ, 0), d = Math.hypot(dx, dz); N2.set(dx / d, 0, dz / d); return d; }
    if (ax < OX && az < OZ) { const dx = OX - ax, dz = OZ - az; if (dx < dz) { N2.set(-1, 0, 0); return dx; } N2.set(0, 0, -1); return dz; }
    N2.set(0, 1, 0);
    return 0;
  }
  // Which side of the block a point is on (1: down in the opening, 2: beside the bin, below the rim plane, 3: above the
  // rim plane; 0: in the block). Walking along the chain from the root (down in the opening), the tongue can only get
  // from one side to another over the top: a test point on the far side of a wall from the one before it (the lip is
  // thin; a fast bend can put the hanging part right through it) is pushed back to that one's side, and one that pokes
  // into the block goes back out the way the chain came (so the tongue hanging down the front is never pushed through
  // the wall into the opening, nor the stalk out through it).
  function sideOf(p) {
    if (p.y > 0) return 3;
    const ax = Math.abs(p.x), az = Math.abs(p.z);
    if (ax < OX && az < OZ) return 1;
    return ax > UX || az > UZ ? 2 : 0;
  }
  function pushOut(p, h, w, from) { // -> PU (zero if clear); true when the push lays it on the rim's top (CP: where)
    PU.set(0, 0, 0);
    const ax = Math.abs(p.x), az = Math.abs(p.z), sxp = p.x < 0 ? -1 : 1, szp = p.z < 0 ? -1 : 1;
    if (p.y < FLOOR + h) { PU.y = FLOOR + h - p.y; return false; } // the ground
    const d2 = ring2(ax, az);
    if (p.y > 0) { // above the rim plane: off the ring's top and its edges
      const d = Math.hypot(d2, p.y);
      if (d >= h) return false;
      const k = (h - d) / Math.max(d, 1e-6);
      PU.set(N2.x * sxp * d2 * k, p.y * k, N2.z * szp * d2 * k);
      if (d2 < 1e-6) PU.set(0, h - p.y, 0);
      CP.set(p.x - N2.x * sxp * d2, 0, p.z - N2.z * szp * d2);
      return p.y / Math.max(d, 1e-6) > 0.35;
    }
    const inOpen = ax < OX && az < OZ;
    if ((inOpen && from === 2) || (d2 > 0 && !inOpen && from === 1 && p.y < -h)) {
      // it went straight through a wall since last time (the lip is thin): back out the way it came
      if (from === 2) { if (UZ + h - az < UX + h - ax) PU.z = szp * (UZ + h - az); else PU.x = sxp * (UX + h - ax); }
      else if (az > OZ - h && (ax < OX || az - OZ < ax - OX)) PU.z = szp * (OZ - h - az); else PU.x = sxp * (OX - w * 0.85 - ax);
      return false;
    }
    if (inOpen) { // down in the opening: off its walls (across x, the tongue's half width counts), its floor
      const mx = OX - w * 0.85, mz = OZ - h;
      if (ax > mx) PU.x = sxp * (mx - ax);
      if (az > mz) PU.z = szp * (mz - az);
      if (p.y < INFLOOR + h) PU.y = INFLOOR + h - p.y;
      return false;
    }
    if (d2 > 0) { // beside the bin, below the rim: off its sides
      if (d2 < h) PU.set(N2.x * sxp, 0, N2.z * szp).multiplyScalar(h - d2);
      return false;
    }
    // in the block: out the shortest way back to the side it came from (up, only through the rim; out a side; back
    // into the opening)
    let best = p.y > -RIMH ? h - p.y : Infinity, kind = 0;
    const lost = !from || (from === 3 && p.y <= -RIMH); // came from nowhere known (or fell right through the rim)
    if (from === 2 || lost) {
      if (UX + h - ax < best) { best = UX + h - ax; kind = 1; }
      if (UZ + h - az < best) { best = UZ + h - az; kind = 2; }
    }
    if ((from === 1 && p.y < -0.6 * RIMH) || lost) { // (near the top, out of the opening it goes over the lip)
      if (az < OZ && ax - (OX - w * 0.85) < best) { best = ax - (OX - w * 0.85); kind = 3; }
      if (ax < OX && az - (OZ - h) < best) { best = az - (OZ - h); kind = 4; }
    }
    if (best === Infinity) { best = UZ + h - az; kind = 2; }
    if (kind === 0) PU.y = best; else if (kind === 1) PU.x = sxp * best; else if (kind === 2) PU.z = szp * best; else if (kind === 3) PU.x = -sxp * best; else PU.z = -szp * best;
    CP.set(p.x, 0, p.z);
    return kind === 0;
  }
  const US = [0.34, 0.67, 1];
  function collide(scale) {
    wasContact.set(contact); contact.fill(0);
    for (let pass = 0; pass < 4; pass++) {
      let any = false, from = sideOf(pos[0]) || 1;
      for (let k = 0; k < NJ; k++) {
        for (let i = 0; i < 3; i++) {
          const u = US[i];
          SP.lerpVectors(pos[k], pos[k + 1], u);
          const j = Math.min(NJ - 1, k + (u > 0.5 ? 1 : 0));
          const onRim = pushOut(SP, hh[j] * scale, hw[j] * scale, from);
          from = sideOf(SP.add(PU)) || from;
          if (PU.lengthSq() < 1e-10) continue;
          any = true;
          if (onRim) { contact[k + 1] = 1; cpt[k + 1].set(clamp(CP.x, -UX, UX), 0, clamp(CP.z, -UZ, UZ)); }
          // the bone's two ends share the push (the root stays put); what hangs beyond is carried along
          const a = k ? (1 - u) : 0, b = u, n = a * a + b * b;
          if (k) pos[k].addScaledVector(PU, a / n);
          for (let i = k + 1, f = b / n; i <= NJ; i++, f *= CARRY) pos[i].addScaledVector(PU, f);
        }
      }
      if (!any) break;
    }
  }

  function pin(k, local) { return { k, local }; }
  const where = (pn, out) => out.copy(pn.local).applyMatrix4(chainBones[pn.k].matrix);
  function underside(s, out) {
    const k = s.joint;
    return out.set(s.side * hw[k], restLen[k] * 0.3, -hh[k] * 0.85).applyMatrix4(chainBones[k].matrix);
  }

  // ------------------------------------------------------------------------------------------ the lick
  let Lk = null;
  function alignFx() {
    if (!O.fxParent) return;
    object3d.updateWorldMatrix(true, false); O.fxParent.updateWorldMatrix(true, false);
    M4.copy(O.fxParent.matrixWorld).invert().multiply(object3d.matrixWorld);
    M4.decompose(fx.position, fx.quaternion, fx.scale);
  }
  function lick({ speed = 1, mirror = false } = {}) {
    if (Lk) return Lk.promise;
    let resolve;
    const promise = new Promise((r) => { resolve = r; });
    if (failed || disposed) { resolve(); return promise; }
    Lk = { t: 0, speed: Math.max(0.2, +speed || 1), sx: mirror ? -1 : 1, resolve, promise, cue: 0, burst: 0, str: 0, waiting: true, waitT: 0 };
    if (mesh) start(Lk);
    return promise;
  }
  function start(l) {
    l.waiting = false;
    alignFx();
    sx = l.sx; phase = 0; primed = false; contact.fill(0); emitAcc.fill(0);
    evalPose(0); targets(); settle(); solve();
    mesh.visible = true;
  }
  function finish() {
    const l = Lk;
    Lk = null;
    if (mesh) mesh.visible = false;
    for (const s of STR) if (s.on && s.snapAt < 0) snapString(s);
    // the lid may slam now: nothing is left in the air over the opening
    for (const d of D) if (d.on && d.p.y > -0.05 && Math.abs(d.p.x) < UX + 0.03 && Math.abs(d.p.z) < UZ + 0.03) d.on = false;
    l.resolve();
  }

  const tipPrev = V(), tipVel = V();
  function stepLick(dt) {
    const l = Lk;
    l.t = Math.min(T_END, l.t + dt * l.speed);
    const t = l.t, sdt = dt * l.speed;
    where(tipPin, tipPrev);
    evalPose(t);
    phase += sdt * par.ws;
    targets();
    springs(sdt);
    solve();
    if (dt > 0) tipVel.copy(where(tipPin, V1)).sub(tipPrev).divideScalar(dt);
    emit(dt);
    // lifting off the lip leaves strings of spit
    for (let k = 3; k <= NJ; k++) {
      if (!wasContact[k] || contact[k] || rng() > 0.6) continue;
      if (STR.some((s) => s.on && s.snapAt < 0 && Math.abs(s.joint - k) < 2)) continue;
      const s = STR.find((o) => !o.on);
      if (!s) break;
      startString(s, Math.min(k, NJ - 1), rnd(-0.6, 0.6), cpt[k]);
    }
    while (l.cue < CUES.length && CUES[l.cue][0] <= t) { cue(CUES[l.cue][1]); l.cue++; }
    while (l.burst < BURSTS.length && BURSTS[l.burst][0] <= t) { burst(BURSTS[l.burst][1], BURSTS[l.burst][2]); l.burst++; }
    while (l.str < STRINGS.length && STRINGS[l.str][0] <= t) { string(STRINGS[l.str][1]); l.str++; }
    if (t >= T_END) finish();
  }

  // Spit flies off wherever the tongue moves fast, mostly the tip.
  function emit(dt) {
    for (let e = 0; e < EMIT.length; e++) {
      const [pn, wgt] = EMIT[e];
      where(pn, V1);
      if (primed && dt > 0) {
        V2.subVectors(V1, emitPrev[e]).divideScalar(dt);
        const sp = V2.length();
        if (sp > 2.4 && V1.y > -0.02) {
          emitAcc[e] += wgt * 0.9 * (sp - 2.4) * dt;
          while (emitAcc[e] >= 1) {
            emitAcc[e] -= 1;
            const f = 0.55 + 0.4 * rng();
            spawnDrop(V1, V3.copy(V2).multiplyScalar(f).add(SC.set(rnd(-0.4, 0.4), rnd(-0.1, 0.5), rnd(-0.4, 0.4))), 0.011 + rng() * 0.013);
          }
        }
      }
      emitPrev[e].copy(V1);
    }
    primed = true;
  }
  function burst(n, from) {
    for (let k = 0; k < n; k++) {
      if (from === 'drool') { // a fat drop lets go of the hanging tip
        where(tipPin, V1);
        spawnDrop(V1, V2.set(rnd(-0.05, 0.05), -0.3, 0.15), 0.022);
      } else if (from === 'slap') { // squeezed out from under its edges as it lands: out to the sides, up and forward
        const j = NJ - 2 - Math.floor(rng() * 5), s = k % 2 ? -1 : 1;
        where(pin(j, V3.set(s * hw[j] * 1.05, 0, hh[j] * 0.3)), V1);
        spawnDrop(V1, V2.set(s * rnd(0.5, 1.4), rnd(0.9, 2.0), rnd(0.5, 1.4)), 0.012 + rng() * 0.012);
      } else { // off the tip, along its motion, mostly forward
        where(tipPin, V1);
        const f = rnd(0.35, 0.7);
        spawnDrop(V1, V3.copy(tipVel).multiplyScalar(f).add(V2.set(rnd(-0.7, 0.7), rnd(0.4, 1.2), rnd(0.4, 1.2))), 0.013 + rng() * 0.012);
      }
    }
  }
  function startString(s, k, side, at) {
    s.on = true; s.joint = k; s.side = side; s.t = 0; s.snapAt = -1; s.snapLen = 0.14 + rng() * 0.1; s.sag = 0; s.bead = 0.3 + rng() * 0.4; s.ph = rng() * 6.28;
    underside(s, s.a); s.av.set(0, 0, 0);
    if (at) { s.b.copy(at); s.b.x += side * hw[k] * 0.5; } else s.b.set(s.a.x, 0.004, clamp(s.a.z, OZ + 0.01, UZ - 0.01));
    s.b.y = Math.max(s.b.y, 0.004);
  }
  function string(side) { // from the joint lying on the lip now (or the nearest one to it)
    let k = -1;
    for (let j = 2; j < NJ; j++) if (contact[j]) { k = j; break; }
    if (k < 0) { let best = 9; for (let j = 2; j < NJ; j++) { const d = Math.abs(pos[j].y) + Math.max(0, OZ - Math.abs(pos[j].z)); if (d < best) { best = d; k = j; } } }
    const s = STR.find((o) => !o.on) || STR[0];
    startString(s, k, side, null);
  }
  function snapString(s) {
    s.snapAt = s.t;
    cue('snap');
    const mx = (s.a.x + s.b.x) / 2, my = (s.a.y + s.b.y) / 2 - s.sag, mz = (s.a.z + s.b.z) / 2;
    spawnDrop(V1.set(mx, my, mz), V2.set(s.av.x * 0.25 + rnd(-0.2, 0.2), Math.min(0, s.av.y * 0.2) - 0.3, Math.max(-0.2, s.av.z * 0.25) + rnd(0, 0.3)), 0.012 + rng() * 0.007);
  }

  // ------------------------------------------------------------------------------------------ per frame
  function stepStrings(dt) {
    let any = false;
    for (let k = 0; k < MAXS; k++) {
      const s = STR[k], base = k * SV * 3;
      if (!s.on) continue;
      s.t += dt;
      if (Lk && !Lk.waiting && s.snapAt < 0) { // follow the tongue
        underside(s, V1);
        if (dt > 0) s.av.copy(V1).sub(s.a).divideScalar(dt);
        s.a.copy(V1);
      }
      const len = s.a.distanceTo(s.b);
      if (s.snapAt < 0 && (len > s.snapLen || s.t > 0.4 || !Lk)) snapString(s);
      // after the snap, each half whips back to its own end within 0.1 s and is gone (a wet spot on the lip)
      const broke = s.snapAt >= 0 ? Math.min(1, (s.t - s.snapAt) / 0.1) : 0;
      if (broke >= 1) {
        s.on = false; sPos.fill(0, base, base + SV * 3);
        puddle(s.b.x, 0, s.b.z, 0.025 + rng() * 0.015, 0.9);
        continue;
      }
      any = true;
      // it sags with its span across (a string hanging straight down hardly bows), never more than a third of its length
      const across = Math.hypot(s.b.x - s.a.x, s.b.z - s.a.z);
      const sagT = Math.min(0.08, 0.3 * across + 0.08 * len, 0.33 * len) * (1 - broke);
      s.sag += (sagT - s.sag) * Math.min(1, dt * 12);
      const wob = 0.14 * len * Math.sin(s.t * 27 + s.ph) * (1 - broke); // it sways, sideways
      // thins as it stretches (same volume), webbed thick where it meets the tongue and the lip, a bead of spit on it
      const rMid = clamp(0.0008 / Math.max(0.05, len), 0.0032, 0.007), rEnd = Math.min(0.012, 0.004 + 0.12 * len);
      const ease = 1 - (1 - broke) * (1 - broke);
      for (let u = 0; u <= SEG; u++) {
        const f = u / SEG;
        const g = broke > 0 ? (f < 0.5 ? f * (1 - ease) : 1 - (1 - f) * (1 - ease)) : f; // each half to its own end
        const bow = 4 * g * (1 - g);
        const cx = s.a.x + (s.b.x - s.a.x) * g + wob * bow, cy = s.a.y + (s.b.y - s.a.y) * g - s.sag * bow, cz = s.a.z + (s.b.z - s.a.z) * g + s.sag * 0.5 * bow;
        const r = (rMid + (rEnd - rMid) * Math.pow(Math.abs(2 * f - 1), 4) + 0.007 * Math.exp(-Math.pow((f - s.bead) / 0.08, 2))) * (1 - 0.5 * broke);
        V2.set(s.b.x - s.a.x + wob * (4 - 8 * g), (s.b.y - s.a.y) - s.sag * (4 - 8 * g), s.b.z - s.a.z + s.sag * 0.5 * (4 - 8 * g)).normalize();
        // the ring's frame, carried along from the last ring (so the tube never twists and pinches)
        if (u === 0) V1.crossVectors(V2, Math.abs(V2.x) < 0.9 ? X : Z);
        else { V1.copy(SC); V1.addScaledVector(V2, -V1.dot(V2)); if (V1.lengthSq() < 1e-8) V1.crossVectors(V2, Math.abs(V2.x) < 0.9 ? X : Z); }
        V1.normalize(); SC.copy(V1);
        V3.crossVectors(V2, V1);
        for (let j = 0; j < SS; j++) {
          const a = (j / SS) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), q = base + (u * SS + j) * 3;
          const nx = V1.x * ca + V3.x * sa, ny = V1.y * ca + V3.y * sa, nz = V1.z * ca + V3.z * sa;
          sPos[q] = cx + nx * r; sPos[q + 1] = cy + ny * r; sPos[q + 2] = cz + nz * r;
          sNrm[q] = nx; sNrm[q + 1] = ny; sNrm[q + 2] = nz;
        }
      }
    }
    strings.visible = any;
    if (any) { sGeo.attributes.position.needsUpdate = true; sGeo.attributes.normal.needsUpdate = true; }
  }

  function stepDrops(dt) {
    let n = 0;
    for (const d of D) {
      if (!d.on) continue;
      d.age += dt;
      const py = d.p.y;
      d.v.y -= G * dt;
      d.v.multiplyScalar(1 - 0.12 * dt);
      d.p.addScaledVector(d.v, dt);
      const ax = Math.abs(d.p.x), az = Math.abs(d.p.z), sp = d.v.length();
      if (ax < OX && az < OZ) { if (d.p.y < -0.03) { d.on = false; continue; } } // into the dark
      else if (ax < UX && az < UZ && d.p.y < d.r * 0.4 && py >= -0.05) { // on the rim
        d.on = false;
        if (d.kind === 0) splash(d.p.x, 0, d.p.z, d.r * 0.8, sp, true);
        continue;
      } else if (ax < 0.48 && az < 0.44 && d.p.y < -0.09) { d.on = false; continue; } // against the body
      if (d.p.y < FLOOR + d.r * 0.3) {
        d.on = false;
        if (d.kind === 0) splash(d.p.x, FLOOR, d.p.z, d.r, sp, false);
        else if (rng() < 0.5) puddle(d.p.x, FLOOR, d.p.z, d.r * 2.6, 0.6 + rng() * 0.4); // a droplet from a splash: a speck
        continue;
      }
      // round when slow; fast, it stretches into a teardrop, its tail trailing (the shader keeps the head round)
      if (sp > 1e-4) V1.copy(d.v).multiplyScalar(-1 / sp); else V1.copy(UP);
      Q.setFromUnitVectors(UP, V1);
      const st = 1 + Math.min(0.55, Math.max(0, sp - 1.6) * 0.12);
      SC.set(d.r / Math.sqrt(st), d.r * st, d.r / Math.sqrt(st));
      M4.compose(d.p, Q, SC);
      drops.setMatrixAt(n++, M4);
    }
    drops.count = n;
    drops.instanceMatrix.needsUpdate = true;
  }

  function stepSplashes(dt) {
    const fadeC = crowns.geometry.attributes.aFade, fadeP = puddles.geometry.attributes.aFade;
    let n = 0;
    for (const c of C) {
      if (!c.on) continue;
      c.t += dt;
      const u = c.t / c.life;
      if (u >= 1) { c.on = false; continue; }
      const rise = u < 0.3 ? 1 - Math.pow(1 - u / 0.3, 3) : 1 - Math.pow((u - 0.3) / 0.7, 2);
      const spread = 0.5 + 0.7 * (1 - Math.pow(1 - u, 3));
      Q.setFromAxisAngle(UP, c.rot);
      M4.compose(c.p, Q, SC.set(c.R * spread, Math.max(0.001, c.H * rise), c.R * spread));
      crowns.setMatrixAt(n, M4);
      fadeC.array[n++] = u < 0.5 ? 1 : 1 - (u - 0.5) / 0.5;
    }
    crowns.count = n;
    crowns.instanceMatrix.needsUpdate = true; fadeC.needsUpdate = true;
    n = 0;
    for (const p of PD) {
      if (!p.on) continue;
      p.t += dt;
      const u = p.t / p.life;
      if (u >= 1) { p.on = false; continue; }
      const grow = p.t < 0.16 ? backOut(p.t / 0.16) : 1;
      const s = p.R * grow * (1 - 0.25 * Math.max(0, (u - 0.5) / 0.5));
      Q.setFromAxisAngle(UP, p.rot);
      M4.compose(p.p, Q, SC.set(s, s * 0.2, s));
      puddles.setMatrixAt(n, M4);
      fadeP.array[n++] = u < 0.45 ? 1 : 1 - smooth(0.45, 1, u);
    }
    puddles.count = n;
    puddles.instanceMatrix.needsUpdate = true; fadeP.needsUpdate = true;
  }

  function update(dt) {
    dt = Math.min(Math.max(+dt || 0, 0), 0.05);
    clock += dt;
    if (pendingWarm && mesh) warm(...pendingWarm);
    if (Lk) {
      if (!Lk.waiting) stepLick(dt);
      else if (mesh) start(Lk);
      else if (failed || disposed || (Lk.waitT += dt) > O.wait) { const l = Lk; Lk = null; l.resolve(); }
    }
    stepStrings(dt);
    stepDrops(dt);
    stepSplashes(dt);
  }

  // Compile every program it needs now (the tongue's physical material, skinned, with its maps; the liquid shaders
  // with instancing; the shadow pass; the env's PMREM) by rendering one frame with all its pieces present but too
  // small to see; then run the lick's code once, silently.
  function warm(renderer, camera) {
    if (!mesh) { pendingWarm = [renderer, camera]; return; }
    pendingWarm = null;
    let root = object3d; while (root.parent) root = root.parent;
    let fxRoot = fx; while (fxRoot.parent) fxRoot = fxRoot.parent;
    const inst = [drops, crowns, puddles], counts = inst.map((m) => m.count);
    const was = [mesh.visible, strings.visible];
    mesh.visible = true; strings.visible = true; rig.scale.setScalar(1e-6);
    M4.makeScale(1e-6, 1e-6, 1e-6);
    for (const m of inst) { m.setMatrixAt(0, M4); m.count = Math.max(1, m.count); m.instanceMatrix.needsUpdate = true; }
    try {
      for (const k of ['map', 'normalMap', 'roughnessMap']) if (mat[k]) renderer.initTexture?.(mat[k]);
      renderer.compile(root, camera);
      if (fxRoot !== root) renderer.compile(fxRoot, camera);
      if (root.isScene) renderer.render(root, camera);
    } finally {
      mesh.visible = was[0]; strings.visible = was[1]; rig.scale.setScalar(1);
      inst.forEach((m, k) => { m.count = counts[k]; });
    }
    if (!Lk) {
      const keep = [seedState, phase, clock, lastSplat];
      silent = true;
      try { lick(); for (let k = 0; k < 40; k++) update(1 / 30); } finally {
        stop(); silent = false;
        [seedState, phase, clock, lastSplat] = keep;
      }
    }
  }

  function clearFx() {
    for (const pool of [D, C, PD, STR]) for (const o of pool) o.on = false;
    drops.count = crowns.count = puddles.count = 0;
    sPos.fill(0);
    strings.visible = false;
  }
  function stop() {
    if (Lk) { const l = Lk; Lk = null; l.resolve(); }
    if (mesh) mesh.visible = false;
    clearFx();
  }
  function dispose() {
    stop();
    disposed = true;
    object3d.removeFromParent();
    fx.removeFromParent();
    for (const o of owned) o.dispose?.();
  }

  const api = {
    object3d, fx, ready, lick, update, warm, stop, dispose,
    get busy() { return !!Lk; },
    // for the lab: the chain (object3d space) and the pose at a given time, without the drips
    debug: {
      get mesh() { return mesh; }, get pos() { return pos; }, get rot() { return rot; }, get NJ() { return NJ; },
      get hw() { return hw; }, get hh() { return hh; }, get bones() { return chainBones; }, par, flags: dbg,
      resolve() { if (mesh) solve(); },
      poseAt(t, set = {}) {
        if (!mesh) return;
        evalPose(t);
        for (const k in set) { if (k === 'root') par.root.set(...set.root); else par[k] = set[k]; }
        targets(); settle(); solve();
      },
    },
  };
  return api;
}

// ------------------------------------------------------------------------------------------------ shapes, helpers
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const backOut = (t) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);

// One track per number (three for root) from the rows that key it.
function buildTracks(rows) {
  const tracks = {};
  for (const k of Object.keys(rows[0][1])) {
    const keys = rows.filter(([, p]) => k in p).map(([t, p]) => [t, p[k]]);
    tracks[k] = Array.isArray(keys[0][1]) ? [0, 1, 2].map((c) => track(keys.map(([t, v]) => [t, v[c]]))) : track(keys);
  }
  return tracks;
}

// Hermite through the keys; flat at a key that is a peak or a valley.
function track(keys) {
  const n = keys.length, m = new Float32Array(n);
  for (let k = 1; k < n - 1; k++) {
    const a = keys[k - 1][1], b = keys[k][1], c = keys[k + 1][1];
    m[k] = (b - a) * (c - b) <= 0 ? 0 : (c - a) / (keys[k + 1][0] - keys[k - 1][0]);
  }
  return (t) => {
    if (t <= keys[0][0]) return keys[0][1];
    if (t >= keys[n - 1][0]) return keys[n - 1][1];
    let k = 0;
    while (t > keys[k + 1][0]) k++;
    const [t0, v0] = keys[k], [t1, v1] = keys[k + 1], h = t1 - t0, u = (t - t0) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * v0 + (u3 - 2 * u2 + u) * h * m[k] + (-2 * u3 + 3 * u2) * v1 + (u3 - u2) * h * m[k + 1];
  };
}

// A splash crown: a thin jagged open cup (tall and short points by turns), unit radius and height.
function crownGeometry(THREE) {
  const n = 8, pos = [];
  const top = (k) => { const a = (k / (2 * n)) * Math.PI * 2, tall = k % 2 === 0, r = tall ? 1.08 : 0.9; return [Math.cos(a) * r, tall ? 1 : 0.38, Math.sin(a) * r]; };
  const bot = (k) => { const a = (k / (2 * n)) * Math.PI * 2; return [Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5]; };
  for (let k = 0; k < 2 * n; k++) {
    const a = bot(k), b = bot(k + 1), c = top(k + 1), d = top(k);
    pos.push(...a, ...b, ...c, ...a, ...c, ...d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

// A puddle: an irregular flat blob (unit radius) and a few satellite splats; aEdge runs 0 at the centre to 1 at the
// edge (the shader draws the outline and the highlight from it).
function puddleGeometry(THREE, rng) {
  const pos = [], edge = [];
  const blob = (cx, cz, r, n, h) => {
    const rim = [];
    for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2 + rng() * 0.2, rr = r * (0.88 + rng() * 0.2 + 0.08 * Math.sin(a * 3)); rim.push([cx + Math.cos(a) * rr, 0, cz + Math.sin(a) * rr]); }
    const mid = rim.map(([x, , z]) => [cx + (x - cx) * 0.62, h * 0.8, cz + (z - cz) * 0.62]);
    for (let k = 0; k < n; k++) {
      const a = rim[k], b = rim[(k + 1) % n], c = mid[(k + 1) % n], d = mid[k];
      pos.push(...a, ...c, ...b, ...a, ...d, ...c, ...d, cx, h, cz, ...c);
      edge.push(1, 0.62, 1, 1, 0.62, 0.62, 0.62, 0, 0.62);
    }
  };
  blob(0, 0, 1, 16, 0.3);
  for (let k = 0; k < 3; k++) { const a = rng() * 6.28, d = 1.25 + rng() * 0.35; blob(Math.cos(a) * d, Math.sin(a) * d, 0.15 + rng() * 0.1, 9, 0.25); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aEdge', new THREE.Float32BufferAttribute(edge, 1));
  g.computeVertexNormals();
  return g;
}

// The cartoon liquid. DROP: the trailing half stretches into a tail as the instance is stretched (round when slow).
// FADE: a per-instance fade. CROWN: whiter, thicker points. PUDDLE: flat; outline and a highlight crescent from aEdge.
const LIQ_VS = `
#include <common>
varying vec3 vN;
varying vec3 vV;
varying float vH;
#ifdef FADE
attribute float aFade;
varying float vFade;
#endif
#ifdef PUDDLE
attribute float aEdge;
varying float vEdge;
varying vec2 vRel;
#endif
void main() {
  vec3 p = position;
  mat4 im = mat4(1.0);
  #ifdef USE_INSTANCING
  im = instanceMatrix;
  #endif
  vec3 sc = max(vec3(length(im[0].xyz), length(im[1].xyz), length(im[2].xyz)), vec3(1e-6));
  #ifdef DROP
  float st = sc.y / sc.x;
  if (p.y > 0.0) p.y *= 1.0 + 2.4 * (st - 1.0);
  #endif
  vH = position.y;
  vec4 wp = modelMatrix * im * vec4(p, 1.0);
  vec3 n = mat3(modelMatrix) * (mat3(im) * (normal / (sc * sc)));
  #ifdef PUDDLE
  vEdge = aEdge;
  vRel = wp.xz - (modelMatrix * im * vec4(0.0, 0.0, 0.0, 1.0)).xz;
  #endif
  #ifdef FADE
  vFade = aFade;
  #endif
  vec4 mv = viewMatrix * wp;
  vN = normalize(mat3(viewMatrix) * n);
  vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;
const LIQ_FS = `
uniform vec3 uTint;
uniform vec3 uEdge;
uniform float uAlpha;
uniform float uEdgeAlpha;
varying vec3 vN;
varying vec3 vV;
varying float vH;
#ifdef FADE
varying float vFade;
#endif
#ifdef PUDDLE
varying float vEdge;
varying vec2 vRel;
#endif
void main() {
  vec3 col = uTint;
  float a = uAlpha;
  #ifdef PUDDLE
    float side = dot(normalize(vRel + vec2(1e-6)), vec2(-0.45, -0.89));
    float band = smoothstep(0.5, 0.64, vEdge) * (1.0 - smoothstep(0.72, 0.82, vEdge));
    float hl = band * smoothstep(0.1, 0.7, side);
    float ol = smoothstep(0.78, 0.95, vEdge);
    col = mix(col, uEdge, ol); a = mix(a, uEdgeAlpha, ol);
    col = mix(col, vec3(1.0), hl); a = max(a, hl * 0.95);
  #else
    vec3 v = normalize(vV);
    vec3 n = normalize(vN);
    if (!gl_FrontFacing) n = -n;
    float rim = 1.0 - abs(dot(n, v));
    float ed = smoothstep(0.45, 0.8, rim);
    #ifdef CROWN
      float tipW = smoothstep(0.45, 1.0, vH);
      ed *= 0.75;
      col = mix(col, vec3(1.0), tipW * 0.55); a = mix(a, 0.9, tipW);
    #endif
    col = mix(col, uEdge, ed); a = mix(a, uEdgeAlpha, ed);
    float spec = max(dot(n, normalize(normalize(vec3(-0.5, 0.75, 0.6)) + v)), 0.0);
    float dotH = smoothstep(0.93, 0.96, spec);
    float bounce = smoothstep(0.75, 0.9, max(dot(n, normalize(vec3(0.55, -0.6, 0.6))), 0.0)) * 0.45 * (1.0 - ed);
    col = mix(col, vec3(1.0), max(dotH, bounce));
    a = max(a, max(dotH, bounce * 0.8));
  #endif
  #ifdef FADE
    a *= vFade;
  #endif
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
function liquidMaterial(THREE, { tint, edge, alpha, edgeAlpha, defines = {}, side = THREE.FrontSide }) {
  return new THREE.ShaderMaterial({
    defines,
    uniforms: { uTint: { value: new THREE.Color(tint) }, uEdge: { value: new THREE.Color(edge) }, uAlpha: { value: alpha }, uEdgeAlpha: { value: edgeAlpha } },
    vertexShader: LIQ_VS, fragmentShader: LIQ_FS,
    transparent: true, depthWrite: false, side,
  });
}

// A studio for the tongue's wet coat to reflect: dark surroundings (so the coat never lays a grey veil over the flesh)
// and a few bright soft boxes (HDR) for crisp highlights. An equirect texture; the renderer turns it into a PMREM on
// first use.
function makeEnv(THREE) {
  const W = 256, H = 128, data = new Uint16Array(W * H * 4), toH = THREE.DataUtils.toHalfFloat;
  const boxes = [
    // direction, half size (rad) across / up, intensity
    [[-0.36, 0.8, 0.5], 0.26, 0.2, 26],   // key: where the sun is
    [[0.7, 0.35, 0.6], 0.04, 0.4, 5],     // a tall strip front-right: a streak down the tongue's side
    [[0, 1, 0.05], 0.35, 0.35, 5],        // overhead
    [[-0.1, 0.2, -1], 0.6, 0.06, 4],      // a thin strip behind: the rims
    [[-0.15, 0.3, 1], 0.08, 0.05, 30],    // a small hard light by the player: a glint on whatever faces them
  ].map(([d, w, h, i]) => {
    const c = new THREE.Vector3(...d).normalize();
    const r = new THREE.Vector3().crossVectors(c, Math.abs(c.y) > 0.95 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0)).normalize();
    const u = new THREE.Vector3().crossVectors(r, c);
    return { c, r, u, w, h, i };
  });
  const d = new THREE.Vector3();
  for (let v = 0; v < H; v++) {
    const phi = ((v + 0.5) / H - 0.5) * Math.PI, cp = Math.cos(phi), sp = Math.sin(phi);
    for (let u = 0; u < W; u++) {
      const th = ((u + 0.5) / W - 0.5) * Math.PI * 2;
      d.set(Math.cos(th) * cp, sp, Math.sin(th) * cp);
      let Lv = 0.05 + 0.04 * Math.max(0, d.y) + 0.05 * smooth(-0.2, -0.9, d.y); // dark walls, the white floor a little
      for (const b of boxes) {
        const f = d.dot(b.c);
        if (f <= 0.1) continue;
        const ax = Math.abs(Math.atan2(d.dot(b.r), f)), ay = Math.abs(Math.atan2(d.dot(b.u), f));
        Lv += b.i * (1 - smooth(b.w * 0.7, b.w, ax)) * (1 - smooth(b.h * 0.7, b.h, ay));
      }
      const k = (v * W + u) * 4, hv = toH(Lv);
      data[k] = hv; data[k + 1] = hv; data[k + 2] = hv; data[k + 3] = toH(1);
    }
  }
  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.HalfFloatType);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.LinearSRGBColorSpace;
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}
