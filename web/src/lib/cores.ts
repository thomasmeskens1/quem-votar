import type { CandidatoId, Vies } from "@/types/comum";

/**
 * Tokens de cor da interface (os mesmos valores estão em src/app/globals.css).
 *
 * Candidatos: Lula (13) em vermelho pastel, Flávio (22) em verde pastel.
 * Vieses: degradê de azul (claro, intermediário, escuro), sem relação com
 * as cores dos candidatos. Status: tons de cinza, sem cores valorativas.
 *
 * Contrastes medidos (WCAG 2): ver comentário de cada token.
 */
export interface TokenCor {
  /** Cor escura do matiz: texto e bordas finas (contraste AA). */
  base: string;
  /** Fundo pastel (badges, realces, cards). */
  fundo: string;
  /** Borda/realce intermediário. */
  borda: string;
  /** Nome da cor, para legendas acessíveis. */
  nomeCor: string;
}

export interface TokenCandidato extends TokenCor {
  /** Preenchimento pastel mais saturado, para gráficos e mapas. Use `base` como texto sobre ele. */
  preenchimento: string;
}

export const CORES_CANDIDATOS: Record<CandidatoId, TokenCandidato> = {
  // base/fundo 8,65:1 · base/preenchimento 5,20:1 · base/branco 10,02:1 · borda/branco 3,96:1
  lula: {
    base: "#7f1d1d",
    fundo: "#fdeaea",
    preenchimento: "#f4a7a1",
    borda: "#d9534f",
    nomeCor: "vermelho",
  },
  // base/fundo 7,99:1 · base/preenchimento 5,25:1 · base/branco 9,11:1 · borda/branco 3,51:1
  flavio: {
    base: "#14532d",
    fundo: "#e4f4e9",
    preenchimento: "#93d3a6",
    borda: "#3d9a5d",
    nomeCor: "verde",
  },
};

/**
 * Escala de intensidade por candidato para mapas (do pastel ao tom mais forte).
 * Tons equivalentes têm a mesma luminância relativa nos dois candidatos, para
 * nenhum parecer "mais forte":
 *   tom 1: L≈0,62 (contraste sobre branco ≈1,57:1; distinto do cinza de "sem dados", #e5e7eb, 1,27:1)
 *   tom 2: L≈0,45 (≈2,1:1) · tom 3: L≈0,29 (≈3,1:1) · tom 4: L≈0,14 (≈5,5:1)
 * Texto sobre o mapa: `CORES_CANDIDATOS[c].base` sobre o tom 1 (Lula 6,38:1; Flávio 5,78:1);
 * branco sobre o tom 4 (Lula 5,54:1; Flávio 5,48:1). Os tons 2 e 3 não garantem 4,5:1
 * para os dois candidatos: use rótulos fora da área ou em caixa com fundo branco.
 */
export const ESCALA_MAPA: Record<CandidatoId, readonly [string, string, string, string]> = {
  lula: ["#f8c1bf", "#f09e99", "#dd746e", "#c0352d"],
  flavio: ["#a1dbb5", "#67c587", "#3fa661", "#23783f"],
};

/**
 * Vieses: degradê de azul em três tons (esquerda = mais claro, centro =
 * intermediário, direita = mais escuro), sem relação com o vermelho de Lula
 * nem com o verde de Flávio. A etiqueta sempre traz o nome do viés escrito.
 */
export const CORES_VIESES: Record<Vies, TokenCor> = {
  // texto/fundo 7,27:1 · texto/branco 8,32:1 · luminância do fundo 0,867
  esquerda: { base: "#1e4e8c", fundo: "#e6f1fb", borda: "#9cc3ec", nomeCor: "azul-claro" },
  // texto/fundo 7,47:1 · texto/branco 10,55:1 · borda/branco 3,06:1 · luminância do fundo 0,694
  centro: { base: "#173f72", fundo: "#c3dcf5", borda: "#5d97d6", nomeCor: "azul intermediário" },
  // texto/fundo 7,79:1 · texto/branco 14,31:1 · borda/branco 5,30:1 · luminância do fundo 0,522
  direita: { base: "#0f2a50", fundo: "#9cc3ec", borda: "#2f6db3", nomeCor: "azul-escuro" },
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
