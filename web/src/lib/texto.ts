/**
 * Limpeza de textos vindos dos dados antes da exibição: nenhum identificador
 * técnico (nomes de campo com "_", ids internos, nomes de arquivo) aparece na
 * interface. Funções puras: podem ser usadas no servidor e no navegador.
 */

/** Rótulos legíveis para termos técnicos conhecidos (status e nomes de campo). */
const TERMOS: Record<string, string> = {
  // status de processos
  investigacao: "em investigação",
  denuncia_oferecida: "denúncia oferecida",
  denuncia_rejeitada: "denúncia rejeitada",
  reu: "réu",
  em_andamento: "em andamento",
  condenado_1a_instancia: "condenado em 1ª instância",
  condenado_2a_instancia: "condenado em 2ª instância",
  condenado_transitado: "condenado com trânsito em julgado",
  encerrado_por_decisao_judicial: "encerrado por decisão judicial",
  desfecho_nao_confirmado: "desfecho não confirmado em fonte oficial",
  // status de categorias
  com_propostas: "com propostas",
  apenas_secundaria: "apenas como tema secundário",
  sem_proposta_registrada: "sem proposta registrada",
  sem_categoria: "sem categoria",
  // campos
  desfecho_noticiado: "desfecho noticiado",
  status_atual: "situação atual",
  data_status: "data da situação",
  data_certidao: "data da certidão",
  ultimo_status_oficial: "último status oficial",
  historico_status: "histórico",
  status_descricao_fonte: "texto da fonte",
  trecho_fonte: "trecho da fonte",
  trecho_literal: "trecho literal",
  resumo_neutro: "resumo neutro",
  secao_documento: "seção do documento",
  pagina_fim: "página final",
  pagina_origem: "página de origem",
  numero_processo: "número do processo",
  fonte_ids: "fontes",
  proposta_ids: "propostas",
  itens_agenda: "itens de agenda",
  observacao_simetria: "nota de simetria",
  convergencias_parciais: "convergências parciais",
  ausencias_checklist: "lista comum de agenda",
  citacoes_literais: "citações literais",
  temas_sem_proposta: "temas sem proposta",
  relacao_entre_vieses: "relação entre os vieses",
  justificativa_confianca: "justificativa da confiança",
};

export interface ResolvedoresTexto {
  /** Converte id de item do plano (ex.: "lula-057") em texto, ex.: "proposta da p. 15". */
  proposta?: (id: string) => string | null;
  /** Converte id de item de agenda (ex.: "esq-01") em texto. */
  agenda?: (id: string) => string | null;
}

const RE_PARENTESE_TECNICO = /\s*\([^()]*(?:\w_\w|\.(?:md|json|csv|zip|py|pdf)\b|dados\/)[^()]*\)/g;

/** Devolve o texto sem identificadores técnicos. */
export function legivel(texto: string | null | undefined, r: ResolvedoresTexto = {}): string {
  if (!texto) return "";
  let t = texto.replace(RE_PARENTESE_TECNICO, "");
  t = t.replace(/\b(lula|flavio)-\d{3}\b/g, (id) => r.proposta?.(id) ?? "proposta do plano");
  t = t.replace(/\b(?:esq|cen|dir)-\d{2}\b/g, (id) => r.agenda?.(id) ?? "item da lista comum de agenda");
  t = t.replace(/\bri-ctx-lac-\d+\b/g, "lacuna registrada no contexto internacional");
  t = t.replace(/\bri-ctx-[a-z]+-\d+\b/g, "dado oficial de contexto");
  t = t.replace(/\brh-(?:lula|flavio)-f\d+\b/g, "fonte do dossiê");
  t = t.replace(/\b[A-Za-z0-9]+(?:_[A-Za-z0-9]+)+\b/g, (m) => TERMOS[m] ?? m.replace(/_/g, " "));
  return t.replace(/\s{2,}/g, " ").replace(/\s+([,.;:])/g, "$1").trim();
}

/** Primeira letra maiúscula (para títulos de itens). */
export function capitalizar(t: string): string {
  return t ? t.charAt(0).toLocaleUpperCase("pt-BR") + t.slice(1) : t;
}
