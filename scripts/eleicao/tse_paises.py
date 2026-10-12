"""Correspondência cidade do exterior (código TSE) -> país.

Os arquivos de resultados do TSE (SG_UF = "ZZ") trazem só o código e o nome
da cidade, sem o país. A única fonte oficial encontrada com o país é a página
do TSE "Locais de votação no exterior" (tabela País | Nome do posto | Cidade
com votação). Como www.tse.jus.br bloqueia acesso automatizado (HTTP 403), o
script lê a cópia dessa página arquivada no Internet Archive (URL "id_", que
devolve o HTML original sem alterações) e registra a URL e o sha256.

Regras (diretriz 2: nada é deduzido):
- o país vem sempre da tabela oficial; nenhum país é escrito à mão aqui;
- ALIASES só liga grafias diferentes da MESMA cidade entre o arquivo de
  resultados e a página (ex.: "MEXICO" x "Cidade do México"); o país continua
  vindo da página;
- NAO_APLICAR lista linhas da página que contradizem a própria fonte e não
  são usadas; essas cidades ficam como lacuna;
- cidade sem correspondência fica como lacuna (país não identificado).
"""
import html
import re
import unicodedata

PAGINA_OFICIAL = "https://www.tse.jus.br/hotsites/locais-votacao-exterior/"
URL_ARQUIVADA = (
    "https://web.archive.org/web/20260804135949id_/"
    "https://www.tse.jus.br/hotsites/locais-votacao-exterior/"
)
DATA_COPIA = "2026-08-04"

# nome no arquivo de resultados do TSE (normalizado) -> "Cidade com votação"
# ou "Nome do posto" na página oficial (mesma cidade, grafia diferente).
ALIASES = {
    "ACCRA": "Acra",
    "COPENHAGUE": "Copenhaguen",
    "GUATEMALA": "Cidade de Guatemala",
    "ISLAMABADE": "Islamabad",
    "KINGSTON-JAMAICA": "Kingston",
    "KUAITE": "Cidade do Kuwait",
    "MEXICO": "Cidade do México",
    "PANAMA": "Cidade do Panamá",
    "PASO LOS LIBRES": "Paso de los Libres",
    "PORT OF SPAIN": "Porto de Espanha",
    "RAMALLAH": "Ramala",
    "SALTO DEL GUAIRA": "Salto do Guairá",
    "SINGAPURA": "Cingapura",
    "TAIPE": "Taipei",
    "TALIN": "Talim",
}

# Linhas da página que não são aplicadas (fonte ambígua) e o motivo que vai
# para a lista de lacunas da cidade correspondente do arquivo de resultados.
NAO_APLICAR = {"LIUBLANA"}
MOTIVO_LACUNA = {
    "LIUBLIANA": (
        "a página oficial lista o posto 'Liublana' sob o país 'Eslováquia', "
        "enquanto o arquivo de resultados traz BRATISLAVA e LIUBLIANA como "
        "cidades distintas; a linha da fonte é ambígua e não foi aplicada"
    ),
}


def normalizar(texto):
    sem_acento = "".join(
        c for c in unicodedata.normalize("NFD", texto or "")
        if unicodedata.category(c) != "Mn"
    )
    return re.sub(r"\s+", " ", sem_acento.upper()).strip()


def _texto(celula):
    return html.unescape(re.sub(r"<[^>]+>", "", celula)).strip()


def ler_tabela(html_pagina):
    """Devolve lista de (continente, pais, posto, cidade) respeitando rowspan."""
    linhas = []
    partes = re.split(r"<h2[^>]*>", html_pagina)
    for parte in partes[1:]:
        continente = _texto(parte.split("</h2>", 1)[0])
        for corpo in re.findall(r"<tbody>(.*?)</tbody>", parte, re.S):
            pendentes = {}
            for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", corpo, re.S):
                celulas = re.findall(r"<td([^>]*)>(.*?)</td>", tr, re.S)
                valores = []
                for col in range(3):
                    if pendentes.get(col, (None, 0))[1] > 0:
                        v, n = pendentes[col]
                        pendentes[col] = (v, n - 1)
                        valores.append(v)
                        continue
                    if not celulas:
                        raise ValueError(f"linha de tabela incompleta: {tr[:200]}")
                    atrib, conteudo = celulas.pop(0)
                    v = _texto(conteudo)
                    m = re.search(r'rowspan="(\d+)"', atrib)
                    if m:
                        pendentes[col] = (v, int(m.group(1)) - 1)
                    valores.append(v)
                if celulas:
                    raise ValueError(f"células sobrando na tabela: {tr[:200]}")
                linhas.append((continente, *valores))
    if not linhas:
        raise ValueError("tabela de locais no exterior não encontrada na página")
    return linhas


def mapear(cidades, linhas):
    """cidades: dict cod_tse -> nome (TSE). Devolve (mapa, lacunas).

    mapa: cod_tse -> {"pais", "continente", "nome_na_fonte"}
    lacunas: lista de {"cod_tse", "nome", "motivo"}
    """
    por_nome = {}
    for continente, pais, posto, cidade in linhas:
        for nome in (cidade, posto):
            chave = normalizar(nome)
            if chave in NAO_APLICAR:
                continue
            por_nome.setdefault(chave, {})[(pais, continente)] = nome
    mapa, lacunas = {}, []
    for cod, nome in sorted(cidades.items()):
        chave = normalizar(nome)
        alvo = normalizar(ALIASES.get(chave, nome))
        achados = por_nome.get(alvo, {})
        if len(achados) == 1:
            (pais, continente), nome_fonte = next(iter(achados.items()))
            mapa[cod] = {"pais": pais, "continente": continente, "nome_na_fonte": nome_fonte}
            continue
        if len(achados) > 1:
            motivo = "nome aparece em mais de um país na fonte: " + ", ".join(
                sorted(p for p, _ in achados))
        else:
            motivo = MOTIVO_LACUNA.get(
                chave, "cidade ausente da página oficial de locais de votação no exterior")
        lacunas.append({"cod_tse": cod, "nome": nome, "motivo": motivo})
    return mapa, lacunas
