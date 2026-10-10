// The monster's tongue, made from the owner's 3D model: a sculpted, glossy, pink-red tongue with taste buds and a
// groove down the middle (assets/3d/tongue-model.glb, built by dev/models/tongue-rig.py from the owner's FBX: relaxed
// out of its S-twist into a gently curved, left-right symmetric rest pose, a stalk added at the root, skinned to a
// chain of 17 short bones, with twin bones along the front that cup the tip).
// The lid has slammed shut on the paper. A beat; then something shoves the lid's FRONT edge up from inside and the
// tongue SQUEEZES OUT through the thin gap between the rim and the lid: crushed flat where it passes the gap
// (toothpaste through a slot), it rounds out gradually outside and flops down over the front; the tip has a taste (it
// curls up, its underside showing, and wiggles). Then it licks, every beat a different silhouette from the throw camera,
// its top (the groove, the taste buds) toward the viewer most of the time:
//   - the big LICK: it winds off to the viewer's left, sweeps across under itself and curls up the right side of the
//     lid's front, the tip hooking round the lid's front corner (the lid heaves up ~11 degrees), holds a beat, drags
//     back down;
//   - SLAPS flat onto the bin's front (the lid hops);
//   - ROLLS: twists over about its own length (the underside shows) as it sweeps off to the left; sweeps back across
//     to the right, rolling back over, the tip curling up the right side (the lid hops), then back to the left, the tip
//     curling up the left side (a hop);
//   - FLICKS the tip across; CHATTERS (wags side to side, twisting; the lid rattles on it);
//   - is SLURPED back in through the gap, squeezed flat again; that throws the lid up, and it claps shut and bounces.
// The LID RIDES ON IT: a hinged plate with weight, not keyframed. Between moves the tongue holds it barely open (~2
// degrees: it relaxes, the gap is thin); on the big beats it jolts up in the gap and throws the lid: it flies (to
// 10-11 degrees on the big lick, 7-8 on the slap and the sweeps), falls back and knocks on the tongue; when the tongue
// has gone it claps on the rim and bounces once. The tongue never goes through the lid, the rim or the bin (in the gap
// a vertex clamp in the shader makes it exact; out of it, the bones are kept off the bin and the lid).
// Animated here, not baked: keyframed bends at every joint chased by springs (the tip lags, whips and overshoots). Each
// joint bends at most so far that the bend stays wider than the tongue there (no edge folding through itself), and
// twists are spread along its length (no candy-wrapping).
// Spit squirts out of the gap beside the tongue, flies off the fast moves (milky beads; one that flies into the tongue
// is gone), falls and splashes on the floor (a crown, a few droplets, a puddle that dries away) or lands on the lid (a
// faint wet spot riding on it); strings of spit stretch across the gap as the lid pops and where the tongue peels off
// the bin or the lid, and snap.
//
//   import { createTongue } from '/assets/intro/tongue-model.js';
//   const tongue = createTongue(THREE, { fxParent: scene });  // returns at once; its model (~0.37 MB) loads behind
//   bin.add(tongue.object3d);                   // a parent with no rotation/scale of its own
//   tongue.object3d.position.set(0, 0.78, 0);   // the centre of the opening, on the rim plane
//   await tongue.ready;                         // optional: the model has arrived (rejects if it can't load)
//   tongue.warm(renderer, camera);              // once, after it is in the scene (see warm below)
//   tongue.update(dt);                          // every frame, always (the drips outlive the lick); dt in seconds
//   // the lid slams shut on the paper and has settled; then (lidGroup: the lid's pitch group at its hinge):
//   await tongue.lick({ lid: (p) => { lidGroup.rotation.x = p; } });   // 2.82 s at speed 1 (don't open the lid yourself)
//   // the lid is shut again (the last lid() call was exactly 0): carry on
// `const tongue = await createTongue(...)` works too (it is not a promise; await just hands it back).
//
// Coordinates: bin units (1 unit ~ the bin's height). object3d's origin is the centre of the opening on the rim
// plane, +y up, +z toward the front (the camera). The floor is at local y = -rimY. The lid (as in assets/3d/bin.glb):
// hinged at (0, 0, -0.5) here, 1.0 deep, its front edge flush with the rim's front (z = 0.5); pitch 0 = shut, < 0 =
// open (rotation.x of a group at the hinge); its front edge is then lifted by sin(-pitch). The tongue lives in the bin
// under the lid (drawn sinking into the dark there; the hidden part runs down the inside of the front wall and back
// along the bottom, well clear of the front wall, within the intro's black monster block) and comes out only through
// the gap at the front: it reaches (measured every 1/30 s, both mirror sides) 0.20 above the rim, 0.54 in front of
// the rim (z up to 1.04), 0.67 below the rim down the bin's front, and 0.72 to either side (0.17 past the bin's side, on
// the big lick). Hidden until lick(); hidden again when it resolves.
// It is staged for the throw camera (and the throw camera backed off on a portrait phone, where it still reads): it
// works in the plane of the bin's front, so its shapes read from in front; the front camera sees it all too.
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
//                              time) for it, then gives up (the promise resolves, nothing shows, lid() is never called)
//   onCue    (name, info) => {} for sounds. Times in seconds after lick() at speed 1 (measured at 60 fps, +-1 frame; at
//                              speed s divide by s):
//                              'pop'      0.25             the lid's front edge is shoved up from inside (a thunk)
//                              'squeeze'  0.28             the tongue squeezes out through the gap (a wet squelch)
//                              'lick'     { strength } 0.78 (1: the big lick, sweeping up to the lid's corner; the lid
//                                                      flies), 1.52 (0.7: the sweep back to the right), 1.77 (0.6: the
//                                                      sweep to the left), 2.13 and 2.25 (0.3: the chatter)
//                              'slap'     { strength } 1.10 (1: it falls flat onto the bin's front)
//                              'roll'     1.22             it starts to twist over
//                              'flick'    1.98             the tip flicks across
//                              'slurp'    2.38             sucked back in through the gap
//                              'clap'     { strength } the lid lands on the rim: 2.67 (0.93: it shuts) and once more
//                                                      after its bounce, 2.80 (0.43)
//                              'rattle'   { strength } the lid, thrown up, lands back on the tongue (a knock): 7 a
//                                                      lick: 0.40 (0.37), 1.07 (0.85), 1.32 (0.77), 1.75 (0.77), 2.00
//                                                      (0.74), 2.15 (0.53), 2.33 (0.32) (weaker ones, < 0.25, and any
//                                                      within 0.1 s of the last, are not sent)
//                              'snap'                  a string of spit breaks (4-6 a lick: ~0.32, 0.80, 1.02, 1.25-1.40, 2.52;
//                                                      at most one per 0.12 s)
//                              'splat'    { x, y, z, size } (fx space) a drop lands; at most one per 60 ms
//                              Errors thrown by the hook are swallowed.
// returns {
//   object3d                   the tongue (and, by default, the drips)
//   fx                         the group holding the drops, crowns, puddles and strings
//   ready                      a promise: resolves (to this object) when the model has arrived, rejects if it can't
//                              load (then lick() resolves at once and nothing shows; the procedural tongue is the
//                              fallback)
//   lick({ lid, speed = 1, mirror = false, mode = 'gap' }) => Promise
//                              lid: (pitch) => {}: called every update() while it licks (from the first one), with the
//                              lid pitch it wants (radians, <= 0, 0 = shut; -0.19 at most, the front edge up 0.19):
//                              set the real lid's pitch group's rotation.x to it (the intro must not open the lid
//                              itself). It starts at 0 (call lick() with the lid shut and settled; the first 0.22 s it
//                              holds it at 0, the beat) and the last call is exactly 0. Optional: without it, read
//                              tongue.lidPitch. speed: playback rate. mirror: left and right swapped (exact).
//                              mode: 'gap' (the only staging; anything else is treated as 'gap'). Called while busy:
//                              returns the running lick's promise. Resolves once the lid has clapped shut and settled
//                              (2.82 s at speed 1).
//   lidPitch                   (getter) the lid pitch it wants now (0 when idle)
//   update(dt)                 dt clamped to 0.05; frame-rate independent (springs and the lid stepped at 240 Hz)
//   warm(renderer, camera)     once, after object3d (and fx) are in the scene: compiles every shader it uses, makes
//                              the env's PMREM, uploads the model's textures and the shadow-pass variants by rendering
//                              one frame with its pieces present but too small to see, and runs the lick's code once
//                              silently (no cues, no lid() calls, state restored). Called before the model has arrived,
//                              it is done in the first update() after it arrives (so `await tongue.ready` first if you
//                              want it done during setup). Without it the tongue's first frame stalls (~270 ms in
//                              headless Edge; with it, the worst frame of the lick is under 1 ms).
//   stop()                     for a Skip button: the tongue goes, every drip goes, lid(0) is called once (the lid
//                              shut) and the running lick's promise resolves
//   dispose()                  stop() + removes object3d and fx from their parents and frees its GPU resources
//   busy                       (getter) true while licking (or waiting for the model to lick)
//   debug                      for dev/lab-tongue-model.html; ignore it
// }
// Where the drips live: they are simulated in fx's local space, which matches object3d's at the start of each lick.
// By default fx is a child of object3d. If the intro moves the bin afterwards (rattle) while puddles are still drying
// (up to ~2.2 s), pass opts.fxParent = scene: fx is then added to the scene and placed at object3d's world transform at
// each lick() start, and the drips stay put when the bin moves. Spit on the lid rides on it as lid() says while the
// lick runs and dries within 1.2 s (it does not follow the lid if the intro moves it afterwards).
// Budget: one skinned mesh (10.6k vertices, 17.6k triangles, 33 bones; skinning on the GPU), one draw call each for
// drops, crowns, puddles and strings (a small unlit liquid shader) + the shadow pass for the tongue and the drops.
// Per frame on the CPU: ~0.1 ms (17 joints on springs, the lid, collisions, 33 bone matrices, up to 56 drops, each
// tested against the tongue).
import { GLTFLoader } from '/assets/vendor/three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '/assets/vendor/three/addons/libs/meshopt_decoder.module.js';

const T_END = 2.8;
const LID_G = 15; // the lid's front edge falls like a hinged plate's (3g/2 per unit depth)
// The lid, as the bin model has it (tongue space): hinged at the back of the rim, 1.0 deep; a band 0.11 thick (its
// front face 0.077, sloping back to 0.11) with a raised panel in the middle (0.18); the front corners cut.
const HINGE_Z = -0.5, LID_D = 1.0;

// The lick, keyframed: a row per moment (seconds at speed 1), each with the numbers that have a key there (Hermite
// between keys, flat at a key that is a peak or a valley, so every overshoot is drawn on purpose).
//   out    how much of the tongue is out through the gap (its rest length; 0.77 is all of it but the stalk)
//   reach  what is out, stretched (and thinned) to reach further
//   push   how hard it shoves up in the gap: the height it holds the lid's front edge at (the lid rides on it: thrown
//          up when it rises fast, it flies, falls back and bounces). The tongue is that thick in the gap (squashed).
//   slide  where it comes out along the gap (x)
//   exit   radians: the way it leaves the gap, tipped up (+) or down
//   bend   radians: the bend just outside the gap (- flops down over the front, + rears up toward its top)
//   turn   radians: a bend to the side a little further out, where it is round again (+ to the tongue's left)
//   dpos / dsig  where those bends are (arclength past the gap) and over how long
//   arch   radians per unit length: a bend all along what is out (- down/under, + toward its top)
//   curl   radians: the front third curling toward its top (+) or under (-)
//   yaw    radians per unit length: what is out sweeping to the tongue's left (+) or right (-)
//   hook   radians: the front third bending to its left (+) or right (-)
//   roll   radians: twisted about its own length, 0 at the gap growing to this at the tip (+: rolls its top to its left)
//   wave   radians: a wave running from the gap to the tip (per joint); its phase runs at 'ws' cycles a second
//   cup    radians: the tip's edges rolled up (a spoon)
// Its top (the groove, the taste buds) faces up as it comes out; flopped down the front it faces the camera.
const HIDDEN = { out: 0, reach: 1, push: 0, slide: 0, exit: 0, bend: -0.2, turn: 0, dpos: 0.09, dsig: 0.08, arch: 0, curl: 0, yaw: 0, hook: 0, roll: 0, wave: 0, ws: 2.2, cup: 0.15 };
// (Seen from the camera, the tongue hanging down the bin's front shows its top: + turn / yaw / hook / roll then go to
// the viewer's right; mirror swaps them.)
const POSES = [
  [0, HIDDEN],
  [0.22, { push: 0, out: 0 }],                                           // the beat: the lid shut, nothing
  // POP: shoved up from inside, the lid's front edge pops; the tip squeezes out through the gap, flat
  [0.3, { push: 0.06, out: 0.05, bend: -0.3 }],
  // SQUEEZE: out it comes, crushed flat in the gap and rounding out outside; it flops down over the front
  [0.4, { out: 0.22, bend: -1.0, push: 0.055, wave: 0.12 }],
  [0.5, { out: 0.36, bend: -1.4, push: 0.045, curl: 0.2, cup: 0.3, wave: 0.06 }],
  // a taste: the tip curls up (its underside shows) and wiggles
  [0.56, { out: 0.42, curl: 1.1, cup: 0.5, hook: 0, turn: 0, yaw: 0, roll: 0, slide: 0, reach: 1 }],
  [0.61, { hook: 0.45, roll: 0.25 }],
  [0.66, { hook: -0.4, roll: -0.2, curl: 0.8 }],
  // LICK, the big one: winds off to the viewer's left, low...
  [0.72, { hook: 0, roll: 0, curl: -0.2, turn: -0.5, yaw: -0.8, out: 0.55, reach: 1.05, bend: -1.45, push: 0.035, slide: -0.04, cup: 0.3, wave: 0 }],
  // ...sweeps across under itself and up the right side of the lid's front, the tip curling up the lid's corner and
  // hooking over it (the lid heaves); holds there a beat, tasting...
  [0.84, { turn: 1.15, yaw: 2.7, hook: 0.75, curl: 0.1, out: 0.75, reach: 1.24, slide: 0.1, roll: -0.3, push: 0.07 }],
  [0.9, { curl: -0.45, yaw: 3.0, hook: 0.95, roll: -0.35 }],
  [0.97, { curl: -0.55, yaw: 2.85, hook: 0.8, push: 0.06 }],
  // ...and drags back down across the front toward the middle
  [1.04, { turn: 0.6, yaw: 0.6, hook: 0.2, curl: 0.4, bend: -1.2, slide: 0.03, roll: 0 }],
  // SLAP: it falls flat onto the bin's front
  [1.11, { turn: 0, yaw: 0, hook: 0, curl: -0.45, bend: -1.7, out: 0.66, reach: 1.05, push: 0.035, slide: 0 }],
  [1.16, { curl: 0.25, bend: -1.5 }],
  // ROLL: it twists over (the underside shows) as it sweeps off to the left...
  [1.19, { roll: 0, turn: 0, yaw: 0, hook: 0, curl: 0.25, slide: 0, reach: 1.05 }],
  [1.38, { roll: -2.2, turn: -0.9, yaw: -1.0, hook: -0.2, curl: -0.4, slide: -0.06, reach: 1.1, push: 0.04 }],
  [1.44, { roll: -2.3, curl: -0.5 }],
  // ...SWEEPS back across to the right, rolling back over, the tip curling up the right side...
  [1.62, { roll: 0.6, turn: 1.1, yaw: 1.3, hook: 0.5, curl: 0.6, slide: 0.06, push: 0.05 }],
  [1.68, { roll: 0.7, curl: 0.9, yaw: 1.5 }],
  // ...and back to the left, the tip curling up the left side
  [1.86, { roll: -0.4, turn: -1.2, yaw: -1.6, hook: -0.6, curl: 0.5, slide: -0.05, out: 0.7, reach: 1.12 }],
  [1.92, { yaw: -1.8, hook: -0.7, curl: 0.7 }],
  // FLICK: the tip whips across
  [1.99, { hook: 1.0, curl: 1.6, yaw: -1.2 }],
  [2.05, { hook: -0.2, curl: 0.2 }],
  // CHATTER: it wags side to side, twisting
  [2.12, { roll: 0.6, turn: 0, yaw: 1.1, hook: 0.7, bend: -1.25, curl: 0.4, slide: 0, out: 0.7, reach: 1.1, push: 0.045 }],
  [2.19, { roll: -0.6, yaw: -1.1, hook: -0.7 }],
  [2.26, { roll: 0.5, yaw: 0.9, hook: 0.6 }],
  [2.33, { roll: -0.3, yaw: -0.5, hook: -0.3 }],
  // SLURP: sucked back in through the gap (squeezed flat again), the tip trailing
  [2.39, { hook: 0, roll: 0, yaw: 0, turn: 0, out: 0.66, reach: 1, bend: -1.1, curl: 0.5, cup: 0.4, push: 0.055, slide: 0 }],
  [2.55, { out: 0.18, bend: -0.2, curl: -0.4, cup: 0.2 }],
  [2.61, { out: 0, curl: 0.2, push: 0.05 }],
  [2.64, { push: 0 }],
  [T_END, { ...HIDDEN }],
];
const CUES = [
  [0.24, 'pop'], [0.27, 'squeeze'], [0.78, 'lick', { strength: 1 }], [1.1, 'slap', { strength: 1 }], [1.21, 'roll'],
  [1.5, 'lick', { strength: 0.7 }], [1.76, 'lick', { strength: 0.6 }], [1.97, 'flick'],
  [2.12, 'lick', { strength: 0.3 }], [2.24, 'lick', { strength: 0.3 }], [2.38, 'slurp'],
];
// kicks: on the big beats the tongue jolts up in the gap for an instant (time, how high it throws the lid's front
// edge above where it holds it, how long the jolt lasts): the lid hops, flies and lands back on it (a 'rattle')
const KICKS = [[0.235, 0.03, 0.06], [0.79, 0.13, 0.08], [1.1, 0.09, 0.07], [1.52, 0.1, 0.07], [1.78, 0.08, 0.07], [2.0, 0.035, 0.05], [2.12, 0.02, 0.05], [2.24, 0.02, 0.05], [2.42, 0.09, 0.07]];
// spit (time, how many, from where): squirted out of the gap beside the tongue as it squeezes, off the tip at the end
// of a move, off the edges as it slaps the bin, a fat drop letting go of the hanging tip
const BURSTS = [[0.3, 4, 'gap'], [0.45, 3, 'gap'], [0.58, 1, 'drool'], [0.88, 4, 'tip'], [1.11, 5, 'slap'], [1.42, 3, 'tip'], [1.66, 3, 'tip'], [1.9, 3, 'tip'], [2.0, 4, 'tip'], [2.4, 4, 'gap'], [2.56, 3, 'gap']];
// strings of spit across the gap, from the rim to the lid's front edge, beside the tongue (time, side): the lid pops
// and they stretch and snap (others come by themselves where the tongue peels off the bin or the lid)
const STRINGS = [[0.25, -1], [0.26, 1], [0.8, -1]];

let TRACKS = null; // (built once the module's constants are all defined)

export function createTongue(THREE, opts = {}) {
  TRACKS ??= buildTracks(POSES);
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
  let silent = false, clock = 0, lastSplat = -1, lastSnap = -1, lastRattle = -1, disposed = false;
  const cue = (name, info) => {
    if (silent) return;
    if (name === 'splat') { if (clock - lastSplat < 0.06) return; lastSplat = clock; }
    if (name === 'snap') { if (clock - lastSnap < 0.12) return; lastSnap = clock; }
    if (name === 'rattle') { if (info.strength < 0.25 || clock - lastRattle < 0.1) return; lastRattle = clock; }
    try { O.onCue?.(name, info); } catch (e) { /* a sound hook must never stop the show */ }
  };
  const V = () => new THREE.Vector3();
  const tracks = TRACKS;

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

  // ------------------------------------------------------------------------------------------ the lid
  // A hinged plate with weight. H: how high its front edge is (= sin of its pitch); the tongue's push holds it up.
  const lid = { H: 0, v: 0, push: 0, on: false, sin: 0, cos: 1, tan: 0, ze: HINGE_Z + LID_D, fn: null };
  function lidAngle() {
    lid.sin = Math.min(0.6, Math.max(0, lid.H) / LID_D); lid.cos = Math.sqrt(1 - lid.sin * lid.sin);
    lid.tan = lid.sin / lid.cos; lid.ze = HINGE_Z + LID_D * lid.cos;
  }
  const lidPitch = () => -Math.asin(lid.sin);
  // lid space (x, up from its underside, along from the hinge) <-> tongue space
  const toRig = (l, out) => out.set(l.x, l.y * lid.cos + l.z * lid.sin, HINGE_Z - l.y * lid.sin + l.z * lid.cos);
  const toLid = (p, out) => { const y = p.y, z = p.z - HINGE_Z; return out.set(p.x, y * lid.cos - z * lid.sin, y * lid.sin + z * lid.cos); };
  function lidStep(h, p, t) { // p: the tongue's push now (0: not in the gap); t: the lick's time at the end of the step
    const pv = h > 0 ? (p - lid.push) / h : 0;
    lid.push = p;
    // a kick: if the lid is riding on the tongue, it is thrown up to fly about kick's h higher
    for (const [t0, kh] of KICKS) if (t0 > t - h && t0 <= t && p > 0 && lid.H <= p + 0.012) { lid.v = Math.max(lid.v, Math.sqrt(2 * LID_G * kh)); lid.on = false; lid.H = Math.max(lid.H, p) + 1e-4; }
    lid.v -= LID_G * h; lid.H += lid.v * h;
    if (p > 0 && lid.H <= p) { // on the tongue
      if (!lid.on) { const s = pv - lid.v; if (s > 0.3) cue('rattle', { strength: Math.min(1, s / 2.2) }); lid.v = pv + (s > 0.3 ? 0.3 * s : 0); }
      else lid.v = Math.max(lid.v, pv);
      lid.H = p; lid.on = true;
    } else if (lid.H > p + 1e-4) lid.on = false;
    if (lid.H <= 0) { // on the rim
      if (lid.v < -0.25) cue('clap', { strength: Math.min(1, -lid.v / 2.2) });
      lid.v = lid.v < -1 ? -0.48 * lid.v : 0; // (a hard landing bounces once; a soft one stays put)
      lid.H = 0;
    }
  }
  const tellLid = () => { if (silent || !lid.fn) return; try { lid.fn(lidPitch()); } catch (e) { /* the intro's business */ } };

  // ------------------------------------------------------------------------------------------ wet things
  // Spit is a cartoon liquid (its own little unlit shader): a light body, a darker blue-grey edge so it reads on the
  // white page, a crisp white highlight dot and a soft bounce. The drops are milky and nearly opaque, shaded darker
  // underneath (beads of spit, not see-through bubbles).
  const liquid = (o) => { const m = liquidMaterial(THREE, o); owned.push(m); return m; };
  const dropMat = liquid({ tint: 0xf1f5f9, edge: 0x71859f, alpha: 0.9, edgeAlpha: 0.95, defines: { DROP: '' } });
  const crownMat = liquid({ tint: 0xe3eaf3, edge: 0x6a7f9a, alpha: 0.3, edgeAlpha: 0.9, defines: { FADE: '', CROWN: '' }, side: THREE.DoubleSide });
  const puddleMat = liquid({ tint: 0xb6c6da, edge: 0x6f86a3, alpha: 0.5, edgeAlpha: 0.92, defines: { FADE: '', PUDDLE: '' } });
  puddleMat.polygonOffset = true; puddleMat.polygonOffsetFactor = -2; puddleMat.polygonOffsetUnits = -2;
  const stringMat = liquid({ tint: 0xe6edf5, edge: 0x6a809c, alpha: 0.55, edgeAlpha: 0.95 });

  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), Q2 = new THREE.Quaternion(), V1 = V(), V2 = V(), V3 = V(), SC = V();
  const UP = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0), Y = UP, Z = new THREE.Vector3(0, 0, 1);
  const instanced = (geo, m, n, fade) => {
    if (fade) geo.setAttribute('aFade', new THREE.InstancedBufferAttribute(new Float32Array(n).fill(1), 1).setUsage(THREE.DynamicDrawUsage));
    const im = new THREE.InstancedMesh(geo, m, n);
    im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    im.frustumCulled = false; im.count = 0;
    fx.add(im); owned.push(geo);
    return im;
  };
  const MAXD = 56, MAXC = 16, MAXP = 28, MAXS = 6;
  const puddles = instanced(puddleGeometry(THREE, rng), puddleMat, MAXP, true);
  puddles.renderOrder = 1;
  const crowns = instanced(crownGeometry(THREE), crownMat, MAXC, true);
  crowns.renderOrder = 2;
  const drops = instanced(new THREE.IcosahedronGeometry(1, 2), dropMat, MAXD);
  drops.castShadow = O.shadows; drops.renderOrder = 3;

  const D = [], C = [], PD = [], STR = [];
  for (let k = 0; k < MAXD; k++) D.push({ on: false, p: V(), v: V(), r: 0, kind: 0, age: 0 });
  for (let k = 0; k < MAXC; k++) C.push({ on: false, p: V(), t: 0, life: 0.3, R: 0, H: 0, rot: 0 });
  for (let k = 0; k < MAXP; k++) PD.push({ on: false, p: V(), t: 0, life: 2, R: 0, rot: 0, onLid: false, l: V() });
  const take = (pool, age) => { let best = null; for (const o of pool) { if (!o.on) return o; if (!best || age(o) > age(best)) best = o; } return best; };
  function spawnDrop(p, v, r, kind = 0) {
    const d = take(D, (o) => o.age);
    d.on = true; d.p.copy(p); d.v.copy(v); d.r = Math.min(r * 0.8, 0.018); d.kind = kind; d.age = 0;
    const sp = d.v.length(); if (sp > 5) d.v.multiplyScalar(5 / sp);
  }
  function puddle(x, y, z, R0, life, onLid = false) {
    const p = take(PD, (o) => o.t);
    p.on = true; p.p.set(x, y + 0.002, z); p.t = 0; p.life = life; p.R = R0; p.rot = rng() * 6.28; p.onLid = onLid;
    if (onLid) toLid(p.p, p.l); // it rides on the lid
  }
  function splash(x, y, z, r, speed, onLid) {
    const big = r * (0.75 + 0.1 * Math.min(6, speed));
    if (r > 0.01 && !onLid) { // a crown and droplets thrown from its points (on the lid: just the puddle)
      const c = take(C, (o) => o.t);
      c.on = true; c.p.set(x, y, z); c.t = 0; c.life = 0.24 + 0.08 * rng(); c.R = big * 2.4; c.H = big * (1.7 + 0.5 * rng()); c.rot = rng() * 6.28;
      const n = r > 0.02 ? 4 : r > 0.014 ? 3 : 2;
      for (let k = 0; k < n; k++) {
        const a = rng() * 6.28, out = 0.5 + rng() * 0.9;
        spawnDrop(V1.set(x + Math.cos(a) * c.R * 0.8, y + c.H * 0.5, z + Math.sin(a) * c.R * 0.8), V2.set(Math.cos(a) * out, 0.9 + rng() * 1.1, Math.sin(a) * out), r * (0.3 + 0.15 * rng()), 1);
      }
    }
    puddle(x, y, z, Math.min(onLid ? 0.05 : 0.14, r * (2.3 + 0.35 * Math.min(6, speed))), onLid ? 0.8 + rng() * 0.4 : 1.5 + rng() * 0.7, onLid);
    cue('splat', { x, y, z, size: r });
  }

  // strings of spit: one indexed mesh, 6 strings of 12 x 6. Each end is on the tongue (a bone and a point in its
  // frame), on the lid (lid space) or fixed (on the bin).
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
  const end = () => ({ t: 'fix', k: 0, l: V() });
  for (let k = 0; k < MAXS; k++) STR.push({ on: false, ea: end(), eb: end(), a: V(), b: V(), av: V(), t: 0, snapAt: -1, snapLen: 0.3, life: 0.45, sag: 0, bead: 0.5, ph: 0, thin: 1 });

  // ------------------------------------------------------------------------------------------ the tongue (its model)
  // Everything below is filled in by build() when the GLB arrives.
  let mesh = null, mat = null, failed = null, pendingWarm = null;
  let NJ = 0, L = 1, STALK = 0, restP = [], restQ = [], restLen = [], hw = [], hh = [], sAt = [], relQ = [];
  let cupInfo = [], chainBones = [], cupBones = [], springF = [], curlN = [], uCrush = null, skinJoint = [];
  let pos = [], rot = [], rotInv = [], blen = null, tgtP, tgtY, tgtR, angP, angY, angR, velP, velY, velR, kz, kw;
  let contact, wasContact, cpt, cnr, conLid, cType;
  let tipPin = null, EMIT = [], emitPrev = [], emitAcc = new Float32Array(0);
  const par = { out: 0, reach: 1, push: 0, slide: 0, exit: 0, bend: 0, turn: 0, dpos: 0.06, dsig: 0.05, arch: 0, curl: 0, yaw: 0, hook: 0, roll: 0, wave: 0, ws: 0, cup: 0 };
  let phase = 0, sx = 1, primed = false, uSlot = 0, kSlot = 0;
  const slot = { p: V(), q: new THREE.Quaternion(), along: V(), top: V() };

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
    // highlights; the colour map tinted toward a meatier red; under the lid and in the bin it sinks into the black
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
    const uLid = { value: new THREE.Vector4(0, lid.ze, 0, 0) };
    // how crushed each bone is (0: round .. 1: flat), per skin joint
    const NB_ALL = bones.length;
    uCrush = { value: new Float32Array(NB_ALL) };
    skinJoint = jointOfBone;
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uHole = { value: new THREE.Vector3(OX, OZ, UX) };
      sh.uniforms.uStalk = { value: STALK };
      sh.uniforms.uLid = uLid;
      sh.uniforms.uCrush = uCrush;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>\nattribute vec2 aWhere;\nvarying vec3 vRig;\nvarying vec2 vWhere;\nvarying float vCrush;\nuniform vec4 uLid;\nuniform vec3 uHole;\nuniform float uCrush[${NB_ALL}];`)
        // the bones are scaled unevenly (crushed flat in the gap): normals by the inverse transpose
        .replace('#include <skinnormal_vertex>', `#ifdef USE_SKINNING
          mat4 skinMatrix = mat4(0.0);
          skinMatrix += skinWeight.x * boneMatX; skinMatrix += skinWeight.y * boneMatY;
          skinMatrix += skinWeight.z * boneMatZ; skinMatrix += skinWeight.w * boneMatW;
          skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
          objectNormal = transpose(inverse(mat3(skinMatrix))) * objectNormal;
          #endif`)
        // in the gap it can't be thicker than the gap: under the lid, never above its underside; over the rim's front,
        // never below its top (the bones do nearly all of it; this makes it exact)
        .replace('#include <skinning_vertex>', `#include <skinning_vertex>
          // A ceiling (the lid's underside) and a floor (the rim's top), both faded in over a little way (from the lid's
          // front edge, from the rim's edges) and continuous: what pokes through a little is pressed onto them; what is
          // deeper (hidden in the lid or the rim) is eased back to where it was, so nothing tears or steps. (Just
          // behind the lid's front edge, what is only partly pressed is hidden by the lid's front face.)
          if (uLid.z > 0.5) {
            float zr = transformed.z - uLid.y, ax = abs(transformed.x);
            float fade = (1.0 - smoothstep(0.5, 0.56, ax)) * smoothstep(0.0, -0.025, zr);
            if (fade > 0.0) {
              float yTop = (transformed.z + 0.5) * uLid.x - 0.004;
              float o = transformed.y - yTop;
              if (o > 0.0) transformed.y -= fade * (o < 0.04 ? o : max(0.0, 0.04 - (o - 0.04)));
            }
            float fb = (1.0 - smoothstep(0.54, 0.58, ax)) * smoothstep(0.515, 0.49, transformed.z) * smoothstep(uHole.y - 0.012, uHole.y + 0.002, transformed.z);
            if (fb > 0.0) {
              float u = 0.004 - transformed.y;
              if (u > 0.0) transformed.y += fb * (u < 0.04 ? u : max(0.0, 0.04 - (u - 0.04)));
            }
          }
          float cr = 0.0;
          cr += skinWeight.x * uCrush[int(skinIndex.x)]; cr += skinWeight.y * uCrush[int(skinIndex.y)];
          cr += skinWeight.z * uCrush[int(skinIndex.z)]; cr += skinWeight.w * uCrush[int(skinIndex.w)];
          vCrush = cr;`)
        .replace('#include <project_vertex>', 'vRig = transformed;\nvWhere = aWhere;\n#include <project_vertex>');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vRig;\nvarying vec2 vWhere;\nvarying float vCrush;\nuniform vec3 uHole;\nuniform float uStalk;\nuniform vec4 uLid;')
        // crushed flat in the gap it is dull, not glazed (no hard wet glints on the squeezed flanges)
        .replace('#include <lights_physical_fragment>', `#include <lights_physical_fragment>
          material.clearcoat *= 1.0 - 0.85 * vCrush;
          material.roughness = mix(material.roughness, max(material.roughness, 0.55), vCrush);`)
        // the underside: a deeper, richer red than the pale pink baked into the map
        .replace('#include <map_fragment>', `#include <map_fragment>
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.92, 0.6, 0.62), smoothstep(-0.05, -0.65, vWhere.x));`)
        // the studio lights the gloss more than the flesh: a deep, wet red rather than a bright pink
        .replace('#include <lights_fragment_maps>', '#include <lights_fragment_maps>\niblIrradiance *= 0.35;')
        // inside the opening, below the rim, it sinks into the black of the bin; under the lid, into the dark of the
        // gap; the stalk (the throat) is dark anywhere
        .replace('#include <opaque_fragment>', `
          float inHole = (1.0 - smoothstep(uHole.x - 0.05, uHole.x + 0.01, abs(vRig.x))) * (1.0 - smoothstep(uHole.y - 0.05, uHole.y + 0.01, abs(vRig.z)));
          outgoingLight *= mix(1.0, mix(0.02, 1.0, smoothstep(-0.26, 0.01, vRig.y)), inHole);
          // (as dark as it is deep under the lid for how far the lid is open)
          float underLid = uLid.w * (1.0 - smoothstep(0.49, 0.53, abs(vRig.x))) * smoothstep(uLid.y + 0.006, uLid.y - 0.07 - 1.5 * uLid.x, vRig.z) * smoothstep(-0.06, -0.01, vRig.y);
          outgoingLight *= mix(1.0, 0.025, underLid);
          outgoingLight *= mix(0.06, 1.0, smoothstep(uStalk - 0.14, uStalk + 0.06, vWhere.y));
          #include <opaque_fragment>`);
    };
    mat.userData.uLid = uLid;
    mat.customProgramCacheKey = () => 'tongue-model-gap-2';
    mat.needsUpdate = true;

    // the chain's state
    pos = Array.from({ length: NJ + 1 }, V); rot = Array.from({ length: NJ }, () => new THREE.Quaternion());
    rotInv = Array.from({ length: NJ }, () => new THREE.Quaternion()); blen = new Float32Array(NJ);
    const f32 = () => new Float32Array(NJ);
    tgtP = f32(); tgtY = f32(); tgtR = f32(); angP = f32(); angY = f32(); angR = f32(); velP = f32(); velY = f32(); velR = f32();
    kz = f32().fill(1); kw = f32().fill(1);
    contact = new Uint8Array(NJ + 1); wasContact = new Uint8Array(NJ + 1); conLid = new Uint8Array(NJ + 1); cType = new Uint8Array(NJ + 1);
    cpt = Array.from({ length: NJ + 1 }, V); cnr = Array.from({ length: NJ + 1 }, V);
    // the front third (curl, hook, cup) by arclength; springs softer toward the tip
    const curlW = sAt.map((s) => smooth(STALK + 0.5 * (L - STALK), L - 0.04, s));
    const t = curlW.reduce((a, b) => a + b, 0) || 1;
    curlN = curlW.map((x) => x / t);
    springF = sAt.map((s) => 9 - 4.5 * smooth(STALK, L, s));
    // points on the tongue, carried by their bones: the tip, the edges of the front, the top (spit flies off them)
    tipPin = pin(NJ - 1, new THREE.Vector3(0, restLen[NJ - 1] + 0.03, 0.01));
    const ek = (f) => Math.round(NJ - 1 - f * (NJ - 1 - 3));
    EMIT = [
      [tipPin, 2.2],
      [pin(ek(0.12), new THREE.Vector3(hw[ek(0.12)] * 0.95, 0, 0)), 0.8], [pin(ek(0.12), new THREE.Vector3(-hw[ek(0.12)] * 0.95, 0, 0)), 0.8],
      [pin(ek(0.3), new THREE.Vector3(hw[ek(0.3)] * 0.95, 0, 0)), 0.5], [pin(ek(0.3), new THREE.Vector3(-hw[ek(0.3)] * 0.95, 0, 0)), 0.5],
      [pin(ek(0.45), new THREE.Vector3(0, 0, hh[ek(0.45)])), 0.3],
    ];
    emitPrev = EMIT.map(() => V()); emitAcc = new Float32Array(EMIT.length);
    evalPose(0); lid.H = 0; lidAngle(); targets(); settle(); solve();
    mesh = m; // now it can lick
  }

  const ready = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(O.url).then((gltf) => {
    if (!disposed) build(gltf);
    return api;
  });
  ready.catch((e) => { failed = e || new Error('tongue-model: could not load ' + O.url); if (!disposed) console.warn('tongue-model:', failed); });

  // ------------------------------------------------------------------------------------------ posing the chain
  function evalPose(t) {
    for (const k in tracks) par[k] = tracks[k](t);
    par.push = pushAt(t);
    par.slide *= sx; par.turn *= sx; par.yaw *= sx; par.hook *= sx; par.roll *= sx;
    par.out = clamp(par.out, 0, L - STALK - 0.02); par.push = Math.max(0, par.push);
  }

  // The bend at every joint out of the gap (pitch: toward the top +, yaw: to the tongue's left +, roll: about its
  // length): targets from the keys, and the bends actually drawn, which chase them on springs: softer toward the tip,
  // so the tip lags, whips and overshoots. Joints still in the gap or behind it take their targets at once.
  const ZETA = 0.42, ROUND_AT = 0.24;
  function targets() {
    uSlot = L - par.out;
    let dw = 0, full = 0, rw = 0, tw = 0;
    for (let k = 1; k < NJ; k++) {
      const d = sAt[k] - uSlot, gw = Math.exp(-0.5 * ((d - par.dpos) / par.dsig) ** 2);
      tgtY[k] = d > 0 ? gw : 0; dw += tgtY[k]; full += gw;
      // (rolls and turns to the side happen where it is round again, not where it is still a flat ribbon; a turn
      // over a few joints, a roll spread evenly over all the rest, so no joint twists much: no candy-wrapping)
      // (spread over ~0.25 of its length: a wide, flat tongue bent sideways too tightly folds its inner edge through)
      tgtP[k] = Math.exp(-0.5 * ((d - ROUND_AT) / 0.11) ** 2) * smooth(0.07, 0.16, d); tw += tgtP[k];
      tgtR[k] = smooth(0.05, 0.32, d) * restLen[k - 1]; rw += tgtR[k];
    }
    dw = Math.max(dw, 0.5 * full, 1e-6); rw = Math.max(rw, 1e-6); tw = Math.max(tw, 1e-6);
    for (let k = 1; k < NJ; k++) {
      const d = sAt[k] - uSlot, len = restLen[k - 1], out = smooth(0, 0.05, d), en = smooth(0, 0.25, d);
      const wv = par.wave * en * Math.sin(2 * Math.PI * (d / 0.5 - phase));
      const gw = tgtY[k], twk = tgtP[k];
      tgtP[k] = par.bend * gw / dw + (par.arch * len + par.curl * curlN[k]) * out + wv;
      tgtY[k] = par.turn * twk / tw + (par.yaw * len + par.hook * curlN[k]) * out + 0.45 * par.wave * en * Math.sin(2 * Math.PI * (d / 0.65 - 0.8 * phase) + 1.3) * sx;
      tgtR[k] = par.roll * tgtR[k] / rw;
    }
  }
  function springs(dt) {
    const n = Math.max(1, Math.ceil(dt / (1 / 240))), h = dt / n;
    for (let i = 0; i < n; i++) {
      for (let k = 1; k < NJ; k++) {
        if (sAt[k] <= uSlot) { angP[k] = tgtP[k]; angY[k] = tgtY[k]; angR[k] = tgtR[k]; velP[k] = velY[k] = velR[k] = 0; continue; }
        const w = 2 * Math.PI * springF[k], w2 = w * w, c = 2 * ZETA * w;
        velP[k] += (w2 * (tgtP[k] - angP[k]) - c * velP[k]) * h; angP[k] += velP[k] * h;
        velY[k] += (w2 * (tgtY[k] - angY[k]) - c * velY[k]) * h; angY[k] += velY[k] * h;
        velR[k] += (w2 * (tgtR[k] - angR[k]) - c * velR[k]) * h; angR[k] += velR[k] * h;
      }
      lidStep(h, pushAt(subT0 + (i + 1) * h), subT0 + (i + 1) * h); // (the lid too, at the same substeps of the lick's time)
    }
  }
  const settle = () => { angP.set(tgtP); angY.set(tgtY); angR.set(tgtR); velP.fill(0); velY.fill(0); velR.fill(0); };
  let subT0 = 0; // the lick's time at the start of this step

  // The part in the bin: from the gap back along under the lid, over the inner lip, down the inside of the front wall
  // and back along the bottom, in the dark. q: distance behind the gap.
  // (it turns down well behind the inner lip and runs down well clear of the front wall: the bin tapers, and the
  // stalk is wide)
  const ARC = 0.12, DOWN = 0.24, BACK = 0.4;
  const XL = new THREE.Vector3(1, 0, 0), QI = new THREE.Quaternion();
  function inside(q, outP, outQ) { // (outQ must not be QI)
    const q1 = Math.max(0.02, lid.ze - OZ + 0.06), qa = q1 + ARC * Math.PI / 2, qb = qa + DOWN, qc = qb + ARC * Math.PI / 2;
    const A = slot.along, T = slot.top;
    let ang = 0;
    outP.copy(slot.p).addScaledVector(A, -Math.min(q, q1));
    if (q > q1) { // over the inner lip, turning down
      const b = Math.min(q - q1, qa - q1) / ARC;
      outP.addScaledVector(T, ARC * (Math.cos(b) - 1)).addScaledVector(A, -ARC * Math.sin(b)); ang = b;
    }
    if (q > qa) outP.addScaledVector(T, -(Math.min(q, qb) - qa)); // down the wall
    if (q > qb) { // turning back along the bottom
      const c = Math.min(q - qb, qc - qb) / ARC;
      outP.addScaledVector(A, ARC * (Math.cos(c) - 1)).addScaledVector(T, -ARC * Math.sin(c)); ang = Math.PI / 2 - c;
    }
    if (q > qc) outP.addScaledVector(A, -BACK * Math.tanh((q - qc) / BACK)); // back along the bottom (bunched up there)
    outP.x = slot.p.x * (1 - smooth(0.1, 0.5, q));
    outQ.copy(slot.q).multiply(QI.setFromAxisAngle(XL, ang));
  }

  const eul = new THREE.Euler(), dbg = { collide: true };
  const CL = 0.004; // clearance in the gap
  function solve() {
    lidAngle();
    // the gap: where the tongue passes the lid's front edge, its spine half way up what it holds the lid at
    const push = Math.max(par.push, 2 * CL + 0.012);
    const e = par.exit + 0.5 * Math.atan(lid.tan);
    slot.along.set(0, Math.sin(e), Math.cos(e)); slot.top.set(0, Math.cos(e), -Math.sin(e));
    slot.q.setFromRotationMatrix(M4.makeBasis(V1.crossVectors(slot.along, slot.top), slot.along, slot.top));
    slot.p.set(par.slide, push / 2, lid.ze);
    uSlot = L - par.out;
    let ks = 0;
    while (ks < NJ - 1 && sAt[ks + 1] <= uSlot) ks++;
    kSlot = ks;
    const f = clamp((uSlot - sAt[ks]) / restLen[ks], 0, 1);
    // what is out, from the gap: the rest frames turned so that the rest frame at the gap lies along it
    Q.copy(restQ[ks]); if (ks + 1 < NJ) Q.slerp(restQ[ks + 1], f);
    rot[ks].copy(slot.q).multiply(Q.invert()).multiply(restQ[ks]);
    const rc = Math.max(0.5, par.reach);
    pos[ks + 1].copy(Y).applyQuaternion(rot[ks]).multiplyScalar(Math.max(0, sAt[ks + 1] - uSlot) * rc).add(slot.p);
    for (let k = ks + 1; k < NJ; k++) {
      // (a wide, flat tongue bent too tightly sideways folds its inner edge through itself: each joint turns at most
      // so far that the bend's radius stays wider than the tongue's half width there; likewise through its thickness)
      const lp = (k - 1 === ks ? Math.max(0.025, sAt[k] - uSlot) : restLen[k - 1]) * rc; // (the bone in the gap is only partly out)
      const ym = lp / (1.15 * hw[k] * kw[k]), pm = lp / (1.1 * hh[k] * kz[k]);
      rot[k].copy(rot[k - 1]).multiply(relQ[k]).multiply(Q.setFromEuler(eul.set(clamp(angP[k], -pm, pm), angR[k], clamp(angY[k], -ym, ym), 'XZY')));
      pos[k + 1].copy(Y).applyQuaternion(rot[k]).multiplyScalar(restLen[k] * rc).add(pos[k]);
    }
    // what is in: along the hidden path
    for (let k = ks; k >= 0; k--) {
      const q = uSlot - sAt[k];
      inside(q, pos[k], Q2);
      if (k < ks) rot[k].copy(Q2);
    }
    if (dbg.collide) collide(ks);
    squash(push);
    // write the bones: each one along its (possibly pushed) chord, scaled (and crushed in the gap)
    for (let k = 0; k < NJ; k++) {
      V1.copy(Y).applyQuaternion(rot[k]);
      V2.subVectors(pos[k + 1], pos[k]);
      const len = V2.length();
      V2.divideScalar(len || 1);
      Q.setFromUnitVectors(V1, V2); rot[k].premultiply(Q);
      SC.set(kw[k], Math.max(0.05, len / restLen[k]), kz[k]);
      chainBones[k].matrix.compose(pos[k], rot[k], SC);
      chainBones[k].matrixWorldNeedsUpdate = true;
    }
    const c0 = cupInfo.length ? cupInfo[0].parent : 0;
    for (let c = 0; c < cupInfo.length; c++) {
      const ci = cupInfo[c];
      // more cup toward the tip
      M4.makeRotationAxis(Y, par.cup * ci.sign * (0.6 + 0.4 * (ci.parent - c0) / Math.max(1, NJ - 1 - c0)));
      cupBones[c].matrix.copy(chainBones[ci.parent].matrix).multiply(M4);
      cupBones[c].matrixWorldNeedsUpdate = true;
    }
    mat?.userData.uLid?.value.set(lid.tan, lid.ze, 1, 1);
    if (uCrush) for (let b = 0; b < skinJoint.length; b++) uCrush.value[b] = smooth(0.62, 0.25, kz[skinJoint[b]]);
    for (let k = kSlot; k < NJ; k++) { rotInv[k].copy(rot[k]).invert(); blen[k] = pos[k].distanceTo(pos[k + 1]); }
  }
  // Is p (object3d space) inside the tongue out of the gap? (each bone an elliptic cylinder, wide across, thin through)
  function inTongue(p) {
    for (let k = kSlot; k < NJ; k++) {
      V3.subVectors(p, pos[k]).applyQuaternion(rotInv[k]);
      if (V3.y < -0.02 || V3.y > blen[k] + 0.02) continue;
      const ex = V3.x / (hw[k] * kw[k]), ez = V3.z / (hh[k] * kz[k]);
      if (ex * ex + ez * ez < 1) return true;
    }
    return false;
  }

  // Crushed in the gap: in the gap it is as thick as the push lets it be (its spine half way up); outside it rounds
  // out gradually (a wedge that swells over SWELL_LEN, not a bulge at the lid's face), and what is out is a touch
  // flatter near the gap than at rest (a stretched tongue), full toward the tip; behind the gap, along under the lid,
  // it stays crushed (a touch thinner where the lid comes down toward the hinge) until it has dropped over the inner
  // lip, then fills out in the dark. Crushed, it spreads sideways a little (MAXW: at most ~0.43 across, ~1.2 times
  // its own width: squeezed flesh, not foil wings).
  const KMIN = 0.12, SWELL_LEN = 0.24, MAXW = 0.215;
  function squash(push) {
    const hs = Math.max(0.005, push / 2 - CL);
    const strip = Math.max(0.02, lid.ze - OZ);
    for (let k = 0; k < NJ; k++) {
      const d = 0.5 * (sAt[k] + (k + 1 < NJ ? sAt[k + 1] : L)) - uSlot; // its middle, past the gap
      // stretched, it thins; deep in the bin it is slim (it fits in there, out of sight)
      const thin = d > 0 ? 1 / Math.sqrt(Math.max(0.5, par.reach)) : 1 - 0.5 * smooth(strip + 0.04, strip + 0.25, -d);
      const full = hh[k] * thin * (0.78 + 0.22 * smooth(0.1, 0.5, d));
      const half = d >= 0 ? hs + (Math.max(hs, full) - hs) * smooth(0, SWELL_LEN, d) : -d < strip ? hs * (1 - 0.12 * (-d / strip)) : hs * 0.88 + 0.5 * Math.max(0, -d - strip - 0.07);
      kz[k] = clamp(half / hh[k], KMIN, thin);
      kw[k] = Math.max(thin, Math.min(Math.pow(1 / kz[k], 0.5), MAXW / hw[k]));    }
  }

  // ------------------------------------------------------------------------------------------ the bin and the lid
  // Out of the gap the tongue lies on the bin and the lid, never through them. Both are prisms (an octagon: a box with
  // its corners cut, extruded): the rim, the body under it, and the lid's band and raised panel (in lid space). Test
  // points along every bone out of the gap are kept at least the tongue's half thickness that way (its cross-section
  // an ellipse: wide across, thinner through) away from them by their distance fields, and each push is shared by the
  // bone's two ends; what hangs beyond is carried along; a few passes settle it.
  const G2 = { x: 0, y: 0 };
  function oct2(px, pz, a, b, c) { // signed distance from (px, pz) (first quadrant) to |x|<=a, |z|<=b, |x|+|z|<=c; G2: way out
    if (px <= a && pz <= b && px + pz <= c) {
      const da = a - px, db = b - pz, dc = (c - px - pz) * Math.SQRT1_2;
      if (da <= db && da <= dc) { G2.x = 1; G2.y = 0; return -da; }
      if (db <= dc) { G2.x = 0; G2.y = 1; return -db; }
      G2.x = G2.y = Math.SQRT1_2; return -dc;
    }
    SG.d = Infinity;
    seg(px, pz, a, -1, a, c - a); seg(px, pz, a, c - a, c - b, b); seg(px, pz, c - b, b, -1, b);
    G2.x = (px - SG.x) / (SG.d || 1); G2.y = (pz - SG.z) / (SG.d || 1);
    return SG.d;
  }
  function prism(x, y, z, a, b, c, y0, y1, n) { // signed distance, its gradient in n
    const sxp = x < 0 ? -1 : 1, szp = z < 0 ? -1 : 1;
    const d2 = oct2(Math.abs(x), Math.abs(z), a, b, c), gx = G2.x * sxp, gz = G2.y * szp;
    const up = y - y1 > y0 - y, dy = up ? y - y1 : y0 - y;
    if (d2 > 0 && dy > 0) { const d = Math.hypot(d2, dy); n.set(gx * d2 / d, (up ? 1 : -1) * dy / d, gz * d2 / d); return d; }
    if (d2 > dy) { n.set(gx, 0, gz); return d2; }
    n.set(0, up ? 1 : -1, 0); return dy;
  }
  const NB = V(), NL = V(), PL = V();
  function binSdf(p, n) {
    const d1 = prism(p.x, p.y, p.z, UX, UZ, 0.974, -0.084, 0, n);
    const d2 = prism(p.x, p.y, p.z, 0.474, 0.43, 0.834, FLOOR - 1, -0.084, NB);
    if (d2 < d1) { n.copy(NB); return d2; }
    return d1;
  }
  function lidSdf(p, n) {
    toLid(p, PL);
    let d = prism(PL.x, PL.y, PL.z - 0.47, 0.51, 0.53, 0.96, 0, 0.105, NL);
    const d2 = prism(PL.x, PL.y, PL.z - 0.5, 0.33, 0.3, 9, 0, 0.18, NB);
    if (d2 < d) { d = d2; NL.copy(NB); }
    n.set(NL.x, NL.y * lid.cos + NL.z * lid.sin, -NL.y * lid.sin + NL.z * lid.cos);
    return d;
  }
  const CARRY = 0.45, US = [0.34, 0.67, 1];
  const SP = V(), PU = V(), NN = V(), BX = V(), BZ = V();
  function radius(k, n) { // the tongue's half thickness toward n at bone k (an ellipse across x top)
    BX.set(1, 0, 0).applyQuaternion(rot[k]); BZ.set(0, 0, 1).applyQuaternion(rot[k]);
    const a = hw[k] * kw[k] * n.dot(BX), b = hh[k] * kz[k] * n.dot(BZ);
    return Math.sqrt(a * a + b * b);
  }
  function collide(ks) {
    wasContact.set(contact); contact.fill(0); conLid.fill(0);
    for (let pass = 0; pass < 4; pass++) {
      let any = false;
      for (let k = ks; k < NJ; k++) {
        for (let i = 0; i < 3; i++) {
          const u = US[i];
          const A = k === ks ? slot.p : pos[k];
          SP.lerpVectors(A, pos[k + 1], u);
          const s = (k === ks ? uSlot : sAt[k]) + u * (k === ks ? Math.max(0, sAt[k + 1] - uSlot) : restLen[k]) - uSlot;
          if (s < 0.045) continue; // (in the gap: the squash keeps it out of the lid and the rim)
          const j = Math.min(NJ - 1, k + (u > 0.5 ? 1 : 0));
          let d = binSdf(SP, NN), r = radius(j, NN) + 0.006, hit = 1; // (a hair of clearance: the skin bulges a little past the bones' ellipse)
          PU.set(0, 0, 0);
          if (d < r) PU.copy(NN).multiplyScalar(r - d);
          const dl = lidSdf(SP, V3), rl = radius(j, V3);
          if (dl < rl && rl - dl > PU.length()) { PU.copy(V3).multiplyScalar(rl - dl); hit = 2; d = dl; NN.copy(V3); }
          if (SP.y + PU.y < FLOOR + hh[j] * kz[j]) PU.y = FLOOR + hh[j] * kz[j] - SP.y;
          if (PU.lengthSq() < 1e-10) continue;
          any = true;
          (hit === 1 ? contact : conLid)[k + 1] = 1; cType[k + 1] = hit;
          cpt[k + 1].copy(SP).addScaledVector(NN, -d); cnr[k + 1].copy(NN);
          // the bone's two ends share the push (the gap stays put); what hangs beyond is carried along
          const a = k > ks ? (1 - u) : 0, b = u, nn = a * a + b * b;
          if (a) pos[k].addScaledVector(PU, a / nn);
          for (let m = k + 1, w = b / nn; m <= NJ; m++, w *= CARRY) pos[m].addScaledVector(PU, w);
        }
      }
      if (!any) break;
    }
  }

  function pin(k, local) { return { k, local }; }
  const where = (pn, out) => out.copy(pn.local).applyMatrix4(chainBones[pn.k].matrix);

  // ------------------------------------------------------------------------------------------ the lick
  let Lk = null;
  function alignFx() {
    if (!O.fxParent) return;
    object3d.updateWorldMatrix(true, false); O.fxParent.updateWorldMatrix(true, false);
    M4.copy(O.fxParent.matrixWorld).invert().multiply(object3d.matrixWorld);
    M4.decompose(fx.position, fx.quaternion, fx.scale);
  }
  function startLick({ speed = 1, mirror = false, lid: fn = null } = {}) {
    if (Lk) return Lk.promise;
    let resolve;
    const promise = new Promise((r) => { resolve = r; });
    if (failed || disposed) { resolve(); return promise; }
    lid.fn = typeof fn === 'function' ? fn : null;
    Lk = { t: 0, speed: Math.max(0.2, +speed || 1), sx: mirror ? -1 : 1, resolve, promise, cue: 0, burst: 0, str: 0, waiting: true, waitT: 0 };
    if (mesh) start(Lk);
    return promise;
  }
  function start(l) {
    l.waiting = false;
    alignFx();
    sx = l.sx; phase = 0; primed = false; contact.fill(0); emitAcc.fill(0);
    lid.H = 0; lid.v = 0; lid.push = 0; lid.on = false;
    evalPose(0); targets(); settle(); solve();
    mesh.visible = false;
    tellLid();
  }
  function finish() {
    const l = Lk;
    Lk = null;
    if (mesh) mesh.visible = false;
    for (const s of STR) if (s.on && s.snapAt < 0 && (s.ea.t === 'pin' || s.eb.t === 'pin')) snapString(s);
    lid.H = 0; lid.v = 0; lid.push = 0; lidAngle();
    tellLid();
    lid.fn = null;
    l.resolve();
  }

  function stepLick(dt) {
    const l = Lk;
    const t0 = Math.min(T_END, l.t);
    l.t += dt * l.speed;
    const t = Math.min(T_END, l.t), sdt = dt * l.speed;
    evalPose(t);
    phase += sdt * par.ws;
    targets();
    subT0 = t0;
    springs(sdt);
    solve();
    mesh.visible = par.out > 0.004;
    emit(dt);
    // peeling off the bin or the lid leaves strings of spit
    for (let k = 3; k <= NJ; k++) {
      if (!wasContact[k] || contact[k] || conLid[k] || rng() > 0.5) continue;
      if (STR.some((s) => s.on && s.snapAt < 0 && s.ea.t === 'pin' && Math.abs(s.ea.k - k) < 3)) continue;
      const s = STR.find((o) => !o.on);
      if (!s) break;
      peelString(s, Math.min(k, NJ - 1), cpt[k], cnr[k], cType[k]);
    }
    for (let k = 0; k <= NJ; k++) if (conLid[k]) contact[k] = 1;
    while (l.cue < CUES.length && CUES[l.cue][0] <= t) { cue(CUES[l.cue][1], CUES[l.cue][2]); l.cue++; }
    while (l.burst < BURSTS.length && BURSTS[l.burst][0] <= t) { burst(BURSTS[l.burst][1], BURSTS[l.burst][2]); l.burst++; }
    while (l.str < STRINGS.length && STRINGS[l.str][0] <= t) { gapString(STRINGS[l.str][1]); l.str++; }
    tellLid();
    // done when the lid has clapped shut and stopped bouncing
    if (l.t >= T_END && ((lid.H <= 0 && lid.v === 0) || l.t > T_END + 0.6)) finish();
  }

  // Spit flies off wherever the tongue moves fast, mostly the tip (only out of the gap).
  function emit(dt) {
    for (let e = 0; e < EMIT.length; e++) {
      const [pn, wgt] = EMIT[e];
      where(pn, V1);
      if (primed && dt > 0 && mesh.visible) {
        V2.subVectors(V1, emitPrev[e]).divideScalar(dt);
        const sp = V2.length();
        if (sp > 2.4 && V1.z > lid.ze + 0.03) {
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
    primed = mesh.visible;
  }
  const tipVel = V(), tipPrev = V();
  function burst(n, from) {
    where(tipPin, V1);
    for (let k = 0; k < n; k++) {
      if (from === 'drool') { // a fat drop lets go of the hanging tip
        where(tipPin, V1);
        spawnDrop(V1, V2.set(rnd(-0.05, 0.05), -0.3, 0.15), 0.022);
      } else if (from === 'gap') { // squirted out of the gap beside the tongue as it squeezes through
        const s = k % 2 ? -1 : 1, w = hw[kSlot] * kw[kSlot];
        V1.set(slot.p.x + s * (w * rnd(0.7, 1.05)), Math.max(0.01, slot.p.y * rnd(0.6, 1.2)), lid.ze + 0.015);
        spawnDrop(V1, V2.set(s * rnd(0.2, 0.8), rnd(-0.1, 0.7), rnd(0.5, 1.3)), 0.009 + rng() * 0.01);
      } else if (from === 'slap') { // squeezed out from under its edges as it hits: out to the sides and forward
        const j = NJ - 2 - Math.floor(rng() * 6), s = k % 2 ? -1 : 1;
        where(pin(j, V3.set(s * hw[j] * 1.05, 0, hh[j] * 0.3)), V1);
        spawnDrop(V1, V2.set(s * rnd(0.9, 1.6), rnd(0.5, 1.4), rnd(0.2, 0.7)), 0.012 + rng() * 0.012);
      } else { // off the tip, along its motion, mostly forward
        where(tipPin, V1).add(V3.set(rnd(-0.03, 0.03), rnd(-0.03, 0.03), rnd(-0.01, 0.03))); // (not all from one point)
        const f = rnd(0.35, 0.7);
        spawnDrop(V1, V3.copy(tipVel).multiplyScalar(f).add(V2.set(rnd(-0.7, 0.7), rnd(0.4, 1.2), rnd(0.4, 1.2))), 0.013 + rng() * 0.012);
      }
    }
  }
  function newString(s) {
    s.on = true; s.t = 0; s.snapAt = -1; s.sag = 0; s.bead = 0.3 + rng() * 0.4; s.ph = rng() * 6.28; s.av.set(0, 0, 0); s.thin = 1;
  }
  function gapString(side) { // across the gap beside the tongue: from the rim to the lid's front edge
    const s = STR.find((o) => !o.on);
    if (!s) return;
    newString(s);
    const x = clamp(slot.p.x + sx * side * (hw[kSlot] * kw[kSlot] + rnd(0.03, 0.08)), -0.4, 0.4);
    s.ea.t = 'lid'; s.ea.l.set(x, -0.003, LID_D - rnd(0.02, 0.04));
    s.eb.t = 'fix'; s.eb.l.set(x + rnd(-0.02, 0.02), 0.002, lid.ze - rnd(0.02, 0.05));
    s.snapLen = 0.06 + rng() * 0.04; s.life = 0.55; s.thin = 0.7;
    endAt(s.ea, s.a); endAt(s.eb, s.b);
  }
  function peelString(s, k, at, n, type) { // from where it touched (1: the bin, 2: the lid) to the tongue's surface there
    newString(s);
    s.ea.t = 'pin'; s.ea.k = k;
    // the point of the tongue facing what it touched, in the bone's frame (rest scale: the bone matrix crushes it)
    Q.copy(rot[k]).invert(); V1.copy(n).negate().applyQuaternion(Q);
    s.ea.l.set(V1.x * hw[k] * 0.9, restLen[k] * 0.3, V1.z * hh[k] * 0.9);
    if (type === 2) { s.eb.t = 'lid'; toLid(at, s.eb.l); } else { s.eb.t = 'fix'; s.eb.l.copy(at); }
    s.snapLen = 0.14 + rng() * 0.1; s.life = 0.4;
    endAt(s.ea, s.a); endAt(s.eb, s.b);
  }
  function endAt(e, out) {
    if (e.t === 'pin') return out.copy(e.l).applyMatrix4(chainBones[e.k].matrix);
    if (e.t === 'lid') return toRig(e.l, out);
    return out.copy(e.l);
  }
  function snapString(s) {
    s.snapAt = s.t;
    cue('snap');
    const mx = (s.a.x + s.b.x) / 2, my = (s.a.y + s.b.y) / 2 - s.sag, mz = (s.a.z + s.b.z) / 2;
    spawnDrop(V1.set(mx, my, mz), V2.set(s.av.x * 0.25 + rnd(-0.2, 0.2), Math.min(0, s.av.y * 0.2) - 0.3, s.av.z * 0.25 + rnd(0, 0.3)), (0.012 + rng() * 0.007) * s.thin);
  }

  // ------------------------------------------------------------------------------------------ per frame
  function stepStrings(dt) {
    let any = false;
    for (let k = 0; k < MAXS; k++) {
      const s = STR[k], base = k * SV * 3;
      if (!s.on) continue;
      s.t += dt;
      if (s.snapAt < 0) { // its ends follow the tongue and the lid
        if (s.ea.t !== 'pin' || (Lk && !Lk.waiting && mesh?.visible)) {
          endAt(s.ea, V1);
          if (dt > 0) s.av.copy(V1).sub(s.a).divideScalar(dt);
          s.a.copy(V1);
        }
        endAt(s.eb, s.b);
      }
      const len = s.a.distanceTo(s.b);
      if (s.snapAt < 0 && (len > s.snapLen || s.t > s.life || (s.ea.t === 'pin' && !(Lk && mesh?.visible)))) snapString(s);
      // after the snap, each half whips back to its own end within 0.1 s and is gone (a wet spot)
      const broke = s.snapAt >= 0 ? Math.min(1, (s.t - s.snapAt) / 0.1) : 0;
      if (broke >= 1) {
        s.on = false; sPos.fill(0, base, base + SV * 3);
        if (s.eb.t === 'fix' && s.eb.l.y < -0.05) {} // (on the bin's face: nothing to see)
        else if (s.eb.t === 'lid') puddle(s.b.x, s.b.y, s.b.z, 0.018 + rng() * 0.01, 0.7, true);
        continue;
      }
      any = true;
      // it sags with its span across (a string hanging straight down hardly bows), never more than a third of its length
      const across = Math.hypot(s.b.x - s.a.x, s.b.z - s.a.z);
      const sagT = Math.min(0.08, 0.3 * across + 0.08 * len, 0.33 * len) * (1 - broke);
      s.sag += (sagT - s.sag) * Math.min(1, dt * 12);
      const wob = 0.14 * len * Math.sin(s.t * 27 + s.ph) * (1 - broke); // it sways, sideways
      // thins as it stretches (same volume), webbed thick where it meets its ends, a bead of spit on it
      const rMid = clamp(0.0008 / Math.max(0.05, len), 0.0032, 0.007) * s.thin, rEnd = Math.min(0.012, 0.004 + 0.12 * len) * s.thin;
      const ease = 1 - (1 - broke) * (1 - broke);
      for (let u = 0; u <= SEG; u++) {
        const f = u / SEG;
        const g = broke > 0 ? (f < 0.5 ? f * (1 - ease) : 1 - (1 - f) * (1 - ease)) : f; // each half to its own end
        const bow = 4 * g * (1 - g);
        const cx = s.a.x + (s.b.x - s.a.x) * g + wob * bow, cy = s.a.y + (s.b.y - s.a.y) * g - s.sag * bow, cz = s.a.z + (s.b.z - s.a.z) * g + s.sag * 0.5 * bow;
        // (its ends narrow into what they stick to, and once it snaps the broken ends taper to points and the halves
        // thin away: no open stubs)
        const r = (rMid + (rEnd - rMid) * Math.pow(Math.abs(2 * f - 1), 4) + 0.007 * s.thin * Math.exp(-Math.pow((f - s.bead) / 0.08, 2)))
          * Math.min(1, 0.35 + 5 * Math.min(f, 1 - f)) * (broke > 0 ? smooth(0, 0.2, Math.abs(f - 0.5)) * (1 - broke) : 1);
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

  // The lid's top, in lid space: the band 0.105 thick (its front face lower), the panel 0.18 in the middle.
  const lidTop = (l) => (Math.abs(l.x) < 0.33 && l.z > 0.2 && l.z < 0.8 ? 0.18 : 0.105);
  function stepDrops(dt) {
    let n = 0;
    for (const d of D) {
      if (!d.on) continue;
      d.age += dt;
      d.v.y -= G * dt;
      d.v.multiplyScalar(1 - 0.12 * dt);
      d.p.addScaledVector(d.v, dt);
      // into the tongue: it is gone (wet on wet: no sticking pearls)
      if (d.age > 0.04 && Lk && !Lk.waiting && mesh?.visible && inTongue(d.p)) { d.on = false; continue; }
      const ax = Math.abs(d.p.x), az = Math.abs(d.p.z), sp = d.v.length();
      // on the lid: lands on its top (a little puddle that rides on it) or runs into its face (gone)
      toLid(d.p, V1);
      if (Math.abs(V1.x) < 0.51 && V1.z > -0.06 && V1.z < LID_D && V1.y < lidTop(V1) + d.r * 0.4 && V1.y > -0.02) {
        d.on = false;
        if (d.kind === 0 && d.v.y < 0 && V1.y > lidTop(V1) - 0.03) splash(d.p.x, d.p.y, d.p.z, d.r * 0.8, sp, true);
        continue;
      }
      if (d.p.y < 0.01 && ax < UX + d.r && az < UZ + d.r && d.p.y > -0.09) { d.on = false; continue; } // the rim's face
      if (d.p.y <= -0.08 && ax < 0.48 && az < 0.44) { d.on = false; continue; } // the body
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
      if (p.onLid) { toRig(p.l, p.p); Q.premultiply(Q2.setFromAxisAngle(X, -Math.asin(lid.sin))); } // it rides on the lid
      M4.compose(p.p, Q, SC.set(s, s * 0.2, s));
      puddles.setMatrixAt(n, M4);
      // (on the black lid a full puddle reads as a grey smudge: there it is a faint wet sheen)
      fadeP.array[n++] = (u < 0.45 ? 1 : 1 - smooth(0.45, 1, u)) * (p.onLid ? 0.45 : 1);
    }
    puddles.count = n;
    puddles.instanceMatrix.needsUpdate = true; fadeP.needsUpdate = true;
  }

  function update(dt) {
    dt = Math.min(Math.max(+dt || 0, 0), 0.05);
    clock += dt;
    if (pendingWarm && mesh) warm(...pendingWarm);
    if (Lk) {
      if (!Lk.waiting) {
        where(tipPin, tipPrev);
        stepLick(dt);
        if (dt > 0 && mesh) tipVel.copy(where(tipPin, V1)).sub(tipPrev).divideScalar(dt);
      } else if (mesh) start(Lk);
      else if (failed || disposed || (Lk.waitT += dt) > O.wait) { const l = Lk; Lk = null; lid.fn = null; l.resolve(); }
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
      const keep = [seedState, phase, clock, lastSplat, lastSnap, lastRattle];
      silent = true;
      try { startLick(); for (let k = 0; k < 90; k++) update(1 / 30); } finally {
        stop(); silent = false;
        [seedState, phase, clock, lastSplat, lastSnap, lastRattle] = keep;
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
    const l = Lk;
    Lk = null;
    if (mesh) mesh.visible = false;
    clearFx();
    lid.H = 0; lid.v = 0; lid.push = 0; lidAngle();
    if (l) { tellLid(); lid.fn = null; l.resolve(); }
  }
  function dispose() {
    stop();
    disposed = true;
    object3d.removeFromParent();
    fx.removeFromParent();
    for (const o of owned) o.dispose?.();
  }

  const api = {
    object3d, fx, ready, update, warm, stop, dispose,
    lick: startLick,
    get busy() { return !!Lk; },
    get lidPitch() { return Lk ? lidPitch() : 0; },
    // for the lab: the chain (object3d space) and the pose at a given time, without the drips
    debug: {
      get mesh() { return mesh; }, get pos() { return pos; }, get rot() { return rot; }, get NJ() { return NJ; },
      get hw() { return hw; }, get hh() { return hh; }, get kz() { return kz; }, get kw() { return kw; },
      get bones() { return chainBones; }, par, flags: dbg, lid,
      get lidPitch() { return lidPitch(); },
      resolve() { if (mesh) solve(); },
      poseAt(t, set = {}) {
        if (!mesh) return;
        evalPose(t);
        for (const k in set) par[k] = set[k];
        lid.H = Math.max(0, par.push); lidAngle();
        targets(); settle(); solve();
        mesh.visible = par.out > 0.004;
      },
    },
  };
  return api;
}

// ------------------------------------------------------------------------------------------------ shapes, helpers
// the nearest point of a segment to (px, pz), if nearer than SG.d so far
const SG = { d: Infinity, x: 0, z: 0 };
function seg(px, pz, x0, z0, x1, z1) {
  const ex = x1 - x0, ez = z1 - z0, t = clamp(((px - x0) * ex + (pz - z0) * ez) / (ex * ex + ez * ez), 0, 1);
  const cx = x0 + ex * t, cz = z0 + ez * t, d = Math.hypot(px - cx, pz - cz);
  if (d < SG.d) { SG.d = d; SG.x = cx; SG.z = cz; }
}
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const backOut = (t) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);

// The tongue's push in the gap: the keyed one and the kicks' jolts (a quick half sine, a little thicker in the gap;
// the throw itself is in lidStep).
function pushAt(t) {
  let p = TRACKS.push(t);
  for (const [t0, h, dur] of KICKS) {
    const u = (t - t0) / dur;
    if (u > 0 && u < 1) p += Math.min(0.025, 0.15 * h) * Math.sin(Math.PI * u);
  }
  return Math.max(0, p);
}

// One track per number from the rows that key it.
function buildTracks(rows) {
  const tracks = {};
  for (const k of Object.keys(rows[0][1])) tracks[k] = track(rows.filter(([, p]) => k in p).map(([t, p]) => [t, p[k]]));
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
    #ifdef DROP
      // a bead: milky, darker and bluer underneath, a thin edge
      col = mix(col, vec3(0.70, 0.77, 0.86), smoothstep(0.3, -0.8, n.y) * 0.8);
      float ed = smoothstep(0.62, 0.9, rim);
    #else
      float ed = smoothstep(0.45, 0.8, rim);
    #endif
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
