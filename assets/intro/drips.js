// Spit on the screen. A mouthful of spit hitting the glass (spray): thick milky gobs with trapped bubbles, splash wedges
// that pull back in, flung droplets, a fine mist, and strings of spit between the gobs that break up into beads; the
// big gobs slide down in stick-slip (hold, let go, run, catch, hold), leaving faint wet trails that break up and dry,
// while the small drops stay put and dry out. Or a gob of goo (goo: what the intro uses, where the spat paper smashes
// into the glass): thick, cloudy saliva, lumpy, ropy and frothy, with strings that sag and slow drips that hang.
//
// An overlay on top of everything: its own WebGL2 canvas (position fixed, inset 0, z-index 60, pointer-events none,
// aria-hidden, DPR-aware, follows the window). Every drop is a few smooth bumps summed into a map of the water on the
// glass (heights, plus height-weighted drop size, centre, film and milkiness, so touching drops, tails and trails flow
// into each other with no seams). One pass then shades that water as a lens, only inside the wet area's bounding box:
//   - see-through (no source): the drop shows the world upside down, so its rim darkens on top (it looks at the
//     ground) and brightens below (it looks at the sky), and its lower half glows faintly; a milky body (spit, not
//     rain); a thin dark contact line with a bright line just inside it, strongest below; on the light's side a soft
//     dark crescent (the room reflected) holding a crisp two-pane window catchlight (flat, hard-edged: the site's low
//     poly look); small glints on the lumps; a faint offset shadow. It reads on white, over black (the bin, the
//     monster) and over the page.
//   - with a source picture: real refraction, a clean, minified, upside-down image of what's under each drop.
//   - trails are films: almost invisible, two faint edge lines and a hairline highlight, no refraction.
//   - micro-bubbles (froth) ride in the big gobs and pop; one small instanced pass on top.
//
//   import { createDrips } from '/assets/intro/drips.js';
//   const drips = createDrips({ auto: false, seed });   // appends its canvas to document.body; nothing shows until a splat
//   drips.spray(10, area, { from: [mouthX, mouthY] });  // a mouthful of spit (CSS px)
//   each frame of your loop: drips.update(dt);            // dt in seconds
//   await drips.fadeOut(1400);                            // everything dries up, then the overlay removes itself
//
// RECOMMENDED INTEGRATION (intro.js): auto: false, and call drips.update(dt) from the intro's own tick, so the spit
// steps with window.__intro.advance, pauses with the intro and stops on skip. On every exit path (reveal, skip, abort,
// error) call drips.fadeOut(ms) or drips.dispose(). Even if you forget, it cleans itself up: it dries out by itself
// maxLife seconds after the last splat, and it disposes itself as soon as nothing is left on the glass.
//
// UNITS: viewport CSS px, y down; seconds (fadeOut takes ms).
//
// opts (all optional)
//   seed        number   fixed randomness (default random). With auto: false, the same seed + the same update(dt)
//                        calls give the same pictures (screenshots).
//   auto        boolean  true (default): runs itself on requestAnimationFrame while anything is wet. false: nothing
//                        moves until you call update(dt) (recommended inside the intro, see above).
//   source      TexImageSource  a picture of what's under the overlay (img, canvas, ImageBitmap): drops then refract it
//                        (upside down, minified). It must match what's on screen at sourceRect, or the image in the drops
//                        is wrong (it is small and upside down, so a few px off doesn't show). Without it: see-through.
//   sourceRect  {x, y, w, h}  where that picture sits on screen, CSS px (default: the whole viewport)
//   liveSource  boolean  re-upload the source every frame. Desktop only: a texImage2D of a WebGL canvas each frame is a
//                        GPU copy that phones pay for; the source canvas also needs preserveDrawingBuffer: true, or
//                        update(dt) called right after its render. Prefer see-through, or refreshSource() now and then.
//   onSplat(x, y, size)  called as each splat lands (in sim time, so delays and update(dt) are respected): for a sound
//   maxLife     seconds  after this long since the last splat landed, everything dries by itself (fadeOut(1600)),
//                        default 14; 0 = never
//   reducedMotion boolean  default: the prefers-reduced-motion media query. Drops land without splash, wobble or
//                        flight, don't slide, and dry in 2.5-4 s.
//   maxDpr      default 1.5 on touch (coarse pointer) devices, 2 otherwise
//   zIndex 60, parent document.body
//   float       false forces the 8-bit water map (testing the fallback for GPUs without float render targets)
//
// methods
//   goo(x, y, size = 160, { delay = 0, dir, from })  a gob of goo (thick, cloudy saliva) at viewport CSS px: a heavy
//                        lumpy blob with ropy arms and froth, clumps round it joined by thick sagging strings that
//                        slowly bead up (2.5-7 s), and 3-5 drips creeping down from its lower edge, stretching into
//                        long necks with a fat drop at the end and hanging there (slower and slower: ~1.5-3 s to
//                        most of their length, 0.4-2.4 x the blob's radius). size = the blob's diameter. None of it
//                        slides off or dries: it stays until fadeOut (or maxLife).
//   splat(x, y, size = 64, { delay = 0, dir, from })  one splat at viewport CSS px. size = the diameter the blob
//                        settles to (~0.5 s; lumps +-10%; at impact it spreads ~15% past it, and droplets and mist land
//                        out to ~2-3 sizes away). dir = [dx, dy] the spit's travel on screen: the blob
//                        smears, wedges and droplets fly that way. from = [x, y] the screen point the spit comes from
//                        (e.g. the monster's mouth projected): dir becomes (x, y) - from. Default: away from the
//                        screen's centre.
//   spray(n = 10, area?, { delay = 0, from })  a mouthful: ~22% big gobs (they slide), ~38% mediums, the rest flecks,
//                        clustered around one spot of area = {x, y, w, h} (default {14% vw, 8% vh, 72% vw, 62% vh}),
//                        landing within ~90 ms, plus strings of spit between neighbouring gobs. Each splat smears away
//                        from `from` (default: the cluster's centre; pass the mouth's screen point). Sizes follow the
//                        viewport: resting diameters of big gobs ~6.5-9% of the screen's mean side ((w + h) / 2,
//                        weighted to the short side), mediums ~3-5%, flecks ~1-2%.
//   update(dt) (alias step)  advance dt seconds (fixed 1/60 substeps, dt capped at 0.1) and draw.
//   setSource(src | null, rect?), refreshSource()   swap / re-upload the refraction picture
//   fadeOut(ms = 1400) -> Promise   all the water dries (films first, small drops, big drops shrink last), then
//                        dispose(); calling it again returns the same promise
//   dispose()            stop, free the GL context, remove the canvas (also on webglcontextlost)
//   canvas, alive (live drops), done (a Promise resolved once disposed)
//
// TIMELINE of one splat: lands at once (or after delay): the blob hits at ~0.55 of its size, spreads to ~1.15 within
// 50 ms, then settles with a damped wobble (~0.4 s). Thin jets shoot out within 40 ms (their tips break off as
// droplets) and pull back in by ~0.45 s. Droplets and mist launch over 0-30 ms and fly 50-110 ms. Strings between gobs
// bead up and break in 0.2-0.5 s.
// Big drops (radius > 9 CSS px) hold until ~0.6-0.9 s, then slide in stick-slip: runs of 0.2-0.55 s at up to
// 48 + 4 * r px/s, holds of 0.1-0.5 s. Trails dry in ~1.2-2 s, small drops in ~1.5-5 s, bubbles pop over 1.5-6 s.
// Big drops keep sliding until they leave the bottom, maxLife, or fadeOut.
//
// COST: JS ~0.2-0.4 ms a frame for a 10-splat spray (~150-340 drops, up to ~1500 bumps). GPU: one instanced draw into
// two half-float maps (at most 1.5 texels per CSS px, capped at 1.4 Mpx) and one shading pass, both scissored to the
// wet area's bounding box (dry pixels leave after two fetches), plus one small instanced bubble draw. No
// post-processing. Measured with a GPU sync on a desktop GPU at 1280x800 DPR 2: ~0.5-0.8 ms median, p95 ~1.3-1.6 ms,
// ~0.2 ms of it the sync itself; not measured on a phone. If WebGL2 or the shaders fail, createDrips returns the same
// API doing nothing (fadeOut resolves at once). 8-bit fallback (no float render targets): same look, slightly coarser,
// refraction centres estimated from the slope.
//
// Lab: dev/lab-drips.html, screenshots: dev/drips-shot.cjs.

const MAX_BUMPS = 3200;
const MAX_BUBBLES = 320;
const T = 0.12;               // water thinner than this (CSS px) doesn't show: the drops' visible edge
const SLIDE_R = 9;            // drops bigger than this (radius, CSS px) slide
const LIGHT = [-0.54, -0.84]; // towards the light on screen (up and to the left), unit
const SO = [2.2, 3.4];        // the cast shadow's offset, CSS px
const TAU = Math.PI * 2;
const BF = 12;                // floats per bump: x y rx ry ang amp e size film milk, lens centre offset x y

export function createDrips(opts = {}) {
  const mq = (q) => { try { return !!(window.matchMedia && window.matchMedia(q).matches); } catch (e) { return false; } };
  const {
    seed = (Math.random() * 2 ** 31) | 0, auto = true, zIndex = 60, parent = document.body,
    maxDpr = mq('(pointer: coarse)') ? 1.5 : 2, onSplat = null, liveSource = false, float: wantFloat = true,
    maxLife = 14, reducedMotion = mq('(prefers-reduced-motion: reduce)'),
  } = opts;
  const rnd = mulberry32(seed);
  const U = (a, b) => a + (b - a) * rnd();

  const canvas = document.createElement('canvas');
  canvas.className = 'drips';
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed', left: '0', top: '0', width: '100%', height: '100%', zIndex: String(zIndex),
    pointerEvents: 'none', display: 'block',
  });
  parent.appendChild(canvas);
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
  if (!gl) { canvas.remove(); return inert(); }

  // ---------------------------------------------------------------------------------------------------------------
  // GL. The water map: float: two RGBA16F targets, m0 = (height, its gradient x/y, sum of height * size), m1 = (sum
  // of height * offset to the bump's centre x/y, height * film, height * milk); every channel adds up. 8-bit fallback:
  // one RGBA8, rgb = (height, height * film, height * milk) / 32 added, a = size / 96 (max).
  const useFloat = wantFloat && !!(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'));
  let bumpProg, shade, bubProg;
  try {
    bumpProg = program(BUMP_VS, bumpFS(useFloat));
    shade = program(SHADE_VS, shadeFS(useFloat));
    bubProg = program(BUB_VS, BUB_FS);
  } catch (e) { console.warn(e); canvas.remove(); return inert(); }
  const U1 = uniforms(bumpProg, ['u_css']);
  const U2 = uniforms(shade, ['u_m0', 'u_m1', 'u_src', 'u_res', 'u_css', 'u_texel', 'u_hasSrc', 'u_srcRect', 'u_opacity']);
  const U3 = uniforms(bubProg, ['u_css', 'u_px', 'u_opacity']);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  function instVao(prog, attrs, stride, buf) {
    const v = gl.createVertexArray();
    gl.bindVertexArray(v);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    const ac = gl.getAttribLocation(prog, 'a_corner');
    gl.enableVertexAttribArray(ac);
    gl.vertexAttribPointer(ac, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    let off = 0;
    for (const [name, size] of attrs) {
      const loc = gl.getAttribLocation(prog, name);
      if (loc >= 0) {
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, stride * 4, off * 4);
        gl.vertexAttribDivisor(loc, 1);
      }
      off += size;
    }
    gl.bindVertexArray(null);
    return v;
  }
  const inst = new Float32Array(MAX_BUMPS * BF);
  const ibuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, ibuf);
  gl.bufferData(gl.ARRAY_BUFFER, inst.byteLength, gl.DYNAMIC_DRAW);
  const vao = instVao(bumpProg, [['a_c', 2], ['a_r', 2], ['a_ang', 1], ['a_amp', 1], ['a_e', 1], ['a_size', 1], ['a_film', 1], ['a_milk', 1], ['a_lc', 2]], BF, ibuf);
  const binst = new Float32Array(MAX_BUBBLES * 4);
  const bbuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bbuf);
  gl.bufferData(gl.ARRAY_BUFFER, binst.byteLength, gl.DYNAMIC_DRAW);
  const bvao = instVao(bubProg, [['a_b', 4]], 4, bbuf);
  const emptyVao = gl.createVertexArray();

  const maps = [gl.createTexture(), useFloat ? gl.createTexture() : null].filter(Boolean);
  const fbo = gl.createFramebuffer();
  let mapW = 0, mapH = 0, cssW = 0, cssH = 0, devW = 0, devH = 0;
  function resize() {
    if (disposed) return;
    const w = Math.max(1, window.innerWidth), h = Math.max(1, window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const dw = Math.round(w * dpr), dh = Math.round(h * dpr);
    if (dw === devW && dh === devH && w === cssW && h === cssH) return;
    cssW = w; cssH = h; devW = dw; devH = dh;
    canvas.width = dw; canvas.height = dh;
    // the map is smooth, so it needn't be at device resolution: up to 1.5 texels per CSS px, at most 1.4 Mpx
    const sc = Math.min(Math.min(dpr, 1.5), Math.sqrt(1.4e6 / (w * h)));
    mapW = Math.max(1, Math.round(w * sc)); mapH = Math.max(1, Math.round(h * sc));
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    maps.forEach((t, i) => {
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (useFloat) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, mapW, mapH, 0, gl.RGBA, gl.HALF_FLOAT, null);
      else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, mapW, mapH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0);
    });
    gl.drawBuffers(maps.map((_, i) => gl.COLOR_ATTACHMENT0 + i));
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  // the refraction picture
  let src = opts.source || null, srcRect = opts.sourceRect || null, srcTex = null, srcReady = false, srcDirty = !!src;
  function uploadSource() {
    srcDirty = false;
    if (!src) { srcReady = false; return; }
    if (typeof HTMLImageElement !== 'undefined' && src instanceof HTMLImageElement && !(src.complete && src.naturalWidth)) {
      src.addEventListener('load', () => { srcDirty = true; }, { once: true });
      return;
    }
    if (!srcTex) srcTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, srcTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      // a still picture gets mipmaps: the drops show it minified, and they keep the text from sparkling
      if (!liveSource) gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, liveSource ? gl.LINEAR : gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      srcReady = true;
    } catch (e) { srcReady = false; }
  }

  // ---------------------------------------------------------------------------------------------------------------
  // The water. All in viewport CSS px, y down, seconds.
  const drops = [];    // blobs, satellites, mist, beads
  const trail = [];    // the film a sliding drop leaves behind: points that thin out and break up as they dry
  const strands = [];  // strings of spit between gobs: they bead up and break
  const gdrips = [];   // goo's drips: necks stretching down from a gob, a fat drop at the end
  let nb = 0, nbub = 0, bx0 = 0, by0 = 0, bx1 = 0, by1 = 0;
  let fade = null;     // { t, dur, resolve, promise }
  let opacity = 1, disposed = false, raf = 0, last = 0, simT = 0, lastLand = -1, splats = 0;
  let doneResolve;
  const done = new Promise((r) => { doneResolve = r; });

  // One bump of water: visible radii (rx, ry), height A (CSS px) times wet (drying thins it, so its edge recedes),
  // profile exponent e, the radius of the drop it belongs to, and whether it is a film (a trail) and how milky.
  // The lens centre: every bump of one drop (lobes, jets, tail) refracts around the drop's own centre, so a lumpy gob
  // is one clean lens, not a cluster of little ones. NaN: the bump's own centre.
  let lcx = NaN, lcy = NaN;
  function bump(x, y, rx, ry, ang, A, wet, e, size, film = 0, milk = 0, widen = true) {
    if (nb >= MAX_BUMPS || !(A > 0) || wet <= 0 || rx < 0.25 || ry < 0.25) return;
    // the profile A (1 - q^2)^e crosses T a little inside q = 1: widen it so the edge lands on the radius asked for
    if (widen) { const k = 1 / Math.sqrt(Math.max(0.12, 1 - Math.pow(Math.min(0.99, T / A), 1 / e))); rx *= k; ry *= k; }
    const o = nb++ * BF;
    inst[o] = x; inst[o + 1] = y; inst[o + 2] = rx; inst[o + 3] = ry; inst[o + 4] = ang;
    inst[o + 5] = A * wet; inst[o + 6] = e; inst[o + 7] = size; inst[o + 8] = film; inst[o + 9] = milk;
    inst[o + 10] = lcx === lcx ? lcx - x : 0; inst[o + 11] = lcx === lcx ? lcy - y : 0;
    const R = Math.max(rx, ry);
    if (x - R < bx0) bx0 = x - R;
    if (y - R < by0) by0 = y - R;
    if (x + R > bx1) bx1 = x + R;
    if (y + R > by1) by1 = y + R;
  }
  function bubble(x, y, r, a) {
    if (nbub >= MAX_BUBBLES || a <= 0.01 || r < 0.35) return;
    const o = nbub++ * 4;
    binst[o] = x; binst[o + 1] = y; binst[o + 2] = r; binst[o + 3] = Math.min(1, a);
  }

  // A drop: one main bump (+ lobes, wedges and bubbles for a splat's blob, + a tail when it has been sliding), a wobble
  // spring, and its own little life: fly in (satellites, mist), land, maybe slide, maybe dry.
  function makeDrop(x, y, r, kind, extra = {}) {
    const d = {
      kind, x, y, r, a: 0.34, age: 0, delay: 0, dead: false, milk: 0.35,
      w: 0, wv: 0, wAng: 0,            // the wobble: stretch along wAng, a damped spring
      fly: null,                       // { x0, y0, dur }: flying in from (x0, y0) for dur seconds
      lobes: null, fingers: null, bubbles: null,
      slide: !reducedMotion && r >= SLIDE_R && kind !== 'mist',
      state: 'hold', hold: 0, run: 0, vy: 0, slope: 0, tail: 0, travel: 0, nextTrail: 0, nextBead: U(40, 110),
      film: 1, owner: null,
      dryAt: Infinity, dryDur: 1, wet: 1,
      ...extra,
    };
    if (reducedMotion) { d.fly = null; d.slide = false; if (d.dryAt === Infinity) { d.dryAt = U(2.5, 4); d.dryDur = U(0.8, 1.4); } }
    if (d.slide) d.hold = extra.hold ?? U(0.3, 0.6);
    drops.push(d);
    return d;
  }

  function dirOf(x, y, o) {
    const dir = o.dir || (o.from ? [x - o.from[0], y - o.from[1]] : [x - cssW / 2, y - cssH * 0.45]);
    const dl = Math.hypot(dir[0], dir[1]);
    return { da: dl > 1e-3 ? Math.atan2(dir[1], dir[0]) : U(0, TAU), bias: Math.min(1, dl / (Math.min(cssW, cssH) * 0.35)) * 0.8 };
  }

  function splat(x, y, size = 64, o = {}) {
    if (disposed) return;
    const delay = Math.max(0, o.delay || 0);
    // R: the splat's reach at impact; the blob settles to ~0.7 R, so the resting diameter is `size`
    const R = Math.max(1.5, size / 1.4);
    const { da, bias } = dirOf(x, y, o);
    const goo = !!o.goo;
    splats++;

    // the blob: lobes make its outline a splat, not a circle; an oblique hit smears it out the way it was going
    // (goo: thicker, milkier, it sticks: it doesn't slide and doesn't dry)
    const blob = makeDrop(x, y, R * 0.7, 'blob', { delay, sound: o.silent ? 0 : size, milk: goo ? U(1.35, 1.7) : U(0.75, 1), goo, ...(goo ? { slide: false } : {}) });
    // one too small to slide stays put and dries out
    if (!goo && !blob.slide && blob.dryAt === Infinity) { blob.dryAt = U(2.2, 4.5) + R * 0.05; blob.dryDur = U(1.0, 2.0); }
    if (goo) blob.a = 0.46;
    if (R >= 6) {
      const nl = goo ? 5 + Math.floor(rnd() * 3) : 3 + Math.floor(rnd() * 3), lobes = [];
      for (let i = 0; i < nl; i++) {
        lobes.push(goo
          ? { ang: da + (i / nl) * TAU + U(-0.4, 0.4), d: U(0.45, 0.95), rr: U(0.26, 0.5), aa: U(0.7, 1.05) }
          : { ang: da + (i / nl) * TAU + U(-0.5, 0.5), d: U(0.42, 0.66), rr: U(0.36, 0.52), aa: U(0.6, 0.9) });
      }
      for (let i = 0; i < 2; i++) {
        lobes.push({ ang: da + U(-0.25, 0.25), d: 0.5 + 0.4 * bias * (i + 1) * 0.6, rr: U(0.4, 0.52) * (1 - 0.25 * i), aa: U(0.6, 0.8) });
      }
      blob.lobes = lobes;
      blob.a = goo ? 0.34 : 0.24;
    }
    // splash wedges: tapered sheets shot out of the rim, the way the spit was going; the tip breaks off as a bead,
    // the rest pulls back in
    if (R >= 7 && !reducedMotion) {
      // thin irregular jets, crowding the way it was going, of very different lengths
      // (goo: fewer, thicker, and they stay out: ropy arms, not jets that break up)
      const nf = goo ? 4 + Math.floor(rnd() * 3) : 4 + Math.floor(rnd() * 4 + R / 35), fingers = [];
      for (let i = 0; i < nf; i++) {
        const fa = goo ? da + (i / nf) * TAU + U(-0.4, 0.4) : da + U(-1, 1) * U(0.3, 1) * Math.PI * (1 - 0.45 * bias);
        const along = Math.max(0, Math.cos(fa - da));
        const len = R * (goo ? U(0.35, 0.95) : U(0.3, 0.75)) * (1 + 1.2 * bias * along * along) * (rnd() < 0.3 ? 0.5 : 1);
        fingers.push({ fa, len: goo ? len * 0.8 : len, wid: R * (goo ? U(0.13, 0.2) : U(0.065, 0.11)), tipped: false });
      }
      blob.fingers = fingers;
    }
    // froth: micro-bubbles trapped in the gob, most of them in one patch
    if (R >= 9) {
      const nbb = goo ? Math.min(30, Math.round(U(0.9, 1.3) * R / 3.5)) : Math.min(14, Math.round(U(0.6, 1.1) * R / 4.5)), bubbles = [];
      const ca = U(0, TAU), cd = U(0.1, 0.35);
      for (let i = 0; i < nbb; i++) {
        let ox, oy;
        if (rnd() < 0.65) { const a = U(0, TAU), dd = Math.sqrt(rnd()) * 0.28; ox = Math.cos(ca) * cd + Math.cos(a) * dd; oy = Math.sin(ca) * cd + Math.sin(a) * dd; }
        else { const a = U(0, TAU), dd = Math.sqrt(rnd()) * 0.62; ox = Math.cos(a) * dd; oy = Math.sin(a) * dd; }
        const rr = Math.min(0.11, U(0.022, 0.07) * (rnd() < 0.15 ? 1.7 : 1));
        bubbles.push({ ox, oy, rr, pop: goo ? U(4, 30) : U(1.5, 6) });
      }
      blob.bubbles = bubbles;
    }
    // satellites: droplets flung out of the hit, mostly the way the spit was going
    const ns = goo ? Math.min(8, 2 + Math.floor(R / 14 + rnd() * 2)) : Math.min(12, 3 + Math.floor(R / 5 + rnd() * 3));
    for (let i = 0; i < ns; i++) {
      const fa = da + U(-1, 1) * Math.PI * (1 - bias * 0.65);
      const dist = R * (goo ? U(1.1, 1.9) : U(1.1, 2.6)) * (1 + 0.5 * bias * Math.max(0, Math.cos(fa - da)));
      const rr = Math.max(1.2, R * (goo ? U(0.06, 0.16) : U(0.05, 0.2)) * (1.3 - (dist / R - 1.1) * 0.3));
      makeDrop(x + Math.cos(fa) * dist, y + Math.sin(fa) * dist, rr, 'sat', {
        delay, fly: { x0: x + Math.cos(fa) * R * 0.45, y0: y + Math.sin(fa) * R * 0.45, t0: U(0, 0.025), dur: U(0.05, 0.11) },
        a: goo ? 0.46 : 0.4, milk: goo ? U(1.0, 1.4) : U(0.3, 0.6), dryAt: goo ? Infinity : rr < SLIDE_R ? U(1.4, 3.6) : Infinity,
        dryDur: U(1.0, 2.2), hold: U(0.9, 1.8), ...(goo ? { slide: false } : {}),
      });
    }
    // the mist: a puff of tiny flecks further out (goo: a few)
    const nm = Math.round(Math.min(goo ? 8 : 30, 6 + R * 0.45) * U(0.7, 1.1));
    for (let i = 0; i < nm; i++) {
      const fa = da + U(-1, 1) * Math.PI * (1 - bias * 0.45);
      const dist = R * U(1.3, 3.8);
      makeDrop(x + Math.cos(fa) * dist, y + Math.sin(fa) * dist, U(1.0, 2.0), 'mist', {
        delay, fly: { x0: x + Math.cos(fa) * R * 0.5, y0: y + Math.sin(fa) * R * 0.5, t0: U(0, 0.03), dur: U(0.05, 0.1) },
        a: 0.45, milk: 0.25, dryAt: U(0.5, 1.6), dryDur: U(0.4, 0.9),
      });
    }
    if (!delay) landed(blob);
    kick();
    return blob;
  }

  // A mouthful: it hits around one spot. Big gobs near the middle, mediums around them, small flecks thrown out
  // further, every one smeared away from where the spit came from, and strings of spit between neighbouring gobs.
  function spray(n = 10, area, o = {}) {
    if (disposed) return;
    const m = (2 * Math.min(cssW, cssH) + Math.max(cssW, cssH)) / 3 * 0.85;
    const A = area || { x: cssW * 0.14, y: cssH * 0.08, w: cssW * 0.72, h: cssH * 0.62 };
    const cx = A.x + A.w * U(0.42, 0.58), cy = A.y + A.h * U(0.38, 0.52);
    const from = o.from || [cx, cy];
    const placed = [];
    const nBig = Math.max(1, Math.round(n * 0.22)), nMed = Math.round(n * 0.38);
    for (let i = 0; i < n; i++) {
      const tier = i < nBig ? 0 : i < nBig + nMed ? 1 : 2;
      // resting diameters: big gobs ~8-10% of the screen's mean side, mediums ~4-6%, flecks ~1.5-2.7%
      const size = m * 0.7 * [U(0.11, 0.15), U(0.05, 0.08), U(0.02, 0.038)][tier];
      const [r0, r1] = [[0, 0.3], [0.2, 0.7], [0.4, 1.0]][tier];
      // the best of a few candidates: in its ring, away from the ones already placed
      let best = null, bestD = -Infinity;
      for (let k = 0; k < 12; k++) {
        const th = U(0, TAU), rho = Math.sqrt(U(r0 * r0, r1 * r1));
        const c = [cx + Math.cos(th) * rho * A.w * 0.5, cy + Math.sin(th) * rho * A.h * 0.5];
        let dmin = Infinity;
        for (const p of placed) dmin = Math.min(dmin, Math.hypot(c[0] - p[0], c[1] - p[1]) - p[2] - size / 1.4);
        if (dmin > bestD) { bestD = dmin; best = c; }
      }
      const delay = (o.delay || 0) + (i ? U(0, 0.09) : 0);
      placed.push([best[0], best[1], size / 1.4, delay, tier]); // [x, y, reach R, delay, tier]
      splat(best[0], best[1], size, { delay, dir: [best[0] - from[0], best[1] - from[1]] });
    }
    // strings: between close pairs of gobs
    if (!reducedMotion) {
      const pairs = [];
      for (let i = 0; i < placed.length; i++) for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i], b = placed[j];
        if (a[4] > 1 || b[4] > 1) continue;
        const dd = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (dd < 2.6 * (a[2] + b[2]) && dd > 1.25 * (a[2] + b[2])) pairs.push([dd, a, b]);
      }
      pairs.sort((p, q) => p[0] - q[0]);
      const ns = Math.min(pairs.length, Math.max(1, Math.round(n / 4)));
      for (let k = 0; k < ns; k++) {
        const [, a, b] = pairs[k];
        makeStrand(a, b, m, Math.max(a[3], b[3]) + 0.012);
      }
    }
  }

  // A gob of goo: what the paper leaves where it smashes into the glass. A heavy, lumpy blob of thick, cloudy saliva
  // with ropy arms and froth, clumps flung round it, joined to it by thick strings that sag and slowly bead up, and drips
  // that creep down from its lower edge: each stretches into a long neck with a fat drop at its end, slower and
  // slower, and hangs there. Nothing of it slides off or dries: it stays till it is wiped (or fadeOut).
  function goo(x, y, size = 160, o = {}) {
    if (disposed) return;
    const R = size / 1.4, delay = Math.max(0, o.delay || 0);
    const m = (2 * Math.min(cssW, cssH) + Math.max(cssW, cssH)) / 3 * 0.85;
    splat(x, y, size, { ...o, goo: true });
    const placed = [];
    const nc = 4 + Math.floor(rnd() * 3);
    for (let i = 0; i < nc; i++) {
      const fa = (i / nc) * TAU + U(-0.45, 0.45), dist = R * U(1.05, 1.75), cs = size * U(0.16, 0.32);
      const cx = x + Math.cos(fa) * dist, cy = y + Math.sin(fa) * dist;
      splat(cx, cy, cs, { delay: delay + U(0.01, 0.05), dir: [cx - x, cy - y], goo: true, silent: true });
      placed.push([cx, cy, cs / 1.4, delay + 0.05, 0]);
    }
    if (!reducedMotion) {
      const me = [x, y, R, delay, 0];
      for (const c of placed) if (rnd() < 0.7) makeStrand(me, c, m, delay + U(0.03, 0.08), true);
      for (let i = 0; i < placed.length; i++) {
        const a = placed[i], b = placed[(i + 1) % placed.length];
        if (rnd() < 0.35) makeStrand(a, b, m, delay + U(0.05, 0.1), true);
      }
    }
    // the drips: from the blob's lower edge, a few long ones, a few short
    const nd = reducedMotion ? 0 : 3 + Math.floor(rnd() * 3);
    for (let i = 0; i < nd; i++) {
      const fa = Math.PI / 2 + U(-0.95, 0.95) * (i / Math.max(1, nd - 1) - 0.5) * 2 + U(-0.12, 0.12);
      const long = i % 2 === 0;
      gdrips.push({
        x: x + Math.cos(fa) * R * 0.62, y: y + Math.sin(fa) * R * 0.6, w0: R * U(0.1, 0.16), rb: R * U(0.1, 0.17),
        L: R * (long ? U(1.2, 2.4) : U(0.4, 0.9)), tau: U(1.4, 3.2), t0: delay + U(0.25, 0.9), age: 0, sway: U(-0.08, 0.08),
        milk: U(1.2, 1.5),
      });
    }
    kick();
  }

  // A string of spit lying across the glass from gob a to gob b: a thin thread on a slight curve, which beads up
  // (Plateau-Rayleigh) and breaks into a row of droplets.
  function makeStrand(a, b, m, delay, goo = false) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
    const p0 = [a[0] + ux * a[2] * 0.75, a[1] + uy * a[2] * 0.75], p2 = [b[0] - ux * b[2] * 0.75, b[1] - uy * b[2] * 0.75];
    const len = Math.hypot(p2[0] - p0[0], p2[1] - p0[1]);
    if (len < 8) return;
    const bend = U(-0.16, 0.16) * len;
    // (goo: it sags, a rope hanging between the two)
    const p1 = [(p0[0] + p2[0]) / 2 - uy * bend, (p0[1] + p2[1]) / 2 + ux * bend + (goo ? len * U(0.12, 0.3) : 0)];
    const w = Math.max(1.1, m * (goo ? U(0.0045, 0.0075) : U(0.0016, 0.0026)));
    const step = w * 0.7, N = Math.max(4, Math.ceil(len * 1.05 / step));
    const pts = [];
    let s = 0, px = p0[0], py = p0[1];
    for (let i = 0; i <= N; i++) {
      const t = i / N, it = 1 - t;
      const x = it * it * p0[0] + 2 * it * t * p1[0] + t * t * p2[0], y = it * it * p0[1] + 2 * it * t * p1[1] + t * t * p2[1];
      s += Math.hypot(x - px, y - py); px = x; py = y;
      // the thread is thicker near the gobs it hangs from
      pts.push({ x, y, s, k: 0.75 + 0.5 * Math.pow(Math.abs(t - 0.5) * 2, 2) });
    }
    strands.push({ pts, len: s, w, step, delay, age: 0, tb: goo ? U(2.5, 7) : U(0.22, 0.5), lambda: w * U(7, 10), phase: U(0, TAU), phase2: U(0, TAU), dead: false, milk: goo ? 1.3 : 0.6, goo });
    kick();
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Simulation
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const vmaxOf = (d) => 48 + 4 * d.r; // spit is viscous: slower than water
  // where a string swells into beads: a wave whose spacing wanders, so the beads aren't a dotted line
  const beadOf = (s, x) => Math.cos(TAU * x / s.lambda + s.phase + 1.5 * Math.sin(TAU * x / (s.lambda * 3.1) + s.phase2));

  function slideStep(d, dt) {
    if (d.state === 'hold') {
      d.hold -= dt;
      d.tail = Math.max(0.3 * Math.min(1, d.travel / (d.r * 2)), d.tail - dt * 1.2);
      if (d.hold <= 0) {
        d.state = 'run'; d.run = U(0.2, 0.55) * Math.pow(d.r / 20, 0.25);
        d.slope = clamp(d.slope + U(-0.15, 0.15), -0.25, 0.25);
        d.wAng = Math.PI / 2; d.wv += 1.4; // lets go: the front bulges
      }
    } else if (d.state === 'run') {
      d.vy += (vmaxOf(d) - d.vy) * (1 - Math.exp(-dt * 7));
      d.run -= dt;
      if (d.run <= 0) d.state = 'brake';
    } else if (d.state === 'brake') {
      d.vy *= Math.exp(-dt * 12);
      if (d.vy < 8) {
        d.vy = 0; d.state = 'hold'; d.hold = U(0.12, 0.5) * Math.pow(20 / d.r, 0.3);
        d.wAng = Math.PI / 2; d.wv -= 1.8; // catches: the front squashes and springs back
      }
    }
    // the tail grows as it gets going: a drop that has barely moved has barely any
    if (d.state !== 'hold') d.tail = Math.min(Math.min(1, 0.15 + d.travel / (d.r * 1.6)), d.tail + dt * 4);
    if (d.vy <= 0) return;
    d.slope += U(-1, 1) * dt * 1.0;
    d.slope = clamp(d.slope, -0.25, 0.25);
    const dy = d.vy * dt, dx = dy * d.slope, ds = Math.hypot(dx, dy);
    d.x += dx; d.y += dy; d.travel += ds;
    // the film it leaves, laid from inside its back so the tail runs straight into it: a ridge of small bumps whose
    // thickness wanders, so it breaks up unevenly as it dries
    const rt = d.r * 0.13;
    const step = Math.max(0.8, rt * 0.4);
    d.nextTrail -= ds;
    while (d.nextTrail <= 0) {
      d.nextTrail += step;
      const k = d.nextTrail / Math.max(ds, 1e-6);
      d.film = clamp(d.film + U(-0.14, 0.14), 0.35, 1.5);
      // its width stays steady; how long it lasts wanders
      const ridge = Math.max(T * 3, rt * 0.2) * (0.8 + 0.2 * d.film) * U(0.94, 1.06);
      trail.push({
        x: d.x - dx * k - d.slope * d.r * 0.3 + U(-0.2, 0.2), y: d.y - dy * k - d.r * 0.3, r: rt * U(0.9, 1.1),
        amp: ridge * step / (1.0667 * rt), age: 0, life: U(1.2, 2.0) * d.film,
      });
    }
    // beads: now and then the trail leaves a small drop behind
    d.nextBead -= ds;
    if (d.nextBead <= 0 && d.r > 12) {
      d.nextBead = U(50, 130);
      const rb = d.r * U(0.05, 0.085);
      // left in the film well behind the tail's tip, not stuck on it
      const back = d.r * 1.3 + (d.lt || 0);
      makeDrop(d.x - d.slope * back + U(-0.2, 0.2) * rt, d.y - back, rb, 'bead', { owner: d, a: 0.36, milk: 0.4, dryAt: U(1.2, 2.8), dryDur: U(0.8, 1.8), slide: false });
      d.r = Math.cbrt(Math.max(1, d.r ** 3 - rb ** 3));
    }
    // it loses water to the film as it goes, and stops for good when it's small
    d.r = Math.max(1, d.r - ds * 0.01);
    if (d.r < SLIDE_R * 0.85) { d.slide = false; d.state = 'hold'; d.vy = 0; d.dryAt = d.age + U(0.8, 2.0); d.dryDur = U(1.2, 2.4); }
    // runs into a resting drop: swallows it
    for (const e of drops) {
      if (e === d || e.dead || e.owner === d || e.delay > 0 || (e.fly && e.age < e.fly.dur)) continue;
      if (e.slide && e.state !== 'hold') continue;
      if (Math.hypot(e.x - d.x, e.y - d.y) < (d.r + e.r) * 0.75) {
        d.r = Math.cbrt(d.r ** 3 + e.r ** 3 * e.wet);
        e.dead = true;
        d.wAng = Math.atan2(e.y - d.y, e.x - d.x); d.wv += 1.2;
        if (d.state === 'hold') d.hold *= 0.5;
      }
    }
    if (d.y - d.r * 2.5 > cssH + 10) d.dead = true;
  }

  function sim(dt) {
    simT += dt;
    for (const d of drops) {
      if (d.dead) continue;
      if (d.delay > 0) { d.delay -= dt; if (d.delay > 0) continue; d.age = -d.delay; d.delay = 0; landed(d); continue; }
      const a0 = d.age;
      d.age += dt;
      // lands from its flight: squashed along the way it came, then springs round
      if (d.fly && a0 < d.fly.dur && d.age >= d.fly.dur) { d.w = 0.3; d.wv = 0; d.wAng = Math.atan2(d.y - d.fly.y0, d.x - d.fly.x0) + Math.PI / 2; }
      // the wobble spring (~7 Hz for a mid drop, lightly damped; spit is a little stiffer)
      if (!reducedMotion) {
        const K = 1900 / Math.max(1, Math.sqrt(d.r)), C = 11;
        d.wv += (-K * d.w - C * d.wv) * dt;
        d.w += d.wv * dt;
      }
      if (d.slide && d.age > 0.3) slideStep(d, dt);
      if (d.fingers && d.age >= 0.045 && !d.goo) {
        // each wedge's tip breaks off: a bead left where it reached
        for (const f of d.fingers) {
          if (f.tipped) continue;
          f.tipped = true;
          if (f.len < d.r * 0.4) continue;
          // clear of the jet's tip, so it reads as broken off, not as a pin's head
          const reach = d.r * 0.8 + f.len * U(1.35, 1.6);
          makeDrop(d.x + Math.cos(f.fa) * reach, d.y + Math.sin(f.fa) * reach, Math.max(1.0, f.wid * U(0.5, 0.75)), 'sat', {
            a: 0.4, milk: 0.5, dryAt: U(1.5, 3.4), dryDur: U(0.9, 1.8), slide: false, w: 0.35, wAng: f.fa,
          });
        }
      }
      if (d.age > d.dryAt) {
        d.wet = 1 - smooth(0, 1, (d.age - d.dryAt) / d.dryDur);
        if (d.wet <= 0.001) d.dead = true;
      }
    }
    for (const s of strands) {
      if (s.delay > 0) { s.delay -= dt; if (s.delay <= 0) { s.age = -s.delay; s.delay = 0; } continue; }
      s.age += dt;
      if (s.age >= s.tb) {
        // broken: what's left is a row of beads
        s.dead = true;
        const P = s.pts;
        for (let i = 0; i < P.length; i++) {
          const b = beadOf(s, P[i].s);
          if (b < 0.6 || (i && beadOf(s, P[i - 1].s) > b) || (i < P.length - 1 && beadOf(s, P[i + 1].s) >= b)) continue;
          makeDrop(P[i].x, P[i].y, s.w * P[i].k * U(0.95, 1.5), 'bead', { a: 0.38, milk: s.goo ? 1.2 : 0.5, dryAt: s.goo ? Infinity : U(1.0, 3.0), dryDur: U(0.8, 1.6), slide: false });
        }
      }
    }
    for (const p of trail) p.age += dt;
    for (const g of gdrips) g.age += dt;
    let j = 0;
    for (let i = 0; i < drops.length; i++) if (!drops[i].dead) drops[j++] = drops[i];
    drops.length = j;
    j = 0;
    for (let i = 0; i < trail.length; i++) if (trail[i].age < trail[i].life) trail[j++] = trail[i];
    trail.length = j;
    j = 0;
    for (let i = 0; i < strands.length; i++) if (!strands[i].dead) strands[j++] = strands[i];
    strands.length = j;
  }

  function landed(d) {
    lastLand = simT;
    if (d.sound && onSplat) { try { onSplat(d.x, d.y, d.sound); } catch (e) { console.warn(e); } }
  }

  // blob impact: it hits small and thick, spreads past its size, then settles with a wobble
  function impact(t) {
    if (reducedMotion) return 1;
    if (t < 0.05) return 0.55 + 0.6 * easeOut(t / 0.05);
    const u = t - 0.05;
    return 1 + 0.15 * Math.exp(-u * 8) * Math.cos(u * 24);
  }

  function build() {
    nb = 0; nbub = 0; bx0 = by0 = Infinity; bx1 = by1 = -Infinity;
    // fadeOut: the water dries. Films go first, then the small drops, the big ones last; drying thins a drop and
    // pulls its edge in
    const fk = fade ? Math.min(1, fade.t / fade.dur) : 0;
    const g = 1 - smooth(0, 1, Math.min(1, fk * 2));
    for (const p of trail) {
      const k = p.age / p.life;
      bump(p.x, p.y, p.r * (1 - 0.2 * k), p.r * (1 - 0.2 * k), 0, p.amp, (1 - k * k) * g, 2, p.r, 1, 0.12, false);
    }
    for (const s of strands) {
      if (s.delay > 0) continue;
      // beading up: the thread swells at every wavelength and thins between, until it breaks
      const k = smooth(0, 1, s.age / s.tb), wet = 1 - smooth(0, 1, Math.min(1, fk * 1.6));
      for (const q of s.pts) {
        const c = Math.max(0, beadOf(s, q.s)), b = c * c;
        const rr = s.w * q.k * (1 - 0.6 * k + 0.9 * k * b);
        const h = s.w * q.k * 0.5 * (1 - 0.75 * k + 1.5 * k * b);
        bump(q.x, q.y, rr, rr, 0, h * s.step / (1.0667 * rr), wet, 2, s.w * q.k, 0, s.milk, false);
      }
    }
    // goo's drips: a neck from the gob's edge down to a fat drop, stretching slower and slower (the drop swells a
    // little as goo runs down into it)
    for (const g of gdrips) {
      const t = g.age - g.t0;
      if (t <= 0) continue;
      const wet = 1 - smooth(0, 1, Math.min(1, fk * 1.4));
      const k = 1 - Math.exp(-t / g.tau), len = g.L * k * smooth(0, 0.35, t);
      const rb = g.rb * (0.75 + 0.35 * k), ex = g.x + g.sway * len, ey = g.y + len;
      const step = Math.max(1, g.w0 * 0.3);
      for (let s = 0; s < len; s += step) {
        const u = s / Math.max(len, 1e-3);
        // wide where it leaves the gob, a neck above the drop
        const rr = Math.max(1, g.w0 * (1 - 0.62 * smooth(0, 0.8, u)) + rb * 0.25 * smooth(0.75, 1, u));
        bump(g.x + g.sway * s, g.y + s, rr, rr, 0, 0.42 * rr * step / (1.0667 * rr), wet, 2, rr, 0, g.milk, false);
      }
      lcx = ex; lcy = ey + rb * 0.15;
      bump(ex, ey + rb * 0.15, rb * 0.95, rb * 1.12, 0, 0.46 * rb, wet, 1.5, rb, 0, g.milk);
      lcx = lcy = NaN;
    }
    for (const d of drops) {
      if (d.dead || d.delay > 0) continue;
      const kd = Math.min(1, fk * (1.9 - 0.9 * Math.min(1, d.r / 28)));
      const wet = d.wet * (1 - smooth(0, 1, kd));
      if (wet <= 0) continue;
      let x = d.x, y = d.y, r = d.r * (1 - 0.5 * smooth(0.15, 1, kd)), s = 1;
      const w = clamp(d.w, -0.45, 0.45), milk = d.milk;
      let rx, ry, ang = 0;
      if (d.fly && d.age < d.fly.dur) {
        // in flight: a filled streak along its way, the head leading; launches are staggered over ~25 ms and each
        // one comes out of the blob thin
        if (d.age < d.fly.t0) continue;
        const k = (d.age - d.fly.t0) / (d.fly.dur - d.fly.t0), e = easeOut(k);
        x = d.fly.x0 + (d.x - d.fly.x0) * e; y = d.fly.y0 + (d.y - d.fly.y0) * e;
        r *= 0.4 + 0.6 * Math.min(1, k * 2);
        const st = 2.6 * (1 - e) + 0.2;
        ang = Math.atan2(d.y - d.fly.y0, d.x - d.fly.x0);
        rx = r * (1 + st * 0.3); ry = r * 0.78;
        // a comet: a round head and a thin tail drawn out behind it
        if (st > 0.3) {
          const ca = Math.cos(ang), sa = Math.sin(ang);
          bump(x - ca * r * (0.4 + st * 0.6), y - sa * r * (0.4 + st * 0.6), r * st * 0.75, r * 0.38, ang, d.a * r * 0.5, wet, 1.5, r * 0.5, 0, milk);
        }
      } else {
        if (d.kind === 'blob') s = impact(d.age);
        rx = r * s * (1 + w); ry = r * s * (1 - w * 0.8); ang = d.wAng;
      }
      const A = d.a * r * Math.min(2.2, 1 / (s * s));
      lcx = x; lcy = y;
      if (d.slide || d.tail > 0) {
        // sliding: a heavy rounded front, tapering smoothly back into the film it leaves
        const sp = Math.min(1, d.vy / vmaxOf(d));
        d.lt = 0;
        if (d.tail > 0.01) {
          // it can only trail back over where it has been; the tip thins out into the film (shaded as film)
          const Lt = Math.min(r * (0.5 + 0.6 * sp) * d.tail, d.travel * 0.9);
          d.lt = Lt;
          if (Lt > r * 0.05) {
            const r1 = Math.max(r * 0.26, 1.2);
            let pos = r * 0.3;
            for (let i = 0; i < 10 && pos < r * 0.3 + Lt; i++) {
              const t = (pos - r * 0.3) / Lt;
              const rad = r * 0.74 + (r1 - r * 0.74) * Math.pow(t, 0.7);
              bump(x - d.slope * pos, y - pos, rad, rad * 1.18, 0, A * (rad / r) * 0.95 * (1 - 0.3 * t * t), wet, 1.5, r, smooth(0.5, 1.0, t) * 0.85, milk);
              pos += rad * 0.45;
            }
          }
        }
        if (sp > 0) { const k = 1 + 0.12 * sp; rx /= Math.sqrt(k); ry *= k; y += r * 0.06 * sp; }
      }
      if (d.lobes) {
        // surface tension slowly pulls the splat rounder, faster once it slides
        const relax = Math.min(1, d.age / (d.goo ? 14 : 5) + d.travel / (r * 3));
        const ls = s * (1 + 0.15 * Math.max(0, s - 1)) * (1 - 0.45 * relax), lr = 1 + 0.2 * relax;
        for (const l of d.lobes) {
          bump(x + Math.cos(l.ang) * l.d * r * ls, y + Math.sin(l.ang) * l.d * r * ls, l.rr * r * s * lr, l.rr * r * s * lr, 0, A * l.aa, wet, 1.5, r * s, 0, milk);
        }
      }
      if (d.fingers) {
        // wedges shoot out in 40 ms, then pull back to lumps, and in completely once it slides
        const t = d.age;
        const out = t < 0.04 ? easeOut(t / 0.04) : 1 - (d.goo ? 0.3 * smooth(0.05, 1.2, t) : 0.82 * smooth(0.05, 0.45, t));
        const keep = 1 - Math.min(1, d.travel / (r * 0.8));
        for (const f of d.fingers) {
          const L = f.len * out * keep, W = f.wid * (0.7 + 0.3 * out) * (0.4 + 0.6 * keep);
          if (L < 0.6 || W < 0.4) continue;
          // a spike: a wide root sunk in the rim, narrowing to a point
          const c = Math.cos(f.fa), sn = Math.sin(f.fa), base = r * 0.7 * s;
          const a1 = 0.34 * W * 1.4;
          if (d.goo) {
            // a rope of goo with a round gob at its end
            bump(x + c * (base + L * 0.15), y + sn * (base + L * 0.15), L * 0.32 + W * 1.1, W * 1.25, f.fa, a1 * 1.25, wet, 1.5, Math.max(W, 1.5), 0, milk);
            bump(x + c * (base + L * 0.55), y + sn * (base + L * 0.55), L * 0.3 + W * 0.4, W * 0.8, f.fa, a1 * 0.9, wet, 1.5, Math.max(W, 1.2), 0, milk);
            bump(x + c * (base + L), y + sn * (base + L), W * 1.15, W * 1.05, f.fa, a1 * 1.3, wet, 1.5, Math.max(W * 1.1, 1.5), 0, milk);
            continue;
          }
          bump(x + c * (base + L * 0.08), y + sn * (base + L * 0.08), L * 0.3 + W * 1.2, W * 1.5, f.fa, a1 * 1.2, wet, 1.5, Math.max(W, 1.5), 0, milk);
          bump(x + c * (base + L * 0.45), y + sn * (base + L * 0.45), L * 0.42 + W * 0.2, W * 0.62, f.fa, a1 * 0.55, wet, 1.5, Math.max(W * 0.6, 1.2), 0, milk);
          bump(x + c * (base + L * 0.86), y + sn * (base + L * 0.86), L * 0.18 + W * 0.1, W * 0.32, f.fa, a1 * 0.3, wet, 1.5, Math.max(W * 0.3, 1), 0, milk);
        }
      }
      const core = d.goo ? 0.78 : 1;
      bump(x, y, rx * core, ry * core, ang, A, wet, 1.5, r * s, 0, milk);
      lcx = lcy = NaN;
      if (d.bubbles) {
        const sx = rx, sy = ry;
        for (const b of d.bubbles) {
          const pop = 1 - smooth(b.pop, b.pop + 0.15, d.age);
          if (pop <= 0) continue;
          // they ride in the gob, crowding back toward its tail as it runs
          bubble(x + b.ox * sx * 0.95, y + b.oy * sy * 0.95 - d.tail * r * 0.08, b.rr * r * (0.6 + 0.4 * Math.min(1, s)), wet * pop);
        }
      }
    }
  }

  function draw() {
    if (!devW) return;
    if (srcDirty || (liveSource && src)) uploadSource();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.disable(gl.SCISSOR_TEST);
    gl.viewport(0, 0, devW, devH);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!nb) return;
    // everything happens inside the wet area's box (+ a margin for the edge's antialiasing and the cast shadow)
    const x0 = Math.max(0, bx0 - 3), y0 = Math.max(0, by0 - 3);
    const x1 = Math.min(cssW, bx1 + SO[0] + 3), y1 = Math.min(cssH, by1 + SO[1] + 3);
    if (x1 <= x0 || y1 <= y0) return;
    gl.enable(gl.SCISSOR_TEST);
    // 1) the water map: everything adds up (8-bit: sizes keep the biggest)
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, mapW, mapH);
    scissor(x0 - SO[0] - 4, y0 - SO[1] - 4, x1 + 2, y1 + 2, mapW / cssW, mapH / cssH, mapH);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(bumpProg);
    gl.uniform2f(U1.u_css, cssW, cssH);
    gl.enable(gl.BLEND);
    if (useFloat) gl.blendEquation(gl.FUNC_ADD); else gl.blendEquationSeparate(gl.FUNC_ADD, gl.MAX);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.bindBuffer(gl.ARRAY_BUFFER, ibuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, inst, 0, nb * BF);
    gl.bindVertexArray(vao);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, nb);
    gl.blendEquation(gl.FUNC_ADD);
    gl.disable(gl.BLEND);
    // 2) shade it onto the canvas
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, devW, devH);
    scissor(x0, y0, x1, y1, devW / cssW, devH / cssH, devH);
    gl.useProgram(shade);
    maps.forEach((t, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t); });
    gl.uniform1i(U2.u_m0, 0); gl.uniform1i(U2.u_m1, useFloat ? 1 : 0);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, srcReady ? srcTex : maps[0]); gl.uniform1i(U2.u_src, 2);
    gl.uniform2f(U2.u_res, devW, devH);
    gl.uniform2f(U2.u_css, cssW, cssH);
    gl.uniform2f(U2.u_texel, 1 / mapW, 1 / mapH);
    gl.uniform1f(U2.u_hasSrc, srcReady ? 1 : 0);
    const R = srcRect || { x: 0, y: 0, w: cssW, h: cssH };
    gl.uniform4f(U2.u_srcRect, R.x, R.y, R.w, R.h);
    gl.uniform1f(U2.u_opacity, opacity);
    gl.bindVertexArray(emptyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // 3) the froth on top
    if (nbub) {
      gl.useProgram(bubProg);
      gl.uniform2f(U3.u_css, cssW, cssH);
      gl.uniform1f(U3.u_px, cssW / devW);
      gl.uniform1f(U3.u_opacity, opacity);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindBuffer(gl.ARRAY_BUFFER, bbuf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, binst, 0, nbub * 4);
      gl.bindVertexArray(bvao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, nbub);
      gl.disable(gl.BLEND);
    }
    gl.bindVertexArray(null);
    gl.disable(gl.SCISSOR_TEST);
    gl.activeTexture(gl.TEXTURE0);
  }
  // a CSS px box -> a scissor rect on a target of (sx, sy) texels per CSS px and height th (GL's y is up)
  function scissor(x0, y0, x1, y1, sx, sy, th) {
    const a = Math.max(0, Math.floor(x0 * sx)), b = Math.max(0, Math.floor(th - y1 * sy));
    const c = Math.ceil(x1 * sx), e = Math.ceil(th - y0 * sy);
    gl.scissor(a, b, Math.max(0, c - a), Math.max(0, e - b));
  }

  function update(dt) {
    if (disposed) return;
    resize();
    dt = Math.min(Math.max(dt || 0, 0), 0.1);
    // fixed substeps keep the springs and the stick-slip the same at any frame rate
    let left = dt;
    while (left > 1e-6) { const h = Math.min(left, 1 / 60); sim(h); if (fade) fade.t += h; left -= h; }
    if (fade) {
      const k = fade.t / fade.dur;
      opacity = 1 - smooth(0.85, 1, k);
      if (k >= 1) { dispose(); return; }
    } else if (splats && maxLife > 0 && lastLand >= 0 && simT - lastLand > maxLife) {
      fadeOut(1600);
    }
    // nothing left on the glass (and nothing on its way): the overlay removes itself
    if (splats && !drops.length && !trail.length && !strands.length && !gdrips.length) { dispose(); return; }
    build();
    draw();
  }

  function frame(now) {
    raf = 0;
    if (disposed) return;
    const dt = last ? (now - last) / 1000 : 1 / 60;
    last = now;
    update(dt);
    if (disposed) return;
    raf = requestAnimationFrame(frame);
  }
  function kick() { if (auto && !raf && !disposed) { last = 0; raf = requestAnimationFrame(frame); } }

  function fadeOut(ms = 1400) {
    if (disposed) return Promise.resolve();
    if (fade) return fade.promise;
    let resolve;
    const promise = new Promise((r) => { resolve = r; });
    fade = { t: 0, dur: Math.max(0.05, ms / 1000), resolve, promise };
    if (!drops.length && !trail.length && !strands.length && !gdrips.length) { dispose(); return promise; }
    kick();
    return promise;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    window.removeEventListener('resize', resize);
    canvas.removeEventListener('webglcontextlost', onLost);
    const lose = gl.getExtension('WEBGL_lose_context');
    if (lose && !gl.isContextLost()) lose.loseContext();
    canvas.remove();
    drops.length = 0; trail.length = 0; strands.length = 0; gdrips.length = 0;
    if (fade) { const r = fade.resolve; fade = null; r(); }
    doneResolve();
  }
  function onLost(e) { e.preventDefault(); dispose(); }

  // ---------------------------------------------------------------------------------------------------------------
  function program(vs, fs) {
    const p = gl.createProgram();
    for (const [type, code] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
      const s = gl.createShader(type);
      gl.shaderSource(s, code);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('drips shader: ' + gl.getShaderInfoLog(s));
      gl.attachShader(p, s);
    }
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('drips program: ' + gl.getProgramInfoLog(p));
    return p;
  }
  function uniforms(p, names) { const o = {}; for (const n of names) o[n] = gl.getUniformLocation(p, n); return o; }

  resize();
  window.addEventListener('resize', resize);
  canvas.addEventListener('webglcontextlost', onLost);

  return {
    canvas, done,
    splat: (x, y, size, o) => { splat(x, y, size, o); },
    spray, goo, update, step: update, fadeOut, dispose,
    setSource(s, rect) { src = s || null; srcRect = rect || null; srcReady = false; srcDirty = true; },
    refreshSource() { srcDirty = !!src; },
    get alive() { return drops.length + strands.length + gdrips.length; },
  };
}

// -----------------------------------------------------------------------------------------------------------------
// Shaders

// Pass 1: one bump per instance into the water map. Profile h = amp * (1 - q^2)^e: smooth at its edge, so bumps sum
// into one body of water with no seams. Besides the height and its exact gradient, each bump adds its size, the offset
// to its centre, its film-ness and milkiness, all weighted by its height, so the shading can read the local drop's
// size and centre as smooth averages (continuous across merged drops, tails and trails).
const BUMP_VS = `#version 300 es
in vec2 a_corner; in vec2 a_c; in vec2 a_r; in float a_ang; in float a_amp; in float a_e; in float a_size; in float a_film; in float a_milk; in vec2 a_lc;
uniform vec2 u_css;
out vec2 v_l; flat out vec4 v_p; flat out vec4 v_q; flat out vec2 v_lc;
void main() {
  v_l = a_corner;
  v_p = vec4(a_r, a_ang, a_amp); v_q = vec4(a_e, a_size, a_film, a_milk); v_lc = a_lc;
  float c = cos(a_ang), s = sin(a_ang);
  vec2 d = a_corner * a_r;
  vec2 p = a_c + vec2(c * d.x - s * d.y, s * d.x + c * d.y);
  gl_Position = vec4(p.x / u_css.x * 2.0 - 1.0, 1.0 - p.y / u_css.y * 2.0, 0.0, 1.0);
}`;
function bumpFS(isFloat) {
  return `#version 300 es
precision highp float;
in vec2 v_l; flat in vec4 v_p; flat in vec4 v_q; flat in vec2 v_lc;
${isFloat ? 'layout(location = 0) out vec4 o0; layout(location = 1) out vec4 o1;' : 'out vec4 o0;'}
void main() {
  float q2 = dot(v_l, v_l);
  if (q2 >= 1.0) discard;
  float b = 1.0 - q2, e = v_q.x;
  float h = v_p.w * pow(b, e);
${isFloat ? `  vec2 gl = -v_p.w * e * pow(b, e - 1.0) * 2.0 * v_l / v_p.xy;
  float c = cos(v_p.z), s = sin(v_p.z);
  vec2 g = vec2(c * gl.x - s * gl.y, s * gl.x + c * gl.y);
  vec2 dl = v_l * v_p.xy;
  vec2 toC = v_lc - vec2(c * dl.x - s * dl.y, s * dl.x + c * dl.y);
  o0 = vec4(h, g, h * v_q.y);
  o1 = vec4(h * toC, h * v_q.z, h * v_q.w);` : `  o0 = vec4(h / 32.0, h * v_q.z / 32.0, h * v_q.w / 32.0, v_q.y / 96.0);`}
}`;
}

const SHADE_VS = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

// Pass 2: shade the water (CSS px, y down). Output is premultiplied: darkening layers are a cold blue-grey with
// alpha, light layers white with alpha, so the same drop reads on a white page, over black and over the website.
function shadeFS(isFloat) {
  const l = Math.hypot(...LIGHT);
  return `#version 300 es
precision highp float;
uniform sampler2D u_m0; uniform sampler2D u_m1; uniform sampler2D u_src;
uniform vec2 u_res; uniform vec2 u_css; uniform vec2 u_texel;
uniform float u_hasSrc; uniform vec4 u_srcRect; uniform float u_opacity;
out vec4 o;
const float T = ${T.toFixed(4)};
const vec2 L2 = vec2(${(LIGHT[0] / l).toFixed(5)}, ${(LIGHT[1] / l).toFixed(5)});
const vec2 SO = vec2(${SO[0].toFixed(2)}, ${SO[1].toFixed(2)});
const vec3 DARK = vec3(0.1, 0.13, 0.19);   // cold blue-grey
const vec3 MILK = vec3(0.9, 0.93, 0.98);
const vec3 SKY = vec3(1.0, 0.975, 0.985);  // the faintest pink
struct W { float H; vec2 g; float S; vec2 v; float film; float milk; };
float height(vec2 uv) { return texture(u_m0, uv).r${isFloat ? '' : ' * 32.0'}; }
W water(vec2 uv) {
${isFloat ? `  vec4 a = texture(u_m0, uv), b = texture(u_m1, uv);
  float iH = 1.0 / max(a.x, 1e-4);
  return W(a.x, a.yz, a.w * iH, b.xy * iH, b.z * iH, b.w * iH);` : `  vec4 a = texture(u_m0, uv);
  float H = a.r * 32.0;
  float hx = texture(u_m0, uv + vec2(u_texel.x, 0.0)).r - texture(u_m0, uv - vec2(u_texel.x, 0.0)).r;
  float hy = texture(u_m0, uv - vec2(0.0, u_texel.y)).r - texture(u_m0, uv + vec2(0.0, u_texel.y)).r;
  vec2 g = vec2(hx, hy) * 32.0 / (2.0 * u_texel * u_css);
  float S = a.a * 96.0, iH = 1.0 / max(a.r, 1e-4);
  float gn = max(length(g), 1e-4);
  return W(H, g, S, g / gn * max(S - (H - T) / gn, 0.0), a.g * iH, a.b * iH);`}
}
vec2 toUV(vec2 p) { return vec2(p.x / u_css.x, 1.0 - p.y / u_css.y); }
// the window catchlight: two crisp panes (a window and its mullion), bent round the drop; q in drop radii, in the
// frame (along the rim, towards the light). Returns coverage, antialiased over aa (drop radii per device px).
float windowLight(vec2 q, float aa) {
  q.y += 0.9 * q.x * q.x;
  vec2 h = vec2(0.17, 0.065);
  float a = max(abs(q.x - 0.0) - h.x, abs(q.y) - h.y);
  float gap = abs(q.x + 0.035) - 0.022;          // the mullion
  float sdf = max(a, -gap);
  return clamp(0.5 - sdf / aa, 0.0, 1.0);
}
vec4 over(vec4 acc, vec3 rgb, float a) { return vec4(rgb * a + acc.rgb * (1.0 - a), a + acc.a * (1.0 - a)); }
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 p = vec2(uv.x, 1.0 - uv.y) * u_css;
  float px = u_css.x / u_res.x;                 // one device pixel, in CSS px
  // most of the wet area's box is dry glass: leave after two fetches
  float shadow = smoothstep(T + 0.4, T + 4.0, height(toUV(p - SO)));
  if (height(uv) < T * 0.5 && shadow <= 0.0) { o = vec4(0.0); return; }
  W w = water(uv);
  float gn = max(length(w.g), 1e-5);
  float d = (w.H - T) / gn;                     // how far inside the edge, CSS px (first order)
  float cover = clamp(d / px + 0.5, 0.0, 1.0);
  if (cover <= 0.0 && shadow <= 0.0) { o = vec4(0.0); return; }
  vec4 acc = vec4(0.0);
  acc = over(acc, DARK, 0.075 * shadow * (1.0 - cover));
  if (cover > 0.0) {
    float film = clamp(w.film, 0.0, 1.0), drop = 1.0 - film;
    float S = max(w.S, 0.6);
    float milk = clamp(w.milk, 0.0, 2.0); // (goo goes past 1: thick, cloudy saliva)
    float dd = max(d, 0.0);
    vec2 o2 = -w.g / gn;                        // outwards, towards the nearest edge
    float top = 0.5 - 0.5 * o2.y;               // 1 on a drop's top edge
    float thick = smoothstep(0.0, 9.0, w.H);
    // the surface: the dome of the water plus a steep contact rim; edge effects only where the water is thin, not at
    // creases deep inside a big gob
    float nearEdge = mix(1.0 - smoothstep(0.3, 0.75, (w.H - T) / (0.3 * S)), 1.0, film);
    float wr = mix(clamp(S * 0.2, 0.55, 5.0), clamp(S * 0.3, 0.5, 1.6), film);
    float rimS = 1.2 * exp(-dd / wr) * nearEdge;
    vec2 tilt = o2 * (gn * 1.5 * drop + rimS);
    float tl = length(tilt);
    // the lens shows the world upside down: its top looks at the dark ground, its bottom at the bright sky
    vec2 look = -tilt / max(tl, 1e-4);
    float lum = clamp(0.55 - 0.62 * look.y - 0.2 * look.x, 0.0, 1.0);
    vec3 env = mix(DARK * 2.2, SKY, lum);
    // mostly in a band inside the rim (a crescent: dark on the light's side, bright opposite); the middle stays clear
    float envA = drop * (smoothstep(0.12, 1.0, rimS) * 0.85 + smoothstep(0.12, 0.6, gn * 1.5) * 0.18);
    if (u_hasSrc > 0.5) {
      // real refraction: a clean, minified, upside-down picture around the local centre (more squeezed at the rim)
      float rho = min(length(w.v) / S, 1.2);
      float M = 2.4 + 1.8 * rho * rho;
      vec2 sp = p + w.v * (1.0 + M);
      vec3 see = texture(u_src, (sp - u_srcRect.xy) / u_srcRect.zw).rgb;
      see = mix(see, MILK, milk * (0.03 + 0.07 * thick));
      see = mix(see, env, envA * mix(0.75, 0.4, lum));
      acc = over(acc, see, cover * drop);
    } else {
      acc = over(acc, MILK, cover * drop * milk * (0.06 + 0.18 * thick));
      // the sky seen upside down: the lower part of a drop glows a little (shows over dark things)
      float lens = smoothstep(-0.3, 1.0, -w.v.y / S) * (1.0 - smoothstep(0.6, 1.0, length(w.v) / S) * 0.5);
      acc = over(acc, SKY, cover * drop * lens * 0.13);
      acc = over(acc, env, cover * envA * 0.6);
    }
    // the contact line: thin and dark where the water meets the glass, heavier on top; a film's is faint
    float lw = mix(clamp(S * 0.04, 0.4, 1.5), 0.35, film);
    float line = exp(-dd / lw);
    acc = over(acc, DARK * 0.6, cover * line * mix(0.42 + 0.33 * top, 0.1, film));
    // just inside it, a bright line: light caught by the steep edge (keeps the edge visible over dark things)
    float bl = exp(-pow((dd - lw * 2.2) / (lw * 1.2), 2.0));
    acc = over(acc, SKY, cover * bl * mix(0.05 + 0.55 * pow(1.0 - top, 1.5), 0.1, film));
    // the highlight where the surface turns to the light, crisp; a smaller glint opposite
    float spec = 1.0 - smoothstep(0.09, 0.14, length(tilt - L2 * 0.45));
    float glint = 1.0 - smoothstep(0.1, 0.15, length(tilt + L2 * 0.8));
    // a small drop is a dot of light
    float small = drop * (1.0 - smoothstep(2.0, 6.0, S));
    float sdot = small * (1.0 - smoothstep(0.22, 0.34, length(-w.v / S - L2 * 0.4)));
    // a film: a hairline of light along its edge facing the light
    float hair = film * exp(-pow((dd - wr) / (wr * 0.5), 2.0)) * smoothstep(0.0, 0.7, dot(o2, L2));
    // the room reflected on the light's side: a soft dark crescent inside the rim (the inner shadow), and in it the
    // window catchlight, crisp, so the highlight reads on white too
    vec2 rel = -w.v / S;                        // from the local centre to here, in drop radii
    float big = drop * smoothstep(5.0, 10.0, S);
    float side = dot(rel, L2);
    float cres = smoothstep(0.1, 0.7, side) * (1.0 - smoothstep(0.08, 0.5, dd / S)) * big;
    acc = over(acc, DARK, cover * cres * 0.36);
    vec2 T2 = vec2(-L2.y, L2.x);
    vec2 wq = vec2(dot(rel, T2), side - 0.6);
    float win = windowLight(wq, px / S) * big * (1.0 - smoothstep(0.85, 1.0, length(rel)));
    acc = over(acc, vec3(1.0), cover * clamp((spec * 0.8 + glint * 0.5) * drop + win * 0.92 + sdot * 0.9 + hair * 0.35, 0.0, 1.0));
  }
  o = acc * u_opacity;
}`;
}

// Pass 3: micro-bubbles (froth) in the big gobs: a milky disc, a dark skin heavier on top, a bright inner arc below,
// a crisp highlight dot.
const BUB_VS = `#version 300 es
in vec2 a_corner; in vec4 a_b;
uniform vec2 u_css;
out vec2 v_p; flat out vec2 v_ra;
void main() {
  float h = a_b.z + 1.5;
  v_p = a_corner * h; v_ra = a_b.zw;
  vec2 p = a_b.xy + v_p;
  gl_Position = vec4(p.x / u_css.x * 2.0 - 1.0, 1.0 - p.y / u_css.y * 2.0, 0.0, 1.0);
}`;
const BUB_FS = `#version 300 es
precision highp float;
in vec2 v_p; flat in vec2 v_ra;
uniform float u_px; uniform float u_opacity;
out vec4 o;
vec4 over(vec4 acc, vec3 rgb, float a) { return vec4(rgb * a + acc.rgb * (1.0 - a), a + acc.a * (1.0 - a)); }
void main() {
  float r = v_ra.x, dist = length(v_p);
  float e = dist - r;
  float inside = clamp(0.5 - e / u_px, 0.0, 1.0);
  if (e > u_px * 1.5) discard;
  float lw = max(r * 0.2, u_px * 0.9);
  float topSide = 0.5 - 0.5 * v_p.y / max(dist, 1e-3);
  vec4 acc = vec4(0.0);
  acc = over(acc, vec3(0.93, 0.95, 1.0), inside * 0.18);
  float ring = clamp(1.0 - abs(e + lw * 0.5) / lw, 0.0, 1.0);
  acc = over(acc, vec3(0.1, 0.13, 0.19), ring * (0.28 + 0.25 * topSide));
  float inner = clamp(1.0 - abs(e + lw * 1.7) / lw, 0.0, 1.0) * (1.0 - topSide);
  acc = over(acc, vec3(1.0), inner * 0.5);
  vec2 hp = v_p - vec2(-0.36, -0.4) * r;
  float hr = max(r * 0.26, u_px * 0.7);
  acc = over(acc, vec3(1.0), clamp(0.5 - (length(hp) - hr) / u_px, 0.0, 1.0) * 0.9);
  o = acc * v_ra.y * u_opacity;
}`;

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function inert() {
  const nop = () => {};
  return {
    canvas: null, done: Promise.resolve(), splat: nop, spray: nop, goo: nop, update: nop, step: nop, setSource: nop, refreshSource: nop,
    fadeOut: () => Promise.resolve(), dispose: nop, get alive() { return 0; },
  };
}
