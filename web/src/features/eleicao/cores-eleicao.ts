/**
 * Cores do painel de apuração — SOMENTE tokens de lib/cores.ts.
 * Lula (13): vermelho pastel; Flávio (22): verde pastel (CORES_CANDIDATOS e
 * ESCALA_MAPA). Demais candidatos do 1º turno: cinza-escuro; sem dados: cinza
 * claro (tokens neutros de CORES_STATUS). Texto sempre em `base` (escuro, AA
 * sobre branco, sobre `fundo` e sobre `preenchimento`).
 */
import { CORES_CANDIDATOS, CORES_STATUS, ESCALA_MAPA } from "@/lib/cores";
import type { CandidatoId } from "@/types/comum";

export const NUMERO_LULA = 13;
export const NUMERO_FLAVIO = 22;

/** Cinza-escuro dos demais candidatos (preenchimento e texto; 10:1 sobre branco). */
export const COR_OUTROS = CORES_STATUS.positivo.fundo;
/** Cinza claro das áreas sem dados (não interativas). */
export const COR_SEM_DADOS = CORES_STATUS.intermediario.fundo;
/** Traços: divisa clara entre áreas, contorno do município e destaque/seleção. */
export const COR_TRACO_CLARO = CORES_STATUS.vazio.fundo;
export const COR_CONTORNO = CORES_STATUS.intermediario.borda;
export const COR_DESTAQUE = CORES_STATUS.neutro.base;
/** Fundo neutro de cartões de outros candidatos. */
export const COR_FUNDO_NEUTRO = CORES_STATUS.vazio.fundo;

function idCandidato(numero: number): CandidatoId | null {
  if (numero === NUMERO_LULA) return "lula";
  if (numero === NUMERO_FLAVIO) return "flavio";
  return null;
}

/** Cor de TEXTO/borda fina do candidato (contraste AA). */
export function corCandidato(numero: number): string {
  const id = idCandidato(numero);
  return id ? CORES_CANDIDATOS[id].base : COR_OUTROS;
}

/** Preenchimento de gráficos (barras, pins, marcadores). */
export function corPreenchimento(numero: number): string {
  const id = idCandidato(numero);
  return id ? CORES_CANDIDATOS[id].preenchimento : COR_OUTROS;
}

/** Fundo pastel (cartões em destaque). */
export function fundoCandidato(numero: number): string {
  const id = idCandidato(numero);
  return id ? CORES_CANDIDATOS[id].fundo : COR_FUNDO_NEUTRO;
}

/** Borda/realce intermediário (faixa lateral dos cartões). */
export function bordaCandidato(numero: number): string {
  const id = idCandidato(numero);
  return id ? CORES_CANDIDATOS[id].borda : COR_OUTROS;
}

/** Faixas de margem (p.p.) → índice da ESCALA_MAPA (0 = mais claro). */
export const FAIXAS_MAPA = [
  { rotulo: "até 5 p.p.", ate: 5 },
  { rotulo: "5–15 p.p.", ate: 15 },
  { rotulo: "15–30 p.p.", ate: 30 },
  { rotulo: "mais de 30 p.p.", ate: Infinity },
] as const;

export function faixaMargem(margem: number): number {
  const i = FAIXAS_MAPA.findIndex((f) => margem < f.ate);
  return i < 0 ? FAIXAS_MAPA.length - 1 : i;
}

/** Cor do mapa para o líder com a margem dada (outros candidatos: cinza-escuro único). */
export function corMapa(numero: number, margem: number): string {
  const id = idCandidato(numero);
  return id ? ESCALA_MAPA[id][faixaMargem(margem)] : COR_OUTROS;
}

/** Tom da escala por índice (legenda). */
export function tomEscala(numero: number, indice: number): string {
  const id = idCandidato(numero);
  return id ? ESCALA_MAPA[id][indice] : COR_OUTROS;
}
