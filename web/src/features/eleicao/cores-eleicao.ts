/**
 * Cores dos candidatos no painel de apuração. Lula (13) e Flávio Bolsonaro (22)
 * usam os tokens compartilhados de lib/cores.ts; os demais candidatos do 1º turno
 * recebem uma única cor neutra (cinza), sem relação com cores partidárias.
 */
import { CORES_CANDIDATOS } from "@/lib/cores";

/** Cor única (cinza) para os demais candidatos do 1º turno. */
export const COR_OUTROS = "#6b7280";

export const NUMERO_LULA = 13;
export const NUMERO_FLAVIO = 22;

export function corCandidato(numero: number): string {
  if (numero === NUMERO_LULA) return CORES_CANDIDATOS.lula.base;
  if (numero === NUMERO_FLAVIO) return CORES_CANDIDATOS.flavio.base;
  return COR_OUTROS;
}

export function fundoCandidato(numero: number): string {
  if (numero === NUMERO_LULA) return CORES_CANDIDATOS.lula.fundo;
  if (numero === NUMERO_FLAVIO) return CORES_CANDIDATOS.flavio.fundo;
  return "#f3f4f6";
}

/** Mistura a cor com branco: t = 1 → cor pura; t = 0 → branco. */
export function misturar(hex: string, t: number): string {
  const n = parseInt(hex.slice(1), 16);
  const canal = (c: number) => Math.round(255 - (255 - c) * t);
  const r = canal((n >> 16) & 255);
  const g = canal((n >> 8) & 255);
  const b = canal(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** Cinza para áreas sem votos apurados. */
export const COR_SEM_DADOS = "#e5e7eb";
