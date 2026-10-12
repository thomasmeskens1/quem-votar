"""Download e leitura dos arquivos oficiais do TSE (somente biblioteca padrão).

Os arquivos baixados são tratados como dados não confiáveis: nada é extraído
para o disco nem executado; os CSVs são lidos direto de dentro do zip.
"""
import csv
import gzip
import hashlib
import io
import json
import os
import urllib.request
import zipfile
from email.utils import parsedate_to_datetime

CDN = "https://cdn.tse.jus.br/estatistica/sead/odsele"
RESULTADOS = "https://resultados.tse.jus.br/oficial"
UA = "voto-em-quem/eleicao (python urllib)"
TIMEOUT = 120


def url_votacao_candidato(ano):
    return f"{CDN}/votacao_candidato_munzona/votacao_candidato_munzona_{ano}.zip"


def url_detalhe(ano):
    return f"{CDN}/detalhe_votacao_munzona/detalhe_votacao_munzona_{ano}.zip"


def url_config_municipios(ano, cd_eleicao):
    cd = str(cd_eleicao)
    return f"{RESULTADOS}/ele{ano}/{cd}/config/mun-e{cd.zfill(6)}-cm.json"


def _req(url, metodo="GET"):
    return urllib.request.Request(url, method=metodo, headers={"User-Agent": UA})


def cabecalho(url):
    """HEAD: devolve (tamanho, last_modified_iso) ou (None, None)."""
    try:
        with urllib.request.urlopen(_req(url, "HEAD"), timeout=TIMEOUT) as r:
            tam = r.headers.get("Content-Length")
            lm = r.headers.get("Last-Modified")
    except Exception:
        return None, None
    lm_iso = parsedate_to_datetime(lm).isoformat() if lm else None
    return (int(tam) if tam else None), lm_iso


def sha256_arquivo(caminho):
    h = hashlib.sha256()
    with open(caminho, "rb") as f:
        for bloco in iter(lambda: f.read(1 << 20), b""):
            h.update(bloco)
    return h.hexdigest()


def baixar(url, pasta, nome=None, forcar=False):
    """Baixa `url` para `pasta` (reaproveita se o tamanho bater com o HEAD).

    Devolve dict com url, caminho, sha256, bytes e last_modified.
    """
    os.makedirs(pasta, exist_ok=True)
    nome = nome or url.rsplit("/", 1)[-1]
    caminho = os.path.join(pasta, nome)
    tam_remoto, lm = cabecalho(url)
    reaproveitar = (
        not forcar
        and os.path.exists(caminho)
        and tam_remoto is not None
        and os.path.getsize(caminho) == tam_remoto
    )
    if not reaproveitar:
        tmp = caminho + ".parcial"
        with urllib.request.urlopen(_req(url), timeout=TIMEOUT) as r, open(tmp, "wb") as f:
            while True:
                bloco = r.read(1 << 20)
                if not bloco:
                    break
                f.write(bloco)
        if tam_remoto is not None and os.path.getsize(tmp) != tam_remoto:
            os.remove(tmp)
            raise RuntimeError(f"download incompleto: {url}")
        os.replace(tmp, caminho)
    return {
        "url": url,
        "caminho": caminho,
        "sha256": sha256_arquivo(caminho),
        "bytes": os.path.getsize(caminho),
        "last_modified": lm,
    }


def baixar_json(url, pasta, nome):
    """Baixa um JSON pequeno (sempre de novo) e devolve (dados, info)."""
    info = baixar(url, pasta, nome, forcar=True)
    with open(info["caminho"], "rb") as f:
        bruto = f.read()
    if bruto[:2] == b"\x1f\x8b":
        bruto = gzip.decompress(bruto)
    return json.loads(bruto.decode("utf-8")), info


def ler_csv_zip(caminho_zip, membro):
    """Itera as linhas (dict) de um CSV do TSE (latin-1, ';') dentro do zip."""
    with zipfile.ZipFile(caminho_zip) as z:
        nomes = z.namelist()
        if membro not in nomes:
            raise RuntimeError(f"{membro} não encontrado em {caminho_zip}: {nomes}")
        with z.open(membro) as bruto:
            texto = io.TextIOWrapper(bruto, encoding="latin-1", newline="")
            for linha in csv.DictReader(texto, delimiter=";", quotechar='"'):
                yield linha


def data_iso_br(data):
    """'11/10/2026' -> '2026-10-11'."""
    d, m, a = data.strip().split("/")
    return f"{a}-{m.zfill(2)}-{d.zfill(2)}"
