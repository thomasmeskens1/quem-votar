import type { CandidatoId } from "@/types/comum";
import { CANDIDATOS_ORDEM } from "@/types/comum";
import type { PerguntaView, Respostas, ValorResposta } from "./tipos";

/**
 * Cálculo de afinidade (dados/quiz/esquema.json, calculo_no_site). Roda só no navegador.
 *
 * - resposta: +2, +1, 0, -1, -2; "pular" fica fora do cálculo;
 * - posição do candidato: a_favor = +2, contra = -2, sem_proposta = fora do cálculo dele;
 * - concordância por pergunta = 1 - |resposta - posição| / 4 (0 a 1);
 * - peso: 2 se "importante para mim", senão 1;
 * - afinidade = média ponderada das concordâncias (em %), com o número de perguntas usadas.
 */
export const VALOR_POSICAO = { a_favor: 2, contra: -2 } as const;

export function concordancia(resposta: ValorResposta, posicao: number): number {
  return 1 - Math.abs(resposta - posicao) / 4;
}

export interface Afinidade {
  /** Percentual inteiro (0–100) ou null quando não há base de cálculo. */
  percentual: number | null;
  /** Número de perguntas usadas no cálculo. */
  base: number;
}

export type Sentido = "concordou" | "discordou" | "neutro";

export interface ItemResultado {
  pergunta: PerguntaView;
  valor: ValorResposta;
  importante: boolean;
  sentido: Sentido;
}

export interface ResultadoCandidato {
  geral: Afinidade;
  porCategoria: Record<string, Afinidade>;
  concordou: ItemResultado[];
  discordou: ItemResultado[];
  neutro: ItemResultado[];
  /** Perguntas respondidas em que o candidato não tem proposta registrada. */
  semProposta: PerguntaView[];
}

export interface ResultadoQuiz {
  respondidas: number;
  puladas: number;
  categorias: string[];
  porCandidato: Record<CandidatoId, ResultadoCandidato>;
}

function afinidade(soma: number, pesos: number, base: number): Afinidade {
  return { percentual: pesos > 0 ? Math.round((soma / pesos) * 100) : null, base };
}

function calcularCandidato(
  c: CandidatoId,
  perguntas: PerguntaView[],
  respostas: Respostas,
): ResultadoCandidato {
  const acc = new Map<string, { soma: number; pesos: number; base: number }>();
  const total = { soma: 0, pesos: 0, base: 0 };
  const r: ResultadoCandidato = {
    geral: { percentual: null, base: 0 },
    porCategoria: {},
    concordou: [],
    discordou: [],
    neutro: [],
    semProposta: [],
  };

  for (const p of perguntas) {
    const resp = respostas[p.id];
    if (!resp || resp.valor === null) continue;
    const pos = p.posicoes[c].posicao;
    if (pos === "sem_proposta") {
      r.semProposta.push(p);
      continue;
    }
    const valorPos = VALOR_POSICAO[pos];
    const peso = resp.importante ? 2 : 1;
    const conc = concordancia(resp.valor, valorPos);
    const cat = acc.get(p.categoria) ?? { soma: 0, pesos: 0, base: 0 };
    for (const a of [total, cat]) {
      a.soma += conc * peso;
      a.pesos += peso;
      a.base += 1;
    }
    acc.set(p.categoria, cat);

    const sentido: Sentido =
      resp.valor === 0 ? "neutro" : Math.sign(resp.valor) === Math.sign(valorPos) ? "concordou" : "discordou";
    r[sentido].push({ pergunta: p, valor: resp.valor, importante: resp.importante, sentido });
  }

  r.geral = afinidade(total.soma, total.pesos, total.base);
  for (const [cat, a] of acc) r.porCategoria[cat] = afinidade(a.soma, a.pesos, a.base);
  return r;
}

export function calcularResultado(perguntas: PerguntaView[], respostas: Respostas): ResultadoQuiz {
  let respondidas = 0;
  let puladas = 0;
  const categorias: string[] = [];
  for (const p of perguntas) {
    const resp = respostas[p.id];
    if (!resp) continue;
    if (resp.valor === null) {
      puladas += 1;
      continue;
    }
    respondidas += 1;
    if (!categorias.includes(p.categoria)) categorias.push(p.categoria);
  }
  categorias.sort((a, b) => a.localeCompare(b, "pt-BR"));
  const porCandidato = Object.fromEntries(
    CANDIDATOS_ORDEM.map((c) => [c, calcularCandidato(c, perguntas, respostas)]),
  ) as Record<CandidatoId, ResultadoCandidato>;
  return { respondidas, puladas, categorias, porCandidato };
}

/** Embaralhamento Fisher–Yates (nova ordem a cada sessão). */
export function embaralhar<T>(lista: readonly T[]): T[] {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
