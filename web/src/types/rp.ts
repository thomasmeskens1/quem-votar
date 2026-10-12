import type { CandidatoId, StatusAgenda, StatusCategoria, Vies } from "./comum";

/** Citação literal usada por um argumento de viés. */
export interface Citacao {
  proposta_id: string;
  texto: string;
}

export interface Argumento {
  argumento: string;
  proposta_ids: string[];
  citacoes: Citacao[];
}

/** Análise de um viés (RP) para uma categoria. */
export interface AnaliseRp {
  categoria: string;
  proposta_ids: string[];
  leitura_geral: string;
  pros: Argumento[];
  contras: Argumento[];
  observacao: string | null;
}

export interface AnaliseRpArquivo {
  agente: string;
  vies: Vies;
  candidato: CandidatoId;
  gerado_em: string;
  base?: unknown;
  analises: AnaliseRp[];
  categorias_sem_proposta?: string[];
}

/** Referência a um argumento: viés + lista + índice (e, no RI, índice da análise). */
export interface RefArgumento {
  vies: Vies;
  lista: "pros" | "contras";
  indice: number;
  indice_analise?: number;
  tema_original?: string;
  referencia_cruzada?: boolean;
}

export interface PontoConsenso {
  ponto: string;
  tipo: "pro" | "contra";
  refs: RefArgumento[];
  proposta_ids: string[];
}

export interface PosicaoVies {
  vies: Vies;
  posicao: string;
  refs: RefArgumento[];
}

export interface Divergencia {
  ponto: string;
  posicoes: PosicaoVies[];
  proposta_ids?: string[];
}

export interface ItemAgenda {
  id: string;
  item: string;
  vies_origem: Vies;
  status: StatusAgenda;
  ids: string[];
}

export interface SinteseCandidatoRp {
  status: StatusCategoria;
  mensagem?: string;
  proposta_ids: string[];
  consenso: PontoConsenso[];
  divergencias: Divergencia[];
  leituras: Record<Vies, string>;
  itens_agenda: ItemAgenda[];
}

export interface PontoComparativo {
  ponto: string;
  lula_ids: string[];
  flavio_ids: string[];
}

export interface CategoriaRp {
  categoria: string;
  por_candidato: Record<CandidatoId, SinteseCandidatoRp>;
  comparativo: {
    aproximacoes: PontoComparativo[];
    diferencas: PontoComparativo[];
  };
  observacao_simetria?: string;
}

export interface SinteseRpArquivo {
  agente: string;
  origem: "rp";
  gerado_em: string;
  categorias: CategoriaRp[];
}
