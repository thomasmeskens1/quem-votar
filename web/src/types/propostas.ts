import type { CandidatoId } from "./comum";

export type TipoItem = "principio" | "diagnostico" | "proposta";

export interface ItemPlano {
  id: string;
  tipo: TipoItem;
  pagina: number;
  pagina_fim?: number;
  secao_documento: string;
  trecho_literal: string;
  resumo_neutro: string;
  categorias: string[];
  categoria_principal: string | null;
  tema_sugerido: string | null;
  confianca_categorizacao?: string;
  criterio_aplicado?: string;
  tipo_anterior?: string;
  criterio_tipo?: string;
}

export interface PropostasArquivo {
  candidato: CandidatoId;
  fonte_id: string;
  sha256_fonte: string;
  gerado_em: string;
  cobertura: {
    total_paginas: number;
    paginas_processadas: number[];
    paginas_sem_texto: number[];
    observacoes: string[];
  };
  itens: ItemPlano[];
}
