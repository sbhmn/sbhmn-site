// The monster's tongue, made from the owner's 3D model: a sculpted, glossy, pink-red tongue with taste buds and a
// groove down the middle (assets/3d/tongue-model.glb, built by dev/models/tongue-rig.py from the owner's FBX: relaxed
// out of its S-twist into a gently curved, left-right symmetric rest pose, its sections centred on the spine (no wavy
// top, no tip curled up into a lobe), its top and underside rounded (the valleys between the groove's crests and the
// underside's folds filled: the groove stays painted on), the sculpt's baked lighting taken out of the colour map, the
// crumpled patch round its few small holes rebuilt, a stalk added at the root, skinned to a chain of 17 short bones,
// with twin bones along the front that cup the tip).
// The gap between the shut lid and the rim runs all round the lid's edge: it is a TRACK, and the tongue's base rides
// it like a carriage (see TRK_SIDE). The lid has slammed shut on the paper. Then, as the owner asked, ONE quick, smooth
// take of under 3 seconds (times at speed 1, after lick(); every move eased, no beat so short it reads as a glitch; the
// intro cranes its camera up over the bin meanwhile, so the lid's top reads):
//   0.04  POP: the lid's whole RIGHT edge is pushed up (shoved from inside at the middle of the right side; the lid
//         tips up about its left edge) and rides up on the tongue as it squeezes out of the middle of the right side,
//         a real opening with some leeway (the lid's edge ~0.15 up: the plump tongue fits through, squeezed only to
//         about four fifths of its thickness in the gap; the pop throws the lid a little higher, ~0.18, and it knocks
//         back down onto the tongue at 0.27), up the lid's edge and over onto its TOP, its front held up off it,
//         feeling the air,
//   0.30  and slaps down on it (a small splash): it lies on the top, its top up (the groove, the taste buds), licking,
//         round and plump, a little wider there than anywhere else ('wide').
//  0.30-1.44  LICKS THE TOP, its base gliding along the track under it from the right side round the front to the left
//         side and back round the front-left corner, the lid riding on it and rocking over as it goes (a roll on a side,
//         a pitch across the front's middle, a blend round a corner; lying on the top, its heading swings round a
//         corner after its base, not with it). A ROLL-OVER above the lid (0.34-0.66), its base at the middle of the
//         right side, lying across the top to the left: its front peels up off the top (strings of spit stretching and
//         snapping), rises ~0.2 above it and rolls over about its length in the air (the turn spread smoothly along its
//         front half: its pink top turns to face you, then its underside comes up), rolls back as it falls and slaps
//         back down like a weight, squashed a little for an instant: a BIG SPLASH (0.66: milky drops of mixed sizes,
//         many of them fat, thrown up well above the lid and raining back down onto it and the floor for half a second,
//         and a fast fan of fine spray streaking wide; glossy wet spots left on the lid where they land and where it
//         lay, a soft glint sliding over each as they dry; drool running down over its front edge, a fat bead at its
//         foot that drips off, leaving a wet streak). Its base comes round to the FRONT-RIGHT CORNER (0.42-0.74) for a
//         TILTED LICK (0.70-0.88), like a real tongue's: lying diagonally across the top toward the back-left, seen side
//         on from the camera, banked onto its near edge (20-35 degrees at the front, its top turned toward you), its
//         tip curled down into the top, it drags across it like a windscreen wiper, swinging further left, and lifts
//         its front off (0.88), its base easing off along the front meanwhile. Still lifted, it is carried along the
//         front as its base slides to the LEFT side (0.74-1.28, slowing round the front-left corner), and rolls over
//         again there (0.98-1.28), lying across the top to the right: another BIG SPLASH (1.28). Its base glides back
//         round the front-left corner: a last TILTED LICK (1.30-1.44), banked the other way (20-35 degrees), across the
//         top's left part, dragging its tip back toward the edge. Wherever it lies licking, it leaves the lid wet.
//  1.44-1.62  it COMES OFF THE TOP at the front's left end: its front peels up and it rises off the top, drawing in a
//         little, till it leans up over the lid's front edge, its top to you;
//  1.62-1.90  it FLOPS FORWARD and DOWN the front in one arc, its tip leading (falling, not lying along the gap first),
//         swinging a little to the left (it never turns about its length: its faces keep their way, so as it falls
//         forward over the edge its top comes onto the bin and its underside faces you: as wet and glossy as its top,
//         a soft pink with a fold down its middle and two faint bluish veins) and slaps onto the bin's front, its tip
//         down by the base (1.88),
//  1.90-1.96  and LICKS THE BOTTOM: one sweep across the bottom of the bin's front, its tip laid flat on it, as its
//         base slides to the middle (from standing over the edge to the end of this lick: 0.34 s);
//  2.02-2.20  it draws up and RESTS in the MIDDLE of the front, a beat, its tip curling up and out toward you (the
//         taste buds of its top showing at the tip), the lid's front edge held up as high as on the sides;
//  2.20-2.58  it SLURPS back in through the gap in one steady pull, faster and faster, the lid settling down onto it
//         (only in its last ~0.1 s) and bumping on it; the tip vanishes at 2.58 (the slurp's wet smack), and the lid,
//         let go, SLAMS shut (2.67), bounces once and lies still. The promise resolves at ~2.69.
// It is short and fat, not a hose: at most 0.7 of it is ever out (0.77 would be all of it but the stalk; on the top a
// good 0.2 of that is folded over the lid's edge), and it stretches a little to reach down the bin's front.
// It is ROUND and PLUMP everywhere out of the gap: the full volume of the sculpt, its rounded top and edges; it is
// squeezed flat only where it goes through the gap, automatically, the way a lattice would squash it in Blender (see
// squash(): per vertex, in the shader, before skinning, with a smooth falloff back to its round shape past the lid's
// edge, and wide there, as wide as its root at least: never a pinched neck; the sideways spread eases back in half as
// far as the squash, so the root doesn't flare into a flange past the gap). Only where it is folded over the lid's edge
// onto its top (wl) is it a little thinner than the sculpt just past the gap (FOLD_T, rounding out to its full volume
// by ~0.35 out); in the air and hanging down the bin's front it has the sculpt's full thickness. Where it lies on
// something it flattens a little on the side that touches, like soft flesh ('flat'). The groove down its top is
// painted on, not dented (the model's top is rounded; aFill, FILL fill whatever valley is left): seen edge-on over a
// fold, a dented groove read as a dark crack, and its two crests as two lobes.
// It comes out of the gap upside down, always ('flip' stays 1: it never turns about its length on its way from the top
// to the bin's front, as the owner asked): laid over the lid's edge and across its top it lies on its underside, its
// top up, to the camera (the lick reads as a tongue there, not a red lump: it is most of the show); folded down over
// the rim and hanging down the bin's front it lies on its top, its underside out to you, shaded as a tongue's
// underside (see UNDER_GLSL). (The keys and the code still take a 'flip' between 0 and 1, turning it about its length
// in the gap; nothing uses it now: left in, unused.)
// It lies ACROSS the top as it rolls over (seen from the front, a tongue rolling about a length that points away from
// you is a fin; rolling about one that runs across, its faces come round to you), and a roll-over rolls back flat as
// it lands (a tongue whose root lies flat, rolled over a half turn and left so, stands up on its edge across the lid
// like a wall). The roll-over's turn (spin) is spread over ~0.4 of its length past the fold, not a short stretch: so
// plump a tongue twisted fast crumpled into a fin.
// It is wet and heavy: wherever it licks it lies on the surface (the lid's top, the bin's front), sliding over it and
// draped over the edges; never floating off it, never sinking in. That comes from rails: for those beats the keys
// don't bend the joints, they say where on the bin it lies (how far it is out, where its base is on the track, which
// way it heads across the lid's top and how far it is peeled up off it, which way it goes down the front) and the
// chain is laid along a line that lies on the surfaces, a ball as thick as the tongue rolled over the bin's and the
// lid's outline (see the rails below). The bone in the gap is aimed along the rail too, so the chain laid on it is the
// same whichever joint is in the gap: it slides through the gap evenly, no ratchet as each joint passes it. Over the
// lid's edge it wraps it as tight as its own thickness lets it (its groove, filled a little anyway, see aFill).
// Between the lid and the bin's front it is in the air: the free pose (bends keyed at the joints), sprung on its own,
// so it is already where it is keyed as it hands over from a rail.
// The LID RIDES ON IT: a hinged plate with weight, not keyframed: the tongue holds its edge up where it comes out
// (PUSH, ~0.15: a real opening with some leeway, the lid riding up on it, not flung open); as it pops the lid,
// heaves its front up off the top, rises off it and is slurped in, it jolts up in the gap and throws the lid a
// little, which falls back and knocks on it. Where the tongue is, the lid lifts (when the intro passes roll, see
// lick()): out of a side, that whole side lifts (a roll about the far side's edge); out of the front, the front edge
// (a pitch, tipping toward the nearer corner); round a corner, a blend; so as the base goes round, the lid rocks over,
// easing down behind it. The tongue never goes through the lid, the rim or the bin (in the gap the squash fits it to
// the gap and a vertex clamp in the shader makes it exact, wherever along the track it is; behind the gap, in the
// dark, it is kept under the lid's
// underside however the lid is tipped; out of it the rails lie on them, and test points along the bones are kept off
// them: in the air by turning the rest of the chain away at a joint a little way back, on a rail only a real dip in,
// locally; its section taken as a superellipse, full at the corners, its width counting only where its edge really
// meets a face (near a corner the face's plane runs on into the air). The chain keeps its lengths either way, so the
// texture never stretches over an edge).
// Animated here, not baked: in the air, keyframed bends at every joint chased by springs (the tip lags and follows
// through, damped: no flutter; the lag fades out toward the gap); on a rail, laid along it, the tip's own curl, hook
// and wave still sprung on top. It turns about its length (roll, twist, ttw, spin: on the top a roll-over spins its
// front over, a tilted lick banks it), and a twist lying on a rail is built into the rail's frames (eased along the
// bones and between the rail's points, so the line it lies on never jumps), so it never lifts it off its line. Each
// joint bends at most so far that the bend stays wider than the tongue there (no edge folding through itself), and
// twists are spread along its length (no candy-wrapping). Every number is keyed, sampled and smoothed (see
// buildTracks), so nothing has a corner: only a slap lands hard.
// Spit squirts out of the gap beside the tongue, flies off the fast moves (milky beads, streaking as they fly; one that
// flies into the tongue is gone), falls and splashes on the floor (a crown, a few droplets, a puddle that dries away)
// or lands on the lid (a glossy wet spot riding on it); strings of spit stretch across the gap as the lid pops and from
// its face to the lid as it peels up, and snap; drool runs down over the lid's front edge, a fat bead at its foot that
// drips off, leaving a wet streak that dries away.
//
//   import { createTongue } from '/assets/intro/tongue-model.js';
//   const tongue = createTongue(THREE, { fxParent: scene });  // returns at once; its model (~0.36 MB) loads behind
//   bin.add(tongue.object3d);                   // a parent with no rotation/scale of its own
//   tongue.object3d.position.set(0, 0.78, 0);   // the centre of the opening, on the rim plane
//   await tongue.ready;                         // optional: the model has arrived (rejects if it can't load)
//   tongue.warm(renderer, camera);              // once, after it is in the scene (see warm below)
//   tongue.update(dt);                          // every frame, always (the drips outlive the lick); dt in seconds
//   // the lid slams shut on the paper and has settled; then (pitch: the lid's group at its hinge; roll: the group
//   // inside it that tips the lid about a side edge, as intro.js nests them; lidMesh inside that):
//   await tongue.lick({
//     lid: (p) => { pitch.rotation.x = p; },
//     roll: (r) => { const px = r < 0 ? 0.51 : -0.51; roll.position.x = px; lidMesh.position.x = -px; roll.rotation.z = r; },
//   });                                         // ~2.7 s at speed 1 (don't open the lid yourself)
//   // the lid is shut again (the last lid() call was exactly 0, and the last roll() 0: its pivot back on the left
//   // edge): carry on
// `const tongue = await createTongue(...)` works too (it is not a promise; await just hands it back).
//
// Coordinates: bin units (1 unit ~ the bin's height). object3d's origin is the centre of the opening on the rim
// plane, +y up, +z toward the front (the camera), +x the viewer's right. The floor is at local y = -rimY. The lid (as
// in assets/3d/bin.glb): hinged at (0, 0, -0.5) here, 1.0 deep, 1.02 wide (its sides at x = +-0.51), its front edge
// flush with the rim's front (z = 0.5), its front corners cut; pitch 0 = shut, < 0 = open (rotation.x of a group at the
// hinge); its front edge is then lifted by sin(-pitch). The tongue lives in the bin under the lid (drawn sinking into
// the dark there; the hidden part runs in from wherever it comes out, between straight in and toward the bin's
// middle, down the inside of that wall and back along the bottom, narrow, within the intro's black monster block) and
// comes out only through the gap, anywhere along the track: out of the right side, the front or the left side
// (sideways out of a side, at a diagonal round a corner), straight or at a slant. It reaches (measured every 1/60 s)
// ~0.58 above the rim (its front lifted, rolling over), ~0.11 past the rim's left side (rolling over at the left side;
// ~0.10 past the right one, in the first tilted lick), ~0.44 in front of the rim (flopping forward in front of the
// bin), and down the bin's front to just above the base (0.47 below the rim); mirrored, the other way round.
// Hidden until lick(); hidden again when it resolves.
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
//                              'pop'      0.05             the lid's right side is shoved up from inside (a thunk)
//                              'squeeze'  0.08             the tongue squeezes out through the gap (a squelch)
//                              'slap'     { strength } it lands on something, lightly: 0.30 (0.6: onto the lid's top),
//                                                      1.88 (0.8: onto the bin's front, as it flops down it)
//                              'splash'   { strength } it slaps back down on the top after a roll-over, hard, spit
//                                                      flying: 0.67 (1), 1.28 (1)
//                              'lick'     { strength } a stroke: across the top 0.38 (0.7), 0.78 (0.6, the first
//                                                      tilted lick), 1.37 (0.5, the last); across the bottom 1.95 (0.9)
//                              'goo'                   its front peels up off the top, strings of spit stretching:
//                                                      0.38, 1.03, 1.48
//                              'flick'    1.65, 2.08   it stands over the lid's front edge and curls over to the left;
//                                                      the tip curls (resting)
//                              'slurp'    { in } 2.22  sucked back in through the gap; in: seconds (at the lick's
//                                                      speed) until the tip vanishes (0.36 at speed 1: put a clip's
//                                                      smack there)
//                              'clap'     { strength } the lid lands on the rim: 2.67 (1: it slams shut) and once more
//                                                      after its bounce, 2.70 (0.39)
//                              'rattle'   { strength } the lid knocks back down on the tongue after a jolt threw it up:
//                                                      0.27 (0.43: the pop threw it up), 0.50 (0.37), 1.13 (0.37),
//                                                      1.62 (0.37)
//                                                      (only real knocks: weaker ones, < 0.3, any within 0.22 s of the
//                                                      last, and any during the pop, are not sent)
//                              'snap'                  a string of spit breaks (~6 a lick; at most one per 0.12 s)
//                              'splat'    { x, y, z, size } (fx space) a drop lands; at most one per 60 ms
//                              Errors thrown by the hook are swallowed.
// returns {
//   object3d                   the tongue (and, by default, the drips)
//   fx                         the group holding the drops, crowns, puddles, wet spots and strings
//   ready                      a promise: resolves (to this object) when the model has arrived, rejects if it can't
//                              load (then lick() resolves at once and nothing shows; the procedural tongue is the
//                              fallback)
//   lick({ lid, roll, speed = 1, mirror = false, mode = 'gap' }) => Promise
//                              lid: (pitch) => {}: called every update() while it licks (from the first one), with the
//                              lid pitch it wants (radians, <= 0, 0 = shut; about -0.15 at most, the front edge up
//                              0.15): set the real lid's pitch group's rotation.x to it (the intro must not open the
//                              lid itself). It starts at 0 (call lick() with the lid shut and settled) and the last call
//                              is exactly 0. Optional: without it, read tongue.lidPitch.
//                              roll: (r) => {} (optional): called right after lid(), with the lid's roll (radians,
//                              about -0.18 .. +0.18): r > 0 tips its RIGHT side up about its LEFT edge (x = -0.51), r < 0
//                              its LEFT side up about its RIGHT edge (x = +0.51); rotation.z of a group inside the
//                              pitch group, pivoting on that edge (the snippet above). The last call is exactly 0.
//                              Without it the lid is not tipped: wherever the tongue comes out, the whole lid hinges up
//                              to lift its edge there (the tongue plays the same: it lies on the lid as it really is,
//                              and is kept out of it). Pass it to see the right side pop up first and the lid rock
//                              round with the tongue. Or read tongue.lidRoll.
//                              speed: playback rate. mirror: left and right swapped (exact; the roll too: it comes out
//                              of the left side and goes round to the right).
//                              mode: 'gap' (the only staging; anything else is treated as 'gap'). Called while busy:
//                              returns the running lick's promise. Resolves once the lid has slammed shut and settled
//                              (~2.69 s at speed 1).
//   lidPitch, lidRoll          (getters) the lid pitch / roll it wants now (0 when idle; lidRoll stays 0 unless lick()
//                              got roll)
//   update(dt)                 dt clamped to 0.05; frame-rate independent (springs and the lid stepped at 240 Hz)
//   warm(renderer, camera)     once, after object3d (and fx) are in the scene: compiles every shader it uses, makes
//                              the env's PMREM, uploads the model's textures and the shadow-pass variants by rendering
//                              one frame with its pieces present but too small to see, and runs the lick's code once
//                              silently (no cues, no lid() calls, state restored). Called before the model has arrived,
//                              it is done in the first update() after it arrives (so `await tongue.ready` first if you
//                              want it done during setup). Without it the tongue's first frame stalls (~270 ms in
//                              headless Edge; with it, the worst frame of the lick is ~1 ms).
//   stop()                     for a Skip button: the tongue goes, every drip goes, lid(0) (and roll(0)) is called
//                              once (the lid shut) and the running lick's promise resolves
//   dispose()                  stop() + removes object3d and fx from their parents and frees its GPU resources
//   busy                       (getter) true while licking (or waiting for the model to lick)
//   debug                      for dev/lab-tongue-model.html; ignore it
// }
// Where the drips live: they are simulated in fx's local space, which matches object3d's at the start of each lick.
// By default fx is a child of object3d. If the intro moves the bin afterwards (rattle) while puddles are still drying
// (up to ~2.2 s), pass opts.fxParent = scene: fx is then added to the scene and placed at object3d's world transform at
// each lick() start, and the drips stay put when the bin moves. The wet spots on the lid ride on it as lid() says while
// the lick runs; once it resolves they dry up within 0.45 s and no new ones are made (they would not follow the lid if
// the intro moved it afterwards).
// Budget: one skinned mesh (10.1k vertices, 17.2k triangles, 33 bones; skinning and the squash on the GPU: a table of
// 72 vec4 uniforms, written each frame), one draw call each for drops, crowns, puddles, wet spots and strings (a
// small unlit liquid shader) + the shadow pass for the tongue (squashed the same way) and the drops. Per frame on the
// CPU: ~0.3 ms, at most ~1.2 ms (headless Edge: the track, the rails, 17 joints on springs, the lid, the collisions,
// 33 bone matrices, up to 280 drops, each tested against the tongue).
import { GLTFLoader } from '/assets/vendor/three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '/assets/vendor/three/addons/libs/meshopt_decoder.module.js';

const LID_G = 15; // the lid's front edge falls like a hinged plate's (3g/2 per unit depth)
const HIT = 1; // a key arrived at falling (see track)
// The lid, as the bin model has it (tongue space): hinged at the back of the rim, 1.0 deep, 1.02 wide; a band 0.11
// thick (its front face 0.077, sloping back to 0.11) with a raised panel in the middle (0.18); the front corners cut.
const HINGE_Z = -0.5, LID_D = 1.0, LID_HW = 0.51;
const TILT = 0.55; // pushed up near a front corner, the share of the lift that is roll (the far front corner rises 1 - TILT as much)
const FILL = 1; // how much of the groove's depth is filled (see aFill): all of it (the groove is only painted on)
// Which way up it is in the gap ('flip' keys it; it stays 1 now): it comes out upside down, so laid over the lid's edge
// and across its top it lies on its underside, its top up (LIDF: its top is the face toward the lid: no; FS: the lid
// rail's "the way its top faces" for a tongue coming out upside down); folded down over the rim and hanging down the
// bin's front it lies on its top, its underside out to you (FACEF: its top is the face toward the bin: yes; FSF: the
// face rail's "the way its top faces", into the bin). It never turns about its length between the two (the owner:
// "don't rotate the tongue when it goes from licking the top to licking the bottom").
const LIDF = false, FS = 1, FACEF = true, FSF = 1;
// The TRACK: the gap between the lid and the rim runs all round the lid's edge, and the tongue's base rides it like a
// carriage: it comes out anywhere along it, sideways out of a side as well as out of the front. Tongue space, the lid
// shut: from the middle of the right side (x = LID_HW, z = 0) forward along it, round the front-right corner (rounded
// at TRK_R, about the lid's cut corner), along the front (z = 0.5), round the front-left corner and back along the left
// side. trk: where along it, as arclength from the middle of the front (0); + toward the viewer's right: TRK_SIDE is
// the middle of the right side, -TRK_SIDE the middle of the left (and past them, on toward the back).
const TRK_R = 0.12, TRK_FX = LID_HW - TRK_R, TRK_SZ = 0.5 - TRK_R, TRK_ARC = 0.5 * Math.PI * TRK_R;
const TRK_SIDE = TRK_FX + TRK_ARC + TRK_SZ, TRK_EASE = 0.06;
// -> tk: the point on the track (x, z), its outward normal (nx, nz), its tangent toward + trk (tx, tz), and how much
// of it faces the front (1 on the front, 0 on a side, between round a corner: how much of the lid's lift is pitch)
function trackAt(trk, tk) {
  const s = Math.abs(trk), g = trk < 0 ? -1 : 1;
  let x, z, a;
  if (s <= TRK_FX) { x = s; z = 0.5; a = 0; }
  else if (s <= TRK_FX + TRK_ARC) { a = (s - TRK_FX) / TRK_R; x = TRK_FX + TRK_R * Math.sin(a); z = TRK_SZ + TRK_R * Math.cos(a); }
  else { a = 0.5 * Math.PI; x = LID_HW; z = Math.max(-0.4, TRK_SZ - (s - TRK_FX - TRK_ARC)); }
  // (the way out turns round a corner eased over a little more than the arc, TRK_EASE either side: turned exactly with
  // the arc, it swung all at once as the base came onto it, and everything laid out from the gap jolted sideways)
  const ae = 0.5 * Math.PI * smooth(TRK_FX - TRK_EASE, TRK_FX + TRK_ARC + TRK_EASE, s);
  tk.x = g * x; tk.z = z; tk.nx = g * Math.sin(ae); tk.nz = Math.cos(ae); tk.tx = tk.nz; tk.tz = -tk.nx;
  tk.front = tk.nz * tk.nz;
  return tk;
}

// The lick, keyframed: a row per moment (seconds at speed 1), each with the numbers that have a key there (Hermite
// between keys, flat at a key that is a peak or a valley, so every overshoot is drawn on purpose).
//   out    how much of the tongue is out through the gap (its rest length; 0.77 would be all of it but the stalk: it
//          never puts out more than OUT_MAX, so it stays a stubby, fat tongue, not a hose; a good 0.2 of it is folded
//          over the lid's edge when it lies on the top)
//   reach  what is out, stretched (and thinned) to reach further (~1.1 on the top; ~1.16 reaching down to the bottom
//          of the bin's front: a reaching tongue grows long and thin; the taste buds barely stretch)
//   push   how hard it shoves up in the gap: the height it holds the lid's edge at, where it is (the lid rides on it:
//          thrown up when it rises fast, it flies, falls back and bounces; PUSH, ~0.15, while it is out). The tongue
//          is squeezed to that thickness in the gap (see squash).
//   trk    where its base is on the track (see TRK_SIDE: 0 the middle of the front, + toward the viewer's right)
//   aim    radians: it goes through the gap at a slant (+ toward - trk: at the front, the viewer's left)
//   exit   radians: the way it leaves the gap, tipped up (+) or down
//   flip   0..1: which way up it is in the gap: 1 upside down (as it always is now), 0 top up; in between it would be
//          turned about its length, its root in the gap too (the rails are laid for 1 only: LIDF, FACEF)
// In the air (the free pose; in the gap's frame, wherever on the track it is, keyed as it would be top up: turned
// over by flip, its bends turn with it, so it keeps its shape; upside down, as it is, turn and yaw swing it the other
// way: + toward + trk, - toward - trk, at the front - is the viewer's left):
//   bend   radians: the bend just outside the gap, up (+: it rears up) or down (-: it flops down over the edge)
//   dpos / dsig  where that bend is (arclength past the gap) and over how long
//   over / opos / osig  a second bend further out (+ back over the lid, - down)
//   turn   radians: a bend to the side a little further out, where it is round again (+ toward - trk)
//   arch   radians per unit length: a bend all along what is out (+ up/back, - down/forward)
//   yaw    radians per unit length: what is out sweeping toward - trk (+) or + trk (-)
//   roll   radians: turned about its own length (the turn in its first ~0.3 past the gap, the rest turning as one)
// On the bin (rails: the free pose blends into them as their weights rise; see the rails below):
//   wl     0..1: laid over the lid's edge where it comes out (wrapped round it at aim's slant) and in across its top,
//          heading ta (radians from straight in from the edge there, + toward - trk; turned hd more) and curving kc more
//          (radians per unit length), turning no tighter than it can bend sideways; if it gets to an edge of the lid,
//          draped over it, over the rim's edge and down the bin's side. wl + wf = 1: the one rail hands over to the
//          other (out over the lid's side and down, a swing)
//   lift   lying on the lid's top, its front peeled up off it, level, that high (rising smoothly over ~0.4 from where
//          the fold leaves it, its root still on the top): it hovers, rolls over (spin) and slaps back down
//   wf     0..1: laid over the rim's lip and down the bin's face below the gap (the front, out of the front) to the
//          base (and the floor), heading fd (radians from straight down, + toward - trk), curving fk more
// On top of either (sprung, the tip's own life):
//   curl   radians: the front third curling toward its top (+) or its underside (-)
//   hook   radians: the front third bending toward - trk (+) or + trk (-)
//   twist  radians: twisted about its own length, like roll, in the air or on a rail
//   ttw    radians: the tip's own twist, spread over the front half of what is out (a corkscrew as it licks)
//   spin   radians: turned about its own length over ~0.4 past the fold over the lid's edge (in the air: past the
//          gap), the rest of it turning as one: lifted off the top, its front rolls over; lying on it, it banks (on a
//          rail it is built into the rail's frames, like twist and ttw)
//   wave   radians: a wave running from the gap to the tip (per joint); its phase runs at 'ws' cycles a second
//   cup    radians: the tip's edges rolled toward its underside (+) or its top (-) (a spoon)
//   stick  0..1: in the air, wet: drawn down onto what it is near (on a rail it lies on it already)
//   flat   lying on something, the side of it that touches (on the lid's top its underside, on the bin's front its
//          top) that much as thick as modelled: soft flesh flattening a little under its own weight (1: round)
//   wide   0..1: lying on the lid's top, past the fold over its edge, a little broader (WIDE more across, a touch
//          flatter, still round; narrowing again where it is peeled up off it): the owner wanted it a bit wider
//          licking the top
// It comes out of the gap upside down (flip 1): over the lid's edge and across its top it lies on its underside, its
// top (the groove, the taste buds) up to the camera; down the bin's front it lies on its top, its underside out to you.
// Its curl and hook are toward its own top and side, so upside down they bend the other way in the world: keyed here
// as they look (curl - on the bin's front: the tip curling up and out toward you). (Mirror swaps left and right: trk,
// ta and every sideways number change sign.)
const OUT_MAX = 0.7;
const HIDDEN = { out: 0, reach: 1, push: 0, trk: 0, exit: 0, bend: 0, turn: 0, dpos: 0.05, dsig: 0.035, arch: 0, curl: 0, yaw: 0, hook: 0, roll: 0, wave: 0, ws: 1.6, cup: 0.15, stick: 0, over: 0, opos: 0.24, osig: 0.06, flat: 1, wl: 0, wf: 0, ta: 0, hd: 0, kc: 0, fd: 0, fk: 0, twist: 0, ttw: 0, aim: 0, lift: 0, spin: 0, wide: 0, flip: 1 };
const R_MID = TRK_SIDE; // the middle of the right side
const L_SIDE = -0.66, L_FRONT = -0.26; // on the left side, near its front; the front, near its left end
const R_CORNER = 0.47; // round the front-right corner
// How high it holds the lid's edge up where it comes out (push): a real opening, so the plump tongue plausibly fits
// through it with some leeway, squeezed only to about four fifths of its thickness (the lid riding up on it with its
// weight; at 0.115 it was squeezed to about three fifths and the lid looked clamped down on it)
const PUSH = 0.15;
// The beats (seconds at speed 1): T_POP the lid's right edge pops up; TA it lands on the top (the first slap); P1, P2
// a roll-over starts (its front peels up), TB, TC it slaps back down (the big splashes); TL it peels off the top for
// good (at the front's left end) and rises; TR it stands up over the lid's front edge, its top to you; TD it is
// flopping forward and down the bin's front; TE its tip is down by the bin's base (a slap; the sweep across the
// bottom); TS it rests in the middle; TP the slurp starts; TV the tip vanishes into the gap (the slurp's wet smack)
const T_POP = 0.04, TA = 0.3, P1 = 0.34, TB = 0.66, P2 = 0.98, TC = 1.28, TL = 1.44, TR = 1.62, TD = 1.7, TE = 1.9, TS = 2.02, TP = 2.2, TV = 2.58;
const T_SLAM = TV + 0.005, SLAM_G = 2.6; // after T_SLAM (the tongue in) the lid falls SLAM_G times as hard: it slams
const T_END = TV + 0.08; // (the lid has slammed and bounced by then; lick() resolves as it settles)
// A ROLL-OVER on the top, from t0 to t1: it peels its front up off the top (strings of spit stretching), and as it
// rises its front rolls over about its length in the air above the lid, w radians (its edge, then its underside comes
// up), heading a (see ta); then it falls back onto the top like a weight let go at its highest, rolling back flat as it
// comes down: it lands at speed, a slap, a big splash, squashed a little flatter and broader by the blow for an instant
const rollOver = (t0, t1, w, a) => {
  const D = t1 - t0;
  return [
    [t0 + 0.3 * D, { lift: 0.11, spin: 0.4 * w, curl: -0.1, ta: a }],
    [t0 + 0.58 * D, { lift: 0.2, spin: w, curl: -0.2 }],
    [t0 + 0.84 * D, { spin: 0.35 * w }],
    [t1, { lift: [0, HIT], spin: 0, curl: -0.05, ta: a, flat: 0.8, wide: 1 }],
    [t1 + 0.03, { flat: 0.68, wide: 1.3 }],
    [t1 + 0.12, { flat: 0.86, wide: 1 }],
  ];
};
// A TILTED LICK across the top, from t0 to t1, banked b radians onto one edge (like a real tongue licking: it comes at
// the surface at an angle, its front held a little up off it, the tip curled down into it, dragged across and lifted
// off), heading from a0 to a1 (ta); its front left lifted e at the end (0: lying on the top again). sp: how much of the
// bank is spin (past the fold, the fold staying flat on the lid's edge), the rest twist (from the gap)
const tiltLick = (t0, t1, b, a0, a1, e = 0, sp = 0.4) => {
  const D = t1 - t0, tw = 1.15 - sp;
  return [
    [t0, { twist: 0, spin: 0, lift: 0, curl: 0.2, ta: a0 }],
    [t0 + 0.3 * D, { twist: tw * b, spin: sp * b, lift: 0.05, curl: -0.45 }],
    [t0 + 0.75 * D, { twist: tw * b, spin: sp * b, lift: 0.04, curl: -0.4 }],
    [t1, { twist: 0, spin: 0, lift: e, curl: 0.2, ta: a1 }],
  ];
};
const POSES = [
  [0, { ...HIDDEN, trk: R_MID, wl: 1, ta: 0.1, flat: 0.9, cup: 0.3 }],
  [T_POP - 0.01, { push: 0, out: 0 }],
  // POP: shoved up from inside at the middle of the RIGHT side: the lid's whole right edge lifts, and rides up on the
  // tongue as it squeezes out (pushed up by it, with its weight: not flung open)
  [T_POP + 0.05, { push: 0.6 * PUSH, out: 0.03 }],
  // SLIDES OUT of the middle of the right side, squeezed through the gap, up the lid's edge and over onto its top,
  // its front held up off it, feeling the air...
  [0.18, { out: 0.34, lift: 0.11, curl: -0.45, reach: 1.04, push: PUSH }],
  [0.24, { out: 0.46, lift: 0.12, curl: -0.25 }],
  // ...and SLAPS DOWN onto the top: it lies on it, its top up, licking, a little wider there
  [TA, { out: 0.56, reach: 1.1, lift: [0, HIT], curl: 0.1, cup: 0.25, flat: 0.8, wide: 1.2, push: PUSH, ta: 0.1 }],
  [TA + 0.06, { flat: 0.86, wide: 1 }],
  // LICKS THE TOP, its base gliding along the track under it (from the right side round the front to the left side:
  // see PACE), the lid riding on it. It lies ACROSS the top as it rolls over (from the camera, a roll about a length
  // pointing away would be a fin): a stroke...
  [P1, { ta: 0.25, out: 0.66, reach: 1.14, lift: 0, spin: 0, aim: 0 }],
  [P1 + 0.1, { out: OUT_MAX }],
  // ...at once a ROLL-OVER above the lid, lying across it to the left from the right side (its base still there: it
  // lands on the top, in the middle of the camera's view of it)...
  ...rollOver(P1, TB, -3.0, 0.25),
  // ...its base waits at the front-right corner for a greedy tilted lick: lying diagonally across the top toward the
  // back-left (side on to the camera: from the front's middle it would only show the fold, a lump), banked onto its
  // near edge, its top turned toward you, its tip curled down into the top, it drags across it like a windscreen
  // wiper, swinging further left, and lifts its front off; still lifted, it is carried along the front...
  ...tiltLick(TB + 0.04, 0.88, -0.55, 0.15, 0.55, 0.07, 0.9),
  [0.9, { out: OUT_MAX }],
  // ...another ROLL-OVER, lying across to the right as its base comes to the LEFT side (slowing round the front-left
  // corner: rounding it fast as it rose, the fold jolted)...
  ...rollOver(P2, TC, 3.0, 0.0),
  // ...and as its base glides back round the front-left corner, a last tilted lick, banked the other way, across the
  // top's left part (its free pose keyed meanwhile as it lies there: up the lid's edge and over the top, for the
  // hand-over to the air)
  ...tiltLick(TC + 0.02, TL, -0.85, 0.05, 0, 0.05),
  [TL, { spin: 0, wl: 1, wf: 0, out: 0.6, reach: 1.12, flat: 0.86, wide: 1, bend: 1.5, dpos: 0.05, dsig: 0.04, over: 1.1, opos: 0.22, osig: 0.07, arch: 0.5, push: PUSH, turn: 0, yaw: 0 }],
  // COMES OFF THE TOP at the front's left end and DOWN THE FRONT, in one arc, its faces keeping their way (no roll: it
  // never turns about its length): its front peels up off the top and it rises off it, drawing in a little, up over
  // the lid's front edge till it leans up over it, its top to you (not too tall: standing straight up over the edge,
  // its root read as a big lump)...
  [TL + 0.02, { wl: 1 }],
  [TL + 0.1, { curl: 0, bend: 1.1, dpos: 0.13, dsig: 0.06, over: 0.3, arch: 0.05, yaw: 0 }],
  [TL + 0.14, { lift: 0.12 }],
  [TL + 0.2, { wl: 0, wide: 0, flat: 1 }],
  [TR, { bend: 0.85, dpos: 0.12, over: 0.05, arch: -0.1, yaw: -0.3, turn: -0.35, out: 0.44, reach: 1.02, push: PUSH }],
  // ...and flops forward and down over the edge in one arc, onto the bin's front (a slap), swinging a little to the
  // left, its tip leading the fall (a second bend further out, down: 'over'), so it never lies along the gap on the
  // way (curled over to the left at the gap's height first, it lay there as a flat slab for a tenth of a second): it
  // hangs down the front, its top on it, its underside out to you, licking it...
  [TD, { bend: -0.25, dpos: 0.1, over: -0.45, arch: -0.45, yaw: -0.45, turn: -0.55, out: 0.43, reach: 1.03, curl: 0, wf: 0 }],
  [TD + 0.1, { bend: -1.05, over: -0.35, arch: -0.55, yaw: -0.55, turn: -0.75, out: 0.47 }],
  [TE, { wf: 1, bend: -1.3, dpos: 0.05, dsig: 0.04, over: 0, opos: 0.24, arch: -0.6, yaw: -0.8, turn: -1.15, out: 0.54, reach: 1.12, flat: 0.86, push: PUSH, fd: 0.3, curl: 0.05 }],
  // ...and LICKS THE BOTTOM: one sweep across the bottom of the bin's front, its tip laid flat on it (not curled out:
  // there the sculpt's tip folded into a ledge across it), as its base slides to the middle
  [TE + 0.06, { fd: -0.15, curl: 0, ttw: 0.25, out: 0.54, reach: 1.12 }],
  // it draws up and comes to rest in the MIDDLE of the front, a beat, the tip curling up and out toward you
  [TS, { out: 0.45, reach: 1.06, fd: -0.06, curl: -0.3, cup: 0.2, ttw: 0, push: PUSH, wf: 1 }],
  [TS + 0.08, { curl: -1.35 }],
  [TS + 0.13, { curl: -1.3 }],
  // SLURPS back in through the gap: one steady pull, faster and faster, the lid settling on it as it thins; the tip
  // vanishes at TV, at speed
  [TP, { out: 0.45, curl: -0.5, cup: 0.2, push: PUSH, wf: 1 }],
  [TV - 0.1, { curl: 0, push: PUSH * 0.75 }],
  [TV, { out: [0, HIT], push: PUSH * 0.4, wf: 1 }],
  [TV + 0.03, { push: 0, wf: 0 }],
  [T_END, { ...HIDDEN, trk: 0 }],
];
// The base's way round the track (trk): it stays at the middle of the right side through the first roll-over, glides
// round the front-right corner and waits there for the first tilted lick, then along the front to the left side,
// arriving as the second roll-over lands, back round the front-left corner for the last tilted lick, and along the
// front to the middle as it licks the bottom; each run easing in and out, slower round the corners (its way turns
// there). [t0, t1, from, to]
const PACE = [[0.42, 0.74, R_MID, R_CORNER], [0.74, 1.28, R_CORNER, L_SIDE], [TC + 0.02, TL + 0.12, L_SIDE, L_FRONT], [TE - 0.08, TE + 0.06, L_FRONT, 0]];
// sounds (see the header). 'slurp' gets { in }: seconds (at the lick's speed) until the tip vanishes
const CUES = [
  [T_POP, 'pop'], [T_POP + 0.03, 'squeeze'],
  [TA, 'slap', { strength: 0.6 }], [TA + 0.08, 'lick', { strength: 0.7 }],
  [P1 + 0.04, 'goo'], [TB, 'splash', { strength: 1 }], [TB + 0.12, 'lick', { strength: 0.6 }],
  [P2 + 0.04, 'goo'], [TC, 'splash', { strength: 1 }], [TC + 0.08, 'lick', { strength: 0.5 }],
  [TL + 0.04, 'goo'], [TR + 0.02, 'flick'], [TE - 0.03, 'slap', { strength: 0.8 }], [TE + 0.04, 'lick', { strength: 0.9 }],
  [TS + 0.05, 'flick'], [TP, 'slurp'],
];
// kicks: the tongue heaves up in the gap for an instant (time, how high it throws the lid's edge above where it holds
// it, how long the jolt lasts): the lid hops, flies and lands back on it (a 'rattle'): as it pops the lid, as it
// heaves its front up off the top, as it rises off it, as it is slurped in
const KICKS = [[T_POP, 0.018, 0.06], [P1 + 0.04, 0.022, 0.05], [P2 + 0.04, 0.022, 0.05], [TL + 0.06, 0.025, 0.06], [TP + 0.18, 0.018, 0.05], [TV - 0.08, 0.026, 0.05]];
// spit (time, how many, from where, how hard): squirted out of the gap beside the tongue as it squeezes and as it is
// slurped in, flung off the tip as it flops over, a SPLASH as it slaps down (see splashBurst)
const BURSTS = [[T_POP + 0.04, 3, 'gap'], [TA, 0, 'splash', 0.45], [TB, 0, 'splash', 1], [TC, 0, 'splash', 1],
  [TR + 0.04, 2, 'tip'], [TE - 0.03, 0, 'splash', 0.6], [TP + 0.12, 2, 'gap'], [TV - 0.15, 3, 'gap'], [TV - 0.03, 3, 'gap']];
// strings of spit across the gap, from the rim to the lid's edge, beside the tongue (time, side): the lid pops and
// they stretch and snap
const STRINGS = [[T_POP + 0.01, -1], [T_POP + 0.02, 1]];
// it peels its front off the top (time, how many strings): strings of spit from its face to the lid stretch as it
// rises, and snap
const PEELS = [[P1 + 0.03, 3], [P2 + 0.03, 3], [TL + 0.04, 2]];
// drool runs down over the lid's front edge, near where it licked (time, where along the track: the front is
// |trk| < TRK_FX, a front corner beyond it)
const RUNS = [[TA + 0.2, 0.42], [TB + 0.06, 0.3], [TC + 0.04, -0.3], [TL + 0.06, -0.15]];

let TRACKS = null; // (built once the module's constants are all defined)

export function createTongue(THREE, opts = {}) {
  TRACKS ??= buildTracks(POSES);
  const O = Object.assign({
    url: '/assets/3d/tongue-model.glb', rimY: 0.78, open: [0.439, 0.395], outer: [0.554, 0.5], seed: 7, shadows: true,
    tint: 0xe8a4ac, onCue: null, fxParent: null, wait: 1.5,
  }, opts);
  const [OX, OZ] = O.open, [UX, UZ] = O.outer, FLOOR = -O.rimY, G = 9.8;
  // how far in from (px, pz) (on the rim, outside the opening), straight in along -(nx, nz), the opening begins
  const toOpening = (px, pz, nx, nz) => Math.max(0,
    Math.abs(px) > OX && nx * px > 0 ? (Math.abs(px) - OX) / Math.max(0.2, Math.abs(nx)) : 0,
    Math.abs(pz) > OZ && nz * pz > 0 ? (Math.abs(pz) - OZ) / Math.max(0.2, Math.abs(nz)) : 0);
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
    if (name === 'rattle') { if (info.strength < 0.3 || clock - lastRattle < 0.22 || (Lk && Lk.t < T_POP + 0.06)) return; lastRattle = clock; }
    if (name === 'pop') lastRattle = clock - 0.16; // (the lid's knock just after the pop would double it: none for 60 ms)
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
  // A hinged plate with weight. H: how high its edge is where the tongue holds it up (its place on the track); the
  // tongue's push holds it up. When the intro rolls it (lick({ roll })), it tips toward the tongue: part of the lift is
  // the pitch (the whole front edge), the rest a roll about the far side's edge (on a side it is all roll: that whole
  // side lifts; near a front corner some of each).
  const lid = { H: 0, v: 0, push: 0, on: false, sin: 0, cos: 1, tan: 0, ze: HINGE_Z + LID_D, fn: null, rfn: null, tilt: false, px: 0, pz: 0.5, front: 1, rs: 0, rc: 1, xp: -LID_HW, rsl: 0 };
  // (px, pz: where the tongue holds its edge up, on the track; front: how much of the lift there is pitch)
  function lidAngle() {
    const h = Math.max(0, lid.H);
    // the lift where the tongue is: the share that is pitch (the front edge up) is all of it across the front's middle,
    // less toward the front's ends (TILT), none on a side (a blend round a corner); the rest is roll about the far
    // side's edge (pushed up on the right side, the whole right edge rises, front to back). (The pitch-only middle is
    // wide: narrow, the lid see-sawed from its right side up to its left side as the base crossed it.)
    const a = lid.tilt ? lid.front * (1 - TILT * smooth(0.06, 0.38, Math.abs(lid.px))) : 1;
    lid.sin = Math.min(0.6, a * h / Math.max(0.4, lid.pz - HINGE_Z)); lid.cos = Math.sqrt(1 - lid.sin * lid.sin);
    lid.tan = lid.sin / lid.cos; lid.ze = HINGE_Z + LID_D * lid.cos;
    lid.rs = lid.tilt ? Math.min(0.3, (1 - a) * h / (Math.abs(lid.px) + LID_HW)) * (lid.px < 0 ? -1 : 1) : 0;
    lid.rc = Math.sqrt(1 - lid.rs * lid.rs);
    lid.xp = lid.rs < 0 ? LID_HW : -LID_HW;
    lid.rsl = lid.rs / lid.rc / lid.cos; // (its underside's slope across, in tongue space)
  }
  const lidPitch = () => -Math.asin(lid.sin);
  const lidRoll = () => Math.asin(lid.rs);
  // lid space (x, up from its underside, along from the hinge) <-> tongue space (the roll about the edge at x = xp,
  // inside the pitch about the hinge, as the intro nests them)
  const toRig = (l, out) => {
    const dx = l.x - lid.xp, x = lid.xp + dx * lid.rc - l.y * lid.rs, y = dx * lid.rs + l.y * lid.rc;
    return out.set(x, y * lid.cos + l.z * lid.sin, HINGE_Z - y * lid.sin + l.z * lid.cos);
  };
  const toLid = (p, out) => {
    const y = p.y, z = p.z - HINGE_Z, y1 = y * lid.cos - z * lid.sin, dx = p.x - lid.xp;
    return out.set(lid.xp + dx * lid.rc + y1 * lid.rs, -dx * lid.rs + y1 * lid.rc, y * lid.sin + z * lid.cos);
  };
  // a direction in lid space -> tongue space
  const dirToRig = (n, out) => {
    const x = n.x * lid.rc - n.y * lid.rs, y = n.x * lid.rs + n.y * lid.rc;
    return out.set(x, y * lid.cos + n.z * lid.sin, -y * lid.sin + n.z * lid.cos);
  };
  function lidStep(h, p, t) { // p: the tongue's push now (0: not in the gap); t: the lick's time at the end of the step
    const pv = h > 0 ? (p - lid.push) / h : 0;
    lid.push = p;
    // a kick: if the lid is riding on the tongue, it is thrown up to fly about kick's h higher
    for (const [t0, kh] of KICKS) if (t0 > t - h && t0 <= t && p > 0 && lid.H <= p + 0.012) { lid.v = Math.max(lid.v, Math.sqrt(2 * LID_G * kh)); lid.on = false; lid.H = Math.max(lid.H, p) + 1e-4; }
    lid.v -= LID_G * (t > T_SLAM ? SLAM_G : 1) * h; lid.H += lid.v * h; // (once the tongue is in, it is yanked shut: a slam)
    if (p > 0 && lid.H <= p) { // on the tongue
      if (!lid.on) { const s = pv - lid.v; if (s > 0.3) cue('rattle', { strength: Math.min(1, s / 2.2) }); lid.v = pv + (s > 0.3 ? 0.3 * s : 0); }
      else lid.v = Math.max(lid.v, pv);
      lid.H = p; lid.on = true;
    } else if (lid.H > p + 1e-4) lid.on = false;
    if (lid.H <= 0) { // on the rim
      if (lid.v < -0.25) cue('clap', { strength: Math.min(1, -lid.v / 2.2) });
      lid.v = lid.v < -1 ? -(t > T_SLAM ? 0.3 : 0.48) * lid.v : 0; // (a hard landing bounces once; a soft one stays put)
      lid.H = 0;
    }
  }
  const tellLid = () => {
    if (silent) return;
    try { lid.fn?.(lidPitch()); } catch (e) { /* the intro's business */ }
    try { lid.rfn?.(lidRoll()); } catch (e) { /* the intro's business */ }
  };

  // ------------------------------------------------------------------------------------------ wet things
  // Spit is a cartoon liquid (its own little unlit shader): a light body, a darker blue-grey edge so it reads on the
  // white page, a crisp white highlight dot and a soft bounce. The drops are milky and nearly opaque, shaded darker
  // underneath (beads of spit, not see-through bubbles).
  const liquid = (o) => { const m = liquidMaterial(THREE, o); owned.push(m); return m; };
  const dropMat = liquid({ tint: 0xdbe2ea, edge: 0x56697f, alpha: 0.97, edgeAlpha: 0.97, defines: { DROP: '' } });
  const crownMat = liquid({ tint: 0xe3eaf3, edge: 0x6a7f9a, alpha: 0.3, edgeAlpha: 0.9, defines: { FADE: '', CROWN: '' }, side: THREE.DoubleSide });
  const puddleMat = liquid({ tint: 0xb6c6da, edge: 0x6f86a3, alpha: 0.5, edgeAlpha: 0.92, defines: { FADE: '', PUDDLE: '' } });
  puddleMat.polygonOffset = true; puddleMat.polygonOffsetFactor = -2; puddleMat.polygonOffsetUnits = -2;
  const stringMat = liquid({ tint: 0xe6edf5, edge: 0x6a809c, alpha: 0.72, edgeAlpha: 0.95 });
  // wet spots on the black lid: a glossy sheen, not a grey puddle (see SHEEN in the shader): a touch darker, a thin
  // bright edge, and a crisp highlight of the sun that slides over them as the camera and the lid move: they glisten
  const spotMat = liquid({ tint: 0x010203, edge: 0x30394a, alpha: 0.28, edgeAlpha: 0.3, defines: { FADE: '', PUDDLE: '', SHEEN: '' } });
  spotMat.polygonOffset = true; spotMat.polygonOffsetFactor = -2; spotMat.polygonOffsetUnits = -2;

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
  const MAXD = 280, MAXC = 24, MAXP = 40, MAXWS = 72, MAXS = 12;
  const puddles = instanced(puddleGeometry(THREE, rng), puddleMat, MAXP, true);
  puddles.renderOrder = 1;
  const spots = instanced(puddleGeometry(THREE, rng), spotMat, MAXWS, true);
  spots.renderOrder = 1;
  const crowns = instanced(crownGeometry(THREE), crownMat, MAXC, true);
  crowns.renderOrder = 2;
  const drops = instanced(new THREE.IcosahedronGeometry(1, 2), dropMat, MAXD);
  drops.castShadow = O.shadows; drops.renderOrder = 3;

  const D = [], C = [], PD = [], STR = [];
  for (let k = 0; k < MAXD; k++) D.push({ on: false, p: V(), v: V(), r: 0, kind: 0, age: 0 });
  for (let k = 0; k < MAXC; k++) C.push({ on: false, p: V(), t: 0, life: 0.3, R: 0, H: 0, rot: 0 });
  for (let k = 0; k < MAXP; k++) PD.push({ on: false, p: V(), t: 0, life: 2, R: 0, rot: 0, onLid: false, l: V() });
  const WS = []; // the wet spots on the lid (lid space: they ride on it)
  for (let k = 0; k < MAXWS; k++) WS.push({ on: false, p: V(), t: 0, life: 1, R: 0, rot: 0, sx: 1, onLid: true, l: V() });
  const take = (pool, age) => { let best = null; for (const o of pool) { if (!o.on) return o; if (!best || age(o) > age(best)) best = o; } return best; };
  function spawnDrop(p, v, r, kind = 0) {
    const d = take(D, (o) => o.age);
    d.on = true; d.p.copy(p); d.v.copy(v); d.r = Math.min(r * 0.8, 0.034); d.kind = kind; d.age = 0;
    const sp = d.v.length(); if (sp > 5) d.v.multiplyScalar(5 / sp);
  }
  function puddle(x, y, z, R0, life, onLid = false) {
    if (onLid) { spot(x, y, z, R0, life); return; }
    const p = take(PD, (o) => o.t);
    p.on = true; p.p.set(x, y + 0.002, z); p.t = 0; p.life = life; p.R = R0; p.rot = rng() * 6.28; p.onLid = false;
  }
  // a wet spot on the lid's top at (x, y, z) (tongue space; y is moved onto the top under it), R across (stretched sx
  // along a random way): it rides on the lid, glistens and dries. Not once the lick is over (the intro moves the bin
  // afterwards, and the spots would float)
  function spot(x, y, z, R0, life, sx = 1) {
    if (!Lk) return;
    const w = take(WS, (o) => o.t / o.life);
    toLid(V3.set(x, y, z), w.l);
    const top = lidTopRaw(w.l.x, w.l.z);
    if (top < 0) return; // (off the lid)
    // (all of it on the lid, its splats too (they reach ~1.6 times out): hanging past the edge, against the white, a
    // wet sheen is a grey smudge in the air)
    R0 = Math.min(R0, (-oct2(Math.abs(w.l.x), Math.abs(w.l.z - 0.47), LID_HW, 0.53, 0.96) - 0.012) / (1.6 * Math.max(1, sx)));
    if (R0 < 0.012) return;
    w.l.y = top + 0.002;
    w.on = true; w.t = 0; w.life = life; w.R = R0; w.rot = rng() * 6.28; w.sx = sx;
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

  // strings of spit: one indexed mesh, MAXS strings of 16 x 6. Each end is on the tongue (a bone and a point in its
  // frame), on the lid (lid space) or fixed (on the bin).
  const SEG = 16, SS = 6, SV = (SEG + 1) * SS;
  const sPos = new Float32Array(MAXS * SV * 3), sNrm = new Float32Array(MAXS * SV * 3), sIdx = [];
  for (let k = 0; k < MAXS; k++) for (let u = 0; u < SEG; u++) for (let j = 0; j < SS; j++) {
    const a = k * SV + u * SS + j, b = k * SV + u * SS + (j + 1) % SS;
    sIdx.push(a, b, a + SS, b, b + SS, a + SS); // (wound so the outside faces out)
  }
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3).setUsage(THREE.DynamicDrawUsage));
  sGeo.setAttribute('normal', new THREE.BufferAttribute(sNrm, 3).setUsage(THREE.DynamicDrawUsage));
  sGeo.setIndex(sIdx);
  const strings = new THREE.Mesh(sGeo, stringMat);
  strings.frustumCulled = false; strings.visible = false; strings.renderOrder = 3;
  fx.add(strings); owned.push(sGeo);
  const end = () => ({ t: 'fix', k: 0, l: V() });
  for (let k = 0; k < MAXS; k++) STR.push({ on: false, ea: end(), eb: end(), a: V(), b: V(), av: V(), t: 0, snapAt: -1, snapLen: 0.3, life: 0.45, sag: 0, bead: 0.5, ph: 0, thin: 1, run: false, runT: 0.5 });

  // ------------------------------------------------------------------------------------------ the tongue (its model)
  // Everything below is filled in by build() when the GLB arrives.
  let mesh = null, mat = null, failed = null, pendingWarm = null;
  let NJ = 0, L = 1, STALK = 0, restP = [], restQ = [], restLen = [], hw = [], hh = [], sAt = [], relQ = [];
  let zT = null, zB = null, xW = null;
  let cupInfo = [], chainBones = [], cupBones = [], springF = [], curlN = [], uSq = null;
  let pos = [], rot = [], rotInv = [], blen = null, tgtO, tgtP, tgtY, tgtR, angP, angY, angR, velP, velY, velR, kz, kzT, kzB, kw;
  let tgtFP, tgtFY, tgtFR, angFP, angFY, angFR, velFP, velFY, velFR; // (the free pose, sprung on its own)
  let contact, wasContact, cpt, cnr, conLid, cType;
  let tipPin = null, EMIT = [], emitPrev = [], emitAcc = new Float32Array(0);
  const par = { out: 0, reach: 1, push: 0, trk: 0, exit: 0, bend: 0, turn: 0, dpos: 0.06, dsig: 0.05, arch: 0, curl: 0, yaw: 0, hook: 0, roll: 0, wave: 0, ws: 0, cup: 0, stick: 0, over: 0, opos: 0.3, osig: 0.06, flat: 1, wl: 0, wf: 0, ta: 0, hd: 0, kc: 0, fd: 0, fk: 0, twist: 0, ttw: 0, aim: 0, lift: 0, spin: 0, wide: 0, flip: 1, wlag: 0 };
  let phase = 0, sx = 1, primed = false, uSlot = 0, kSlot = 0;
  // the gap where the tongue is: its spine's point there (p), its frame (q) and the rest frame turned to lie along it
  // (r0); the way it goes through (along), its top and up; the track there (n: out, t: along the track toward + trk,
  // both level), the way the hidden part runs back in (hA, hU: along and up without the slant), and how far in from
  // the gap the opening begins (strip)
  const slot = { p: V(), q: new THREE.Quaternion(), r0: new THREE.Quaternion(), along: V(), top: V(), up: V(), n: V(), t: V(), hA: V(), hU: V(), strip: 0.1, cth: -1, sth: 0 };
  const TK = { x: 0, z: 0.5, nx: 0, nz: 1, tx: 1, tz: 0, front: 1 }, SL = V(), SE = V();
  const uSlotS = { value: 0 }; // (the shader's copy of uSlot: what is behind it is in the dark)
  // where the next joint is along the chain (past the last one: the tip's end): with only the tip out, the bone in the
  // gap is the last one
  const sNext = (k) => (k + 1 < NJ ? sAt[k + 1] : L);

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
    zT = new Float32Array(NJ); zB = new Float32Array(NJ); xW = new Float32Array(NJ);
    for (let i = 0; i < P.count; i++) {
      let b = SI.getX(i), w = SW.getX(i);
      if (SW.getY(i) > w) { b = SI.getY(i); w = SW.getY(i); }
      if (SW.getZ(i) > w) { b = SI.getZ(i); w = SW.getZ(i); }
      if (SW.getW(i) > w) { b = SI.getW(i); }
      const k = jointOfBone[b] ?? 0;
      V1.fromBufferAttribute(P, i).sub(restP[k]).applyQuaternion(qi[k]);
      top[i * 2] = clamp(V1.z / Math.max(1e-3, hh[k]), -1.5, 1.5);
      top[i * 2 + 1] = sAt[k] + clamp(V1.y, -0.05, restLen[k] + 0.05);
      // how far the skin reaches from the spine toward the top, the underside and the sides, bone by bone (the
      // sculpted tongue is not an ellipse: its underside is flatter than its top)
      zT[k] = Math.max(zT[k], V1.z); zB[k] = Math.max(zB[k], -V1.z); xW[k] = Math.max(xW[k], Math.abs(V1.x));
    }
    geo.setAttribute('aWhere', new THREE.BufferAttribute(top, 2));
    // The groove down its top: in the sculpt it runs between two rounded crests, ~0.02 deep at the root. Wherever its
    // top is seen edge-on (folded over an edge, reared up) that valley is the outline, and two round lobes read as
    // something else entirely. aFill lifts the valley's floor (bone by bone, filled like water up to the lower crest)
    // in the rest pose; the shader lifts it by FILL of that: the groove stays painted (its colour and its normal map),
    // not dented (dented even a little, it showed as a dark crack where it folds over the lid's edge, seen edge-on).
    {
      const NBIN = 48, BW = 0.5 / NBIN, prof = Array.from({ length: NJ }, () => new Float32Array(NBIN).fill(-1));
      const nrm = geo.attributes.normal, bin = (x) => Math.floor((x + 0.25) / BW), main = new Int16Array(P.count), loc = new Float32Array(P.count * 3);
      for (let i = 0; i < P.count; i++) {
        let b = SI.getX(i), w = SW.getX(i);
        if (SW.getY(i) > w) { b = SI.getY(i); w = SW.getY(i); }
        if (SW.getZ(i) > w) { b = SI.getZ(i); w = SW.getZ(i); }
        if (SW.getW(i) > w) { b = SI.getW(i); }
        const k = jointOfBone[b] ?? 0;
        main[i] = k;
        V1.fromBufferAttribute(P, i).sub(restP[k]).applyQuaternion(qi[k]);
        loc[i * 3] = V1.x; loc[i * 3 + 1] = V1.y; loc[i * 3 + 2] = V1.z;
        V2.fromBufferAttribute(nrm, i).applyQuaternion(qi[k]);
        const j = bin(V1.x);
        if (V2.z > 0.2 && j >= 0 && j < NBIN) prof[k][j] = Math.max(prof[k][j], V1.z);
      }
      const fill = prof.map((p) => {
        const f = new Float32Array(NBIN).fill(-1), L2 = new Float32Array(NBIN), R2 = new Float32Array(NBIN);
        let m = -1; for (let j = 0; j < NBIN; j++) { m = Math.max(m, p[j]); L2[j] = m; }
        m = -1; for (let j = NBIN - 1; j >= 0; j--) { m = Math.max(m, p[j]); R2[j] = m; }
        for (let j = 0; j < NBIN; j++) f[j] = p[j] < 0 ? -1 : Math.min(L2[j], R2[j]);
        return f;
      });
      const aFill = new Float32Array(P.count * 3);
      for (let i = 0; i < P.count; i++) {
        const k = main[i], j = bin(loc[i * 3]), z = loc[i * 3 + 2];
        if (k < 2 || j < 0 || j >= NBIN || fill[k][j] < 0 || prof[k][j] < 0) continue;
        if (z < prof[k][j] - 0.03) continue; // (only the top skin)
        const up = Math.max(0, fill[k][j] - prof[k][j]) * smooth(prof[k][j] - 0.03, prof[k][j] - 0.004, z);
        if (up <= 0) continue;
        V1.set(0, 0, up).applyQuaternion(restQ[k]);
        aFill[i * 3] = V1.x; aFill[i * 3 + 1] = V1.y; aFill[i * 3 + 2] = V1.z;
      }
      geo.setAttribute('aFill', new THREE.BufferAttribute(aFill, 3));
    }
    // (bone by bone the extents are noisy, and the spine wanders a little in the sculpt: eased along the length, so
    // whatever lies along a surface lies smoothly on it, not in waves; but never more than a hair under the sculpt's
    // own reach there, or its skin would dip into what it lies on)
    for (const a of [zT, zB, xW]) {
      const raw = Float32Array.from(a);
      for (let it = 0; it < 3; it++) {
        const b = Float32Array.from(a);
        for (let k = 2; k < NJ - 1; k++) a[k] = 0.25 * b[k - 1] + 0.5 * b[k] + 0.25 * b[k + 1];
      }
      for (let k = 0; k < NJ; k++) a[k] = Math.max(a[k], raw[k] - 0.003);
    }
    // The squash (see squash()) is done per vertex, in the rest pose, before skinning (in the shader): each vertex is
    // scaled across the tongue and through it, about the spine, by how much the tongue is squeezed where it is along it
    // (in the gap: flat and wide; out of it: its full, round, sculpted volume). For that, per vertex: how far along the
    // rest spine its nearest point is (aWhere.y, s), the spine's frame there (aAx: across, aAz: toward its top; eased
    // from bone to bone between their middles, so the squash's axes turn smoothly) and its offset across and through
    // (aOff). The bones themselves are never scaled across or through: the skin bends round, not in faceted steps.
    {
      const mid = (k) => sAt[k] + 0.5 * restLen[k], QA = new THREE.Quaternion();
      const frameAt = (s) => {
        if (s <= mid(0)) return QA.copy(restQ[0]);
        let k = 0; while (k < NJ - 2 && mid(k + 1) <= s) k++;
        return s >= mid(NJ - 1) ? QA.copy(restQ[NJ - 1]) : QA.copy(restQ[k]).slerp(restQ[k + 1], clamp((s - mid(k)) / (mid(k + 1) - mid(k)), 0, 1));
      };
      const pointAt = (s, out) => { let k = 0; while (k < NJ - 1 && sAt[k + 1] <= s) k++; return out.copy(Y).applyQuaternion(restQ[k]).multiplyScalar(s - sAt[k]).add(restP[k]); };
      const ax = new Float32Array(P.count * 3), az = new Float32Array(P.count * 3), off = new Float32Array(P.count * 2), und = new Float32Array(P.count);
      for (let i = 0; i < P.count; i++) {
        V1.fromBufferAttribute(P, i);
        let s = top[i * 2 + 1];
        for (let it = 0; it < 4; it++) { // (Newton: the point of the spine whose cross-section it lies in)
          frameAt(s); V3.copy(Y).applyQuaternion(QA);
          s = clamp(s + V2.subVectors(V1, pointAt(s, V2)).dot(V3), -0.1, L + 0.1);
        }
        frameAt(s); pointAt(s, V2); V2.subVectors(V1, V2);
        V3.copy(X).applyQuaternion(QA); ax[i * 3] = V3.x; ax[i * 3 + 1] = V3.y; ax[i * 3 + 2] = V3.z; off[i * 2] = V2.dot(V3);
        V3.copy(Z).applyQuaternion(QA); az[i * 3] = V3.x; az[i * 3 + 1] = V3.y; az[i * 3 + 2] = V3.z; off[i * 2 + 1] = V2.dot(V3);
        top[i * 2 + 1] = s;
        und[i] = clamp(off[i * 2] / Math.max(0.02, sec(xW, s)), -1.2, 1.2); // (how far across, -1 .. 1: for the underside's anatomy)
      }
      geo.setAttribute('aAx', new THREE.BufferAttribute(ax, 3));
      geo.setAttribute('aAz', new THREE.BufferAttribute(az, 3));
      geo.setAttribute('aOff', new THREE.BufferAttribute(off, 2));
      geo.setAttribute('aUnd', new THREE.BufferAttribute(und, 1));
      geo.attributes.aWhere.needsUpdate = true;
    }

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
    const uRoll = { value: new THREE.Vector2(0, -LID_HW) }; // the lid's roll: its underside's slope across, the pivot edge
    const uEdge = { value: new THREE.Vector3(LID_HW, 0.93, 0) }; // its outline: its sides' x, its cut corners' |x| + z; how far open
    const uFill = { value: FILL };
    // the squash along the tongue (see squash(): across, its top's and its underside's thickness, how crushed), a table
    // over s that the shader reads (Catmull-Rom: smooth, and so are its slopes, which turn the normals)
    uSq = { value: Array.from({ length: NSQ }, () => new THREE.Vector4(1, 1, 1, 0)) };
    const uSqK = { value: new THREE.Vector2((NSQ - 1) / L, NSQ - 1) };
    const sqUniforms = (sh) => { sh.uniforms.uSq = uSq; sh.uniforms.uSqK = uSqK; };
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uHole = { value: new THREE.Vector4(OX, OZ, UX, UZ) };
      sh.uniforms.uEdge = uEdge;
      sh.uniforms.uStalk = { value: STALK };
      sh.uniforms.uLen = { value: L };
      sh.uniforms.uSlotS = uSlotS;
      sh.uniforms.uLid = uLid;
      sh.uniforms.uRoll = uRoll;
      sh.uniforms.uFill = uFill;
      sqUniforms(sh);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>\nattribute vec2 aWhere;\nattribute vec3 aFill;\nattribute float aUnd;\nvarying vec3 vUnd;\nvarying vec3 vRig;\nvarying vec2 vWhere;\nvarying float vCrush;\nuniform vec4 uLid;\nuniform vec2 uRoll;\nuniform vec3 uEdge;\nuniform vec4 uHole;\nuniform float uFill;\n${SQ_GLSL}`)
        // the groove's floor lifted (aFill), its walls turned up with it; where it is pressed flat (in the gap) all the
        // way: a flat ribbon there, the groove only painted on. Then the squash turns the normals with it (the inverse
        // transpose of its Jacobian, in the spine's frame: scaled across and through, and sloped where the squash
        // changes along the tongue), so it shades as smoothly as it bends
        .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
          vec4 sqV, sqD;
          sqAt(aWhere.y, sqV, sqD);
          float cr = sqV.w;
          float fillK = mix(uFill, 1.0, smoothstep(0.1, 0.45, cr));
          float fillA = fillK * smoothstep(0.0, 0.008, length(aFill));
          objectNormal = normalize(mix(objectNormal, normalize(aFill + vec3(1e-6)), 0.85 * fillA));
          {
            vec3 ay = cross(aAz, aAx);
            float ox = aOff.x + dot(aFill, aAx) * fillK, oz = aOff.y + dot(aFill, aAz) * fillK;
            float zf = oz > 0.0 ? sqV.y : sqV.z, dz = oz > 0.0 ? sqD.y : sqD.z;
            float nx = dot(objectNormal, aAx) / sqV.x, ny = dot(objectNormal, ay), nz = dot(objectNormal, aAz) / zf;
            ny -= sqD.x * ox * nx + dz * oz * nz;
            objectNormal = normalize(aAx * nx + ay * ny + aAz * nz);
          }`)
        .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed += aFill * fillK;\n' + SQ_GLSL_POS)
        // (the bones stretch along their length when it reaches: normals by the inverse transpose)
        .replace('#include <skinnormal_vertex>', `#ifdef USE_SKINNING
          mat4 skinMatrix = mat4(0.0);
          skinMatrix += skinWeight.x * boneMatX; skinMatrix += skinWeight.y * boneMatY;
          skinMatrix += skinWeight.z * boneMatZ; skinMatrix += skinWeight.w * boneMatW;
          skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
          objectNormal = transpose(inverse(mat3(skinMatrix))) * objectNormal;
          #endif`)
        // in the gap it can't be thicker than the gap: under the lid, never above its underside; over the rim, never
        // below its top (the bones do nearly all of it; this makes it exact), wherever along the track it comes out
        .replace('#include <skinning_vertex>', `#include <skinning_vertex>
${GAP_GLSL}
vCrush = cr;`)
        .replace('#include <project_vertex>', 'vRig = transformed;\nvWhere = aWhere;\nvUnd = vec3(aUnd, aOff.y, aWhere.y);\n#include <project_vertex>');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vRig;\nvarying vec2 vWhere;\nvarying float vCrush;\nvarying vec3 vUnd;\nuniform vec4 uHole;\nuniform float uStalk;\nuniform float uLen;\nuniform float uSlotS;\nuniform vec4 uLid;\nuniform vec2 uRoll;\nuniform vec3 uEdge;\n' + UNDER_GLSL)
        // crushed flat in the gap it is dull, not glazed (no hard wet glints on the squeezed flanges)
        // (pressed flat it is smooth: the relief of its taste buds and its groove mostly gone)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          normal = normalize(mix(normal, nonPerturbedNormal, 0.7 * vCrush));
          // (the underside's relief, as a bump: the frenulum's fold, the veins, the wet wrinkles that break its gloss
          // into glints; worked out for every pixel, no branch: it takes screen derivatives)
          float undHt = undRelief(vUnd, undV) * undC * (1.0 - vCrush);
          normal = undBump(normal, undHt, faceDirection);`)
        .replace('#include <clearcoat_normal_fragment_maps>', `#include <clearcoat_normal_fragment_maps>
          #ifdef USE_CLEARCOAT
          clearcoatNormal = undBump(clearcoatNormal, undHt, faceDirection);
          #endif`)
        .replace('#include <lights_physical_fragment>', `#include <lights_physical_fragment>
          material.clearcoat *= 1.0 - 0.85 * vCrush;
          material.roughness = mix(material.roughness, max(material.roughness, 0.55), vCrush);
          // the underside: as wet as the top, its coat a touch broader (its relief breaks the coat's highlights into
          // many small glints: smooth, its few big mirror glints, one on each of its two lobes, read as a pair of eyes)
          material.clearcoatRoughness = mix(material.clearcoatRoughness, 0.26, undC);`)
        // the underside (it hangs down the bin's front, to you): a soft pink, a touch lighter than the top, faint bluish
        // veins either side of the middle
        .replace('#include <map_fragment>', `#include <map_fragment>
          float undC = smoothstep(-0.05, -0.65, vWhere.x), undV = 0.0;
          undRelief(vUnd, undV);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.08, 1.0, 1.04), undC);
          diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.6, 0.48, 0.85), 0.75 * undV * undC * (1.0 - vCrush));`)
        // the studio lights the gloss more than the flesh: a deep, wet red rather than a bright pink (the underside, in
        // the shade under the lid as it hangs down the front, a little more: not a dark, dull flap)
        .replace('#include <lights_fragment_maps>', '#include <lights_fragment_maps>\niblIrradiance *= mix(0.35, 0.6, undC);')
        // inside the opening, below the rim, it sinks into the black of the bin; under the lid, into the dark of the
        // gap; the stalk (the throat) is dark anywhere
        .replace('#include <opaque_fragment>', `
          float inHole = (1.0 - smoothstep(uHole.x - 0.05, uHole.x + 0.01, abs(vRig.x))) * (1.0 - smoothstep(uHole.y - 0.05, uHole.y + 0.01, abs(vRig.z)));
          outgoingLight *= mix(1.0, mix(0.02, 1.0, smoothstep(-0.26, 0.01, vRig.y)), inHole);
          // (as dark as it is deep under the lid for how far the lid is open)
          // (only under it: not what lies on its top)
          float yLid = (vRig.z + 0.5) * uLid.x + (vRig.x - uRoll.y) * uRoll.x;
          float dIn = -max(max(abs(vRig.x) - uEdge.x, vRig.z - uLid.y), (abs(vRig.x) + vRig.z - uEdge.y) * 0.7071);
          float underLid = uLid.w * smoothstep(-0.006, 0.07 + 1.5 * uEdge.z, dIn) * smoothstep(-0.06, -0.01, vRig.y) * smoothstep(yLid + 0.06, yLid + 0.02, vRig.y);
          outgoingLight *= mix(1.0, 0.025, underLid);
          outgoingLight *= mix(0.06, 1.0, smoothstep(uStalk - 0.14, uStalk + 0.06, vWhere.y));
          // (and whatever is more than a little behind the gap, along it, is in the dark under the lid: seen through
          // the gap where the lid is lifted beside a corner, it would show as a pink strip)
          outgoingLight *= mix(1.0, 0.03, smoothstep(uSlotS - 0.015, uSlotS - 0.07, vWhere.y));
          #include <opaque_fragment>`);
    };
    mat.userData.uLid = uLid; mat.userData.uRoll = uRoll; mat.userData.uEdge = uEdge; mat.userData.uFill = uFill;
    mat.customProgramCacheKey = () => 'tongue-model-track-4';
    mat.needsUpdate = true;
    // its shadow: squashed and kept out of the lid and the rim the same way
    const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
    depth.onBeforeCompile = (sh) => {
      sh.uniforms.uHole = { value: new THREE.Vector4(OX, OZ, UX, UZ) };
      sh.uniforms.uEdge = uEdge; sh.uniforms.uLid = uLid; sh.uniforms.uRoll = uRoll; sh.uniforms.uFill = uFill;
      sqUniforms(sh);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>\nattribute vec2 aWhere;\nattribute vec3 aFill;\nuniform vec4 uLid;\nuniform vec2 uRoll;\nuniform vec3 uEdge;\nuniform vec4 uHole;\nuniform float uFill;\n${SQ_GLSL}`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>\nvec4 sqV, sqD;\nsqAt(aWhere.y, sqV, sqD);\nfloat fillK = mix(uFill, 1.0, smoothstep(0.1, 0.45, sqV.w));\ntransformed += aFill * fillK;\n${SQ_GLSL_POS}`)
        .replace('#include <skinning_vertex>', `#include <skinning_vertex>\n${GAP_GLSL}`);
    };
    depth.customProgramCacheKey = () => 'tongue-model-depth-3';
    m.customDepthMaterial = depth;
    owned.push(depth);

    // the chain's state
    pos = Array.from({ length: NJ + 1 }, V); rot = Array.from({ length: NJ }, () => new THREE.Quaternion());
    rotInv = Array.from({ length: NJ }, () => new THREE.Quaternion()); blen = new Float32Array(NJ);
    const f32 = () => new Float32Array(NJ);
    tgtP = f32(); tgtY = f32(); tgtO = f32(); tgtR = f32(); angP = f32(); angY = f32(); angR = f32(); velP = f32(); velY = f32(); velR = f32();
    tgtFP = f32(); tgtFY = f32(); tgtFR = f32(); angFP = f32(); angFY = f32(); angFR = f32(); velFP = f32(); velFY = f32(); velFR = f32();
    kz = f32().fill(1); kzT = f32().fill(1); kzB = f32().fill(1); kw = f32().fill(1);
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
    // (out of the gap down the bin's face it points round the corner it is coming to; folded back over the lid's edge
    // onto the top, it heads in leaning away from it: the same turn, the other way; in between, a blend; reared up in
    // the air, straight out: slanted there it swung out sideways as it flopped over)
    par.aim += tracks.aimA(t) * (clamp(par.wf, 0, 1) - 0.5 * clamp(par.wl, 0, 1));
    par.wlag = tracks.wlag(t);
    par.trk *= sx; par.ta *= sx; par.turn *= sx; par.yaw *= sx; par.hook *= sx; par.roll *= sx; par.twist *= sx; par.ttw *= sx; par.spin *= sx;
    par.hd *= sx; par.wlag *= sx; par.kc *= sx; par.fd *= sx; par.fk *= sx; par.aim *= sx;
    par.out = clamp(par.out, 0, Math.min(OUT_MAX, L - STALK - 0.02)); par.push = Math.max(0, par.push);
    trackAt(par.trk, TK); lid.px = TK.x; lid.pz = TK.z; lid.front = TK.front;
  }

  // The gap: where the tongue passes the lid's edge (its place on the track), its spine half way up what it holds the
  // lid at; the frame of the bone that is in it (the rest frames turned so that the rest frame at the gap lies along
  // it). Out of a side it goes sideways, out of a corner at a diagonal: everything below is laid out from this frame.
  let rcNow = 1;
  function computeSlot() {
    lidAngle();
    const push = Math.max(par.push, 2 * CL + 0.012);
    slot.n.set(TK.nx, 0, TK.nz); slot.t.set(TK.tx, 0, TK.tz);
    // (the lid's edge there, carried by the lid as it is now: it moves in a hair as the lid tips)
    toRig(SL.set(TK.x, 0, TK.z - HINGE_Z), SE);
    slot.p.set(SE.x, push / 2, SE.z);
    // (aim: it goes through the gap at a slant, + toward - trk: at the front, the viewer's left; it leaves the gap
    // tipped up by half the lid's slope out there)
    const e = par.exit + 0.5 * Math.atan(TK.nx * lid.rsl + TK.nz * lid.tan), aim = clamp(par.aim, -0.6, 0.6), sa = -Math.sin(aim), ca = Math.cos(aim);
    const ce = Math.cos(e), se = Math.sin(e);
    V2.copy(slot.t).multiplyScalar(sa).addScaledVector(slot.n, ca); // level, slanted
    slot.along.copy(V2).multiplyScalar(ce); slot.along.y = se;
    slot.up.copy(V2).multiplyScalar(-se); slot.up.y = ce;
    // (the hidden part runs in between straight in and toward the bin's middle: near a front corner, straight in from a
    // side runs along over the rim's front edge and doesn't reach the opening for a long way, under the lid, up against
    // its underside as the lid tips down toward its far edge)
    V3.set(-slot.p.x, 0, -slot.p.z).normalize().addScaledVector(slot.n, -1).normalize().negate();
    slot.hA.copy(V3).multiplyScalar(ce); slot.hA.y = se;
    slot.hU.copy(V3).multiplyScalar(-se); slot.hU.y = ce;
    // (flip: turned about its length in the gap, 1: upside down, 0: top up; the turn is the other way when mirrored)
    const th = Math.PI * clamp(par.flip, 0, 1);
    slot.cth = Math.cos(th); slot.sth = -Math.sin(th) * sx;
    slot.top.copy(slot.up).multiplyScalar(slot.cth).addScaledVector(V1.crossVectors(slot.along, slot.up), slot.sth);
    slot.q.setFromRotationMatrix(M4.makeBasis(V1.crossVectors(slot.along, slot.top), slot.along, slot.top));
    // (at a corner the opening's edge runs across it at a slant: in as far as its edges, not just its middle, are in;
    // its root is up to 0.5 wide in the gap)
    slot.strip = 0.02;
    for (let e = -2; e <= 2; e++) slot.strip = Math.max(slot.strip, toOpening(slot.p.x + e * 0.1 * TK.tx, slot.p.z + e * 0.1 * TK.tz, V3.x, V3.z));
    uSlot = L - par.out;
    let ks = 0;
    while (ks < NJ - 1 && sAt[ks + 1] <= uSlot) ks++;
    kSlot = ks;
    const f = clamp((uSlot - sAt[ks]) / restLen[ks], 0, 1);
    Q.copy(restQ[ks]); if (ks + 1 < NJ) Q.slerp(restQ[ks + 1], f);
    slot.r0.copy(slot.q).multiply(Q.invert()).multiply(restQ[ks]);
    rcNow = Math.max(0.5, par.reach);
    squash(push); // (how thick it is where: before the bends, which are limited by it)
    return push;
  }

  // The bend at every joint out of the gap (pitch: toward the top +, yaw: to the tongue's left +, roll: about its
  // length): targets from the keys, and the bends actually drawn, which chase them on springs: softer toward the tip,
  // so the tip lags and follows through (damped: no flutter). Joints still in the gap or behind it take their targets
  // at once.
  // The targets are a blend: the free pose (bend, over, turn, arch, yaw, roll: in the air) and the rails (wl: laid
  // over the lid's edge where it comes out and across its top, draped over its side; wf: down over the rim's lip and
  // the bin's face), plus what is added on top (curl, hook, wave, twist, ttw: the tip's own life).
  const ZETA = 0.55, ROUND_AT = 0.24;
  const fP = new Float32Array(32), fY = new Float32Array(32), fR = new Float32Array(32);
  const rP = new Float32Array(32), rY = new Float32Array(32), rR = new Float32Array(32);
  const qP = new Float32Array(32), qY = new Float32Array(32), qR = new Float32Array(32), twK = new Float32Array(32), rlW = new Float32Array(32), spW = new Float32Array(32);
  function targets() {
    computeSlot();
    let dw = 0, full = 0, rw = 0, tw = 0, ow = 0, xw = 0, lw = 0, pw = 0;
    // (spin: where it turns, just past the fold over the lid's edge when it lies on the lid, just past the gap if not)
    const spA = 0.04 + (FOLD_D + 0.06) * clamp(par.wl, 0, 1);
    // (ttw: in the air over the front half of what is out; lying over the lid's edge, only past the fold: over the edge
    // it stays flat on it)
    const outL = Math.max(0.05, L - uSlot), wlc = clamp(par.wl, 0, 1);
    const tw0 = 0.2 * outL * (1 - wlc) + (FOLD_D + 0.03) * wlc, tw1 = Math.max(tw0 + 0.12, 0.65 * outL * (1 - wlc) + (outL - 0.1) * wlc);
    for (let k = 1; k < NJ; k++) {
      // (a joint's share of a bend fades in as it comes out of the gap: cut off at the gap, a bend keyed near it jumped
      // onto each joint as it came out)
      const d = sAt[k] - uSlot, gw = Math.exp(-0.5 * ((d - par.dpos) / par.dsig) ** 2), din = smooth(0, 0.03, d);
      tgtY[k] = gw * din; dw += tgtY[k]; full += gw;
      tgtO[k] = Math.exp(-0.5 * ((d - par.opos) / par.osig) ** 2) * din; ow += tgtO[k];
      // (rolls and turns to the side happen where it is round again, not where it is still a flat ribbon; a turn
      // over a few joints, a roll spread evenly over all the rest, so no joint twists much: no candy-wrapping)
      // (spread over ~0.25 of its length: a wide, flat tongue bent sideways too tightly folds its inner edge through)
      tgtP[k] = Math.exp(-0.5 * ((d - ROUND_AT) / 0.11) ** 2) * smooth(0.07, 0.16, d); tw += tgtP[k];
      tgtR[k] = smooth(0.05, 0.32, d) * restLen[k - 1]; rw += tgtR[k];
      // (the tip's own twist, ttw: spread over the front half of what is out, a corkscrew, not a pinch at the tip)
      fR[k] = smooth(tw0, tw1, d) * restLen[k - 1]; xw += fR[k];
      // (roll, in the air: turned in the first ~0.3 past the gap, where it is still a flat ribbon, and the rest of it
      // turns as one: the body rolls over whole, its top or its underside square to you)
      rlW[k] = Math.max(0, smooth(0.03, 0.1, d) - smooth(0.24, 0.36, d)) * restLen[k - 1]; lw += rlW[k];
      // (spin: turned over ~0.4 from just past where it leaves the lid's edge, and the rest turns as one: lifted off
      // the top, its whole front rolls over, its top, its edge, its underside to you; the fold stays flat on the edge.
      // Turned over ~0.2, so plump a tongue crumpled into a fin and a hard edge, and the bend over the edge and the
      // turn at one joint creased it)
      spW[k] = Math.max(0, smooth(spA, spA + 0.14, d) - smooth(spA + 0.24, spA + 0.4, d)) * restLen[k - 1]; pw += spW[k];
    }
    lw = Math.max(lw, 1e-6); pw = Math.max(pw, 1e-6);
    dw = Math.max(dw, 0.5 * full, 1e-6); rw = Math.max(rw, 1e-6); tw = Math.max(tw, 1e-6); ow = Math.max(ow, 1e-6); xw = Math.max(xw, 1e-6);
    // (the free pose's own targets, whatever its weight: they are sprung on their own, so as it hands over from a rail
    // to the air its free pose is already where it is keyed, not drooping in after it; and keyed as it would be top up:
    // turned over in the gap (flip), solve() turns them the other way, so it keeps its shape as it turns about its
    // length, a cobra turning round)
    for (let k = 1; k < NJ; k++) {
      const d = sAt[k] - uSlot, len = restLen[k - 1], out = smooth(0, 0.05, d);
      fP[k] = par.bend * tgtY[k] / dw + par.over * tgtO[k] / ow + par.arch * len * out;
      fY[k] = par.turn * tgtP[k] / tw + par.yaw * len * out;
      // (the twists: on a rail they are built into the rail's frames, so it stays on the rail; see railAngles)
      twK[k] = par.twist * tgtR[k] / rw + par.ttw * fR[k] / xw + par.spin * spW[k] / pw;
      fR[k] = par.roll * rlW[k] / lw + twK[k];
    }
    tgtFP.set(fP.subarray(0, NJ)); tgtFY.set(fY.subarray(0, NJ)); tgtFR.set(fR.subarray(0, NJ));
    // (and the tip's own life, on whatever it is on)
    for (let k = 1; k < NJ; k++) {
      const d = sAt[k] - uSlot, out = smooth(0, 0.05, d), en = smooth(0, 0.25, d);
      const wv = par.wave * en * Math.sin(2 * Math.PI * (d / 0.5 - phase));
      tgtP[k] = par.curl * curlN[k] * out + wv;
      tgtY[k] = par.hook * curlN[k] * out + 0.45 * par.wave * en * Math.sin(2 * Math.PI * (d / 0.65 - 0.8 * phase) + 1.3) * sx;
      tgtR[k] = 0;
    }
  }

  // ------------------------------------------------------------------------------------------ rails
  // A rail is the line the spine is laid along, from the gap: dense points (tongue space) and the way the tongue's top
  // faces at each. It lies on the bin and the lid: a ball as thick as the tongue is there (toward the side that
  // touches) rolled along their outline (so it wraps over an edge, never cuts it), or a path across the lid's top.
  // railAngles() turns it into bends: each joint at its own distance along the chain from the gap (so as more of the
  // tongue comes out it slides along the rail, and the rail moving drags it), the bends between the bones.
  const RMAX = 512, STEP = 0.01, RMIN = 0.26, CLR = 0.009;
  let clrX = 0; // (more clearance, while the face rail is walked)
  const RP = new Float32Array(RMAX * 3), RU = new Float32Array(RMAX * 3), RS = new Float32Array(RMAX);
  let RN = 0;
  function railAdd(x, y, z, ux, uy, uz) {
    if (RN >= RMAX) return;
    const i = RN * 3;
    RS[RN] = RN ? RS[RN - 1] + Math.hypot(x - RP[i - 3], y - RP[i - 2], z - RP[i - 1]) : 0;
    if (RN && RS[RN] - RS[RN - 1] < 1e-5) return; // (no zero-length steps)
    RP[i] = x; RP[i + 1] = y; RP[i + 2] = z; RU[i] = ux; RU[i + 1] = uy; RU[i + 2] = uz; RN++;
  }
  const railLen = () => (RN ? RS[RN - 1] : 0);
  // the tongue's half thickness toward its top (top) or its underside, d along the rail from the gap (as squashed now)
  // how far it is twisted about its length (twist, ttw) d along the rail from the gap
  // (eased in over the bone before each joint, not a step at the joint: a twist concentrated over a few joints would
  // make the rails' thickness, and so their line, jump as it passes each one)
  function twistAt(d) {
    const s = uSlot + d / rcNow;
    let tw = 0;
    for (let k = Math.max(1, kSlot + 1); k < NJ; k++) {
      if (sAt[k] <= s) { tw += twK[k]; continue; }
      const a = Math.max(uSlot, sAt[k - 1]);
      if (s > a) tw += twK[k] * (s - a) / Math.max(1e-4, sAt[k] - a);
      break;
    }
    return tw;
  }
  function thickAt(d, top, flatOnly = false) {
    const s = uSlot + d / rcNow, tw = twistAt(d);
    sqEval(s);
    const fT = sec(zT, s) * SQ.zt, fB = sec(zB, s) * SQ.zb, wv = sec(xW, s) * SQ.w;
    const face = (t) => (t ? fT : fB);
    // (the clearance kept off what it lies on fades in over its first few hundredths out of the gap: in the gap its
    // spine is half way up the gap, as thick as the gap lets it be; a rail started a clearance higher than that put a
    // kink at the gap, the bone in it aimed up at the rail, then down)
    const CL0 = (CLR + clrX) * smooth(-0.01, 0.08, d);
    // (twisted about its length it rests on the edge of its section: wider than it is thick, it stands up off the
    // surface on it; turned right over, on its other face. Its section is fuller at the corners than an ellipse, its
    // underside flat: see reach())
    if (Math.abs(tw) < 0.02) return face(top) + CL0;
    const c = Math.cos(tw);
    // (lying flat on whichever face is down: eased from the one to the other as it turns past its edge; switched at a
    // quarter turn, the top's and the underside's different reach made the rail, and what lay on it, jump)
    if (flatOnly) { const w = smooth(-0.35, 0.35, c); return face(top) * w + face(!top) * (1 - w) + CL0; }
    return reach(wv * Math.sin(tw), face(c >= 0 ? top : !top) * c) + CL0;
  }
  // the tightest a rail may turn to the side: what the bend limits let the widest of what is out do (see limits())
  function turnMin() {
    let r = RMIN;
    // (a joint coming out of the gap counts in as it comes out, not all at once: the path would jump)
    for (let k = kSlot + 1; k < NJ; k++) r = Math.max(r, 1.45 * hw[k] * kw[k] * smooth(0, 0.04, sAt[k] - uSlot));
    return r;
  }
  // its half width there
  function wideAt(d) {
    const s = uSlot + d / rcNow;
    return sec(xW, s) * sqEval(s).w;
  }
  // Roll the ball along a 2D outline (B: u0, v0, u1, v1, ...; walked in order, the solid on the right when side is
  // +1, on the left when -1), from B's first point, d0 along the rail so far, until the rail is dMax long. Out: W2 (u,
  // v of the ball's centre, nu, nv: the outline's outward normal where it touches).
  const W2 = new Float32Array(1024 * 4);
  let WN = 0;
  function walk(B, nb, side, top, d0, dMax) {
    WN = 0;
    let d = d0, pu = 0, pv = 0, skip = 0;
    const put = (cu, cv, nu, nv) => {
      if (WN) d += Math.hypot(cu - pu, cv - pv);
      pu = cu; pv = cv;
      if (WN >= 1023) return;
      const i = WN * 4; W2[i] = cu; W2[i + 1] = cv; W2[i + 2] = nu; W2[i + 3] = nv; WN++;
    };
    for (let i = 0; i < nb - 1 && d < dMax; i++) {
      const au = B[2 * i], av = B[2 * i + 1], bu = B[2 * i + 2], bv = B[2 * i + 3];
      const len = Math.hypot(bu - au, bv - av);
      if (len < 1e-6) continue;
      const eu = (bu - au) / len, ev = (bv - av) / len, nu = -side * ev, nv = side * eu;
      for (let u = skip; u < len && d < dMax; u += STEP) { const t = thickAt(d, top); put(au + eu * u + nu * t, av + ev * u + nv * t, nu, nv); }
      skip = 0;
      if (i + 2 < nb) {
        const cu = B[2 * i + 4] - bu, cv = B[2 * i + 5] - bv, l2 = Math.hypot(cu, cv) || 1, fu = cu / l2, fv = cv / l2;
        const ang = Math.atan2(eu * fv - ev * fu, eu * fu + ev * fv);
        if (ang * side < 0) { // convex: round the corner
          const n = Math.max(1, Math.ceil(Math.abs(ang) * thickAt(d, top) / STEP));
          for (let j = 0; j <= n; j++) {
            const a = ang * j / n, c = Math.cos(a), s = Math.sin(a), mu = nu * c - nv * s, mv = nu * s + nv * c, t = thickAt(d, top);
            put(bu + mu * t, bv + mv * t, mu, mv);
          }
        } else skip = thickAt(d, top) * Math.tan(Math.abs(ang) / 2); // concave: the next face from where the ball touches both
      } else { const t = thickAt(d, top); put(bu + nu * t, bv + nv * t, nu, nv); }
    }
    return d;
  }
  const BB = new Float32Array(160), RA = V(), RB = V(), RC = V();
  const LMAX = 200, LX = new Float32Array(LMAX), LZ = new Float32Array(LMAX), LH = new Float32Array(LMAX), LY = new Float32Array(LMAX), LS = new Float32Array(LMAX);
  const LTK = new Float32Array(LMAX), LSE = new Float32Array(LMAX), LHT = new Float32Array(LMAX), LB = new Float32Array(LMAX);
  const LID_TOP = 0.105, PANEL_TOP = 0.18;
  // the lid's top (lid space): the band, the raised panel in the middle; off the lid, far down
  const lidTopRaw = (x, z) => (Math.abs(x) > LID_HW || z > LID_D || z < -0.06 ? -1 : LID_TOP + (PANEL_TOP - LID_TOP) * smooth(0.012, -0.012, rectSd(x, z - 0.48, 0.345, 0.305)));
  // (for resting on: past its outline the top falls away steeply, not all at once: an edge of the tongue sampled just
  // past it and just on it must rest nearly the same, or as it slides over the outline it jumps)
  // (and the raised panel's step eased into a ramp a little way out from it: a wide flat tongue lying beside it, sampled
  // only across its middle and its edges, would let the panel's corner poke up into it between them)
  const lidTopC = (x, z) => {
    const o = Math.max(Math.abs(x) - LID_HW, z - LID_D, -0.06 - z);
    return o > 0 ? LID_TOP - 4 * o : LID_TOP + (PANEL_TOP - LID_TOP) * smooth(0.07, -0.01, rectSd(x, z - 0.48, 0.345, 0.305));
  };
  const lidTopH = (x, z, dx, dz) => Math.max(lidTopC(x, z), lidTopC(x + dx, z + dz), lidTopC(x - dx, z - dz));
  // Where the tongue rests on the lid's top at (x, z), heading ph (lid space): its flat underside on the highest of
  // what is under its middle and its two edges (w either side), tipped across if it rests on one edge (a step: the
  // panel's edge). -> LT.y (its underside's height at the middle), LT.s (its slope across, toward +a)
  // (sampled at its middle, its edges and half way out to each: lying across a corner of the raised panel, sampled at
  // its middle and its edges only, the corner poked up into it between them)
  const LT = { y: 0, s: 0 }, RA5 = [-1, -0.5, 0, 0.5, 1], RH5 = new Float32Array(5);
  function restOn(x, z, ph, w) {
    const dx = -Math.sin(ph) * 0.04, dz = -Math.cos(ph) * 0.04, ax = Math.cos(ph) * w, az = -Math.sin(ph) * w;
    for (let i = 0; i < 5; i++) RH5[i] = lidTopH(x + ax * RA5[i], z + az * RA5[i], dx, dz);
    // the lowest line across it that nothing pokes up through (its middle's height LT.y, its slope LT.s): resting on
    // one point, level, or on two either side of its middle
    let by = Infinity, bs = 0;
    const ok = (y0, s) => { for (let k = 0; k < 5; k++) if (RH5[k] > y0 + s * RA5[k] * w + 1e-6) return false; return true; };
    for (let i = 0; i < 5; i++) if (RH5[i] < by && ok(RH5[i], 0)) { by = RH5[i]; bs = 0; }
    for (let i = 0; i < 3; i++) for (let j = 2; j < 5; j++) {
      if (j <= i) continue;
      const s = (RH5[j] - RH5[i]) / ((RA5[j] - RA5[i]) * w), y0 = RH5[i] - s * RA5[i] * w;
      if (y0 < by && ok(y0, s)) { by = y0; bs = s; }
    }
    LT.y = by; LT.s = bs;
    if (Math.abs(LT.s) > 0.5) { // (tipped no more than that: kept clear of all of it)
      LT.s = clamp(LT.s, -0.5, 0.5);
      for (let k = 0; k < 5; k++) LT.y = Math.max(LT.y, RH5[k] - LT.s * RA5[k] * w);
    }
  }
  // The lid rail: up the lid's edge face from the gap, wherever on the track it is (its underside on it, so its top
  // faces out), over the edge and in across the top, heading for the point (tx, tz) (tongue space; turned hd more, +:
  // toward - trk; turning at most 1/RMIN a unit length) and curving kc more; if it gets to an edge, over it and down
  // that side of the bin (draped from the lid's edge over the rim's, down the rim and tucked in under its lip onto the
  // body). lift raises what lies on the top off it, more toward the tip (a lick's stroke: it peels up, swings over and
  // slaps back down; s: how far along the top from where the fold left it).
  // (its front, past the first few hundredths, peeled up level: lifted, it hovers over the top, its root still on it,
  // so a roll-over rolls over above the lid, not up off its edge; it rises over ~0.4, a gentle S: risen over ~0.25, so
  // thick a tongue was bent back up too tightly just past the fold and creased across)
  const liftAt = (s) => par.lift * smooth(0.03, 0.4, s);
  function railLid() {
    RN = 0;
    const dMax = (L - uSlot) * rcNow + 0.12;
    const nx = slot.n.x, nz = slot.n.z, tx = slot.t.x, tz = slot.t.z;
    toLid(slot.p, RA);
    // (where it comes over: the lid's edge there, in lid space; past a cut corner, in onto it)
    let x0 = clamp(RA.x, -LID_HW, LID_HW), z0 = Math.min(RA.z, LID_D);
    const cut = (Math.abs(x0) + Math.abs(z0 - 0.47) - 0.96) / (Math.abs(nx) + Math.abs(nz));
    if (cut > 0) { x0 -= nx * cut; z0 -= nz * cut; }
    // over the edge, hugging it: from the gap it turns up (its underside to the lid's edge face), goes straight up the
    // face and turns in over the edge onto the top: two quarter turns as tight as the tongue is thick there, so it
    // stays a wet fold pressed round the edge, not a loop standing off it (it never folds tighter than its own
    // thickness: so thick a tongue folded tighter would split its groove open)
    // (aim: slanted through the gap, it wraps round diagonally, like a stripe round a barber's pole: its flat side stays
    // on the lid's edge face and its edge, drifting along the track all the way, and it heads in over the top at the
    // same slant)
    // (to the height it lies at on the top: lying flat, however it is twisted further on; measured where the fold
    // leaves the edge, 0.27 out (it is thinner over the fold: measured further out, the fold ended higher than what lay
    // on the top began, a dip and a crease there), or with only a little out, 0.15 short of the tip: measured nearer it,
    // past the thick body, the thin tip sliding through the measuring point as it comes out changed the fold's height
    // from frame to frame, and the whole tongue jittered)
    const yT = LID_TOP + thickAt(clamp((L - uSlot) * rcNow - 0.15, 0.1, 0.27), LIDF, true), y0 = RA.y, r = clamp(thickAt(0.12, LIDF, true) + 0.018, 0.035, Math.max(0.035, (yT - y0) / 2));
    const up = Math.max(0, yT - y0 - 2 * r), q1 = 0.5 * Math.PI * r, flen = 2 * q1 + up;
    const aim = clamp(par.aim, -0.6, 0.6), ta = Math.tan(aim);
    const nS = Math.ceil(flen / Math.cos(aim) / STEP);
    // (round a corner of the track the way out of the gap turns smoothly, but the lid's edge faces don't: the side, its
    // cut corner, the front. Pressed on a face at a slant, the flat tongue's one edge would dig in: the fold stands off
    // the edge as far as the lid reaches past the line its root lies along there, ex)
    const wr = 1.15 * Math.max(wideAt(0.1), wideAt(0.18));
    let ex = 0;
    for (const f of [-1, -0.5, 0.5, 1]) ex = Math.max(ex, rayOct(x0 + tx * wr * f, z0 + tz * wr * f - 0.47, nx, nz, LID_HW, 0.53, 0.96));
    ex = Math.min(ex, 0.1);
    for (let i = 0; i <= nS && railLen() < dMax; i++) {
      const s = flen * i / nS;
      let u, y, cu, cy; // (u: out from the edge, y: up; cu, cy: the way its top faces)
      if (s < q1) { const a = s / r; u = r * Math.sin(a); y = y0 + r - r * Math.cos(a); cu = Math.sin(a); cy = -Math.cos(a); }
      else if (s < q1 + up) { u = r; y = y0 + r + (s - q1); cu = 1; cy = 0; }
      else { const b = Math.min(0.5 * Math.PI, (s - q1 - up) / r); u = r * Math.cos(b); y = y0 + r + up + r * Math.sin(b); cu = Math.cos(b); cy = Math.sin(b); }
      u += ex * smooth(0, 0.7 * q1, s);
      toRig(PL.set(x0 + nx * u - tx * s * ta, y, z0 + nz * u - tz * s * ta), RB);
      dirToRig(NL.set(FS * nx * cu, FS * cy, FS * nz * cu), RC);
      railAdd(RB.x, RB.y, RB.z, RC.x, RC.y, RC.z);
    }
    if (railLen() >= dMax) return;
    // across the top (from where the fold left it): first the path in the lid's plane (heading turning toward the
    // target, no tighter than the tongue can bend sideways, curving kc more) and what it would rest on at each step...
    // (headings: ph is the way it goes, (-sin ph, -cos ph) in lid space: 0 straight in from the front, + toward -x)
    const ph0 = Math.atan2(nx, nz);
    let ph = ph0 + aim, x = x0 + nx * ex - tx * flen * ta - Math.sin(ph) * STEP, z = z0 + nz * ex - tz * flen * ta - Math.cos(ph) * STEP, m = 0, edge = false;
    // (the heading it wants lags the track's way round a corner (wlag): lying on the top, dragged round as its base
    // rounds a corner of the lid, it swings round after it, not at once with it: at once, its tip whipped across the top)
    const want = ph0 + par.ta + par.hd - par.wlag, kc = par.kc, rmin = turnMin(), d0 = railLen();
    while (d0 + m * STEP < dMax && m < LMAX) {
      // (heading out over an edge: draped over it; lifted off the top there, it just goes on, in the air)
      if (liftAt(m * STEP) < 0.02 && oct2(Math.abs(x), Math.abs(z - 0.47), LID_HW, 0.53, 0.96) > -0.04 && -Math.sin(ph) * G2.x * Math.sign(x) - Math.cos(ph) * G2.y * Math.sign(z - 0.47) > 0.05) { edge = true; break; }
      const dd = d0 + m * STEP, w = 1.02 * wideAt(dd), tw = twistAt(dd);
      restOn(x, z, ph, w);
      if (m) LT.y = Math.max(LT.y, LY[m - 1] - 0.6 * STEP); // (past an edge, lifted: it doesn't drop off it)
      LX[m] = x; LZ[m] = z; LH[m] = ph; LY[m] = LT.y; LS[m] = LT.s;
      // (twisted, its lower edge hangs off to one side of its middle, down by w |sin tw|: over the raised panel's step
      // it rides up on that edge)
      // (eased in as it twists: lying nearly flat it rests as restOn() says; switched on at a hair of twist, an edge over
      // the panel's step lifted it a whole step at once)
      const sw = smooth(0.03, 0.2, Math.abs(Math.sin(tw)));
      if (sw > 0) {
        const g = Math.sign(Math.sin(tw)) * Math.cos(tw) * w;
        const hE = lidTopH(x + g * Math.cos(ph), z - g * Math.sin(ph), -Math.sin(ph) * 0.04, -Math.cos(ph) * 0.04);
        LY[m] += sw * Math.max(0, hE + w * Math.abs(Math.sin(tw)) - thickAt(dd, LIDF) + 0.02 - LY[m]);
      }
      // (peeled up off the top it rests on nothing: it keeps the height it peeled off at, level, as far as it is lifted
      // clear of what is under it; else what it passes over (the raised panel's step, a tilt on its edge) jerked the
      // lifted front about in the air)
      const la = liftAt(m * STEP), wlf = smooth(0.004, 0.03, la);
      if (m && wlf > 0) { LY[m] = Math.max(LY[m - 1] * wlf + LY[m] * (1 - wlf), LY[m] - la); LS[m] *= 1 - wlf; }
      m++;
      ph += clamp(wrapPi(want - ph), -STEP / rmin, STEP / rmin) + kc * STEP;
      x -= Math.sin(ph) * STEP; z -= Math.cos(ph) * STEP;
    }
    // ...then eased: its underside's height the highest of gentle parabolas through every step (smooth, never below
    // what it rests on: it rides up onto the raised panel, it doesn't step), its tilt across averaged
    for (let i = 0; i < m; i++) {
      let y = -9, sl = 0, ns = 0;
      for (let j = Math.max(0, i - 24); j < Math.min(m, i + 25); j++) {
        const ds = (i - j) * STEP;
        y = Math.max(y, LY[j] - ds * ds / (2 * 0.25));
        if (Math.abs(i - j) <= 6) { sl += LS[j]; ns++; }
      }
      // (a hair more clear of the top than elsewhere: the bones are straight chords, and where the path bends up over
      // the raised panel's step the skin between them would graze it)
      // (lifted, it is off the top: on its edge where it is twisted only if it isn't lifted higher than that: so a
      // lifted front rolling over rises in a straight ramp, not humped over its own twist)
      const dd = d0 + i * STEP, tf = thickAt(dd, LIDF, true);
      LTK[i] = Math.max(thickAt(dd, LIDF), tf + liftAt(i * STEP)) + 0.006;
      LSE[i] = sl / ns; LB[i] = y + tf + 0.006; LHT[i] = LTK[i] - tf - 0.006;
    }
    // ...and how far it is raised off lying flat there (lifted, or twisted up onto its edge) eased the same way, from
    // nothing where the fold leaves it (twisted, how high its edge holds it changes fast along it as it turns: laid on
    // that, a rolling front zigzagged up and down, and the chain laid along it jumped about)
    for (let i = 0; i < m; i++) {
      let h = 0;
      for (let j = Math.max(0, i - 24); j < Math.min(m, i + 25); j++) { const ds = (i - j) * STEP; h = Math.max(h, LHT[j] - ds * ds / (2 * 0.25)); }
      h = LB[i] + Math.min(h, 1.6 * i * STEP);
      const t = LTK[i], ax = Math.cos(LH[i]), az = -Math.sin(LH[i]);
      NL.set(-LSE[i] * ax, 1, -LSE[i] * az).normalize();
      toRig(PL.set(LX[i], h - t * NL.y, LZ[i]).addScaledVector(NL, t), RB); dirToRig(NL, RC).multiplyScalar(FS);
      railAdd(RB.x, RB.y, RB.z, RC.x, RC.y, RC.z);
    }
    if (edge) {
      const ex = G2.x * Math.sign(x), ez = G2.y * Math.sign(z - 0.47), en = Math.hypot(ex, ez) || 1;
      drapeEdge(ex / en, ez / en, x, z, ph, dMax);
    }
  }
  // the bin body's outline at height y (it tapers in toward the bottom): how far from (px, pz), out along (nx, nz)
  const bodyOut = (px, pz, nx, nz, y) => { const f = clamp((y + 0.564) / 0.48, 0, 1); return rayOct(px, pz, nx, nz, 0.428 + 0.046 * f, 0.39 + 0.04 * f, 0.755 + 0.079 * f); };
  // Over an edge of the lid (n: its outward normal, level), from lid x xl, depth zl on its top, heading ph: from the
  // top over the edge, over the rim's outer edge, down the rim and tucked in under its lip onto the body. The ball rolls
  // across the outline in the upright plane through there along n (u: out along n, walking outward and down, the
  // solid on the right); as it goes outward it keeps the heading's slant along the edge (down the wall it goes straight
  // down).
  function drapeEdge(nx, nz, xl, zl, ph, dMax) {
    toRig(PL.set(xl, LID_TOP, zl), RA);
    const ue = Math.max(0, rayOct(xl, zl - 0.47, nx, nz, LID_HW, 0.53, 0.96));
    toRig(PL.set(xl + nx * ue, LID_TOP, zl + nz * ue), RB);
    const tx = nz, tz = -nx, dn = -Math.sin(ph) * nx - Math.cos(ph) * nz, dt = -Math.sin(ph) * tx - Math.cos(ph) * tz;
    const slant = dt / Math.max(0.35, dn), uR = Math.max(0, rayOct(RA.x, RA.z, nx, nz, UX, UZ, 0.974)), lip = uR - bodyOut(RA.x, RA.z, nx, nz, -0.084);
    let n = 0;
    BB[n++] = 0; BB[n++] = RA.y; BB[n++] = (RB.x - RA.x) * nx + (RB.z - RA.z) * nz; BB[n++] = RB.y;
    // (the rim's outer edge sticks out past the lid's side: the tongue spans from one edge to the other)
    BB[n++] = uR; BB[n++] = 0; BB[n++] = uR; BB[n++] = -0.084;
    for (let y = -0.1; y > -0.56; y -= 0.03) { BB[n++] = bodyOut(RA.x, RA.z, nx, nz, y) + lip * (1 - smooth(-0.084, -0.3, y)); BB[n++] = y; }
    walk(BB, n / 2, 1, LIDF, railLen(), dMax);
    let um = 0;
    for (let i = 0; i < WN; i++) {
      const w = i * 4;
      um = Math.max(um, W2[w]);
      const lat = um * slant;
      railAdd(RA.x + nx * W2[w] + tx * lat, W2[w + 1], RA.z + nz * W2[w] + tz * lat, FS * nx * W2[w + 2], FS * W2[w + 3], FS * nz * W2[w + 2]);
    }
  }
  // The face rail: out over the rim's top from the gap, its top on it (it comes out top down), round the rim's outer
  // edge and down its face, tucked in under the lip onto the body, down the body (it tapers in) and the base, in the
  // upright plane through the gap along the track's outward normal (out of the front: down the bin's front); on the face
  // it heads fd (+: toward - trk, at the front the viewer's left) and curves fk more.
  function railFront() {
    RN = 0;
    const dMax = (L - uSlot) * rcNow + 0.12;
    const px = slot.p.x, pz = slot.p.z, nx = slot.n.x, nz = slot.n.z;
    // (u: out along n from the gap)
    const uRim = Math.max(0, rayOct(px, pz, nx, nz, UX, UZ, 0.974)), uBase = rayOct(px, pz - 0.02, nx, nz, 0.472, 0.38, 0.8);
    const lip = uRim - bodyOut(px, pz, nx, nz, -0.084);
    let n = 0;
    BB[n++] = -0.05; BB[n++] = 0; BB[n++] = uRim; BB[n++] = 0; BB[n++] = uRim; BB[n++] = -0.084;
    // (down the body to the base's top edge, round it and down its face)
    for (let y = -0.1; y > -0.554; y -= 0.03) { BB[n++] = bodyOut(px, pz, nx, nz, y) + lip * (1 - smooth(-0.084, -0.32, y)); BB[n++] = y; }
    BB[n++] = bodyOut(px, pz, nx, nz, -0.554); BB[n++] = -0.554; BB[n++] = Math.max(uBase, bodyOut(px, pz, nx, nz, -0.554)); BB[n++] = -0.554;
    for (let y = -0.58; y > -0.75; y -= 0.03) { BB[n++] = Math.max(uBase, bodyOut(px, pz, nx, nz, y)); BB[n++] = y; }
    // (and, if it gets that far, out along the floor)
    BB[n++] = uBase; BB[n++] = FLOOR; BB[n++] = uBase + 0.8; BB[n++] = FLOOR;
    clrX = 0.007; walk(BB, n / 2, 1, FACEF, -0.05, dMax); clrX = 0; // (a hair more off the bin: its underside, on it, bulges a little past its modelled reach)
    let lat = 0, th = 0, pu = 0, pv = slot.p.y;
    const rmin = turnMin();
    const fd = clamp(par.fd, -1.1, 1.1), fk = par.fk;
    // (from the gap itself, where its spine is: the bone in the gap is aimed along the rail from there, and a rail that
    // started a hair under it would aim that bone straight down for a moment)
    railAdd(slot.p.x, slot.p.y, slot.p.z, 0, -FSF, 0);
    for (let i = 0; i < WN; i++) {
      const w = i * 4, u = W2[w], v = W2[w + 1];
      if (u < 0.008 && W2[w + 3] > 0.99) continue; // (behind the gap, or right at it)
      const step = Math.hypot(u - pu, v - pv);
      pu = u; pv = v;
      if (W2[w + 2] > 0.7) { // on the face (past the lip): steered across it
        th = clamp(th + clamp(fd - th, -step / rmin, step / rmin) + fk * step, -1.2, 1.2);
        lat -= Math.tan(th) * step;
      }
      railAdd(px + nx * u + slot.t.x * lat, v, pz + nz * u + slot.t.z * lat, -FSF * W2[w + 2] * nx, -FSF * W2[w + 3], -FSF * W2[w + 2] * nz);
    }
  }
  // Lay the chain along the rail: the bone in the gap aimed from the gap at the point of the rail as far from the gap
  // as its part out of the gap is long (a chord), joint ks+1 there; then each joint aims its bone at the point of the
  // rail a bone's length (a chord) from it, within the bend limits solve() keeps (what one joint can't bend, the next
  // ones make up: it rounds a tight corner instead of cutting it); each bone's top as the rail's there; the bends
  // between them -> rP, rY, rR. (So the chain is the same whichever bone is in the gap: as a joint comes out of the gap,
  // or goes in, the bone it ends lies on the very chord the bone before it was given. Joint ks+1 laid straight out of
  // the gap instead, off the rail's turn over the edge, the whole chain jumped along the rail each time a joint passed
  // the gap and crept between: a ratchet.) RW[r], RWQ[r]: the way the bone in the gap is aimed for rail r (0: the
  // lid's, 1: the face's) and its frame (its top as the rail's there); solve() blends them with the free pose's.
  const JP = Array.from({ length: 24 }, V), QP = new THREE.Quaternion();
  const TY = V(), TZ = V(), TX = V(), RQ = new THREE.Quaternion(), RF = new THREE.Quaternion();
  const RW = [V(), V()], RWQ = [new THREE.Quaternion(), new THREE.Quaternion()], CH_MIN = 0.006;
  // the bend limits at joint k (radians): toward the underside, toward the top, to the side
  const LIM = { u: 0, t: 0, s: 0 };
  let limTurn = 0; // (see solve: how far the free pose's sideways limit is eased toward its up/down one)
  function limits(k, rc) {
    // (the bone before it: the whole of it, even the one in the gap, partly out: limited by the part that is out, the
    // first joint out could not follow the rail's turn over the edge just as it came out, or just before it went in,
    // and the chain beyond it jumped back onto the rail as it passed the gap)
    const lp = restLen[k - 1] * rc;
    LIM.s = lp / (1.15 * hw[k] * kw[k]); LIM.u = lp / (1.05 * zB[k] * kzB[k]); LIM.t = lp / (1.05 * zT[k] * kzT[k]);
    // (turning round in the air (flip), the bend it holds in the world becomes a bend to its own side, which the flat
    // tongue's width limits far more: clamped there, half way round it straightened and bent back up as it turned on
    // (its squeezed width in the gap changes twice over a turn), a lurch. A cartoon tongue keeps its curve as it turns)
    if (limTurn > 0) LIM.s += Math.max(0, Math.min(LIM.u, LIM.t) - LIM.s) * limTurn;
  }
  // the point of the rail a chord c from P (searching from index i0) -> out; returns the index the segment ends at
  // (RN: the rail ends nearer than that: straight on past its end)
  // (and CH_T: where that point is along the rail, as a fractional index)
  let CH_T = 0;
  function chordOn(P, c, i0, out) {
    const dist = (m) => Math.hypot(RP[m * 3] - P.x, RP[m * 3 + 1] - P.y, RP[m * 3 + 2] - P.z);
    let j = i0;
    while (j < RN && dist(j) < c) j++;
    if (j >= RN || RN < 2) {
      const e = Math.max(1, RN - 1);
      TY.set(RP[e * 3] - RP[e * 3 - 3], RP[e * 3 + 1] - RP[e * 3 - 2], RP[e * 3 + 2] - RP[e * 3 - 1]).normalize();
      out.copy(P).addScaledVector(TY, c);
      CH_T = Math.max(0, RN - 1);
      return RN;
    }
    if (j === 0) { // (the rail starts further off than that: toward its start)
      out.set(RP[0] - P.x, RP[1] - P.y, RP[2] - P.z).normalize().multiplyScalar(c).add(P);
      CH_T = 0;
      return 0;
    }
    const m = j - 1; // on the segment m -> j: |A + (B - A) s - P| = c
    RA.set(RP[m * 3] - P.x, RP[m * 3 + 1] - P.y, RP[m * 3 + 2] - P.z);
    RB.set(RP[j * 3] - RP[m * 3], RP[j * 3 + 1] - RP[m * 3 + 1], RP[j * 3 + 2] - RP[m * 3 + 2]);
    const a = RB.lengthSq() || 1e-9, b = 2 * RA.dot(RB), cc = RA.lengthSq() - c * c, disc = Math.max(0, b * b - 4 * a * cc);
    const s = clamp((-b + Math.sqrt(disc)) / (2 * a), 0, 1);
    out.set(RP[m * 3] + RB.x * s, RP[m * 3 + 1] + RB.y * s, RP[m * 3 + 2] + RB.z * s);
    CH_T = m + s;
    return j;
  }
  // a bone's frame lying along the rail: its length along dir, its top as the rail's at mid (a fractional index: eased
  // between the rail's points; taken at the nearest point, a bone's top jumped a step's turn whenever its middle
  // passed a point, a lot over the fold round the lid's edge) (turned about its length by tw: twisted as twist and ttw
  // say, so far along, the frame turns about the rail, the path stays) -> out
  function railFrame(dir, mid, tw, out) {
    TY.copy(dir);
    const m0 = clamp(Math.floor(mid), 0, RN - 1), m1 = Math.min(RN - 1, m0 + 1), f = clamp(mid - m0, 0, 1);
    TZ.set(RU[m0 * 3] * (1 - f) + RU[m1 * 3] * f, RU[m0 * 3 + 1] * (1 - f) + RU[m1 * 3 + 1] * f, RU[m0 * 3 + 2] * (1 - f) + RU[m1 * 3 + 2] * f);
    TZ.addScaledVector(TY, -TZ.dot(TY));
    if (TZ.lengthSq() < 1e-8) TZ.set(0, 0, 1).applyQuaternion(QP);
    TZ.normalize();
    if (tw !== 0) { TX.crossVectors(TY, TZ); TZ.multiplyScalar(Math.cos(tw)).addScaledVector(TX, Math.sin(tw)); }
    TX.crossVectors(TY, TZ);
    return out.setFromRotationMatrix(M4.makeBasis(TX, TY, TZ));
  }
  function railAngles(r) {
    const ks = kSlot, rc = rcNow;
    for (let k = 0; k <= ks; k++) rP[k] = rY[k] = rR[k] = 0;
    const a1 = Math.max(0, sNext(ks) - uSlot) * rc;
    // (the bone in the gap: aimed at the rail a chord a1 from the gap (for a hair out, at the rail a chord CH_MIN from
    // it, so its way is defined and eases from the rail's own way out of the gap), its top as the rail's there, like
    // every bone after it: tipped up the lid's edge, through the gap at a slant, with its top level its one edge would
    // dig into the edge's face)
    let i = Math.max(1, Math.min(chordOn(slot.p, CH_MIN, 0, JP[ks + 1]), RN - 1));
    chordOn(slot.p, Math.max(a1, CH_MIN), 0, JP[ks + 1]);
    RW[r].subVectors(JP[ks + 1], slot.p).normalize();
    railFrame(RW[r], CH_T / 2, 0, QP);
    RWQ[r].copy(QP);
    JP[ks + 1].copy(RW[r]).multiplyScalar(a1).add(slot.p);
    let pS = CH_T * Math.min(1, a1 / CH_MIN); // (where joint ks+1 is along the rail)
    let tws = 0;
    for (let k = 1; k <= ks; k++) tws += twK[k];
    for (let k = ks + 1; k < NJ; k++) {
      const Lk = restLen[k] * rc, J = JP[k], N = JP[k + 1];
      // (past the rail's end: straight on)
      const j = Math.min(RN - 1, chordOn(J, Lk, i, N));
      // the bone's frame: toward that point, its top as the rail's at the bone's middle
      tws += twK[k];
      railFrame(V2.subVectors(N, J).normalize(), (pS + CH_T) / 2, tws, RF);
      pS = CH_T;
      RQ.copy(QP).multiply(relQ[k]).invert().multiply(RF);
      eul.setFromQuaternion(RQ, 'XZY');
      limits(k, rc);
      rP[k] = clamp(eul.x, -LIM.u, LIM.t); rR[k] = eul.y; rY[k] = clamp(eul.z, -LIM.s, LIM.s);
      // where the bone really goes (if a limit held it back), and the next joint at its end
      QP.multiply(relQ[k]).multiply(RQ.setFromEuler(eul.set(rP[k], rR[k], rY[k], 'XZY')));
      N.copy(Y).applyQuaternion(QP).multiplyScalar(Lk).add(J);
      i = Math.max(i, j); // (the next chord starts ahead of this one's end: a bone held back off the rail by a limit must not find a
      // point behind it, back on the fold, a bone's length away)
    }
  }
  function springs(dt) {
    const n = Math.max(1, Math.ceil(dt / (1 / 240))), h = dt / n;
    // (lying on something it is dragged, stuck to it, not whipped: stiffer and calmer on a rail)
    // (and turning round about its length (flip) calmer too: a bent tip turning on its springs swung to and fro)
    const turning = clamp(Math.abs(tracks.flip(subT0 + 0.02) - tracks.flip(subT0 - 0.02)) / 0.04 / 1.5, 0, 1);
    const onRail = clamp(par.wl + par.wf, 0, 1), fs = 1 + 0.8 * onRail, zeta = ZETA + 0.3 * Math.max(onRail, turning);
    for (let i = 0; i < n; i++) {
      for (let k = 1; k < NJ; k++) {
        if (sAt[k] <= uSlot) {
          angP[k] = tgtP[k]; angY[k] = tgtY[k]; angR[k] = tgtR[k]; velP[k] = velY[k] = velR[k] = 0;
          angFP[k] = tgtFP[k]; angFY[k] = tgtFY[k]; angFR[k] = tgtFR[k]; velFP[k] = velFY[k] = velFR[k] = 0;
          continue;
        }
        const w = 2 * Math.PI * springF[k] * fs, w2 = w * w, c = 2 * zeta * w;
        velP[k] += (w2 * (tgtP[k] - angP[k]) - c * velP[k]) * h; angP[k] += velP[k] * h;
        velY[k] += (w2 * (tgtY[k] - angY[k]) - c * velY[k]) * h; angY[k] += velY[k] * h;
        velR[k] += (w2 * (tgtR[k] - angR[k]) - c * velR[k]) * h; angR[k] += velR[k] * h;
        velFP[k] += (w2 * (tgtFP[k] - angFP[k]) - c * velFP[k]) * h; angFP[k] += velFP[k] * h;
        velFY[k] += (w2 * (tgtFY[k] - angFY[k]) - c * velFY[k]) * h; angFY[k] += velFY[k] * h;
        velFR[k] += (w2 * (tgtFR[k] - angFR[k]) - c * velFR[k]) * h; angFR[k] += velFR[k] * h;
      }
      lidStep(h, pushAt(subT0 + (i + 1) * h), subT0 + (i + 1) * h); // (the lid too, at the same substeps of the lick's time)
    }
  }
  const settle = () => {
    angP.set(tgtP); angY.set(tgtY); angR.set(tgtR); velP.fill(0); velY.fill(0); velR.fill(0);
    angFP.set(tgtFP); angFY.set(tgtFY); angFR.set(tgtFR); velFP.fill(0); velFY.fill(0); velFR.fill(0);
  };
  let subT0 = 0; // the lick's time at the start of this step

  // The part in the bin: from the gap straight in under the lid, over the inner lip, down the inside of the wall it
  // came out by and back along the bottom, in the dark. q: distance behind the gap.
  // (it turns down well behind the inner lip and runs down well clear of the wall: the bin tapers, and the stalk is
  // wide)
  const ARC = 0.12, DOWN = 0.24, BACK = 0.4;
  const XL = new THREE.Vector3(1, 0, 0), QI = new THREE.Quaternion();
  function inside(q, outP, outQ) { // (outQ must not be QI)
    const q1 = slot.strip + 0.06, qa = q1 + ARC * Math.PI / 2, qb = qa + DOWN, qc = qb + ARC * Math.PI / 2;
    // (straight in from the gap, however slanted it goes through it: a slant would carry the hidden part into the
    // rim's inner wall at the track's corners)
    const A = slot.hA, T = slot.hU;
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
    // (it comes round from the bin's middle line to where it is in the gap only down in the dark, below the rim: a
    // wide tongue swept sideways right under the lid would tilt up into it)
    const lat = (slot.p.x * slot.t.x + slot.p.z * slot.t.z) * smooth(0.03, qb + 0.1, q);
    outP.x -= slot.t.x * lat; outP.z -= slot.t.z * lat;
    outQ.copy(slot.q).multiply(QI.setFromAxisAngle(XL, slot.cth * ang));
  }

  const eul = new THREE.Euler(), dbg = { collide: true, tilt: true }, QFL = new THREE.Quaternion(), QFLi = new THREE.Quaternion();
  const CL = 0.004; // clearance in the gap
  function solve() {
    computeSlot();
    // (the rails' bends are laid on as they are, not sprung: sliding along a rail each joint's bend changes as it
    // passes an edge, and a spring would smear the bend off the edge; the springs carry the free pose and the tip's
    // own life on top. Laid here, on the lid as it is now: it moves under the tongue between targets() and here)
    const wl = clamp(par.wl, 0, 1), wf = clamp(par.wf, 0, 1 - wl);
    qP.fill(0); qY.fill(0); qR.fill(0);
    if (wl > 1e-3) { railLid(); railAngles(0); for (let k = 1; k < NJ; k++) { qP[k] += wl * rP[k]; qY[k] += wl * rY[k]; qR[k] += wl * rR[k]; } }
    if (wf > 1e-3) { railFront(); railAngles(1); for (let k = 1; k < NJ; k++) { qP[k] += wf * rP[k]; qY[k] += wf * rY[k]; qR[k] += wf * rR[k]; } }
    // (and the free pose, in the air, as far as it isn't on a rail: its bends turned with the flip, see targets)
    const w0 = 1 - wl - wf;
    // (turned over by flip, each joint's free bend is the keyed one turned about the bone's length the same way:
    // conjugated by that turn, so the bend keeps its way in the world as the tongue turns round. Mixing the pitch and
    // the yaw by the turn's sine and cosine instead is only right for small bends: half way round, a big bend drew a
    // different curve, and the tip swung about as the tongue turned)
    const turned = slot.sth * slot.sth > 1e-8 || slot.cth < 0;
    if (turned) { const fa = Math.atan2(slot.sth, slot.cth); QFL.setFromAxisAngle(Y, fa); QFLi.setFromAxisAngle(Y, -fa); }
    limTurn = w0 * slot.sth * slot.sth; // (see limits: from here to the end of solve)
    // (and the tip's own life on top. What the springs add, lagging their targets, fades out toward the gap: a joint's
    // lag there would vanish all at once as it went into the gap, and the chain past it jump)
    for (let k = 1; k < NJ; k++) {
      const f = smooth(0, 0.12, sAt[k] - uSlot);
      if (w0 > 1e-4) {
        const p = tgtFP[k] + (angFP[k] - tgtFP[k]) * f, y = tgtFY[k] + (angFY[k] - tgtFY[k]) * f, r = tgtFR[k] + (angFR[k] - tgtFR[k]) * f;
        if (turned) {
          Q.setFromEuler(eul.set(p, r, y, 'XZY')).premultiply(QFLi).multiply(QFL);
          eul.setFromQuaternion(Q, 'XZY');
          qP[k] += w0 * eul.x; qY[k] += w0 * eul.z; qR[k] += w0 * eul.y;
        } else { qP[k] += w0 * p; qY[k] += w0 * y; qR[k] += w0 * r; }
      }
      qP[k] += tgtP[k] + (angP[k] - tgtP[k]) * f; qY[k] += tgtY[k] + (angY[k] - tgtY[k]) * f; qR[k] += tgtR[k] + (angR[k] - tgtR[k]) * f;
    }
    const ks = kSlot;
    // what is out, from the gap: the rest frames turned so that the rest frame at the gap lies along it; on a rail the
    // bone in the gap aimed at it (see railAngles), in the air straight out (blended by the rails' weights)
    rot[ks].copy(slot.r0);
    if (wl > 1e-3) rot[ks].slerp(RWQ[0], wl / Math.max(1e-6, 1 - wf));
    if (wf > 1e-3) rot[ks].slerp(RWQ[1], wf);
    const rc = rcNow;
    pos[ks + 1].copy(Y).applyQuaternion(rot[ks]).multiplyScalar(Math.max(0, sNext(ks) - uSlot) * rc).add(slot.p);
    for (let k = ks + 1; k < NJ; k++) {
      // (a wide, flat tongue bent too tightly sideways folds its inner edge through itself: each joint turns at most
      // so far that the bend's radius stays wider than the tongue's half width there; likewise through its thickness:
      // bent toward its underside, the underside is on the inside of the bend; toward its top, the top)
      limits(k, rc);
      rot[k].copy(rot[k - 1]).multiply(relQ[k]).multiply(Q.setFromEuler(eul.set(clamp(qP[k], -LIM.u, LIM.t), qR[k], clamp(qY[k], -LIM.s, LIM.s), 'XZY')));
      pos[k + 1].copy(Y).applyQuaternion(rot[k]).multiplyScalar(restLen[k] * rc).add(pos[k]);
    }
    // what is in: along the hidden path, kept under the lid's underside as the lid is now (tipped toward the tongue, it
    // comes down toward its far edge or its hinge: the hidden part, running in level from the gap, would push up into it)
    for (let k = ks; k >= 0; k--) {
      const q = uSlot - sAt[k];
      inside(q, pos[k], Q2);
      if (k < ks) rot[k].copy(Q2);
      const P = pos[k];
      if (q > 0.02 && Math.abs(P.x) < LID_HW && P.z < lid.ze) {
        // (its section is not quite level down there: running in toward the bin's middle at a slant from the way it went
        // through the gap, it is turned a little about its length, and the edge on the high side reaches up toward the lid;
        // only past the inner lip: nearer the gap, held down, it would dig into the rim)
        const yU = (P.z + 0.5) * lid.tan + (P.x - lid.xp) * lid.rsl, ext = Math.max(zT[k], zB[k]) * kz[k] * Math.abs(slot.cth) + xW[k] * kw[k] * (Math.abs(slot.sth) + 0.35 * Math.abs(slot.cth) * smooth(slot.strip + 0.06, slot.strip + 0.2, q)) + 0.025;
        P.y = Math.min(P.y, yU - ext * smooth(0.02, 0.1, q));
      }
    }
    limTurn = 0;
    if (dbg.collide) collide(ks);
    // write the bones: each one along its (possibly pushed) chord, stretched along it as it reaches (never squashed: the
    // shader squashes the skin, see squash())
    for (let k = 0; k < NJ; k++) {
      V1.copy(Y).applyQuaternion(rot[k]);
      V2.subVectors(pos[k + 1], pos[k]);
      const len = V2.length();
      V2.divideScalar(len || 1);
      Q.setFromUnitVectors(V1, V2); rot[k].premultiply(Q);
      SC.set(1, Math.max(0.05, len / restLen[k]), 1);
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
    mat?.userData.uRoll?.value.set(lid.rsl, lid.xp);
    // (the lid's outline as it is now: its sides, its cut front corners (|x| + z), how far open it is where the tongue is)
    mat?.userData.uEdge?.value.set(LID_HW - 2 * LID_HW * (1 - lid.rc), 0.93 - (HINGE_Z + LID_D - lid.ze), Math.max(0, lid.H));
    uSlotS.value = uSlot;
    // (the squash, for the shader: the table over s, as squash() has it now)
    if (uSq) for (let j = 0; j < NSQ; j++) { sqEval(j * L / (NSQ - 1)); uSq.value[j].set(SQ.w, SQ.zt, SQ.zb, SQ.cr); }
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

  // The squash, as Blender's lattice would do it, but live: only where it goes through the gap is it squeezed, and only
  // as much as the gap needs. Out of the gap it keeps the full, round, plump volume of the sculpt. In the gap it is as
  // thick as the lid lets it be (its spine half way up the gap; the lid rides up on it, so that is a good half of its
  // own thickness) and spread sideways by about as much (roughly keeping its volume: flat there, but as wide as its root
  // at least, never a pinched neck), and it rounds out again over SQ_LEN past the lid's edge (smoothly: a smoothstep,
  // no crease; its spread back in over half that, so the root doesn't flare past the gap). Behind the gap, under the
  // lid, it stays as thin as in the gap until it has dropped over the inner lip, then fills out a little in the dark
  // and narrows (it fits in the opening wherever along the gap it is). Out of the gap: stretched (reach), it thins a
  // little; lying on something ('flat', on a rail) its soft flesh flattens a little on the side that touches, its top
  // (or its underside) and its edges still round; lying on the lid's top it is a little wider still ('wide'); twisted
  // onto its edge, wrung a little narrower (NECK); folded over the lid's edge onto its top (wl), just past the gap, a
  // little thinner than the sculpt (FOLD_T, 38% at most, as much as wl says), rounding out to its full volume by ~0.35
  // out (in the air and down the bin's front: none). Evaluated per s (along the rest
  // spine): sqEval(s) -> SQ; squash() samples it at the joints (kw, kzT, kzB, for the rails and the collisions); solve()
  // writes it into the shader's table (uSq), which squeezes each vertex about the spine in the rest pose, before
  // skinning, and turns its normal with it (so it shades smoothly through the squeeze).
  // (FOLD_D: about how much of it the fold over the lid's edge takes, from the gap up the edge face and over onto the
  // top: where spin turns it, see targets.)
  const NECK = 0.15; // twisted onto its edge (by twist, ttw, spin) it is wrung narrower: its width drawn in that much
  const SQ_AT = 0.005, SQ_LEN = 0.13, MAXW = 0.22, FOLD_D = 0.2, FOLD_T = 0.38;
  const WIDE = 0.2; // lying on the lid's top it spreads this much wider (times 'wide'), and a touch flatter
  const SQ = { w: 1, zt: 1, zb: 1, cr: 0 };
  let sqHs = 0.03; // half the gap's height where it goes through (less the clearance)
  // the sculpt's reach from the spine at s (a: zT, zB or xW; eased from joint to joint)
  function sec(a, s) {
    let k = 0;
    while (k < NJ - 1 && sAt[k + 1] <= s) k++;
    return k < NJ - 1 ? a[k] + (a[k + 1] - a[k]) * clamp((s - sAt[k]) / restLen[k], 0, 1) : a[k];
  }
  function sqEval(s, o = SQ) {
    const d = s - uSlot, strip = slot.strip, hs = sqHs;
    const zm = Math.max(sec(zT, s), sec(zB, s), 1e-3), xw = Math.max(sec(xW, s), 1e-3);
    // (stretched out of the gap, it thins)
    const thin = 1 + (1 / Math.sqrt(Math.max(0.5, par.reach)) - 1) * smooth(0, SQ_LEN, d);
    // in the gap and as far as it is squeezed past it (g)
    const zg = Math.min(1, hs / zm), g = d > 0 ? 1 - smooth(SQ_AT, SQ_AT + SQ_LEN, d) : 1;
    let z = thin - g * Math.max(0, thin - zg);
    let w = Math.max(thin, Math.min(thin * Math.min(1.3, Math.pow(thin / z, 0.35)), MAXW / xw));
    // (just past the gap the spread eases back faster than the squash: kept as wide as the gap's spread all the way
    // out, the root flared into a flat flange wider than the body, a melted foot)
    if (d > SQ_AT && w > thin) w = thin + (w - thin) * (1 - smooth(SQ_AT, SQ_AT + 0.5 * SQ_LEN, d));
    // (folded over the lid's edge onto its top (wl), just past the gap, it is a little thinner than the sculpt
    // (FOLD_T), rounding out to its full volume over the fold: at its full thickness the fold stood up over the lid's
    // front edge as a big lump, hiding the lick behind it. Only there: in the air and down the bin's front it is
    // as thick as the sculpt (thinned there too, it was a flat slab in the air, and hanging down the front its
    // thinned root met the full tip in a ledge across it)
    const wlF = clamp(par.wl, 0, 1);
    if (d > 0 && wlF > 0) z = Math.min(z, thin * (1 - FOLD_T * wlF * (1 - smooth(0.12, 0.36, d * rcNow))));
    let zt = z, zb = z;
    if (d < 0) {
      // behind the gap: under the lid as thin as in the gap, a touch thinner toward the inner lip; down past it, it
      // fills out a little and narrows, in the dark (deep in the bin it is slim: it fits in there, out of sight)
      const dd = -d - strip, slim = 1 - 0.5 * smooth(0.04, 0.25, dd);
      z = Math.min(slim, (hs * (1 - 0.12 * smooth(0, strip, -d)) + 0.5 * Math.max(0, dd - 0.07)) / zm);
      zt = zb = z;
      w = Math.min(w, (MAXW + (0.12 - MAXW) * smooth(-0.01, 0.08, dd)) / xw);
    } else {
      // lying on something: the side that touches it flattens a little (on the lid's top its underside, down the bin's
      // front its top: see LIDF, FACEF), and it spreads a touch
      const wl = clamp(par.wl, 0, 1), wf = clamp(par.wf, 0, 1);
      if (par.flat < 1) {
        const f = (1 - par.flat) * smooth(0.04, 0.16, d), cl = f * (LIDF ? 0 : wl) + f * (FACEF ? 0 : wf), ct = f * (LIDF ? wl : 0) + f * (FACEF ? wf : 0);
        zb *= 1 - cl; zt *= 1 - ct; w *= 1 + 0.4 * (cl + ct);
      }
      // wide: lying on the lid's top, past the fold over its edge, a little broader (and a touch flatter, still round);
      // where it is peeled up off it, it narrows again
      if (par.wide > 0) {
        const dr = d * rcNow, sp = 1 + WIDE * par.wide * wl * smooth(FOLD_D - 0.06, FOLD_D + 0.06, dr) * (1 - smooth(0.01, 0.06, liftAt(Math.max(0, dr - FOLD_D))));
        w *= sp; zt /= Math.pow(sp, 0.4); zb /= Math.pow(sp, 0.4);
      }
      w *= 1 - NECK * Math.abs(Math.sin(twistAt(d * rcNow))) * smooth(0, 0.05, d);
    }
    o.w = w; o.zt = zt; o.zb = zb; o.cr = g * smooth(0.9, 0.45, zg);
    return o;
  }
  // at the joints, for the rails, the bend limits and the collisions (kz: the thicker side)
  // the table as the shader reads it at s (Catmull-Rom; for the lab's check)
  const SQV = new THREE.Vector4();
  function sqTable(s) {
    const x = clamp(s * (NSQ - 1) / L, 0, NSQ - 1.001), i = Math.floor(x), t = x - i, P = uSq.value;
    const p0 = P[Math.max(i - 1, 0)], p1 = P[i], p2 = P[Math.min(i + 1, NSQ - 1)], p3 = P[Math.min(i + 2, NSQ - 1)];
    for (const c of ['x', 'y', 'z', 'w']) {
      const b = p2[c] - p0[c], cc = 2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c], d = 3 * (p1[c] - p2[c]) + p3[c] - p0[c];
      SQV[c] = p1[c] + 0.5 * t * (b + t * (cc + t * d));
    }
    return SQV;
  }
  function squash(push) {
    sqHs = Math.max(0.005, push / 2 - CL);
    for (let k = 0; k < NJ; k++) {
      sqEval(sAt[k]);
      kw[k] = SQ.w; kzT[k] = SQ.zt; kzB[k] = SQ.zb; kz[k] = Math.max(SQ.zt, SQ.zb);
    }
  }

  // ------------------------------------------------------------------------------------------ the bin and the lid
  // Out of the gap the tongue lies on the bin and the lid, never through them. Both are prisms (an octagon: a box with
  // its corners cut, extruded): the rim, the body under it (tapering), the base, and the lid's band and raised panel
  // (in lid space). Test points along every bone out of the gap are kept at least the tongue's half thickness that way
  // (its cross-section two half ellipses, wide across, its top and its underside each as thick as the sculpt is there)
  // away from them by their distance fields: what is in too deep is turned out about a joint a little way back (see
  // turnOut); in the air, with 'stick', what is near is turned down onto them. On a rail it already lies on them: only
  // a real dip in (the springs lagging, a corner the bones can't follow) is pushed out, and only locally. A few passes
  // settle it.
  const G2 = { x: 0, y: 0 };
  function oct2(px, pz, a, b, c) { // signed distance from (px, pz) (first quadrant) to |x|<=a, |z|<=b, |x|+|z|<=c; G2: way out
    if (px <= a && pz <= b && px + pz <= c) {
      const da = a - px, db = b - pz, dc = (c - px - pz) * Math.SQRT1_2;
      if (da <= db && da <= dc) { G2.x = 1; G2.y = 0; return -da; }
      if (db <= dc) { G2.x = 0; G2.y = 1; return -db; }
      G2.x = G2.y = Math.SQRT1_2; return -dc;
    }
    SG.d = Infinity;
    const zs = Math.min(b, c - a), xf = Math.min(a, c - b); // (where the cut corner meets the side and the front; none if c >= a + b)
    seg(px, pz, a, -1, a, zs); seg(px, pz, a, zs, xf, b); seg(px, pz, xf, b, -1, b);
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
  // The body under the rim tapers: 0.948 x 0.86 at its top (y -0.084), 0.856 x 0.78 at its foot (y -0.564), its faces
  // leaning out as they rise (the shift is tiny: the gradient stays horizontal); the base below it, 0.944 wide, its
  // front at z 0.40 (y -0.76 .. -0.554).
  function binSdf(p, n) {
    const d1 = prism(p.x, p.y, p.z, UX, UZ, 0.974, -0.084, 0, n);
    const f = clamp((p.y + 0.564) / 0.48, 0, 1);
    const d2 = prism(p.x, p.y, p.z, 0.428 + 0.046 * f, 0.39 + 0.04 * f, 0.755 + 0.079 * f, -0.564, -0.084, NB);
    if (d2 < d1) n.copy(NB);
    let d = Math.min(d1, d2);
    const d3 = prism(p.x, p.y, p.z - 0.02, 0.472, 0.38, 0.8, FLOOR + 0.02, -0.554, NB);
    if (d3 < d) { n.copy(NB); d = d3; }
    return d;
  }
  function lidSdf(p, n) {
    toLid(p, PL);
    let d = prism(PL.x, PL.y, PL.z - 0.47, 0.51, 0.53, 0.96, 0, 0.105, NL);
    const d2 = prism(PL.x, PL.y, PL.z - 0.48, 0.345, 0.305, 9, 0, 0.18, NB);
    if (d2 < d) { d = d2; NL.copy(NB); }
    dirToRig(NL, n);
    return d;
  }
  const US = [0.25, 0.5, 0.75, 1], STICK_R = 0.13, STICK_FROM = 0.12;
  const SP = V(), PU = V(), NN = V(), BX = V(), BZ = V();
  // how far the skin reaches from the spine toward -n, u along bone k (its top and its underside half superellipses,
  // the thicknesses eased from joint k to the next)
  // (sp, sdf: the point on the spine and the distance field of what it is near, to check the width against: n is the
  // way out of the face nearest the spine, and taken as a whole plane, a flat tongue tipped toward it would dig its edge
  // into it; but near a corner that edge can be past the corner, in the air: its width counts only as far as the edge
  // toward it is really at (or near) it)
  const RE = V(), NE = V();
  function radius(k, n, u = 0, sp = null, sdf = null) {
    BX.set(1, 0, 0).applyQuaternion(rot[k]); BZ.set(0, 0, 1).applyQuaternion(rot[k]);
    const k2 = Math.min(NJ - 1, k + 1), bz = n.dot(BZ), bx = n.dot(BX);
    const w = (xW[k] * kw[k]) * (1 - u) + (xW[k2] * kw[k2]) * u;
    const h = bz < 0 ? zT[k] * kzT[k] * (1 - u) + zT[k2] * kzT[k2] * u : zB[k] * kzB[k] * (1 - u) + zB[k2] * kzB[k2] * u;
    const full = reach(w * bx, h * bz), thin = Math.abs(h * bz);
    if (!sp || full - thin < 0.004) return full;
    RE.copy(sp).addScaledVector(BX, -Math.sign(bx) * 0.95 * w);
    return thin + (full - thin) * smooth(0.04, 0, sdf(RE, NE));
  }
  function collide(ks) {
    wasContact.set(contact); contact.fill(0); conLid.fill(0);
    // on a rail it already lies on the bin and the lid: only a real dip in is pushed out (and only locally: the rest
    // of it keeps its way, shifted); in the air the whole rest of it turns out of the way
    const onRail = clamp(par.wl + par.wf, 0, 1), tol = 0.0025 * onRail, stick = par.stick * (1 - onRail);
    for (let pass = 0; pass < 6; pass++) {
      let any = false;
      for (let k = ks; k < NJ; k++) {
        for (let i = 0; i < US.length; i++) {
          const u = US[i];
          const A = k === ks ? slot.p : pos[k];
          SP.lerpVectors(A, pos[k + 1], u);
          const s = (k === ks ? uSlot : sAt[k]) + u * (k === ks ? Math.max(0, sNext(k) - uSlot) : restLen[k]) - uSlot;
          if (s < 0.045) continue; // (in the gap: the squash keeps it out of the lid and the rim)
          const j = Math.min(NJ - 1, k + (u > 0.5 ? 1 : 0));
          // (a hair of clearance, a little less than the rails keep: what lies on a rail is left alone)
          let d = binSdf(SP, NN), r = radius(k, NN, u, SP, binSdf) + 0.003, hit = 1;
          let gap = d - r;
          const dl = lidSdf(SP, V3), rl = radius(k, V3, u, SP, lidSdf) + 0.004, gl = dl - rl;
          if (gl < gap) { gap = gl; hit = 2; d = dl; NN.copy(V3); }
          PU.set(0, 0, 0);
          if (gap < -tol) PU.copy(NN).multiplyScalar(-gap - tol); // (from nothing at the tolerance on: no step)
          // wet, it sticks: near a surface (and far enough out of the gap) it is drawn down onto it
          else if (stick > 0 && s > STICK_FROM && gap < STICK_R) PU.copy(NN).multiplyScalar(-gap * stick * (1 - smooth(0.4 * STICK_R, STICK_R, gap)) * smooth(STICK_FROM, STICK_FROM + 0.1, s));
          if (SP.y + PU.y < FLOOR + hh[j] * kz[j]) PU.y = FLOOR + hh[j] * kz[j] - SP.y;
          if (PU.lengthSq() < 1e-10) continue;
          any = true;
          if (gap < 0.02) { (hit === 1 ? contact : conLid)[k + 1] = 1; cType[k + 1] = hit; cpt[k + 1].copy(SP).addScaledVector(NN, -d); cnr[k + 1].copy(NN); }
          turnOut(ks, k, u, SP, PU, onRail > 0.5);
        }
      }
      if (!any) break;
    }
  }
  // Turn what is beyond the point out of (or onto) the surface: about a joint a little way back toward the gap (never
  // behind it), the turn shared by two joints. The chain keeps its lengths: it slides and bends over what it touches,
  // it never stretches (no smeared texture). local: the bones past the point keep their way (shifted with it).
  // (the turn is shared by the first joint at least PIV_R back (j) and the one before it, as far between them as that
  // distance falls between j and the joint after it: so as the chain slides and another joint becomes the first one
  // that far back, the turn moves over to it gradually. Shared half and half, it jumped from one pair to the next)
  const PV = V(), VA = V(), VB = V(), PK = V(), PIV_R = 0.07;
  function turnOut(ks, k, u, sp, push, local) {
    const piv = (j) => (j <= ks ? slot.p : pos[j]);
    let j = k;
    while (j > ks && sp.distanceTo(piv(j)) < PIV_R) j--;
    const dj = sp.distanceTo(piv(j)), dn = j < k ? sp.distanceTo(piv(j + 1)) : 0;
    const share = clamp((PIV_R - dn) / Math.max(1e-6, dj - dn), 0, 1);
    VB.copy(sp).add(push);
    const keep = Math.min(NJ, k + 1);
    for (let h = 0; h < 2; h++) {
      const jj = h === 0 ? Math.max(ks, j - 1) : j;
      PV.copy(piv(jj));
      VA.subVectors(sp, PV); V3.subVectors(VB, PV);
      if (VA.lengthSq() < 1e-8 || V3.lengthSq() < 1e-8) continue;
      Q.setFromUnitVectors(VA.normalize(), V3.normalize());
      if (h === 0 && jj < j) Q.slerp(QI.identity(), 1 - share); // (its share here, the rest at the next joint)
      if (local) {
        PK.copy(pos[keep]);
        const last = Math.min(keep, NJ);
        for (let m = Math.max(jj, ks) + 1; m <= last; m++) pos[m].sub(PV).applyQuaternion(Q).add(PV);
        for (let m = Math.max(jj, ks); m < keep; m++) rot[m].premultiply(Q);
        PK.subVectors(pos[keep], PK);
        for (let m = keep + 1; m <= NJ; m++) pos[m].add(PK);
      } else {
        for (let m = Math.max(jj, ks) + 1; m <= NJ; m++) pos[m].sub(PV).applyQuaternion(Q).add(PV);
        for (let m = Math.max(jj, ks); m < NJ; m++) rot[m].premultiply(Q);
      }
      sp.sub(PV).applyQuaternion(Q).add(PV);
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
  function startLick({ speed = 1, mirror = false, lid: fn = null, roll: rfn = null } = {}) {
    if (Lk) return Lk.promise;
    let resolve;
    const promise = new Promise((r) => { resolve = r; });
    if (failed || disposed) { resolve(); return promise; }
    lid.fn = typeof fn === 'function' ? fn : null;
    lid.rfn = typeof rfn === 'function' ? rfn : null; lid.tilt = !!lid.rfn;
    Lk = { t: 0, speed: Math.max(0.2, +speed || 1), sx: mirror ? -1 : 1, resolve, promise, cue: 0, burst: 0, str: 0, peel: 0, run: 0, trail: 0, waiting: true, waitT: 0 };
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
    // (the wet spots dry up quickly now: the intro moves the bin soon after, and they would float off it)
    for (const w of WS) if (w.on) w.life = Math.min(w.life, w.t + 0.45);
    lid.H = 0; lid.v = 0; lid.push = 0; lidAngle();
    tellLid();
    lid.fn = lid.rfn = null; lid.tilt = false;
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
    while (l.cue < CUES.length && CUES[l.cue][0] <= t) { const [, n, info] = CUES[l.cue]; cue(n, n === 'slurp' ? { in: (TV - t) / l.speed } : info); l.cue++; }
    while (l.burst < BURSTS.length && BURSTS[l.burst][0] <= t) { const [, n, from, s] = BURSTS[l.burst]; burst(n, from, s); l.burst++; }
    while (l.str < STRINGS.length && STRINGS[l.str][0] <= t) { gapString(STRINGS[l.str][1]); l.str++; }
    while (l.peel < PEELS.length && PEELS[l.peel][0] <= t) { peelStrings(PEELS[l.peel][1]); l.peel++; }
    while (l.run < RUNS.length && RUNS[l.run][0] <= t) { runDrool(RUNS[l.run][1]); l.run++; }
    // where it lies on the top licking, it leaves the lid wet: a spot under its front every few hundredths of a second
    if (par.wl > 0.9 && par.lift < 0.03 && t >= l.trail && mesh.visible) {
      l.trail = t + 0.07;
      const k = NJ - 1 - Math.floor(rng() * 7);
      if (k > kSlot + 2) spot(pos[k].x, pos[k].y, pos[k].z, hw[k] * kw[k] * rnd(0.4, 0.65), rnd(0.8, 1.2), rnd(1, 1.6));
    }
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
        if (sp > 2.4 && (V1.z > lid.ze + 0.03 || Math.abs(V1.x) > LID_HW + 0.03 || V1.y > 0.15)) { // (out of the gap: beside the lid or over it)
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
  function burst(n, from, strength = 1) {
    if (from === 'splash') { splashBurst(strength); return; }
    where(tipPin, V1);
    for (let k = 0; k < n; k++) {
      if (from === 'drool') { // a fat drop lets go of the hanging tip
        where(tipPin, V1);
        spawnDrop(V1, V2.set(rnd(-0.05, 0.05), -0.3, 0.15), 0.022);
      } else if (from === 'gap') { // squirted out of the gap beside the tongue as it squeezes through
        const s = k % 2 ? -1 : 1, w = s * hw[kSlot] * kw[kSlot] * rnd(0.7, 1.05), a = s * rnd(0.2, 0.8), b = rnd(0.5, 1.3);
        V1.copy(slot.p).addScaledVector(slot.t, w).addScaledVector(slot.n, 0.015); V1.y = Math.max(0.01, slot.p.y * rnd(0.6, 1.2));
        spawnDrop(V1, V2.set(slot.t.x * a + slot.n.x * b, rnd(-0.1, 0.7), slot.t.z * a + slot.n.z * b), 0.009 + rng() * 0.01);
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
  // A SPLASH as it slaps down: the spit squeezed out from under its edges and its tip flies up and out, many milky
  // drops of mixed sizes (most small, a few fat) that fall back onto the lid and the floor; a fast fan of fine spray
  // thrown flat and wide from its edges, well past its outline, streaking as it flies; and where it landed the lid is
  // left wet (spots along it: under it for now, seen as it moves on). A BIG one (a roll-over slapping back down, s 1)
  // throws over twice as much, more of it fat, and higher: it rises well above the lid and rains back down on it over
  // a good half second, each drop leaving a wet spot where it lands.
  const PSP = V(), PL2 = V(), NN2 = V(), TKR = { x: 0, z: 0.5, nx: 0, nz: 1, tx: 1, tz: 0, front: 1 };
  function splashBurst(s) {
    const big = smooth(0.7, 1, s), k0 = Math.max(kSlot + 2, NJ - 8), n = Math.round(10 + 18 * s + 30 * big), across = (k) => { BX.set(1, 0, 0).applyQuaternion(rot[k]); BZ.set(0, 1, 0).applyQuaternion(rot[k]); };
    for (let i = 0; i < n; i++) {
      const k = k0 + Math.floor(rng() * (NJ - k0)), side = i % 2 ? -1 : 1;
      if (k >= NJ - 1 && rng() < 0.5) where(tipPin, V1);
      // (from all over its face, most from near its edges: from its edges alone, the burst's first frame was a row of
      // white teeth along it)
      else where(pin(k, PSP.set(side * hw[k] * (1.05 - 0.7 * rng() * rng()), rng() * restLen[k], hh[k] * rnd(0, 0.6))), V1);
      across(k); // (across it, along it)
      // (a big one's drops go more up than out, and back, away from you: they rain back down onto the lid, not off its
      // front in a long shower down the bin's front in front of everything)
      V2.copy(BX).multiplyScalar(side * s * rnd(0.6, 1.7) * (1 - 0.45 * big)).addScaledVector(BZ, s * rnd(-0.2, 0.7));
      V2.x += rnd(-0.25, 0.25); V2.y += s * rnd(0.8, 1.9) + big * rnd(0.2, 0.7); V2.z += rnd(-0.25, 0.25) - big * rnd(0.15, 0.6);
      const q = rng(), r = q < 0.6 - 0.2 * big ? rnd(0.006, 0.011) : q < 0.88 - 0.08 * big ? rnd(0.012, 0.018) : rnd(0.02, 0.026 + 0.009 * big);
      spawnDrop(V1, V2, r / 0.8);
    }
    for (let i = 0, m = Math.round(8 + 12 * s + 18 * big); i < m; i++) { // (the fine spray: specks where they land)
      const k = k0 + Math.floor(rng() * (NJ - k0)), side = i % 2 ? -1 : 1;
      where(pin(k, PSP.set(side * hw[k] * 1.02, rng() * restLen[k], 0)), V1);
      across(k);
      V2.copy(BX).multiplyScalar(side * s * rnd(2.0, 3.4)).addScaledVector(BZ, s * rnd(-0.6, 1.4));
      V2.y += s * rnd(0.3, 1.1);
      spawnDrop(V1, V2, rnd(0.004, 0.0075) / 0.8, 1);
    }
    if (par.wl > 0.5) for (let k = Math.max(kSlot + 3, NJ - 9); k < NJ; k += 3) spot(pos[k].x, pos[k].y, pos[k].z, hw[k] * kw[k] * rnd(0.6, 0.8), rnd(1.1, 1.5), rnd(1, 1.4));
  }
  // it peels its front up off the top: strings of spit from its face to the lid stretch as it rises, and snap
  function peelStrings(n) {
    if (par.wl < 0.5 || !mesh.visible) return;
    for (let i = 0; i < n; i++) {
      const s = STR.find((o) => !o.on), k = NJ - 2 - 2 * i - Math.floor(rng() * 2);
      if (!s || k <= kSlot + 2) return;
      toLid(pos[k], PL2);
      const top = lidTopRaw(PL2.x, PL2.z);
      if (top < 0) continue;
      PL2.y = top; toRig(PL2, V2); dirToRig(NN2.set(0, 1, 0), V3);
      peelString(s, k, V2, V3, 2);
      s.snapLen = 0.12 + rng() * 0.12; s.life = 0.5;
    }
  }
  // drool runs down over the lid's edge where it licked (trk: where along the track): a fat bead with a thinning trail
  // behind it, sliding down the edge's face faster and faster, and it drips off
  function runDrool(trk) {
    const s = STR.find((o) => !o.on);
    if (!s) return;
    trackAt(trk * sx, TKR);
    const x = clamp(TKR.x, -LID_HW + 0.04, LID_HW - 0.04) + rnd(-0.03, 0.03), z = TKR.z - HINGE_Z;
    newString(s);
    s.run = true; s.thin = 1; s.runT = rnd(0.4, 0.55); s.life = s.runT + 0.6; s.snapLen = 9;
    s.ea.t = 'lid'; s.ea.l.set(x + TKR.nx * 0.007, 0.088, z + TKR.nz * 0.007); // (lid space: just off its edge's face)
    s.eb.t = 'lid'; s.eb.l.copy(s.ea.l);
    endAt(s.ea, s.a); endAt(s.eb, s.b);
  }
  function newString(s) {
    s.on = true; s.t = 0; s.snapAt = -1; s.sag = 0; s.bead = 0.3 + rng() * 0.4; s.ph = rng() * 6.28; s.av.set(0, 0, 0); s.thin = 1; s.run = false;
  }
  function gapString(side) { // across the gap beside the tongue: from the rim to the lid's edge
    const s = STR.find((o) => !o.on);
    if (!s) return;
    newString(s);
    const o = sx * side * (hw[kSlot] * kw[kSlot] + rnd(0.03, 0.08)), d = rnd(0.02, 0.04), e = rnd(0.02, 0.05), j = rnd(-0.02, 0.02);
    const x = clamp(slot.p.x + slot.t.x * o, -0.49, 0.49), z = clamp(slot.p.z + slot.t.z * o, -0.4, 0.48);
    s.ea.t = 'lid'; s.ea.l.set(x - slot.n.x * d, -0.003, z - slot.n.z * d - HINGE_Z); // (lid space, as it is shut)
    s.eb.t = 'fix'; s.eb.l.set(x - slot.n.x * e + slot.t.x * j, 0.002, z - slot.n.z * e + slot.t.z * j);
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
      if (s.snapAt < 0 || s.run) { // its ends follow the tongue and the lid (a run's streak stays on the lid's face)
        if (s.ea.t !== 'pin' || (Lk && !Lk.waiting && mesh?.visible)) {
          endAt(s.ea, V1);
          if (dt > 0) s.av.copy(V1).sub(s.a).divideScalar(dt);
          s.a.copy(V1);
        }
        // (a run of drool: its bead slides down the edge's face, faster and faster, and drips off at the bottom)
        if (s.run) { const u = Math.min(1, s.t / s.runT); s.eb.l.y = s.ea.l.y - (s.ea.l.y + 0.012) * u * u; }
        endAt(s.eb, s.b);
        if (s.run && s.snapAt < 0 && s.t >= s.runT) { s.snapAt = s.t; spawnDrop(s.b, V2.set(rnd(-0.05, 0.05), -0.45, 0.08), 0.017); }
      }
      const len = s.a.distanceTo(s.b);
      if (s.snapAt < 0 && (len > s.snapLen || s.t > s.life || (s.ea.t === 'pin' && !(Lk && mesh?.visible)))) snapString(s);
      // after the snap, each half whips back to its own end within 0.1 s and is gone (a wet spot); a run's bead has
      // dripped off, and the wet streak it left down the edge's face thins away where it is over ~0.25 s
      const broke = s.snapAt >= 0 ? Math.min(1, (s.t - s.snapAt) / (s.run ? 0.25 : 0.1)) : 0;
      if (broke >= 1) {
        s.on = false; sPos.fill(0, base, base + SV * 3);
        if (s.run || (s.eb.t === 'fix' && s.eb.l.y < -0.05)) {} // (a run, or on the bin's face: nothing to see)
        else if (s.eb.t === 'lid') puddle(s.b.x, s.b.y, s.b.z, 0.018 + rng() * 0.01, 0.7, true);
        continue;
      }
      any = true;
      // it sags with its span across (a string hanging straight down hardly bows), never more than a third of its length
      const across = Math.hypot(s.b.x - s.a.x, s.b.z - s.a.z);
      const sagT = s.run ? 0 : Math.min(0.08, 0.3 * across + 0.08 * len, 0.33 * len) * (1 - broke);
      s.sag += (sagT - s.sag) * Math.min(1, dt * 12);
      const wob = s.run ? 0 : 0.14 * len * Math.sin(s.t * 27 + s.ph) * (1 - broke); // it sways, sideways
      // thins as it stretches (same volume), webbed thick where it meets its ends, a bead of spit on it
      const rMid = clamp(0.0008 / Math.max(0.05, len), 0.0032, 0.007) * s.thin, rEnd = Math.min(0.012, 0.004 + 0.12 * len) * s.thin;
      const ease = s.run ? 0 : 1 - (1 - broke) * (1 - broke);
      // (a run: its bead, round, a little longer as it speeds up, its share of the length)
      // (once its bead has dripped off, what is left is a thin wet streak at once, not a fat white spike)
      const runLeft = s.snapAt < 0 ? 1 : 0.3 + 0.7 * Math.max(0, 1 - (s.t - s.snapAt) / 0.06);
      const ru = Math.min(1, s.t / s.runT), RB = 0.013 * (s.snapAt < 0 ? 1 : 0), LB = Math.min(0.85, (2 * 0.013 * (1 + 0.7 * ru * ru)) / Math.max(1e-3, len));
      for (let u = 0; u <= SEG; u++) {
        const f = u / SEG;
        const g = broke > 0 ? (f < 0.5 ? f * (1 - ease) : 1 - (1 - f) * (1 - ease)) : f; // each half to its own end
        const bow = 4 * g * (1 - g);
        const cx = s.a.x + (s.b.x - s.a.x) * g + wob * bow, cy = s.a.y + (s.b.y - s.a.y) * g - s.sag * bow, cz = s.a.z + (s.b.z - s.a.z) * g + s.sag * 0.5 * bow;
        // (its ends narrow into what they stick to, and once it snaps the broken ends taper to points and the halves
        // thin away: no open stubs)
        // (a run: a trail down from the edge, thick where it pours over it and tapering, the fat round bead at its foot
        // closing it off; once the bead has dripped, the trail alone, thinning away)
        const fb = (f - (1 - 0.5 * LB)) / (0.5 * LB);
        const r = s.run ? Math.max((0.0035 + 0.0095 * Math.pow(1 - f, 1.3)) * Math.min(1, 0.45 + 12 * f) * (1 - smooth(1 - 0.6 * LB, 1 - 0.3 * LB, f) * (RB > 0 ? 1 : 0)) * (1 - broke) * runLeft,
          fb > -1 ? RB * Math.sqrt(Math.max(0, 1 - fb * fb)) : 0)
          : (rMid + (rEnd - rMid) * Math.pow(Math.abs(2 * f - 1), 4) + 0.007 * s.thin * Math.exp(-Math.pow((f - s.bead) / 0.08, 2)))
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
      const st = 1 + Math.min(0.55, Math.max(0, sp - 1.5) * 0.2);
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
      if (p.onLid) { toRig(p.l, p.p); Q.premultiply(Q2.setFromAxisAngle(Z, lidRoll())).premultiply(Q2.setFromAxisAngle(X, -Math.asin(lid.sin))); } // it rides on the lid
      M4.compose(p.p, Q, SC.set(s, s * 0.2, s));
      puddles.setMatrixAt(n, M4);
      // (on the black lid a full puddle reads as a grey smudge: there it is a faint wet sheen)
      fadeP.array[n++] = (u < 0.45 ? 1 : 1 - smooth(0.45, 1, u)) * (p.onLid ? 0.45 : 1);
    }
    puddles.count = n;
    puddles.instanceMatrix.needsUpdate = true; fadeP.needsUpdate = true;
    // the wet spots ride on the lid as it is now, spread out as they land and dry from the edge in
    const fadeW = spots.geometry.attributes.aFade;
    n = 0;
    for (const w of WS) {
      if (!w.on) continue;
      w.t += dt;
      const u = w.t / w.life;
      if (u >= 1) { w.on = false; continue; }
      const s = w.R * (w.t < 0.1 ? backOut(w.t / 0.1) : 1) * (1 - 0.3 * smooth(0.4, 1, u));
      toRig(w.l, w.p);
      Q.setFromAxisAngle(UP, w.rot).premultiply(Q2.setFromAxisAngle(Z, lidRoll())).premultiply(Q2.setFromAxisAngle(X, -Math.asin(lid.sin)));
      M4.compose(w.p, Q, SC.set(s * w.sx, s * 0.7, s)); // (a domed bead of a film: its slopes catch the sun)
      spots.setMatrixAt(n, M4);
      fadeW.array[n++] = 1 - smooth(0.35, 1, u);
    }
    spots.count = n;
    spots.instanceMatrix.needsUpdate = true; fadeW.needsUpdate = true;
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
      else if (failed || disposed || (Lk.waitT += dt) > O.wait) { const l = Lk; Lk = null; lid.fn = lid.rfn = null; lid.tilt = false; l.resolve(); }
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
    const inst = [drops, crowns, puddles, spots], counts = inst.map((m) => m.count);
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
    for (const pool of [D, C, PD, WS, STR]) for (const o of pool) o.on = false;
    drops.count = crowns.count = puddles.count = spots.count = 0;
    sPos.fill(0);
    strings.visible = false;
  }
  function stop() {
    const l = Lk;
    Lk = null;
    if (mesh) mesh.visible = false;
    clearFx();
    lid.H = 0; lid.v = 0; lid.push = 0; lidAngle();
    if (l) { tellLid(); lid.fn = lid.rfn = null; lid.tilt = false; l.resolve(); }
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
    get lidRoll() { return Lk ? lidRoll() : 0; },
    // for the lab: the chain (object3d space) and the pose at a given time, without the drips
    debug: {
      get mesh() { return mesh; }, get pos() { return pos; }, get rot() { return rot; }, get NJ() { return NJ; },
      get hw() { return hw; }, get hh() { return hh; }, get kz() { return kz; }, get kw() { return kw; },
      get zT() { return zT; }, get zB() { return zB; }, get xW() { return xW; },
      get sAt() { return sAt; }, get L() { return L; }, get STALK() { return STALK; }, get uSlot() { return uSlot; },
      sdf(x, y, z) { const p = V().set(x, y, z), n1 = V(), n2 = V(), pl = V(); toLid(p, pl); return { bin: binSdf(p, n1), nb: n1.toArray(), lid: lidSdf(p, n2), nl: n2.toArray(), pl: pl.toArray() }; },
      rail() { return { r0: slot.r0.toArray(), n: RN, p: Array.from(RP.subarray(0, RN * 3)), u: Array.from(RU.subarray(0, RN * 3)), jp: JP.slice(kSlot + 1, NJ + 1).map((v) => v.toArray()), ks: kSlot, rP: Array.from(rP), rY: Array.from(rY), rR: Array.from(rR), tgtP: Array.from(tgtP), angP: Array.from(angP) }; },
      get bones() { return chainBones; }, par, flags: dbg, lid,
      // vertex i in the rest pose as the shader squashes it (before skinning: then mesh.applyBoneTransform(i, out))
      restVertex(i, out) {
        const A = mesh.geometry.attributes, v = sqTable(A.aWhere.getY(i));
        const fillK = mat.userData.uFill.value + (1 - mat.userData.uFill.value) * smooth(0.1, 0.45, v.w);
        V1.fromBufferAttribute(A.aFill, i); V2.fromBufferAttribute(A.aAx, i); V3.fromBufferAttribute(A.aAz, i);
        const ox = A.aOff.getX(i) + V1.dot(V2) * fillK, oz = A.aOff.getY(i) + V1.dot(V3) * fillK;
        return out.fromBufferAttribute(A.position, i).addScaledVector(V1, fillK).addScaledVector(V2, ox * (v.x - 1)).addScaledVector(V3, oz * ((oz > 0 ? v.y : v.z) - 1));
      },
      get lidPitch() { return lidPitch(); }, get lidRoll() { return lidRoll(); },
      resolve() { if (mesh) solve(); },
      poseAt(t, set = {}) {
        if (!mesh) return;
        evalPose(t);
        for (const k in set) par[k] = set[k];
        trackAt(par.trk, TK); lid.px = TK.x; lid.pz = TK.z; lid.front = TK.front;
        lid.tilt = dbg.tilt; lid.H = Math.max(0, par.push); lidAngle();
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
// signed distance from (x, z) to the rectangle |x| <= a, |z| <= b
const rectSd = (x, z, a, b) => { const dx = Math.abs(x) - a, dz = Math.abs(z) - b; return Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) + Math.min(Math.max(dx, dz), 0); };
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
// How far a section a (across) by b (through) reaches along a direction whose parts along its axes are a and b (a, b:
// the half width and half thickness, each already times its part): the tongue's section is a superellipse, between an
// ellipse (p = 2, which misses its full corners, most of all where its flat underside meets its edges) and a box
const reach = (a, b) => Math.pow(Math.pow(Math.abs(a), 1.4) + Math.pow(Math.abs(b), 1.4), 1 / 1.4);
const wrapPi = (a) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI));
// how far from (px, pz), out along (nx, nz) (level), to where it leaves the octagon |x| <= a, |z| <= b, |x| + |z| <= c
// (a box with its corners cut; negative: that face is behind it)
function rayOct(px, pz, nx, nz, a, b, c) {
  const gx = nx < 0 ? -1 : 1, gz = nz < 0 ? -1 : 1, ax = Math.abs(nx), az = Math.abs(nz);
  let t = (c - gx * px - gz * pz) / Math.max(1e-6, ax + az);
  if (ax > 1e-6) t = Math.min(t, (a - gx * px) / ax);
  if (az > 1e-6) t = Math.min(t, (b - gz * pz) / az);
  return t;
}
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

// One track per number from the rows that key it (and trk from PACE), sampled at TRACK_HZ and smoothed: a gaussian
// SMOOTH[k] seconds wide (GAUSS by default), so nothing has a corner at a key: every move eases in and out, a slap
// only lands hard (lift's is a frame or two). Then aim gets AUTO_AIM added.
const TRACK_HZ = 240, GAUSS = 0.03;
const SMOOTH = { lift: 0.005, push: 0.008, out: 0.015, trk: 0.04, wl: 0.02, wf: 0.02 };
function buildTracks(rows) {
  const n = Math.ceil((T_END + 0.6) * TRACK_HZ) + 1, tracks = {}, tables = {};
  const keyed = (k) => rows.filter(([, p]) => k in p).map(([t, p]) => (Array.isArray(p[k]) ? [t, p[k][0], p[k][1]] : [t, p[k], 0])).sort((a, b) => a[0] - b[0]);
  for (const k of Object.keys(rows[0][1])) {
    const f = k === 'trk' ? paceTrack() : track(keyed(k)), raw = new Float32Array(n);
    for (let i = 0; i < n; i++) raw[i] = f(i / TRACK_HZ);
    tables[k] = gauss(raw, (SMOOTH[k] ?? GAUSS) * TRACK_HZ);
  }
  // AUTO_AIM: round a corner of the track the way out of the gap turns a quarter turn; the tongue's way through it
  // turns the same, but spread over AIM_SIG either side (it slants into the corner before it gets there and out of it
  // after): aim += the way out there - that way, smoothed (at most 0.5)
  const way = new Float32Array(n), tk = { x: 0, z: 0, nx: 0, nz: 1, tx: 1, tz: 0, front: 1 };
  for (let i = 0; i < n; i++) { trackAt(tables.trk[i], tk); way[i] = Math.atan2(tk.nx, tk.nz); }
  const ws = gauss(way, AIM_SIG * TRACK_HZ);
  tables.aimA = new Float32Array(n);
  for (let i = 0; i < n; i++) tables.aimA[i] = clamp(way[i] - ws[i], -0.5, 0.5);
  // WLAG: how far the way out of the gap has turned ahead of where it was, eased over WLAG_SIG (see railLid)
  const wl = gauss(way, WLAG_SIG * TRACK_HZ);
  tables.wlag = new Float32Array(n);
  for (let i = 0; i < n; i++) tables.wlag[i] = way[i] - wl[i];
  for (const k in tables) {
    const a = tables[k];
    tracks[k] = (t) => { const x = clamp(t * TRACK_HZ, 0, n - 1), i = Math.min(n - 2, Math.floor(x)), f = x - i; return a[i] + (a[i + 1] - a[i]) * f; };
  }
  return tracks;
}
const AIM_SIG = 0.12, WLAG_SIG = 0.1;
// trk (the rows' keys for it are not used): from PACE, between its times driven round the track steadily (held between
// runs), at a speed that eases in and out over EASE_T (at most 0.4 of the run) and drops to CORNER_V of it round a
// corner (where the way out of the gap turns), scaled so it gets to the end on time
const EASE_T = 0.45, CORNER_V = 0.45;
function paceTrack() {
  const corner = (k) => { const s = Math.abs(k); return smooth(TRK_FX - 0.1, TRK_FX + 0.02, s) * (1 - smooth(TRK_FX + TRK_ARC - 0.02, TRK_FX + TRK_ARC + 0.1, s)); };
  const runs = PACE.map(([t0, t1, k0, k1]) => {
    const h = 1 / TRACK_HZ, N = Math.ceil((t1 - t0) / h), dir = Math.sign(k1 - k0), et = Math.min(EASE_T, 0.4 * (t1 - t0));
    const run = (v0) => { const out = new Float32Array(N + 1); let k = k0; out[0] = k; for (let i = 1; i <= N; i++) { const t = t0 + i * h, e = smooth(t0, t0 + et, t) * (1 - smooth(t1 - et, t1, t)); k += dir * v0 * e * (1 - (1 - CORNER_V) * corner(k)) * h; out[i] = k; } return out; };
    let lo = 0, hi = 20;
    for (let it = 0; it < 40; it++) { const mid = (lo + hi) / 2; if ((run(mid)[N] - k1) * dir < 0) lo = mid; else hi = mid; }
    return { t0, t1, N, h, out: run((lo + hi) / 2) };
  });
  return (t) => {
    let v = runs[0].out[0];
    for (const r of runs) {
      if (t >= r.t1) v = r.out[r.N];
      else if (t > r.t0) { const x = (t - r.t0) / r.h, i = Math.min(r.N - 1, Math.floor(x)), f = x - i; return r.out[i] + (r.out[i + 1] - r.out[i]) * f; }
    }
    return v;
  };
}
// a gaussian blur of a sampled track, sigma in samples (the ends held)
function gauss(a, sig) {
  if (sig < 0.5) return Float32Array.from(a);
  const r = Math.ceil(3 * sig), w = [];
  let ws = 0;
  for (let j = -r; j <= r; j++) { const x = Math.exp(-0.5 * (j / sig) ** 2); w.push(x); ws += x; }
  const n = a.length, out = new Float32Array(n);
  for (let i = 0; i < n; i++) { let s = 0; for (let j = -r; j <= r; j++) s += w[j + r] * a[Math.min(n - 1, Math.max(0, i + j))]; out[i] = s / ws; }
  return out;
}

// Hermite through the keys ([t, v, how]); flat at a key that is a peak or a valley. A key whose how is HIT is arrived
// at falling, like a weight let go at the key before (a peak): from rest, faster and faster, and it stops dead there.
function track(keys) {
  const n = keys.length, m = new Float32Array(n);
  for (let k = 1; k < n - 1; k++) {
    const a = keys[k - 1][1], b = keys[k][1], c = keys[k + 1][1];
    m[k] = keys[k][2] === HIT || (b - a) * (c - b) <= 0 ? 0 : (c - a) / (keys[k + 1][0] - keys[k - 1][0]);
  }
  return (t) => {
    if (t <= keys[0][0]) return keys[0][1];
    if (t >= keys[n - 1][0]) return keys[n - 1][1];
    let k = 0;
    while (t > keys[k + 1][0]) k++;
    const [t0, v0] = keys[k], [t1, v1] = keys[k + 1], h = t1 - t0, u = (t - t0) / h, u2 = u * u, u3 = u2 * u;
    if (keys[k + 1][2] === HIT) return v0 + (v1 - v0) * u2;
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
// edge (the shader draws the outline and the highlight from it). Its normals are a smooth dome's (each blob's, from its
// own centre), not its few flat facets': a highlight on it is a soft glint that slides over it, not lit white chips.
function puddleGeometry(THREE, rng) {
  const pos = [], edge = [], nrm = [];
  const dome = (cx, cz, r, h, x, z) => {
    const dx = x - cx, dz = z - cz, d = Math.hypot(dx, dz), sl = (2 * h * Math.min(1, d / r)) / r;
    const ux = d > 1e-6 ? dx / d : 0, uz = d > 1e-6 ? dz / d : 0, l = Math.hypot(sl, 1);
    nrm.push((sl * ux) / l, 1 / l, (sl * uz) / l);
  };
  const blob = (cx, cz, r, n, h) => {
    const rim = [];
    for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2 + rng() * 0.2, rr = r * (0.88 + rng() * 0.2 + 0.08 * Math.sin(a * 3)); rim.push([cx + Math.cos(a) * rr, 0, cz + Math.sin(a) * rr]); }
    const mid = rim.map(([x, , z]) => [cx + (x - cx) * 0.62, h * 0.8, cz + (z - cz) * 0.62]);
    for (let k = 0; k < n; k++) {
      const a = rim[k], b = rim[(k + 1) % n], c = mid[(k + 1) % n], d = mid[k];
      const tri = [a, c, b, a, d, c, d, [cx, h, cz], c];
      for (const v of tri) { pos.push(...v); dome(cx, cz, r, h, v[0], v[2]); }
      edge.push(1, 0.62, 1, 1, 0.62, 0.62, 0.62, 0, 0.62);
    }
  };
  blob(0, 0, 1, 16, 0.3);
  for (let k = 0; k < 3; k++) { const a = rng() * 6.28, d = 1.25 + rng() * 0.35; blob(Math.cos(a) * d, Math.sin(a) * d, 0.15 + rng() * 0.1, 9, 0.25); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aEdge', new THREE.Float32BufferAttribute(edge, 1));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  return g;
}

// The squash, per vertex (see squash() and build()): the table uSq over s (x: across, y: its top's thickness, z: its
// underside's, w: how crushed), read as a Catmull-Rom spline (value and slope); each vertex, in the rest pose, scaled
// about the spine across (aAx) and through (aAz) by it, as far along as it is (aWhere.y).
const NSQ = 72;
const SQ_GLSL = `
uniform vec4 uSq[${NSQ}];
uniform vec2 uSqK;
attribute vec3 aAx;
attribute vec3 aAz;
attribute vec2 aOff;
void sqAt(float s, out vec4 v, out vec4 dv) {
  float x = clamp(s * uSqK.x, 0.0, uSqK.y - 0.001);
  int i = int(x);
  float t = x - float(i);
  vec4 p0 = uSq[max(i - 1, 0)], p1 = uSq[i], p2 = uSq[min(i + 1, ${NSQ - 1})], p3 = uSq[min(i + 2, ${NSQ - 1})];
  vec4 b = p2 - p0, c = 2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3, d = 3.0 * (p1 - p2) + p3 - p0;
  v = p1 + 0.5 * t * (b + t * (c + t * d));
  dv = 0.5 * (b + t * (2.0 * c + 3.0 * t * d)) * uSqK.x;
}
`;
// The underside's anatomy, from its place on it (vUnd: x how far across, -1 .. 1; y its offset through; z how far
// along, s): the frenulum's soft fold down the middle from the root, two veins either side (sunk a hair; vein: how
// much of one is here, for its bluish tint) and fine wet wrinkles (they break its gloss into small glints). Its height
// in bin units, and a bump from it (by screen derivatives, as three's bump map does).
const UNDER_GLSL = `
float undHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float undNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(undHash(i), undHash(i + vec2(1.0, 0.0)), f.x), mix(undHash(i + vec2(0.0, 1.0)), undHash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float undRelief(vec3 u, out float vein) {
  float q = clamp((u.z - uStalk) / (uLen - uStalk), 0.0, 1.0), a = u.x;
  float fren = exp(-a * a / 0.012) * (1.0 - smoothstep(0.35, 0.7, q));
  float vp = 0.3 + 0.04 * sin(q * 17.0) + 0.02 * sin(q * 41.0), dv = abs(abs(a) - vp);
  vein = exp(-dv * dv / 0.006) * smoothstep(0.05, 0.2, q) * (1.0 - smoothstep(0.6, 0.85, q));
  // (warped, so they don't cut a glint across it into a row of even blocks, like teeth)
  float wa = a * 9.0 + 1.6 * undNoise(vec2(q * 9.0, a * 2.5 + 7.3));
  float wr = undNoise(vec2(wa, q * 15.0)) + 0.5 * undNoise(vec2(a * 21.0 + 3.1 + 2.0 * q, q * 33.0 + a * 4.0)) - 0.75;
  return 0.01 * fren - 0.0008 * vein + 0.0005 * wr;
}
vec3 undBump(vec3 n, float h, float fd) {
  vec3 sp = -vViewPosition, sx = dFdx(sp), sy = dFdy(sp);
  vec3 r1 = cross(sy, n), r2 = cross(n, sx);
  float det = dot(sx, r1) * fd;
  vec3 g = sign(det) * (dFdx(h) * r1 + dFdy(h) * r2);
  return normalize(abs(det) * n - g);
}
`;
// (fillK: how much of the groove is filled, as the normals had it; the offsets with the fill)
const SQ_GLSL_POS = `
{
  float ox = aOff.x + dot(aFill, aAx) * fillK, oz = aOff.y + dot(aFill, aAz) * fillK;
  transformed += aAx * (ox * (sqV.x - 1.0)) + aAz * (oz * ((oz > 0.0 ? sqV.y : sqV.z) - 1.0));
}
`;
// In the gap it can't be thicker than the gap: under the lid, never above its underside; over the rim, never below its
// top (the squash does nearly all of it; this makes it exact), wherever along the track it comes out. (After skinning,
// in object3d space; the shadow pass does the same.)
const GAP_GLSL = `
// A ceiling (the lid's underside) and a floor (the rim's top), both faded in over a little way (from the lid's
// edges, from the rim's edges) and continuous: what pokes through a little is pressed onto them; what is
// deeper (hidden in the lid or the rim) is eased back to where it was, so nothing tears or steps. (The
// ceiling is all there from just inside the lid's edge, faded in from just outside it: going through the
// gap at a slant, the tongue's flank right at the edge doesn't poke up into the lid's edge face.)
if (uLid.z > 0.5) {
  float ax = abs(transformed.x), az = abs(transformed.z);
  // (how far in under the lid: from its sides, its front, its cut front corners)
  float dIn = -max(max(ax - uEdge.x, transformed.z - uLid.y), (ax + transformed.z - uEdge.y) * 0.7071);
  float fade = smoothstep(-0.006, 0.012, dIn);
  if (fade > 0.0) {
    float yTop = (transformed.z + 0.5) * uLid.x + (transformed.x - uRoll.y) * uRoll.x - 0.004;
    float o = transformed.y - yTop;
    if (o > 0.0) transformed.y -= fade * (o < 0.04 ? o : max(0.0, 0.04 - (o - 0.04)));
  }
  // (on the rim: inside its outline, outside the opening)
  float rimSd = max(max(ax - uHole.z, az - uHole.w), (ax + az - 0.974) * 0.7071);
  float fb = smoothstep(0.015, -0.01, rimSd) * smoothstep(-0.012, 0.002, max(ax - uHole.x, az - uHole.y));
  if (fb > 0.0) {
    float u = 0.004 - transformed.y;
    if (u > 0.0) transformed.y += fb * (u < 0.05 ? u : max(0.0, 0.05 - (u - 0.05)));
  }
}
`;

// The cartoon liquid. DROP: the trailing half stretches into a tail as the instance is stretched (round when slow).
// FADE: a per-instance fade. CROWN: whiter, thicker points. PUDDLE: flat; outline and a highlight crescent from aEdge.
// SHEEN (with PUDDLE): a wet film on the black lid: the sun's highlight off its shallow, smooth dome, a small soft glint
// (it slides over it as the camera and the lid move: it glistens) and a sheen toward grazing angles, instead of the
// painted crescent.
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
#ifdef SHEEN
varying vec3 vLt;
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
  #ifdef SHEEN
  vLt = normalize(mat3(viewMatrix) * normalize(vec3(-2.2, 5.0, 3.2)));
  #endif
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
#ifdef SHEEN
varying vec3 vLt;
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
    #ifdef SHEEN
      vec3 v = normalize(vV), n = normalize(vN);
      // (a small soft glint where its smooth dome faces the sun's reflection, kept in from its outline)
      float sp = pow(max(dot(n, normalize(vLt + v)), 0.0), 48.0);
      float fr = pow(1.0 - max(dot(n, v), 0.0), 3.0);
      float g = 0.9 * smoothstep(0.3, 0.85, sp) * (1.0 - smoothstep(0.78, 0.95, vEdge)) + 0.1 * hl + 0.12 * fr * (1.0 - ol);
      col = mix(col, vec3(1.0), clamp(g, 0.0, 1.0)); a = max(a, min(0.95, g));
    #else
      col = mix(col, vec3(1.0), hl); a = max(a, hl * 0.95);
    #endif
  #else
    vec3 v = normalize(vV);
    vec3 n = normalize(vN);
    if (!gl_FrontFacing) n = -n;
    float rim = 1.0 - abs(dot(n, v));
    #ifdef DROP
      // a bead of spit: milky (a soft blue-grey, darker underneath, lit white on top: solid, not a clear bubble), a thin
      // darker edge
      col = mix(col, vec3(0.6, 0.67, 0.77), smoothstep(0.35, -0.85, n.y) * 0.85);
      col = mix(col, vec3(1.0), smoothstep(0.35, 0.95, n.y) * 0.45);
      float ed = smoothstep(0.7, 0.93, rim);
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
    #ifdef DROP
      bounce *= 0.25; // (a bright crescent underneath, inside a dark rim: a glass marble)
    #endif
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
