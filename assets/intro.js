// The sbhmn.com intro: throw the paper in the bin. The lid slams; the camera cranes up over the bin as a tongue
// pops out under the lid and swoops across its top in one lick, the lid riding on it (assets/intro/tongue-model.js),
// and slurps back in; the lid slams again. The camera comes round to the front, something rattles inside, then a black
// thing rises and lifts the lid: red eyes, teeth. SBHMN slams into the bin letter by letter. It spits the paper back at
// you; the paper uncrumples, stop motion, into a flat sheet that fills the screen, and that sheet becomes the page. The
// bin is low poly, built from the logo's own proportions (assets/3d/bin.glb; 1 unit = 500 logo px, standing on y = 0,
// front facing +z); its letters and fangs are the logo's own outlines (assets/3d/bin-letters.json,
// tools/art/sbhmn-site-assets.mjs in the game repo).
import * as THREE from 'three';
import { GLTFLoader } from '/assets/vendor/three/addons/loaders/GLTFLoader.js';
import { mergeVertices } from '/assets/vendor/three/addons/utils/BufferGeometryUtils.js';
import { createPaper, createPaperBall } from '/assets/intro/paper.js';
import { createDrips } from '/assets/intro/drips.js';
import { createSfx } from '/assets/intro/sfx.js';
import { v } from '/assets/v.js';

const html = document.documentElement;
const replayWrap = document.querySelector('.replay-wrap');
const brandImg = document.querySelector('header.site .brand img');

// The logo's box in bin units (sbhmn-mark.svg viewBox 603 348 1862 1730, drawn at 3x the 1024 px logo): the front view frames it.
const MARK = { left: -0.62, right: 0.6213, top: 1.076, bottom: -0.0773, aspect: 1862 / 1730 };
const MISSES = ['Not even close.', 'Bold. Wrong, but bold.', 'The floor thanks you.', "The bin's right there.", 'Try aiming this time.', 'We saw that.', 'Hm. No.'];
const LID_OPEN = -1.9; // radians about the hinge: standing up behind the bin, a backboard
const RIM_Y = 0.78, OPEN_X = 0.439, OPEN_Z = 0.395, OUT_X = 0.554, OUT_Z = 0.5;
const BALL_R = 0.07, START = new THREE.Vector3(0, 0.9, 2.4), G = 9.8;

function markDone() { try { sessionStorage.setItem('sbhmn-intro', 'done'); } catch (e) {} }
// The home page's own 3D (assets/home/home.js) listens: it runs only while the intro doesn't.
const announce = (type) => document.dispatchEvent(new Event(type));
function reveal() {
  html.classList.remove('intro-on', 'logo-flying', 'intro-handoff');
  if (replayWrap) replayWrap.hidden = false;
  announce('sbhmn:reveal');
}

if (html.classList.contains('intro-on')) start();
else reveal();
replayWrap?.querySelector('button')?.addEventListener('click', () => {
  window.scrollTo(0, 0);
  html.classList.add('intro-on');
  start();
});

async function start() {
  announce('sbhmn:intro-start');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
  } catch (e) {
    markDone(); reveal(); return;
  }
  const stage = document.createElement('div');
  stage.className = 'intro';
  stage.innerHTML = `<div class="hint"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"><path d="M12 20V5M5 11l7-7 7 7"/></svg><span>Grab it. Bin it.</span></div><button class="skip" type="button">Skip</button>`;
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-label', 'A paper toss game: grab the paper and flick it up into the bin, or press Enter');
  stage.prepend(canvas);
  document.body.append(stage);
  // The picture is drawn for the canvas's own box, not the window: on a desktop with a classic scrollbar the stage
  // stops at the scrollbar's gutter (scrollbar-gutter: stable), ~15 px short of innerWidth. Drawn for the window, it
  // was squeezed into that box, and the landed paper lay up to 15 px left of the page it turns into.
  const size = () => [canvas.clientWidth || innerWidth, canvas.clientHeight || innerHeight];
  const hint = stage.querySelector('.hint span');
  const hintBox = stage.querySelector('.hint');

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9a9a9a, 2.2));
  const sun = new THREE.DirectionalLight(0xffffff, 2.6);
  sun.position.set(-2.2, 5, 3.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -2.5, right: 2.5, top: 2.5, bottom: -2.5, near: 1, far: 12 });
  sun.shadow.radius = 4;
  scene.add(sun);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.13 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // --- assets
  const texLoader = new THREE.TextureLoader();
  const loadTex = (url) => new Promise((ok, fail) => texLoader.load(url, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; ok(t); }, undefined, fail));
  let gltf, glyphs;
  try {
    [gltf, glyphs] = await Promise.all([
      new GLTFLoader().loadAsync(v('/assets/3d/bin.glb')),
      fetch(v('/assets/3d/bin-letters.json')).then((r) => { if (!r.ok) throw new Error('letters'); return r.json(); }),
    ]);
  } catch (e) {
    stage.remove(); renderer.dispose(); markDone(); reveal(); return;
  }
  // The crumpled homepage you throw (small, needed now); the sheet it unfolds into and the tongue load meanwhile.
  const sfx = createSfx(); // real recorded sounds (CC0), fetched now, decoded on the first touch
  const ballP = createPaperBall().catch((e) => { console.warn('paper ball', e); return null; });
  let sheet = null, tongue = null, drips = null;
  const sheetP = createPaper({ viewport: size }).then((s) => { sheet = s; scene.add(s.object3d); return s; }).catch((e) => { console.warn('paper', e); return null; });

  // --- the bin
  const binMat = new THREE.MeshStandardMaterial({ color: 0x171717, roughness: 0.75, metalness: 0, flatShading: true });
  const voidMat = new THREE.MeshBasicMaterial({ color: 0x050505, side: THREE.DoubleSide });
  const bin = new THREE.Group();
  scene.add(bin);
  const parts = {};
  gltf.scene.traverse((o) => { if (o.isMesh) parts[o.name] = o; });
  for (const name of ['body', 'rim', 'base', 'wheels', 'inside']) {
    const m = parts[name];
    if (!m) continue;
    m.material = name === 'inside' ? voidMat : binMat;
    m.castShadow = name !== 'inside';
    m.receiveShadow = true;
    bin.add(m);
  }
  // Lid: pitch about the hinge (x axis at the back of the rim), roll about its left edge (the logo's lid is tipped up
  // on the right).
  const lidMesh = parts.lid;
  const hinge = lidMesh.position.clone();
  const pitch = new THREE.Group(); pitch.position.copy(hinge); bin.add(pitch);
  const roll = new THREE.Group(); roll.position.set(-0.51, 0, 0); pitch.add(roll);
  lidMesh.position.set(0.51, 0, 0); lidMesh.material = binMat; lidMesh.castShadow = true; roll.add(lidMesh);
  pitch.rotation.x = LID_OPEN;
  // The lid's underside is pitch black (unlit): under a lifted lid there is only dark, like the logo.
  const pitchBlack = new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.DoubleSide });
  const lining = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.98), pitchBlack);
  lining.rotation.x = Math.PI / 2; lining.position.set(0, -0.002, 0.5);
  lidMesh.add(lining);

  // The monster: a black block living in the bin, two low-poly red eyes on its face. It rises and lifts the lid from
  // inside. Its top starts just under the rim (MONSTER_TOP); during the throw it hides deep in the bin.
  const MONSTER_TOP = 0.775, EYE_DROP = 0.045, LID_REACH = 0.87; // lid reach: hinge to the block's front edge
  const monster = new THREE.Group();
  bin.add(monster);
  const block = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.5, 0.74), pitchBlack); // bottom stays above the bin's floor
  block.position.set(0, MONSTER_TOP - 0.25, 0);
  monster.add(block);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2414 });
  const eyeL = new THREE.Mesh(eyeGeometry(false), eyeMat), eyeR = new THREE.Mesh(eyeGeometry(true), eyeMat);
  eyeL.position.set(-0.075, MONSTER_TOP - EYE_DROP, 0.366); eyeR.position.set(0.075, MONSTER_TOP - EYE_DROP, 0.366);
  eyeL.scale.y = eyeR.scale.y = 0;
  monster.add(eyeL, eyeR);
  monster.visible = false; // it arrives with the slam: during the throw the bin is just a bin
  const lift = (rise) => -Math.asin(Math.min(0.6, Math.max(0, rise + 0.003) / LID_REACH)); // lid pitch resting on the block

  // SBHMN and the fangs: the logo's own outlines (assets/3d/bin-letters.json, bin units), extruded low poly. Each sits
  // on the body's front face, which leans out as it rises (and bulges a little at mid height, like the model).
  const LEAN = Math.atan(0.04 / 0.48);
  const face = (y) => 0.39 + ((y - 0.216) / 0.48) * 0.04 + 0.006 * Math.max(0, 1 - Math.abs(y - 0.456) / 0.24);
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x2a2a2a, roughness: 0.55, flatShading: true });
  function glyphMesh(g, depth, pivot) {
    const [x0, y0, x1, y1] = g.box;
    const px = (x0 + x1) / 2, py = pivot === 'top' ? y1 : (y0 + y1) / 2;
    const shapes = g.shapes.map(({ outline, holes }) => {
      const s = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x - px, y - py)));
      s.holes = holes.map((h) => new THREE.Path(h.map(([x, y]) => new THREE.Vector2(x - px, y - py))));
      return s;
    });
    const geo = new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.003, bevelSegments: 1, curveSegments: 1 });
    const m = new THREE.Mesh(geo, whiteMat);
    m.position.set(px, py, face(py) - 0.004);
    m.rotation.x = LEAN;
    m.userData.home = m.position.clone();
    m.visible = false;
    bin.add(m);
    return m;
  }
  const letters = glyphs.letters.map((g) => glyphMesh(g, 0.034, 'centre'));
  const fangs = glyphs.fangs.map((g) => glyphMesh(g, 0.02, 'top'));

  // Chips knocked off the bin when a letter hits.
  const chipGeo = new THREE.TetrahedronGeometry(0.016, 0);
  const chips = [];
  function burst(at, n = 6) {
    for (let k = 0; k < n; k++) {
      const c = new THREE.Mesh(chipGeo, binMat);
      c.position.copy(at);
      c.userData.v = new THREE.Vector3((Math.random() - 0.5) * 1.6, 0.4 + Math.random() * 1.2, 0.6 + Math.random() * 1.1);
      c.userData.life = 0.7;
      bin.add(c); chips.push(c);
    }
  }
  function stepChips(dt) {
    for (let k = chips.length - 1; k >= 0; k--) {
      const c = chips[k], u = c.userData;
      u.life -= dt; u.v.y -= G * dt;
      c.position.addScaledVector(u.v, dt); c.rotation.x += dt * 9; c.rotation.y += dt * 7;
      c.scale.setScalar(Math.max(0.01, u.life / 0.7));
      if (u.life <= 0 || c.position.y < 0) { bin.remove(c); chips.splice(k, 1); }
    }
  }
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.12), new THREE.MeshBasicMaterial({
    map: radialTexture(), color: 0x6a0805, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  glow.position.set(0, MONSTER_TOP - EYE_DROP, 0.39);
  monster.add(glow);

  // --- the paper: the homepage, printed and crumpled (assets/intro/paper.js); a plain crumple if it didn't load.
  const ballMade = await ballP;
  const paper = new THREE.Group(); // holder: the module's ball carries its own scale
  paper.add(ballMade ? ballMade.object3d : new THREE.Mesh(crumple(), new THREE.MeshStandardMaterial({ color: 0xf3f1ec, roughness: 1, flatShading: true })));
  paper.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  scene.add(paper);

  // --- the tongue: the owner's rigged model by default (assets/intro/tongue-model.js), the low-poly one with
  // ?tongue=low or if the model fails. It licks the paper in, then the lid slams.
  const tongueKind = new URLSearchParams(location.search).get('tongue') === 'low' ? 'low' : 'model';
  // The tongue's sound: ONE long slurp (the owner: "just one long slurp sound"), the lick's only sound (no thunk as it
  // pops the lid, no squelch, no slap, no knocks, no drops). The clip (1.93 s) is a long rising suck that runs into a
  // wet smack at SMACK s, then gulps: it starts as the tongue pops out, part way in so that the suck runs under the
  // whole swoop and its smack lands as the tip vanishes (info.in: how long until then; the low-poly tongue sends none:
  // it is gone ~0.18 s after it starts its slurp). The lid then slams shut: a real slam, and the slurp fades out from
  // just after its smack, before the gulps, so the slam punches (the slurp is mastered much louder: -13 LUFS, the slam
  // -25; the low-poly tongue's lid slams in the show below, so there the slurp fades on its own).
  const SMACK = 1.53, LOW_IN = 0.18;
  let slurping = null;
  const onCue = (name, info = {}) => {
    const s = info.strength ?? 1;
    if (name === 'slurp') {
      const h = slurping = sfx.play('slurp', { gain: 0.6, offset: Math.max(0, SMACK - (info.in ?? LOW_IN)), vary: 0.02 });
      // (its smack rings on ~0.1 s past the tip vanishing: faded from 40 ms after it, so the lid's slam right after
      // punches through it instead of landing in its tail)
      if (info.in == null) wait((LOW_IN + 0.1) * 1000).then(() => h?.stop(140));
      else wait((info.in + 0.04) * 1000).then(() => h?.stop(120));
    }
    else if (name === 'clap') {
      if (s < 0.7) sfx.play('lid-clap', { gain: 0.2 + 0.4 * s });
      else { sfx.play('lid-slam', { gain: 1.15 }); slurping?.stop(100); slurping = null; shake = Math.max(shake, 0.02); }
    }
  };
  const tongueP = (async () => {
    const make = async (path) => (await import(path)).createTongue(THREE, { fxParent: scene, onCue });
    let t = null;
    if (tongueKind === 'model') {
      t = await make('/assets/intro/tongue-model.js').catch((e) => { console.warn('tongue model', e); return null; });
      // the model's GLB loads in the background: wait for it before warming (else the compile lands mid-lick)
      if (t?.ready) await Promise.resolve(t.ready).catch((e) => { console.warn('tongue model', e); try { t.dispose?.(); } catch (_) {} t = null; });
    }
    t ??= await make('/assets/intro/tongue.js').catch((e) => { console.warn('tongue', e); return null; });
    if (!t || aborted) return t;
    bin.add(t.object3d);
    t.object3d.position.set(0, RIM_Y, 0);
    try { t.warm?.(renderer, camera); } catch (e) { /* warming is an optimisation */ }
    tongue = t;
    return t;
  })();

  // --- camera views
  const cam = { pos: new THREE.Vector3(), target: new THREE.Vector3(0, 0.5, 0), fov: 40 };
  // How far back a camera at elevation el (radians), straight in front, looking at T must be to frame every corner of
  // box ([x0, x1, y0, y1, z0, z1], bin space) with margin (a share of the frame) kept clear at the edges.
  // (the box: what the tongue does, measured every 1/60 s: ~0.1 past the rim's sides, ~0.6 above the rim, down the
  // bin's front to the base, with room to spare at the sides; as it flops down the front it comes ~0.4 toward the
  // camera, past the box, for a moment: the frame holds it anyway, and boxing it too would back the camera off. The
  // camera looks at the bin's middle line)
  const LICK_BOX = [-0.8, 0.74, 0.2, 1.42, -0.45, 0.8], LICK_EL = THREE.MathUtils.degToRad(32), LICK_T = new THREE.Vector3(0, 0.8, 0.16);
  function fitOrbit(el, T, fov, aspect, box, margin) {
    const f = new THREE.Vector3(0, -Math.sin(el), -Math.cos(el)), r = new THREE.Vector3(1, 0, 0), u = new THREE.Vector3().crossVectors(r, f);
    const ty = (1 - margin) * Math.tan(THREE.MathUtils.degToRad(fov / 2)), tx = ty * aspect, P = new THREE.Vector3();
    let d = 0;
    for (let i = 0; i < 8; i++) {
      P.set(box[i & 1], box[2 + ((i >> 1) & 1)], box[4 + ((i >> 2) & 1)]).sub(T);
      d = Math.max(d, Math.max(Math.abs(P.dot(r)) / tx, Math.abs(P.dot(u)) / ty) - P.dot(f));
    }
    return d;
  }
  const view = {
    throw() {
      const fov = 40, aspect = camera.aspect, base = 3.9;
      const fit = 1.9 / (2 * base * Math.tan(THREE.MathUtils.degToRad(fov / 2)) * aspect);
      const d = base * Math.max(1, fit);
      return { pos: new THREE.Vector3(0, 0.5, 0).addScaledVector(new THREE.Vector3(0, 1.25, 3.7).normalize(), d), target: new THREE.Vector3(0, 0.5, 0), fov };
    },
    // the lick: craned up over the bin, 32 degrees down (the throw camera looks 19 degrees down: from there the lid's
    // top is a sliver), so its top reads, framing everything the tongue does: out of the right side, across the top,
    // over at the left side, up off the lid and down the front onto the base. Never further back than the throw camera:
    // on a portrait phone, where the bin's width sets how far back both stand, it rises and looks down, it doesn't back
    // off
    lick() {
      const fov = 40, dThrow = view.throw().pos.distanceTo(new THREE.Vector3(0, 0.5, 0));
      const d = Math.min(dThrow, fitOrbit(LICK_EL, LICK_T, fov, camera.aspect, LICK_BOX, 0.04));
      return { pos: new THREE.Vector3(0, Math.sin(LICK_EL), Math.cos(LICK_EL)).multiplyScalar(d).add(LICK_T), target: LICK_T.clone(), fov };
    },
    front() {
      const fov = 18, t = 2 * Math.tan(THREE.MathUtils.degToRad(fov / 2));
      const h = MARK.top - MARK.bottom, w = MARK.right - MARK.left;
      const d = Math.max(h / 0.5 / t, w / 0.62 / (t * camera.aspect));
      const cy = (MARK.top + MARK.bottom) / 2;
      return { pos: new THREE.Vector3(0, cy, d), target: new THREE.Vector3(0, cy, 0), fov };
    },
  };
  let phase = 'throw';
  function resize() {
    const [w, h] = size();
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    if (phase === 'throw') Object.assign(cam, view.throw());
    if (phase === 'lick') Object.assign(cam, view.lick());
    if (phase === 'front') Object.assign(cam, view.front());
  }
  window.addEventListener('resize', resize);
  resize();

  // --- loop, tweens, shake
  // One clock for the physics and the show: it stops while the tab is hidden, so nothing jumps when it comes back.
  const tweens = new Set();
  let aborted = false, shake = 0, last = performance.now(), clock = 0;
  const tween = (ms, fn, ease = (t) => t) => new Promise((res) => tweens.add({ t0: clock, ms, fn, ease, res }));
  const wait = (ms) => tween(ms, () => {});
  const easeIn = (t) => t * t * t, easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const backOut = (t) => 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);
  const shakeOff = new THREE.Vector3();
  let raf = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    tick(Math.min(0.05, (now - last) / 1000)); last = now;
  }
  function tick(dt) {
    clock += dt * 1000;
    const now = clock;
    for (const tw of [...tweens]) {
      const t = Math.min(1, (now - tw.t0) / tw.ms);
      tw.fn(tw.ease(t), t);
      if (t >= 1) { tweens.delete(tw); tw.res(); }
    }
    step(dt, now);
    shake *= Math.pow(0.0008, dt);
    shakeOff.set((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake, 0);
    camera.position.copy(cam.pos).add(shakeOff);
    camera.fov = cam.fov; camera.updateProjectionMatrix();
    camera.lookAt(cam.target);
    camera.updateMatrixWorld();
    tongue?.update(dt);
    sheet?.update(dt); // after the camera: once landed, the sheet stays registered on the screen
    drips?.update(dt);
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  // --- sound: real recordings (assets/intro/sfx.js); audio starts on the visitor's own first touch
  let ac = null;
  const audio = () => { try { ac ??= new (window.AudioContext || window.webkitAudioContext)(); ac.resume?.(); sfx.attach(ac); } catch (e) {} return ac; };

  // --- throwing
  // The paper is a thing you hold. Press on it, or anywhere (it comes to the pointer), and it follows the pointer on a
  // plane facing the camera through its rest spot, a touch behind (a spring), rolling a little as it moves. It stays
  // on the player's side: on screen it can't be lifted past the bin's front rim (it slows into a ceiling just under
  // it), so it never looks as if it is over the opening. Let go while flicking it up and it flies from where it is;
  // let go without a flick and it drops, like anything let go of, then pops back at its spot: no harm done, no miss.
  // The flick is read for intent, not precision: a cheap mouse sends sparse, uneven events, its sensor (or a thumb
  // lifting off a phone) settles back a little at the end of a flick, and people stop a beat before they let go. So
  // readFlick() finds the flick's peak, forgives a small settle back after it and the still beat before the release
  // (a longer one after a clear stroke toward the bin), and reads the ~200 ms into the peak, recency weighted. Then the
  // aim assist (launch()) bends any roughly upward flick, of almost any speed, into a lob that drops in, from the
  // first throw. A sideways fling or a feeble twitch gets little help and misses: the miss lines still have work to do.
  // ball: p, v in flight; held: following the pointer; drop: let go without a flick, falling; hv: the held (or
  // dropping) paper's velocity; t, rest: the flight's (or the drop's) clock and its time lying still; out: missed,
  // about to reset; show: popping back in at its spot (0 -> 1); gone: shrinking away after a drop (0 -> 1).
  const ball = { p: START.clone(), v: new THREE.Vector3(), hv: new THREE.Vector3(), flying: false, in: false, held: false, drop: false, out: false, rest: 0, t: 0, show: 1, gone: 0 };
  // the hold: the pointer it follows, the spot it chases, the grab's offset on screen (px, the paper's centre minus
  // the pointer: kept when the press was on the paper, else 0), the pointer's recent samples (client px, ms), the
  // pick-up's little squeeze (0 -> 1) and how the last release was read (for ?debug)
  const grab = { id: null, to: new THREE.Vector3(), ox: 0, oy: 0, samples: [], pop: 1, read: null };
  const MOUTH = new THREE.Vector3(0, RIM_Y + BALL_R, 0); // where an ideal throw's centre crosses the rim's height
  const RIM_FRONT = new THREE.Vector3(0, RIM_Y, OUT_Z); // the top of the bin's front rim: the held paper stays under it
  const CRINKLES = ['crinkle1', 'crinkle2', 'crinkle3', 'crinkle4'];
  const dragPlane = new THREE.Plane(), ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const tmp = new THREE.Vector3(), scr = new THREE.Vector3(), look = new THREE.Vector3(), fromCam = new THREE.Vector3(), arc = new THREE.Vector3();
  let misses = 0, done = false, bob = 0;
  // Back at its spot, still. It pops back in (show: 0 -> 1) after a miss or a drop; not at the very start.
  function resetBall(popIn = true) {
    ball.p.copy(START); ball.v.set(0, 0, 0); ball.hv.set(0, 0, 0); ball.rest = 0; ball.t = 0; ball.gone = 0;
    ball.flying = ball.in = ball.held = ball.drop = ball.out = false;
    ball.show = popIn ? 0 : 1;
    grab.id = null; grab.pop = 1; bob = 0;
    paper.visible = true; paper.scale.setScalar(popIn ? 0.001 : 1);
    stage.classList.remove('held', 'busy');
  }
  resetBall(false);
  function step(dt, now) {
    stepChips(dt);
    if (ball.flying) {
      const n = 4, h = dt / n;
      for (let i = 0; i < n && ball.flying; i++) physics(h);
      paper.position.copy(ball.p);
      paper.rotation.x -= dt * ball.v.length() * 3.2;
      paper.rotation.z += dt * ball.v.x * 4;
      return;
    }
    if (ball.in) return;
    if (ball.held) follow(dt);
    else if (ball.drop) fall(dt);
    // at rest it bobs and turns; the bob eases back in after a hold, so nothing jumps
    bob = ball.held || ball.drop || ball.out ? 0 : Math.min(1, bob + dt * 1.5);
    paper.position.copy(ball.p);
    paper.position.y += Math.sin(now / 420) * 0.012 * bob;
    paper.rotation.y += dt * 0.4;
    // its size: popping back in (a touch of overshoot), the pick-up's squeeze, shrinking away after a drop (caught
    // while it shrinks, it grows back)
    grab.pop = Math.min(1, grab.pop + dt / 0.2);
    ball.show = Math.min(1, ball.show + dt / 0.3);
    if (!ball.drop) ball.gone = Math.max(0, ball.gone - dt / 0.12);
    paper.scale.setScalar(Math.max(0.001, backOut(ball.show) * (1 + 0.08 * Math.sin(Math.PI * grab.pop)) * (1 - ball.gone)));
  }
  // The held paper chases its spot on a slightly underdamped spring (it trails a fast drag by a few cm and settles
  // with the smallest overshoot; from across the screen it gets there in ~0.12 s). Substeps keep the stiff spring
  // stable at low frame rates. It rolls with its motion, like a ball turned in the fingers.
  function follow(dt) {
    const w = 38, z = 0.75, n = Math.ceil(dt / 0.004), h = dt / n;
    for (let i = 0; i < n; i++) {
      tmp.subVectors(grab.to, ball.p).multiplyScalar(w * w).addScaledVector(ball.hv, -2 * z * w);
      ball.hv.addScaledVector(tmp, h);
      ball.p.addScaledVector(ball.hv, h);
    }
    paper.rotation.x -= ball.hv.y * dt * 2.4;
    paper.rotation.z -= ball.hv.x * dt * 2.4;
  }
  // Let go without a flick: it falls with the hand's last motion and bounces on the floor. Once it is out of view it
  // pops straight back at its spot; still in view (on a phone the floor is), it lies there a beat, shrinks away, then
  // pops back. It can be caught at any point.
  function fall(dt) {
    const p = ball.p, v = ball.hv, n = 4, h = dt / n;
    ball.t += dt;
    for (let i = 0; i < n; i++) {
      v.y -= G * h;
      p.addScaledVector(v, h);
      if (p.y < BALL_R) {
        p.y = BALL_R;
        if (v.y < 0) v.y = -v.y * 0.32;
        const f = Math.pow(0.02, h); v.x *= f; v.z *= f; // the floor's grip
        if (Math.abs(v.y) < 0.25) ball.rest += h;
      }
    }
    paper.rotation.x += (v.z - v.y) * dt * 2.4;
    paper.rotation.z -= v.x * dt * 2.4;
    const r = canvas.getBoundingClientRect(), q = toScreen(p), m = paperPx(p);
    if (q.y - m > r.bottom || q.x + m < r.left || q.x - m > r.right) { resetBall(); return; }
    if (ball.rest > 0.35 || ball.t > 1.2 || ball.gone > 0) {
      ball.gone = Math.min(1, ball.gone + dt / 0.15);
      if (ball.gone >= 1) resetBall();
    }
  }
  function physics(h) {
    const p = ball.p, v = ball.v, prevY = p.y;
    ball.t += h;
    v.y -= G * h;
    // A little help after misses: a falling ball near the opening drifts toward it.
    if (misses > 0 && v.y < 0 && p.y > RIM_Y && p.y < RIM_Y + 0.6) {
      const pull = Math.min(3, misses) * 0.9 * h;
      if (Math.abs(p.x) < OUT_X + 0.25 && Math.abs(p.z) < OUT_Z + 0.25) { p.x -= p.x * pull; p.z -= p.z * pull; }
    }
    p.addScaledVector(v, h);
    if (ball.in) {
      if (p.y < 0.35) { ball.flying = false; paper.visible = false; }
      return;
    }
    // The open lid: a backboard through the hinge, leaning back.
    const ang = pitch.rotation.x;
    const dir = new THREE.Vector3(0, -Math.sin(ang), Math.cos(ang)); // hinge -> the lid's (closed) front edge
    const nrm = new THREE.Vector3(0, -Math.cos(ang), -Math.sin(ang)); // the lid's underside: faces the player when open
    const rel = p.clone().sub(hinge);
    const along = rel.dot(dir), dist = rel.dot(nrm);
    if (Math.abs(p.x) < 0.51 && along > 0 && along < 1.0 && dist < BALL_R && dist > -0.12 && v.dot(nrm) < 0) {
      v.addScaledVector(nrm, -1.45 * v.dot(nrm)); v.multiplyScalar(0.8); p.addScaledVector(nrm, BALL_R - dist);
    }
    // Crossing the rim's height while coming down.
    if (prevY - BALL_R >= RIM_Y - 0.005 && p.y - BALL_R < RIM_Y && v.y < 0) {
      const slack = 0.02 + Math.min(3, misses) * 0.03;
      if (Math.abs(p.x) < OPEN_X - BALL_R * 0.4 + slack && Math.abs(p.z) < OPEN_Z - BALL_R * 0.4 + slack) {
        ball.in = true; v.x *= 0.3; v.z *= 0.3; sfx.play('paper-in', { gain: 0.85 }); scored(); return;
      }
      if (Math.abs(p.x) < OUT_X + BALL_R * 0.5 && Math.abs(p.z) < OUT_Z + BALL_R * 0.5) {
        // off the rim: up and away from the opening
        p.y = RIM_Y + BALL_R; v.y = Math.abs(v.y) * 0.45;
        sfx.play('paper-in', { gain: 0.35, rate: 1.25 });
        const away = new THREE.Vector3(p.x, 0, p.z).normalize();
        v.addScaledVector(away, 0.8);
      }
    }
    // The bin's sides.
    if (p.y < RIM_Y && Math.abs(p.x) < OUT_X + BALL_R && Math.abs(p.z) < OUT_Z + BALL_R) {
      const dx = OUT_X + BALL_R - Math.abs(p.x), dz = OUT_Z + BALL_R - Math.abs(p.z);
      if (dz < dx) { p.z = Math.sign(p.z || 1) * (OUT_Z + BALL_R); v.z = Math.sign(p.z) * Math.abs(v.z) * 0.4; }
      else { p.x = Math.sign(p.x || 1) * (OUT_X + BALL_R); v.x = Math.sign(p.x) * Math.abs(v.x) * 0.4; }
    }
    // The floor.
    if (p.y < BALL_R) {
      p.y = BALL_R;
      if (v.y < 0) v.y = -v.y * 0.32;
      v.x *= 0.82; v.z *= 0.82;
      if (Math.abs(v.y) < 0.25) ball.rest += h;
    }
    if (ball.rest > 0.5 || ball.t > 4 || p.z < -4 || Math.abs(p.x) > 5) missed();
  }
  function missed() {
    ball.flying = false; ball.out = true;
    misses++;
    hint.textContent = MISSES[(misses - 1) % MISSES.length];
    hintBox.style.opacity = 1;
    wait(350).then(() => { if (!aborted) resetBall(); });
  }
  // Throws from wherever the paper is (at rest: START), ending any hold or drop. The dev tools' perfect throw from
  // rest is throwBall(0, 3.35, -3.35).
  function throwBall(vx, vy, vz) {
    if (ball.flying || ball.in || ball.out || done) return;
    if (grab.id !== null) { const id = grab.id; grab.id = null; try { canvas.releasePointerCapture(id); } catch (e) {} }
    ball.held = ball.drop = false; ball.t = ball.rest = ball.gone = 0;
    grab.pop = 1; ball.show = 1; paper.scale.setScalar(1); // a quick flick can cut the pick-up's squeeze (or the pop back in) short
    ball.v.set(vx, vy, vz);
    ball.flying = true;
    stage.classList.remove('held'); stage.classList.add('busy');
    sfx.play('throw', { gain: 0.55, rate: 1.2 });
    hintBox.style.opacity = 0;
  }

  // Screen <-> world. toScreen: client px; paperPx: the paper's radius on screen (px) at v.
  function toScreen(v) {
    const r = canvas.getBoundingClientRect();
    scr.copy(v).project(camera);
    return { x: r.left + ((scr.x + 1) / 2) * r.width, y: r.top + ((1 - scr.y) / 2) * r.height };
  }
  function paperPx(v) {
    const depth = Math.max(0.05, fromCam.subVectors(v, camera.position).dot(camera.getWorldDirection(look)));
    return (BALL_R * (canvas.getBoundingClientRect().height / 2)) / (depth * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  }
  // Where the held paper goes for a pointer at (cx, cy): the pointer plus the grab's offset, on the drag plane (it
  // faces the camera through the rest spot). Its centre is kept a little over a paper's radius from the screen's
  // edges, and under the bin's front rim: its top edge stays a few px below the rim's front edge on screen, so it
  // never looks as if it is over the opening (a soft ceiling: it slows into it over most of a radius rather than
  // stopping dead; the pointer itself can go on up for the flick, which reads the pointer). Then, in 3D, it stays
  // above the floor and well in front of the bin (a guard: on that plane the ceiling keeps it nearer still).
  function holdAt(cx, cy, out) {
    const r = canvas.getBoundingClientRect(), R = paperPx(START), m = 1.2 * R + 6;
    const x = THREE.MathUtils.clamp(cx + grab.ox, r.left + m, r.right - m);
    let y = Math.min(cy + grab.oy, r.bottom - m);
    const cap = Math.min(toScreen(RIM_FRONT).y + R + 4, toScreen(START).y), soft = 0.8 * R;
    if (y < cap + soft) y = cap + soft - soft * Math.tanh((cap + soft - y) / soft);
    ndc.set(((x - r.left) / r.width) * 2 - 1, 1 - ((y - r.top) / r.height) * 2);
    dragPlane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(look).negate(), START);
    ray.setFromCamera(ndc, camera);
    if (!ray.ray.intersectPlane(dragPlane, out)) out.copy(START);
    out.y = Math.max(BALL_R + 0.02, out.y); out.z = Math.max(1.2, out.z);
    return out;
  }

  // The release, read for intent. null: a put-down (it never moved, or was held still for a beat before letting go,
  // or the last move wasn't a flick). Otherwise { up, e, run }: the speed toward the bin on screen (screen heights per
  // second), the angle off that line (radians, + to the right) and the length of the last stroke toward it (screen
  // heights). The line toward the bin runs from the paper to the bin's mouth on screen but always leans up (at most
  // ~32° off vertical): flicking straight up from anywhere is never far off.
  function readFlick(endT) {
    const s = grab.samples, H = canvas.getBoundingClientRect().height || innerHeight;
    // the moment it arrived where it was let go: duplicates and the still beat after don't count (within 1.5 px of the
    // end, whatever the mouse's report rate: a 1000 Hz one moves well under a pixel between samples on a slow drag)
    const fin = s[s.length - 1];
    let k = s.length - 1;
    while (k > 0 && Math.hypot(s[k - 1].x - fin.x, s[k - 1].y - fin.y) < 1.5) k--;
    if (k === 0) { grab.read = { still: 'never moved' }; return null; }
    const still = endT - s[k].t;
    const a = toScreen(ball.p), m = toScreen(MOUTH);
    let ux = m.x - a.x, uy = Math.min(m.y - a.y, -0.3 * H, -1.6 * Math.abs(m.x - a.x));
    const ul = Math.hypot(ux, uy); ux /= ul; uy /= ul;
    const prog = (i) => s[i].x * ux + s[i].y * uy; // how far toward the bin (px)
    // the peak: the furthest toward the bin in the last 130 ms of motion (and the sample before them: a sparse mouse
    // may report only once in that time). What came after it is the settle back (a cheap sensor's jitter, the hand
    // easing off, a thumb rolling as it lifts); the flick is read into the peak.
    let pk = k;
    for (let i = k - 1; i >= 0 && s[k].t - s[i + 1].t <= 130; i--) if (prog(i) > prog(pk) + 1) pk = i;
    // the stroke into the peak: back while it keeps heading toward the bin (a wobble back of a few px is fine), as
    // far as the last pause (the move that came after the pause is its start); its length (run, screen heights), its
    // path and its time (a gap counting as at most 50 ms, as below)
    const wob = Math.max(6, 0.01 * H);
    let run = 0, path = 0, dur = 0;
    for (let i = pk, acc = 0, pl = 0, d = 0; i > 0 && s[pk].t - s[i - 1].t < 1200; i--) {
      acc += prog(i) - prog(i - 1);
      pl += Math.hypot(s[i].x - s[i - 1].x, s[i].y - s[i - 1].y);
      d += Math.min(50, Math.max(0, s[i].t - s[i - 1].t));
      if (acc < run * H - wob) break;
      if (acc / H > run) { run = acc / H; path = pl; dur = d; }
      if (s[i].t - s[i - 1].t > 160) break;
    }
    // the settle back is forgiven while it is small and quick: up to 5% of the screen, well short of the stroke before
    // it, over at most 150 ms (or two of a sparse mouse's reports). A flick up and a deliberate pull back down is no flick.
    const settle = prog(pk) - prog(k);
    const settled = settle <= Math.min(Math.max(24, 0.05 * H), 0.5 * run * H + 8) && (s[k].t - s[pk].t <= 150 || k - pk <= 2);
    // a velocity, recency weighted over the 200 ms up to sample `end`; a gap counts as at most 50 ms (after a gap, the
    // move came in its last moments: a mouse reports as soon as it moves)
    const vel = (end) => {
      let vx = 0, vy = 0, wt = 0;
      for (let i = end; i > 0 && s[end].t - s[i].t < 200; i--) {
        const dt = Math.min(50, Math.max(0, s[i].t - s[i - 1].t)), w = Math.exp((s[i].t - s[end].t) / 100);
        vx += w * (s[i].x - s[i - 1].x); vy += w * (s[i].y - s[i - 1].y); wt += w * dt;
      }
      wt = Math.max(wt, 8);
      return [vx / wt, vy / wt];
    };
    const [vx, vy] = vel(pk), toward = vx * ux + vy * uy;
    // the best ~60 ms burst toward the bin in the 250 ms into the peak: people slow down before they let go
    let burst = 0, bx = 0, by = 0;
    for (let i = pk; i > 0 && s[pk].t - s[i].t < 250; i--) {
      let j = i - 1;
      while (j > 0 && s[i].t - s[j].t < 60) j--;
      const dx = s[i].x - s[j].x, dy = s[i].y - s[j].y, b = (dx * ux + dy * uy) / Math.max(40, s[i].t - s[j].t);
      if (b > burst) { burst = b; bx = dx; by = dy; }
    }
    // its strength: the velocity into the peak, the burst, or the stroke's own average (a steady drag that eased off);
    // its direction: the velocity's, or the burst's when that is the stronger reading
    const avg = dur > 0 ? (run * H) / Math.max(40, dur) : 0;
    const up = (Math.max(toward, 0.8 * burst, 0.9 * avg) * 1000) / H;
    const [dx, dy] = 0.8 * burst > toward ? [bx, by] : [vx, vy];
    const e = Math.atan2(-dx * uy + dy * ux, dx * ux + dy * uy);
    // A clear stroke toward the bin (6% of the screen or more, fairly straight, within ~40° of the line) is a throw
    // however slowly it was made, a crawl included (it gets a gentle throw's strength at least), and the hand may stop
    // for up to 400 ms before letting go: careful hands stop, then let go. Anything else needs a move toward the bin of
    // 0.09 screens a second and 1.8% of the screen, let go within 160 ms of it.
    const clear = run >= 0.06 && run * H >= 0.7 * path && Math.abs(e) < 0.7;
    const flick = settled && run >= 0.018 && Math.abs(e) < 1.4 && (clear ? still <= 400 && up >= 0.04 : still <= 160 && up >= 0.09);
    // else a fling: hard, any way but down the screen, read at the release itself, over the path since the last pause
    // (at most 250 ms of it); its strength is its whole speed (it isn't toward the bin, but it is hard)
    let len = 0;
    for (let i = k; i > 0 && s[k].t - s[i].t < 250; i--) {
      len += Math.hypot(s[i].x - s[i - 1].x, s[i].y - s[i - 1].y) / H;
      if (s[i].t - s[i - 1].t > 160) break;
    }
    const [fx, fy] = vel(k), speed = Math.hypot(fx, fy), sps = (speed * 1000) / H; // screen heights per second
    const fling = !flick && still <= 160 && sps >= 1 && len >= 0.05 && fy < 0.25 * speed;
    const fe = Math.atan2(-fx * uy + fy * ux, fx * ux + fy * uy); // the fling's angle off the line to the bin
    grab.read = { up: +up.toFixed(3), e: +(fling ? fe : e).toFixed(3), run: +run.toFixed(4), settle: Math.round(settle), still: Math.round(still), clear, len: +len.toFixed(4), speed: +sps.toFixed(3), flick, fling }; // for ?debug
    if (flick) return { up: clear ? Math.max(up, 0.25) : up, e, run };
    if (!fling) return null;
    return { up: Math.max((Math.max(0, fx * ux + fy * uy) * 1000) / H, 0.8 * sps), e: fe, run };
  }

  // Aim assist, from the first throw. The flick says roughly where (e) and how hard (up); that raw throw's landing spot
  // is pulled toward the bin's mouth, then thrown as a lob from wherever the paper is (a harder flick, a higher lob).
  // Within ~60° of the line to the bin the direction gets almost all the help (the help fades out by ~80°: a flick
  // 30-40° off vertical reads wider than it is, as the paper trails the pointer and the line runs from the paper); a
  // stroke of 4% of the screen or more gets almost all the help on strength. So a roughly upward flick of almost any
  // speed drops in, and a sideways fling (~90°) or a feeble twitch can still miss. Each miss adds a little more help
  // (on top of the drift toward the opening in physics()).
  function launch({ up, e, run }) {
    const p0 = ball.p, dx = MOUTH.x - p0.x, dz = MOUTH.z - p0.z, D = Math.hypot(dx, dz) || 1, hx = dx / D, hz = dz / D;
    const ss = THREE.MathUtils.smoothstep, more = Math.min(3, misses) * 0.02;
    const qDir = 1 - ss(Math.abs(e), 1.05, 1.4), qLen = ss(run, 0.01, 0.04);
    const aDir = Math.min(0.97, 0.92 * qDir + more), aStr = Math.min(0.97, 0.92 * qLen * (0.3 + 0.7 * qDir) + more);
    const yaw = THREE.MathUtils.clamp(e * 0.75 * (1 - aDir), -1.6, 1.6); // + to the right, as seen from the camera
    const r = Math.pow(THREE.MathUtils.clamp(Math.sqrt(up / 1.1), 0.12, 2.4), 1 - aStr); // range, 1 = the mouth
    const lx = p0.x + D * r * (hx * Math.cos(yaw) - hz * Math.sin(yaw)), lz = p0.z + D * r * (hz * Math.cos(yaw) + hx * Math.sin(yaw));
    // the lob's top: higher for a harder flick, lower for a weak one, and lower from up high; then lowered (in 4 cm
    // steps, down to 12 cm over the mouth) until the whole arc stays on screen, the paper's centre at least 1.5 of its
    // radii under the screen's top edge
    const lift = (0.42 + 0.3 * ss(up, 0.4, 3)) * Math.min(1, 0.35 + 0.65 * r) - 0.6 * Math.max(0, p0.y - START.y);
    const low = Math.max(p0.y, MOUTH.y) + 0.12;
    let top = Math.max(low, Math.max(p0.y, MOUTH.y) + lift);
    const flight = (top) => { const vy = Math.sqrt(2 * G * (top - p0.y)); return [vy, vy / G + Math.sqrt((2 * (top - MOUTH.y)) / G)]; };
    const sky = canvas.getBoundingClientRect().top;
    for (let n = 0; n < 20 && top > low; n++) {
      const [vy, T] = flight(top);
      let peak = Infinity;
      for (let i = 1; i <= 12; i++) {
        const t = (T * i) / 12;
        arc.set(p0.x + ((lx - p0.x) * t) / T, p0.y + vy * t - (G * t * t) / 2, p0.z + ((lz - p0.z) * t) / T);
        peak = Math.min(peak, toScreen(arc).y - 1.5 * paperPx(arc));
      }
      if (peak >= sky) break;
      top = Math.max(low, top - 0.04);
    }
    const [vy, T] = flight(top);
    return [(lx - p0.x) / T, vy, (lz - p0.z) / T];
  }

  // Pick it up: pressed on the paper, it stays where it was gripped; pressed anywhere else, it comes to the pointer.
  // Caught while it drops, it keeps its motion and the spring takes over.
  function pickUp(e) {
    grab.id = e.pointerId;
    grab.samples = [{ x: e.clientX, y: e.clientY, t: e.timeStamp }];
    if (!ball.drop) ball.hv.set(0, 0, 0);
    ball.p.copy(paper.position); // where it is drawn, bob and all: nothing jumps
    ball.held = true; ball.drop = false; ball.t = ball.rest = 0;
    const q = toScreen(ball.p);
    grab.ox = q.x - e.clientX; grab.oy = q.y - e.clientY;
    if (Math.hypot(grab.ox, grab.oy) > 1.6 * paperPx(ball.p)) grab.ox = grab.oy = 0;
    holdAt(e.clientX, e.clientY, grab.to);
    grab.pop = 0;
    stage.classList.add('held');
    hintBox.style.opacity = 0;
    sfx.any(CRINKLES, { gain: 0.3, rate: 1.15 });
  }
  function letGo(e, canThrow) {
    if (grab.id === null || e.pointerId !== grab.id) return;
    grab.id = null; ball.held = false;
    stage.classList.remove('held');
    const last = grab.samples[grab.samples.length - 1];
    if (canThrow && (e.clientX !== last.x || e.clientY !== last.y)) grab.samples.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
    const f = canThrow ? readFlick(e.timeStamp) : null;
    if (f) { throwBall(...launch(f)); return; }
    // no flick: it drops, with a little of the hand's motion (a paper still racing to the pointer doesn't shoot off).
    // Not a miss, just a nudge.
    ball.hv.clampLength(0, 1.2);
    ball.drop = true; ball.t = ball.rest = 0;
    hint.textContent = 'Flick it up. Let go.';
    hintBox.style.opacity = 1;
  }
  canvas.addEventListener('pointerdown', (e) => {
    audio();
    if (grab.id !== null || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
    if (ball.flying || ball.in || ball.out || done) return;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {} // drags that leave the canvas still count
    pickUp(e);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerId !== grab.id) return;
    // every sample the browser merged into this event, for the flick (a fast mouse sends more than one per frame)
    const evs = e.getCoalescedEvents?.() ?? [];
    for (const c of evs.length ? evs : [e]) grab.samples.push({ x: c.clientX, y: c.clientY, t: c.timeStamp || e.timeStamp });
    // the last 1.5 s (a slow, careful stroke can take a second; a 1000 Hz mouse sends ~1500 samples in that time, and
    // the count cap is only a guard)
    const s = grab.samples;
    let cut = 0;
    while (s.length - cut > 2000 || (s.length - cut > 2 && s[s.length - 1].t - s[cut].t > 1500)) cut++;
    if (cut) s.splice(0, cut);
    holdAt(e.clientX, e.clientY, grab.to);
  });
  canvas.addEventListener('pointerup', (e) => letGo(e, true));
  canvas.addEventListener('pointercancel', (e) => letGo(e, false));
  canvas.addEventListener('lostpointercapture', (e) => letGo(e, false));
  // Enter / Space: the perfect throw (from rest exactly the dev tools' one; from anywhere else the ideal lob)
  const onKey = (e) => {
    if ((e.key !== 'Enter' && e.key !== ' ') || document.activeElement === skipBtn) return;
    e.preventDefault(); audio();
    if (!ball.held && !ball.drop && ball.p.equals(START)) throwBall(0, 3.35, -3.35);
    else throwBall(...launch({ up: 1.1, e: 0, run: 1 }));
  };
  window.addEventListener('keydown', onKey);

  // --- the show
  async function scored() {
    if (done) return;
    done = true;
    await wait(140); if (aborted) return;
    // The owner's tongue squeezes out of the gap AFTER the lid slams, the lid riding on it ('gap' staging); the
    // low-poly fallback still licks with the lid open, before the slam.
    const t = tongue ?? await Promise.race([tongueP, new Promise((r) => setTimeout(() => r(null), 1500))]);
    const gap = !!t && 'lidPitch' in t;
    if (t && !gap && !aborted) await t.lick({ spread: Math.min(1, 0.55 + 0.45 * camera.aspect) });
    if (aborted) return;
    // The lid slams.
    const from = pitch.rotation.x;
    await tween(180, (t) => { pitch.rotation.x = from + (0 - from) * t; }, easeIn); if (aborted) return;
    sfx.play('lid-slam'); shake = 0.06;
    monster.position.y = 0; monster.visible = true; // under the shut lid now, its head just below the rim
    if (gap) {
      // The camera cranes up over the bin for the tongue (from the throw camera the lid's top is a sliver): one gentle
      // move, eased in and out (a sine: no lurch), starting as the slammed lid settles, so it is well up as the tongue
      // lands on the top and settled (32 degrees down) just past the swoop's middle; it holds while the tongue is
      // slurped in, and the pan to the front starts from there the moment the lid has slammed.
      phase = 'lick';
      const c0 = { pos: cam.pos.clone(), target: cam.target.clone(), fov: cam.fov };
      tween(1000, (k) => {
        if (phase !== 'lick') return;
        const b = view.lick();
        cam.pos.lerpVectors(c0.pos, b.pos, k); cam.target.lerpVectors(c0.target, b.target, k); cam.fov = c0.fov + (b.fov - c0.fov) * k;
      }, (t) => (1 - Math.cos(Math.PI * t)) / 2);
    }
    await tween(120, (t) => { pitch.rotation.x = -0.07 * Math.sin(Math.PI * t); });
    await tween(90, (t) => { pitch.rotation.x = -0.022 * Math.sin(Math.PI * t); }); if (aborted) return;
    pitch.rotation.x = 0;
    if (gap) {
      await wait(60); if (aborted) return;
      // One slurp (~1.2 s): the tongue pops out of the gap at the front's right part, lands on the top and swoops
      // across it in one stroke, its base gliding along the front to its left part (faster and faster to the middle,
      // slower and slower after it), the lid riding up on it, and is slurped back in; the lid slams. lid(p) lifts the
      // front;
      // roll(r) tips the lid toward the tongue's side (r > 0: the right side up, pivoting on the left edge; r < 0: the
      // left side up, pivoting on the right edge). The last roll(0) leaves the pivot on the left, where the monster's
      // tipped-lid pose expects it.
      await t.lick({
        lid: (p) => { pitch.rotation.x = p; },
        roll: (r) => { const px = r < 0 ? 0.51 : -0.51; roll.position.x = px; lidMesh.position.x = -px; roll.rotation.z = r; },
      });
      pitch.rotation.x = 0; roll.rotation.z = 0; roll.position.x = -0.51; lidMesh.position.x = 0.51;
      if (aborted) return;
    }
    // The owner wants this stretch quick, with no real pauses: every beat starts as the last one ends.
    // Round to the front.
    phase = 'pan';
    const a = { pos: cam.pos.clone(), target: cam.target.clone(), fov: cam.fov };
    await tween(750, (t) => {
      const b = view.front();
      cam.pos.lerpVectors(a.pos, b.pos, t); cam.target.lerpVectors(a.target, b.target, t); cam.fov = a.fov + (b.fov - a.fov) * t;
    }, easeInOut); if (aborted) return;
    phase = 'front';
    // No shaking (the owner cut it): it growls and rises straight away, lifting the lid on its head, tipped up on the
    // right like the logo; the eyes open in the dark.
    sfx.play('growl', { gain: 0.9, delay: 0.1, vary: 0.02 });
    // SBHMN slams into the bin, letter by letter, from the camera's side, while the teeth are coming down.
    let lettersP = null;
    const slamLetters = async () => {
      for (let k = 0; k < letters.length; k++) { slam(letters[k]); await wait(k === letters.length - 1 ? 260 : 165); if (aborted) return; }
    };
    await tween(1250, (t, raw) => {
      if (!lettersP && raw >= 0.4) lettersP = slamLetters();
      const e = easeOut(t);
      monster.position.y = 0.095 * e + Math.sin(raw * 40) * 0.002 * (1 - raw);
      monster.rotation.z = 0.05 * e;
      pitch.rotation.x = lift(monster.position.y);
      roll.rotation.z = 0.075 * e;
      const o = THREE.MathUtils.clamp((raw - 0.35) / 0.3, 0, 1);
      eyeL.scale.y = eyeR.scale.y = easeOut(o); glow.material.opacity = o * 0.4;
      // the teeth drop as the mouth opens
      const f = THREE.MathUtils.clamp((raw - 0.45) / 0.3, 0, 1);
      for (const fang of fangs) { fang.visible = f > 0; fang.scale.y = Math.max(0.001, backOut(f)); }
    }); if (aborted) return;
    await tween(170, (t) => { eyeL.scale.y = eyeR.scale.y = 1 - 0.92 * Math.sin(Math.PI * t); }); if (aborted) return;
    await (lettersP ?? slamLetters()); if (aborted) return;
    await wait(220); if (aborted) return;
    await spit();
  }

  // One letter: from near the camera, spinning, it accelerates into the bin's face; on impact it squashes, the bin
  // jolts back, chips fly, the camera shakes and the thing inside flinches.
  async function slam(m) {
    const home = m.userData.home;
    const from = camera.position.clone().lerp(home, 0.2).add(new THREE.Vector3((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.3, 0));
    const spin = new THREE.Euler((Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 2.2, (Math.random() - 0.5) * 1.2);
    m.visible = true;
    await tween(230, (t) => {
      m.position.lerpVectors(from, home, t);
      m.rotation.set(LEAN + spin.x * (1 - t), spin.y * (1 - t), spin.z * (1 - t));
    }, easeIn);
    if (aborted) return;
    m.position.copy(home); m.rotation.set(LEAN, 0, 0);
    // a bang on the bin for each letter, each its own: a pitch of its own, from where it hits
    const k = Math.max(0, letters.indexOf(m));
    sfx.play('letter-bang', { gain: 0.95, rate: [1, 0.9, 1.1, 0.94, 1.05][k % 5], pan: THREE.MathUtils.clamp(home.x * 1.4, -0.7, 0.7), vary: 0.015 });
    shake = Math.max(shake, 0.02);
    burst(new THREE.Vector3(home.x, home.y, home.z + 0.03), 5);
    tween(150, (t) => { const k = Math.sin(Math.PI * t); m.scale.set(1 + 0.08 * k, 1 + 0.08 * k, 1 - 0.5 * k); bin.position.z = -0.022 * k; });
    tween(140, (t) => { eyeL.scale.y = eyeR.scale.y = 1 - 0.65 * Math.sin(Math.PI * t); });
  }

  // The finale: the thing rears up and spits the paper back at you. Spit hits the screen and runs down the glass while
  // the paper flies at the camera as a ball in stop motion (assets/intro/paper.js: the crumpled homepage, baked in
  // Blender), smashes onto the screen and unfolds there, flap after flap, exactly where the live page sits. That sheet
  // is the page: the page goes in under it and the sheet fades off it.
  async function spit() {
    const m0 = monster.position.y;
    await tween(240, (t) => {
      const e = easeOut(t);
      monster.position.y = m0 + 0.06 * e;
      pitch.rotation.x = lift(monster.position.y) - 0.16 * e;
      eyeL.scale.y = eyeR.scale.y = 1 - 0.55 * e;
    }); if (aborted) return;
    sfx.any(['spit1', 'spit2']);
    const mouth = bin.localToWorld(new THREE.Vector3(0, 0.84, 0.42));
    const mp = mouth.clone().project(camera);
    const from = [((mp.x + 1) / 2) * innerWidth, ((1 - mp.y) / 2) * innerHeight];
    try {
      // (the goo itself comes when the paper smashes into the glass, below)
      drips = createDrips({ auto: false, seed: 5, onSplat: (x, y, s) => sfx.any(['splat1', 'splat2', 'splat3'], { gain: Math.min(0.7, 0.18 + s / 300), pan: (x / innerWidth) * 2 - 1 }) });
    } catch (e) { drips = null; }
    tween(300, (t) => { monster.position.y = m0 + 0.06 * (1 - t); pitch.rotation.x = lift(monster.position.y) - 0.16 * (1 - easeOut(t)); eyeL.scale.y = eyeR.scale.y = 0.45 + 0.55 * t; });
    const sp = sheet ?? await Promise.race([sheetP, new Promise((r) => setTimeout(() => r(null), 2500))]);
    if (aborted) return;
    if (sp) {
      await sp.spit({
        camera, from: mouth, sequence: 'full',
        // It smashes into the glass: goo splatters out from where it hit, thick saliva that drips (drips.goo; its splat
        // is the sound), and as it unfolds there, one rustle of paper drawn out (the owner's pick; no crinkle on every
        // stop-motion frame any more, and no thud: little sounds the owner didn't like)
        onFrame: ({ slap, at }) => {
          if (!slap) return;
          sfx.play('unfold', { gain: 0.9, vary: 0.02 }); shake = Math.max(shake, 0.012);
          if (at) drips?.goo(at.x, at.y, Math.max(at.size * 0.8, Math.min(innerWidth, innerHeight) * 0.42), { from });
        },
      });
      if (aborted) return;
      await wait(140); if (aborted) return;
    }
    // The hand-off. The page goes in under the paper at once, all of it (html.intro-handoff cuts its fade-in: the
    // opaque canvas hides it), its 3D drawn right now as the paper prints it (sbhmn:handoff: the home page's scenes
    // stepped to the print's moment, its clock in paper.json, and held there), and only then does the paper fade: the
    // only thing that fades, over that same picture. When it is gone the page comes alive (end(): sbhmn:reveal).
    // (The paper used to fade out while the page faded in, and two layers fading against each other let the white
    // behind them through: a third of the way to white at worst, ~0.2 s in. That was the flash. And the page's 3D,
    // already moving, ghosted through the still print, after a first frame that a slow GPU, compiling its shaders, may
    // take a while to draw: the fade now starts only once it has.)
    html.classList.add('intro-handoff');
    html.classList.remove('intro-on');
    stage.classList.add('leaving');
    document.dispatchEvent(new CustomEvent('sbhmn:handoff', { detail: { at: sp?.print?.clock ?? 0 } }));
    const fade = canvas.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 650, easing: 'ease-out', fill: 'forwards' });
    await fade.finished.catch(() => {});
    end();
  }



  // skipped: everything goes at once. Otherwise the spit on the glass keeps running down over the live page, then dries.
  function end(skipped = false) {
    aborted = true;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    window.removeEventListener('keydown', onKey);
    tweens.clear();
    try { tongue?.stop?.(); tongue?.dispose?.(); } catch (e) {}
    try { sheet?.dispose?.(); ballMade?.dispose?.(); } catch (e) {}
    stage.remove();
    scene.traverse((o) => { o.geometry?.dispose?.(); if (o.material) [].concat(o.material).forEach((m) => { m.map?.dispose?.(); m.dispose?.(); }); });
    renderer.dispose();
    const closeAudio = () => { try { ac?.close?.(); } catch (e) {} };
    if (drips && !skipped) {
      const d = drips; let lt = performance.now(), on = true;
      const run = (now) => { if (!on) return; d.update(Math.min(0.05, (now - lt) / 1000)); lt = now; requestAnimationFrame(run); };
      requestAnimationFrame(run);
      setTimeout(() => d.fadeOut(1400), 2600);
      d.done.then(() => { on = false; closeAudio(); });
    } else {
      drips?.dispose?.();
      closeAudio();
    }
    drips = null;
    markDone();
    reveal();
  }
  const skipBtn = stage.querySelector('.skip');
  skipBtn.addEventListener('click', () => end(true));
  if (location.search.includes('debug')) {
    // advance(s): run the scene s seconds at 60 fps right now (awaiting the show's steps between frames).
    const advance = async (s) => { for (let i = 0; i < s * 60 && !aborted; i++) { tick(1 / 60); await Promise.resolve(); } };
    // sfxLog: every sound played, [scene seconds, name], to check the timeline without ears
    const sfxLog = [], play0 = sfx.play.bind(sfx);
    sfx.play = (n, o) => { sfxLog.push([+(clock / 1000).toFixed(2), n]); return play0(n, o); };
    // paperAt(): where the paper is on screen (client px), for driving the throw with a real pointer; grab.read: how
    // the last release was read
    window.__intro = { ball, grab, pitch, roll, cam, monster, eyeL, eyeR, letters, fangs, throwBall, paperAt: () => toScreen(paper.position), advance, sfx, audio, sfxLog, get tongue() { return tongue; }, get sheet() { return sheet; }, get drips() { return drips; }, get misses() { return misses; }, get done() { return done; }, get clock() { return clock; } };
  }
}

// A crumpled paper ball: an icosphere with every corner pushed in or out.
function crumple() {
  let g = mergeVertices(new THREE.IcosahedronGeometry(BALL_R, 1));
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).multiplyScalar(0.74 + Math.random() * 0.46); p.setXYZ(i, v.x, v.y, v.z); }
  g = g.toNonIndexed();
  g.computeVertexNormals();
  return g;
}

// One angry low-poly eye (the logo's: pointed and high at the outer corner, sloping down to the nose), extruded.
function eyeGeometry(mirror) {
  const pts = [[-0.064, 0.017], [-0.022, 0.012], [0.026, 0.002], [0.064, -0.013], [0.034, -0.021], [-0.008, -0.023], [-0.046, -0.012]];
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(mirror ? -x : x, y)));
  return new THREE.ExtrudeGeometry(shape, { depth: 0.016, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.004, bevelSegments: 1, curveSegments: 1 });
}

// A soft round glow for behind the eyes.
function radialTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d');
  const gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
