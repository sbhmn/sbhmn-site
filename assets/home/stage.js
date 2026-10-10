// The home page's 3D: ONE WebGL canvas, fixed behind the page. It draws the background scene over the whole viewport,
// then every registered view (a DOM element with a scene) inside that element's box, so each game's 3D object sits in
// its place in the layout and scrolls with it. One context for everything (browsers allow only a few).
//
// Scene contract (assets/home/scenes/*.js): `export async function create(ctx)` returns
//   { scene, camera, resize(w, h), update(dt, t, input), dispose?() }
//   ctx:   { THREE, stage, reduced }            stage.on/emit is a tiny event bus between scenes (e.g. 'tug')
//   input: { x, y }        pointer in the view, -1..1 (y up), even when outside
//          { px, py }      pointer in the view, CSS px from its top-left
//          inside, hover   pointer over the view; hover eases 0..1
//          down, clicked   button held; a click landed in the view this frame
//          vw, vh, rect    the view's size and DOMRect in CSS px; visible: share of it on screen (0..1)
// A view's scene is drawn with a transparent background over the background scene (depth cleared, colour kept).
// A scene can be made again (rewind(), on the intro's replay): dispose() must undo everything create() did.
import * as THREE from 'three';

export function createStage({ canvas, debug = false } = {}) {
  const reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0xffffff, 1);
  renderer.autoClear = false;

  const listeners = new Map();
  const bus = {
    on(type, fn) { (listeners.get(type) ?? listeners.set(type, new Set()).get(type)).add(fn); return () => listeners.get(type)?.delete(fn); },
    emit(type, detail) { listeners.get(type)?.forEach((fn) => fn(detail)); },
  };

  const pointer = { x: -1e4, y: -1e4, down: false, clickAt: null, seen: false, touch: false };
  const onMove = (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.seen = true; pointer.touch = e.pointerType === 'touch'; };
  const onDown = (e) => { onMove(e); pointer.down = true; };
  const onUp = (e) => { onMove(e); pointer.down = false; pointer.clickAt = { x: e.clientX, y: e.clientY }; if (pointer.touch) setTimeout(() => { pointer.x = pointer.y = -1e4; }, 600); };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerdown', onDown, { passive: true });
  window.addEventListener('pointerup', onUp, { passive: true });

  let background = null;
  const views = [];
  const ctx = { THREE, stage: bus, reduced };
  const maker = (modOrCreate) => modOrCreate.create ?? modOrCreate;
  let retired = []; // scenes replaced by rewind(), disposed after the new ones' first frame (their shaders carry over)

  function inputFor(rect, state) {
    const px = pointer.x - rect.left, py = pointer.y - rect.top;
    const inside = px >= 0 && py >= 0 && px <= rect.width && py <= rect.height;
    state.hover += ((inside ? 1 : 0) - state.hover) * 0.12;
    const vis = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0)) / Math.max(1, rect.height);
    const clicked = !!(pointer.clickAt && pointer.clickAt.x >= rect.left && pointer.clickAt.x <= rect.right && pointer.clickAt.y >= rect.top && pointer.clickAt.y <= rect.bottom);
    return {
      x: (px / Math.max(1, rect.width)) * 2 - 1, y: -((py / Math.max(1, rect.height)) * 2 - 1), px, py,
      inside, hover: state.hover, down: pointer.down && inside, clicked, vw: rect.width, vh: rect.height, rect, visible: vis,
      seen: pointer.seen,
    };
  }

  let W = 0, H = 0;
  function fit() {
    const w = innerWidth, h = innerHeight;
    if (w === W && h === H) return;
    W = w; H = h;
    renderer.setSize(w, h, false);
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    background?.inst.resize(w, h);
  }

  let clock = 0, last = performance.now(), raf = 0, running = false, dirty = true;
  // One step of every scene, and (draw) the frame. A step without drawing moves the scenes just the same.
  function tick(dt, draw = true) {
    fit();
    clock += dt;
    if (draw) {
      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, W, H);
      renderer.clear(true, true, true);
    }
    if (background) {
      background.inst.update(dt, clock, inputFor({ left: 0, top: 0, right: W, bottom: H, width: W, height: H }, background.state));
      if (draw) renderer.render(background.inst.scene, background.inst.camera);
    }
    for (const v of views) {
      const r = v.el.getBoundingClientRect();
      if (r.bottom < -40 || r.top > H + 40 || r.width < 2 || r.height < 2) { v.offscreen = true; continue; }
      v.offscreen = false;
      if (r.width !== v.w || r.height !== v.h) { v.w = r.width; v.h = r.height; v.inst.resize(r.width, r.height); }
      v.inst.update(dt, clock, inputFor(r, v.state));
      if (!draw) continue;
      const x = Math.round(r.left), y = Math.round(H - r.bottom), w = Math.round(r.width), h = Math.round(r.height);
      renderer.setViewport(x, y, w, h);
      renderer.setScissor(x, y, w, h);
      renderer.setScissorTest(true);
      renderer.clearDepth();
      renderer.render(v.inst.scene, v.inst.camera);
    }
    renderer.setScissorTest(false);
    pointer.clickAt = null;
    if (draw && retired.length) { retired.forEach((i) => i.dispose?.()); retired = []; }
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    // (never below 0: a frame's timestamp is when the frame began, which can be before start() when start() ran late in
    // a busy frame; seen at load, the clock at -0.2 s: a step backwards for every scene)
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
    if (reduced) { if (!dirty) return; dirty = false; tick(0); return; }
    if (document.hidden) return;
    tick(dt);
  }
  const markDirty = () => { dirty = true; };
  window.addEventListener('scroll', markDirty, { passive: true });
  window.addEventListener('resize', markDirty);

  const stage = {
    THREE, renderer, reduced, on: bus.on, emit: bus.emit, pointer,
    /** The whole-viewport scene behind everything. */
    async setBackground(modOrCreate) {
      const make = maker(modOrCreate), inst = await make(ctx);
      background = { inst, make, state: { hover: 0 } };
      W = H = 0; dirty = true;
      return inst;
    },
    /** A scene drawn inside `el`'s box. */
    async addView(el, modOrCreate) {
      const make = maker(modOrCreate), inst = await make(ctx);
      views.push({ el, inst, make, state: { hover: 0 }, w: 0, h: 0, offscreen: true });
      dirty = true;
      return inst;
    },
    /** Back to the start while stopped: every scene made afresh and the clock at 0, as when the page loaded. The
        intro's replay does it: its paper is a print of the page's first moments (dev/paper-shots.cjs), and the page it
        hands over to must be that page again, not wherever the scenes had got to. */
    async rewind() {
      const bg = background, list = views.slice();
      const fresh = await Promise.all([bg?.make(ctx), ...list.map((v) => v.make(ctx))]);
      if (running) { fresh.forEach((i) => i?.dispose?.()); return; } // the page came back first: leave it be
      if (bg) { retired.push(bg.inst); bg.inst = fresh[0]; bg.state = { hover: 0 }; }
      list.forEach((v, k) => { retired.push(v.inst); v.inst = fresh[k + 1]; v.state = { hover: 0 }; v.w = v.h = 0; v.offscreen = true; });
      clock = 0; W = H = 0; dirty = true;
    },
    /** While stopped: step the scenes on to `at` seconds in, 1/60 s at a time (drawing only the last step, like
        advance(), so it is the same frame), with no pointer, and hold that frame until start(). The intro lays the page
        under its landed paper this way: the paper is a print of the page at that moment (dev/paper-shots.cjs), so the
        page under it is that print, still, while the paper fades off it; then it comes alive. */
    hold(at) {
      if (running) return;
      const n = Math.max(0, Math.round((at - clock) * 60));
      const was = { ...pointer };
      Object.assign(pointer, { x: -1e4, y: -1e4, down: false, clickAt: null, seen: false });
      for (let i = 0; i < n; i++) tick(1 / 60, i === n - 1);
      if (!n) tick(0);
      Object.assign(pointer, was, { clickAt: null });
    },
    start() { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); },
    stop() { running = false; cancelAnimationFrame(raf); },
    /** Debug: run the scenes `s` seconds at 60 fps now, then draw (deterministic screenshots). */
    advance(s) { const n = Math.round(s * 60); for (let i = 0; i < n; i++) tick(1 / 60); if (!n) tick(0); },
    get clock() { return clock; },
    dispose() {
      stage.stop();
      window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp); window.removeEventListener('scroll', markDirty); window.removeEventListener('resize', markDirty);
      [background?.inst, ...views.map((v) => v.inst)].forEach((i) => i?.dispose?.());
      renderer.dispose();
    },
  };
  if (debug) window.__stage = stage;
  return stage;
}
