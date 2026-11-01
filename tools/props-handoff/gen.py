#!/usr/bin/env python3
"""Dense Emberhold decor generator (box-only preview). Reads mapdump.json, writes props-dense.json.
Every prop: {type, variant, x, y, block}. Rules follow the brief: clustered placement,
clear zones around gameplay features, no overlap with sky/cliffs/other props."""
import json, math, random, sys
import numpy as np
from scipy import ndimage

SEED = int(sys.argv[1]) if len(sys.argv) > 1 else 7
rng = random.Random(SEED)
D = json.load(open('mapdump.json'))
JOBS = json.load(open('dashjobs-eh.json'))
W, H, T = D['w'], D['h'], D['tile']
C = 4; GW, GH = W * T // C, H * T // C
arr = lambda k: np.array(D[k], dtype=np.int16).reshape(H, W)
blocked, path, stair, apron, ash, bridge, height, face = (arr(k) for k in
    ['blocked', 'path', 'stair', 'apron', 'ash', 'bridge', 'height', 'face'])
zones = np.array(D['zones']).reshape(H, W)
ground4 = np.array(D['ground4'], dtype=bool).reshape(GH, GW)   # terrain only
walk4 = np.array(D['walk4'], dtype=bool).reshape(GH, GW)       # with current props
opensky = (blocked == 1) & (face == 0) & (height < 0)
DT = ndimage.distance_transform_edt(ground4) * 4  # px to nearest non-ground cell
GAP = 12  # a gap the hero can pass is either closed (<=1px) or comfortably open (>=GAP px)

# ---------- sprite metrics per variant: (w, h, anchor_x, anchor_y, footprint radius) ----------
ART = {
 # trees (canopy)
 'tree_oak': (64, 80, 32, 63, 16), 'tree_pine': (64, 80, 32, 63, 16), 'tree_birch': (32, 64, 15, 47, 10),
 'tree_oak_b': (32, 48, 16, 31, 10), 'tree_pine_b': (32, 48, 16, 31, 10), 'tree_birch_b': (32, 64, 15, 47, 10),
 'tree_apple': (32, 64, 15, 47, 10),
 'bush': (16, 16, 8, 14, 8), 'bush_b': (16, 16, 8, 14, 8), 'bush_c': (16, 16, 8, 14, 8), 'bush_d': (16, 16, 8, 14, 8), 'bush_e': (16, 16, 8, 14, 8),
 'rock': (16, 16, 8, 13, 7), 'rock_b': (16, 16, 8, 13, 7), 'rock_c': (16, 16, 8, 13, 7), 'rock_round': (16, 16, 8, 13, 7),
 'pebble': (16, 16, 8, 13, 5), 'rock_cluster': (16, 16, 8, 13, 7), 'rock_moss_sm': (16, 16, 8, 13, 5), 'rock_moss_sm_b': (16, 16, 8, 13, 5),
 'boulder': (32, 32, 16, 28, 13),
 'stump': (16, 16, 8, 13, 7), 'stump_b': (16, 16, 8, 13, 7), 'log': (32, 16, 16, 13, 13), 'log_b': (32, 16, 16, 13, 13),
 'mushroom_red': (16, 16, 8, 12, 5), 'mushroom_purple': (16, 16, 8, 12, 5), 'mushroom_blue': (16, 16, 8, 12, 5),
 'mushroom_tan': (16, 16, 8, 13, 5), 'mushroom_tan_sm': (16, 16, 8, 13, 4), 'mushroom_pair': (16, 16, 8, 12, 5),
 'mushroom_tiny_red': (16, 16, 8, 10, 3), 'mushroom_tiny_purple': (16, 16, 8, 10, 3),
 'fern': (16, 16, 8, 13, 6), 'fern_b': (16, 16, 8, 13, 6), 'bud_red': (16, 16, 8, 12, 4), 'bud_purple': (16, 16, 8, 12, 4), 'bud_blue': (16, 16, 8, 12, 4),
 'tuft': (16, 16, 8, 13, 5), 'tuft_b': (16, 16, 8, 13, 5), 'tuft_c': (16, 16, 8, 13, 5),
 'flower': (16, 16, 8, 12, 5), 'flower_gold': (16, 16, 8, 12, 5), 'flower_tide': (16, 16, 8, 12, 5), 'blossom': (16, 16, 8, 12, 5),
 'flower_tide_b': (16, 16, 8, 12, 5), 'flower_tide_c': (16, 16, 8, 12, 6), 'daisy': (16, 16, 8, 12, 5), 'daisy_b': (16, 16, 8, 12, 6),
 'flower_white': (16, 16, 8, 12, 5), 'flower_white_b': (16, 16, 8, 12, 6), 'flower_pink': (16, 16, 8, 12, 5), 'flower_pink_b': (16, 16, 8, 12, 6),
 'flower_gold_b': (16, 16, 8, 12, 5), 'flower_gold_c': (16, 16, 8, 12, 6),
 'wild_red': (16, 16, 8, 14, 5), 'wild_pink': (16, 16, 8, 14, 5), 'wild_violet': (16, 16, 8, 14, 5), 'wild_gold': (16, 16, 8, 14, 5), 'wild_blue': (16, 16, 8, 14, 5),
 'wild_pair_red': (16, 16, 8, 14, 6), 'wild_pair_pink': (16, 16, 8, 14, 6), 'wild_pair_violet': (16, 16, 8, 14, 6), 'wild_pair_gold': (16, 16, 8, 14, 6), 'wild_pair_blue': (16, 16, 8, 14, 6),
}
TYPE_OF = lambda v: ('tree' if v.startswith('tree') else 'bush' if v.startswith('bush') else
    'rock' if v.startswith(('rock', 'pebble', 'boulder')) else 'stump' if v.startswith('stump') else
    'log' if v.startswith('log') else 'mushroom' if v.startswith('mushroom') else
    'plant' if v.startswith(('fern', 'bud')) else 'tuft' if v.startswith('tuft') else 'flower')
BLOCK = {'tree': 8, 'bush': 6}
def block_of(v):
    if v == 'boulder': return 10
    return BLOCK.get(TYPE_OF(v), 0)
BIG = {'tree_oak', 'tree_pine'}

# ---------- existing props (footprints) ----------
EXIST_R = {'tree': 14, 'bush': 8, 'rock': 7, 'stump': 7, 'log': 13, 'tuft': 5, 'flower': 5, 'stones': 10, 'stake': 8, 'fence_up': 8}
placed = []   # (x, y, r, variant or kind, new?)
for p in D['props']:
    if p['kind'] in ('cottage', 'airship'): continue
    placed.append((p['x'], p['y'], EXIST_R.get(p['kind'], 8), p['kind'], False))

# ---------- clearance masks on the 4px grid (True = forbidden for that class) ----------
gx = (np.arange(GW) * C + 2)[None, :]
gy = (np.arange(GH) * C + 2)[:, None]
def tile_to_grid(m):
    return np.kron(m.astype(bool), np.ones((T // C, T // C), dtype=bool))
def dilate(m, px):
    if px <= 0: return m.copy()
    r = int(math.ceil(px / C)); yy, xx = np.mgrid[-r:r + 1, -r:r + 1]
    return ndimage.binary_dilation(m, structure=(xx * xx + yy * yy) <= r * r)
def circle(cx, cy, r):
    return (gx - cx) ** 2 + (gy - cy) ** 2 < r * r
def rect(x, y, w, h, m=0):
    return (gx >= x - m) & (gx < x + w + m) & (gy >= y - m) & (gy < y + h + m)
def capsule(ax, ay, bx, by, r):
    vx, vy = bx - ax, by - ay; L2 = vx * vx + vy * vy or 1
    t = np.clip(((gx - ax) * vx + (gy - ay) * vy) / L2, 0, 1)
    return (gx - ax - t * vx) ** 2 + (gy - ay - t * vy) ** 2 < r * r

pathG, stairG, apronG, ashG, bridgeG = (tile_to_grid(m) for m in (path, stair, apron, ash, bridge))
zoneG = np.kron(zones, np.ones((T // C, T // C), dtype=object)) if False else None
def zone_at(x, y):
    tx, ty = int(x // T), int(y // T)
    return zones[ty, tx] if 0 <= tx < W and 0 <= ty < H else 'hush'

Z = {}  # zone rects from the tmj (dock, rope, scar, ledge, hookledge, lip)
for name, rs in {'dock': [(1248, 1056, 288, 272)], 'rope': [(1360, 1312, 64, 160)],
                 'scar': [(1632, 736, 512, 256), (1680, 656, 416, 416), (1760, 640, 256, 480), (1632, 592, 256, 64)],
                 'perch': [(1120, 1488, 544, 112), (1168, 1440, 448, 208), (1264, 1424, 256, 240)],
                 'hookledge': [(1984, 480, 112, 112)], 'ledge': [(2256, 848, 128, 128)], 'lip': [(1856, 256, 128, 64)]}.items():
    m = np.zeros((GH, GW), bool)
    for r in rs: m |= rect(*r)
    Z[name] = m

# Cottage footprint (proposed solid rect) + door approach
COT = (1168, 256); COT_RECT = (COT[0] - 38, 176, 76, 76)   # x 1130..1206, y 176..252
DOOR = (1160, 264)

# Story walk corridor: BFS on the current walk grid, wake -> Maren, dock -> Maren -> lamp
def bfs_path(a, b):
    from collections import deque
    sx, sy = int(a[0] // C), int(a[1] // C)
    def near_open(x, y):
        best = None
        for r in range(0, 30):
            for dy in range(-r, r + 1):
                for dx in range(-r, r + 1):
                    if 0 <= y + dy < GH and 0 <= x + dx < GW and walk4[y + dy, x + dx]:
                        return (x + dx, y + dy)
        return None
    s = near_open(sx, sy); g = near_open(int(b[0] // C), int(b[1] // C))
    prev = -np.ones((GH, GW), dtype=np.int64); prev[s[1], s[0]] = s[1] * GW + s[0]
    q = deque([s])
    while q:
        x, y = q.popleft()
        if (x, y) == g: break
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < GW and 0 <= ny < GH and walk4[ny, nx] and prev[ny, nx] < 0:
                prev[ny, nx] = y * GW + x; q.append((nx, ny))
    if prev[g[1], g[0]] < 0: return None
    out = []; cur = g[1] * GW + g[0]
    while True:
        y, x = divmod(cur, GW); out.append((x, y))
        if prev[y, x] == cur: break
        cur = prev[y, x]
    return out[::-1]
MAREN = (1088, 288); LAMP = (D['lamp']['x'], D['lamp']['y']); DOCK = (D['dock']['x'], D['dock']['y']); WAKE = (D['wake']['x'], D['wake']['y'])
route = np.zeros((GH, GW), bool); legs = {}
for nm, a, b in [('wake-maren', WAKE, (MAREN[0], MAREN[1] + 44)), ('dock-maren', DOCK, (MAREN[0], MAREN[1] + 44)),
                 ('maren-lamp', (MAREN[0], MAREN[1] + 44), (LAMP[0], LAMP[1] + 30)), ('lamp-cottage', (LAMP[0], LAMP[1] + 30), DOOR)]:
    pth = bfs_path(a, b); legs[nm] = len(pth) if pth else None
    for x, y in pth or []: route[y, x] = True

# dash takeoff/landing capsules (+ approach 20px behind each start)
dash = np.zeros((GH, GW), bool)
for j in JOBS:
    for sx, sy, dx, dy, reach in j['cands']:
        dash |= capsule(sx - dx * 24, sy - dy * 24, sx + dx * reach, sy + dy * reach, 1)
dash = dilate(dash, 48)
for nm in ('hookledge', 'ledge', 'lip'): dash |= dilate(Z[nm], 16)

feat_solid = np.zeros((GH, GW), bool)   # forbidden centres for blocking props (before adding own radius)
feat_decor = np.zeros((GH, GW), bool)   # forbidden centres for non-blocking decor
feat_solid |= dilate(pathG, 16); feat_decor |= dilate(pathG, 3)
feat_solid |= dilate(stairG, 32) | dilate(apronG, 8); feat_decor |= dilate(stairG | apronG, 2)
feat_solid |= dash; feat_decor |= dilate(dash & False, 0)
for j in JOBS:
    for sx, sy, dx, dy, reach in j['cands']:
        feat_decor |= circle(sx + dx * reach, sy + dy * reach, 14)
feat_solid |= dilate(ashG, 24) | dilate(Z['scar'], 16); feat_decor |= dilate(ashG, 8) | Z['scar']
feat_solid |= dilate(bridgeG, 48) | dilate(Z['rope'], 48) | dilate(Z['dock'], 24); feat_decor |= dilate(bridgeG, 8) | dilate(Z['rope'], 16)
feat_solid |= dilate(route, 24); feat_decor |= dilate(route, 4)
for pk in D['pickups']: feat_solid |= circle(pk['x'], pk['y'], 40); feat_decor |= circle(pk['x'], pk['y'], 14)
for ex in D['extras']: feat_solid |= circle(ex['x'], ex['y'], 44 if ex['kind'] == 'chest' else 56); feat_decor |= circle(ex['x'], ex['y'], 16)
for n in D['npcs']: feat_solid |= circle(n['x'], n['y'], 34 + 54 + 16); feat_decor |= circle(n['x'], n['y'], 40)
feat_solid |= circle(*LAMP, 18 + 54 + 16); feat_decor |= circle(*LAMP, 30)
for hk in D['hooks']: feat_solid |= circle(hk['x'], hk['y'], 48); feat_decor |= circle(hk['x'], hk['y'], 18)
for t in D['texts']: feat_solid |= circle(t['x'], t['y'], 30); feat_decor |= circle(t['x'], t['y'], 14)
for c in (WAKE, DOCK): feat_solid |= circle(*c, 56); feat_decor |= circle(*c, 20)
feat_solid |= rect(*COT_RECT, 24) | circle(*DOOR, 30); feat_decor |= rect(*COT_RECT, 2) | circle(*DOOR, 14)
feat_solid |= Z['perch'] & False

# ---------- placement tests ----------
def tile_ok(x, y):
    tx, ty = int(x // T), int(y // T)
    return 0 <= tx < W and 0 <= ty < H and not blocked[ty, tx]
def g_ok(mask, x, y):
    i, j = int(y // C), int(x // C)
    return 0 <= i < GH and 0 <= j < GW and not mask[i, j]
def ground_disc(x, y, r):
    for a in range(0, 360, 30):
        for rr in (0, r * 0.5, r):
            px, py = x + rr * math.cos(math.radians(a)), y + rr * math.sin(math.radians(a)) * 0.6
            i, j = int(py // C), int(px // C)
            if not (0 <= i < GH and 0 <= j < GW and ground4[i, j] and tile_ok(px, py)): return False
    return True
def sprite_rect(v, x, y):
    w, h, ax, ay, _ = ART[v]; return (x - ax, y - ay, w, h)
def sprite_clear(v, x, y):
    X, Y, w, h = sprite_rect(v, x, y)
    for ty in range(int(Y // T), int((Y + h - 1) // T) + 1):
        for tx in range(int(X // T), int((X + w - 1) // T) + 1):
            if not (0 <= tx < W and 0 <= ty < H) or opensky[ty, tx]: return False
    return True
def canopy_rect(v, x, y):
    w, h, ax, ay, _ = ART[v]; left = x - ax + w * 0.15; top = y - ay
    return (left, top, w * 0.7, h * 0.72 - (h - ay) * 0 )
PATHISH = dilate(pathG | stairG | route, 6)
def canopy_clear(v, x, y):
    # same geometry as the renderer's fade test: hero at (hx,hy) is behind the canopy when
    # hy < y, left-13 < hx < right+13 and top+2 < hy < top+0.72h+36
    w_, h_, ax, ay, _ = ART[v]; left, top = x - ax, y - ay
    X, Y, w, h = left - 13, top + 2, w_ + 26, min(y, top + h_ * 0.72 + 36) - (top + 2)
    sub = PATHISH[max(0, int(Y // C)):max(0, int((Y + h) // C)) + 1, max(0, int(X // C)):max(0, int((X + w) // C)) + 1]
    return not sub.any()
BLOCKERS = [(p['x'], p['y'], p['block']) for p in D['props'] if p.get('block')]
def gaps_ok(x, y, b):
    if not b: return True
    dt = DT[int(y // C), int(x // C)] - b
    if 1 < dt < GAP + 2: return False          # pinch between this blocker and a cliff/sky edge
    for (px, py, pb) in BLOCKERS:
        g = math.hypot(px - x, py - y) - b - pb
        if 0 < g < GAP: return False             # pinch between two blockers (overlap = one merged solid, fine)
    return True
def spacing_ok(x, y, r, v, cling=False):
    for (px, py, pr, pv, new) in placed:
        if cling and isinstance(pv, str) and (pv == 'tree' or pv.startswith('tree')): continue
        need = r + pr + (2 if TYPE_OF(v) in ('tree', 'bush', 'rock', 'log', 'stump') else -1)
        if v in BIG and isinstance(pv, str) and pv in BIG: need = max(need, 30)
        if (px - x) ** 2 + ((py - y) * 1.15) ** 2 < need * need: return False
    return True

out = []; rej = {}
def try_place(v, x, y, tag='', cling=False):
    x, y = round(x), round(y)
    b = block_of(v); r = ART[v][4]
    mask = feat_solid if b else feat_decor
    reason = None
    if not tile_ok(x, y): reason = 'tile'
    elif zone_at(x, y) in ('scar',) or ash[int(y // T), int(x // T)]: reason = 'scar'
    elif not g_ok(mask, x, y): reason = 'clear'
    elif b and not g_ok(dilate_cache(b), x, y): reason = 'clear+r'
    elif not ground_disc(x, y, max(r, b) if b else 3): reason = 'ground'
    elif not sprite_clear(v, x, y): reason = 'sky'
    elif TYPE_OF(v) == 'tree' and not canopy_clear(v, x, y): reason = 'canopy'
    elif not spacing_ok(x, y, r, v, cling): reason = 'space'
    elif not gaps_ok(x, y, b): reason = 'gap'
    if reason: rej[reason] = rej.get(reason, 0) + 1; return False
    placed.append((x, y, r, v, True))
    if b: BLOCKERS.append((x, y, b))
    out.append({'type': TYPE_OF(v), 'variant': v, 'x': x, 'y': y, 'block': b, 'tag': tag}); return True
_dc = {}
def dilate_cache(b):
    if b not in _dc: _dc[b] = dilate(feat_solid, b + 2)
    return _dc[b]

# ---------- seeds ----------
ok_ground = ground4 & ~tile_to_grid(blocked)
edge = tile_to_grid(ndimage.binary_dilation((face == 1) | ((height >= 0) & (blocked == 1)), iterations=2) & (blocked == 0))
corner = tile_to_grid(ndimage.convolve(((face == 1) | (blocked == 1)).astype(int), np.ones((5, 5)), mode='constant', cval=1) >= 13) & ~tile_to_grid(blocked)
def pick(mask, n):
    ys, xs = np.nonzero(mask)
    if not len(xs): return []
    idx = [rng.randrange(len(xs)) for _ in range(n)]
    return [(xs[i] * C + 2 + rng.uniform(-1.5, 1.5), ys[i] * C + 2 + rng.uniform(-1.5, 1.5)) for i in idx]
def zmask(*names):
    m = np.isin(zones, names); return tile_to_grid(m)

TREE_MIX = {
 'grove': ['tree_oak', 'tree_pine', 'tree_pine', 'tree_oak_b', 'tree_pine_b', 'tree_birch'],
 'hill': ['tree_pine', 'tree_pine_b', 'tree_pine_b', 'tree_oak_b'],
 'meadow': ['tree_birch', 'tree_birch_b', 'tree_oak', 'tree_oak_b'],
 'cottage': ['tree_apple', 'tree_birch_b', 'tree_oak_b'],
 'west': ['tree_oak', 'tree_oak_b', 'tree_pine_b'], 'hollow': ['tree_pine', 'tree_pine_b', 'tree_oak_b'],
 'wake': ['tree_oak_b', 'tree_birch_b', 'tree_pine_b'], 'wake-path': ['tree_oak_b', 'tree_birch_b'],
 'perch': ['tree_pine_b', 'tree_oak_b'], 'hush': ['tree_oak_b', 'tree_pine_b'], 'cinder': ['tree_pine_b'],
}
def tree_variant(x, y): return rng.choice(TREE_MIX.get(zone_at(x, y), TREE_MIX['hush']))

# 1) groves at terrace edges and corners
grove_seeds = pick(corner & ok_ground, 220) + pick(edge & ok_ground & zmask('grove', 'hill', 'west', 'hollow', 'wake', 'cottage', 'meadow', 'hush'), 260)
rng.shuffle(grove_seeds)
groves = []
for (sx, sy) in grove_seeds:
    if any((sx - gx_) ** 2 + (sy - gy_) ** 2 < 72 ** 2 for gx_, gy_ in groves): continue
    if not try_place(tree_variant(sx, sy), sx, sy, 'grove'): continue
    groves.append((sx, sy)); n = rng.randint(2, 5)
    for k in range(n * 4):
        if n <= 0: break
        a = rng.uniform(0, 2 * math.pi); d = rng.uniform(26, 52)
        if try_place(tree_variant(sx, sy), sx + d * math.cos(a), sy + d * math.sin(a) * 0.8, 'grove'): n -= 1
# 2) copses in open grass away from paths, then single interior trees for grove/hill density
far_path = ~dilate(pathG | route, 44) & ok_ground & ~tile_to_grid(np.isin(zones, ['scar', 'dock', 'perch', 'cinder', 'ledge', 'hookledge', 'lip', 'rope']))
for (sx, sy) in pick(far_path, 260):
    if any((sx - gx_) ** 2 + (sy - gy_) ** 2 < 80 ** 2 for gx_, gy_ in groves): continue
    if not try_place(tree_variant(sx, sy), sx, sy, 'copse'): continue
    groves.append((sx, sy)); n = rng.randint(1, 3)
    for k in range(n * 5):
        if n <= 0: break
        a = rng.uniform(0, 2 * math.pi); d = rng.uniform(24, 44)
        if try_place(tree_variant(sx, sy), sx + d * math.cos(a), sy + d * math.sin(a) * 0.8, 'copse'): n -= 1
for (sx, sy) in pick(zmask('grove', 'hill', 'hollow', 'west') & ok_ground, 300):
    try_place(tree_variant(sx, sy), sx, sy, 'fill')

# 3) bush clumps under trees (front side mostly), existing + new trees
trees_all = [(p[0], p[1]) for p in placed if (isinstance(p[3], str) and (p[3] == 'tree' or p[3].startswith('tree')))]
BUSHES = ['bush', 'bush_b', 'bush_c', 'bush_d', 'bush_e']
for (tx_, ty_) in trees_all:
    for k in range(rng.choice([2, 3, 3, 4])):
        a = rng.uniform(-0.2 * math.pi, 1.2 * math.pi); d = rng.uniform(16, 30)
        ok = False
        for t in range(5):
            # bushes cling to the trunk (blocks merge into one solid), front side so they read as undergrowth
            a2 = rng.uniform(0.1 * math.pi, 0.9 * math.pi) if t < 3 else rng.uniform(-0.1 * math.pi, 1.1 * math.pi)
            d2 = rng.uniform(9, 13)
            if try_place(rng.choice(BUSHES), tx_ + d2 * math.cos(a2) * 1.3, ty_ + d2 * math.sin(a2) * 0.8, 'understory', cling=True): ok = True; break
        if not ok and rng.random() < 0.5:
            v = rng.choice(['fern', 'fern_b', 'fern', 'mushroom_red', 'mushroom_tan', 'mushroom_pair', 'mushroom_tiny_red'])
            try_place(v, tx_ + d * math.cos(a), ty_ + d * math.sin(a) * 0.7, 'understory')
# free bush clumps along terrace edges
for (sx, sy) in pick(edge & ok_ground, 120):
    v = rng.choice(BUSHES)
    if try_place(v, sx, sy, 'edgebush'):
        for k in range(rng.randint(0, 2)):
            try_place(rng.choice(BUSHES), sx + rng.uniform(-18, 18), sy + rng.uniform(-8, 10), 'edgebush')

# 4) rocks near cliffs
ROCKS = ['rock', 'rock_b', 'rock_c', 'rock_round', 'pebble', 'rock_cluster', 'rock_moss_sm', 'rock_moss_sm_b']
for (sx, sy) in pick(edge & ok_ground, 240):
    v = 'boulder' if rng.random() < 0.12 else rng.choice(ROCKS)
    if try_place(v, sx, sy, 'cliffrock') and rng.random() < 0.5:
        try_place(rng.choice(['pebble', 'rock_moss_sm', 'rock_moss_sm_b', 'tuft_c']), sx + rng.uniform(-14, 14), sy + rng.uniform(-6, 8), 'cliffrock')

# 5) stumps / logs / mushrooms in groves
for (sx, sy) in pick(zmask('grove', 'hollow', 'west', 'hill') & ok_ground, 90):
    v = rng.choice(['stump', 'stump_b', 'log', 'log_b'])
    if try_place(v, sx, sy, 'deadwood'):
        for k in range(rng.randint(0, 2)):
            try_place(rng.choice(['mushroom_red', 'mushroom_tiny_red', 'mushroom_tan_sm', 'mushroom_purple', 'mushroom_tiny_purple', 'fern']),
                      sx + rng.uniform(-16, 16), sy + rng.uniform(-6, 10), 'deadwood')

# 6) flower patches near the cottage and along paths
FLOW = {
 'cottage': ['flower_pink', 'flower_pink_b', 'daisy', 'wild_pair_red', 'wild_pair_pink', 'flower_white_b', 'wild_red', 'wild_violet'],
 'meadow': ['flower_gold', 'flower_gold_b', 'flower_gold_c', 'daisy', 'daisy_b', 'wild_pair_gold', 'flower_white', 'wild_gold'],
 'grove': ['blossom', 'flower_tide', 'flower_tide_b', 'wild_violet', 'wild_pair_violet', 'bud_purple'],
 'hill': ['flower_tide', 'flower_tide_b', 'flower_tide_c', 'wild_blue', 'wild_pair_blue', 'bud_blue'],
}
def flowers_for(x, y): return FLOW.get(zone_at(x, y), FLOW['meadow'] + FLOW['grove'][:3])
near_path = dilate(pathG, 40) & ~dilate(pathG, 6) & ok_ground
near_cot = tile_to_grid(np.isin(zones, ['cottage'])) & ok_ground
patches = []
for (sx, sy) in pick(near_cot, 120) + pick(near_path, 260):
    if any((sx - a) ** 2 + (sy - b) ** 2 < 46 ** 2 for a, b in patches): continue
    pal = flowers_for(sx, sy); main = rng.sample(pal, min(3, len(pal)))
    got = 0
    for k in range(rng.randint(7, 13)):
        a = rng.uniform(0, 2 * math.pi); d = rng.uniform(0, 18) * math.sqrt(rng.random())
        if try_place(rng.choice(main), sx + d * math.cos(a), sy + d * math.sin(a) * 0.7, 'flowers'): got += 1
    if got: patches.append((sx, sy))
# 6b) cottage garden: flower beds flanking the door, along the front wall (non-blocking)
GARDEN = ['wild_pair_red', 'wild_pair_pink', 'flower_pink_b', 'wild_red', 'daisy_b', 'wild_pair_violet']
for xs_, x0 in (((1124, 1146), 0), ((1178, 1212), 0)):
    for x in range(xs_[0], xs_[1] + 1, 7):
        for y in (262, 270):
            try_place(rng.choice(GARDEN), x + rng.uniform(-2, 2), y + rng.uniform(-1, 2), 'garden')
# side beds beside the house walls
for (x, y) in [(1118, 236), (1116, 248), (1214, 236), (1216, 248), (1110, 222), (1222, 222)]:
    try_place(rng.choice(GARDEN), x, y, 'garden')
# 7) meadow drifts of flowers in open grass
for (sx, sy) in pick(zmask('meadow', 'hill', 'grove', 'west', 'hollow', 'wake', 'hush') & ok_ground, 50):
    pal = flowers_for(sx, sy)
    for k in range(rng.randint(2, 4)):
        try_place(rng.choice(pal), sx + rng.uniform(-20, 20), sy + rng.uniform(-12, 12), 'drift')
# 8) tufts everywhere on grass
TUFTS = ['tuft', 'tuft_b', 'tuft_c', 'tuft', 'tuft_b']
for (sx, sy) in pick(ok_ground, 650):
    try_place(rng.choice(TUFTS), sx, sy, 'tuft')

json.dump({'seed': SEED, 'cottage_rect': COT_RECT, 'door': DOOR, 'legs': legs,
           'props': [{k: p[k] for k in ('type', 'variant', 'x', 'y', 'block')} for p in out]},
          open('props-dense.json', 'w'), indent=0)
from collections import Counter
print('placed', len(out), Counter(p['type'] for p in out), 'rej', rej, 'legs', legs)
print('by tag', Counter(p['tag'] for p in out))
np.save('route-corridor.npy', route); np.save('feat_solid.npy', feat_solid)

if __name__ == '__main__' and len(sys.argv) > 2:
    for pt in sys.argv[2:]:
        x, y = map(int, pt.split(','))
        i, j = y // C, x // C
        print(pt, 'zone', zone_at(x, y), 'solid', feat_solid[i, j], 'decor', feat_decor[i, j], 'route', dilate(route, 24)[i, j], 'dash', dash[i, j],
              'path', dilate(pathG, 16)[i, j], 'ground', ground4[i, j], 'tile', tile_ok(x, y))
