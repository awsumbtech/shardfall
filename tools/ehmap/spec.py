"""RegionSpec: the hand-edited emberhold.spec.json as frozen records."""
import json
from dataclasses import dataclass
from typing import Tuple

Rect = Tuple[int, int, int, int]


@dataclass(frozen=True)
class Land:
    id: str
    rects: Tuple[Rect, ...]


@dataclass(frozen=True)
class Terrace:
    id: str
    level: int
    material: str
    rects: Tuple[Rect, ...]


@dataclass(frozen=True)
class MaterialPatch:
    material: str
    rects: Tuple[Rect, ...]
    regions: Tuple[str, ...]


@dataclass(frozen=True)
class Stair:
    terrace: str
    x: int
    new: bool


@dataclass(frozen=True)
class Path:
    id: str
    width: int
    original: Tuple[Tuple[float, float], ...]
    route: Tuple[Tuple[int, int], ...]


@dataclass(frozen=True)
class Bridge:
    id: str
    x: int
    y0: int
    y1: int


@dataclass(frozen=True)
class RegionSpec:
    width: int
    height: int
    land: Tuple[Land, ...]
    terraces: Tuple[Terrace, ...]
    materials: Tuple[MaterialPatch, ...]
    stairs: Tuple[Stair, ...]
    plazas: Tuple[Rect, ...]
    paths: Tuple[Path, ...]
    bridges: Tuple[Bridge, ...]
    markers: Tuple[Tuple[str, str, float, float], ...]

    def terrace(self, tid):
        for t in self.terraces:
            if t.id == tid:
                return t
        raise KeyError(tid)


def _rects(rs):
    return tuple(tuple(int(v) for v in r) for r in rs)


def load(path):
    with open(path) as f:
        d = json.load(f)
    return RegionSpec(
        width=d["width"], height=d["height"],
        land=tuple(Land(l["id"], _rects(l["rects"])) for l in d["land"]),
        terraces=tuple(Terrace(t["id"], t["level"], t["material"], _rects(t["rects"])) for t in d["terraces"]),
        materials=tuple(MaterialPatch(m["material"], _rects(m["rects"]), tuple(m.get("regions", []))) for m in d["materials"]),
        stairs=tuple(Stair(s["terrace"], s["x"], bool(s.get("new"))) for s in d["stairs"]),
        plazas=_rects([p["rect"] for p in d.get("plazas", [])]),
        paths=tuple(Path(p["id"], p.get("w", 3), tuple(map(tuple, p["from"])), tuple(tuple(int(v) for v in q) for q in p["route"])) for p in d["paths"]),
        bridges=tuple(Bridge(b["id"], b["x"], b["y0"], b["y1"]) for b in d.get("bridges", [])),
        markers=tuple((kind, name, float(p[0]), float(p[1])) for kind, group in d["markers"].items() for name, p in group.items()),
    )
