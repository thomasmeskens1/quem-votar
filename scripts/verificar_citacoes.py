"""Verifica se toda citação das análises existe literalmente na fonte.

Uso: python scripts/verificar_citacoes.py [arquivo.json ...]
Sem argumentos, verifica todos os arquivos em dados/rp/*/ e dados/ri/*/.
Sai com código 1 se houver qualquer falha.
"""
import glob
import json
import re
import sys
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent


def norm(texto):
    return re.sub(r"\s+", " ", unicodedata.normalize("NFC", texto or "")).strip()


def carregar(caminho):
    with open(caminho, encoding="utf-8") as f:
        return json.load(f)


def indices():
    propostas = {}
    for cand in ("lula", "flavio"):
        for item in carregar(RAIZ / "dados" / "propostas" / f"{cand}.json")["itens"]:
            propostas[item["id"]] = item
    contexto = {}
    ctx = RAIZ / "dados" / "ri" / "contexto.json"
    if ctx.exists():
        for itens in carregar(ctx)["secoes"].values():
            for item in itens:
                contexto[item["id"]] = item
    return propostas, contexto


def verificar_citacao(texto, ref_id, propostas, contexto):
    if ref_id in propostas:
        return norm(texto) in norm(propostas[ref_id]["trecho_literal"])
    if ref_id in contexto:
        item = contexto[ref_id]
        return norm(texto) in norm(item.get("trecho_fonte")) or norm(texto) in norm(item.get("afirmacao"))
    return False


def verificar_arquivo(caminho, propostas, contexto):
    dados = carregar(caminho)
    cand = dados.get("candidato")
    falhas, total = [], 0

    def checar_argumentos(lista, onde):
        nonlocal total
        for i, arg in enumerate(lista):
            for pid in arg.get("proposta_ids", []):
                if pid not in propostas or propostas[pid]["tipo"] != "proposta":
                    falhas.append(f"{onde}[{i}]: proposta inexistente ou não é 'proposta': {pid}")
                elif cand and not pid.startswith(cand + "-"):
                    falhas.append(f"{onde}[{i}]: proposta de outro candidato: {pid}")
            if not arg.get("citacoes"):
                falhas.append(f"{onde}[{i}]: argumento sem citação")
            for c in arg.get("citacoes", []):
                total += 1
                if not verificar_citacao(c.get("texto"), c.get("proposta_id"), propostas, contexto):
                    falhas.append(f"{onde}[{i}]: citação não encontrada em {c.get('proposta_id')}: {c.get('texto', '')[:80]!r}")

    for a, analise in enumerate(dados.get("analises", [])):
        nome = analise.get("categoria") or analise.get("tema")
        checar_argumentos(analise.get("pros", []), f"{nome}/pros")
        checar_argumentos(analise.get("contras", []), f"{nome}/contras")
        for s, cen in enumerate(analise.get("cenarios", [])):
            passos = [p.get("passo") for p in cen.get("cadeia", [])]
            for obrigatorio in ("proposta", "contexto", "consequencia"):
                if obrigatorio not in passos:
                    falhas.append(f"{nome}/cenarios[{s}]: falta o passo '{obrigatorio}'")
            for p in cen.get("cadeia", []):
                if p.get("passo") in ("proposta", "contexto"):
                    total += 1
                    if not verificar_citacao(p.get("citacao"), p.get("ref_id"), propostas, contexto):
                        falhas.append(f"{nome}/cenarios[{s}]/{p['passo']}: citação não encontrada em {p.get('ref_id')}")
    return total, falhas


def main():
    arquivos = sys.argv[1:] or sorted(
        glob.glob(str(RAIZ / "dados" / "rp" / "*" / "*.json")) + glob.glob(str(RAIZ / "dados" / "ri" / "*" / "*.json"))
    )
    propostas, contexto = indices()
    houve_falha = False
    for caminho in arquivos:
        total, falhas = verificar_arquivo(caminho, propostas, contexto)
        rel = Path(caminho).resolve().relative_to(RAIZ)
        print(f"{rel}: {total} citações, {len(falhas)} falhas")
        for f in falhas[:20]:
            print("   -", f)
        houve_falha |= bool(falhas)
    sys.exit(1 if houve_falha else 0)


if __name__ == "__main__":
    main()
