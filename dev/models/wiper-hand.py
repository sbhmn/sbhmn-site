# The owner's wiper hand (a Tripo model: a forearm cut off above the wrist, holding a car's windscreen-wiper blade;
# FBX + base colour, dev/models/src/wiper-hand-tripo.zip) made into a rigged, web-sized GLB for the intro's wipe
# (assets/intro/wiper.js animates it procedurally; there is no baked clip).
#
#   "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b --factory-startup -P dev/models/wiper-hand.py -- [options]
#   or Blender as a Python module (pip install bpy==5.2.2):
#     python -c "import bpy, runpy, sys; sys.argv = ['wiper-hand.py', '--']; runpy.run_path('dev/models/wiper-hand.py', run_name='__main__')"
#   (paths go in the environment, not on the command line: the bpy module takes a bare path there for a .blend to open)
#     WIPER_SRC   the zip or the FBX (default dev/models/src/wiper-hand-tripo.zip)
#     WIPER_OUT   the GLB (default assets/3d/wiper-hand.glb)
#     WIPER_RENDER  a folder: also render the rest pose and a test pose there (Cycles), for a look
#     --tex PX      the colour map's size (default 1024)    --quality Q  WebP quality (default 86)
#     --decimate R  keep this share of the faces (default 0.55)    --plain  no meshopt compression (no gltfpack)
#     --cut R       cut the forearm off R forearm radii above the wrist (default 0: the model's whole forearm)
#
# What it does:
#   1. Imports the FBX and sorts its points into skin and wiper (the dark metal) by the colour map under them.
#   2. Finds the blade (the long straight run of metal: its axis, its ends, and its rubber edge, the side away from the
#      hand), the joint where the wiper's arm meets it (the blade's middle), the wrist (where the skin, going down the
#      forearm's axis, widens into the hand) and the forearm's cut end.
#   3. Turns it so the blade lies along X with its rubber edge on the origin facing +Z (glTF: toward the viewer: it is
#      the edge that touches the glass) and the hand behind it (-Z), and scales it so the blade is 1 long.
#   3b. With --cut: cuts the forearm off square a little above the wrist and closes it with a flat, skin-coloured end.
#   4. An armature: blade (the root, at the joint) > hand (joint to wrist) > arm (wrist to the cut), and fingers and thumb
#      (children of hand, at the knuckles). Weights: the blade's points all to blade; the forearm to arm, blended into
#      hand over the wrist; the fingers' and the thumb's ends (the skin well down from the wrist, either side of the
#      handle) to fingers / thumb, blended into hand toward the knuckles; the rest (the hand, the wiper's arm) to hand.
#      So turning hand swings everything but the blade about the joint (the blade stays flat on the glass), turning arm
#      bends the wrist, and turning fingers and thumb the other way about the handle's axis ("grip") squeezes it.
#   5. Decimated, smooth shaded, the colour map downscaled, one PBR material; GLB with the skin, no animation,
#      meshopt-compressed, quantized geometry (gltfpack -cc: EXT_meshopt_compression, KHR_mesh_quantization; load it
#      with GLTFLoader.setMeshoptDecoder; set GLTFPACK to its command if npx can't fetch it) and a WebP texture
#      (EXT_texture_webp). The armature carries the rig in its extras ("wiper": the blade's ends, the joint,
#      the wrist, the cut and the handle's axis in the fist ("grip"), glTF coordinates).
import bpy, bmesh, sys, os, math, json, tempfile, shutil, zipfile
import numpy as np
from mathutils import Matrix, Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
opt = lambda k, d: type(d)(a[a.index(k) + 1]) if k in a else d
A = {
    'src': os.environ.get('WIPER_SRC') or os.path.join(ROOT, 'dev', 'models', 'src', 'wiper-hand-tripo.zip'),
    'out': os.environ.get('WIPER_OUT') or os.path.join(ROOT, 'assets', '3d', 'wiper-hand.glb'),
    'render': os.environ.get('WIPER_RENDER'),
    'tex': opt('--tex', 1024), 'quality': opt('--quality', 86), 'decimate': opt('--decimate', 0.55), 'meshopt': '--plain' not in a,
    'cut': opt('--cut', 0.0),
}
TMP = tempfile.mkdtemp(prefix='wiper-')
src = A['src']
if src.lower().endswith('.zip'):
    with zipfile.ZipFile(src) as z:
        z.extractall(TMP)
    src = next(os.path.join(d, f) for d, _, fs in os.walk(TMP) for f in fs if f.lower().endswith('.fbx'))

# ------------------------------------------------------------------------------------------------------- import
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.import_scene.fbx(filepath=src)
ob = max((o for o in bpy.context.scene.objects if o.type == 'MESH'), key=lambda o: len(o.data.vertices))
for o in list(bpy.context.scene.objects):
    if o is not ob:
        bpy.data.objects.remove(o, do_unlink=True)
bpy.context.view_layer.objects.active = ob
ob.select_set(True)
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
img = max((i for i in bpy.data.images if i.size[0] > 1), key=lambda i: i.size[0])

# decimate first: everything below works on the final points
if A['decimate'] < 1:
    m = ob.modifiers.new('dec', 'DECIMATE'); m.ratio = A['decimate']
    bpy.ops.object.modifier_apply(modifier=m.name)
m = ob.modifiers.new('tri', 'TRIANGULATE')
bpy.ops.object.modifier_apply(modifier=m.name)
me = ob.data
P = np.array([v.co[:] for v in me.vertices])
uv = np.zeros((len(P), 2))
for poly in me.polygons:
    for li, vi in zip(poly.loop_indices, poly.vertices):
        uv[vi] = me.uv_layers[0].data[li].uv[:]
W_, H_ = img.size
px = np.array(img.pixels[:], dtype=np.float32).reshape(H_, W_, img.channels)
col = px[np.clip((uv[:, 1] * H_).astype(int), 0, H_ - 1), np.clip((uv[:, 0] * W_).astype(int), 0, W_ - 1), :3]
sat = col.max(1) - col.min(1)
skin = (sat > 0.12) & (col[:, 0] > col[:, 2])
metal = ~skin
print(f'{len(P)} points, {len(me.polygons)} triangles: {skin.sum()} skin, {metal.sum()} wiper', flush=True)


def pca(X):
    m = X.mean(0)
    u, s, vt = np.linalg.svd(X - m, full_matrices=False)
    return m, vt


# ------------------------------------------------------------------------------------------------------- find
# the blade: the wiper's metal furthest from the hand, a long straight run
hc = P[skin].mean(0)
dist = np.linalg.norm(P - hc, axis=1)
far = metal & (dist > np.percentile(dist[metal], 45))
mb, vt = pca(P[far])
ax = vt[0]
lat = np.linalg.norm((P - mb) - np.outer((P - mb) @ ax, ax), axis=1)
blade = metal & (lat < 0.6 * np.median(lat[far]) + 0.05 * np.ptp((P[far] - mb) @ ax))
t = (P[blade] - mb) @ ax
mid = mb + ax * (t.min() + t.max()) / 2
length = float(t.max() - t.min())
# its rubber edge: the side away from the hand
e = mid - hc
e -= ax * (e @ ax)
e /= np.linalg.norm(e)
# (the blade is a little curved and has flanges: by distance from a straight line its ends were missed. Everything of
# the wiper as near the glass as the blade's spine is the blade; the wiper's arm runs off behind it, toward the hand)
E = (P - mid) @ e
Ethr = E[blade].min() - 0.01 * length
blade = metal & (E > Ethr)
t = (P[blade] - mb) @ ax
edge = float(((P[blade] - mid) @ e).max())
back = float(((P[blade] - mid) @ e).min())
origin = mid + e * edge
joint = mid + e * back
# the forearm: the skin furthest from the blade; going along its axis toward the hand, the wrist is where it widens
dm = np.linalg.norm(P - mid, axis=1)
upper = skin & (dm > np.percentile(dm[skin], 60))
mf, vf = pca(P[upper])
fa = vf[0] if (mf - mid) @ vf[0] > 0 else -vf[0]  # pointing away from the blade, up the arm
ts = (P[skin] - mf) @ fa
rad = np.linalg.norm((P[skin] - mf) - np.outer(ts, fa), axis=1)
step = 0.03 * np.ptp(ts)
bins = np.arange(ts.min(), ts.max() + step, step)
radius = [(lo, float(rad[(ts >= lo) & (ts < lo + step)].mean())) for lo in bins if ((ts >= lo) & (ts < lo + step)).sum() > 8]
rf = float(np.median([r for lo, r in radius if lo > np.percentile(ts, 70)]))
tw = max(lo for lo, r in radius if r > 1.35 * rf and lo < np.percentile(ts, 80)) + step
wrist = mf + fa * tw
cut = mf + fa * float(ts.max())
print(f'blade {length:.3f} long, joint {joint.round(3)}, wrist {wrist.round(3)} (forearm radius {rf:.3f}), cut {cut.round(3)}', flush=True)

# ------------------------------------------------------------------------------------------------------- turn
# Blender: X = the blade, -Y = its edge's way (glTF +Z), Z = e x blade (glTF +Y)
R = np.array([ax, -e, np.cross(e, ax)])
if np.linalg.det(R) < 0:
    R[0] = -R[0]
k = 1 / length
place = lambda p: (R @ (np.asarray(p) - origin)) * k
Pn = (P - origin) @ R.T * k
for v, p in zip(me.vertices, Pn):
    v.co = p
me.update()
J, Wr, C = place(joint), place(wrist), place(cut)
ends = [place(mid + ax * t.min() + e * edge), place(mid + ax * t.max() + e * edge)]
bpy.ops.object.shade_smooth()

# ------------------------------------------------------------------------------------------------------- cut
# (--cut: the forearm cut off square a little above the wrist and closed with a flat end, one skin-coloured texel,
# flat shaded, where the model has a pointed cap. Then every point is sorted again: the cut made new ones. Off by
# default: the owner liked the whole forearm better.)
fa_n = (R @ fa); fa_n /= np.linalg.norm(fa_n)
CUT = A['cut'] * rf * k
if CUT > 0:
    bm = bmesh.new(); bm.from_mesh(me)
    uvl = bm.loops.layers.uv.active
    co = Vector(Wr + fa_n * CUT); no = Vector(fa_n)
    bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=co, plane_no=no, clear_outer=True)
    ring = [ed for ed in bm.edges if ed.is_boundary and all(abs((v.co - co).dot(no)) < 1e-4 for v in ed.verts)]
    isskin = lambda u: (lambda c: (c.max() - c.min()) > 0.12 and c[0] > c[2])(px[min(H_ - 1, max(0, int(u[1] * H_))), min(W_ - 1, max(0, int(u[0] * W_))), :3])
    uv0 = next((l[uvl].uv.copy() for ed in ring for v in ed.verts for l in v.link_loops if isskin(l[uvl].uv)), None)
    cap = bmesh.ops.holes_fill(bm, edges=ring, sides=0)['faces']
    for f in cap:
        f.smooth = False
        if uv0 is not None:
            for l in f.loops:
                l[uvl].uv = uv0
    bmesh.ops.triangulate(bm, faces=cap)
    bm.to_mesh(me); bm.free(); me.update()
    C = Wr + fa_n * CUT
    Pn = np.array([v.co[:] for v in me.vertices])
    uv = np.zeros((len(Pn), 2))
    for poly in me.polygons:
        for li, vi in zip(poly.loop_indices, poly.vertices):
            uv[vi] = me.uv_layers[0].data[li].uv[:]
    col = px[np.clip((uv[:, 1] * H_).astype(int), 0, H_ - 1), np.clip((uv[:, 0] * W_).astype(int), 0, W_ - 1), :3]
    sat = col.max(1) - col.min(1)
    skin = (sat > 0.12) & (col[:, 0] > col[:, 2])
    metal = ~skin
    blade = metal & (Pn[:, 1] < (edge - Ethr) * k)  # (E > Ethr, in the turned frame: Blender Y = -e)
    print(f'cut {CUT / (rf * k):.2f} forearm radii above the wrist: {len(Pn)} points, {int(skin.sum())} skin, {int(blade.sum())} blade', flush=True)

# the fingers and the thumb: the skin well down the hand from the wrist (past the knuckles), either side of the handle
# (of the plane through the handle's axis in the fist and the forearm's axis): fingers on one side, the thumb on the
# other. Each gets a bone at the knuckles that turns about the handle's axis, so the hand can squeeze it a touch.
s = (Pn - Wr) @ fa_n
handle = metal & ~blade
sk = Pn[skin]
hp = Pn[handle][np.array([np.linalg.norm(sk - q, axis=1).min() for q in Pn[handle]]) < 0.04]
hm, hvt = pca(hp)
hax = hvt[0]
side_n = np.cross(hax, fa_n); side_n /= np.linalg.norm(side_n)
side = (Pn - hm) @ side_n
ramp = lambda x, a, b: (lambda t: t * t * (3 - 2 * t))(np.clip((x - a) / (b - a), 0, 1))
tip = np.where(skin, ramp(-s, 0.16, 0.3), 0.0)
w_fing, w_thumb = tip * ramp(-side, 0.005, 0.035), tip * ramp(side, 0.005, 0.035)
band = skin & (-s > 0.12) & (-s < 0.2)
Kf, Kt = Pn[band & (side < -0.02)].mean(0), Pn[band & (side > 0.02)].mean(0)
Tf, Tt = Pn[w_fing > 0.9].mean(0), Pn[w_thumb > 0.9].mean(0)
print(f'fingers {int((w_fing > 0.5).sum())} points, thumb {int((w_thumb > 0.5).sum())}; handle axis {hax.round(3)}', flush=True)

# ------------------------------------------------------------------------------------------------------- rig
arm_d = bpy.data.armatures.new('wiperRig')
rig = bpy.data.objects.new('wiperRig', arm_d)
bpy.context.scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig
bpy.ops.object.mode_set(mode='EDIT')
b_blade = arm_d.edit_bones.new('blade'); b_blade.head = Vector(J); b_blade.tail = Vector(J + (Wr - J) * 0.25)
b_hand = arm_d.edit_bones.new('hand'); b_hand.head = Vector(J); b_hand.tail = Vector(Wr); b_hand.parent = b_blade
b_arm = arm_d.edit_bones.new('arm'); b_arm.head = Vector(Wr); b_arm.tail = Vector(C); b_arm.parent = b_hand; b_arm.use_connect = True
for name, head, tail in (('fingers', Kf, Tf), ('thumb', Kt, Tt)):
    b = arm_d.edit_bones.new(name); b.head = Vector(head); b.tail = Vector(tail); b.parent = b_hand
bpy.ops.object.mode_set(mode='OBJECT')
# weights: the blade's points to blade; along the forearm's axis, over the wrist, hand blends into arm
blend = np.clip((s / (0.45 * rf * k) + 1) / 2, 0, 1)
blend = blend * blend * (3 - 2 * blend)
w_arm = np.where(skin, blend, 0.0)
w_blade = blade.astype(float)
w_hand = 1 - w_arm - w_blade - w_fing - w_thumb
if os.environ.get('WIPER_DUMP'):
    np.savez(os.environ['WIPER_DUMP'], P=Pn, skin=skin, metal=metal, blade=blade, F=np.array([p.vertices[:] for p in me.polygons]),
             J=J, Wr=Wr, C=C, fa=fa_n, rf=rf * k, col=col)
for name, w in (('blade', w_blade), ('hand', w_hand), ('arm', w_arm), ('fingers', w_fing), ('thumb', w_thumb)):
    g = ob.vertex_groups.new(name=name)
    for i in np.nonzero(w > 1e-4)[0]:
        g.add([int(i)], float(w[i]), 'REPLACE')
ob.parent = rig
md = ob.modifiers.new('rig', 'ARMATURE'); md.object = rig

# ------------------------------------------------------------------------------------------------------- material
img.scale(A['tex'], A['tex'])
mat = bpy.data.materials.new('wiperHand'); mat.use_nodes = True
nt = mat.node_tree
for n in list(nt.nodes):
    nt.nodes.remove(n)
out = nt.nodes.new('ShaderNodeOutputMaterial')
bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = img
nt.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
bsdf.inputs['Roughness'].default_value = 0.62
bsdf.inputs['Metallic'].default_value = 0.0
nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
me.materials.clear(); me.materials.append(mat)
ob.name = 'wiperHand'
gl = lambda p: [round(float(p[0]), 4), round(float(p[2]), 4), round(float(-p[1]), 4)]  # Blender -> glTF
rig['wiper'] = json.dumps({'ends': [gl(p) for p in ends], 'joint': gl(J), 'wrist': gl(Wr), 'cut': gl(C),
                           'grip': gl(hax), 'bones': ['blade', 'hand', 'arm', 'fingers', 'thumb']})

# ------------------------------------------------------------------------------------------------------- render
if A['render']:
    os.makedirs(A['render'], exist_ok=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 16; sc.cycles.device = 'CPU'
    sc.render.resolution_x = sc.render.resolution_y = 420
    w = bpy.data.worlds.new('w'); w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (0.9, 0.9, 0.9, 1); sc.world = w
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam')); sc.collection.objects.link(cam); sc.camera = cam
    sun = bpy.data.objects.new('sun', bpy.data.lights.new('sun', 'SUN')); sun.data.energy = 3; sc.collection.objects.link(sun)
    sun.rotation_euler = (math.radians(40), math.radians(10), math.radians(30))
    ctr = Vector(Pn.mean(0)); d = float(np.ptp(Pn, 0).max()) * 2.4

    def shot(name, dirn):
        cam.location = ctr + Vector(dirn).normalized() * d
        cam.rotation_euler = (ctr - cam.location).to_track_quat('-Z', 'Z' if abs(dirn[2]) < 0.9 else 'Y').to_euler()
        sc.render.filepath = os.path.join(A['render'], name + '.png')
        bpy.ops.render.render(write_still=True)
    # glTF +Z (the glass, the viewer) is Blender -Y
    for n, dirn in (('rest-front', (0, -1, 0.05)), ('rest-side', (1, 0, 0)), ('rest-top', (0.01, 0, 1)), ('rest-persp', (0.6, -0.6, 0.5))):
        shot(n, dirn)
    pb = rig.pose.bones
    pb['hand'].rotation_mode = 'XYZ'; pb['hand'].rotation_euler = (math.radians(25), 0, math.radians(15))
    pb['arm'].rotation_mode = 'XYZ'; pb['arm'].rotation_euler = (math.radians(-30), 0, 0)
    bpy.context.view_layer.update()
    shot('pose-front', (0, -1, 0.05)); shot('pose-persp', (0.6, -0.6, 0.5))
    for b in pb:
        b.rotation_euler = (0, 0, 0)

# ------------------------------------------------------------------------------------------------------- export
for o in bpy.context.scene.objects:
    o.select_set(False)
raw = os.path.join(TMP, 'wiper-hand-raw.glb') if A['meshopt'] else A['out']
bpy.ops.export_scene.gltf(
    filepath=raw, export_format='GLB', use_selection=False, export_yup=True, export_apply=False,
    export_texcoords=True, export_normals=True, export_tangents=False, export_materials='EXPORT',
    export_vertex_color='NONE', export_skins=True, export_influence_nb=4, export_def_bones=False,
    export_animations=False, export_morph=False, export_extras=True, export_cameras=False, export_lights=False,
    export_image_format='WEBP', export_image_quality=A['quality'],
    export_meshopt_compression_enable=False,
)
# meshopt (and quantized) geometry: gltfpack (Blender's own meshopt export needs a library the bpy wheels lack), keeping
# the bones' names and the rig's extras; the WebP texture goes through as it is
if A['meshopt']:
    import subprocess, shlex
    cmd = shlex.split(os.environ.get('GLTFPACK') or 'npx --yes gltfpack@1.3.0')
    subprocess.run(cmd + ['-i', raw, '-o', A['out'], '-cc', '-kn', '-ke'], check=True, shell=os.name == 'nt')
print('wrote', A['out'], os.path.getsize(A['out']), 'bytes', flush=True)
shutil.rmtree(TMP, ignore_errors=True)
