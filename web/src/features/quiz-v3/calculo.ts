import type { CandidatoId } from "@/types/comum";
import { CANDIDATOS_ORDEM } from "@/types/comum";
import type { Caminho, Escala, Intensidade, PerguntaView, Respostas } from "./tipos";

/**
 * Cálculo de afinidade da versão 3 (escala de 5 posições). Roda só no navegador.
 *
 * - resposta: 1 "Totalmente o caminho A", 2 "Mais para o caminho A", 3 "Não tenho uma
 *   opinião formada sobre o tema" (fora do cálculo), 4 "Mais para o caminho B",
 *   5 "Totalmente o caminho B";
 * - para cada candidato com posição na pergunta (caminho X do plano): "Totalmente X" = 1,
 *   "Mais para X" = 0,5, qualquer resposta para o outro caminho = 0; sem posição = fora do
 *   cálculo daquele candidato. Caminhos convergentes (os dois planos no mesmo caminho)
 *   recebem, portanto, a mesma pontuação;
 * - peso: 2 se "importante para mim", senão 1;
 * - afinidade = média ponderada das pontuações (em %), com o número de perguntas usadas.
 */

/** Caminho e intensidade de uma posição da escala; null para "sem opinião formada". */
export function lerEscala(e: Escala): { caminho: Caminho; intensidade: Intensidade } | null {
  if (e === 1) return { caminho: "A", intensidade: "totalmente" };
  if (e === 2) return { caminho: "A", intensidade: "mais" };
  if (e === 4) return { caminho: "B", intensidade: "mais" };
  if (e === 5) return { caminho: "B", intensidade: "totalmente" };
  return null;
}

export function pontuacao(caminho: Caminho, intensidade: Intensidade, caminhoDoPlano: Caminho): 0 | 0.5 | 1 {
  if (caminho !== caminhoDoPlano) return 0;
  return intensidade === "totalmente" ? 1 : 0.5;
}

export interface Afinidade {
  /** Percentual inteiro (0–100) ou null quando não há base de cálculo. */
  percentual: number | null;
  /** Número de perguntas usadas no cálculo. */
  base: number;
}

export interface ItemResultado {
  pergunta: PerguntaView;
  /** Caminho para o qual a pessoa respondeu. */
  caminho: Caminho;
  intensidade: Intensidade;
  /** Caminho que corresponde à proposta do candidato. */
  caminhoDoPlano: Caminho;
  /** 1, 0,5 ou 0. */
  pontos: number;
  importante: boolean;
}

export interface ResultadoCandidato {
  geral: Afinidade;
  porCategoria: Record<string, Afinidade>;
  /** Situações em que a pessoa respondeu para o caminho do plano. */
  mesmoCaminho: ItemResultado[];
  /** Situações em que a pessoa respondeu para o outro caminho. */
  outroCaminho: ItemResultado[];
  /** Perguntas respondidas para um dos caminhos em que o candidato não tem proposta registrada. */
  semProposta: PerguntaView[];
}

export interface ResultadoQuiz {
  /** Perguntas respondidas para um dos caminhos. */
  respondidas: number;
  /** Perguntas respondidas com "sem opinião formada" (fora do cálculo). */
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
    const lida = resp ? lerEscala(resp.escala) : null;
    if (!resp || !lida) continue;
    const caminhoDoPlano = p.posicoes[c].opcao;
    if (caminhoDoPlano === null) {
      r.semProposta.push(p);
      continue;
    }
    const peso = resp.importante ? 2 : 1;
    const pontos = pontuacao(lida.caminho, lida.intensidade, caminhoDoPlano);
    const cat = acc.get(p.categoria) ?? { soma: 0, pesos: 0, base: 0 };
    for (const a of [total, cat]) {
      a.soma += pontos * peso;
      a.pesos += peso;
      a.base += 1;
    }
    acc.set(p.categoria, cat);

    const item: ItemResultado = {
      pergunta: p,
      caminho: lida.caminho,
      intensidade: lida.intensidade,
      caminhoDoPlano,
      pontos,
      importante: resp.importante,
    };
    (lida.caminho === caminhoDoPlano ? r.mesmoCaminho : r.outroCaminho).push(item);
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
    if (!lerEscala(resp.escala)) {
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
