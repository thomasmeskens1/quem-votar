import path from "node:path";
import type {
  AnaliseRiArquivo,
  Argumento,
  CandidatoId,
  ContextoRiArquivo,
  FonteContexto,
  ItemContexto,
  RefArgumento,
  SinteseRiArquivo,
  TemaRi,
  Vies,
} from "@/types";
import { slugify } from "@/lib/slug";
import { lerJson } from "./ler";

export function getSinteseRi(): SinteseRiArquivo {
  return lerJson<SinteseRiArquivo>(path.join(process.cwd(), "content", "ri", "sintese.json"));
}

export function getTemasRi(): TemaRi[] {
  return getSinteseRi().categorias;
}

export function temaRiPorSlug(slug: string): TemaRi | null {
  return getTemasRi().find((t) => slugify(t.categoria) === slug) ?? null;
}

export function getAnaliseRiArquivo(vies: Vies, c: CandidatoId): AnaliseRiArquivo {
  return lerJson<AnaliseRiArquivo>(path.join(process.cwd(), "content", "ri", vies, `${c}.json`));
}

/** Resolve uma referência da síntese de RI (vies + indice_analise + lista + indice). */
export function resolverRefRi(c: CandidatoId, ref: RefArgumento): Argumento | null {
  if (ref.indice_analise === undefined) return null;
  const a = getAnaliseRiArquivo(ref.vies, c).analises[ref.indice_analise];
  return a?.[ref.lista]?.[ref.indice] ?? null;
}

export function getContextoRi(): ContextoRiArquivo {
  return lerJson<ContextoRiArquivo>(path.join(process.cwd(), "content", "ri", "contexto.json"));
}

let indiceCtx: Map<string, ItemContexto> | null = null;

export function getItemContexto(id: string): ItemContexto | null {
  if (!indiceCtx) {
    indiceCtx = new Map();
    for (const [secao, itens] of Object.entries(getContextoRi().secoes)) {
      if (secao === "lacunas" || !Array.isArray(itens)) continue;
      for (const i of itens as ItemContexto[]) indiceCtx.set(i.id, i);
    }
  }
  return indiceCtx.get(id) ?? null;
}

export function getFonteContexto(id: string): FonteContexto | null {
  return getContextoRi().fontes.find((f) => f.id === id) ?? null;
}
