import type { CandidatoId } from "@/types/comum";

/** Contrato de dados/quiz/perguntas.json (ver dados/quiz/esquema.json). */
export type PosicaoCandidato = "a_favor" | "contra" | "sem_proposta";

export interface CitacaoArquivo {
  proposta_id: string;
  texto: string;
}

export interface PosicaoArquivo {
  posicao: PosicaoCandidato;
  proposta_ids: string[];
  citacoes: CitacaoArquivo[];
  justificativa?: string;
}

export interface PerguntaArquivo {
  id: string;
  categoria: string;
  afirmacao: string;
  explicacao?: string;
  origem?: string;
  posicoes: Record<CandidatoId, PosicaoArquivo>;
}

export interface PerguntasArquivo {
  versao: number;
  exemplo?: boolean;
  gerado_em?: string;
  perguntas: PerguntaArquivo[];
}

/** Citação pronta para exibição: trecho literal + página do PDF. */
export interface CitacaoView {
  propostaId: string;
  texto: string;
  pagina: number | null;
  paginaFim: number | null;
}

export interface PosicaoView {
  posicao: PosicaoCandidato;
  citacoes: CitacaoView[];
}

/** Pergunta enviada ao componente cliente (somente dados públicos dos planos). */
export interface PerguntaView {
  id: string;
  categoria: string;
  /** Slug da página /comparativo/<categoria>. */
  categoriaSlug: string;
  afirmacao: string;
  explicacao: string | null;
  posicoes: Record<CandidatoId, PosicaoView>;
}

export interface QuizDados {
  /** true quando os dados vêm da fixture de exemplo (perguntas.json ainda não existe). */
  exemplo: boolean;
  perguntas: PerguntaView[];
}

/** Valor numérico da resposta: +2 (concordo totalmente) a -2 (discordo totalmente). */
export type ValorResposta = -2 | -1 | 0 | 1 | 2;

export interface Resposta {
  /** null = pulou a pergunta. */
  valor: ValorResposta | null;
  importante: boolean;
}

export type Respostas = Record<string, Resposta>;
