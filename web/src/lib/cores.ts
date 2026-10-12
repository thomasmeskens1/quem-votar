import type { CandidatoId, Vies } from "@/types/comum";

/**
 * Tokens de cor da interface.
 *
 * Candidatos: roxo (13) e azul (22), sem verde, amarelo ou vermelho.
 * Vieses: marrom, cinza e magenta, distintos das cores dos candidatos.
 * Status: tons de cinza (preenchido, claro, tracejado), sem cores valorativas.
 * Os mesmos valores estão nas classes de src/app/globals.css.
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
  lula: { base: "#6d28d9", fundo: "#f5f3ff", borda: "#a78bfa", nomeCor: "roxo" },
  flavio: { base: "#0369a1", fundo: "#f0f9ff", borda: "#7dd3fc", nomeCor: "azul" },
};

export const CORES_VIESES: Record<Vies, TokenCor> = {
  esquerda: { base: "#6b4f3a", fundo: "#f6f1ec", borda: "#b89a80", nomeCor: "marrom" },
  centro: { base: "#4b5563", fundo: "#f3f4f6", borda: "#9ca3af", nomeCor: "cinza" },
  direita: { base: "#9d174d", fundo: "#fdf0f5", borda: "#e889b0", nomeCor: "magenta" },
};

/** Cores dos status (presente/parcial/ausente etc.), independentes de candidato. */
export const CORES_STATUS = {
  positivo: { base: "#ffffff", fundo: "#374151", borda: "#374151" },
  intermediario: { base: "#1f2937", fundo: "#e5e7eb", borda: "#6b7280" },
  neutro: { base: "#374151", fundo: "#f3f4f6", borda: "#c3c8d0" },
  vazio: { base: "#4b5563", fundo: "#ffffff", borda: "#9ca3af" },
} as const;

export type ToneStatus = keyof typeof CORES_STATUS;

export const ROTULO_VIES: Record<Vies, string> = {
  esquerda: "Esquerda",
  centro: "Centro",
  direita: "Direita",
};
