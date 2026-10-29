"""Tileset: named tile -> Kenmi sheet cell. Read-only once loaded."""
import json, os
from dataclasses import dataclass
from types import MappingProxyType


# Low-ash RGB scale. Alpha is unchanged. The atlas packer uses the same number.
DIM = 0.6


@dataclass(frozen=True)
class TileRef:
    name: str
    sheet: str
    c: int
    r: int
    group: str
    desc: str


class Tileset:
    def __init__(self, path):
        with open(path) as f:
            d = json.load(f)
        self._size = int(d["tileSize"])
        self._root = d["root"]
        self._sheets = MappingProxyType(dict(d["sheets"]))
        self._tiles = MappingProxyType({
            n: TileRef(n, t["sheet"], t["c"], t["r"], t.get("group", ""), t.get("desc", ""))
            for n, t in d["tiles"].items()})
        self._imgs = {}
        self._cache = {}

    @property
    def size(self):
        return self._size

    @property
    def names(self):
        return tuple(self._tiles.keys())

    @property
    def sheets(self):
        return self._sheets

    def ref(self, name):
        return self._tiles[name]

    def sheet_ref(self, sheet):
        rel = self._sheets[sheet].replace("\\", "/")
        if rel.startswith("art/") or rel.startswith("js/") or rel.startswith("vendor/"):
            return rel
        root = (self._root or "vendor/kenmi").replace("\\", "/").rstrip("/")
        return root + "/" + rel.lstrip("/")

    def sheet_path(self, sheet):
        rel = self._sheets[sheet]
        if os.path.isabs(rel):
            return rel
        root = os.environ.get("ASSETS_DIR", self._root)
        if rel.startswith("art/") or rel.startswith("js/"):
            repo = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
            return os.path.join(repo, rel)
        return os.path.join(root, rel)

    def sheet_image(self, sheet):
        if sheet not in self._imgs:
            from PIL import Image
            self._imgs[sheet] = Image.open(self.sheet_path(sheet)).convert("RGBA")
        return self._imgs[sheet]

    def image(self, name):
        if name not in self._cache:
            t = self._tiles[name]
            s = self._size
            self._cache[name] = self.sheet_image(t.sheet).crop((t.c * s, t.r * s, t.c * s + s, t.r * s + s))
        return self._cache[name]
