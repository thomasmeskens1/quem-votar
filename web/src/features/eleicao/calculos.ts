/**
 * Cálculos de apresentação (puros). Regras do esquema:
 *  - % de candidato = votos / votos_validos;
 *  - % de brancos e nulos = sobre comparecimento;
 *  - % de abstenção (e de comparecimento) = sobre eleitores_aptos (ver eleitoradoApurado).
 */
import type { CandidatoVotos, Totais } from "./tipos";

export function pct(parte: number, todo: number): number {
  return todo > 0 ? (parte / todo) * 100 : 0;
}

export function pctCandidato(votos: number, t: Totais): number {
  return pct(votos, t.votos_validos);
}

export interface Percentuais {
  brancos: number;
  nulos: number;
  abstencoes: number;
  comparecimento: number;
}

/**
 * Base de abstenção/comparecimento: eleitorado já apurado (comparecimento +
 * abstenções). Com a totalização encerrada é igual a eleitores_aptos (regra do
 * esquema); durante a apuração evita subestimar o comparecimento.
 */
export function eleitoradoApurado(t: Totais): number {
  return t.comparecimento + t.abstencoes || t.eleitores_aptos;
}

export function percentuais(t: Totais): Percentuais {
  const base = eleitoradoApurado(t);
  return {
    brancos: pct(t.brancos, t.comparecimento),
    nulos: pct(t.nulos, t.comparecimento),
    abstencoes: pct(t.abstencoes, base),
    comparecimento: pct(t.comparecimento, base),
  };
}

export interface Lideranca {
  numero: number;
  votos: number;
  pct: number;
  /** Diferença em pontos percentuais para o 2º colocado (0–100). */
  margem: number;
}

/** Candidato mais votado e margem sobre o segundo; null se não há votos. */
export function lider(candidatos: CandidatoVotos[], t: Totais): Lideranca | null {
  const ord = [...candidatos].sort((a, b) => b.votos - a.votos);
  const [p, s] = ord;
  if (!p || p.votos <= 0) return null;
  const pp = pctCandidato(p.votos, t);
  const ps = s ? pctCandidato(s.votos, t) : 0;
  return { numero: p.numero, votos: p.votos, pct: pp, margem: pp - ps };
}

export interface Variacao {
  antes: number;
  depois: number;
  /** depois − antes (votos ou pontos percentuais). */
  delta: number;
}

const variacao = (antes: number, depois: number): Variacao => ({
  antes,
  depois,
  delta: depois - antes,
});

export interface Comparativo {
  candidatos: Array<{ numero: number; votos: Variacao; pct: Variacao }>;
  brancos: { votos: Variacao; pct: Variacao };
  nulos: { votos: Variacao; pct: Variacao };
  abstencoes: { votos: Variacao; pct: Variacao };
  comparecimento: { votos: Variacao; pct: Variacao };
}

/** Variação 1º → 2º turno na mesma abrangência, para os números pedidos. */
export function comparar(
  t1: { totais: Totais; candidatos: CandidatoVotos[] },
  t2: { totais: Totais; candidatos: CandidatoVotos[] },
  numeros: number[],
): Comparativo {
  const votosDe = (l: CandidatoVotos[], n: number) => l.find((c) => c.numero === n)?.votos ?? 0;
  const p1 = percentuais(t1.totais);
  const p2 = percentuais(t2.totais);
  return {
    candidatos: numeros.map((n) => {
      const v1 = votosDe(t1.candidatos, n);
      const v2 = votosDe(t2.candidatos, n);
      return {
        numero: n,
        votos: variacao(v1, v2),
        pct: variacao(pctCandidato(v1, t1.totais), pctCandidato(v2, t2.totais)),
      };
    }),
    brancos: { votos: variacao(t1.totais.brancos, t2.totais.brancos), pct: variacao(p1.brancos, p2.brancos) },
    nulos: { votos: variacao(t1.totais.nulos, t2.totais.nulos), pct: variacao(p1.nulos, p2.nulos) },
    abstencoes: {
      votos: variacao(t1.totais.abstencoes, t2.totais.abstencoes),
      pct: variacao(p1.abstencoes, p2.abstencoes),
    },
    comparecimento: {
      votos: variacao(t1.totais.comparecimento, t2.totais.comparecimento),
      pct: variacao(p1.comparecimento, p2.comparecimento),
    },
  };
}

const fmtInt = new Intl.NumberFormat("pt-BR");
const fmtPct = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatarNumero = (n: number) => fmtInt.format(n);
export const formatarPct = (n: number) => `${fmtPct.format(n)}%`;
export function formatarDelta(n: number, unidade: "votos" | "pp"): string {
  const sinal = n > 0 ? "+" : n < 0 ? "−" : "±";
  const abs = Math.abs(n);
  return unidade === "votos" ? `${sinal}${fmtInt.format(abs)}` : `${sinal}${fmtPct.format(abs)} p.p.`;
}
