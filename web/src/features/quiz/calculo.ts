import type { CandidatoId } from "@/types/comum";
import { CANDIDATOS_ORDEM } from "@/types/comum";
import type { Caminho, PerguntaView, Respostas } from "./tipos";

/**
 * Cálculo de afinidade (dados/quiz/esquema.json, calculo_no_site). Roda só no navegador.
 *
 * - resposta: A, B ou C ("Não tenho uma opinião formada sobre o tema"); C fica fora do cálculo;
 * - para cada candidato com posição na pergunta: concordância = 1 se a pessoa escolheu o
 *   caminho dele, 0 se escolheu o outro; sem posição = fora do cálculo daquele candidato;
 * - peso: 2 se "importante para mim", senão 1;
 * - afinidade = média ponderada das concordâncias (em %), com o número de perguntas usadas.
 */
export function concordancia(escolha: Caminho, caminhoDoPlano: Caminho): 0 | 1 {
  return escolha === caminhoDoPlano ? 1 : 0;
}

export interface Afinidade {
  /** Percentual inteiro (0–100) ou null quando não há base de cálculo. */
  percentual: number | null;
  /** Número de perguntas usadas no cálculo. */
  base: number;
}

export interface ItemResultado {
  pergunta: PerguntaView;
  /** Caminho escolhido pela pessoa. */
  escolha: Caminho;
  /** Caminho que corresponde à proposta do candidato. */
  caminhoDoPlano: Caminho;
  importante: boolean;
}

export interface ResultadoCandidato {
  geral: Afinidade;
  porCategoria: Record<string, Afinidade>;
  /** Situações em que a pessoa escolheu o caminho do plano. */
  mesmoCaminho: ItemResultado[];
  /** Situações em que a pessoa escolheu o outro caminho. */
  outroCaminho: ItemResultado[];
  /** Perguntas respondidas com A ou B em que o candidato não tem proposta registrada. */
  semProposta: PerguntaView[];
}

export interface ResultadoQuiz {
  /** Perguntas respondidas com A ou B. */
  respondidas: number;
  /** Perguntas respondidas com C (fora do cálculo). */
  semOpiniao: PerguntaView[];
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
    mesmoCaminho: [],
    outroCaminho: [],
    semProposta: [],
  };

  for (const p of perguntas) {
    const resp = respostas[p.id];
    if (!resp || resp.escolha === "C") continue;
    const caminhoDoPlano = p.posicoes[c].opcao;
    if (caminhoDoPlano === null) {
      r.semProposta.push(p);
      continue;
    }
    const peso = resp.importante ? 2 : 1;
    const conc = concordancia(resp.escolha, caminhoDoPlano);
    const cat = acc.get(p.categoria) ?? { soma: 0, pesos: 0, base: 0 };
    for (const a of [total, cat]) {
      a.soma += conc * peso;
      a.pesos += peso;
      a.base += 1;
    }
    acc.set(p.categoria, cat);

    const item: ItemResultado = {
      pergunta: p,
      escolha: resp.escolha,
      caminhoDoPlano,
      importante: resp.importante,
    };
    (conc === 1 ? r.mesmoCaminho : r.outroCaminho).push(item);
  }

  r.geral = afinidade(total.soma, total.pesos, total.base);
  for (const [cat, a] of acc) r.porCategoria[cat] = afinidade(a.soma, a.pesos, a.base);
  return r;
}

export function calcularResultado(perguntas: PerguntaView[], respostas: Respostas): ResultadoQuiz {
  let respondidas = 0;
  const semOpiniao: PerguntaView[] = [];
  const categorias: string[] = [];
  for (const p of perguntas) {
    const resp = respostas[p.id];
    if (!resp) continue;
    if (resp.escolha === "C") {
      semOpiniao.push(p);
      continue;
    }
    respondidas += 1;
    if (!categorias.includes(p.categoria)) categorias.push(p.categoria);
  }
  categorias.sort((a, b) => a.localeCompare(b, "pt-BR"));
  const porCandidato = Object.fromEntries(
    CANDIDATOS_ORDEM.map((c) => [c, calcularCandidato(c, perguntas, respostas)]),
  ) as Record<CandidatoId, ResultadoCandidato>;
  return { respondidas, semOpiniao, categorias, porCandidato };
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
