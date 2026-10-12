"""Validações automáticas dos resultados agregados (falham o script se não baterem)."""

CAMPOS = ("eleitores_aptos", "comparecimento", "abstencoes", "votos_validos", "brancos", "nulos",
          "secoes_nao_instaladas", "eleitores_secoes_nao_instaladas")

# Conferência externa informada pelo coordenador (soma do arquivo de candidatos).
CONFERENCIA_EXTERNA = {
    (2026, 1): {
        "votos_validos": 119300788,
        "candidatos": {13: 53879538, 22: 56104503},
    },
}


class Relatorio:
    def __init__(self):
        self.erros = []
        self.ok = []

    def checar(self, condicao, descricao, detalhe=""):
        if condicao:
            self.ok.append(descricao)
        else:
            self.erros.append(f"{descricao}: {detalhe}" if detalhe else descricao)
        return condicao


def checar_totais(rel, rotulo, t):
    """votos_validos + brancos + nulos = comparecimento e
    comparecimento + abstencoes + eleitores_secoes_nao_instaladas = eleitores_aptos;
    sem negativos."""
    ok = True
    if t["votos_validos"] + t["brancos"] + t["nulos"] != t["comparecimento"]:
        rel.erros.append(f"{rotulo}: validos+brancos+nulos != comparecimento {t}")
        ok = False
    if (t["comparecimento"] + t["abstencoes"] + t["eleitores_secoes_nao_instaladas"]
            != t["eleitores_aptos"]):
        rel.erros.append(f"{rotulo}: comparecimento+abstencoes+nao_instaladas != aptos {t}")
        ok = False
    if any(t[c] < 0 for c in CAMPOS):
        rel.erros.append(f"{rotulo}: valor negativo {t}")
        ok = False
    return ok


def soma_totais(lista):
    s = dict.fromkeys(CAMPOS, 0)
    for t in lista:
        for c in CAMPOS:
            s[c] += t[c]
    return s


def soma_candidatos(lista):
    s = {}
    for votos in lista:
        for nr, v in votos.items():
            s[nr] = s.get(nr, 0) + v
    return s


def validar(rel, ano, turno, br, ufs, exterior):
    """br/ufs/exterior: estruturas internas montadas por gerar_resultados.

    br = {"totais", "votos", "direto_totais", "direto_votos"}
    ufs = {uf: {"totais", "votos", "direto_*", "municipios": {cd: {...}}}}
    exterior = {"paises": {pais: {"totais", "votos", "cidades": {cd: {...}}}}}
    """
    n_niveis = 0
    for uf, u in ufs.items():
        for cd, m in u["municipios"].items():
            n_niveis += 1
            checar_totais(rel, f"{uf}/{cd}", m["totais"])
            if sum(m["votos"].values()) != m["totais"]["votos_validos"]:
                rel.erros.append(f"{uf}/{cd}: soma dos candidatos != votos válidos "
                                 f"{sum(m['votos'].values())} x {m['totais']['votos_validos']}")
        checar_totais(rel, uf, u["totais"])
        rel.checar(soma_totais(m["totais"] for m in u["municipios"].values()) == u["totais"],
                   f"{uf}: soma dos municípios = UF (totais)")
        rel.checar(u["totais"] == u["direto_totais"],
                   f"{uf}: totais agregados = totais lidos direto das linhas da UF")
        rel.checar(soma_candidatos(m["votos"] for m in u["municipios"].values()) == u["votos"],
                   f"{uf}: soma dos municípios = UF (candidatos)")
        rel.checar(u["votos"] == u["direto_votos"],
                   f"{uf}: votos agregados = votos lidos direto das linhas da UF")
    if not rel.erros:
        rel.ok.append(f"{n_niveis} municípios/cidades: validos+brancos+nulos=comparecimento, "
                      "comparecimento+abstencoes+eleitores_secoes_nao_instaladas=aptos e "
                      "candidatos=válidos")
    erros_antes = len(rel.erros)
    for pais, p in exterior["paises"].items():
        checar_totais(rel, f"ZZ/{pais}", p["totais"])
        if soma_totais(c["totais"] for c in p["cidades"].values()) != p["totais"]:
            rel.erros.append(f"ZZ/{pais}: soma das cidades != país")
    if len(rel.erros) == erros_antes:
        rel.ok.append(f"{len(exterior['paises'])} países do exterior: totais consistentes "
                      "e soma das cidades = país")
    if "ZZ" in ufs:
        rel.checar(soma_totais(p["totais"] for p in exterior["paises"].values())
                   == ufs["ZZ"]["totais"], "exterior: soma dos países = ZZ")
        rel.checar(soma_candidatos(p["votos"] for p in exterior["paises"].values())
                   == ufs["ZZ"]["votos"], "exterior: soma dos países = ZZ (candidatos)")
    checar_totais(rel, "BR", br["totais"])
    rel.checar(soma_totais(u["totais"] for u in ufs.values()) == br["totais"],
               "soma das UFs + exterior = Brasil (totais)")
    rel.checar(br["totais"] == br["direto_totais"],
               "Brasil agregado = Brasil lido direto de todas as linhas (detalhe)")
    rel.checar(soma_candidatos(u["votos"] for u in ufs.values()) == br["votos"],
               "soma das UFs + exterior = Brasil (candidatos)")
    rel.checar(br["votos"] == br["direto_votos"],
               "Brasil agregado = Brasil lido direto do arquivo de candidatos")
    rel.checar(sum(br["votos"].values()) == br["totais"]["votos_validos"],
               "Brasil: soma dos candidatos (arquivo de candidatos) = votos válidos (detalhe)",
               f"{sum(br['votos'].values())} x {br['totais']['votos_validos']}")
    esperado = CONFERENCIA_EXTERNA.get((ano, turno))
    if esperado:
        rel.checar(sum(br["votos"].values()) == esperado["votos_validos"],
                   f"conferência externa: votos válidos = {esperado['votos_validos']}",
                   str(sum(br["votos"].values())))
        for nr, v in esperado["candidatos"].items():
            rel.checar(br["votos"].get(nr) == v, f"conferência externa: candidato {nr} = {v}",
                       str(br["votos"].get(nr)))
    else:
        rel.ok.append(f"(sem conferência externa cadastrada para {ano}/{turno}º turno)")
