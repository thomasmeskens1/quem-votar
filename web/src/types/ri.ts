import type {
  CandidatoId,
  Confianca,
  Horizonte,
  StatusAgenda,
  StatusCategoria,
  Vies,
} from "./comum";
import type {
  Argumento,
  Divergencia,
  PontoComparativo,
  PontoConsenso,
  RefArgumento,
} from "./rp";

export interface PassoCadeia {
  passo: "proposta" | "contexto" | "consequencia";
  ref_id?: string;
  citacao?: string;
  texto: string;
}

export interface CenarioVies {
  titulo: string;
  cadeia: PassoCadeia[];
  horizonte: Horizonte;
  confianca: Confianca;
  justificativa_confianca: string;
}

export interface AnaliseRi {
  tema: string;
  proposta_ids: string[];
  leitura_geral: string;
  pros: Argumento[];
  contras: Argumento[];
  cenarios: CenarioVies[];
}

export interface AnaliseRiArquivo {
  agente: string;
  vies: Vies;
  candidato: CandidatoId;
  gerado_em: string;
  analises: AnaliseRi[];
  sem_contexto_suficiente?: { proposta_id: string; motivo: string }[];
  temas_sem_proposta?: string[];
}

export interface ConvergenciaParcial {
  ponto: string;
  tipo: "pro" | "contra";
  vieses: Vies[];
  refs: RefArgumento[];
  proposta_ids: string[];
}

export interface SinteseCandidatoRi {
  status: StatusCategoria;
  mensagem?: string;
  proposta_ids: string[];
  proposta_ids_geopolitica_principal?: string[];
  proposta_ids_geopolitica_secundaria?: string[];
  analises_origem?: { vies: Vies; indice_analise: number; tema_original: string }[];
  consenso: PontoConsenso[];
  convergencias_parciais: ConvergenciaParcial[];
  divergencias: Divergencia[];
  leituras: Record<Vies, string>;
}

export interface OrigemCenario {
  vies: Vies;
  indice_analise: number;
  indice_cenario: number;
  tema_original: string;
  titulo_original: string;
  horizonte: Horizonte;
  confianca: Confianca;
  justificativa_confianca: string;
  cadeia: PassoCadeia[];
  referencia_cruzada?: boolean;
}

export type RelacaoVieses =
  | "equivalentes"
  | "unico"
  | "parcialmente_divergentes"
  | "complementares"
  | "divergentes";

export interface CenarioSintese {
  titulo: string;
  candidato: CandidatoId;
  relacao_entre_vieses: RelacaoVieses;
  origens: OrigemCenario[];
  /** Pode vir composto, ex.: "media (esquerda); baixa (centro)". */
  confianca: string;
  horizonte: string;
}

export interface DiferencaRi extends PontoComparativo {
  tipo?: "concretude";
  citacoes_literais?: { proposta_id: string; citacao: string }[];
  base_justificativas_confianca?: {
    candidato: CandidatoId;
    vies: Vies;
    indice_analise: number;
    indice_cenario: number;
    confianca: Confianca;
    justificativa_confianca: string;
  }[];
}

export interface ItemChecklistRi {
  id: string;
  item: string;
  criterio: string;
  vies_origem: Vies;
  lula: { status: StatusAgenda; ids: string[]; obs: string | null };
  flavio: { status: StatusAgenda; ids: string[]; obs: string | null };
}

export interface TemaRi {
  categoria: string;
  escopo: string;
  por_candidato: Record<CandidatoId, SinteseCandidatoRi>;
  comparativo: { aproximacoes: PontoComparativo[]; diferencas: DiferencaRi[] };
  ausencias_checklist: ItemChecklistRi[];
  cenarios: CenarioSintese[];
  observacao_simetria?: string;
}

export interface SinteseRiArquivo {
  agente: string;
  versao?: number;
  origem: "ri";
  gerado_em: string;
  notas_metodologicas: string[];
  categorias: TemaRi[];
}

export interface FonteContexto {
  id: string;
  titulo: string;
  orgao: string;
  url: string;
  data_publicacao: string | null;
  data_acesso: string;
  tipo: string;
}

export interface ItemContexto {
  id: string;
  tema: string;
  afirmacao: string;
  dados?: { valor: unknown; unidade: string | null; periodo: string | null };
  data_referencia?: string;
  fonte_ids: string[];
  trecho_fonte?: string;
}

export interface ContextoRiArquivo {
  gerado_em: string;
  fontes: FonteContexto[];
  secoes: Record<string, ItemContexto[]> & {
    lacunas?: { id: string; tema: string; motivo: string }[];
  };
}
