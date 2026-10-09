// The monster's tongue, for the sbhmn.com intro (assets/intro.js). The paper goes in and a BIG, wet, low-poly
// cartoon tongue shoots out of the bin's opening along a big arch, reaches for the player, SLAPS down over the front
// rim (the lips) and hangs down the bin's front, drags along the lip, swings out to the right like a pendulum and
// flicks up, then a greedy rainbow lick up, over and down the left corner, and it is SLURPED back in along its own
// length like a noodle. Saliva flies off it on the fast moves, falls with gravity and splashes: a see-through crown,
// droplets and a puddle that dries away. Strings of spit stretch between the tongue and the rim and snap.
// All procedural (no assets): a wide, flat, spatulate tube (narrow at the lips, broad and half-round at the end) with
// a soft groove down the middle that fades out on the end, rebuilt every frame along a spine. The spine is directed
// like a puppet: the tip follows a keyframed path, the body is a curve from the root whose handles lag on springs
// (follow-through and overshoot), plus a tip curl, a wave running root to tip, squash and stretch, a slide (in and
// out along its own length) and the rim it lies over and can't go through. Faceted flesh (flat shaded) under a smooth
// wet clear coat, so long wet streaks run across the facets.
//
//   import { createTongue } from '/assets/intro/tongue.js';
//   const tongue = createTongue(THREE, { fxParent: scene });   // fxParent: see "Where the drips live"
//   bin.add(tongue.object3d);                    // a parent with no rotation/scale of its own
//   tongue.object3d.position.set(0, 0.78, 0);    // the centre of the opening, on the rim plane
//   tongue.warm(renderer, camera);               // once, after it is in the scene (see warm below)
//   // every frame, always (the drips and splashes outlive the lick by up to ~3 s):
//   tongue.update(dt);                           // dt in seconds
//   // in scored(), with the lid still open (as during the throw):
//   await tongue.lick({ spread: Math.min(1, 0.55 + 0.45 * camera.aspect) });   // 1.4 s at speed 1
//   // ...then slam the lid at once: lick() resolves when the tongue is back inside AND no drop is left in the air
//   // over the opening (any still there is removed then), so the closing lid passes through nothing.
//
// Coordinates: bin units (1 unit ~ the bin's height). object3d's local origin is the centre of the opening on the
// rim plane, +y up, +z toward the camera (the bin's front). The floor is at local y = -rimY. The tongue is rooted
// ~0.3 down inside the opening; inside the opening, below the rim, it is drawn fading to black (the dark in the bin),
// what is pulled in behind the root thins to nothing, and it never goes lower than ~0.47 below the rim (it can't
// poke out under the bin). Measured reach of what shows (both mirror sides): x -1.04 .. 1.03 (spread 1; 0.85 at
// spread 0.76), up to 0.89 above the rim (just under the top of the open lid), down to 0.62 below it on the bin's
// front, z -0.22 .. 1.54 (toward the camera).
// It is staged for the throw view (camera ~(0, 1.75, 3.7) -> (0, 0.5, 0), fov 40, where the lick happens): its reach
// fills about a third of the screen and the top of the tongue faces the player in every big pose. In the intro's
// front view (fov 18) its tallest beats leave the top of the frame; don't lick there.
// It needs the lid open (pitch -1.9, as during the throw) or lifted: its neck rises through the opening and leans
// back to z -0.22 above the rim (the open lid starts at z -0.5). Spit never flies back toward the lid.
// The beats (speed 1): 0.04 the tip pokes over the front lip and ducks, 0.24 ERUPTS along a big arch, 0.4-0.5
// reaches for the player, 0.58 SLAPS down over the front rim and hangs down the front, 0.66-0.8 drags right along
// the lip, 0.86 swings out right, 0.91 flicks up, 0.97-1.19 the greedy rainbow lick over to the left corner, 1.22
// SLURP (sucked in along its own length), 1.4 gone.
//
// createTongue(THREE, opts):
//   rimY     0.78              height of the rim above the floor (drips splash on the floor at local y = -rimY)
//   open     [0.439, 0.395]    half size (x, z) of the opening   outer [0.554, 0.5]  half size of the rim's outside
//   seed     7                 the same seed and the same dt steps give the same frames (warm() doesn't change them)
//   shadows  true              the tongue and the drops cast shadows
//   fxParent null              where the drips live (see below); null: inside object3d
//   onCue    (name, info) => {} for sounds or a shake (times at speed 1):
//                              'peek' 0.04, 'erupt' 0.24, 'slap' 0.58 (the frame it lands on the rim: a wet thump and
//                              shake ~0.03), 'flick' 0.91 and 1.19, 'slurp' 1.22, 'snap' (a string of spit breaks, ~1-2
//                              a lick), 'splat' { x, y, z, size } (fx space) when a drop lands: throttled here to at
//                              most one per 60 ms (~15-18 a lick), fine to map to a quiet random drip sound as is.
//                              Errors thrown by the hook are swallowed.
// returns {
//   object3d,                  the tongue (and, by default, the drips)
//   fx,                        the group holding the drops, crowns, puddles and strings
//   lick({ speed = 1, mirror = false, spread = 1 }) => Promise
//                              speed: playback rate. mirror: left and right swapped. spread: how far it reaches to the
//                              sides (0.5-1.2): 1 for landscape; on a portrait phone ~0.76 keeps it in frame (the
//                              formula above). Called while busy: returns the running lick's promise, ignoring options.
//   update(dt),                dt clamped to 0.05; frame-rate independent (stable at 20 fps)
//   warm(renderer, camera),    call once after object3d (and fx) are in the scene, e.g. while the intro sets up:
//                              compiles every shader it uses, makes the env's PMREM and the shadow-pass variants by
//                              rendering one frame with its pieces present but empty (renderer.render of the scene),
//                              and runs the lick's code once silently (no cues, state restored). Without it the first
//                              lick frame stalls (~60-140 ms on a desktop at 4x CPU throttle; with it: a normal frame).
//   stop(),                    for a Skip button: the tongue goes, every drip goes, the running lick's promise resolves
//   dispose(),                 stop() + removes object3d and fx from their parents and frees its GPU resources
//   busy                       (getter) true while licking
// }
// Where the drips live: they are simulated in fx's local space, which matches object3d's at the start of each lick.
// By default fx is a child of object3d. The intro rocks the bin a few seconds later (rattle), while puddles may still
// be drying (up to ~3 s), so pass opts.fxParent = scene: fx is then added to the scene and placed at object3d's world
// transform at each lick() start, and the drips stay put when the bin moves. Puddles on the rim are covered by the
// closing lid and dry under it.
// Budget: 1056 triangles for the tongue (one draw call, MeshPhysicalMaterial with clear coat) + one draw call each
// for drops, crowns, puddles, strings and foam bubbles (instanced, a small custom unlit liquid shader; ~10k triangles
// at the busiest moment, mostly tiny drops) + the shadow pass for the tongue and drops. No textures but a 256x128
// studio env made here. Per frame: a 33-ring spine and up to 72 drops: ~0.5 ms of JS at 4x CPU throttle.

// The cross-section: x across (edge to edge), y up through the top. The top is flat-ish with a soft wide groove
// (GW: how much each point sinks into it); the underside is rounder.
const PROF = [
  [1, 0], [0.9, 0.5], [0.68, 0.84], [0.4, 0.98], [0.16, 1], [0, 1], [-0.16, 1], [-0.4, 0.98], [-0.68, 0.84], [-0.9, 0.5],
  [-1, 0], [-0.88, -0.5], [-0.5, -0.86], [0, -0.95], [0.5, -0.86], [0.88, -0.5],
];
const GW = [0, 0, 0.05, 0.4, 0.86, 1, 0.86, 0.4, 0.05, 0, 0, 0, 0, 0, 0, 0];
const LEFT = 10, UNDER = 13; // the left edge, the middle of the underside
const T_END = 1.4;
const W0 = 0.3, H0 = 0.104; // widest half-width (near the tip: spatulate) and the thickness at the root

// The lick, keyframed (seconds; Hermite, flat at the peaks, so every overshoot is drawn on purpose).
// tip/tipDir: where the tip is and which way it points. root/rootDir: the base, inside the opening. h0/h1: how far
// the body's curve leaves the root / arrives at the tip (x the root-tip distance). curl: the tip end rolls toward
// its top (+) or its underside (-), radians. twist: roll along the length. wave/waveB: a wave running to the tip
// (up-down / sideways), units. wide: extra width (squash and stretch). hz: how fast the tip catches its key.
// slide: how much of it is pulled back inside along its own length. yaw: the roll of its top at the root (0: the top
// faces the back, the upper jaw); yawAuto: how much the top turns to the outside of its arc by itself. spat: how
// spatulate it is. body/damp: the body springs' rate and damping.
const KEYS = {
  root: [[0, [0, -0.36, 0]], [0.21, [0, -0.32, 0]], [0.3, [0, -0.3, 0.02]], [0.58, [0, -0.3, 0.06]], [1.2, [0, -0.32, 0.06]], [1.4, [0, -0.36, 0.04]]],
  rootDir: [[0, [0, 1, 0.4]], [0.21, [0, 1, 0.12]], [0.3, [0, 1, 0.12]], [0.58, [0, 1, 0.75]], [0.88, [0, 1, 0.7]], [1.0, [0, 1, 0.45]], [1.2, [0, 1, 0.4]], [1.4, [0, 1, 0.3]]],
  tip: [
    [0, [-0.06, 0.06, 0.46]],
    [0.13, [-0.1, 0.1, 0.5]],      // a peek: the tip pokes out over the front lip, tasting
    [0.2, [-0.3, 0.34, 0.9]],      // (inside, it lines up the shot)
    [0.3, [-0.4, 0.3, 1.04]],      // ERUPTS: it shoots out along a big arch, up and over toward the player,
    [0.4, [-0.42, 0.2, 1.4]],      // and reaches for the player
    [0.47, [-0.34, 0.16, 1.46]],   // (wags)
    [0.6, [-0.22, -0.58, 0.64]],   // SLAPS down over the front rim
    [0.67, [-0.14, -0.66, 0.63]],  // hangs down the front
    [0.8, [0.4, -0.62, 0.63]],     // drags right along the lip
    [0.86, [0.86, -0.3, 0.68]],    // swings out to the right like a pendulum,
    [0.92, [0.86, 0.3, 0.68]],     // up the right side, tip first (a flick)
    [1.0, [0.46, 0.68, 0.76]],     // the greedy lick: a big rainbow, up and over,
    [1.07, [-0.24, 0.72, 0.84]],   // across the top
    [1.13, [-0.72, 0.26, 0.76]],
    [1.19, [-0.82, -0.1, 0.62]],   // and down over the left corner, then SLURP: sucked back in along its own length
    [1.4, [-0.7, -0.04, 0.56]],
  ],
  tipDir: [
    [0, [-0.3, -0.2, 1]], [0.13, [-0.35, -0.3, 1]], [0.2, [-0.3, -0.7, 0.65]],
    [0.3, [-0.3, -0.7, 0.65]], [0.4, [-0.2, -0.75, 0.62]], [0.47, [-0.05, -0.85, 0.55]],
    [0.6, [-0.2, -1, 0.05]], [0.67, [-0.08, -1, 0]], [0.8, [0.35, -1, 0]], [0.86, [1, -0.3, 0]], [0.92, [0.3, 1, 0]],
    [1.0, [-0.55, 0.75, 0.2]], [1.07, [-1, 0.05, 0.15]], [1.13, [-0.65, -0.75, 0.05]], [1.19, [-0.3, -1, 0.05]], [1.4, [-0.3, -1, 0.05]],
  ],
  h0: [[0, 0.7], [0.2, 0.75], [0.4, 0.75], [0.58, 0.75], [0.84, 0.75], [0.99, 0.8], [1.17, 0.9], [1.4, 0.9]],
  h1: [[0, 0.4], [0.2, 0.55], [0.4, 0.5], [0.58, 0.9], [0.84, 0.85], [0.95, 0.5], [1.17, 0.55], [1.4, 0.55]],
  // how much of it is pulled back inside, along its own length (1: all of it)
  slide: [[0, 1], [0.06, 0.62], [0.13, 0.58], [0.19, 0.95], [0.22, 0.92], [0.25, 0.42], [0.3, 0], [1.2, 0], [1.3, 0.3], [1.38, 1], [1.4, 1]],
  curl: [[0, 0.4], [0.13, 0.5], [0.2, 0.1], [0.3, 0.2], [0.4, 0.35], [0.47, 0.15], [0.6, 0.1], [0.67, 0.05], [0.8, 0.05], [0.86, 0.15], [0.92, 0.3], [1.0, 0.2], [1.07, 0.2], [1.13, 0.25], [1.19, 0.4], [1.24, 0.15], [1.29, 0], [1.4, 0]],
  twist: [[0, 0], [0.4, 0], [0.6, 0], [0.8, 0.05], [0.99, 0.1], [1.17, -0.1], [1.4, 0]],
  yaw: [[0, 0], [0.92, 0], [0.97, 3.14], [1.4, 3.14]], // for the rainbow the top turns to face the player all along
  // how much the top turns to the outside of its arc (see evalPose)
  yawAuto: [[0, 1], [0.5, 1], [0.6, 0], [1.4, 0]],
  wave: [[0, 0.01], [0.3, 0.03], [0.47, 0.05], [0.56, 0.014], [0.84, 0.014], [0.92, 0.04], [1.08, 0.035], [1.26, 0.05], [1.4, 0.02]],
  waveB: [[0, 0], [0.3, 0.01], [0.47, 0.012], [0.6, 0.006], [0.84, 0.006], [1.08, 0.008], [1.26, 0.012], [1.4, 0.006]], // a wide flat tongue barely bends sideways
  wide: [[0, 0.9], [0.2, 0.9], [0.26, 0.82], [0.36, 0.95], [0.47, 1.0], [0.6, 1.1], [0.67, 1.0], [0.8, 0.94], [0.9, 1.0], [1.17, 1.0], [1.26, 0.9], [1.4, 0.82]],
  hz: [[0, 8.5], [1.4, 8.5]],
  // how spatulate it is (narrow at the lips, broad at the end): less while it turns over into the rainbow
  spat: [[0, 1], [0.9, 1], [0.95, 0.35], [1.06, 0.45], [1.14, 0.9], [1.4, 1]],
  // the body's springs: how fast it follows (x its normal rate) and how much it overshoots (damping)
  body: [[0, 1], [0.5, 1], [0.58, 1.7], [0.8, 1.5], [0.9, 1], [1.4, 1]],
  damp: [[0, 0.5], [0.52, 0.5], [0.58, 0.8], [0.8, 0.75], [0.88, 0.5], [1.4, 0.5]],
};
const SLAP_T = 0.58; // the frame it lands on the rim (measured: first contact 0.583 at 60 fps)
// Moments: cues for sound, and handfuls of spit flung from the tip or sprayed from the mouth.
const CUES = [[0.04, 'peek'], [0.24, 'erupt'], [SLAP_T, 'slap'], [0.91, 'flick'], [1.19, 'flick'], [1.22, 'slurp']];
const BURSTS = [[0.3, 'tip', 5], [0.44, 'tip', 4], [SLAP_T, 'slap', 12], [0.91, 'tip', 6], [1.0, 'tip', 4], [1.18, 'tip', 5], [1.26, 'mouth', 6]];

export function createTongue(THREE, opts = {}) {
  const O = Object.assign({ rimY: 0.78, open: [0.439, 0.395], outer: [0.554, 0.5], seed: 7, shadows: true, onCue: null, fxParent: null }, opts);
  const [OX, OZ] = O.open, [UX, UZ] = O.outer, FLOOR = -O.rimY, G = 9.8;
  const DEEP = -Math.min(0.47, O.rimY * 0.6); // the lowest the tongue goes inside the bin (it never pokes out underneath)
  const LIP = 0.07; // the rim's outer top edge, rounded
  let seedState = O.seed | 0;
  const rng = () => { // mulberry32, its state kept here so warm() can put it back
    seedState = (seedState + 0x6d2b79f5) | 0;
    let t = Math.imul(seedState ^ (seedState >>> 15), 1 | seedState);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let silent = false;
  const rnd = (a = 0, b = 1) => a + (b - a) * rng();
  let clock = 0, lastSplat = -1;
  const cue = (name, info) => {
    if (silent) return;
    if (name === 'splat') { if (clock - lastSplat < 0.06) return; lastSplat = clock; }
    try { O.onCue?.(name, info); } catch (e) { /* a sound hook must never stop the show */ }
  };
  const tracks = {};
  for (const k in KEYS) {
    const keys = KEYS[k];
    tracks[k] = Array.isArray(keys[0][1]) ? [0, 1, 2].map((c) => track(keys.map(([t, v]) => [t, v[c]]))) : track(keys);
  }

  const object3d = new THREE.Group();
  object3d.name = 'tongue';
  const fx = new THREE.Group();
  fx.name = 'tongue-fx';
  (O.fxParent || object3d).add(fx);
  const env = makeEnv(THREE);
  const owned = [env];

  // ---------------------------------------------------------------- the tongue mesh: 24 body rings + 9 round the tip
  const RB = 24, RT = 9, R = RB + RT, S = PROF.length, NG = R * S + 2, TIP = R * S, ROOT = R * S + 1;
  const sR = new Float32Array(R), roundF = new Float32Array(R); // each ring: where along the length, how round
  const grid = new Float32Array(NG * 3), gN = new Float32Array(NG * 3);
  const tri = [], triRing = [], triSeg = [];
  for (let i = 0; i < R - 1; i++) {
    for (let j = 0; j < S; j++) {
      const a = i * S + j, b = (i + 1) * S + j, c = i * S + (j + 1) % S, d = (i + 1) * S + (j + 1) % S;
      tri.push(a, b, c, c, b, d); triRing.push(i, i); triSeg.push(j, j);
    }
  }
  for (let j = 0; j < S; j++) { tri.push((R - 1) * S + j, TIP, (R - 1) * S + (j + 1) % S); triRing.push(R - 1); triSeg.push(j); }
  for (let j = 0; j < S; j++) { tri.push((j + 1) % S, ROOT, j); triRing.push(0); triSeg.push(j); }
  const NT = tri.length / 3;
  const tPos = new Float32Array(NT * 9), tNrm = new Float32Array(NT * 9), tCol = new Float32Array(NT * 9);
  {
    const c = (hex) => new THREE.Color(hex);
    const top = c(0x740b14), groove = c(0x4f070d), edge = c(0x8c1822), tipC = c(0x99222d), under = c(0x8a2833), underMid = c(0x6a1620);
    const col = new THREE.Color();
    const shade = new Float32Array(R * S);
    for (let i = 0; i < R * S; i++) shade[i] = rng();
    for (let i = 1; i < R; i++) for (let j = 0; j < S; j++) shade[i * S + j] = 0.6 * shade[i * S + j] + 0.4 * shade[(i - 1) * S + j]; // soft along the length
    for (let k = 0; k < NT; k++) {
      const j = triSeg[k], i = triRing[k], along = i >= RB ? 0.87 + 0.13 * (i - RB) / (RT - 1) : 0.86 * Math.pow(i / RB, 0.92); // ~ where along
      const tipness = smooth(0.66, 0.94, along);
      if (j >= 4 && j <= 5) col.copy(groove).lerp(top, smooth(0.8, 0.92, along)).lerp(tipC, 0.75 * tipness); // fades out on the spatulate end
      else if (j === 0 || j === 9) col.copy(edge).lerp(tipC, tipness);
      else if (j < 10) col.copy(top).lerp(tipC, 0.75 * tipness);
      else if (j === 12 || j === 13) col.copy(underMid).lerp(under, 0.5 * tipness);
      else col.copy(under);
      const f = 0.95 + 0.1 * shade[i * S + j]; // hand-made: every quad a touch different
      for (let v = 0; v < 3; v++) { tCol[k * 9 + v * 3] = col.r * f; tCol[k * 9 + v * 3 + 1] = col.g * f; tCol[k * 9 + v * 3 + 2] = col.b * f; }
    }
  }
  const tGeo = new THREE.BufferGeometry();
  tGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3).setUsage(THREE.DynamicDrawUsage));
  tGeo.setAttribute('normal', new THREE.BufferAttribute(tNrm, 3).setUsage(THREE.DynamicDrawUsage)); // smooth: for the coat
  tGeo.setAttribute('color', new THREE.BufferAttribute(tCol, 3));
  // Faceted flesh (flat shaded, a soft sheen) under a smooth wet coat: the coat reads the smooth normals, so its
  // highlights run along the tongue as long streaks across the facets instead of lighting facets one by one.
  const tMat = new THREE.MeshPhysicalMaterial({
    vertexColors: true, flatShading: true, roughness: 0.55, metalness: 0, specularIntensity: 0.12,
    clearcoat: 1, clearcoatRoughness: 0.14, envMap: env, envMapIntensity: 1,
  });
  tMat.onBeforeCompile = (sh) => {
    sh.uniforms.uHole = { value: new THREE.Vector2(OX, OZ) };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vObj;\nvarying vec3 vCoatN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObj = position;')
      .replace('#include <normal_vertex>', '#include <normal_vertex>\nvCoatN = normalize(transformedNormal);');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vObj;\nvarying vec3 vCoatN;\nuniform vec2 uHole;')
      .replace('#include <clearcoat_normal_fragment_begin>', '#ifdef USE_CLEARCOAT\nvec3 clearcoatNormal = normalize(vCoatN);\n#endif')
      // the studio lights the gloss, hardly the colour: a dark, meaty red with wet highlights
      .replace('#include <lights_fragment_maps>', '#include <lights_fragment_maps>\niblIrradiance *= 0.2;')
      // inside the opening, below the rim, it sinks into the dark
      .replace('#include <opaque_fragment>', `
        float inHole = (1.0 - smoothstep(uHole.x - 0.05, uHole.x + 0.01, abs(vObj.x))) * (1.0 - smoothstep(uHole.y - 0.05, uHole.y + 0.01, abs(vObj.z)));
        outgoingLight *= mix(1.0, mix(0.03, 1.0, smoothstep(-0.28, 0.015, vObj.y)), inHole);
        #include <opaque_fragment>`);
  };
  tMat.customProgramCacheKey = () => 'tongue2';
  const tongue = new THREE.Mesh(tGeo, tMat);
  tongue.name = 'tongue-body';
  tongue.frustumCulled = false;
  tongue.castShadow = O.shadows;
  tongue.visible = false;
  object3d.add(tongue);
  owned.push(tGeo, tMat);

  // fixed hand-made irregularity of every body grid point (profile units)
  const jit = new Float32Array(R * S * 2);
  for (let i = 1; i < RB; i++) for (let j = 0; j < S; j++) { jit[(i * S + j) * 2] = (rng() - 0.5) * 0.04; jit[(i * S + j) * 2 + 1] = (rng() - 0.5) * 0.06; }

  const P = new Float32Array(R * 3), T = new Float32Array(R * 3), N = new Float32Array(R * 3), B = new Float32Array(R * 3);
  const seg = new Float32Array(R), curlW = new Float32Array(R), gone = new Float32Array(R);
  const hw = new Float32Array(R), hh = new Float32Array(R), contact = new Uint8Array(R), wasContact = new Uint8Array(R), moved = new Uint8Array(R);
  const cpt = new Float32Array(R * 3); // where each spine point last touched the rim
  const squash = new Float32Array(R);
  const NB = 48, bzP = new Float32Array((NB + 1) * 3), bzL = new Float32Array(NB + 1);
  let tipEnd = 0; // distance from the last ring to the very tip

  // ---------------------------------------------------------------- wet things: materials and pools
  // Saliva is a cartoon liquid (its own little shader, not the scene lights): a see-through light body, a darker
  // blue-grey edge so it reads on the white page, a crisp white highlight dot and a soft bounce, a hint of pink.
  const liquid = (o) => { const m = liquidMaterial(THREE, o); owned.push(m); return m; };
  const dropMat = liquid({ tint: 0xd6e0ec, edge: 0x5f7590, alpha: 0.5, edgeAlpha: 0.95, defines: { DROP: '' } });
  const crownMat = liquid({ tint: 0xdfe7f0, edge: 0x7c8ea4, alpha: 0.22, edgeAlpha: 0.75, defines: { FADE: '', CROWN: '' }, side: THREE.DoubleSide });
  const puddleMat = liquid({ tint: 0xbccbdd, edge: 0x8599b2, alpha: 0.42, edgeAlpha: 0.8, defines: { FADE: '', PUDDLE: '' } });
  puddleMat.polygonOffset = true; puddleMat.polygonOffsetFactor = -2; puddleMat.polygonOffsetUnits = -2;
  const stringMat = liquid({ tint: 0xf2f6fa, edge: 0xb4c2d2, alpha: 0.8, edgeAlpha: 0.95 });
  const bubbleMat = liquid({ tint: 0xfff4f6, edge: 0xffffff, alpha: 0.12, edgeAlpha: 0.9 });

  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V1 = new THREE.Vector3(), V2 = new THREE.Vector3(), SC = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  const instanced = (geo, mat, n, parent, fade) => {
    if (fade) geo.setAttribute('aFade', new THREE.InstancedBufferAttribute(new Float32Array(n).fill(1), 1).setUsage(THREE.DynamicDrawUsage));
    const m = new THREE.InstancedMesh(geo, mat, n);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.frustumCulled = false; m.count = 0;
    parent.add(m); owned.push(geo);
    return m;
  };
  const MAXD = 72, MAXC = 16, MAXP = 28, MAXS = 4;
  const puddles = instanced(puddleGeometry(THREE, rng), puddleMat, MAXP, fx, true);
  puddles.renderOrder = 1;
  const crowns = instanced(crownGeometry(THREE), crownMat, MAXC, fx, true);
  crowns.renderOrder = 2;
  const drops = instanced(new THREE.IcosahedronGeometry(1, 1), dropMat, MAXD, fx);
  drops.castShadow = O.shadows; drops.renderOrder = 3;
  const BUB = [[0.42, 4, 0.02], [0.44, 3, 0.013], [0.46, 4, 0.011], [0.6, 7, 0.016], [0.62, 6, 0.011], [0.3, 2, 0.013], [0.32, 2, 0.009], [0.74, 5, 0.012], [0.76, 6, 0.008]]; // along, profile point, radius
  const bubbles = instanced(new THREE.IcosahedronGeometry(1, 1), bubbleMat, BUB.length, object3d);
  bubbles.renderOrder = 3;

  const D = [], C = [], PD = [], STR = [];
  for (let k = 0; k < MAXD; k++) D.push({ on: false, p: new THREE.Vector3(), v: new THREE.Vector3(), r: 0, kind: 0, age: 0 });
  for (let k = 0; k < MAXC; k++) C.push({ on: false, p: new THREE.Vector3(), t: 0, life: 0.22, R: 0, H: 0, rot: 0 });
  for (let k = 0; k < MAXP; k++) PD.push({ on: false, p: new THREE.Vector3(), t: 0, life: 2, R: 0, rot: 0 });
  const take = (pool, age) => { let best = null; for (const o of pool) { if (!o.on) return o; if (!best || age(o) > age(best)) best = o; } return best; };
  function spawnDrop(x, y, z, vx, vy, vz, r, kind = 0) {
    const d = take(D, (o) => o.age);
    if (y > -0.05) vz = Math.max(vz, -0.25); // never back into the open lid
    d.on = true; d.p.set(x, y, z); d.v.set(vx, vy, vz); d.r = r; d.kind = kind; d.age = 0;
    const sp = d.v.length(); if (sp > 5.5) d.v.multiplyScalar(5.5 / sp);
  }
  function puddle(x, y, z, R0, life) {
    const p = take(PD, (o) => o.t);
    p.on = true; p.p.set(x, y + 0.002, z); p.t = 0; p.life = life; p.R = R0; p.rot = rng() * 6.28;
  }
  function splash(x, y, z, r, speed, onRim) {
    const big = r * (0.75 + 0.1 * Math.min(6, speed));
    if (r > 0.012) {
      const c = take(C, (o) => o.t);
      c.on = true; c.p.set(x, y, z); c.t = 0; c.life = 0.2 + 0.06 * rng(); c.R = big * 2.2; c.H = big * (1.5 + 0.4 * rng()); c.rot = rng() * 6.28;
      // droplets thrown from the crown's points
      const n = r > 0.026 ? 3 : r > 0.018 ? 2 : 1;
      for (let k = 0; k < n; k++) {
        const a = rng() * 6.28, out = 0.5 + rng() * 0.9;
        spawnDrop(x + Math.cos(a) * c.R * 0.8, y + c.H * 0.5, z + Math.sin(a) * c.R * 0.8, Math.cos(a) * out, 0.9 + rng() * 1.1, Math.sin(a) * out, r * (0.3 + 0.15 * rng()), 1);
      }
    }
    puddle(x, y, z, Math.min(onRim ? 0.07 : 0.14, r * (2 + 0.3 * Math.min(6, speed))), (onRim ? 1.1 : 1.8) + rng() * 0.8);
    cue('splat', { x, y, z, size: r });
  }

  // strings of spit between the tongue's underside and the rim: one indexed mesh, 4 strings of 10 x 6
  const SEG = 10, SS = 6, SV = (SEG + 1) * SS;
  const sPos = new Float32Array(MAXS * SV * 3), sNrm = new Float32Array(MAXS * SV * 3), sIdx = [];
  for (let k = 0; k < MAXS; k++) {
    for (let u = 0; u < SEG; u++) {
      for (let j = 0; j < SS; j++) {
        const a = k * SV + u * SS + j, b = k * SV + u * SS + (j + 1) % SS, c = a + SS, d = b + SS;
        sIdx.push(a, c, b, b, c, d);
      }
    }
  }
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3).setUsage(THREE.DynamicDrawUsage));
  sGeo.setAttribute('normal', new THREE.BufferAttribute(sNrm, 3).setUsage(THREE.DynamicDrawUsage));
  sGeo.setIndex(sIdx);
  const strings = new THREE.Mesh(sGeo, stringMat);
  strings.frustumCulled = false; strings.visible = false; strings.renderOrder = 3;
  fx.add(strings); owned.push(sGeo);
  for (let k = 0; k < MAXS; k++) STR.push({ on: false, ring: 0, j: UNDER, ph: 0, b: new THREE.Vector3(), a: new THREE.Vector3(), av: new THREE.Vector3(), t: 0, snapAt: -1, snapLen: 0.3, sag: 0, bead: 0.5 });

  // ---------------------------------------------------------------- the lick
  let L = null;   // the running lick
  let phase = 0;  // the travelling wave
  const par = { root: new THREE.Vector3(), rootDir: new THREE.Vector3(), tip: new THREE.Vector3(), tipDir: new THREE.Vector3() };
  const body = { // spring-driven: the tip chases its key, the curve's handles chase theirs
    tip: new THREE.Vector3(), tipV: new THREE.Vector3(),
    h1: new THREE.Vector3(), h1V: new THREE.Vector3(), h2: new THREE.Vector3(), h2V: new THREE.Vector3(),
  };
  const tgt1 = new THREE.Vector3(), tgt2 = new THREE.Vector3();
  const EMIT = [[TIP, 2], [(R - 1) * S, 1], [(R - 1) * S + LEFT, 1], [(R - 4) * S, 0.8], [(R - 4) * S + LEFT, 0.8], [(RB - 4) * S, 0.4], [(RB - 4) * S + LEFT, 0.4]];
  const emitPrev = new Float32Array(EMIT.length * 3), emitAcc = new Float32Array(EMIT.length);
  let primed = false, stretch = 1, stretchV = 0, lenPrev = 0;

  function evalPose(t, sx) {
    for (const k in tracks) {
      const tr = tracks[k];
      if (Array.isArray(tr)) par[k].set(tr[0](t) * sx * (k === 'tip' ? L.spread : 1), tr[1](t), tr[2](t));
      else par[k] = tr(t) * (k === 'twist' || k === 'yaw' ? sx : 1);
    }
    par.rootDir.normalize(); par.tipDir.normalize();
    // the top faces away from where it reaches (the outside of its arc), so the camera sees the top, not the edge
    const dx = body.tip.x - par.root.x, dz = body.tip.z - par.root.z, hd = Math.hypot(dx, dz);
    par.yaw += clamp(Math.atan2(dx, Math.max(0.05, dz)), -1.4, 1.4) * smooth(0.12, 0.4, hd) * par.yawAuto;
  }
  function handleTargets() {
    const d = par.root.distanceTo(body.tip);
    tgt1.copy(par.root).addScaledVector(par.rootDir, par.h0 * d);
    tgt2.copy(body.tip).addScaledVector(par.tipDir, -par.h1 * d);
  }
  const chase = (p, v, target, f, z, h) => {
    const w = 2 * Math.PI * f;
    v.x += (w * w * (target.x - p.x) - 2 * z * w * v.x) * h; v.y += (w * w * (target.y - p.y) - 2 * z * w * v.y) * h; v.z += (w * w * (target.z - p.z) - 2 * z * w * v.z) * h;
    p.addScaledVector(v, h);
  };
  function alignFx() {
    if (!O.fxParent) return;
    object3d.updateWorldMatrix(true, false); O.fxParent.updateWorldMatrix(true, false);
    M4.copy(O.fxParent.matrixWorld).invert().multiply(object3d.matrixWorld);
    M4.decompose(fx.position, fx.quaternion, fx.scale);
  }

  function lick({ speed = 1, mirror = false, spread = 1 } = {}) {
    if (L) return L.promise;
    let resolve;
    const promise = new Promise((r) => { resolve = r; });
    L = { t: 0, speed: Math.max(0.2, speed), sx: mirror ? -1 : 1, spread: clamp(+spread || 1, 0.5, 1.2), resolve, promise, cue: 0, burst: 0 };
    alignFx();
    evalPose(0, L.sx);
    body.tip.copy(par.tip); body.tipV.set(0, 0, 0);
    handleTargets();
    body.h1.copy(tgt1); body.h1V.set(0, 0, 0); body.h2.copy(tgt2); body.h2V.set(0, 0, 0);
    primed = false; stretch = 1; stretchV = 0; lenPrev = 0;
    contact.fill(0); squash.fill(0); emitAcc.fill(0);
    tongue.visible = true;
    return promise;
  }

  function stepLick(dt) {
    const l = L;
    const prevT = l.t;
    l.t = Math.min(T_END, l.t + dt * l.speed);
    const t = l.t, sdt = dt * l.speed;
    evalPose(t, l.sx);
    const n = Math.max(1, Math.ceil(sdt / (1 / 240))), h = sdt / n;
    for (let k = 0; k < n; k++) {
      chase(body.tip, body.tipV, par.tip, par.hz, par.damp, h);          // the tip: a little overshoot at every stop
      handleTargets();
      chase(body.h1, body.h1V, tgt1, 4.6 * par.body, 0.55, h);          // the body drags behind, then swings past
      chase(body.h2, body.h2V, tgt2, 5.6 * par.body, 0.45 + 0.4 * (par.damp - 0.5), h);
    }
    phase += sdt * 2.6;
    build(t, sdt);
    writeMesh();
    emit(dt);
    while (l.cue < CUES.length && CUES[l.cue][0] <= t) { cue(CUES[l.cue][1]); l.cue++; }
    while (l.burst < BURSTS.length && BURSTS[l.burst][0] <= t) { burst(BURSTS[l.burst][1], BURSTS[l.burst][2]); l.burst++; }
    if (t >= T_END && prevT < T_END) {
      tongue.visible = false;
      bubbles.count = 0;
      for (const s of STR) if (s.on && s.snapAt < 0) snapString(s);
      // the lid may slam now: nothing is left in the air over the opening
      for (const d of D) if (d.on && d.p.y > -0.05 && Math.abs(d.p.x) < UX + 0.03 && Math.abs(d.p.z) < UZ + 0.03) d.on = false;
      L = null;
      l.resolve();
    }
  }

  // The spine: a cubic curve root -> tip through the sprung handles, resampled into rings (24 along the body, 9
  // round the tip), framed (top facing the back at the root, carried along), curled at the tip, waved, then kept
  // out of the rim.
  function build(t, sdt) {
    const p0 = par.root, p1 = body.h1, p2 = body.h2, p3 = body.tip;
    let len = 0;
    for (let k = 0; k <= NB; k++) {
      const u = k / NB, a = (1 - u) * (1 - u) * (1 - u), b = 3 * (1 - u) * (1 - u) * u, c = 3 * (1 - u) * u * u, d = u * u * u;
      const x = a * p0.x + b * p1.x + c * p2.x + d * p3.x, y = a * p0.y + b * p1.y + c * p2.y + d * p3.y, z = a * p0.z + b * p1.z + c * p2.z + d * p3.z;
      if (k) len += Math.hypot(x - bzP[k * 3 - 3], y - bzP[k * 3 - 2], z - bzP[k * 3 - 1]);
      bzP[k * 3] = x; bzP[k * 3 + 1] = y; bzP[k * 3 + 2] = z; bzL[k] = len;
    }
    // squash and stretch: from the length and from the speed it shoots out at
    const rate = sdt > 0 && lenPrev > 0 ? (len - lenPrev) / sdt : 0; lenPrev = len;
    const target = clamp(Math.pow(1.5 / Math.max(0.3, len), 0.3) * clamp(1 - 0.035 * rate, 0.82, 1.06), 0.82, 1.2);
    for (let k = 0, n = Math.max(1, Math.ceil(sdt * 240)); k < n; k++) { // a bouncy spring, stepped finely at any frame rate
      stretchV += (260 * (target - stretch) - 20 * stretchV) * (sdt / n); stretch += stretchV * (sdt / n);
    }
    // where the rings go: the body evenly (a little denser toward the tip), then round the tip by angle, so the end
    // is a true half-round: wide and spatulate, never a point
    const Wt = W0 * par.wide * stretch, Rt = Math.min(0.88 * Wt, 0.4 * len), sBody = 1 - Rt / Math.max(1e-3, len);
    for (let i = 0; i < RB; i++) { sR[i] = sBody * Math.pow(i / RB, 0.92); roundF[i] = 1; }
    for (let k = 0; k < RT; k++) {
      const phi = (k / (RT - 1)) * 1.48; // up to ~85 degrees
      sR[RB + k] = 1 - (Rt * (1 - Math.sin(phi))) / Math.max(1e-3, len); roundF[RB + k] = Math.cos(phi);
    }
    tipEnd = (1 - sR[R - 1]) * len;
    // slid back along its own length: what is pulled in follows the curve back to the root, then straight down
    const back = clamp(par.slide, 0, 1) * len;
    for (let i = 0, k = 0; i < R; i++) {
      const want = sR[i] * len - back;
      gone[i] = smooth(0, -0.14, want); // pulled in behind the root: hidden in the bin, it thins to nothing there
      if (want <= 0) { for (let c = 0; c < 3; c++) P[i * 3 + c] = bzP[c] + (c === 1 ? want : 0); continue; }
      while (k < NB - 1 && bzL[k + 1] < want) k++;
      const f = clamp((want - bzL[k]) / ((bzL[k + 1] - bzL[k]) || 1), 0, 1);
      for (let c = 0; c < 3; c++) P[i * 3 + c] = bzP[k * 3 + c] + (bzP[k * 3 + 3 + c] - bzP[k * 3 + c]) * f;
    }
    // frames: tangents from the points; the top starts facing the back (the upper jaw: the lid) and is carried along
    frames(true);
    // the curl: the end rolls about its own side axis, the bend spread smoothly over the last half
    if (par.curl) {
      let tot = 0;
      for (let i = 1; i < R; i++) { curlW[i] = smooth(0.45, 0.95, sR[i]) * (sR[i] - sR[i - 1]); tot += curlW[i]; }
      for (let i = 1; i < R; i++) curlW[i] /= tot || 1;
      for (let i = 1; i < R; i++) seg[i] = Math.hypot(P[i * 3] - P[i * 3 - 3], P[i * 3 + 1] - P[i * 3 - 2], P[i * 3 + 2] - P[i * 3 - 1]);
      let ang = 0;
      for (let i = 1; i < R; i++) {
        ang += par.curl * curlW[i];
        if (!ang) continue;
        const c = Math.cos(ang), s = Math.sin(ang), o = (i - 1) * 3, q = i * 3;
        const dx = T[o] * c + N[o] * s, dy = T[o + 1] * c + N[o + 1] * s, dz = T[o + 2] * c + N[o + 2] * s;
        P[q] = P[o] + dx * seg[i]; P[q + 1] = P[o + 1] + dy * seg[i]; P[q + 2] = P[o + 2] + dz * seg[i];
      }
      ang = 0;
      for (let i = 0; i < R; i++) { // carry the frames round with the curl
        ang += i ? par.curl * curlW[i] : 0;
        if (!ang) continue;
        const c = Math.cos(ang), s = Math.sin(ang), q = i * 3;
        const nx = N[q] * c - T[q] * s, ny = N[q + 1] * c - T[q + 1] * s, nz = N[q + 2] * c - T[q + 2] * s;
        N[q] = nx; N[q + 1] = ny; N[q + 2] = nz;
      }
    }
    // a wave running to the tip (none at the root, none at the very tip)
    if (par.wave || par.waveB) {
      for (let i = 1; i < R; i++) {
        const s = sR[i], e = Math.sin(Math.PI * Math.min(1, s * 1.08));
        const a = par.wave * e * Math.sin(2 * Math.PI * (1.2 * s - phase)), b = par.waveB * e * Math.sin(2 * Math.PI * (1.0 * s - 0.8 * phase) + 1.3);
        for (let c = 0; c < 3; c++) P[i * 3 + c] += N[i * 3 + c] * a + B[i * 3 + c] * b;
      }
    }
    // widths and thicknesses (the rim needs the thickness)
    const breathe = 0.03 * Math.sin(t * 17);
    for (let i = 0; i < R; i++) {
      const s = sR[i], rf = roundF[i];
      hw[i] = W0 * (1 - 0.42 * par.spat * (1 - smooth(0.2, 0.8, s))) * (1 - 0.1 * (1 - par.spat)) * par.wide * stretch * rf;
      hh[i] = H0 * (1 - 0.36 * s) / Math.sqrt(stretch) * (1 + breathe * Math.sin(s * 5)) * (0.42 + 0.58 * Math.sqrt(rf));
      const g = 1 - 0.92 * gone[i]; hw[i] *= g; hh[i] *= g;
      const dEnd = (1 - s) * len, xr = 1 - Math.min(1, dEnd / 0.12); // seen side-on, the end is rounded too
      if (xr > 0) hh[i] *= Math.max(0.12, Math.sqrt(1 - xr * xr)) / (0.42 + 0.58 * Math.sqrt(rf));
    }
    // the rim: the tongue lies on it, never through it
    wasContact.set(contact);
    contact.fill(0);
    let any = false;
    for (let pass = 0; pass < 3; pass++) {
      moved.fill(0);
      for (let i = 0; i < R; i++) if (pushOut(i)) { any = true; moved[i] = 1; }
      if (!any) break;
      // smooth wherever it was pushed (and next to it), so it bends round the rim instead of kinking
      for (let i = 1; i < R - 1; i++) {
        if (!moved[i - 1] && !moved[i + 1] && !moved[i]) continue;
        for (let k = 0; k < 3; k++) P[i * 3 + k] = 0.5 * P[i * 3 + k] + 0.25 * (P[(i - 1) * 3 + k] + P[(i + 1) * 3 + k]);
      }
    }
    if (any) respace();
    // pressed on the rim: flatter and wider there
    const ease = 1 - Math.pow(0.65, sdt * 60);
    for (let i = 0; i < R; i++) {
      const near = (k) => (k >= 0 && k < R ? contact[k] : 0);
      const c = Math.max(contact[i], 0.6 * Math.max(near(i - 1), near(i + 1)), 0.25 * Math.max(near(i - 2), near(i + 2)));
      squash[i] += (c - squash[i]) * ease;
      hw[i] *= 1 + 0.06 * squash[i]; hh[i] *= 1 - 0.2 * squash[i];
    }
    frames(true); // carried again along the path it now takes (squaring up the old frames twists it where the rim bent it)
    stiffen();
    // lifting off the rim's top leaves a string of spit behind
    for (let i = 6; i < RB; i++) {
      if (!wasContact[i] || contact[i] || cpt[i * 3 + 1] < -0.03 || rng() > 0.6) continue;
      if (STR.some((s) => s.on && Math.abs(s.ring - i) < 5)) continue;
      const s = STR.find((o) => !o.on);
      if (!s) break;
      // only off the front lip (between the lip and the tongue lifting off it, in front of the dark bin, it shows)
      const o = i * 3;
      if (cpt[o + 2] < OZ - 0.02) continue;
      s.on = true; s.ring = i; s.j = UNDER; s.t = 0; s.snapAt = -1; s.snapLen = 0.16 + rng() * 0.12; s.sag = 0; s.bead = 0.3 + rng() * 0.4; s.ph = rng() * 6.28;
      s.b.set(cpt[o], 0, cpt[o + 2]);
      surface(i, s.j, s.a); s.av.set(0, 0, 0);
    }
  }

  // After the rim has pushed it about, the rings are spread out evenly again along the path it now takes (where it
  // was flattened against the bin they would pile up and fold into creases).
  const cum = new Float32Array(R), rP = new Float32Array(R * 3), rN = new Float32Array(R * 3);
  function respace() {
    cum[0] = 0;
    for (let i = 1; i < R; i++) cum[i] = cum[i - 1] + Math.hypot(P[i * 3] - P[i * 3 - 3], P[i * 3 + 1] - P[i * 3 - 2], P[i * 3 + 2] - P[i * 3 - 1]);
    const total = cum[R - 1], end = sR[R - 1] || 1;
    rP.set(P); rN.set(N);
    for (let i = 1, k = 0; i < R - 1; i++) {
      const want = (sR[i] / end) * total;
      while (k < R - 2 && cum[k + 1] < want) k++;
      const f = clamp((want - cum[k]) / ((cum[k + 1] - cum[k]) || 1), 0, 1), a = k * 3, b = a + 3, q = i * 3;
      for (let c = 0; c < 3; c++) { P[q + c] = rP[a + c] + (rP[b + c] - rP[a + c]) * f; N[q + c] = rN[a + c] + (rN[b + c] - rN[a + c]) * f; }
    }
  }

  // A wide flat tongue can't bend sideways in its own plane without buckling: its width direction turns slowly along
  // its length (it shears a little instead), so its edges never bunch up into folds.
  const sB = new Float32Array(R * 3);
  function stiffen() {
    for (let i = 0; i < R; i++) {
      let x = 0, y = 0, z = 0;
      for (let k = -3; k <= 3; k++) { const j = clamp(i + k, 0, R - 1) * 3, w = 4 - Math.abs(k); x += B[j] * w; y += B[j + 1] * w; z += B[j + 2] * w; }
      const l = Math.hypot(x, y, z) || 1; sB[i * 3] = x / l; sB[i * 3 + 1] = y / l; sB[i * 3 + 2] = z / l;
    }
    for (let i = 0; i < R; i++) {
      const q = i * 3, bx = sB[q], by = sB[q + 1], bz = sB[q + 2], tx = T[q], ty = T[q + 1], tz = T[q + 2];
      let nx = by * tz - bz * ty, ny = bz * tx - bx * tz, nz = bx * ty - by * tx; const l = Math.hypot(nx, ny, nz) || 1;
      N[q] = nx / l; N[q + 1] = ny / l; N[q + 2] = nz / l; B[q] = bx; B[q + 1] = by; B[q + 2] = bz;
    }
  }

  // Tangents from the points; N carried from the root (transport) or just squared up to the new tangents; B = T x N.
  function frames(transport) {
    for (let i = 0; i < R; i++) {
      const a = Math.max(0, i - 2), b = Math.min(R - 1, i + 2), q = i * 3; // a wide stencil: the frame follows the tongue, not ring-to-ring noise
      let tx = P[b * 3] - P[a * 3], ty = P[b * 3 + 1] - P[a * 3 + 1], tz = P[b * 3 + 2] - P[a * 3 + 2];
      let l = Math.hypot(tx, ty, tz) || 1; tx /= l; ty /= l; tz /= l;
      let nx, ny, nz;
      if (!transport) { nx = N[q]; ny = N[q + 1]; nz = N[q + 2]; }
      else if (i === 0) { nx = -Math.sin(par.yaw); ny = 0.25; nz = -Math.cos(par.yaw); }
      else { nx = N[q - 3]; ny = N[q - 2]; nz = N[q - 1]; }
      const d = nx * tx + ny * ty + nz * tz; nx -= d * tx; ny -= d * ty; nz -= d * tz;
      l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      T[q] = tx; T[q + 1] = ty; T[q + 2] = tz;
      N[q] = nx; N[q + 1] = ny; N[q + 2] = nz;
    }
    if (transport && par.twist) { // roll along the length
      for (let i = 1; i < R; i++) {
        const q = i * 3, w = par.twist * sR[i], c = Math.cos(w), s = Math.sin(w);
        const bx = T[q + 1] * N[q + 2] - T[q + 2] * N[q + 1], by = T[q + 2] * N[q] - T[q] * N[q + 2], bz = T[q] * N[q + 1] - T[q + 1] * N[q];
        N[q] = N[q] * c + bx * s; N[q + 1] = N[q + 1] * c + by * s; N[q + 2] = N[q + 2] * c + bz * s;
      }
    }
    for (let i = 0; i < R; i++) {
      const q = i * 3;
      B[q] = T[q + 1] * N[q + 2] - T[q + 2] * N[q + 1]; B[q + 1] = T[q + 2] * N[q] - T[q] * N[q + 2]; B[q + 2] = T[q] * N[q + 1] - T[q + 1] * N[q];
    }
  }

  function pushOut(i) {
    const h = hh[i];
    let x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
    if (y > h) return false;
    const ax = Math.abs(x), az = Math.abs(z);
    if (ax > UX + h || az > UZ + h) return y < DEEP && ax < UX && az < UZ ? (P[i * 3 + 1] = DEEP, true) : false;
    const inHole = ax < OX && az < OZ;
    if (inHole && y < 0) { // inside the opening: off the inner walls, and it piles up on the bin's floor (in the dark)
      // its real reach along x and z (its width lies along B, its thickness along N); just under the rim only the
      // thickness counts, so it can lean on the lip on its way out
      const o = i * 3, deep = smooth(-0.02, -0.12, y);
      const ex = Math.abs(B[o]) * hw[i] * deep + Math.abs(N[o]) * h + 0.01, ez = Math.abs(B[o + 2]) * hw[i] * deep + Math.abs(N[o + 2]) * h + 0.01;
      const mx = Math.max(0.02, OX - ex), mz = Math.max(0.02, OZ - ez);
      let moved = false;
      if (ax > mx) { x = Math.sign(x) * mx; moved = true; }
      if (az > mz) { z = Math.sign(z) * mz; moved = true; }
      if (y < DEEP) { y = DEEP; moved = true; }
      P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z;
      return moved;
    }
    if (inHole) return false; // over the opening, just above the rim plane: free
    if (y > -0.28) {
      // the rim near its top: a slab whose outer top edges are rounded (radius LIP), so whatever crosses it is laid
      // over it and wraps round the lip like a tongue over a lower lip (never pushed back into the opening)
      const qx = ax - (UX - LIP), qy = y + LIP, qz = az - (UZ - LIP);
      if (qx < 0 && qz < 0) { y = h; contact[i] = 1; cpt[i * 3] = x; cpt[i * 3 + 1] = 0; cpt[i * 3 + 2] = z; P[i * 3 + 1] = y; return true; }
      const ox = Math.max(qx, 0), oy = Math.max(qy, 0), oz = Math.max(qz, 0), out = Math.hypot(ox, oy, oz);
      const d = out + Math.min(Math.max(qx, qy, qz), 0) - LIP;
      if (d >= h) return false;
      let gx = 0, gy = 0, gz = 0;
      if (out > 1e-6) { gx = ox / out; gy = oy / out; gz = oz / out; } else if (qy >= qx && qy >= qz) gy = 1; else if (qx >= qz) gx = 1; else gz = 1;
      const sx = x < 0 ? -1 : 1, sz = z < 0 ? -1 : 1, push = h - d;
      cpt[i * 3] = x - sx * gx * d; cpt[i * 3 + 1] = Math.min(0, y - gy * d); cpt[i * 3 + 2] = z - sz * gz * d;
      P[i * 3] = x + sx * gx * push; P[i * 3 + 1] = y + gy * push; P[i * 3 + 2] = z + sz * gz * push;
      contact[i] = gy > 0.35 ? 1 : 0; // lying on the lip (pressed flat there), not just hanging against the front
      return true;
    }
    // lower down the wall is in the way: out to the front or back into the opening, the short way
    const outX = UX + h - ax, outZ = UZ + h - az;
    const inX = az < OZ ? ax - (OX - h) : Infinity, inZ = ax < OX ? az - (OZ - h) : Infinity;
    const m = Math.min(outX, outZ, inX, inZ);
    if (m === outZ) z = Math.sign(z) * (UZ + h);
    else if (m === outX) x = Math.sign(x) * (UX + h);
    else if (m === inX) x = Math.sign(x) * (OX - h);
    else z = Math.sign(z) * (OZ - h);
    P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z;
    return true;
  }

  const gDepth = (s) => 0.28 * smooth(0.03, 0.16, s) * (1 - smooth(0.68, 0.9, s)); // the groove fades before the tip
  function surface(i, j, out) { // a point of cross-section j on ring i (before jitter)
    const px = PROF[j][0] * hw[i], py = (PROF[j][1] - GW[j] * gDepth(sR[i])) * hh[i];
    out.set(P[i * 3] + B[i * 3] * px + N[i * 3] * py, P[i * 3 + 1] + B[i * 3 + 1] * px + N[i * 3 + 1] * py, P[i * 3 + 2] + B[i * 3 + 2] * px + N[i * 3 + 2] * py);
    return out;
  }

  function writeMesh() {
    for (let i = 0; i < R; i++) {
      const W = hw[i], H = hh[i], g = gDepth(sR[i]), o = i * 3;
      for (let j = 0; j < S; j++) {
        const q = (i * S + j) * 2;
        const x = (PROF[j][0] + jit[q]) * W;
        const y = (PROF[j][1] - GW[j] * g + jit[q + 1]) * H;
        const k = (i * S + j) * 3;
        grid[k] = P[o] + B[o] * x + N[o] * y;
        grid[k + 1] = P[o + 1] + B[o + 1] * x + N[o + 1] * y;
        grid[k + 2] = P[o + 2] + B[o + 2] * x + N[o + 2] * y;
      }
    }
    const e = (R - 1) * 3;
    for (let c = 0; c < 3; c++) {
      grid[TIP * 3 + c] = P[e + c] + T[e + c] * tipEnd;
      grid[ROOT * 3 + c] = P[c] - T[c] * 0.05;
    }
    // smooth normals (area weighted) for the wet coat; the flesh is flat shaded by the material
    gN.fill(0);
    for (let k = 0; k < NT; k++) {
      const a = tri[k * 3] * 3, b = tri[k * 3 + 1] * 3, c = tri[k * 3 + 2] * 3;
      const ax = grid[a], ay = grid[a + 1], az = grid[a + 2];
      const ux = grid[b] - ax, uy = grid[b + 1] - ay, uz = grid[b + 2] - az;
      const vx = grid[c] - ax, vy = grid[c + 1] - ay, vz = grid[c + 2] - az;
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      gN[a] += nx; gN[a + 1] += ny; gN[a + 2] += nz;
      gN[b] += nx; gN[b + 1] += ny; gN[b + 2] += nz;
      gN[c] += nx; gN[c + 1] += ny; gN[c + 2] += nz;
    }
    for (let g = 0; g < NG * 3; g += 3) { const l = Math.hypot(gN[g], gN[g + 1], gN[g + 2]) || 1; gN[g] /= l; gN[g + 1] /= l; gN[g + 2] /= l; }
    for (let k = 0; k < NT; k++) {
      for (let v = 0; v < 3; v++) {
        const g = tri[k * 3 + v] * 3, q = k * 9 + v * 3;
        tPos[q] = grid[g]; tPos[q + 1] = grid[g + 1]; tPos[q + 2] = grid[g + 2];
        tNrm[q] = gN[g]; tNrm[q + 1] = gN[g + 1]; tNrm[q + 2] = gN[g + 2];
      }
    }
    tGeo.attributes.position.needsUpdate = true;
    tGeo.attributes.normal.needsUpdate = true;
    // foam bubbles ride on the top
    let nb = 0;
    for (const [s, j, r] of BUB) {
      let i = 0; while (i < RB - 1 && sR[i + 1] < s) i++;
      surface(i, j, V1);
      const o = i * 3, rr = r * Math.min(1.15, stretch);
      V1.x += N[o] * rr * 0.3; V1.y += N[o + 1] * rr * 0.3; V1.z += N[o + 2] * rr * 0.3;
      M4.compose(V1, Q.identity(), SC.setScalar(rr));
      bubbles.setMatrixAt(nb++, M4);
    }
    bubbles.count = nb;
    bubbles.instanceMatrix.needsUpdate = true;
  }

  // Spit flies off wherever the tongue moves fast (mostly the tip and the edges near it).
  function emit(dt) {
    for (let e = 0; e < EMIT.length; e++) {
      const [g, wgt] = EMIT[e];
      const x = grid[g * 3], y = grid[g * 3 + 1], z = grid[g * 3 + 2];
      if (primed && dt > 0) {
        const vx = (x - emitPrev[e * 3]) / dt, vy = (y - emitPrev[e * 3 + 1]) / dt, vz = (z - emitPrev[e * 3 + 2]) / dt;
        const sp = Math.hypot(vx, vy, vz);
        if (sp > 2.8 && y > -0.02) {
          emitAcc[e] += wgt * 1.2 * (sp - 2.8) * dt;
          while (emitAcc[e] >= 1) {
            emitAcc[e] -= 1;
            const f = 0.55 + 0.35 * rng();
            spawnDrop(x, y, z, vx * f + rnd(-0.4, 0.4), vy * f + rnd(-0.2, 0.5), vz * f + rnd(-0.3, 0.4), 0.013 + rng() * 0.02);
          }
        }
      }
      emitPrev[e * 3] = x; emitPrev[e * 3 + 1] = y; emitPrev[e * 3 + 2] = z;
    }
    primed = true;
  }

  function burst(kind, n) {
    if (kind === 'mouth') { // the slurp: spit sprays out of the opening, forward and to the sides (never up into the lid)
      for (let k = 0; k < n; k++) {
        const a = Math.PI * (0.1 + 0.8 * rng());
        spawnDrop(Math.cos(a) * 0.2, 0.03, 0.12 + Math.sin(a) * 0.1, Math.cos(a) * rnd(0.6, 1.4), rnd(1.3, 2.3), Math.sin(a) * rnd(0.6, 1.2) + 0.5, 0.013 + rng() * 0.016);
      }
      return;
    }
    if (kind === 'slap') { // landing on the lips: spit squirts out from under it, sideways and forward
      for (let k = 0; k < n; k++) {
        let i = RB - 2 - Math.floor(rng() * 14);
        for (let q = 4; q < RB; q++) if (contact[q]) { i = q + Math.floor(rng() * 5) - 2; break; }
        i = clamp(i, 2, RB - 1);
        const side = k % 2 ? -1 : 1, o = i * 3;
        const x = P[o] + B[o] * hw[i] * side, y = P[o + 1] + 0.02, z = P[o + 2] + B[o + 2] * hw[i] * side;
        spawnDrop(x, y, z, B[o] * side * rnd(0.6, 1.6) + rnd(-0.3, 0.3), rnd(1.1, 2.4), rnd(0.5, 1.5), 0.014 + rng() * 0.02);
      }
      return;
    }
    // from the tip, along its motion
    const x = grid[TIP * 3], y = grid[TIP * 3 + 1], z = grid[TIP * 3 + 2], v = body.tipV;
    for (let k = 0; k < n; k++) {
      const f = rnd(0.45, 0.85);
      spawnDrop(x, y, z, v.x * f + rnd(-0.6, 0.6), v.y * f + rnd(0.4, 1.4), v.z * f + rnd(-0.2, 0.8), 0.015 + rng() * 0.024);
    }
  }

  function snapString(s) {
    s.snapAt = s.t;
    cue('snap');
    const g = 0.5, mx = s.a.x + (s.b.x - s.a.x) * g, my = s.a.y + (s.b.y - s.a.y) * g - s.sag, mz = s.a.z + (s.b.z - s.a.z) * g;
    spawnDrop(mx, my, mz, s.av.x * 0.25 + rnd(-0.2, 0.2), Math.min(0, s.av.y * 0.2) - 0.3, Math.max(-0.2, s.av.z * 0.25) + rnd(0, 0.3), 0.012 + rng() * 0.007);
    spawnDrop(mx * 0.5 + s.b.x * 0.5, my * 0.5, mz * 0.5 + s.b.z * 0.5, rnd(-0.2, 0.2), -0.4, rnd(0, 0.3), 0.009 + rng() * 0.004);
  }

  // ---------------------------------------------------------------- per frame
  function stepStrings(dt) {
    let any = false;
    for (let k = 0; k < MAXS; k++) {
      const s = STR[k], base = k * SV * 3;
      if (!s.on) continue;
      s.t += dt;
      if (L && s.snapAt < 0) { // follow the tongue
        surface(s.ring, s.j, V1);
        if (dt > 0) s.av.copy(V1).sub(s.a).divideScalar(dt);
        s.a.copy(V1);
      }
      const len = s.a.distanceTo(s.b);
      if (s.snapAt < 0 && (len > s.snapLen || s.t > 0.45 || !L)) snapString(s);
      // after the snap, each half whips back to its own end within 0.1 s and is gone (a wet spot on the rim)
      const broke = s.snapAt >= 0 ? Math.min(1, (s.t - s.snapAt) / 0.1) : 0;
      if (broke >= 1) {
        s.on = false; sPos.fill(0, base, base + SV * 3);
        puddle(s.b.x, 0, s.b.z, 0.03 + rng() * 0.015, 0.9);
        continue;
      }
      any = true;
      const sagT = Math.min(0.1, 0.04 + 0.4 * len) * (1 - broke);
      s.sag += (sagT - s.sag) * Math.min(1, dt * 12);
      const wob = 0.12 * len * Math.sin(s.t * 27 + s.ph) * (1 - broke); // it sways, sideways
      // thins as it stretches (same volume), webbed thick where it meets the tongue and the rim, a bead of spit on it
      const rMid = clamp(0.0012 / Math.max(0.05, len), 0.005, 0.011), rEnd = 0.016;
      const ease = 1 - (1 - broke) * (1 - broke);
      for (let u = 0; u <= SEG; u++) {
        const f = u / SEG;
        const g = broke > 0 ? (f < 0.5 ? f * (1 - ease) : 1 - (1 - f) * (1 - ease)) : f; // each half to its own end
        const bow = 4 * g * (1 - g), cx = s.a.x + (s.b.x - s.a.x) * g + wob * bow, cy = s.a.y + (s.b.y - s.a.y) * g - s.sag * bow, cz = s.a.z + (s.b.z - s.a.z) * g + s.sag * 0.4 * bow;
        const r = (rMid + (rEnd - rMid) * Math.pow(Math.abs(2 * f - 1), 4) + 0.008 * Math.exp(-Math.pow((f - s.bead) / 0.08, 2))) * (1 - 0.5 * broke);
        V2.set(s.b.x - s.a.x, (s.b.y - s.a.y) - s.sag * 4 * (1 - 2 * g), s.b.z - s.a.z).normalize();
        V1.crossVectors(V2, UP); if (V1.lengthSq() < 1e-6) V1.set(1, 0, 0); V1.normalize();
        const wx = V2.y * V1.z - V2.z * V1.y, wy = V2.z * V1.x - V2.x * V1.z, wz = V2.x * V1.y - V2.y * V1.x;
        for (let j = 0; j < SS; j++) {
          const a = (j / SS) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a), q = base + (u * SS + j) * 3;
          const nx = V1.x * ca + wx * sa, ny = V1.y * ca + wy * sa, nz = V1.z * ca + wz * sa;
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
        else puddle(d.p.x, FLOOR, d.p.z, d.r * 2.4, 0.8 + rng() * 0.5);
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
    if (L) stepLick(dt);
    stepStrings(dt);
    stepDrops(dt);
    stepSplashes(dt);
  }

  // Compile every program it needs now (the tongue's physical material, the liquid shaders with instancing, the
  // shadow pass, the env's PMREM) by rendering one frame with all its pieces present but empty.
  function warm(renderer, camera) {
    let root = object3d; while (root.parent) root = root.parent;
    const inst = [drops, crowns, puddles, bubbles], counts = inst.map((m) => m.count);
    const was = [tongue.visible, strings.visible], scale = tongue.scale.x;
    tongue.visible = true; strings.visible = true; tongue.scale.setScalar(1e-6);
    M4.makeScale(1e-6, 1e-6, 1e-6);
    for (const m of inst) { m.setMatrixAt(0, M4); m.count = Math.max(1, m.count); m.instanceMatrix.needsUpdate = true; }
    try {
      renderer.compile(root, camera);
      if (root.isScene) renderer.render(root, camera);
    } finally {
      tongue.visible = was[0]; strings.visible = was[1]; tongue.scale.setScalar(scale);
      inst.forEach((m, k) => { m.count = counts[k]; });
    }
    // and run the lick's code once, silently, so its first real frame isn't spent warming up the JavaScript
    if (!L) {
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
    drops.count = crowns.count = puddles.count = bubbles.count = 0;
    strings.visible = false;
  }
  function stop() {
    if (L) { const l = L; L = null; l.resolve(); }
    tongue.visible = false;
    clearFx();
  }

  function dispose() {
    stop();
    object3d.removeFromParent();
    fx.removeFromParent();
    for (const o of owned) o.dispose?.();
  }

  return { object3d, fx, lick, update, warm, stop, dispose, get busy() { return !!L; } };
}

// ---------------------------------------------------------------- shapes
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const backOut = (t) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);

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


// A splash crown: a thin jagged open cup (alternate tall and short points), unit radius and height.
function crownGeometry(THREE) {
  const n = 8, pos = [];
  const top = (k) => { const a = (k / (2 * n)) * Math.PI * 2, tall = k % 2 === 0; const r = tall ? 1.08 : 0.9; return [Math.cos(a) * r, tall ? 1 : 0.38, Math.sin(a) * r]; };
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
    float band = smoothstep(0.52, 0.66, vEdge) * (1.0 - smoothstep(0.74, 0.84, vEdge));
    float hl = band * smoothstep(0.1, 0.7, side);
    float ol = smoothstep(0.8, 0.95, vEdge);
    col = mix(col, uEdge, ol); a = mix(a, uEdgeAlpha, ol);
    col = mix(col, vec3(1.0), hl); a = max(a, hl * 0.95);
  #else
    vec3 v = normalize(vV);
    vec3 n = normalize(vN);
    if (!gl_FrontFacing) n = -n;
    float rim = 1.0 - abs(dot(n, v));
    float ed = smoothstep(0.5, 0.8, rim);
    #ifdef CROWN
      float tipW = smoothstep(0.5, 1.0, vH);
      ed = max(ed * 0.7, 0.0);
      col = mix(col, vec3(1.0), tipW * 0.6); a = mix(a, 0.85, tipW);
    #endif
    col = mix(col, uEdge, ed); a = mix(a, uEdgeAlpha, ed);
    float spec = max(dot(n, normalize(normalize(vec3(-0.5, 0.75, 0.6)) + v)), 0.0);
    float dotH = smoothstep(0.935, 0.965, spec);
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

// A studio to reflect: dim surroundings and a few bright softboxes (HDR), so the wet coat gets crisp streaks.
// The renderer turns it into a PMREM on first use (no renderer needed here).
function makeEnv(THREE) {
  const W = 256, H = 128, data = new Uint16Array(W * H * 4), toH = THREE.DataUtils.toHalfFloat;
  const boxes = [
    [-0.42, 0.78, 0.46, 0.09, 0.07, 40],  // key: small and hard, up and to the left, like the sun
    [-0.75, 0.12, 0.65, 0.03, 0.45, 14],  // a tall thin strip front-left: a wet streak down whatever stands up
    [0.1, 0.55, 0.85, 0.55, 0.025, 10],   // a long thin strip high in front: a streak along whatever lies down
    [0.15, 1, 0.1, 0.1, 0.1, 8],          // a box overhead
    [0.1, 0.25, -1, 0.5, 0.04, 5],        // a thin strip at the back: rims
    [-0.15, 0.34, 1, 0.08, 0.05, 55],     // a small hard light by the player: a wet streak down any curve that faces them
    [0.1, -0.3, 1, 0.6, 0.13, 2.2],       // the white floor in front, soft and broad: a sheen on whatever faces the player
  ].map(([x, y, z, w, h, i]) => {
    const c = new THREE.Vector3(x, y, z).normalize();
    const r = new THREE.Vector3().crossVectors(c, new THREE.Vector3(0, 1, 0)).normalize();
    const u = new THREE.Vector3().crossVectors(r, c);
    return { c, r, u, w, h, i };
  });
  const d = new THREE.Vector3();
  for (let v = 0; v < H; v++) {
    const phi = ((v + 0.5) / H - 0.5) * Math.PI, cp = Math.cos(phi), sp = Math.sin(phi);
    for (let u = 0; u < W; u++) {
      const th = ((u + 0.5) / W - 0.5) * Math.PI * 2;
      d.set(Math.cos(th) * cp, sp, Math.sin(th) * cp);
      let L = d.y > 0 ? 0.12 + 0.08 * d.y : 0.12 - 0.06 * Math.min(1, -d.y * 2);
      for (const b of boxes) {
        const f = d.dot(b.c);
        if (f <= 0.1) continue;
        const ax = Math.abs(Math.atan2(d.dot(b.r), f)), ay = Math.abs(Math.atan2(d.dot(b.u), f));
        L += b.i * (1 - smooth(b.w * 0.75, b.w, ax)) * (1 - smooth(b.h * 0.7, b.h, ay));
      }
      const k = (v * W + u) * 4, hv = toH(L);
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
