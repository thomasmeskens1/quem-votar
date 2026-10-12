"""Caixas (bounding boxes) dos municípios a partir das malhas TopoJSON do site
(web/public/geo/municipios/<UF>.topo.json), somente leitura.

Caixa = (lat_min, lat_max, lon_min, lon_max). A caixa do Brasil é a união das
caixas de todos os municípios (nenhum limite é escrito à mão).
"""
import json
import os


def _arcos_absolutos(topo):
    tr = topo.get("transform")
    arcos = []
    for arco in topo["arcs"]:
        pts, x, y = [], 0, 0
        for p in arco:
            if tr:
                x, y = x + p[0], y + p[1]
                pts.append((x * tr["scale"][0] + tr["translate"][0],
                            y * tr["scale"][1] + tr["translate"][1]))
            else:
                pts.append((p[0], p[1]))
        arcos.append(pts)
    return arcos


def _indices(arcs):
    if isinstance(arcs, int):
        yield arcs
    else:
        for a in arcs:
            yield from _indices(a)


def caixas_municipios(pasta):
    """Devolve ({cod_ibge: caixa}, caixa_brasil)."""
    caixas = {}
    for arq in sorted(os.listdir(pasta)):
        if not arq.endswith(".topo.json"):
            continue
        with open(os.path.join(pasta, arq), encoding="utf-8") as f:
            topo = json.load(f)
        arcos = _arcos_absolutos(topo)
        for obj in topo["objects"].values():
            for g in obj.get("geometries", []):
                cod = str((g.get("properties") or {}).get("cod_ibge", "")).strip()
                if not cod or "arcs" not in g:
                    continue
                lons, lats = [], []
                for i in _indices(g["arcs"]):
                    for lon, lat in arcos[i if i >= 0 else ~i]:
                        lons.append(lon)
                        lats.append(lat)
                if not lons:
                    continue
                cx = (min(lats), max(lats), min(lons), max(lons))
                if cod in caixas:
                    a = caixas[cod]
                    cx = (min(a[0], cx[0]), max(a[1], cx[1]), min(a[2], cx[2]), max(a[3], cx[3]))
                caixas[cod] = cx
    if not caixas:
        raise SystemExit(f"nenhuma malha de município encontrada em {pasta}")
    br = (min(c[0] for c in caixas.values()), max(c[1] for c in caixas.values()),
          min(c[2] for c in caixas.values()), max(c[3] for c in caixas.values()))
    return caixas, br


def dentro(caixa, ponto, margem):
    lat, lon = ponto
    return (caixa[0] - margem <= lat <= caixa[1] + margem
            and caixa[2] - margem <= lon <= caixa[3] + margem)
