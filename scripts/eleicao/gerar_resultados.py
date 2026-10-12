"""Gera os JSON de resultados de Presidente (dados/eleicao/<ano>/<turno>turno/)
a partir dos arquivos oficiais do TSE, no formato de dados/eleicao/esquema.json.

Uso (rodar com python -I; só biblioteca padrão):
  python -I scripts/eleicao/gerar_resultados.py --turno 1 --dl-dir <pasta temporária>

Fontes:
- votacao_candidato_munzona_<ano>.zip (membro _BR.csv): votos por candidato,
  município e zona;
- detalhe_votacao_munzona_<ano>.zip (membro _BR.csv): aptos, comparecimento,
  abstenções, brancos e nulos por município e zona;
- resultados.tse.jus.br .../config/mun-e<eleição>-cm.json: código TSE -> IBGE;
- página do TSE "Locais de votação no exterior" (cópia arquivada): país de
  cada cidade do exterior (ver tse_paises.py).
Nada é gravado se alguma validação falhar.
"""
import argparse
import gzip
import datetime as dt
import json
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tse_fontes as tf  # noqa: E402
import tse_paises as tp  # noqa: E402
import validacoes as va  # noqa: E402

RAIZ = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CD_ELEICAO = {(2026, 1): 6257, (2026, 2): 6258}
UF_NOMES = {
    "AC": "Acre", "AL": "Alagoas", "AM": "Amazonas", "AP": "Amapá", "BA": "Bahia",
    "CE": "Ceará", "DF": "Distrito Federal", "ES": "Espírito Santo", "GO": "Goiás",
    "MA": "Maranhão", "MG": "Minas Gerais", "MS": "Mato Grosso do Sul",
    "MT": "Mato Grosso", "PA": "Pará", "PB": "Paraíba", "PE": "Pernambuco",
    "PI": "Piauí", "PR": "Paraná", "RJ": "Rio de Janeiro", "RN": "Rio Grande do Norte",
    "RO": "Rondônia", "RR": "Roraima", "RS": "Rio Grande do Sul", "SC": "Santa Catarina",
    "SE": "Sergipe", "SP": "São Paulo", "TO": "Tocantins", "ZZ": "Exterior",
}
PAIS_LACUNA = "País não identificado"
NOTA_ABSTENCAO = (
    "abstencoes = QT_ABSTENCOES do TSE; secoes_nao_instaladas = QT_SECOES_NAO_INSTALADAS e "
    "eleitores_secoes_nao_instaladas = QT_ELEITORES_SECOES_NAO_INSTALADAS, lidos diretamente "
    "do arquivo de detalhe do TSE em cada linha (município/cidade e zona), sem derivação; "
    "comparecimento + abstencoes + eleitores_secoes_nao_instaladas = eleitores_aptos "
    "(QT_APTOS). nulos = QT_TOTAL_VOTOS_NULOS (nulos + nulos técnicos)."
)


def inteiro(v):
    v = (v or "").strip()
    return int(v) if v and v.lstrip("-").isdigit() else 0


def cod_mun(v):
    return str(v).strip().strip('"').zfill(5)


def cargo_ok(linha, turno):
    return (inteiro(linha["NR_TURNO"]) == turno
            and tp.normalizar(linha["DS_CARGO"]) == "PRESIDENTE")


def novo_total():
    return dict.fromkeys(va.CAMPOS, 0)


def somar(dest, orig):
    for c in va.CAMPOS:
        dest[c] += orig[c]


def ler_detalhe(caminho, ano, turno):
    """Devolve ({(uf, cd): {"nome", "totais"}}, totais_por_uf, total_br, extras)."""
    mun, por_uf, br = {}, {}, novo_total()
    extras = {"anulados": 0, "nao_instaladas": 0, "datas": set(), "linhas": 0}
    for ln in tf.ler_csv_zip(caminho, f"detalhe_votacao_munzona_{ano}_BR.csv"):
        if not cargo_ok(ln, turno):
            continue
        extras["linhas"] += 1
        extras["datas"].add(tf.data_iso_br(ln["DT_GERACAO"]))
        nao_inst = inteiro(ln["QT_ELEITORES_SECOES_NAO_INSTALADAS"])
        extras["nao_instaladas"] += nao_inst
        extras["anulados"] += (inteiro(ln["QT_TOTAL_VOTOS_ANULADOS"])
                               + inteiro(ln["QT_TOTAL_VOTOS_ANUL_SUBJUD"])
                               + inteiro(ln["QT_VOTOS_ANULADOS_APU_SEP"]))
        t = {
            "eleitores_aptos": inteiro(ln["QT_APTOS"]),
            "comparecimento": inteiro(ln["QT_COMPARECIMENTO"]),
            "abstencoes": inteiro(ln["QT_ABSTENCOES"]),
            "votos_validos": inteiro(ln["QT_TOTAL_VOTOS_VALIDOS"]),
            "brancos": inteiro(ln["QT_VOTOS_BRANCOS"]),
            "nulos": inteiro(ln["QT_TOTAL_VOTOS_NULOS"]),
            "secoes_nao_instaladas": inteiro(ln["QT_SECOES_NAO_INSTALADAS"]),
            "eleitores_secoes_nao_instaladas": nao_inst,
        }
        uf, cd = ln["SG_UF"].strip(), cod_mun(ln["CD_MUNICIPIO"])
        m = mun.setdefault((uf, cd), {"nome": ln["NM_MUNICIPIO"].strip(), "totais": novo_total()})
        somar(m["totais"], t)
        somar(por_uf.setdefault(uf, novo_total()), t)
        somar(br, t)
    if not mun:
        raise SystemExit(f"detalhe: nenhuma linha de Presidente no {turno}º turno "
                         "(o TSE já publicou este turno?)")
    return mun, por_uf, br, extras


def ler_candidatos(caminho, ano, turno):
    """Devolve (votos por (uf, cd), votos por uf, votos br, metadados, extras)."""
    mun, por_uf, br, meta = {}, {}, {}, {}
    extras = {"datas": set(), "destinacoes": {}, "linhas": 0}
    for ln in tf.ler_csv_zip(caminho, f"votacao_candidato_munzona_{ano}_BR.csv"):
        if not cargo_ok(ln, turno):
            continue
        extras["linhas"] += 1
        extras["datas"].add(tf.data_iso_br(ln["DT_GERACAO"]))
        dest = ln["NM_TIPO_DESTINACAO_VOTOS"].strip()
        extras["destinacoes"][dest] = extras["destinacoes"].get(dest, 0) + inteiro(
            ln["QT_VOTOS_NOMINAIS"])
        nr = inteiro(ln["NR_CANDIDATO"])
        v = inteiro(ln["QT_VOTOS_NOMINAIS_VALIDOS"])
        uf, cd = ln["SG_UF"].strip(), cod_mun(ln["CD_MUNICIPIO"])
        d = mun.setdefault((uf, cd), {})
        d[nr] = d.get(nr, 0) + v
        u = por_uf.setdefault(uf, {})
        u[nr] = u.get(nr, 0) + v
        br[nr] = br.get(nr, 0) + v
        meta.setdefault(nr, {
            "numero": nr,
            "nome_urna": ln["NM_URNA_CANDIDATO"].strip(),
            "partido": ln["SG_PARTIDO"].strip(),
            "sq_candidato": ln["SQ_CANDIDATO"].strip(),
            "situacao_turno": ln["DS_SIT_TOT_TURNO"].strip(),
        })
    return mun, por_uf, br, meta, extras


def lista_votos(votos, numeros):
    """Todos os candidatos do turno (inclusive com 0), ordenados por votos."""
    return sorted(({"numero": n, "votos": votos.get(n, 0)} for n in numeros),
                  key=lambda c: (-c["votos"], c["numero"]))


def montar(args):
    ano, turno = args.ano, args.turno
    cd_eleicao = args.cd_eleicao or CD_ELEICAO.get((ano, turno))
    if not cd_eleicao:
        raise SystemExit("informe --cd-eleicao (código da eleição no resultados.tse.jus.br)")
    dl = args.dl_dir
    print("baixando/conferindo arquivos do TSE em", dl)
    f_cand = tf.baixar(tf.url_votacao_candidato(ano), dl)
    f_det = tf.baixar(tf.url_detalhe(ano), dl)
    cfg, f_cfg = tf.baixar_json(tf.url_config_municipios(ano, cd_eleicao), dl,
                                f"mun-e{cd_eleicao}-cm.json")
    f_pag = tf.baixar(args.url_paises, dl, "locais-votacao-exterior.html", forcar=True)
    with open(f_pag["caminho"], "rb") as f:
        bruto = f.read()
    if bruto[:2] == b"\x1f\x8b":
        bruto = gzip.decompress(bruto)
    linhas_paises = tp.ler_tabela(bruto.decode("utf-8"))

    print("lendo detalhe da votação...")
    det_mun, det_uf, det_br, det_x = ler_detalhe(f_det["caminho"], ano, turno)
    print("lendo votação por candidato...")
    cand_mun, cand_uf, cand_br, meta, cand_x = ler_candidatos(f_cand["caminho"], ano, turno)
    numeros = sorted(meta)

    ibge = {}
    for abr in cfg["abr"]:
        for m in abr["mu"]:
            ibge[(abr["cd"].upper(), cod_mun(m["cd"]))] = (m.get("cdi") or "").strip()

    rel = va.Relatorio()
    chaves_det, chaves_cand = set(det_mun), set(cand_mun)
    rel.checar(chaves_det == chaves_cand, "mesmos municípios nos dois arquivos do TSE",
               f"só detalhe: {sorted(chaves_det - chaves_cand)[:20]}; "
               f"só candidatos: {sorted(chaves_cand - chaves_det)[:20]}")
    rel.checar(det_x["anulados"] == 0, "sem votos anulados/sub judice/apuração separada",
               f"{det_x['anulados']} votos (não cabem em validos+brancos+nulos)")
    sem_ibge = sorted(f"{uf}/{cd} {d['nome']}" for (uf, cd), d in det_mun.items()
                      if uf != "ZZ" and not ibge.get((uf, cd)))
    rel.checar(not sem_ibge, "todo município do Brasil com cod_ibge",
               f"{len(sem_ibge)} sem código: {sem_ibge}")
    fora_cfg = sorted(f"{uf}/{cd}" for (uf, cd) in det_mun if (uf, cd) not in ibge)
    rel.checar(not fora_cfg, "todo município/cidade dos resultados consta da configuração do TSE",
               str(fora_cfg))

    ufs = {}
    for (uf, cd), d in det_mun.items():
        u = ufs.setdefault(uf, {"totais": novo_total(), "votos": {}, "municipios": {},
                                "direto_totais": det_uf[uf], "direto_votos": cand_uf.get(uf, {})})
        votos = cand_mun.get((uf, cd), {})
        u["municipios"][cd] = {"nome": d["nome"], "totais": d["totais"], "votos": votos}
        somar(u["totais"], d["totais"])
        for nr, v in votos.items():
            u["votos"][nr] = u["votos"].get(nr, 0) + v
    br = {"totais": novo_total(), "votos": {}, "direto_totais": det_br, "direto_votos": cand_br}
    for u in ufs.values():
        somar(br["totais"], u["totais"])
        for nr, v in u["votos"].items():
            br["votos"][nr] = br["votos"].get(nr, 0) + v

    cidades_zz = {cd: m["nome"] for cd, m in ufs.get("ZZ", {"municipios": {}})["municipios"].items()}
    mapa, lacunas = tp.mapear(cidades_zz, linhas_paises)
    exterior = {"paises": {}}
    for cd, c in ufs.get("ZZ", {"municipios": {}})["municipios"].items():
        pais = mapa[cd]["pais"] if cd in mapa else PAIS_LACUNA
        p = exterior["paises"].setdefault(pais, {"totais": novo_total(), "votos": {},
                                                 "cidades": {}, "continente": None})
        if cd in mapa:
            p["continente"] = mapa[cd]["continente"]
        p["cidades"][cd] = c
        somar(p["totais"], c["totais"])
        for nr, v in c["votos"].items():
            p["votos"][nr] = p["votos"].get(nr, 0) + v

    va.validar(rel, ano, turno, br, ufs, exterior)

    datas = sorted(det_x["datas"] | cand_x["datas"])
    arquivos = [
        {"url": f_cand["url"], "sha256": f_cand["sha256"], "bytes": f_cand["bytes"],
         "last_modified": f_cand["last_modified"], "dt_geracao": sorted(cand_x["datas"])},
        {"url": f_det["url"], "sha256": f_det["sha256"], "bytes": f_det["bytes"],
         "last_modified": f_det["last_modified"], "dt_geracao": sorted(det_x["datas"])},
        {"url": f_cfg["url"], "sha256": f_cfg["sha256"], "uso": "código TSE -> IBGE",
         "dt_geracao": tf.data_iso_br(cfg.get("dg", "01/01/1900"))},
    ]
    fonte = {
        "orgao": "TSE",
        "urls": [f_cand["url"], f_det["url"], f_cfg["url"]],
        "data_arquivo_tse": datas[-1],
        "sha256": "; ".join(f"{a['url'].rsplit('/', 1)[-1]}={a['sha256']}" for a in arquivos[:2]),
        "arquivos": arquivos,
    }
    fonte_ext = dict(fonte)
    fonte_ext["urls"] = fonte["urls"] + [tp.PAGINA_OFICIAL]
    fonte_ext["arquivos"] = arquivos + [{
        "url": f_pag["url"], "pagina_oficial": tp.PAGINA_OFICIAL, "sha256": f_pag["sha256"],
        "uso": "país de cada cidade do exterior (cópia arquivada da página do TSE)",
        "data_copia": tp.DATA_COPIA}]
    return dict(rel=rel, br=br, ufs=ufs, exterior=exterior, meta=meta, numeros=numeros,
                ibge=ibge, fonte=fonte, fonte_ext=fonte_ext, lacunas=lacunas, mapa=mapa,
                extras={"detalhe": det_x, "candidatos": cand_x})


def gravar(caminho, obj):
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    with open(caminho, "w", encoding="utf-8", newline="\n") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")


def escrever(args, r):
    ano, turno, n = args.ano, args.turno, r["numeros"]
    saida = args.saida or os.path.join(RAIZ, "dados", "eleicao", str(ano), f"{turno}turno")
    agora = dt.datetime.now(dt.timezone(dt.timedelta(hours=-3))).replace(microsecond=0).isoformat()
    base = {"eleicao": ano, "turno": turno, "cargo": "Presidente"}
    notas = [NOTA_ABSTENCAO]
    ordem_uf = sorted((u for u in r["ufs"] if u != "ZZ")) + (["ZZ"] if "ZZ" in r["ufs"] else [])

    gravar(os.path.join(saida, "brasil.json"), {
        **base, "nivel": "BR", "gerado_em": agora, "fonte": r["fonte"], "notas": notas,
        "totais": r["br"]["totais"], "candidatos": lista_votos(r["br"]["votos"], n),
        "ufs": [{"uf": uf, "nome": UF_NOMES.get(uf, uf), "totais": r["ufs"][uf]["totais"],
                 "candidatos": lista_votos(r["ufs"][uf]["votos"], n)} for uf in ordem_uf],
    })
    for uf in ordem_uf:
        if uf == "ZZ":
            continue
        u = r["ufs"][uf]
        municipios = sorted(u["municipios"].items(), key=lambda kv: tp.normalizar(kv[1]["nome"]))
        gravar(os.path.join(saida, "uf", f"{uf}.json"), {
            **base, "nivel": "UF", "uf": uf, "nome": UF_NOMES.get(uf, uf), "gerado_em": agora,
            "fonte": r["fonte"], "totais": u["totais"], "candidatos": lista_votos(u["votos"], n),
            "municipios": [{"cod_tse": cd, "cod_ibge": r["ibge"].get((uf, cd), ""),
                            "nome": m["nome"], "totais": m["totais"],
                            "candidatos": lista_votos(m["votos"], n)} for cd, m in municipios],
        })
    paises = sorted(r["exterior"]["paises"].items(),
                    key=lambda kv: (kv[0] == PAIS_LACUNA, tp.normalizar(kv[0])))
    gravar(os.path.join(saida, "exterior.json"), {
        **base, "nivel": "EXTERIOR", "gerado_em": agora, "fonte": r["fonte_ext"],
        "notas": notas + ["País de cada cidade: página oficial do TSE 'Locais de votação no "
                          "exterior'. Cidades sem correspondência ficam em '"
                          f"{PAIS_LACUNA}' (ver 'lacunas')."],
        "totais": r["ufs"]["ZZ"]["totais"] if "ZZ" in r["ufs"] else va.soma_totais([]),
        "candidatos": lista_votos(r["ufs"].get("ZZ", {"votos": {}})["votos"], n),
        "paises": [{"pais": pais, "continente": p["continente"],
                    **({"lacuna": True} if pais == PAIS_LACUNA else {}),
                    "totais": p["totais"], "candidatos": lista_votos(p["votos"], n),
                    "cidades": [{"cod_tse": cd, "nome": c["nome"], "totais": c["totais"],
                                 "candidatos": lista_votos(c["votos"], n)}
                                for cd, c in sorted(p["cidades"].items(),
                                                    key=lambda kv: tp.normalizar(kv[1]["nome"]))]}
                   for pais, p in paises],
        "lacunas": r["lacunas"],
    })
    cands = sorted(r["meta"].values(), key=lambda c: (-r["br"]["votos"].get(c["numero"], 0)))
    gravar(os.path.join(saida, "candidatos.json"), {
        "eleicao": ano, "turno": turno, "gerado_em": agora, "fonte": r["fonte"],
        "candidatos": cands,
    })
    return saida


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--turno", type=int, choices=(1, 2), required=True)
    ap.add_argument("--ano", type=int, default=2026)
    ap.add_argument("--cd-eleicao", type=int, default=None,
                    help="código da eleição no resultados.tse.jus.br (2026: 6257/6258)")
    ap.add_argument("--dl-dir", default=os.path.join(tempfile.gettempdir(), "dados-eleicao", "dl"))
    ap.add_argument("--saida", default=None)
    ap.add_argument("--url-paises", default=tp.URL_ARQUIVADA)
    args = ap.parse_args()
    r = montar(args)
    rel = r["rel"]
    print(f"\nvalidações OK ({len(rel.ok)}):")
    for x in rel.ok:
        print("  ok", x)
    if r["lacunas"]:
        print(f"\nlacunas (país não identificado): {len(r['lacunas'])}")
        for x in r["lacunas"]:
            print(f"  {x['cod_tse']} {x['nome']}: {x['motivo']}")
    if rel.erros:
        print(f"\nFALHAS ({len(rel.erros)}):")
        for x in rel.erros[:200]:
            print("  ERRO", x)
        print("nada foi gravado.")
        sys.exit(1)
    saida = escrever(args, r)
    t = r["br"]["totais"]
    print("\nBrasil:", json.dumps(t, ensure_ascii=False))
    for c in lista_votos(r["br"]["votos"], r["numeros"]):
        print(f"  {c['numero']:>3} {r['meta'][c['numero']]['nome_urna']:<30} {c['votos']:>12,}")
    print("destinações (arquivo de candidatos):", r["extras"]["candidatos"]["destinacoes"])
    print("gravado em", saida)


if __name__ == "__main__":
    main()
