import type { CandidatoId, Vies } from "@/types/comum";

/**
 * Tokens de cor da interface.
 *
 * Candidatos: cores neutras e distinguíveis, escolhidas para NÃO coincidir com
 * as cores oficiais dos partidos (PT: vermelho; PL: azul/amarelo) nem com as
 * cores da bandeira. Vieses: cores próprias, sem relação com os candidatos.
 * Todas as cores de texto têm contraste >= 4,5:1 (AA) sobre branco.
 */
export interface TokenCor {
  /** Cor principal (texto/borda), contraste AA sobre branco. */
  base: string;
  /** Fundo suave para chips e cabeçalhos. */
  fundo: string;
  /** Borda/realce intermediário. */
  borda: string;
  /** Nome da cor, para legendas acessíveis. */
  nomeCor: string;
}

export const CORES_CANDIDATOS: Record<CandidatoId, TokenCor> = {
  lula: { base: "#5b21b6", fundo: "#f3f0ff", borda: "#a78bfa", nomeCor: "violeta" },
  flavio: { base: "#0f5f5a", fundo: "#ecfaf8", borda: "#5eb8ae", nomeCor: "verde-azulado" },
};

export const CORES_VIESES: Record<Vies, TokenCor> = {
  esquerda: { base: "#92400e", fundo: "#fdf6e9", borda: "#e0a458", nomeCor: "âmbar" },
  centro: { base: "#3f4b5b", fundo: "#f1f3f6", borda: "#9aa5b4", nomeCor: "cinza" },
  direita: { base: "#9d174d", fundo: "#fdf0f5", borda: "#e889b0", nomeCor: "magenta" },
};

/** Cores dos status (presente/parcial/ausente etc.), independentes de candidato. */
export const CORES_STATUS = {
  positivo: { base: "#14532d", fundo: "#e8f5ec", borda: "#86c79a" },
  intermediario: { base: "#713f12", fundo: "#fdf5e1", borda: "#e5c172" },
  neutro: { base: "#374151", fundo: "#f3f4f6", borda: "#c3c8d0" },
  vazio: { base: "#4b5563", fundo: "#ffffff", borda: "#9ca3af" },
} as const;

export type ToneStatus = keyof typeof CORES_STATUS;

export const ROTULO_VIES: Record<Vies, string> = {
  esquerda: "Esquerda",
  centro: "Centro",
  direita: "Direita",
};
