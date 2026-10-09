# The owner's tongue (a Tripo model, FBX + textures) made into a rigged, web-sized GLB for the intro's lick
# (assets/intro/tongue-model.js animates it procedurally; there is no baked clip).
#
#   "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b --factory-startup -P dev/models/tongue-rig.py -- \
#       <model.fbx> <out.glb> [options]
#     --relax R      how much of the model's S-bend (up and down) the rest pose keeps (0 = straight, 1 = as sculpted;
#                    default 0.3)
#     --lateral R    how much of its bending to the sides it keeps (default 0: the rest pose is left-right symmetric)
#     --twist R      how much of its roll along the length it keeps (default 0: symmetric, so a mirrored lick is exact)
#     --width W      the widest part, in bin units (default 0.40)
#     --stretch S    extra length of the body (the part out of the bin; default 1.12)
#     --stalk D      extra length at the root, in bin units: the part that stays down in the dark bin (default 0.34)
#     --bones N      bones along the body (default 9; +2 in the stalk, + a twin per side for each bone of the front
#                    third, to cup the tip)
#     --tex PX       base colour and normal map size (default 1024; roughness gets half)
#     --format F     WEBP | JPEG (default WEBP)    --quality Q  (default 86)    --plain  no meshopt compression
#     --lift L       the colour map: white glare capped to pink, the darkest baked occlusion lifted by L toward the
#                    median (default 0.45; -1 = the map untouched)
#     --patch U,V,R  a disc of the colour and normal maps (UV centre, radius) filled smoothly from around it: the dark,
#                    spotty stain baked in next to the model's small holes (default 0.692,0.773,0.034; none = off)
#     --smooth S     how smooth the found spine is (Gaussian, model units; default 0.05)
#     --render DIR   also render the rest pose and a test pose (Workbench, textured) into DIR, for a look
#
# What it does:
#   1. Imports the FBX, applies its transform, keeps the largest piece (the rest are a few loose crumbs inside),
#      fills the small holes (each filled face gets one UV, its neighbour's: their corners sat on different islands),
#      smooth shading.
#   2. Finds the tongue's centreline: a harmonic field over the surface (0 on the root's cap, 1 on the tip's cap), its
#      level sets are cross-sections; their centroids are the spine. A frame at every point of the spine: the tangent,
#      the width across (the cross-section's long axis, unwrapped and smoothed), the top (width x tangent), and every
#      vertex in that frame's coordinates.
#   3. Relaxes it into the rest pose: the bends and the roll between spine frames are scaled down (swing/twist), the
#      root end is stretched into a stalk (it lives in the bin), the body is stretched a little, and every vertex is
#      put back in its frame on the new spine. An exact remap (no skinning), so no volume loss or tearing.
#   4. Root at the origin, the tongue lying along -Y (Blender; glTF +Z, toward the viewer), top up, scaled to bin units.
#   5. An armature along the new spine: 2 stalk bones + N body bones (shorter toward the tip). Weights straight
#      from the spine parameter: each vertex blends the two bones whose middles it lies between (smooth bends, no
#      bleeding between the folds of the model). The outer edges of the front third go to twins of their chain
#      bones (cup_l_<k>, cup_r_<k>: same frame, children of bone k), so rolling the twins about the bone's axis
#      cups the tip and with no roll everything bends together.
#   6. PBR material (base colour, normal, roughness, a wet clear coat), textures downscaled (the colour map's baked
#      white glare capped to pink and its darkest baked occlusion lifted, see --lift: they read as stains once the
#      tongue moves; the dark, spotty stain baked into the colour and normal maps beside the holes filled, see
#      --patch), GLB with the skin, no animation, meshopt-compressed geometry (EXT_meshopt_compression: load it
#      with GLTFLoader.setMeshoptDecoder) and WebP textures (EXT_texture_webp). The armature carries the rig as JSON in
#      its extras ("rig"): per joint the rest position, the top vector and the half width/height of the tongue there
#      (glTF coordinates), and the cup twins, for the procedural animation.
#   With --render: the model striped along the found spine (orig-*.png), the relaxed one (relaxed-*.png), the rest
#   pose textured (rest-*.png) and a test pose (pose-*.png).
import bpy, bmesh, sys, os, math, json, heapq, tempfile, shutil
import numpy as np
from mathutils import Vector, Matrix, Quaternion


def cli():
    a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    pos = [x for i, x in enumerate(a) if not x.startswith('--') and (i == 0 or not a[i - 1].startswith('--'))]
    def opt(k, d):
        return type(d)(a[a.index(k) + 1]) if k in a else d
    return {
        'fbx': pos[0], 'out': pos[1],
        'relax': opt('--relax', 0.3), 'twist': opt('--twist', 0.0), 'lateral': opt('--lateral', 0.0),
        'width': opt('--width', 0.40),
        'stretch': opt('--stretch', 1.12), 'stalk': opt('--stalk', 0.34), 'bones': opt('--bones', 9),
        'tex': opt('--tex', 1024), 'format': opt('--format', 'WEBP'), 'render': opt('--render', ''),
        'smooth': opt('--smooth', 0.05), 'quality': opt('--quality', 86), 'meshopt': '--plain' not in a,
        'lift': opt('--lift', 0.45),
        'patch': None if opt('--patch', '') == 'none' else [float(x) for x in opt('--patch', '0.692,0.773,0.034').split(',')],
    }


A = cli()
G = lambda v: [float(v[0]), float(v[2]), float(-v[1])]  # Blender (Z up) -> glTF (Y up)


# ------------------------------------------------------------------------------------------------- 1. import, clean
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o)
bpy.ops.import_scene.fbx(filepath=A['fbx'])
ob = [o for o in bpy.data.objects if o.type == 'MESH'][0]
for o in list(bpy.data.objects):
    if o is not ob:
        bpy.data.objects.remove(o)
ob.parent = None
me = ob.data
me.transform(ob.matrix_world)
ob.matrix_world = Matrix.Identity(4)
ob.name = me.name = 'tongue'

bm = bmesh.new()
bm.from_mesh(me)
bm.verts.ensure_lookup_table()
comp = [-1] * len(bm.verts)
sizes = []
for v in bm.verts:
    if comp[v.index] >= 0:
        continue
    c = len(sizes); comp[v.index] = c; st = [v]; n = 0
    while st:
        x = st.pop(); n += 1
        for e in x.link_edges:
            w = e.other_vert(x)
            if comp[w.index] < 0:
                comp[w.index] = c; st.append(w)
    sizes.append(n)
main = int(np.argmax(sizes))
bmesh.ops.delete(bm, geom=[v for v in bm.verts if comp[v.index] != main], context='VERTS')
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-6)
holes = [e for e in bm.edges if e.is_boundary]
if holes:
    filled = bmesh.ops.holes_fill(bm, edges=holes, sides=0)['faces']
    centres = [fa.calc_center_median() for fa in filled]
    # Around the holes the UVs are a patchwork: the new faces take their corners' UVs from wherever those sat, and a
    # few slivers of the model there are mapped to other islands (stray texture, glints). Each face within 3 cm of a
    # hole: each corner takes, of the UVs its vertex has, the one nearest the island most of them share (a proper
    # little triangle of it: one UV for a whole face would leave the normal map without a tangent frame).
    uvl = bm.loops.layers.uv.active
    if uvl:
        fset = set(filled)
        zone_f = [fa for fa in bm.faces if any((fa.calc_center_median() - c).length < 0.03 for c in centres)]
        fixed_n = 0
        for fa in zone_f:
            cands = [[o[uvl].uv.copy() for o in lp.vert.link_loops if o.face not in fset] or [lp[uvl].uv.copy()] for lp in fa.loops]
            flat = [u for c in cands for u in c]
            ref = max(flat, key=lambda u: sum((w - u).length < 0.03 for w in flat))
            for lp, c in zip(fa.loops, cands):
                best = min(c, key=lambda u: (u - ref).length)
                if (best - lp[uvl].uv).length > 1e-6:
                    lp[uvl].uv = best; fixed_n += 1
        print('UV corners moved onto their neighbours\' island around the holes: %d' % fixed_n)
    # around the holes the surface is crumpled into tiny folds (they glint): smooth everything within 2 cm of each
    zone_v = [v for v in bm.verts if any((v.co - c).length < 0.02 for c in centres)]
    for it in range(12):
        new_co = {v: sum((e.other_vert(v).co for e in v.link_edges), Vector((0, 0, 0))) / max(1, len(v.link_edges)) for v in zone_v}
        for v, c in new_co.items():
            v.co = v.co * 0.4 + c * 0.6
    print('smoothed %d vertices around the holes' % len(zone_v))
print('pieces', len(sizes), 'kept', sizes[main], 'boundary edges filled', len(holes))
bm.to_mesh(me)
bm.free()
if me.has_custom_normals:
    with bpy.context.temp_override(object=ob, active_object=ob):
        bpy.ops.mesh.customdata_custom_splitnormals_clear()
me.shade_smooth()

co = np.array([v.co[:] for v in me.vertices])
NV = len(co)
E = np.array([e.vertices[:] for e in me.edges])


# ------------------------------------------------------------------------------------------ 2. the harmonic field
def harmonic(fixed, val):
    i, j = E[:, 0], E[:, 1]
    w = 1.0 / np.maximum(1e-6, np.linalg.norm(co[i] - co[j], axis=1))
    deg = np.bincount(i, w, NV) + np.bincount(j, w, NV)
    free = np.ones(NV, bool); free[fixed] = False
    Wm = lambda x: np.bincount(i, w * x[j], NV) + np.bincount(j, w * x[i], NV)
    def Am(x):
        r = deg * x - Wm(x); r[~free] = 0; return r
    xc = np.zeros(NV); xc[fixed] = val
    b = Wm(xc); b[~free] = 0
    x = np.zeros(NV); r = b.copy(); z = r / deg; p = z.copy(); rz = r @ z; bb = b @ b
    for it in range(20000):
        Ap = Am(p); al = rz / (p @ Ap)
        x += al * p; r -= al * Ap
        if r @ r < 1e-20 * bb:
            break
        z = r / deg; rzn = r @ z; p = z + (rzn / rz) * p; rz = rzn
    print('harmonic field: %d iterations' % it)
    return np.where(free, x, xc)


# the tip is the slimmer end, at -x in the model; the root (thicker, blunter) at +x
tipCap = np.where(co[:, 0] < co[:, 0].min() + 0.005)[0]
rootCap = np.where(co[:, 0] > co[:, 0].max() - 0.005)[0]
f = harmonic(np.concatenate([rootCap, tipCap]), np.concatenate([np.zeros(len(rootCap)), np.ones(len(tipCap))]))

NB = 90
fc, C = [], []
for k in range(NB):
    sel = (f >= k / NB) & (f < (k + 1) / NB) if k < NB - 1 else (f >= k / NB)
    if sel.sum() < 3:
        continue
    fc.append(f[sel].mean()); C.append(co[sel].mean(0))
fc = np.array(fc); C = np.array(C)
for it in range(6):
    C[1:-1] = 0.25 * C[:-2] + 0.5 * C[1:-1] + 0.25 * C[2:]
sc = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(C, axis=0), axis=1))])
L0 = sc[-1]
sv = np.interp(f, fc, sc)  # every vertex's place along the spine (root 0 .. tip L0)
print('spine length %.3f (model units)' % L0)

# resample the spine evenly, then smooth it well (the band centroids kink where the model's median fold runs deep;
# a kink in the spine would be a seam in the relaxed mesh). Near the ends the window narrows so they stay put.
M = 240
sm = np.linspace(0, L0, M)
Cm = np.stack([np.interp(sm, sc, C[:, c]) for c in range(3)], 1)
Craw = Cm.copy()
for m in range(M):
    sg = max(1e-3, min(A['smooth'], sm[m] / 2.5, (L0 - sm[m]) / 2.5))
    g = np.exp(-0.5 * ((sm - sm[m]) / sg) ** 2)
    Cm[m] = (g[:, None] * Craw).sum(0) / g.sum()
Tm = np.gradient(Cm, axis=0)
for it in range(3):
    Tm[1:-1] = 0.25 * Tm[:-2] + 0.5 * Tm[1:-1] + 0.25 * Tm[2:]
Tm /= np.linalg.norm(Tm, axis=1)[:, None]

# rotation-minimising reference frames, then the cross-section's long axis as an angle in them
Z = np.array([0, 0, 1.0])
Ur = np.zeros((M, 3)); Wr = np.zeros((M, 3))
u = Z - (Z @ Tm[0]) * Tm[0]; u /= np.linalg.norm(u)
for m in range(M):
    if m:
        a, b = Tm[m - 1], Tm[m]
        ax = np.cross(a, b); sn = np.linalg.norm(ax)
        if sn > 1e-9:
            q = Quaternion(Vector(ax / sn), math.atan2(sn, a @ b))
            u = np.array(q @ Vector(u))
        u = u - (u @ b) * b; u /= np.linalg.norm(u)
    Ur[m] = u; Wr[m] = np.cross(Tm[m], u)
h = 0.02
theta = np.zeros(M); aniso = np.zeros(M)
for m in range(M):
    sel = np.abs(sv - sm[m]) < h
    d = co[sel] - Cm[m]
    x, y = d @ Wr[m], d @ Ur[m]
    sxx, syy, sxy = (x * x).mean(), (y * y).mean(), (x * y).mean()
    theta[m] = 0.5 * math.atan2(2 * sxy, sxx - syy)
    l1 = 0.5 * (sxx + syy) + math.sqrt(0.25 * (sxx - syy) ** 2 + sxy ** 2); l2 = sxx + syy - l1
    aniso[m] = (l1 - l2) / max(1e-12, l1 + l2)
for m in range(1, M):  # unwrap (mod pi)
    while theta[m] - theta[m - 1] > math.pi / 2: theta[m] -= math.pi
    while theta[m] - theta[m - 1] < -math.pi / 2: theta[m] += math.pi
ths = np.zeros(M)
for m in range(M):
    g = np.exp(-0.5 * ((sm - sm[m]) / 0.06) ** 2) * (aniso + 1e-3)
    ths[m] = (g * theta).sum() / g.sum()
Wm_ = np.cos(ths)[:, None] * Wr + np.sin(ths)[:, None] * Ur
Um = np.cross(Wm_, Tm)
# the top faces up (+Z) over the tip half, where the model lies flat
if (Um[M // 2:] @ Z).mean() < 0:
    Wm_, Um = -Wm_, -Um
R = np.stack([Wm_, Tm, Um], 2)  # columns: width, along, top
print('roll of the width axis along the spine (deg):', [int(round(math.degrees(t))) for t in ths[::20]])


def interp_frame(Cs, Rs, s):
    """Position and rotation at spine parameter s (arrays over the M samples)."""
    x = np.clip(s / L0 * (M - 1), 0, M - 1 - 1e-9)
    k = np.floor(x).astype(int); t = x - k
    P = Cs[k] * (1 - t)[:, None] + Cs[k + 1] * t[:, None]
    Rk = Rs[k] * (1 - t)[:, None, None] + Rs[k + 1] * t[:, None, None]
    # re-orthonormalise (columns)
    T = Rk[:, :, 1] / np.linalg.norm(Rk[:, :, 1], axis=1)[:, None]
    U = Rk[:, :, 2] - (Rk[:, :, 2] * T).sum(1)[:, None] * T
    U /= np.linalg.norm(U, axis=1)[:, None]
    W = np.cross(T, U)
    return P, np.stack([W, T, U], 2)


P0, R0 = interp_frame(Cm, R, sv)
local = np.einsum('nji,nj->ni', R0, co - P0)  # (width, along, top) in the vertex's own spine frame


def stripes(mesh, s, name='s'):
    """Debug: stripes along the spine parameter, left/right halves tinted, as a colour attribute."""
    col = mesh.color_attributes.get(name) or mesh.color_attributes.new(name, 'FLOAT_COLOR', 'POINT')
    for i in range(len(mesh.vertices)):
        t = s[i] / s.max()
        k = 0.55 + 0.45 * (int(t * 24) % 2)
        side = 1.0 if local[i, 0] > 0 else 0.75
        col.data[i].color = (t * k * side, (1 - abs(2 * t - 1)) * 0.7 * k, (1 - t) * k * side, 1)
    mesh.color_attributes.active_color = col


def debug_shots(tag, extent, centre):
    scn = bpy.context.scene
    scn.render.engine = 'BLENDER_WORKBENCH'
    scn.display.shading.light = 'STUDIO'
    scn.display.shading.color_type = 'VERTEX'
    scn.render.resolution_x = 700; scn.render.resolution_y = 500
    cam_d = bpy.data.cameras.new('dbg'); cam_d.type = 'ORTHO'; cam_d.ortho_scale = extent
    cam = bpy.data.objects.new('dbg', cam_d); scn.collection.objects.link(cam); scn.camera = cam
    for name, d in (('top', (0, 0.001, 1)), ('front', (0, -1, 0)), ('side', (1, 0, 0)), ('persp', (0.7, -0.5, 0.6))):
        cam.location = Vector(centre) + Vector(d) * 3
        cam.rotation_euler = (-Vector(d)).to_track_quat('-Z', 'Y').to_euler()
        scn.render.filepath = os.path.join(A['render'], '%s-%s.png' % (tag, name))
        bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam)


if A['render']:
    os.makedirs(A['render'], exist_ok=True)
    stripes(me, sv)
    # the spine as a chain of little spheres
    dots = []
    for m in range(0, M, 6):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.012, location=Cm[m], segments=8, ring_count=4)
        dots.append(bpy.context.active_object)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.007, location=Cm[m] + Um[m] * 0.08, segments=6, ring_count=3)
        dots.append(bpy.context.active_object)
    debug_shots('orig', 1.25, co.mean(0))
    for d in dots:
        bpy.data.objects.remove(d)


# --------------------------------------------------------------------------------------------- 3. relax, stretch
def swing_twist(q):
    tw = Quaternion((q.w, 0, q.y, 0))
    if tw.magnitude < 1e-9:
        tw = Quaternion()
    tw.normalize()
    return q @ tw.inverted(), tw


def qpow(q, p):
    ax, an = q.to_axis_angle()
    return Quaternion(ax, an * p)


def swing_scale(q, pitch, lateral):
    """Scale a swing (axis in the local x-z plane) by one factor about x (bending toward the top or the underside)
    and another about z (bending to the sides)."""
    ax, an = q.to_axis_angle()
    v = Vector((ax.x * an * pitch, 0.0, ax.z * an * lateral))
    a = v.length
    return Quaternion(v / a, a) if a > 1e-9 else Quaternion()


zone = 0.22 * L0  # the root part stretched into the stalk
sigma = None  # bin units per model unit: from the width, below
# widths first (for the scale)
hw = np.zeros(M); hh = np.zeros(M)
for m in range(M):
    sel = np.abs(sv - sm[m]) < h
    hw[m] = np.percentile(np.abs(local[sel, 0]), 98) if sel.sum() > 8 else 0
    hh[m] = np.percentile(np.abs(local[sel, 2]), 98) if sel.sum() > 8 else 0
sigma = A['width'] / (2 * hw.max())
D = A['stalk'] / sigma  # stalk, in model units
ds = np.diff(sm)
g = np.where(sm < zone, sm * (zone + D) / zone, sm + D)  # remapped length (model units, before the body stretch)
g = np.where(g > zone + D, zone + D + (g - zone - D) * A['stretch'], g)
dg = np.diff(g)
Rn = np.zeros_like(R); Cn = np.zeros_like(Cm)
Rn[0] = np.stack([np.array([-1, 0, 0.0]), np.array([0, -1, 0.0]), np.array([0, 0, 1.0])], 1)  # width -X, along -Y, top +Z
for m in range(M - 1):
    dq = Matrix(R[m].T @ R[m + 1]).to_quaternion()
    swing, tw = swing_twist(dq)
    dq2 = swing_scale(swing, A['relax'], A['lateral']) @ qpow(tw, A['twist'])
    half = np.array(qpow(dq2, 0.5).to_matrix())
    Rn[m + 1] = Rn[m] @ np.array(dq2.to_matrix())
    Cn[m + 1] = Cn[m] + Rn[m] @ half @ np.array([0, dg[m], 0])
Pn, Rnv = interp_frame(Cn, Rn, sv)
new = Pn + np.einsum('nij,nj->ni', Rnv, local)
new *= sigma
Cn *= sigma
gs = g * sigma  # spine arclength of every sample, bin units
s_v = np.interp(sv, sm, gs)  # every vertex's place along the new spine
for i, v in enumerate(me.vertices):
    v.co = new[i]
me.update()
Ltot = gs[-1]
print('rest pose: scale %.3f, spine %.3f bin units (stalk %.3f), width %.3f, thickness %.3f'
      % (sigma, Ltot, (zone + D) * sigma, 2 * hw.max() * sigma, 2 * hh.max() * sigma))

# folded faces? (each face's normal against its neighbours': a face folded over by the relax points the other way)
bm = bmesh.new(); bm.from_mesh(me); bm.faces.ensure_lookup_table()
fold = 0
for fa in bm.faces:
    nb = [g for e in fa.edges for g in e.link_faces if g is not fa]
    m = sum((g.normal for g in nb), Vector((0, 0, 0)))
    if m.length > 1e-9 and fa.normal.dot(m.normalized()) < 0.2:
        fold += 1
bm.free()
print('faces folded by the relax: %d of %d' % (fold, len(me.polygons)))
if A['render']:
    debug_shots('relaxed', 1.5, (0, -0.65, 0))


# ------------------------------------------------------------------------------------------------- 5. the armature
def frame_at(s):
    x = np.interp(s, gs, np.arange(M))
    k = min(int(x), M - 2); t = x - k
    p = Cn[k] * (1 - t) + Cn[k + 1] * t
    U = Rn[k][:, 2] * (1 - t) + Rn[k + 1][:, 2] * t
    return p, U / np.linalg.norm(U)


stalkEnd = (zone + D) * sigma
nb = A['bones']
# joints: 2 stalk bones, then body bones getting shorter toward the tip (spacing ~ 1 - 0.45 s)
w_ = np.array([1 - 0.45 * k / max(1, nb - 1) for k in range(nb)])
body = stalkEnd + np.concatenate([[0], np.cumsum(w_ / w_.sum())]) * (Ltot - stalkEnd)
js = np.concatenate([[0, stalkEnd * 0.5], body])  # joint arclengths, root .. tip end
names = ['stalk_0', 'stalk_1'] + ['body_%d' % k for k in range(nb)]
arm = bpy.data.armatures.new('tongue_rig')
ao = bpy.data.objects.new('tongue_rig', arm)
bpy.context.scene.collection.objects.link(ao)
for o in bpy.context.scene.objects:
    o.select_set(False)
ao.select_set(True)
bpy.context.view_layer.objects.active = ao
bpy.ops.object.mode_set(mode='EDIT')
joints = []
prev = None
for k, name in enumerate(names):
    p0, u0 = frame_at(js[k]); p1, _ = frame_at(js[k + 1])
    eb = arm.edit_bones.new(name)
    eb.head = Vector(p0); eb.tail = Vector(p1)
    eb.align_roll(Vector(u0))
    if prev:
        eb.parent = prev; eb.use_connect = True
    prev = eb
    joints.append({'name': name, 's': float(js[k]), 'p': G(p0), 'up': G(u0)})
pe, ue = frame_at(js[-1])
tipEnd = {'s': float(js[-1]), 'p': G(pe), 'up': G(ue)}

# half widths / heights of the new tongue along the spine (for the animation: rim contact, drips on the edges)
lw = np.zeros(len(js)); lh = np.zeros(len(js))
for k, s in enumerate(js):
    sel = np.abs(s_v - s) < 0.04
    if sel.sum() > 8:
        lw[k] = np.percentile(np.abs(local[sel, 0]), 97) * sigma
        lh[k] = np.percentile(np.abs(local[sel, 2]), 97) * sigma
for k, j in enumerate(joints):
    j['hw'] = round(float(lw[k]), 4); j['hh'] = round(float(lh[k]), 4)
tipEnd['hw'] = round(float(lw[-1]), 4); tipEnd['hh'] = round(float(lh[-1]), 4)

# ------------------------------------------------------------------------------------------------------ weights
# chain: linear between the middles of neighbouring bones
mids = (js[:-1] + js[1:]) / 2
nbn = len(names)
Wc = np.zeros((NV, nbn))
x = np.interp(s_v, mids, np.arange(nbn))
k0 = np.clip(np.floor(x).astype(int), 0, nbn - 1); k1 = np.clip(k0 + 1, 0, nbn - 1); t = x - np.floor(x)
np.add.at(Wc, (np.arange(NV), k0), 1 - t)
np.add.at(Wc, (np.arange(NV), k1), t)
# cups: the outer edges of the front third, more toward the tip. Each chain bone there gets a twin per side (same
# frame, child of it) that takes the edge's share of that bone's weight; rolling a twin about the bone's own axis
# lifts that edge, and with no roll the twins move exactly with the chain (the tip bends as one piece).
cupS = stalkEnd + 0.6 * (Ltot - stalkEnd)
span = js[-1] - cupS
lat = local[:, 0] * sigma / np.maximum(1e-4, np.interp(s_v, js, lw))
sm_ = lambda a, b, x: np.clip((x - a) / (b - a), 0, 1) ** 2 * (3 - 2 * np.clip((x - a) / (b - a), 0, 1))
cupW = 0.9 * sm_(0.3, 0.9, np.abs(lat)) * sm_(cupS - 0.05, cupS + 0.5 * span, s_v)
# the width axis of the rest frame is -X: lat > 0 is -X, the tongue's own right (looking from the root to the tip,
# top up); +X its left
left = lat < 0
twins = [b for b in range(nbn) if (Wc[:, b] * cupW).sum() > 2.0]
allnames = list(names)
cols = [Wc[:, b] for b in range(nbn)]
cups = []
for b in twins:
    share = Wc[:, b] * cupW
    cols[b] = Wc[:, b] - share
    for side, mask, sign in (('l', left, 1), ('r', ~left, -1)):
        allnames.append('cup_%s_%d' % (side, b)); cols.append(np.where(mask, share, 0.0))
        cups.append({'name': 'cup_%s_%d' % (side, b), 'joint': names[b], 'sign': sign})
W = np.stack(cols, 1)
W /= W.sum(1)[:, None]
for c in cups:
    eb = arm.edit_bones.new(c['name'])
    src_b = arm.edit_bones[c['joint']]
    eb.head = src_b.head.copy(); eb.tail = src_b.tail.copy(); eb.roll = src_b.roll
    eb.parent = src_b
bpy.ops.object.mode_set(mode='OBJECT')
print('cup twins on', [names[b] for b in twins])
for b, name in enumerate(allnames):
    vg = ob.vertex_groups.new(name=name)
    nz = np.where(W[:, b] > 1e-4)[0]
    for i in nz:
        vg.add([int(i)], float(W[i, b]), 'REPLACE')
mod = ob.modifiers.new('rig', 'ARMATURE')
mod.object = ao
ob.parent = ao

# --------------------------------------------------------------------------------------------------- 6. material
src = {}
old = me.materials[0] if me.materials else None
for n in (old.node_tree.nodes if old and old.node_tree else []):
    if n.type == 'TEX_IMAGE' and n.image:
        nm = os.path.basename(n.image.filepath).lower()
        key = 'color' if 'color' in nm else 'normal' if 'normal' in nm else 'rough' if 'rough' in nm else 'metal' if 'metal' in nm else None
        if key:
            src[key] = n.image


TMP = tempfile.mkdtemp(prefix='tongue-rig-')


def deglare(im):
    """Tripo bakes white glare and dark occlusion into the colour map; once the tongue moves they read as milky
    stains and dirty bands. Cap how pale a pixel may get (the pink keeps its hue), lift the darkest a little."""
    px = np.array(im.pixels[:], dtype=np.float32).reshape(-1, 4)
    r, g, b = px[:, 0], px[:, 1], px[:, 2]
    px[:, 1] = np.minimum(g, 0.62 * r)
    px[:, 2] = np.minimum(b, 0.66 * r)
    lum = 0.3 * px[:, 0] + 0.59 * px[:, 1] + 0.11 * px[:, 2]
    med = np.median(px[:, :3], axis=0)
    lm = 0.3 * med[0] + 0.59 * med[1] + 0.11 * med[2]
    k = (A['lift'] * np.clip(1 - lum / lm, 0, 1))[:, None]
    px[:, :3] += (med[None, :] - px[:, :3]) * k
    im.pixels[:] = px.ravel()


def inpaint(im):
    """Tripo baked a dark, spotty stain into the maps beside the model's small holes (on the underside, halfway along):
    fill a disc there smoothly from its surroundings (a harmonic fill, a soft edge)."""
    if not A['patch']:
        return
    u, v, r = A['patch']
    W, H = im.size
    px = np.array(im.pixels[:], dtype=np.float32).reshape(H, W, 4)
    cx, cy, R = u * W, v * H, r * W  # Blender's pixel rows run up from v = 0
    x0, x1 = int(max(0, cx - 2 * R)), int(min(W, cx + 2 * R))
    y0, y1 = int(max(0, cy - 2 * R)), int(min(H, cy + 2 * R))
    sub = px[y0:y1, x0:x1, :3].copy()
    yy, xx = np.mgrid[y0:y1, x0:x1]
    d = np.hypot(xx + 0.5 - cx, yy + 0.5 - cy) / R
    inside = d < 1.0
    f = sub.copy()
    f[inside] = sub[(d >= 1.0) & (d < 1.3)].mean(0)
    for it in range(int(R * R) + 200):  # Jacobi: the Laplace equation inside, the surroundings fixed
        avg = 0.25 * (np.roll(f, 1, 0) + np.roll(f, -1, 0) + np.roll(f, 1, 1) + np.roll(f, -1, 1))
        f[inside] = avg[inside]
    w = np.clip((1.0 - d) / 0.2, 0, 1)[..., None]
    px[y0:y1, x0:x1, :3] = sub * (1 - w) + f * w
    im.pixels[:] = px.ravel()


def small(img, px, name, colorspace, fix=None):
    """A downscaled copy, saved as a plain PNG and loaded back (so the exporter encodes that, not the original)."""
    im = img.copy()
    im.scale(px, px)
    if fix:
        fix(im)
    path = os.path.join(TMP, name + '.png')
    im.filepath_raw = path; im.file_format = 'PNG'; im.save()
    bpy.data.images.remove(im)
    out = bpy.data.images.load(path)
    out.name = name
    out.colorspace_settings.name = colorspace
    return out


mat = bpy.data.materials.new('tongue')
if mat.node_tree is None:
    mat.use_nodes = True
nt = mat.node_tree
for n in list(nt.nodes):
    nt.nodes.remove(n)
out = nt.nodes.new('ShaderNodeOutputMaterial')
bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
nt.links.new(bsdf.outputs[0], out.inputs[0])
def fix_color(im):
    if A['lift'] >= 0:
        deglare(im)
    inpaint(im)


tc = nt.nodes.new('ShaderNodeTexImage'); tc.image = small(src['color'], A['tex'], 'tongue_color', 'sRGB', fix_color)
nt.links.new(tc.outputs['Color'], bsdf.inputs['Base Color'])
tn = nt.nodes.new('ShaderNodeTexImage'); tn.image = small(src['normal'], A['tex'], 'tongue_normal', 'Non-Color', inpaint)
nm_ = nt.nodes.new('ShaderNodeNormalMap')
nt.links.new(tn.outputs['Color'], nm_.inputs['Color'])
nt.links.new(nm_.outputs['Normal'], bsdf.inputs['Normal'])
tr = nt.nodes.new('ShaderNodeTexImage'); tr.image = small(src['rough'], A['tex'] // 2, 'tongue_roughness', 'Non-Color')
nt.links.new(tr.outputs['Color'], bsdf.inputs['Roughness'])
bsdf.inputs['Metallic'].default_value = 0.0
bsdf.inputs['Coat Weight'].default_value = 1.0
bsdf.inputs['Coat Roughness'].default_value = 0.06
bsdf.inputs['Coat IOR'].default_value = 1.33
mat.use_backface_culling = True  # a closed mesh: single sided
me.materials.clear()
me.materials.append(mat)
for m in list(bpy.data.materials):
    if m is not mat:
        bpy.data.materials.remove(m)

# ------------------------------------------------------------------------------------------------------ extras
rig = {
    'about': 'SBHMN tongue rig. Units: bin units (1 ~ the bin height). glTF space: root at the origin, the tongue '
             'along +z, top +y. joints: chain root..tip, p = rest position, up = the top, hw/hh = half width/height '
             'of the tongue there, s = arclength from the root. tipEnd: the end of the chain. cups: twins of the '
             'front chain bones (same rest frame as their joint) holding the edges: roll one about its joint\'s '
             'along axis by sign * angle to lift that edge (cup the tip).',
    'length': round(float(Ltot), 4), 'stalk': round(float(stalkEnd), 4), 'scale': round(float(sigma), 4),
    'joints': joints, 'tipEnd': tipEnd, 'cups': cups,
}
for j in joints + [tipEnd] + cups:
    for k in ('p', 'up', 'tail'):
        if k in j:
            j[k] = [round(x, 5) for x in j[k]]
ao['rig'] = json.dumps(rig, separators=(',', ':'))
print('joints:', ', '.join('%s s=%.3f hw=%.3f hh=%.3f' % (j['name'], j['s'], j['hw'], j['hh']) for j in joints))

# ------------------------------------------------------------------------------------------------- debug renders
if A['render']:
    os.makedirs(A['render'], exist_ok=True)
    scn = bpy.context.scene
    scn.render.engine = 'BLENDER_WORKBENCH'
    scn.display.shading.light = 'STUDIO'
    scn.display.shading.color_type = 'TEXTURE'
    scn.render.resolution_x = 900; scn.render.resolution_y = 600
    cam_d = bpy.data.cameras.new('c'); cam_d.type = 'ORTHO'; cam_d.ortho_scale = Ltot * 1.15
    cam = bpy.data.objects.new('cam', cam_d); scn.collection.objects.link(cam); scn.camera = cam
    mid = Vector((0, -Ltot / 2, 0))
    def shot(name, d, up=(0, 0, 1)):
        cam.location = mid + Vector(d) * 3
        cam.rotation_euler = (-Vector(d)).to_track_quat('-Z', 'Y').to_euler()
        scn.render.filepath = os.path.join(A['render'], name + '.png')
        bpy.ops.render.render(write_still=True)
    shot('rest-side', (1, 0, 0)); shot('rest-top', (0, 0.001, 1)); shot('rest-persp', (0.7, 0.5, 0.6))
    # a test pose: bend every body bone up a little, cup the tip
    for pb in ao.pose.bones:
        pb.rotation_mode = 'XYZ'
        if pb.name.startswith('body_'):
            pb.rotation_euler = (0.32, 0, 0.05)
        if pb.name.startswith('cup_l'):
            pb.rotation_euler = (0, 0.6, 0)
        if pb.name.startswith('cup_r'):
            pb.rotation_euler = (0, -0.6, 0)
    bpy.context.view_layer.update()
    shot('pose-side', (1, 0, 0)); shot('pose-persp', (0.7, 0.5, 0.6)); shot('pose-front', (0, -1, 0.3))
    for pb in ao.pose.bones:
        pb.rotation_euler = (0, 0, 0)

# ------------------------------------------------------------------------------------------------------- export
for o in bpy.context.scene.objects:
    o.select_set(False)
bpy.ops.export_scene.gltf(
    filepath=A['out'], export_format='GLB', use_selection=False, export_yup=True, export_apply=False,
    export_texcoords=True, export_normals=True, export_tangents=False, export_materials='EXPORT',
    export_vertex_color='NONE', export_skins=True, export_influence_nb=4, export_def_bones=False,
    export_animations=False, export_morph=False, export_extras=True, export_cameras=False, export_lights=False,
    export_image_format=A['format'], export_image_quality=A['quality'], export_jpeg_quality=A['quality'],
    export_meshopt_compression_enable=A['meshopt'], export_meshopt_extension='EXT_meshopt_compression',
)
print('wrote', A['out'], os.path.getsize(A['out']), 'bytes')
shutil.rmtree(TMP, ignore_errors=True)
