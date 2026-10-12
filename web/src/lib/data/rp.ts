import type {
  AnaliseRp,
  AnaliseRpArquivo,
  Argumento,
  CandidatoId,
  CategoriaRp,
  RefArgumento,
  SinteseRpArquivo,
  Vies,
} from "@/types";
import { lerJson } from "./ler";

export function getSinteseRp(): SinteseRpArquivo {
  return lerJson<SinteseRpArquivo>("rp/sintese.json");
}

export function getCategoriaRp(nome: string): CategoriaRp | null {
  return getSinteseRp().categorias.find((c) => c.categoria === nome) ?? null;
}

export function getAnaliseRpArquivo(vies: Vies, c: CandidatoId): AnaliseRpArquivo {
  return lerJson<AnaliseRpArquivo>(`rp/${vies}/${c}.json`);
}

export function getAnaliseRp(vies: Vies, c: CandidatoId, categoria: string): AnaliseRp | null {
  return getAnaliseRpArquivo(vies, c).analises.find((a) => a.categoria === categoria) ?? null;
}

/** Resolve uma referência da síntese de RP para o argumento original do viés. */
export function resolverRefRp(
  c: CandidatoId,
  categoria: string,
  ref: RefArgumento,
): Argumento | null {
  const a = getAnaliseRp(ref.vies, c, categoria);
  return a?.[ref.lista]?.[ref.indice] ?? null;
}
