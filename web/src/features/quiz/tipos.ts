import type { CandidatoId } from "@/types/comum";

/** Contrato de dados/quiz/perguntas.json, versão 2 (ver dados/quiz/esquema.json). */
export type Caminho = "A" | "B";
export type TipoPar = "dilema" | "unilateral" | "convergente";

export interface CitacaoArquivo {
  proposta_id: string;
  texto: string;
}

export interface PosicaoArquivo {
  /** Caminho que corresponde à proposta do candidato; null = sem proposta registrada. */
  opcao: Caminho | null;
  proposta_ids: string[];
  citacoes: CitacaoArquivo[];
  justificativa?: string;
}

export interface TermoArquivo {
  termo: string;
  explicacao: string;
}

export interface PerguntaArquivo {
  id: string;
  categoria: string;
  tipo?: TipoPar;
  situacao: string;
  fonte_situacao?: string | null;
  pergunta: string;
  opcoes: Record<Caminho, string>;
  termos?: TermoArquivo[];
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
  /** null = sem proposta registrada (fora do cálculo daquele candidato). */
  opcao: Caminho | null;
  citacoes: CitacaoView[];
}

export interface TermoView {
  termo: string;
  explicacao: string;
}

/** Pergunta enviada ao componente cliente (somente dados públicos dos planos). */
export interface PerguntaView {
  id: string;
  categoria: string;
  /** Slug da página /comparativo/<categoria>. */
  categoriaSlug: string;
  situacao: string;
  fonteSituacao: string | null;
  pergunta: string;
  opcoes: Record<Caminho, string>;
  termos: TermoView[];
  posicoes: Record<CandidatoId, PosicaoView>;
}

export interface QuizDados {
  /** true quando os dados vêm da fixture de exemplo (perguntas.json ainda não está na versão 2). */
  exemplo: boolean;
  perguntas: PerguntaView[];
}

/** A, B (caminhos vindos dos dados) ou C ("Não tenho uma opinião formada sobre o tema"). */
export type Escolha = Caminho | "C";

export interface Resposta {
  escolha: Escolha;
  importante: boolean;
}

export type Respostas = Record<string, Resposta>;
