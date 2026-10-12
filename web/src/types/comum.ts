/** Identificadores e tipos compartilhados entre todos os conjuntos de dados. */

export type CandidatoId = "lula" | "flavio";

/** Ordem fixa de exibição: número de urna crescente (13, 22). */
export const CANDIDATOS_ORDEM: readonly CandidatoId[] = ["lula", "flavio"] as const;

export type Vies = "esquerda" | "centro" | "direita";

export const VIESES_ORDEM: readonly Vies[] = ["esquerda", "centro", "direita"] as const;

export type Confianca = "alta" | "media" | "baixa";

export type Horizonte = "curto" | "medio" | "longo";

/** Status de um candidato numa categoria/tema das sínteses. */
export type StatusCategoria =
  | "com_propostas"
  | "apenas_secundaria"
  | "sem_proposta_registrada";

/** Status de um item da lista comum de agenda (diretriz 12). */
export type StatusAgenda = "presente" | "parcial" | "ausente";

export interface CategoriaDef {
  nome: string;
  inclui: string[];
  exclui: string[];
}

export interface CategoriasArquivo {
  versao: number;
  aprovado_em: string;
  regra_geral: string;
  categorias: CategoriaDef[];
  sem_categoria: { regra: string; tema: string };
  ausencia: string;
}

export interface FontePlano {
  id: string;
  titulo: string;
  orgao: string;
  url: string;
  arquivo_no_zip?: string;
  pagina_origem: string;
  arquivo: string;
  data_coleta: string;
  sha256: string;
  tamanho_bytes: number;
  num_paginas: number;
}

export interface RegistroCandidato {
  candidato: CandidatoId;
  nome_completo: string;
  nome_urna?: string;
  numero_urna: string;
  partido: string;
  coligacao: string;
  situacao_candidatura: string;
  id_candidato_tse: string;
  numero_processo_tse?: string;
  fontes: FontePlano[];
  observacoes: string[];
}
