// The sbhmn.com intro: throw the paper in the bin. The lid slams, the camera comes round to the front, something
// rattles inside, then a black thing rises and lifts the lid: red eyes, teeth. SBHMN slams into the bin letter by
// letter. It spits the paper back at you; the paper uncrumples, stop motion, into a flat sheet that fills the screen,
// and that sheet becomes the page. The bin is low poly, built from the logo's own proportions (assets/3d/bin.glb; 1 unit
// = 500 logo px, standing on y = 0, front facing +z); its letters and fangs are the logo's own outlines
// (assets/3d/bin-letters.json, tools/art/sbhmn-site-assets.mjs in the game repo).
import * as THREE from 'three';
import { GLTFLoader } from '/assets/vendor/three/addons/loaders/GLTFLoader.js';
import { mergeVertices } from '/assets/vendor/three/addons/utils/BufferGeometryUtils.js';
import { createPaper, createPaperBall } from '/assets/intro/paper.js';
import { createDrips } from '/assets/intro/drips.js';
import { createSfx } from '/assets/intro/sfx.js';

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
  html.classList.remove('intro-on', 'logo-flying');
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
  stage.innerHTML = `<div class="hint"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"><path d="M12 20V5M5 11l7-7 7 7"/></svg><span>Throw it in the bin</span></div><button class="skip" type="button">Skip</button>`;
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-label', 'A paper toss game: swipe up to throw the paper into the bin');
  stage.prepend(canvas);
  document.body.append(stage);
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
      new GLTFLoader().loadAsync('/assets/3d/bin.glb'),
      fetch('/assets/3d/bin-letters.json').then((r) => { if (!r.ok) throw new Error('letters'); return r.json(); }),
    ]);
  } catch (e) {
    stage.remove(); renderer.dispose(); markDone(); reveal(); return;
  }
  // The crumpled homepage you throw (small, needed now); the sheet it unfolds into and the tongue load meanwhile.
  const sfx = createSfx(); // real recorded sounds (CC0), fetched now, decoded on the first touch
  const ballP = createPaperBall().catch((e) => { console.warn('paper ball', e); return null; });
  let sheet = null, tongue = null, drips = null;
  const sheetP = createPaper().then((s) => { sheet = s; scene.add(s.object3d); return s; }).catch((e) => { console.warn('paper', e); return null; });

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
  const LICKS = ['lick1', 'lick2', 'lick3'], DRIPS = ['drip1', 'drip2', 'drip3'];
  const onCue = (name, info = {}) => {
    const s = info.strength ?? 1;
    if (name === 'pop') sfx.play('lid-clap', { gain: 0.35, rate: 1.15 });
    else if (name === 'squeeze') sfx.play('squeeze', { gain: 0.9 });
    else if (name === 'lick') sfx.any(LICKS, { gain: 0.55 + 0.45 * s });
    else if (name === 'flick') sfx.any(LICKS, { gain: 0.5, rate: 1.25 });
    else if (name === 'slap') { sfx.any(['splat1', 'splat2'], { gain: 0.2 + 0.7 * s }); shake = Math.max(shake, 0.03 * s); }
    else if (name === 'slurp') sfx.play('slurp', { gain: 0.9 });
    else if (name === 'clap') sfx.play('lid-clap', { gain: 0.4 + 0.6 * s });
    else if (name === 'rattle') sfx.play('lid-clap', { gain: 0.1 + 0.25 * s, rate: 1.2 });
    else if (name === 'splat') sfx.any(DRIPS, { gain: 0.25, vary: 0.15 });
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
  const view = {
    throw() {
      const fov = 40, aspect = camera.aspect, base = 3.9;
      const fit = 1.9 / (2 * base * Math.tan(THREE.MathUtils.degToRad(fov / 2)) * aspect);
      const d = base * Math.max(1, fit);
      return { pos: new THREE.Vector3(0, 0.5, 0).addScaledVector(new THREE.Vector3(0, 1.25, 3.7).normalize(), d), target: new THREE.Vector3(0, 0.5, 0), fov };
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
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    if (phase === 'throw') Object.assign(cam, view.throw());
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
  const ball = { p: START.clone(), v: new THREE.Vector3(), flying: false, in: false, rest: 0, t: 0 };
  let misses = 0, samples = [], dragging = false, done = false;
  function resetBall() {
    ball.p.copy(START); ball.v.set(0, 0, 0); ball.flying = false; ball.in = false; ball.rest = 0; ball.t = 0;
    paper.visible = true; paper.scale.setScalar(1);
  }
  resetBall();
  function step(dt, now) {
    stepChips(dt);
    if (!ball.flying) {
      if (!ball.in) { paper.position.copy(ball.p); paper.position.y += Math.sin(now / 420) * 0.012; paper.rotation.y += dt * 0.4; }
      return;
    }
    const n = 4, h = dt / n;
    for (let i = 0; i < n && ball.flying; i++) physics(h);
    paper.position.copy(ball.p);
    paper.rotation.x -= dt * ball.v.length() * 3.2;
    paper.rotation.z += dt * ball.v.x * 4;
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
    ball.flying = false;
    misses++;
    hint.textContent = MISSES[(misses - 1) % MISSES.length];
    hintBox.style.opacity = 1;
    wait(350).then(() => { if (!aborted) resetBall(); });
  }
  function throwBall(vx, vy, vz) {
    if (ball.flying || ball.in || done) return;
    ball.v.set(vx, vy, vz);
    ball.flying = true;
    sfx.play('throw', { gain: 0.55, rate: 1.2 });
    hintBox.style.opacity = 0;
  }
  canvas.addEventListener('pointerdown', (e) => {
    audio();
    if (ball.flying || done) return;
    dragging = true; samples = [{ x: e.clientX, y: e.clientY, t: e.timeStamp }];
    canvas.setPointerCapture?.(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    samples.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
    if (samples.length > 12) samples.shift();
  });
  const release = (e) => {
    if (!dragging) return;
    dragging = false;
    samples.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
    const end = samples[samples.length - 1];
    const first = samples.find((s) => end.t - s.t < 110) ?? samples[0];
    const ms = Math.max(16, end.t - first.t), H = window.innerHeight;
    const up = ((first.y - end.y) / ms) * 1000 / H; // screens per second, swiping up
    const side = ((end.x - first.x) / ms) * 1000 / H;
    if (up < 0.6) return;
    const vz = THREE.MathUtils.clamp(up * 1.0, 1.4, 6.5);
    throwBall(THREE.MathUtils.clamp(side * 0.55, -2.5, 2.5), vz * 1.0, -vz);
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', () => { dragging = false; });
  const onKey = (e) => { if ((e.key === 'Enter' || e.key === ' ') && document.activeElement !== skipBtn) { e.preventDefault(); audio(); throwBall(0, 3.35, -3.35); } };
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
    await tween(120, (t) => { pitch.rotation.x = -0.07 * Math.sin(Math.PI * t); });
    await tween(90, (t) => { pitch.rotation.x = -0.022 * Math.sin(Math.PI * t); }); if (aborted) return;
    pitch.rotation.x = 0;
    if (gap) {
      await wait(160); if (aborted) return;
      // lid(p) lifts the front; roll(r) tips it toward the tongue's side (r > 0: the right side up, pivoting on the
      // left edge; r < 0: the left side up, pivoting on the right edge). The last roll(0) leaves the pivot on the left,
      // where the monster's tipped-lid pose expects it.
      await t.lick({
        lid: (p) => { pitch.rotation.x = p; },
        roll: (r) => { const px = r < 0 ? 0.51 : -0.51; roll.position.x = px; lidMesh.position.x = -px; roll.rotation.z = r; },
      });
      pitch.rotation.x = 0; roll.rotation.z = 0; roll.position.x = -0.51; lidMesh.position.x = 0.51;
      if (aborted) return;
    }
    await wait(300); if (aborted) return;
    // Round to the front.
    phase = 'pan';
    const a = { pos: cam.pos.clone(), target: cam.target.clone(), fov: cam.fov };
    await tween(1300, (t) => {
      const b = view.front();
      cam.pos.lerpVectors(a.pos, b.pos, t); cam.target.lerpVectors(a.target, b.target, t); cam.fov = a.fov + (b.fov - a.fov) * t;
    }, easeInOut); if (aborted) return;
    phase = 'front';
    await wait(350); if (aborted) return;
    // Something inside loses it: one long fit that builds and goes crazy. The bin rocks from wheel to wheel, hops off
    // the ground, the lid clatters as the thing slams it from below; one last bang and it all drops still.
    await shakeFit(1800); if (aborted) return;
    await wait(500); if (aborted) return;
    // It rises, lifting the lid on its head, tipped up on the right like the logo; the eyes open in the dark.
    sfx.play('growl', { gain: 0.9, delay: 0.55, vary: 0.02 });
    // SBHMN slams into the bin, letter by letter, from the camera's side, while the teeth are coming down.
    let lettersP = null;
    const slamLetters = async () => {
      for (let k = 0; k < letters.length; k++) { slam(letters[k]); await wait(k === letters.length - 1 ? 260 : 165); if (aborted) return; }
    };
    await tween(1900, (t, raw) => {
      if (!lettersP && raw >= 0.5) lettersP = slamLetters();
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
    await wait(250);
    await tween(170, (t) => { eyeL.scale.y = eyeR.scale.y = 1 - 0.92 * Math.sin(Math.PI * t); }); if (aborted) return;
    await (lettersP ?? slamLetters()); if (aborted) return;
    await wait(650); if (aborted) return;
    await spit();
  }

  // The fit: an envelope that builds (0 -> 1 over ~70%), peaks, then a final slam at ~86% and a quick settle.
  // Rocking pivots on the wheel that stays down (the other side lifts), plus hops, a forward/back tilt, the lid
  // clattering on the monster's head, and thumps on a quickening beat.
  async function shakeFit(ms) {
    sfx.play('shake', { gain: 0.95, vary: 0.02 }); // the recording runs the whole fit; the final bang is its own
    let nextHit = 0, phase = 0, hop = 0, hopV = 0, prevRaw = 0, banged = false;
    const W = 0.47; // half the wheelbase: the pivot when one side lifts
    await tween(ms, (t, raw) => {
      const dtl = Math.max(0, raw - prevRaw) * ms / 1000; prevRaw = raw;
      const build = Math.min(1, raw / 0.6), env = raw < 0.86 ? 0.25 + 0.75 * build * build : Math.max(0, 1 - (raw - 0.86) / 0.14);
      // rocking: frequency rises from ~6 to ~13 Hz, amplitude follows the envelope, a little noise
      phase += dtl * Math.PI * 2 * (6 + 7 * build);
      const rock = Math.sin(phase) * 0.13 * env + (Math.random() - 0.5) * 0.02 * env;
      // hops: kicked from inside on each hit, gravity brings it down hard
      hopV -= 9.8 * dtl; hop = Math.max(0, hop + hopV * dtl); if (hop === 0 && hopV < 0) hopV = 0;
      bin.rotation.z = rock;
      bin.position.x = -Math.sign(rock) * W * (1 - Math.cos(rock)) + (Math.random() - 0.5) * 0.01 * env;
      bin.position.y = Math.abs(Math.sin(rock)) * W + hop;
      bin.rotation.x = Math.sin(phase * 0.47 + 1.3) * 0.05 * env;
      bin.rotation.y = Math.sin(phase * 0.71 + 0.4) * 0.07 * env + (Math.random() - 0.5) * 0.03 * env; // it twists on the spot
      bin.position.z = Math.max(0, Math.sin(phase * 0.33)) * 0.05 * env; // and lunges forward
      // the lid bangs on the thing's head
      const bang = Math.max(0, Math.sin(phase * 1.7)) * 0.07 * env + (raw > 0.5 && raw < 0.86 ? Math.random() * 0.03 : 0);
      monster.position.y = bang;
      pitch.rotation.x = lift(bang);
      shake = Math.max(shake, 0.026 * env);
      if (raw >= nextHit && raw < 0.86) {
        hopV = Math.max(hopV, (0.3 + 1.25 * build) * (Math.random() < 0.6 ? 1 : 0.45));
        nextHit = raw + (0.11 - 0.06 * build) + Math.random() * 0.03;
      }
      if (raw >= 0.86 && !banged) { banged = true; nextHit = 1; sfx.play('bang'); shake = 0.05; hopV = 0; }
    });
    bin.rotation.set(0, 0, 0); bin.position.set(0, 0, 0); monster.position.y = 0; pitch.rotation.x = 0;
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
    sfx.any(['thud1', 'thud2'], { gain: 0.9 }); shake = Math.max(shake, 0.02);
    burst(new THREE.Vector3(home.x, home.y, home.z + 0.03), 5);
    tween(150, (t) => { const k = Math.sin(Math.PI * t); m.scale.set(1 + 0.08 * k, 1 + 0.08 * k, 1 - 0.5 * k); bin.position.z = -0.022 * k; });
    tween(140, (t) => { eyeL.scale.y = eyeR.scale.y = 1 - 0.65 * Math.sin(Math.PI * t); });
  }

  // The finale: the thing rears up and spits the paper back at you. Spit hits the screen and runs down the glass while
  // the paper comes at the camera in stop motion (assets/intro/paper.js: the crumpled homepage, baked in Blender) and
  // unfolds flat onto the screen, exactly where the live page sits. That sheet is the page: the site fades in on it.
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
      drips = createDrips({ auto: false, seed: 5, onSplat: (x, y, s) => sfx.any(['splat1', 'splat2', 'splat3'], { gain: Math.min(0.7, 0.18 + s / 300), pan: (x / innerWidth) * 2 - 1 }) });
      drips.spray(10, undefined, { delay: 0.12, from });
    } catch (e) { drips = null; }
    tween(300, (t) => { monster.position.y = m0 + 0.06 * (1 - t); pitch.rotation.x = lift(monster.position.y) - 0.16 * (1 - easeOut(t)); eyeL.scale.y = eyeR.scale.y = 0.45 + 0.55 * t; });
    const sp = sheet ?? await Promise.race([sheetP, new Promise((r) => setTimeout(() => r(null), 2500))]);
    if (aborted) return;
    if (sp) {
      await sp.spit({
        camera, from: mouth, sequence: 'full',
        onFrame: ({ slap, landed }) => { if (slap) { sfx.play('thud2', { gain: 0.45, rate: 1.3 }); shake = Math.max(shake, 0.012); } else if (!landed) sfx.any(['crinkle1', 'crinkle2', 'crinkle3', 'crinkle4'], { gain: 0.6, vary: 0.12 }); },
      });
      if (aborted) return;
      await wait(140); if (aborted) return;
    }
    html.classList.remove('intro-on');
    announce('sbhmn:reveal');
    stage.classList.add('leaving');
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
    sfx.play = (n, o) => { sfxLog.push([+(clock / 1000).toFixed(2), n]); play0(n, o); };
    window.__intro = { ball, pitch, roll, cam, monster, eyeL, eyeR, letters, fangs, throwBall, advance, sfx, audio, sfxLog, get tongue() { return tongue; }, get sheet() { return sheet; }, get drips() { return drips; }, get misses() { return misses; }, get done() { return done; }, get clock() { return clock; } };
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
