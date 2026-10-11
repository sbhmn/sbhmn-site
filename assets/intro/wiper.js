// The hand that wipes the screen clean at the end of the intro: the owner's model (assets/3d/wiper-hand.glb, built by
// dev/models/wiper-hand.py from the owner's Tripo model: a hand holding a car's windscreen wiper blade), seen from the
// far side of the glass: the blade's rubber edge pressed flat on the screen, toward you (you see the blade from
// underneath, the hand and the forearm behind it, off to one side, as in the owner's reference). It drags across the
// screen in two strokes, an S: in from the side the arm is on, across, round, and back out. Wherever the rubber edge
// has been is wiped: the paper (the print of the page, stuck to the glass with goo) and the goo come off, and the live
// page is there under it. The edge of what is wiped is always under the blade, so the seam between the print and the
// page doesn't show as a moving line.
//
//   const w = await createWiper({ viewport: () => [cssW, cssH] });
//   w.mask                 { canvas, version, w, h }: white where wiped (the viewport's top-left w x h CSS px, scaled
//                          down; version bumps on each change). The paper (paper.setWipe) and the goo (drips.setWipe)
//                          cut themselves out there.
//   w.prepare(renderer)    compiles its shaders on that renderer now (so the wipe starts without a hitch); optional
//   const done = w.wipe({ onStroke });  plans the strokes for the screen now and starts them; resolves when the screen
//                          is clean. onStroke(i) as stroke i (0, 1) starts (for its sound)
//   w.update(dt)           steps it (seconds; call every frame, before the page's scene is drawn: it poses the hand and
//                          paints the mask, which the paper and the goo then leave out)
//   w.render(renderer)     draws the hand over whatever the renderer has drawn (its own scene and camera; the depth
//                          is cleared first: the hand is always in front of the paper; the goo, an overlay of its own,
//                          stays on top: it is on the glass, the hand behind it)
//   w.dispose()
//
// The hand (Y up, the rubber edge's middle at the origin facing +Z, the blade along X, 1 long, the hand behind it, -Z):
// bones blade > hand > arm, fingers, thumb. Turning 'hand' about the blade's length leans the handle over to one side
// (the blade stays flat on the glass): that is how far the arm is off to the side; 'arm' bends the wrist; 'fingers'
// and 'thumb', turned toward each other about the handle's axis, squeeze it.
import * as THREE from 'three';
import { GLTFLoader } from '/assets/vendor/three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '/assets/vendor/three/addons/libs/meshopt_decoder.module.js';
import { v } from '/assets/v.js';

const MASK_SCALE = 0.34;  // mask texels per CSS px (it only has to be sharp under the blade, which hides its edge)
const BLADE = 0.6;        // the blade's length on screen, in short sides: two strokes, overlapping by ~0.12 of a side
const FOV = 30;           // the hand's own camera
const GRIP = 0.12;        // radians at grip 1: the fingers and the thumb toward each other, round the handle

export async function createWiper({ url = '/assets/3d/wiper-hand.glb', viewport = () => [innerWidth, innerHeight] } = {}) {
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(v(url));
  let rigNode = null, skinned = null;
  gltf.scene.traverse((o) => {
    if (o.userData?.wiper) rigNode = o;
    if (o.isSkinnedMesh) skinned = o;
  });
  if (!skinned) throw new Error('wiper: no skinned mesh');
  const info = rigNode ? JSON.parse(rigNode.userData.wiper) : {};
  rigNode = rigNode ?? gltf.scene;
  const bones = {};
  skinned.skeleton.bones.forEach((b) => { bones[b.name] = b; });
  const rest = new Map(skinned.skeleton.bones.map((b) => [b, b.quaternion.clone()]));
  skinned.frustumCulled = false;
  skinned.material.side = THREE.FrontSide;
  if (skinned.material.map) skinned.material.map.anisotropy = 4;

  // its own little world: lit from the top left, like the rest of the intro (and the goo's catchlights)
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8c8478, 1.7));
  const key = new THREE.DirectionalLight(0xffffff, 2.1);
  key.position.set(-2.5, 3.5, 4);
  scene.add(key);
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 50);
  const root = new THREE.Group();
  root.add(gltf.scene);
  root.visible = false;
  scene.add(root);
  const D = 6; // the glass's distance from the hand's camera (world units; only proportions matter)

  // --- the mask: white where wiped, viewport CSS px * MASK_SCALE, y down
  const mc = document.createElement('canvas');
  const mx = mc.getContext('2d');
  const mask = { canvas: mc, version: 0, w: 1, h: 1, scale: MASK_SCALE };
  function sizeMask(w, h) {
    const W = Math.max(2, Math.round(w * MASK_SCALE)), H = Math.max(2, Math.round(h * MASK_SCALE));
    if (mc.width === W && mc.height === H && mask.w === w && mask.h === h) return;
    // keep what was wiped across a resize (scaled; the strokes are replanned for the new screen anyway)
    let old = null;
    if (mc.width > 2) { old = document.createElement('canvas'); old.width = mc.width; old.height = mc.height; old.getContext('2d').drawImage(mc, 0, 0); }
    mc.width = W; mc.height = H; mask.w = w; mask.h = h;
    mx.fillStyle = '#000'; mx.fillRect(0, 0, W, H);
    if (old) mx.drawImage(old, 0, 0, W, H);
    mask.version++;
  }
  function sweep(a0, b0, a1, b1) {
    const k = MASK_SCALE;
    mx.fillStyle = '#fff';
    mx.beginPath();
    mx.moveTo(a0[0] * k, a0[1] * k); mx.lineTo(b0[0] * k, b0[1] * k); mx.lineTo(b1[0] * k, b1[1] * k); mx.lineTo(a1[0] * k, a1[1] * k);
    mx.closePath(); mx.fill();
    // and the line under the blade itself (a still blade wipes its own line)
    mx.strokeStyle = '#fff'; mx.lineWidth = 2; mx.lineCap = 'butt';
    mx.beginPath(); mx.moveTo(a1[0] * k, a1[1] * k); mx.lineTo(b1[0] * k, b1[1] * k); mx.stroke();
    mask.version++;
  }

  // --- the bones, posed in the rig's own frame (glTF: the model's coordinates)
  const tq = new THREE.Quaternion(), ta = new THREE.Vector3(), lq = new THREE.Quaternion();
  function rigQ(b) {
    const q = b.quaternion.clone();
    for (let p = b.parent; p && p !== rigNode; p = p.parent) q.premultiply(p.quaternion);
    return q;
  }
  // turn a bone about its head by angle, about an axis given in the rig's frame
  function turn(b, axis, angle) {
    if (!b || !angle) return;
    ta.copy(axis).applyQuaternion(rigQ(b).invert());
    b.quaternion.multiply(tq.setFromAxisAngle(ta, angle));
  }
  const X = new THREE.Vector3(1, 0, 0);
  // the forearm, at rest: from the wrist to the cut; the wrist bends about the axis across it and the blade
  const fore = new THREE.Vector3().fromArray(info.cut ?? [0, 0, -1.5]).sub(new THREE.Vector3().fromArray(info.wrist ?? [0, 0, -0.9])).normalize();
  const flexAxis = new THREE.Vector3().crossVectors(fore, X).normalize();
  const gripAxis = new THREE.Vector3().fromArray(info.grip ?? [0, 1, 0]).normalize();
  // lean: the handle over to the arm's side (radians, about the blade); flex: the wrist; twist: the forearm about its
  // own length; grip 0..1
  function pose({ lean = 0, flex = 0, twist = 0, grip = 0 } = {}) {
    for (const [b, q] of rest) b.quaternion.copy(q);
    turn(bones.hand, X, lean);
    lq.setFromAxisAngle(X, lean);
    if (bones.arm) {
      turn(bones.arm, flexAxis.clone().applyQuaternion(lq), flex);
      turn(bones.arm, fore.clone().applyQuaternion(lq), twist);
    }
    if (grip) {
      const ga = gripAxis.clone().applyQuaternion(lq);
      turn(bones.fingers, ga, -GRIP * grip);
      turn(bones.thumb, ga, 0.8 * GRIP * grip);
    }
  }

  // put the rubber edge's middle at screen point (x, y) (viewport CSS px), the blade along angle ang (screen radians,
  // y down), the arm off toward screen direction side, the blade len px long
  const bx = new THREE.Vector3(), by = new THREE.Vector3(), bz = new THREE.Vector3(), basis = new THREE.Matrix4();
  function place(x, y, ang, side, len, w, h) {
    const t = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const wpp = (2 * D * t) / h; // world units per CSS px on the glass
    root.position.set((x - w / 2) * wpp, (h / 2 - y) * wpp, -D);
    // model X along the blade, model +Y (where the lean takes the arm) toward the arm's side, model +Z (the rubber
    // edge) toward you
    bx.set(Math.cos(ang), -Math.sin(ang), 0);
    by.set(side[0], -side[1], 0);
    by.addScaledVector(bx, -by.dot(bx)).normalize();
    bz.crossVectors(bx, by);
    if (bz.z < 0) { bx.negate(); bz.negate(); }
    root.quaternion.setFromRotationMatrix(basis.makeBasis(bx, by, bz));
    root.scale.setScalar(len * wpp);
  }

  // --- the strokes
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // a cubic from 0 to 1 over t in 0..1, with slopes v0 and v1 at its ends (in units of the average speed)
  const hermite = (t, v0, v1) => { const t2 = t * t, t3 = t2 * t; return (-2 * t3 + 3 * t2) + v0 * (t3 - 2 * t2 + t) + v1 * (t3 - t2); };
  let plan = null, show = null;
  function makePlan() {
    const [w, h] = viewport();
    const land = w >= h, S = Math.min(w, h), L = BLADE * S;
    // 'along': the first stroke's way; the arm is on the other side (it trails in from off the screen there)
    const along = land ? [-1, 0] : [0, -1], across = land ? [0, 1] : [1, 0];
    const span = land ? w : h;
    const m0 = 0.1 * S, m1 = 0.06 * S; // how far off the screen it starts / turns round
    return {
      w, h, S, L, along, across, side: [-along[0], -along[1]],
      // positions along 'along' from the screen's edge on the arm's side, and across from the screen's edge
      s0: -m0, s1: span + m1, s2: -m0 * 1.2,
      // (each band reaches ~0.03 of a side past its screen edge, tilted, drifted, at either end of its stroke)
      wA: 0.27 * S, wB: S - 0.27 * S,
      // the stroke's own small tilt off square (radians) and drift across (px over the stroke): out toward the edge
      tilt1: 0.1, tilt2: -0.08, drift1: -0.012 * S, drift2: 0.012 * S,
      T1: 0.86, T2: 1.3, T3: 2.14,
    };
  }
  function at(t) {
    const p = plan;
    let s;
    if (t <= p.T1) s = p.s0 + (p.s1 - p.s0) * hermite(t / p.T1, 0.9, 0);
    else if (t <= p.T2) s = p.s1;
    else s = p.s1 + (p.s2 - p.s1) * hermite(Math.min(1, (t - p.T2) / (p.T3 - p.T2)), 0, 1.0);
    // across: band A, round the corner to band B: only once the blade is past the screen's edge (the stroke slowing
    // into it), and down before it comes back on, so the corners are wiped; a slight drift along each stroke
    const k = smooth(p.T1 - 0.05, p.T2 + 0.02, t);
    const d1 = p.drift1 * smooth(0, p.T1, t), d2 = p.drift2 * smooth(p.T2, p.T3, t);
    const wv = p.wA + (p.wB - p.wA) * k + d1 * (1 - k) + d2;
    const tilt = p.tilt1 + (p.tilt2 - p.tilt1) * smooth(p.T1 - 0.1, p.T2, t);
    // the handle leans back toward the arm as it pushes away, further as it pulls back in; the wrist flicks round
    // the corner; the fingers squeeze on each stroke and ease off at the turn
    const turnK = Math.sin(Math.PI * smooth(p.T1 - 0.22, p.T2 + 0.18, t));
    const lean = 0.82 + 0.22 * smooth(p.T1 - 0.05, p.T2 + 0.1, t);
    const flex = 0.32 * turnK - 0.08 * smooth(0, 0.4, t) + 0.1 * smooth(p.T2, p.T3, t);
    const twist = 0.12 * turnK;
    const grip = 0.55 + 0.45 * Math.sin(t * 9.0) * (1 - 0.7 * turnK);
    const { along: A, across: C } = p;
    // 'along' is measured from the screen's edge on the arm's side
    const ox = A[0] < 0 ? p.w : 0, oy = A[1] < 0 ? p.h : 0;
    const x = ox + A[0] * s + C[0] * wv, y = oy + A[1] * s + C[1] * wv;
    return { x, y, ang: Math.atan2(C[1], C[0]) + tilt, lean, flex, twist, grip };
  }
  function ends(q) {
    const hx = Math.cos(q.ang) * plan.L / 2, hy = Math.sin(q.ang) * plan.L / 2;
    return [[q.x - hx, q.y - hy], [q.x + hx, q.y + hy]];
  }
  function apply(t) {
    const q = at(t);
    place(q.x, q.y, q.ang, plan.side, plan.L, plan.w, plan.h);
    pose(q);
    return q;
  }

  const wiper = {
    scene, camera, mask, info, bones, pose, root,
    get active() { return !!show; },
    prepare(renderer) {
      if (!plan) plan = makePlan();
      apply(0); root.visible = true;
      try { renderer.compile(scene, camera); } catch (e) { /* an optimisation */ }
      root.visible = !!show;
    },
    wipe({ onStroke = null } = {}) {
      plan = makePlan();
      sizeMask(plan.w, plan.h);
      let resolve;
      const done = new Promise((r) => { resolve = r; });
      show = { t: 0, prev: ends(apply(0)), resolve, onStroke, stroke: 0 };
      root.visible = true;
      try { onStroke?.(0); } catch (e) { console.warn(e); }
      return done;
    },
    update(dt) {
      if (!show) return;
      const [w, h] = viewport();
      if (w !== plan.w || h !== plan.h) {
        // the screen changed: same moment, new screen
        plan = makePlan(); sizeMask(w, h); show.prev = ends(at(show.t));
      }
      show.t += dt;
      // (the second stroke's sound starts a hair before it moves: the rubber grabbing the glass)
      if (show.stroke === 0 && show.t >= plan.T2 - 0.06) { show.stroke = 1; try { show.onStroke?.(1); } catch (e) { console.warn(e); } }
      const e = ends(apply(Math.min(show.t, plan.T3)));
      sweep(show.prev[0], show.prev[1], e[0], e[1]);
      show.prev = e;
      if (show.t >= plan.T3) {
        // clean: whatever the strokes may have missed at the very corners goes too
        mx.fillStyle = '#fff'; mx.fillRect(0, 0, mc.width, mc.height); mask.version++;
        root.visible = false;
        const r = show.resolve; show = null; r();
      }
    },
    // for the lab: the hand at time t of the strokes, nothing painted
    at(t) { if (!plan) { plan = makePlan(); sizeMask(plan.w, plan.h); } root.visible = true; return apply(t); },
    get plan() { return plan; },
    render(renderer) {
      if (!root.visible) return;
      const [w, h] = viewport();
      camera.aspect = w / h; camera.updateProjectionMatrix();
      const ac = renderer.autoClear;
      renderer.autoClear = false;
      renderer.clearDepth();
      renderer.render(scene, camera);
      renderer.autoClear = ac;
    },
    dispose() {
      show = null;
      skinned.geometry.dispose();
      skinned.material.map?.dispose();
      skinned.material.dispose();
    },
  };
  return wiper;
}
