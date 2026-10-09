# The intro's paper: a real A4 sheet, crumpled into a ball, baked as stop-motion poses (glTF morph targets).
#
#   "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" -b --factory-startup -P dev/models/paper.py -- [options]
#     --seed N        the crumple and its crease network (default 11)
#     --res R         mesh spacing in metres (default 0.0052: 1910 vertices, 3624 triangles)
#     --bake-only     skip the simulation: re-pick and re-write the poses from the last run's cache (seconds)
#     --raw N         debug: write N evenly spaced raw frames of the unfold as targets (no pose design; PAPER_RAWRANGE a:b)
#     --net           debug: write the crease network and mesh as an SVG beside the cache, and stop
#     --test          check the hinge gradient against finite differences and stop
#   Environment (defaults = the shipped bake): PAPER_OUT (write elsewhere: the GLBs and the JSON go together),
#   PAPER_CACHE (the simulation cache, default %TEMP%/sbhmn-paper-<seed>.npz), PAPER_* tuning knobs (see Sheet,
#   crumple, bake). About a minute on a desktop CPU; deterministic (the same seed gives the same files).
#
# Writes assets/3d/paper.glb (333 KB; mesh "paper": the flat sheet + 17 poses as morph targets + attribute _wet),
# assets/3d/paper-ball.glb (31 KB; pose 0 alone, its visible layers only, quantized: the throw's ball) and
# assets/3d/paper.json (names, timing, shading, sizes; its "prints" belong to dev/paper-shots.cjs and are kept).
# Played by assets/intro/paper.js; looked at in dev/lab-paper.html.
#
# HOW: Blender is used for its constrained Delaunay triangulation (mathutils) and its BVH ray casts; the sheet is
# simulated here in numpy.
#   - The crease network first: real crumpled paper, smoothed out, shows a web of STRAIGHT crease lines (a few long ones
#     from the first big folds, shorter ones branching off them) with flat facets between. So the mesh is built on such
#     a web: random long lines and branches, cut into each other, as constrained edges of the triangulation.
#   - The sheet can't stretch (edge lengths held by Gauss-Seidel projection). Its hinges bend and creases are PLASTIC
#     (bent past a yield angle, a hinge keeps its new rest angle and gets weaker). Hinges on the web's lines are weak
#     and crease early; the facets between are stiff with a high yield: they stay flat, or crease only when forced.
#     That gives long sharp ridges between flat panels: paper, not cloth or foil.
#   - Crumpled by a shrinking, lumpy, turning ellipsoid (two hands) plus a pull toward the middle early on (so the
#     inside folds too), with self-collision; then the hands loosen and the ball settles.
#   - The bake: crumple a fresh page once (A) so the web learns its folds (mountain or valley, how deep); lay that page
#     nearly flat (C: a crumpled page smoothed out by hand); crumple C again (B), along its creases, into the ball.
#     B played backwards is the unfold, ending on C.
#   - De-rotated: every frame is turned (Kabsch) to best match the next one, back from C matched to the flat sheet. So
#     no tumble is baked in: the paper opens in place and the late poses face +z, upright; the player adds the spin.
#   - Poses are picked along the unfold by how much the shape changes (bigger steps where it bursts open), plus four
#     evenly timed poses through the flattening (no jump from cupped to flat); each is denoised (Taubin smoothing off
#     the crease web: no triangle-sized buckles, creases kept sharp). Then the landing: 'slap' (creases pressed to 45%)
#     and 'settle' (15%) on the exact flat outline; the base mesh, perfectly flat, is the last frame.
#   - _wet: how much of each point was on the ball's outside (ray casts from all round): the spit's damp patches.
import sys, os, math, json, struct, time, tempfile
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
W, H = 0.297, 0.21  # A4 landscape, metres = mesh units


def cli():
    a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    def opt(k, d):
        return type(d)(a[a.index(k) + 1]) if k in a else d
    return {'seed': opt('--seed', 11), 'res': opt('--res', 0.0052), 'raw': opt('--raw', 0), 'test': '--test' in a,
            'bake_only': '--bake-only' in a, 'net': '--net' in a}


def env(k, d):
    return type(d)(os.environ.get(k, d))


# ----------------------------------------------------------------------------------------------- the crease network
def crease_network(rng, n_long, n_branch, n_star):
    """Straight segments on the sheet: n_long lines across (most of) it, n_branch shorter ones each starting on an
    earlier segment and heading off at an angle (a crease runs until it meets another)."""
    def clip(p, d):
        ts = []
        for ax, half, other in ((0, W / 2, H / 2), (1, H / 2, W / 2)):
            if abs(d[ax]) > 1e-9:
                for s in (-half, half):
                    t = (s - p[ax]) / d[ax]
                    if abs(p[1 - ax] + t * d[1 - ax]) <= other + 1e-9:
                        ts.append(t)
        return min(ts), max(ts)
    segs = []
    for _ in range(n_long):
        p = rng.uniform([-W * 0.4, -H * 0.4], [W * 0.4, H * 0.4])
        a = rng.uniform(0, math.pi)
        d = np.array([math.cos(a), math.sin(a)])
        t0, t1 = clip(p, d)
        L = t1 - t0
        keep = L * rng.uniform(0.6, 1.0)
        st = t0 + rng.uniform(0, L - keep)
        segs.append((p + st * d, p + (st + keep) * d))

    def nearest(q):
        best = (1e9, None, None)
        for a0, a1 in segs:
            d = a1 - a0
            t = float(np.clip(np.dot(q - a0, d) / (np.dot(d, d) + 1e-12), 0.05, 0.95))
            p = a0 + t * d
            dist = float(np.linalg.norm(q - p))
            if dist < best[0]:
                best = (dist, p, d)
        return best

    def first_hit(p, d, tmax, tmin):
        """Distance along p + t d (tmin < t < tmax) to the first existing segment it crosses."""
        best = tmax
        for a0, a1 in segs:
            e = a1 - a0
            den = d[0] * e[1] - d[1] * e[0]
            if abs(den) < 1e-12:
                continue
            w = a0 - p
            t = (w[0] * e[1] - w[1] * e[0]) / den
            u = (w[0] * d[1] - w[1] * d[0]) / den
            if tmin < t < best and 0 <= u <= 1:
                best = t
        return best
    # Branches fill the gaps: aim at a random spot, start from the nearest crease, at an angle to it, and run until
    # meeting another crease (mostly: creases end on creases, closing the facets) or out to the spot and a bit beyond.
    for _ in range(n_branch):
        q = rng.uniform([-W / 2, -H / 2], [W / 2, H / 2])
        dist, p, dseg = nearest(q)
        if dist < 0.006:
            continue
        d = (q - p) / dist
        base = math.atan2(dseg[1], dseg[0])
        a = math.atan2(d[1], d[0])
        rel = (a - base + math.pi) % (2 * math.pi) - math.pi  # keep it at least ~30 degrees off its parent
        if abs(rel) < 0.5 or abs(rel) > math.pi - 0.5:
            a = base + math.copysign(rng.uniform(0.5, 1.4), rel if abs(rel) < math.pi / 2 else -rel)
            d = np.array([math.cos(a), math.sin(a)])
        _, tmax = clip(p, d)
        L = min(tmax, dist * rng.uniform(1.0, 1.6) + 0.01)
        if rng.uniform() < 0.75:
            L = first_hit(p, d, L, 0.012)
        segs.append((p, p + L * d))
    # Stars: points where several creases meet (the tips of the cones a crumple pushes in), 3-5 rays each.
    for _ in range(n_star):
        p = rng.uniform([-W * 0.45, -H * 0.45], [W * 0.45, H * 0.45])
        a0 = rng.uniform(0, 2 * math.pi)
        m = int(rng.integers(3, 6))
        for j in range(m):
            a = a0 + 2 * math.pi * j / m + rng.uniform(-0.35, 0.35)
            d = np.array([math.cos(a), math.sin(a)])
            _, tmax = clip(p, d)
            L = min(tmax, rng.uniform(0.02, 0.06))
            if rng.uniform() < 0.6:
                L = first_hit(p, d, L, 0.006)
            segs.append((p.copy(), p + L * d))
    return segs


def arrange(segs, r, eps):
    """The segments cut into each other: points every ~r along every piece between crossings, and the edges between
    them. Points closer than 0.35 r are merged (so no slivers where creases cross at a slant)."""
    n = len(segs)
    A = np.array([s[0] for s in segs]); B = np.array([s[1] for s in segs])
    cuts = [[0.0, 1.0] for _ in range(n)]
    for i in range(n):
        d1 = B[i] - A[i]
        for j in range(i + 1, n):
            d2 = B[j] - A[j]
            den = d1[0] * d2[1] - d1[1] * d2[0]
            if abs(den) < 1e-12:
                continue
            w = A[j] - A[i]
            t = (w[0] * d2[1] - w[1] * d2[0]) / den
            u = (w[0] * d1[1] - w[1] * d1[0]) / den
            tol_i, tol_j = eps / (np.linalg.norm(d1) + 1e-12), eps / (np.linalg.norm(d2) + 1e-12)
            if -tol_i <= t <= 1 + tol_i and -tol_j <= u <= 1 + tol_j:
                cuts[i].append(min(1.0, max(0.0, t))); cuts[j].append(min(1.0, max(0.0, u)))
    pts, edges = [], []
    for i in range(n):
        ts = sorted(set(cuts[i]))
        L = np.linalg.norm(B[i] - A[i])
        tt = [0.0]
        for a, b in zip(ts[:-1], ts[1:]):
            m = max(1, int(round((b - a) * L / r)))
            tt += [a + (b - a) * k / m for k in range(1, m + 1)]
        first = len(pts)
        pts += [A[i] + t * (B[i] - A[i]) for t in tt]
        edges += [(first + k, first + k + 1) for k in range(len(tt) - 1)]
    pts = np.array(pts)
    # merge near points (grid hash)
    cell = 0.35 * r
    key = {}
    rep = np.arange(len(pts))
    for i, p in enumerate(pts):
        c = (int(math.floor(p[0] / cell)), int(math.floor(p[1] / cell)))
        hit = None
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for j in key.get((c[0] + dx, c[1] + dy), ()):
                    if np.sum((pts[j] - p) ** 2) < cell * cell:
                        hit = j; break
                if hit is not None: break
            if hit is not None: break
        if hit is None:
            key.setdefault(c, []).append(i)
        else:
            rep[i] = hit
    keep = np.unique(rep)
    newi = -np.ones(len(pts), int); newi[keep] = np.arange(len(keep))
    out = set()
    for a, b in edges:
        a, b = newi[rep[a]], newi[rep[b]]
        if a != b:
            out.add((min(a, b), max(a, b)))
    return pts[keep], sorted(out)


def poisson_points(r, rng, seeds):
    """Boundary points every ~r (corners exact), then Poisson-disc points (min distance r) around the given seed
    points (the crease web)."""
    nbx, nby = int(round(W / r)), int(round(H / r))
    pts = []
    for i in range(nbx + 1):
        x = -W / 2 + W * i / nbx
        pts += [(x, -H / 2), (x, H / 2)]
    for j in range(1, nby):
        y = -H / 2 + H * j / nby
        pts += [(-W / 2, y), (W / 2, y)]
    nb = len(pts)
    cs = r / math.sqrt(2)
    grid = {}
    cell = lambda p: (int((p[0] + W / 2) // cs), int((p[1] + H / 2) // cs))

    def free(p, rr=r):
        cx, cy = cell(p)
        for dx in range(-2, 3):
            for dy in range(-2, 3):
                for q in grid.get((cx + dx, cy + dy), ()):
                    if (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 < rr * rr:
                        return False
        return True
    for p in pts:
        grid.setdefault(cell(p), []).append(p)
    web = []
    for p in seeds:
        p = (float(p[0]), float(p[1]))
        if abs(p[0]) > W / 2 - 0.4 * r or abs(p[1]) > H / 2 - 0.4 * r:
            # a web point on (or by) the sheet's edge: snap it onto the edge, drop it if a boundary point is close
            p = (min(W / 2, max(-W / 2, p[0])), min(H / 2, max(-H / 2, p[1])))
            if abs(abs(p[0]) - W / 2) < 0.4 * r: p = (math.copysign(W / 2, p[0]), p[1])
            if abs(abs(p[1]) - H / 2) < 0.4 * r: p = (p[0], math.copysign(H / 2, p[1]))
            if not free(p, 0.45 * r):
                web.append(None); continue
        web.append(len(pts)); pts.append(p); grid.setdefault(cell(p), []).append(p)
    m = 0.6 * r
    active = [p for p in pts[nb:]] or [(0.0, 0.0)]
    while active:
        i = int(rng.integers(len(active)))
        p = active[i]
        for _ in range(30):
            a, d = rng.uniform(0, 2 * math.pi), rng.uniform(r, 1.6 * r)
            c = (p[0] + d * math.cos(a), p[1] + d * math.sin(a))
            if abs(c[0]) > W / 2 - m or abs(c[1]) > H / 2 - m or not free(c):
                continue
            pts.append(c); grid.setdefault(cell(c), []).append(c); active.append(c)
            break
        else:
            active.pop(i)
    return pts, web


def build_mesh(r, rng):
    from mathutils import Vector
    from mathutils.geometry import delaunay_2d_cdt
    segs = crease_network(rng, env('PAPER_LONG', 8), env('PAPER_BRANCH', 130), env('PAPER_STAR', 12))
    wp, we = arrange(segs, 0.9 * r, 1e-7)
    pts, web = poisson_points(r, rng, wp)
    cons = [(web[a], web[b]) for a, b in we if web[a] is not None and web[b] is not None]
    vo, eo, fo, ov, oe, of = delaunay_2d_cdt([Vector(p) for p in pts], cons, [], 0, 1e-9, True)
    P = np.array([(v.x, v.y) for v in vo], dtype=np.float64)
    F = np.array(fo, dtype=np.int64)
    a = P[F[:, 1]] - P[F[:, 0]]; b = P[F[:, 2]] - P[F[:, 0]]
    area = a[:, 0] * b[:, 1] - a[:, 1] * b[:, 0]
    F[area < 0] = F[area < 0][:, [0, 2, 1]]
    F = F[np.abs(area) > 1e-10]
    ncons = len(cons)
    crease = set()
    for e, orig in zip(eo, oe):
        if any(o < ncons for o in orig):
            crease.add((min(e), max(e)))
    # Spatial order (rows of the page) keeps the index buffer cache-friendly.
    order = np.lexsort((P[:, 0], np.round((P[:, 1] + H / 2) / r)))
    inv = np.empty_like(order); inv[order] = np.arange(len(order))
    crease = {(min(inv[i], inv[j]), max(inv[i], inv[j])) for i, j in crease}
    return P[order], inv[F], crease, segs


def topology(F, N):
    de = np.concatenate([F[:, [0, 1]], F[:, [1, 2]], F[:, [2, 0]]])
    opp = np.concatenate([F[:, 2], F[:, 0], F[:, 1]])
    key = np.minimum(de[:, 0], de[:, 1]) * N + np.maximum(de[:, 0], de[:, 1])
    order = np.argsort(key, kind='stable')
    uniq, start, count = np.unique(key[order], return_index=True, return_counts=True)
    E = np.stack([uniq // N, uniq % N], 1)
    h = start[count == 2]
    a, b = order[h], order[h + 1]
    hinges = np.stack([de[a, 0], de[a, 1], opp[a], opp[b]], 1)  # i, j (edge, as in triangle A), k (A's tip), l (B's)
    assert np.all(de[b, 0] == de[a, 1]) and np.all(de[b, 1] == de[a, 0]), 'mesh not consistently oriented'
    return E, hinges


def color_edges(E, N):
    """Greedy edge colouring: no two edges of a colour share a vertex, so a colour projects in parallel (Gauss-Seidel)."""
    col = np.full(len(E), -1)
    used = [set() for _ in range(N)]
    for idx, (i, j) in enumerate(E):
        c = 0
        while c in used[i] or c in used[j]:
            c += 1
        col[idx] = c; used[i].add(c); used[j].add(c)
    return [np.where(col == c)[0] for c in range(col.max() + 1)]


# ------------------------------------------------------------------------------------------------------ the hinges
def hinge_geometry(x, hg):
    x1, x2, x3, x4 = x[hg[:, 0]], x[hg[:, 1]], x[hg[:, 2]], x[hg[:, 3]]
    e = x2 - x1
    nA = np.cross(e, x3 - x1)
    nB = np.cross(x4 - x1, e)
    el2 = np.einsum('ij,ij->i', e, e) + 1e-30
    el = np.sqrt(el2)
    th = np.arctan2(np.einsum('ij,ij->i', np.cross(nA, nB), e) / el, np.einsum('ij,ij->i', nA, nB))
    gA = -(el / (np.einsum('ij,ij->i', nA, nA) + 1e-30))[:, None] * nA
    gB = -(el / (np.einsum('ij,ij->i', nB, nB) + 1e-30))[:, None] * nB
    t3 = (np.einsum('ij,ij->i', x3 - x1, e) / el2)[:, None]
    t4 = (np.einsum('ij,ij->i', x4 - x1, e) / el2)[:, None]
    G = np.stack([-(1 - t3) * gA - (1 - t4) * gB, -t3 * gA - t4 * gB, gA, gB], 1)  # (H, 4, 3) dtheta/dx
    return th, G


def wrap(a):
    return (a + math.pi) % (2 * math.pi) - math.pi


def gradient_test():
    rng = np.random.default_rng(1)
    x = rng.normal(size=(4, 3))
    hg = np.array([[0, 1, 2, 3]])
    th, G = hinge_geometry(x, hg)
    num = np.zeros((4, 3))
    for v in range(4):
        for c in range(3):
            xp = x.copy(); xp[v, c] += 1e-6
            xm = x.copy(); xm[v, c] -= 1e-6
            num[v, c] = wrap(hinge_geometry(xp, hg)[0][0] - hinge_geometry(xm, hg)[0][0]) / 2e-6
    print('theta', th, '\nanalytic\n', G[0], '\nnumeric\n', num, '\nmax err', np.abs(G[0] - num).max())


# ------------------------------------------------------------------------------------------------------ the sheet
class Sheet:
    def __init__(s, P, F, crease, rng):
        s.rng = rng
        s.N = len(P)
        s.F = F
        s.X0 = np.c_[P, np.zeros(s.N)]
        s.x = s.X0.copy()
        s.v = np.zeros_like(s.x)
        s.E, s.hg = topology(F, s.N)
        s.L0 = np.linalg.norm(s.X0[s.E[:, 1]] - s.X0[s.E[:, 0]], axis=1)
        s.edge = float(np.mean(s.L0))
        s.ecol = color_edges(s.E, s.N)
        s.th0 = np.zeros(len(s.hg))
        s.plast = np.zeros(len(s.hg))
        s.hidx = s.hg.T.reshape(-1)  # vertex of each (slot, hinge) for bincount
        # material, per hinge: the web's lines are weak and crease at once; the facets between are stiff and crease
        # only when bent hard (then they soften, so a new crease, once started, runs)
        s.on_web = np.array([(min(i, j), max(i, j)) in crease for i, j in s.hg[:, :2]])
        s.kb0 = np.where(s.on_web, env('PAPER_KB_WEB', 0.08), env('PAPER_KB', 0.6))
        s.soft = np.where(s.on_web, 0.5, env('PAPER_SOFT', 0.15))
        s.yld = np.where(s.on_web, env('PAPER_YIELD_WEB', 0.06), env('PAPER_YIELD', 0.5))
        s.p0 = 0.35
        s.thmax = 0.93 * math.pi
        s.plastic_on = True
        s.dt = 1 / 240
        s.damp = 0.965
        s.h = 0.0026        # self-collision distance
        s.contact = np.zeros(s.N, bool)

    # constraints -----------------------------------------------------------------------------------------------
    def stretch(s, x, w=1.0):
        E, L0 = s.E, s.L0
        for idx in s.ecol:
            i, j = E[idx, 0], E[idx, 1]
            d = x[j] - x[i]
            L = np.sqrt(np.einsum('ij,ij->i', d, d)) + 1e-12
            c = (w * 0.5 * (L - L0[idx]) / L)[:, None] * d
            x[i] += c
            x[j] -= c

    def kb(s):
        return s.kb0 * (s.soft + (1 - s.soft) * np.exp(-s.plast / s.p0))

    def bend(s, x, scale=1.0):
        th, G = hinge_geometry(x, s.hg)
        C = s.kb() * scale * wrap(th - s.th0)
        over = np.abs(th) - s.thmax
        C = C + np.where(over > 0, np.sign(th) * over * 0.6, 0.0)
        den = np.einsum('hkc,hkc->h', G, G) + 1e-12
        lam = -C / den
        D = lam[:, None, None] * G                       # (H, 4, 3)
        cap = 0.2 * s.edge
        mag = np.linalg.norm(D, axis=2).max(1)
        D *= np.minimum(1.0, cap / (mag + 1e-12))[:, None, None]
        Dt = D.transpose(1, 0, 2).reshape(-1, 3)
        for c in range(3):
            x[:, c] += np.bincount(s.hidx, Dt[:, c], s.N)

    def pairs(s, x, h):
        c = np.floor(x / h).astype(np.int64)
        c -= c.min(0) - 1
        dims = c.max(0) + 2
        key = (c[:, 0] * dims[1] + c[:, 1]) * dims[2] + c[:, 2]
        order = np.argsort(key, kind='stable'); sk = key[order]
        I, J = [], []
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for dz in (-1, 0, 1):
                    nk = key + (dx * dims[1] + dy) * dims[2] + dz
                    lo = np.searchsorted(sk, nk, 'left'); hi = np.searchsorted(sk, nk, 'right')
                    cnt = hi - lo
                    tot = int(cnt.sum())
                    if not tot:
                        continue
                    ii = np.repeat(np.arange(s.N), cnt)
                    off = np.arange(tot) - np.repeat(np.cumsum(cnt) - cnt, cnt)
                    jj = order[np.repeat(lo, cnt) + off]
                    m = ii < jj
                    I.append(ii[m]); J.append(jj[m])
        if not I:
            return None
        I = np.concatenate(I); J = np.concatenate(J)
        d = x[J] - x[I]
        m = np.einsum('ij,ij->i', d, d) < (1.5 * h) ** 2
        I, J = I[m], J[m]
        rest = np.linalg.norm(s.X0[J] - s.X0[I], axis=1)
        m = rest > 1.35 * s.edge          # sheet neighbours are the stretch/bend constraints' business
        return (I[m], J[m]) if m.any() else None

    def collide(s, x, pr, h):
        I, J = pr
        d = x[J] - x[I]
        L = np.sqrt(np.einsum('ij,ij->i', d, d)) + 1e-12
        pen = h - L
        m = pen > 0
        if not m.any():
            return
        I, J, d, L, pen = I[m], J[m], d[m], L[m], pen[m]
        c = (0.5 * pen / L)[:, None] * d
        idx = np.concatenate([I, J]); cc = np.concatenate([-c, c])
        n = np.bincount(idx, minlength=s.N).astype(float)
        n = np.maximum(n, 1)
        for k in range(3):
            x[:, k] += np.bincount(idx, cc[:, k], s.N) / n

    def confine(s, x, conf):
        R, A, ctr, k = conf['R'], conf['A'], conf['c'], conf.get('k', 0.5)
        y = (x - ctr) @ R                          # ellipsoid frame
        d = y / (np.linalg.norm(y, axis=1, keepdims=True) + 1e-12)
        lump = np.ones(s.N)
        for (u, amp, wdt) in conf.get('lumps', ()):
            lump += amp * np.exp((d @ u - 1) / wdt)
        q = np.linalg.norm(y / A, axis=1) / lump
        out = q > 1
        if out.any():
            x[out] += k * ((x[out] - ctr) / q[out, None] + ctr - x[out])
        s.contact |= out

    def press(s, x, zmax):
        np.clip(x[:, 2], -zmax, zmax, out=x[:, 2])

    # one step ------------------------------------------------------------------------------------------------------
    def step(s, conf, iters=10):
        dt = s.dt
        s.v *= s.damp
        if conf.get('kick'):
            s.v += conf['kick'](s)
        x = s.x + s.v * dt
        h = conf.get('h', s.h)
        pr = s.pairs(x, h) if conf.get('collide', True) else None
        s.contact[:] = False
        for it in range(iters):
            if conf.get('on'):
                s.confine(x, conf)
            if conf.get('zmax') is not None:
                s.press(x, conf['zmax'])
            if pr is not None:
                s.collide(x, pr, h)
            s.bend(x, conf.get('bend', 1.0))
            s.stretch(x)
        s.stretch(x)
        s.v = (x - s.x) / dt
        if s.contact.any():
            s.v[s.contact] *= conf.get('grip', 0.35)
        s.x = x
        if s.plastic_on and conf.get('plastic', True):
            th, _ = hinge_geometry(x, s.hg)
            d = wrap(th - s.th0)
            over = np.abs(d) - s.yld
            m = over > 0
            s.th0[m] += np.sign(d[m]) * over[m]
            np.clip(s.th0, -s.thmax, s.thmax, out=s.th0)
            s.plast[m] += over[m]

    def strain(s):
        L = np.linalg.norm(s.x[s.E[:, 1]] - s.x[s.E[:, 0]], axis=1)
        return float(np.abs(L / s.L0 - 1).mean()), float(np.abs(L / s.L0 - 1).max())


def rot(axis, ang):
    axis = np.asarray(axis, float); axis /= np.linalg.norm(axis)
    K = np.array([[0, -axis[2], axis[1]], [axis[2], 0, -axis[0]], [-axis[1], axis[0], 0]])
    return np.eye(3) + math.sin(ang) * K + (1 - math.cos(ang)) * K @ K


def smooth(t, a, b):
    t = min(1.0, max(0.0, (t - a) / (b - a)))
    return t * t * (3 - 2 * t)


def kick_field(rng, X0, amp):
    """A smooth random velocity field over the sheet (a few long waves), re-rolled now and then: hands, air."""
    ks = rng.normal(size=(5, 2)) * 22.0
    ph = rng.uniform(0, 2 * math.pi, 5)
    dirs = rng.normal(size=(5, 3))
    f = np.zeros((len(X0), 3))
    for k, p, dv in zip(ks, ph, dirs):
        f += np.sin(X0[:, :2] @ k + p)[:, None] * dv
    return f * amp / 5


def crumple(s, frames, r_end, rng, record=False, substeps=3, log='', release=0.2, pull=0.0, kick_amp=0.05, loosen=0.0,
            press=None):
    """Squeeze the sheet in a shrinking lumpy ellipsoid that turns as it goes (two hands), with an optional pull of every
    point toward the middle (so the inside folds too, not only what touches the hands), then let go (the last
    `release` part of the frames) and let it spring back a little."""
    out = []
    axis, axis2 = rng.normal(size=3), rng.normal(size=3)
    spin = rng.uniform(1.2, 2.0)
    lumps = [(v / np.linalg.norm(v), a, w) for v, a, w in zip(rng.normal(size=(7, 3)), rng.uniform(-0.16, 0.16, 7), rng.uniform(0.15, 0.4, 7))]
    aniso0 = np.array([0.88, 1.0, 1.0])
    ctr = s.x.mean(0)
    r_start = float(np.linalg.norm(s.x - ctr, axis=1).max()) * 1.04
    kick = kick_field(rng, s.X0, kick_amp)
    t0 = time.time()
    squeeze_end = 1 - release
    for f in range(frames):
        t = f / (frames - 1)
        u = min(1.0, t / squeeze_end)
        r = r_end + (r_start - r_end) * (1 - u) ** 1.6
        an = aniso0 + (np.array([1.0, 0.92, 1.08]) - aniso0) * smooth(u, 0.15, 0.7)
        R = rot(axis, spin * u) @ rot(axis2, 0.6 * math.sin(3.1 * u))
        if f % 25 == 0:
            kick = kick_field(rng, s.X0, kick_amp * (1 - u) + 0.01)
        on = t <= squeeze_end
        h = float(np.clip(0.0026 * (r / 0.07) ** 0.5, 0.0014, 0.0026))
        rel = smooth(t, squeeze_end, squeeze_end + 0.35 * release)
        A = r * an * (1 + loosen * rel)
        def push(sh, k=kick, on=on, r=r):
            dv = k.copy() if on else np.zeros_like(sh.x)
            pw = pull * (1 - smooth(u, 0.55, 0.75))
            if on and pw:
                d = sh.x - ctr
                dist = np.linalg.norm(d, axis=1, keepdims=True) + 1e-9
                g = pw * np.clip(dist / r - 0.35, 0, None)
                dv -= g * d / dist * sh.dt
            return dv
        conf = {'on': True, 'R': R, 'A': A, 'c': ctr, 'lumps': lumps if u > 0.5 else (), 'h': h, 'kick': push,
                'grip': 0.3 if on else 0.6, 'k': 0.5 if on else 0.25}
        if press is not None and f < press[1]:
            conf['zmax'] = press[0] + 0.12 * smooth(f / press[1], 0, 1) ** 2
        s.damp = 0.965 if on else 0.9
        for _ in range(substeps):
            s.step(conf)
        if record:
            out.append(s.x.copy())
        if f % 40 == 0 or f == frames - 1:
            sm, sx = s.strain()
            rad = np.linalg.norm(s.x - s.x.mean(0), axis=1)
            print(f'{log} frame {f:4d}/{frames} r={r:.4f} h={h*1000:.2f}mm  ball r(mean,max)={rad.mean():.4f},{rad.max():.4f}  '
                  f'strain mean {sm*100:.2f}% max {sx*100:.1f}%  creased web {np.mean(s.plast[s.on_web] > 0.05)*100:.0f}% '
                  f'facets {np.mean(s.plast[~s.on_web] > 0.05)*100:.0f}%/{np.mean(s.plast[~s.on_web] > 0.4)*100:.0f}%  {time.time()-t0:.0f}s', flush=True)
    s.damp = 0.965
    return out


def lay_flat(s, th0, plast, alpha, frames=80, zmax=0.005):
    """The crumpled page smoothed out on a table: its creases kept at `alpha` of their angle, the sheet held in a slab
    2 * zmax thick (a hand pressing it flat), so it lies crinkled but nearly flat."""
    s.x = s.X0.copy()
    s.x[:, 2] += s.rng.normal(size=s.N) * 1e-4
    s.v[:] = 0
    s.th0 = th0 * alpha
    s.plast = plast.copy()
    keep = s.plastic_on
    s.plastic_on = False
    for f in range(frames):
        conf = {'zmax': zmax, 'collide': True, 'h': 0.0018, 'plastic': False}
        for _ in range(3):
            s.step(conf, iters=8)
    s.plastic_on = keep
    s.v[:] = 0
    return s.x.copy()


# ------------------------------------------------------------------------------------------------------ analysis
def kabsch(Pm, Q):
    """The rotation R (det +1) that best turns centred points Pm onto centred points Q: Pm @ R.T ~ Q."""
    U, S, Vt = np.linalg.svd(Pm.T @ Q)
    d = np.sign(np.linalg.det(Vt.T @ U.T))
    return Vt.T @ np.diag([1, 1, d]) @ U.T


def derotate(frames, X0):
    """Every frame centred and turned to best match the next one; the last (the creased page) matched to the flat sheet."""
    out = [None] * len(frames)
    q = X0 - X0.mean(0)
    for i in range(len(frames) - 1, -1, -1):
        p = frames[i] - frames[i].mean(0)
        out[i] = p @ kabsch(p, q).T
        q = out[i]
    return out


def rays_from_outside(x, F, ndir=160, grid=56):
    """Orthographic ray grids from ndir directions all round: for each triangle, how many rays hit it first; for each
    direction, the outermost-skin distance from the centre (for the core)."""
    from mathutils import Vector
    from mathutils.bvhtree import BVHTree
    c = x.mean(0)
    xc = x - c
    R = float(np.linalg.norm(xc, axis=1).max()) * 1.05
    bvh = BVHTree.FromPolygons([Vector(v) for v in xc], [tuple(int(i) for i in f) for f in F], all_triangles=True)
    k = np.arange(ndir) + 0.5
    phi = np.arccos(1 - 2 * k / ndir); th = math.pi * (1 + 5 ** 0.5) * k
    D = np.stack([np.cos(th) * np.sin(phi), np.sin(th) * np.sin(phi), np.cos(phi)], 1)
    hits = np.zeros(len(F))
    skin = []
    g = (np.arange(grid) + 0.5) / grid * 2 - 1
    for d in D:
        a = np.cross(d, [0, 0, 1] if abs(d[2]) < 0.9 else [1, 0, 0]); a /= np.linalg.norm(a)
        b = np.cross(d, a)
        dv = Vector(-d)
        for u in g:
            for v in g:
                o = d * 2 * R + (u * a + v * b) * R
                loc, nor, idx, dist = bvh.ray_cast(Vector(o), dv, 4 * R)
                if idx is not None:
                    hits[idx] += 1
        loc, nor, idx, dist = bvh.ray_cast(Vector(d * 2 * R), dv, 4 * R)  # through the centre
        skin.append(2 * R - dist if idx is not None else 0.0)
    return hits, np.array(skin)


def holes(x, F, n=1500):
    """How closed the ball is: rays from its centre in n directions; the share whose outermost hit is deep inside
    (under 75% of the typical radius) or missing, i.e. where you would see into or through the ball."""
    from mathutils import Vector
    from mathutils.bvhtree import BVHTree
    c = x.mean(0)
    bvh = BVHTree.FromPolygons([Vector(v) for v in x - c], [tuple(int(i) for i in f) for f in F], all_triangles=True)
    k = np.arange(n) + 0.5
    phi = np.arccos(1 - 2 * k / n); th = math.pi * (1 + 5 ** 0.5) * k
    D = np.stack([np.cos(th) * np.sin(phi), np.sin(th) * np.sin(phi), np.cos(phi)], 1)
    R = float(np.linalg.norm(x - c, axis=1).max()) * 1.1
    best = np.zeros(n)
    for i, d in enumerate(D):
        loc, nor, idx, dist = bvh.ray_cast(Vector(d * R), Vector(-d), 2 * R)
        best[i] = R - dist if idx is not None else 0.0
    med = np.median(best)
    return float(np.mean(best < 0.75 * med)), float(med)


# ------------------------------------------------------------------------------------------------------ glTF
class Glb:
    def __init__(s):
        s.chunks, s.views, s.accs, s.off = [], [], [], 0

    def view(s, b, target=None, stride=None):
        pad = (-len(b)) % 4
        v = {'buffer': 0, 'byteOffset': s.off, 'byteLength': len(b)}
        if target: v['target'] = target
        if stride: v['byteStride'] = stride
        s.views.append(v); s.chunks.append(b + b'\0' * pad); s.off += len(b) + pad
        return len(s.views) - 1

    def acc(s, **a):
        s.accs.append(a)
        return len(s.accs) - 1

    def write(s, path, gltf):
        gltf.update({'buffers': [{'byteLength': s.off}], 'bufferViews': s.views, 'accessors': s.accs})
        js = json.dumps(gltf, separators=(',', ':')).encode()
        js += b' ' * ((-len(js)) % 4)
        binb = b''.join(s.chunks)
        with open(path, 'wb') as fh:
            fh.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(binb)))
            fh.write(struct.pack('<II', len(js), 0x4E4F534A)); fh.write(js)
            fh.write(struct.pack('<II', len(binb), 0x004E4942)); fh.write(binb)
        return 12 + 16 + len(js) + len(binb)


def write_paper_glb(path, P, F, targets, names, wet):
    """One mesh 'paper': POSITION (the flat sheet, z = 0), TEXCOORD_0 (three.js convention: v up), _WET (float),
    uint16 indices, and the poses as morph targets: POSITION deltas, normalized SHORT (KHR_mesh_quantization)."""
    N = len(P)
    g = Glb()
    pos = np.c_[P, np.zeros(N)].astype(np.float32)
    uv = np.c_[(P[:, 0] + W / 2) / W, (P[:, 1] + H / 2) / H].astype(np.float32)
    a_pos = g.acc(bufferView=g.view(pos.tobytes(), 34962), componentType=5126, count=N, type='VEC3', min=pos.min(0).tolist(), max=pos.max(0).tolist())
    a_uv = g.acc(bufferView=g.view(uv.tobytes(), 34962), componentType=5126, count=N, type='VEC2')
    a_wet = g.acc(bufferView=g.view(wet.astype(np.float32).tobytes(), 34962), componentType=5126, count=N, type='SCALAR')
    a_idx = g.acc(bufferView=g.view(F.astype(np.uint16).reshape(-1).tobytes(), 34963), componentType=5123, count=F.size, type='SCALAR')
    tg = []
    for T in targets:
        delta = (T - pos).astype(np.float64)
        assert np.abs(delta).max() < 1.0
        q = np.round(delta * 32767).astype(np.int16)
        q4 = np.zeros((N, 4), np.int16); q4[:, :3] = q  # SHORT VEC3 = 6 bytes; vertex strides are multiples of 4
        tg.append({'POSITION': g.acc(bufferView=g.view(q4.tobytes(), 34962, 8), componentType=5122, normalized=True, count=N,
                                     type='VEC3', min=q.min(0).astype(int).tolist(), max=q.max(0).astype(int).tolist())})
    gltf = {
        'asset': {'version': '2.0', 'generator': 'sbhmn dev/models/paper.py'},
        'extensionsUsed': ['KHR_mesh_quantization'], 'extensionsRequired': ['KHR_mesh_quantization'],
        'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'name': 'paper', 'mesh': 0}],
        'meshes': [{'name': 'paper', 'primitives': [{'attributes': {'POSITION': a_pos, 'TEXCOORD_0': a_uv, '_WET': a_wet},
                                                       'indices': a_idx, 'targets': tg, 'mode': 4}],
                    'weights': [0.0] * len(tg), 'extras': {'targetNames': names}}],
    }
    return g.write(path, gltf)


def write_ball_glb(path, X, P, F):
    """The ball alone (no morphs, dry: no _wet): pose 0's positions, the flat sheet's UVs, only the given triangles.
    Quantized (KHR_mesh_quantization): positions normalized SHORT with the node's scale to restore them, UVs
    normalized UNSIGNED_SHORT. About 30 KB."""
    used = np.unique(F)
    remap = -np.ones(len(X), int); remap[used] = np.arange(len(used))
    n = len(used)
    g = Glb()
    S = float(np.abs(X[used]).max()) * 1.0001
    q = np.zeros((n, 4), np.int16); q[:, :3] = np.round(X[used] / S * 32767)
    uvf = np.c_[(P[used, 0] + W / 2) / W, (P[used, 1] + H / 2) / H]
    uq = np.round(np.clip(uvf, 0, 1) * 65535).astype(np.uint16)
    a_pos = g.acc(bufferView=g.view(q.tobytes(), 34962, 8), componentType=5122, normalized=True, count=n, type='VEC3',
                  min=q[:, :3].min(0).astype(int).tolist(), max=q[:, :3].max(0).astype(int).tolist())
    a_uv = g.acc(bufferView=g.view(uq.tobytes(), 34962), componentType=5123, normalized=True, count=n, type='VEC2')
    idx = remap[F].astype(np.uint16).reshape(-1)
    a_idx = g.acc(bufferView=g.view(idx.tobytes(), 34963), componentType=5123, count=idx.size, type='SCALAR')
    gltf = {
        'asset': {'version': '2.0', 'generator': 'sbhmn dev/models/paper.py'},
        'extensionsUsed': ['KHR_mesh_quantization'], 'extensionsRequired': ['KHR_mesh_quantization'],
        'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'name': 'paperBall', 'mesh': 0, 'scale': [S, S, S]}],
        'meshes': [{'name': 'paperBall', 'primitives': [{'attributes': {'POSITION': a_pos, 'TEXCOORD_0': a_uv}, 'indices': a_idx, 'mode': 4}]}],
    }
    return g.write(path, gltf), n, len(F)


def svg_network(path, P, F, crease, segs):
    s = 3000
    f = lambda p: (f'{(p[0] + W / 2) * s:.1f}', f'{(H / 2 - p[1]) * s:.1f}')
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W*s:.0f}" height="{H*s:.0f}"><rect width="100%" height="100%" fill="#fff"/>']
    for t in F:
        a, b, c = (f(P[i]) for i in t)
        out.append(f'<polygon points="{a[0]},{a[1]} {b[0]},{b[1]} {c[0]},{c[1]}" fill="none" stroke="#ccc" stroke-width="0.6"/>')
    for i, j in crease:
        a, b = f(P[i]), f(P[j])
        out.append(f'<line x1="{a[0]}" y1="{a[1]}" x2="{b[0]}" y2="{b[1]}" stroke="#c00" stroke-width="2.5"/>')
    out.append('</svg>')
    open(path, 'w').write('\n'.join(out))


# ------------------------------------------------------------------------------------------------------ main
def main():
    o = cli()
    if o['test']:
        gradient_test(); return
    out = os.environ.get('PAPER_OUT') or os.path.join(ROOT, 'assets', '3d', 'paper.glb')
    cache = os.environ.get('PAPER_CACHE') or os.path.join(tempfile.gettempdir(), f"sbhmn-paper-{o['seed']}.npz")
    if o['bake_only']:
        z = np.load(cache)
        P, F, unfold = z['P'], z['F'], list(z['unfold'].astype(np.float64))
        crease = {(int(a), int(b)) for a, b in z['C']}
        print(f'cache {cache}: {len(P)} vertices, {len(F)} triangles, {len(unfold)} frames', flush=True)
    else:
        rng = np.random.default_rng(o['seed'])
        P, F, crease, segs = build_mesh(o['res'], rng)
        print(f'mesh: {len(P)} vertices, {len(F)} triangles, {len(crease)} web edges ({len(segs)} creases)', flush=True)
        if o['net']:
            svg_network(cache.replace('.npz', '.svg'), P, F, crease, segs); print('net ->', cache.replace('.npz', '.svg')); return
        s = Sheet(P, F, crease, rng)
        print(f'edges {len(s.E)} hinges {len(s.hg)} ({int(s.on_web.sum())} on the web) colours {len(s.ecol)} mean edge {s.edge*1000:.2f} mm', flush=True)
        pull, kick = env('PAPER_PULL', 8.0), env('PAPER_KICK', 0.04)
        r_end = env('PAPER_REND', 0.033)
        # A: crumple a fresh page once: the web learns its folds
        s.x[:, 2] += kick_field(rng, s.X0, 0.002)[:, 2] + rng.normal(size=s.N) * 2e-4
        crumple(s, env('PAPER_FA', 220), r_end, rng, log='A', pull=pull, kick_amp=kick)
        thA, plA = s.th0.copy(), s.plast.copy()
        # C: that page smoothed out flat: the crease network, shallow
        xC = lay_flat(s, thA, plA, env('PAPER_ALPHA', 0.3))
        print(f'C: laid flat, z range {np.ptp(xC[:, 2])*1000:.1f} mm, outline {np.ptp(xC[:, 0])*1000:.0f} x {np.ptp(xC[:, 1])*1000:.0f} mm', flush=True)
        # B: crumple the creased page again (it folds along its creases): the frames, reversed, are the unfold
        framesB = crumple(s, env('PAPER_FB', 260), r_end, rng, record=True, log='B', pull=pull, kick_amp=kick, press=(0.005, 36))
        unfold = ([xC] + framesB)[::-1]
        np.savez_compressed(cache, P=P, F=F, C=np.array(sorted(crease), np.int64).reshape(-1, 2), unfold=np.array(unfold, np.float32))
        print('cache ->', cache, flush=True)
    if o['raw']:
        al = derotate(unfold, np.c_[P, np.zeros(len(P))])
        a, b = (int(v) for v in os.environ.get('PAPER_RAWRANGE', f'0:{len(al) - 1}').split(':'))
        sel = np.linspace(a, b, o['raw']).round().astype(int)
        n = write_paper_glb(out, P, F, [al[i] for i in sel], [f'raw{i:03d}' for i in sel], np.zeros(len(P)))
        print('raw frames', list(sel), '->', out, n, 'bytes')
        return
    bake(P, F, crease, unfold, out, o['seed'])


def pick(al, fracs, gamma):
    """Frames (unfold order, de-rotated) -> indices at the given fractions of the total visible change. The change of a
    step = what the eye catches (90th percentile of how far the points move) relative to the paper's size ** gamma."""
    d = [0.0]
    for a, b in zip(al[:-1], al[1:]):
        size = np.linalg.norm(b, axis=1).mean()
        d.append(float(np.percentile(np.linalg.norm(b - a, axis=1), 90)) / size ** gamma)
    cum = np.cumsum(d); cum /= cum[-1]
    idx = [int(np.argmin(np.abs(cum - f))) for f in fracs]
    for i in range(1, len(idx)):  # strictly increasing
        idx[i] = max(idx[i], idx[i - 1] + 1)
    return idx, cum


def denoise(x, sh, iters, lam=0.5, mu=-0.53):
    """Calm a pose's triangle-sized buckles (what a squeeze leaves on an irregular mesh: flat shaded, a curved panel
    shows them as a mosaic) and keep its shape and creases: Taubin smoothing (no shrinking) of every point off the
    crease web, then lengths restored and layers kept apart. The panels read flat or smoothly bent, the creases sharp."""
    N = len(x)
    E = sh.E
    fixed = np.zeros(N, bool)
    fixed[sh.hg[sh.on_web][:, :2].reshape(-1)] = True
    deg = np.bincount(E[:, 0], minlength=N) + np.bincount(E[:, 1], minlength=N)
    y = x.copy()
    pr = sh.pairs(y, 0.0016)
    for _ in range(iters):
        for f in (lam, mu):
            acc = np.zeros_like(y)
            for c in range(3):
                acc[:, c] = np.bincount(E[:, 0], y[E[:, 1], c], N) + np.bincount(E[:, 1], y[E[:, 0], c], N)
            d = acc / np.maximum(deg, 1)[:, None] - y
            d[fixed] = 0
            y += f * d
        for _ in range(3):
            if pr is not None:
                sh.collide(y, pr, 0.0016)
            sh.stretch(y)
    return y - y.mean(0)


def bake(P, F, crease, unfold, out, seed):
    X0 = np.c_[P, np.zeros(len(P))]
    al = derotate(unfold, X0)
    # The unfold, in visible change from the ball (0) to the creased page (1): bigger steps where it bursts open, finer
    # where it eases through the middle. Then the flattening (the last stretch, seen closest: the paper is filling the
    # screen by then) gets PAPER_TAIL poses evenly spaced in time, so the page doesn't jump from cupped to flat.
    fr = json.loads(os.environ.get('PAPER_FRACS', '[0, 0.05, 0.13, 0.22, 0.32, 0.42, 0.52, 0.62, 0.71, 0.8]'))
    idx, cum = pick(al, fr, env('PAPER_GAMMA', 0.3))
    tail = env('PAPER_TAIL', 4)
    last = len(al) - 1
    idx += [int(round(idx[-1] + (last - idx[-1]) * (j + 1) / (tail + 1))) for j in range(tail)] + [last]
    sh = Sheet(P, F, crease, np.random.default_rng(0))
    dn = env('PAPER_DENOISE', 10)
    poses = [denoise(al[i], sh, dn // 3 if j == 0 else dn) if dn else al[i] for j, i in enumerate(idx)]
    n_open = len(poses) - 2
    names = ['ball'] + [f'open{k:02d}' for k in range(1, n_open + 1)] + ['creased']
    xC = al[-1]
    # The landing. Built on the exact flat outline (so the sheet's edges sit where the flat sheet's will), with the
    # crease relief's height only: 'slap' = it hits, the creases pressed to 45%; 'settle' = 15%. (The player adds the
    # overshoot: a touch too big and turned on the slap, back past home on the settle.)
    relief = xC[:, 2] - xC[:, 2].mean()
    slap = X0.copy(); slap[:, 2] = 0.45 * relief
    settle = X0.copy(); settle[:, 2] = 0.15 * relief
    poses += [slap, settle]; names += ['slap', 'settle']
    T = len(poses)
    ball = poses[0]
    rad = np.linalg.norm(ball, axis=1)
    ball_r = float(np.median(np.sort(rad)[-max(10, len(rad) // 8):]))  # the outer skin
    # The ball from outside: which triangles show (the throw's small ball keeps those and their neighbours), how much of
    # each point was outside (the spit's damp patches), and how big a core fits inside the outer skin.
    t0 = time.time()
    hits, skin = rays_from_outside(ball, F)
    hole, med = holes(ball, F)
    vis = hits > 0
    vhit = np.zeros(len(P))
    np.maximum.at(vhit, F.reshape(-1), np.repeat(hits, 3))
    wet = np.clip(vhit / max(1.0, np.percentile(vhit[vhit > 0], 70)), 0, 1)
    E, _ = topology(F, len(P))
    for _ in range(3):  # soften over the sheet (its neighbours on the flat page)
        acc = np.zeros(len(P)); cnt = np.zeros(len(P))
        np.add.at(acc, E[:, 0], wet[E[:, 1]]); np.add.at(acc, E[:, 1], wet[E[:, 0]])
        np.add.at(cnt, E[:, 0], 1); np.add.at(cnt, E[:, 1], 1)
        wet = 0.5 * wet + 0.5 * acc / np.maximum(cnt, 1)
    wet = np.clip(wet * 1.3, 0, 1)
    ballF = F[vis]  # the throw's ball: only what shows from outside (the core fills any pinhole)
    core_r = float(0.9 * np.percentile(skin[skin > 0], 4))
    print(f'ball: radius {ball_r:.4f}, {hole*100:.1f}% of directions see into it, {vis.mean()*100:.0f}% of triangles '
          f'visible, core radius {core_r:.4f}  ({time.time()-t0:.0f}s)', flush=True)
    nbytes = write_paper_glb(out, P, F, poses, names, wet)
    ball_path = os.path.join(os.path.dirname(out), 'paper-ball.glb')
    bbytes, bv, bt = write_ball_glb(ball_path, ball, P, ballF)
    # Stop motion at 12 fps, holds in frames. The ball sits in the mouth, twitches open and snaps shut (anticipation),
    # bursts open on ones (big steps), eases through the middle on twos, flattens on ones as it reaches the screen,
    # slaps down, settles, lies flat (-1 = the base mesh). 'short' skips poses for a ~1.4 s spit.
    k = {name: i for i, name in enumerate(names)}
    o = lambda i: k[f'open{i:02d}']
    nm = len(fr) - 1  # open01 .. open<nm>: the picked part; the rest (the tail) is the flattening
    land = [[k['creased'], 1], [k['slap'], 2], [k['settle'], 2], [-1, 3]]
    full = ([[0, 3], [o(1), 1], [0, 2]] + [[o(i), 1] for i in range(1, 5)] + [[o(i), 2] for i in range(5, nm)]
            + [[o(i), 1] for i in range(nm, n_open + 1)] + land)
    short = ([[0, 1], [o(1), 1], [0, 1], [o(2), 1], [o(4), 1], [o(6), 2], [o(nm - 1), 1], [o(nm), 1]]
             + [[o(i), 1] for i in range(nm + 2, n_open + 1, 2)] + [[k['creased'], 1], [k['slap'], 1], [k['settle'], 2], [-1, 2]])
    unlit = [0.0] * T
    unlit[k['creased']] = 0.05; unlit[k['slap']] = 0.25; unlit[k['settle']] = 0.6
    jp = out.replace('.glb', '.json')
    try:
        old = json.load(open(jp))
    except Exception:
        old = {}
    info = {
        'mesh': 'paper',
        'version': 2,
        'targets': T,
        'names': names,
        'fps': 12,
        'sequences': {'short': short, 'full': full},
        'landingPose': k['slap'],
        'unlit': unlit,
        'ballRadius': round(ball_r, 4),
        'core': {'radius': round(core_r, 4), 'poses': [0]},
        'sheet': [W, H],
        'vertices': len(P),
        'triangles': len(F),
        'ball': {'file': 'paper-ball.glb', 'vertices': bv, 'triangles': bt},
        'orientation': 'Base mesh = the flat sheet, A4 landscape 0.297 x 0.21 units, centred on the origin in the XY '
                       'plane, printed side facing +Z. UV (0,0) = bottom-left, (1,1) = top-right (three.js convention, '
                       'v up: TextureLoader with the default flipY). Morph targets = the poses, one-hot, positions only '
                       '(flatShading): 0 = the ball ... creased, slap, settle; all influences 0 = the perfectly flat '
                       'sheet. Poses are centred on the origin and de-rotated (no tumble baked in; the late poses face '
                       '+Z, upright). Sequences are [pose, frames] at fps, pose -1 = the flat sheet. unlit[k]: 0 = lit '
                       'paper, 1 = the plain print. Played by assets/intro/paper.js.',
        'prints': old.get('prints', []),
        'seed': seed,
        'frames': idx,
    }
    with open(jp, 'w') as fh:
        json.dump(info, fh, indent=1)
    print(f'baked {T} poses from unfold frames {idx}: {out} ({nbytes} bytes), {ball_path} ({bbytes} bytes, {bt} of {len(F)} '
          f'triangles), short {sum(f for _, f in short)} frames, full {sum(f for _, f in full)} frames', flush=True)


if __name__ == '__main__':
    main()
