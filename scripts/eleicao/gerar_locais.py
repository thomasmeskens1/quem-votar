"""Gera dados/eleicao/<ano>/<turno>turno/locais/<UF>/<cod_tse>.json: locais de votação
de cada município do Brasil, com coordenadas e o resultado de Presidente agregado
das seções de cada local (formato em dados/eleicao/esquema.json).

Uso (rodar com python -I; só biblioteca padrão; rodar depois de gerar_resultados.py):
  python -I scripts/eleicao/gerar_locais.py --turno 1 --dl-dir <pasta temporária>

Fontes oficiais do TSE (lidas em streaming de dentro dos zips):
- detalhe_votacao_secao_<ano>.zip (membro _BR.csv = Presidente): aptos,
  comparecimento, abstenções, brancos, nulos e local de cada seção;
- votacao_secao_<ano>_BR.zip: votos por candidato em cada seção;
- eleitorado_local_votacao_<ano>.zip: nome, endereço, bairro, latitude e
  longitude de cada local de votação (por turno).
Exterior (SG_UF = ZZ) fica de fora. Nada é gravado se uma validação falhar.
"""
import argparse
import datetime as dt
import json
import os
import shutil
import sys
import tempfile
import zipfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tse_fontes as tf  # noqa: E402
import validacoes as va  # noqa: E402
from gerar_resultados import RAIZ, cargo_ok, cod_mun, gravar, inteiro, lista_votos  # noqa: E402
from geo_bbox import caixas_municipios, dentro  # noqa: E402

VOTAVEIS_NAO_CANDIDATO = {95, 96, 97, 98}  # branco, nulo, anulado (TSE)
NOTA = (
    "Totais de cada local = soma das seções do local no arquivo detalhe_votacao_secao "
    "(QT_APTOS, QT_COMPARECIMENTO, QT_ABSTENCOES, QT_VOTOS_NOMINAIS + QT_VOTOS_LEGENDA, "
    "QT_VOTOS_BRANCOS, QT_VOTOS_NULOS). Seção não instalada = ST_SECAO_INSTALADA diferente "
    "de 'Sim'; seus eleitores = QT_APTOS - QT_COMPARECIMENTO - QT_ABSTENCOES da linha "
    "(derivado). Votos por candidato: votacao_secao (NR_VOTAVEL, sem 95/96). Coordenadas, "
    "bairro e endereço: eleitorado_local_votacao (NR_LATITUDE/NR_LONGITUDE; -1 = sem "
    "coordenada). Votos em números fora da lista oficial de candidatos do turno "
    "(arquivo votacao_candidato_munzona) entram como nulos, pois o TSE os totaliza como "
    "nulos técnicos. Coordenada fora do Brasil fica nula (valor do TSE em "
    "'coordenadas_tse_fora_do_brasil'); fora_do_municipio = ponto fora da caixa "
    "(bounding box) da malha do município, mantido como veio do TSE."
)
NOTAS = [
    NOTA,
    "Compactação: fonte e notas ficam só neste arquivo (cada arquivo de município traz "
    "gerado_em); candidatos com 0 voto são omitidos em cada local (ausência = 0); lat/lon "
    "arredondadas a 5 casas decimais.",
    "Ligação seção -> local: pelo NR_LOCAL_VOTACAO do arquivo detalhe_votacao_secao, "
    "casando as seções do votacao_secao por (UF, município, zona, seção); em parte das "
    "seções o votacao_secao informa outro número de local para a mesma seção.",
]


def url_det_secao(ano):
    return f"{tf.CDN}/detalhe_votacao_secao/detalhe_votacao_secao_{ano}.zip"


def url_votacao_secao(ano):
    return f"{tf.CDN}/votacao_secao/votacao_secao_{ano}_BR.zip"


def url_locais(ano):
    return f"{tf.CDN}/eleitorado_locais_votacao/eleitorado_local_votacao_{ano}.zip"


def arred(x):
    return None if x is None else round(x, 5)


def coord(v):
    try:
        x = float((v or "").strip().replace(",", "."))
    except ValueError:
        return None
    return None if x in (-1.0, 0.0) else x


def novo_total():
    return dict.fromkeys(va.CAMPOS, 0)


def ler_detalhe_secao(caminho, ano, turno, extras):
    """{(uf, cd): {(zona, local): {"totais", "secoes", "nome", "endereco"}}}"""
    locais = {}
    for ln in tf.ler_csv_zip(caminho, f"detalhe_votacao_secao_{ano}_BR.csv"):
        if not cargo_ok(ln, turno) or ln["SG_UF"].strip() == "ZZ":
            continue
        extras["datas"].add(tf.data_iso_br(ln["DT_GERACAO"]))
        extras["anulados"] += inteiro(ln["QT_VOTOS_ANULADOS_APU_SEP"])
        aptos, comp, abst = (inteiro(ln["QT_APTOS"]), inteiro(ln["QT_COMPARECIMENTO"]),
                             inteiro(ln["QT_ABSTENCOES"]))
        instalada = ln["ST_SECAO_INSTALADA"].strip().upper() == "SIM"
        t = {
            "eleitores_aptos": aptos, "comparecimento": comp, "abstencoes": abst,
            "votos_validos": inteiro(ln["QT_VOTOS_NOMINAIS"]) + inteiro(ln["QT_VOTOS_LEGENDA"]),
            "brancos": inteiro(ln["QT_VOTOS_BRANCOS"]), "nulos": inteiro(ln["QT_VOTOS_NULOS"]),
            "secoes_nao_instaladas": 0 if instalada else 1,
            "eleitores_secoes_nao_instaladas": aptos - comp - abst,
        }
        if instalada and t["eleitores_secoes_nao_instaladas"]:
            extras["dif_instaladas"].append((ln["SG_UF"], ln["CD_MUNICIPIO"], ln["NR_ZONA"],
                                             ln["NR_SECAO"], t["eleitores_secoes_nao_instaladas"]))
        chave = (inteiro(ln["NR_ZONA"]), inteiro(ln["NR_LOCAL_VOTACAO"]))
        mun = locais.setdefault((ln["SG_UF"].strip(), cod_mun(ln["CD_MUNICIPIO"])), {})
        loc = mun.setdefault(chave, {"totais": novo_total(), "secoes": 0, "votos": {},
                                     "nome": ln["NM_LOCAL_VOTACAO"].strip(),
                                     "endereco": ln["DS_LOCAL_VOTACAO_ENDERECO"].strip()})
        loc["secoes"] += 1
        extras["secao_local"][(ln["SG_UF"].strip(), cod_mun(ln["CD_MUNICIPIO"]),
                               inteiro(ln["NR_ZONA"]), inteiro(ln["NR_SECAO"]))] = chave
        for c in va.CAMPOS:
            loc["totais"][c] += t[c]
    return locais


def ler_votos_secao(caminho, ano, turno, locais, extras):
    for ln in tf.ler_csv_zip(caminho, f"votacao_secao_{ano}_BR.csv"):
        if not cargo_ok(ln, turno) or ln["SG_UF"].strip() == "ZZ":
            continue
        extras["datas_votos"].add(tf.data_iso_br(ln["DT_GERACAO"]))
        nr, v = inteiro(ln["NR_VOTAVEL"]), inteiro(ln["QT_VOTOS"])
        uf, cd = ln["SG_UF"].strip(), cod_mun(ln["CD_MUNICIPIO"])
        mun = locais.get((uf, cd))
        chave = extras["secao_local"].get((uf, cd, inteiro(ln["NR_ZONA"]), inteiro(ln["NR_SECAO"])))
        if chave is None:
            extras["secoes_sem_detalhe"] += 1
            chave = (inteiro(ln["NR_ZONA"]), inteiro(ln["NR_LOCAL_VOTACAO"]))
        elif chave[1] != inteiro(ln["NR_LOCAL_VOTACAO"]):
            extras["local_divergente"].add((uf, cd) + chave)
        loc = mun and mun.get(chave)
        if loc is None:
            extras["votos_sem_local"] += v
            continue
        if nr in VOTAVEIS_NAO_CANDIDATO:
            loc.setdefault("especiais", {})[nr] = loc.get("especiais", {}).get(nr, 0) + v
            continue
        loc["votos"][nr] = loc["votos"].get(nr, 0) + v


def ler_cadastro_locais(caminho, ano, turno, extras):
    """{(uf, cd, zona, local): {"nome","endereco","bairro","lat","lon"}}"""
    cad = {}
    with zipfile.ZipFile(caminho) as z:
        membros = [n for n in z.namelist() if n.endswith(".csv") and "_BRASIL" not in n
                   and not n.endswith("_ZZ.csv")]
    for membro in sorted(membros):
        for ln in tf.ler_csv_zip(caminho, membro):
            if inteiro(ln["NR_TURNO"]) != turno:
                continue
            extras["datas_locais"].add(tf.data_iso_br(ln["DT_GERACAO"]))
            k = (ln["SG_UF"].strip(), cod_mun(ln["CD_MUNICIPIO"]), inteiro(ln["NR_ZONA"]),
                 inteiro(ln["NR_LOCAL_VOTACAO"]))
            if k not in cad:
                cad[k] = {"nome": ln["NM_LOCAL_VOTACAO"].strip(),
                          "endereco": ln["DS_ENDERECO"].strip(),
                          "bairro": ln["NM_BAIRRO"].strip(),
                          "lat": coord(ln["NR_LATITUDE"]), "lon": coord(ln["NR_LONGITUDE"])}
    return cad


def carregar_municipios(dir_turno):
    """Resultados por município já gerados por gerar_resultados.py."""
    muns = {}
    pasta = os.path.join(dir_turno, "uf")
    for arq in sorted(os.listdir(pasta)):
        with open(os.path.join(pasta, arq), encoding="utf-8") as f:
            d = json.load(f)
        for m in d["municipios"]:
            muns[(d["uf"], m["cod_tse"])] = m
    if not muns:
        raise SystemExit(f"rode gerar_resultados.py antes (faltam arquivos em {pasta})")
    return muns


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--turno", type=int, choices=(1, 2), required=True)
    ap.add_argument("--ano", type=int, default=2026)
    ap.add_argument("--dl-dir", default=os.path.join(tempfile.gettempdir(), "dados-eleicao", "dl"))
    ap.add_argument("--geo-dir", default=os.path.join(RAIZ, "web", "public", "geo", "municipios"))
    ap.add_argument("--margem-graus", type=float, default=0.01,
                    help="folga da caixa do município (geometria simplificada)")
    args = ap.parse_args()
    ano, turno = args.ano, args.turno
    dir_turno = os.path.join(RAIZ, "dados", "eleicao", str(ano), f"{turno}turno")
    muns = carregar_municipios(dir_turno)

    print("baixando/conferindo arquivos do TSE em", args.dl_dir)
    f_det = tf.baixar(url_det_secao(ano), args.dl_dir)
    f_vot = tf.baixar(url_votacao_secao(ano), args.dl_dir)
    f_loc = tf.baixar(url_locais(ano), args.dl_dir)
    ex = {"datas": set(), "datas_votos": set(), "datas_locais": set(), "anulados": 0,
          "votos_sem_local": 0, "dif_instaladas": [],
          "secao_local": {}, "secoes_sem_detalhe": 0, "local_divergente": set()}
    print("lendo detalhe por seção...")
    locais = ler_detalhe_secao(f_det["caminho"], ano, turno, ex)
    if not locais:
        raise SystemExit(f"nenhuma seção de Presidente no {turno}º turno (já publicado?)")
    print("lendo votos por seção...")
    ler_votos_secao(f_vot["caminho"], ano, turno, locais, ex)
    print("lendo cadastro de locais...")
    cad = ler_cadastro_locais(f_loc["caminho"], ano, turno, ex)
    caixas, caixa_br = caixas_municipios(args.geo_dir)
    oficiais = {c["numero"] for m in muns.values() for c in m["candidatos"]}
    tecnicos = {}
    for lm in locais.values():
        for loc in lm.values():
            for nr in [n for n in loc["votos"] if n not in oficiais]:
                v = loc["votos"].pop(nr)
                loc["totais"]["votos_validos"] -= v
                loc["totais"]["nulos"] += v
                tecnicos[nr] = tecnicos.get(nr, 0) + v
    print("votos por seção em números fora da lista oficial do turno, contados como nulos "
          f"(nulos técnicos, como na totalização): {tecnicos}")

    rel = va.Relatorio()
    rel.checar(ex["anulados"] == 0, "sem votos anulados em apuração separada", str(ex["anulados"]))
    rel.checar(ex["votos_sem_local"] == 0, "todo voto por seção cai num local do detalhe",
               str(ex["votos_sem_local"]))
    rel.checar(not ex["dif_instaladas"], "seções instaladas: aptos = comparecimento + abstenções",
               str(ex["dif_instaladas"][:20]))
    rel.checar(set(locais) == set(muns), "mesmos municípios nos resultados e nas seções",
               f"só resultados: {sorted(set(muns) - set(locais))[:20]}; "
               f"só seções: {sorted(set(locais) - set(muns))[:20]}")
    erros_mun, n_locais, n_coord, fora_mun, fora_br, sem_cad, sem_geo = [], 0, 0, [], [], [], set()
    for (uf, cd), lm in locais.items():
        m = muns.get((uf, cd))
        soma, votos = novo_total(), {}
        for (z, nl), loc in lm.items():
            n_locais += 1
            for c in va.CAMPOS:
                soma[c] += loc["totais"][c]
            for nr, v in loc["votos"].items():
                votos[nr] = votos.get(nr, 0) + v
            va.checar_totais(rel, f"{uf}/{cd}/{z}-{nl}", loc["totais"])
            if sum(loc["votos"].values()) != loc["totais"]["votos_validos"]:
                rel.erros.append(f"{uf}/{cd}/{z}-{nl}: candidatos != válidos")
            if loc.get("especiais", {}).get(95, 0) != loc["totais"]["brancos"]:
                rel.erros.append(f"{uf}/{cd}/{z}-{nl}: brancos (votacao_secao) != detalhe")
            meta = cad.get((uf, cd, z, nl))
            if meta is None:
                sem_cad.append(f"{uf}/{cd}/{z}-{nl}")
                meta = {"nome": loc["nome"], "endereco": loc["endereco"], "bairro": "",
                        "lat": None, "lon": None}
            loc["meta"] = meta
            if meta["lat"] is None or meta["lon"] is None:
                continue
            n_coord += 1
            p = (meta["lat"], meta["lon"])
            if not dentro(caixa_br, p, 0):
                fora_br.append(f"{uf}/{cd}/{z}-{nl} {p}")
                loc["coord_invalida"] = list(p)
                meta = dict(meta, lat=None, lon=None)
                loc["meta"] = meta
                n_coord -= 1
            elif m and m.get("cod_ibge") in caixas:
                if not dentro(caixas[m["cod_ibge"]], p, args.margem_graus):
                    fora_mun.append(f"{uf}/{cd}/{z}-{nl}")
                    loc["fora"] = "municipio"
            else:
                sem_geo.add(f"{uf}/{cd}")
        if m is None:
            continue
        mt = {c: m["totais"].get(c, 0) for c in va.CAMPOS}
        mv = {c["numero"]: c["votos"] for c in m["candidatos"] if c["votos"]}
        if soma != mt or {k: v for k, v in votos.items() if v} != mv:
            erros_mun.append(f"{uf}/{cd} {m['nome']}: locais {soma} {votos} x município {mt} {mv}")
    rel.checar(not erros_mun, "soma dos locais = município (totais e candidatos)",
               f"{len(erros_mun)} municípios: " + " | ".join(erros_mun[:10]))
    print(f"coordenadas fora do Brasil (anuladas no mapa, valor do TSE guardado em "
          f"'coordenadas_tse_fora_do_brasil' e local listado em sem_coordenadas): {fora_br}")

    print(f"\nlocais: {n_locais}; com coordenadas: {n_coord} ({100 * n_coord / n_locais:.2f}%)")
    print(f"locais fora da caixa do município (registrados, não descartados): {len(fora_mun)}")
    print(f"municípios sem geometria para conferir: {sorted(sem_geo)}")
    print(f"seções de votacao_secao sem linha no detalhe: {ex['secoes_sem_detalhe']}; "
          f"locais com NR_LOCAL diferente entre os dois arquivos: {len(ex['local_divergente'])}")
    print(f"locais sem cadastro no eleitorado_local_votacao: {len(sem_cad)} {sem_cad[:20]}")
    print(f"validações OK ({len(rel.ok)}):")
    for x in rel.ok:
        print("  ok", x)
    if rel.erros:
        print(f"\nFALHAS ({len(rel.erros)}):")
        for x in rel.erros[:60]:
            print("  ERRO", x)
        print("nada foi gravado.")
        sys.exit(1)

    datas = sorted(ex["datas"] | ex["datas_votos"] | ex["datas_locais"])
    arquivos = [{"url": f["url"], "sha256": f["sha256"], "bytes": f["bytes"],
                 "last_modified": f["last_modified"], "dt_geracao": sorted(d)}
                for f, d in ((f_det, ex["datas"]), (f_vot, ex["datas_votos"]),
                             (f_loc, ex["datas_locais"]))]
    fonte = {"orgao": "TSE", "urls": [a["url"] for a in arquivos], "data_arquivo_tse": datas[-1],
             "sha256": "; ".join(f"{a['url'].rsplit('/', 1)[-1]}={a['sha256']}" for a in arquivos),
             "arquivos": arquivos}
    agora = dt.datetime.now(dt.timezone(dt.timedelta(hours=-3))).replace(microsecond=0).isoformat()
    numeros = sorted({c["numero"] for m in muns.values() for c in m["candidatos"]})
    saida = os.path.join(dir_turno, "locais")
    if os.path.isdir(saida):
        shutil.rmtree(saida)
    for (uf, cd), lm in sorted(locais.items()):
        m = muns[(uf, cd)]
        lista, sem = [], []
        for (z, nl), loc in sorted(lm.items()):
            meta = loc["meta"]
            item = {"nr_zona": z, "nr_local": nl, "nome": meta["nome"],
                    "endereco": meta["endereco"], "bairro": meta["bairro"],
                    "lat": arred(meta["lat"]), "lon": arred(meta["lon"]),
                    "secoes": loc["secoes"], "totais": loc["totais"],
                    "candidatos": [c for c in lista_votos(loc["votos"], numeros) if c["votos"]]}
            if loc.get("fora"):
                item["fora_do_" + loc["fora"]] = True
            if loc.get("coord_invalida"):
                item["coordenadas_tse_fora_do_brasil"] = loc["coord_invalida"]
            if meta["lat"] is None or meta["lon"] is None:
                sem.append(f"{z}-{nl}")
            lista.append(item)
        gravar(os.path.join(saida, uf, f"{cd}.json"), {
            "eleicao": ano, "turno": turno, "uf": uf, "cod_tse": cd, "cod_ibge": m["cod_ibge"],
            "nome": m["nome"], "gerado_em": agora, "locais": lista, "sem_coordenadas": sem})
    gravar(os.path.join(saida, "fonte.json"), {
        "eleicao": ano, "turno": turno, "cargo": "Presidente", "gerado_em": agora,
        "fonte": fonte, "notas": NOTAS, "arquivos_municipio": len(locais),
        "locais": n_locais, "locais_com_coordenadas": n_coord})
    total = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(saida) for f in fs)
    print(f"gravado em {saida}: {len(locais)} arquivos, {total / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
