import type { CandidatoId, Vies } from "@/types/comum";

/**
 * Tokens de cor da interface.
 *
 * Candidatos: roxo (13) e azul (22), sem verde, amarelo ou vermelho.
 * Vieses: vermelho (esquerda), cinza (centro) e verde (direita), com fundos
 * pastéis e texto/borda escuros do mesmo matiz. Contraste do texto sobre o
 * fundo pastel: esquerda 6,58:1; centro 6,87:1; direita 5,92:1 (AA).
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
  esquerda: { base: "#a61b1b", fundo: "#fdecec", borda: "#c94f4f", nomeCor: "vermelho" },
  centro: { base: "#4b5563", fundo: "#f3f4f6", borda: "#9ca3af", nomeCor: "cinza" },
  direita: { base: "#146b34", fundo: "#e8f6ec", borda: "#3f9a5c", nomeCor: "verde" },
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
