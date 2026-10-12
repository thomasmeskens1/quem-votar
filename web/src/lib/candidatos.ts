import type { CandidatoId } from "@/types/comum";

/**
 * Metadados de exibição dos candidatos. A ordem segue o número de urna
 * (13, 22), conforme declarado na página de Metodologia.
 */
export interface CandidatoMeta {
  id: CandidatoId;
  /** Nome curto usado na interface. */
  nome: string;
  numero: string;
  partido: string;
  /** Pasta em public/fontes/ com o plano de governo. */
  pastaFonte: string;
}

export const CANDIDATOS: Record<CandidatoId, CandidatoMeta> = {
  lula: { id: "lula", nome: "Lula", numero: "13", partido: "PT", pastaFonte: "lula" },
  flavio: {
    id: "flavio",
    nome: "Flávio Bolsonaro",
    numero: "22",
    partido: "PL",
    pastaFonte: "flavio",
  },
};

export const ORDEM_CANDIDATOS: CandidatoId[] = ["lula", "flavio"];

export function isCandidatoId(v: string): v is CandidatoId {
  return v === "lula" || v === "flavio";
}

/** Caminho público do PDF do plano de governo. */
export function pdfPlano(c: CandidatoId): string {
  return `/fontes/${CANDIDATOS[c].pastaFonte}/plano-de-governo.pdf`;
}

/** Link para uma página específica do PDF do plano. */
export function pdfPagina(c: CandidatoId, pagina: number): string {
  return `${pdfPlano(c)}#page=${pagina}`;
}

/** Candidato dono de um id de item (ex.: "lula-057"). */
export function candidatoDoItem(id: string): CandidatoId | null {
  const prefixo = id.split("-")[0];
  return isCandidatoId(prefixo) ? prefixo : null;
}
