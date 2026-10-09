// The sbhmn.com intro: throw the paper in the bin. The lid slams, the camera comes round to the front, something
// rattles inside, the lid creeps open on red eyes, SBHMN appears on the bin, and the bin becomes the 2D logo and flies
// into the header. The bin is low poly, built from the logo's own proportions (assets/3d/bin.glb; 1 unit = 500 logo
// px, standing on y = 0, front facing +z); its letters, fangs and eyes are cut from the logo (assets/3d/*.png).
import * as THREE from 'three';
import { GLTFLoader } from '/assets/vendor/three/addons/loaders/GLTFLoader.js';
import { mergeVertices } from '/assets/vendor/three/addons/utils/BufferGeometryUtils.js';

const html = document.documentElement;
const replayWrap = document.querySelector('.replay-wrap');
const brandImg = document.querySelector('header.site .brand img');

// The logo image's box in bin units (sbhmn-mark.svg viewBox 603 348 1862 1730, drawn at 3x the 1024 px logo).
const MARK = { left: -0.62, right: 0.6213, top: 1.076, bottom: -0.0773, aspect: 1862 / 1730 };
const DECAL = { y: 0.453, w: 0.956, h: 0.474 }; // assets/3d/logo.json
const EYES = { y: 0.818, w: 0.292, h: 0.076 };
const LID_OPEN = -1.9; // radians about the hinge: standing up behind the bin, a backboard
const RIM_Y = 0.78, OPEN_X = 0.439, OPEN_Z = 0.395, OUT_X = 0.554, OUT_Z = 0.5;
const BALL_R = 0.07, START = new THREE.Vector3(0, 0.9, 2.4), G = 9.8;

function markDone() { try { sessionStorage.setItem('sbhmn-intro', 'done'); } catch (e) {} }
function reveal() {
  html.classList.remove('intro-on', 'logo-flying');
  if (replayWrap) replayWrap.hidden = false;
}

if (html.classList.contains('intro-on')) start();
else reveal();
replayWrap?.querySelector('button')?.addEventListener('click', () => {
  window.scrollTo(0, 0);
  html.classList.add('intro-on');
  start();
});

async function start() {
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
  let gltf, decalTex, eyesTex;
  try {
    [gltf, decalTex, eyesTex] = await Promise.all([
      new GLTFLoader().loadAsync('/assets/3d/bin.glb'),
      loadTex('/assets/3d/bin-decal.png'),
      loadTex('/assets/3d/bin-eyes.png'),
    ]);
  } catch (e) {
    stage.remove(); renderer.dispose(); markDone(); reveal(); return;
  }

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

  const front = (y) => 0.39 + ((y - 0.216) / 0.48) * 0.04 + 0.012; // the body's front face leans out as it rises
  const decal = new THREE.Mesh(new THREE.PlaneGeometry(DECAL.w, DECAL.h),
    new THREE.MeshBasicMaterial({ map: decalTex, transparent: true, opacity: 0, depthWrite: false }));
  decal.position.set(0, DECAL.y, front(DECAL.y));
  decal.rotation.x = Math.atan(0.04 / 0.48);
  bin.add(decal);
  const eyes = new THREE.Mesh(new THREE.PlaneGeometry(EYES.w, EYES.h),
    new THREE.MeshBasicMaterial({ map: eyesTex, color: 0xff2414, transparent: true, opacity: 0, depthWrite: false }));
  eyes.position.set(0, EYES.y + 0.006, 0.37);
  bin.add(eyes);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.14), new THREE.MeshBasicMaterial({
    map: radialTexture(), color: 0x8a0a06, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  glow.position.set(0, EYES.y + 0.006, 0.35);
  bin.add(glow);

  // --- the paper
  const paper = new THREE.Mesh(crumple(), new THREE.MeshStandardMaterial({ color: 0xf3f1ec, roughness: 1, flatShading: true }));
  paper.castShadow = true;
  scene.add(paper);

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
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  // --- sound: a thud and a rattle, synthesized, only after the visitor's own swipe
  let ac = null;
  const audio = () => { try { ac ??= new (window.AudioContext || window.webkitAudioContext)(); ac.resume?.(); } catch (e) {} return ac; };
  function thump(gain = 0.45, freq = 68, dur = 0.3) {
    const a = ac; if (!a) return;
    const t = a.currentTime;
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(freq * 1.9, t); o.frequency.exponentialRampToValueAtTime(freq * 0.55, t + dur);
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur);
    const n = a.createBufferSource(), buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 4);
    n.buffer = buf;
    const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 520;
    const g2 = a.createGain(); g2.gain.value = gain * 0.7;
    n.connect(f).connect(g2).connect(a.destination); n.start(t);
  }

  // --- throwing
  const ball = { p: START.clone(), v: new THREE.Vector3(), flying: false, in: false, rest: 0, t: 0 };
  let misses = 0, samples = [], dragging = false, done = false;
  function resetBall() {
    ball.p.copy(START); ball.v.set(0, 0, 0); ball.flying = false; ball.in = false; ball.rest = 0; ball.t = 0;
    paper.visible = true; paper.scale.setScalar(1);
  }
  resetBall();
  function step(dt, now) {
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
        ball.in = true; v.x *= 0.3; v.z *= 0.3; scored(); return;
      }
      if (Math.abs(p.x) < OUT_X + BALL_R * 0.5 && Math.abs(p.z) < OUT_Z + BALL_R * 0.5) {
        // off the rim: up and away from the opening
        p.y = RIM_Y + BALL_R; v.y = Math.abs(v.y) * 0.45;
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
    const long = ball.p.z < -OUT_Z;
    const short = ball.p.z > OUT_Z && !long;
    hint.textContent = misses > 2 ? 'Nearly. Again' : long ? 'Too hard. Again' : short ? 'Harder. Again' : 'Missed. Again';
    hintBox.style.opacity = 1;
    wait(350).then(() => { if (!aborted) resetBall(); });
  }
  function throwBall(vx, vy, vz) {
    if (ball.flying || ball.in || done) return;
    ball.v.set(vx, vy, vz);
    ball.flying = true;
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
    await wait(260); if (aborted) return;
    // The lid slams.
    const from = pitch.rotation.x;
    await tween(180, (t) => { pitch.rotation.x = from + (0 - from) * t; }, easeIn); if (aborted) return;
    thump(0.5); shake = 0.06;
    await tween(120, (t) => { pitch.rotation.x = -0.07 * Math.sin(Math.PI * t); });
    await tween(90, (t) => { pitch.rotation.x = -0.022 * Math.sin(Math.PI * t); }); if (aborted) return;
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
    // Something inside.
    for (let k = 0; k < 3; k++) {
      const s = 1 + k * 0.35;
      thump(0.22 * s, 52, 0.18);
      await tween(240 + k * 60, (t) => {
        const f = Math.sin(Math.PI * t) * s;
        bin.rotation.z = Math.sin(t * 46) * 0.022 * f;
        bin.position.x = Math.sin(t * 61) * 0.012 * f;
        pitch.rotation.x = -Math.abs(Math.sin(t * 23)) * 0.035 * f;
      });
      bin.rotation.z = 0; bin.position.x = 0; pitch.rotation.x = 0;
      if (aborted) return;
      await wait(260 - k * 50); if (aborted) return;
    }
    await wait(450); if (aborted) return;
    // The lid creeps open: the eyes.
    await tween(1900, (t, raw) => {
      const e = easeOut(t);
      pitch.rotation.x = -0.1 * e - Math.sin(raw * 40) * 0.003 * (1 - raw);
      roll.rotation.z = 0.075 * e;
      const o = THREE.MathUtils.clamp((raw - 0.3) / 0.35, 0, 1);
      eyes.material.opacity = o; glow.material.opacity = o * 0.55;
    }); if (aborted) return;
    await wait(250);
    await tween(170, (t) => { eyes.scale.y = 1 - 0.9 * Math.sin(Math.PI * t); }); if (aborted) return;
    await wait(300); if (aborted) return;
    // SBHMN on the bin.
    const flicker = [1, 0, 0.9, 0.15, 1, 0.5, 1];
    for (const o of flicker) { decal.material.opacity = o; await wait(70); if (aborted) return; }
    await wait(900); if (aborted) return;
    await toLogo();
  }

  // The 3D bin becomes the 2D logo (same box, crossfaded), which then flies to the header.
  // Where the logo image sits on screen when it covers the bin: its box at the bin's front, through the camera.
  function markRect() {
    const r = canvas.getBoundingClientRect();
    const sc = (x, y, z) => { const p = new THREE.Vector3(x, y, z).project(camera); return { x: r.left + ((p.x + 1) / 2) * r.width, y: r.top + ((1 - p.y) / 2) * r.height }; };
    const zf = 0.45;
    return [sc(MARK.left, MARK.top, zf), sc(MARK.right, MARK.bottom, zf)];
  }
  async function toLogo() {
    const [a, b] = markRect();
    const w0 = b.x - a.x;
    const img = new Image();
    img.src = '/assets/img/sbhmn-mark.svg';
    img.alt = '';
    img.className = 'flying-logo';
    img.style.width = `${w0}px`;
    img.style.height = `${w0 / MARK.aspect}px`;
    img.style.transform = `translate(${a.x}px, ${a.y}px)`;
    img.style.opacity = '0';
    document.body.append(img);
    await img.decode().catch(() => {});
    if (aborted) { img.remove(); return; }
    // crossfade
    const fadeIn = img.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 380, fill: 'forwards' });
    canvas.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, fill: 'forwards' });
    await fadeIn.finished.catch(() => {});
    img.style.opacity = '1';
    if (aborted) { img.remove(); return; }
    await new Promise((res) => setTimeout(res, 120));
    // fly
    html.classList.add('logo-flying');
    html.classList.remove('intro-on');
    stage.classList.add('leaving');
    const t = brandImg.getBoundingClientRect();
    const fly = img.animate([
      { transform: `translate(${a.x}px, ${a.y}px) scale(1)` },
      { transform: `translate(${t.left}px, ${t.top}px) scale(${t.width / w0})` },
    ], { duration: 900, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' });
    await fly.finished.catch(() => {});
    html.classList.remove('logo-flying');
    img.remove();
    end();
  }

  function end() {
    aborted = true;
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    window.removeEventListener('keydown', onKey);
    tweens.clear();
    stage.remove();
    scene.traverse((o) => { o.geometry?.dispose?.(); if (o.material) [].concat(o.material).forEach((m) => { m.map?.dispose?.(); m.dispose?.(); }); });
    renderer.dispose();
    ac?.close?.();
    markDone();
    reveal();
  }
  const skipBtn = stage.querySelector('.skip');
  skipBtn.addEventListener('click', () => { document.querySelectorAll('.flying-logo').forEach((n) => n.remove()); end(); });
  if (location.search.includes('debug')) {
    // advance(s): run the scene s seconds at 60 fps right now (awaiting the show's steps between frames).
    const advance = async (s) => { for (let i = 0; i < s * 60 && !aborted; i++) { tick(1 / 60); await Promise.resolve(); } };
    // ghost(): the 2D logo at half opacity over the bin, to check they line up.
    const ghost = () => { const [a, b] = markRect(); const g = new Image(); g.src = '/assets/img/sbhmn-mark.svg'; Object.assign(g.style, { position: 'fixed', left: `${a.x}px`, top: `${a.y}px`, width: `${b.x - a.x}px`, opacity: 0.45, zIndex: 70, pointerEvents: 'none' }); document.body.append(g); return [a, b]; };
    window.__intro = { ball, pitch, roll, cam, eyes, decal, throwBall, advance, ghost, get misses() { return misses; }, get done() { return done; }, get clock() { return clock; } };
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
