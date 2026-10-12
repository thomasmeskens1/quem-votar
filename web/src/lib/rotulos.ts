import type { ToneStatus } from "./cores";

/** Vocabulário de status traduzido para linguagem clara, sem juízo de valor. */
export interface RotuloStatus {
  rotulo: string;
  tom: ToneStatus;
  descricao?: string;
}

const PROCESSO: Record<string, RotuloStatus> = {
  investigacao: { rotulo: "Em investigação", tom: "neutro" },
  denuncia_oferecida: { rotulo: "Denúncia oferecida", tom: "neutro" },
  denuncia_rejeitada: { rotulo: "Denúncia rejeitada", tom: "neutro" },
  reu: { rotulo: "Réu (ação em curso)", tom: "neutro" },
  em_andamento: { rotulo: "Em andamento", tom: "neutro" },
  suspenso: { rotulo: "Suspenso", tom: "neutro" },
  condenado_1a_instancia: { rotulo: "Condenado em 1ª instância", tom: "neutro" },
  condenado_2a_instancia: { rotulo: "Condenado em 2ª instância", tom: "neutro" },
  condenado_transitado: { rotulo: "Condenado (trânsito em julgado)", tom: "neutro" },
  absolvido: { rotulo: "Absolvido", tom: "neutro" },
  anulado: { rotulo: "Anulado", tom: "neutro" },
  arquivado: { rotulo: "Arquivado", tom: "neutro" },
  encerrado_por_decisao_judicial: { rotulo: "Encerrado por decisão judicial", tom: "neutro" },
  extinto: { rotulo: "Extinto", tom: "neutro" },
  prescrito: { rotulo: "Prescrito", tom: "neutro" },
  improcedente: { rotulo: "Julgado improcedente", tom: "neutro" },
  procedente: { rotulo: "Julgado procedente", tom: "neutro" },
  indeferido: { rotulo: "Indeferido", tom: "neutro" },
  desfecho_nao_confirmado: {
    rotulo: "Desfecho não confirmado em fonte oficial",
    tom: "vazio",
  },
  outro: { rotulo: "Outro (ver descrição)", tom: "neutro" },
};

const AGENDA: Record<string, RotuloStatus> = {
  presente: {
    rotulo: "Presente",
    tom: "positivo",
    descricao: "o critério do item é atendido por proposta do plano",
  },
  parcial: {
    rotulo: "Parcial",
    tom: "intermediario",
    descricao: "o tema é tratado, mas falta o elemento exigido pelo critério",
  },
  ausente: {
    rotulo: "Ausente",
    tom: "vazio",
    descricao: "nenhuma proposta do plano trata do tema do item",
  },
};

const CATEGORIA: Record<string, RotuloStatus> = {
  com_propostas: { rotulo: "Com propostas", tom: "neutro" },
  apenas_secundaria: {
    rotulo: "Apenas como tema secundário",
    tom: "intermediario",
    descricao:
      "o plano não tem proposta cujo objeto principal seja esta categoria; há proposta de outra categoria que a menciona como tema secundário",
  },
  sem_proposta_registrada: { rotulo: "Sem proposta registrada", tom: "vazio" },
};

function humanizar(v: string): string {
  const t = v.replace(/_/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export type DominioStatus = "processo" | "agenda" | "categoria";

export function rotuloStatus(dominio: DominioStatus, status: string): RotuloStatus {
  const mapa = dominio === "processo" ? PROCESSO : dominio === "agenda" ? AGENDA : CATEGORIA;
  return mapa[status] ?? { rotulo: humanizar(status), tom: "neutro" };
}

export const ROTULO_CONFIANCA: Record<string, string> = {
  alta: "Confiança alta",
  media: "Confiança média",
  baixa: "Confiança baixa",
};

export const ROTULO_HORIZONTE: Record<string, string> = {
  curto: "Curto prazo",
  medio: "Médio prazo",
  longo: "Longo prazo",
};

export const ROTULO_RELACAO: Record<string, string> = {
  equivalentes: "Vieses descrevem consequências equivalentes",
  complementares: "Vieses descrevem consequências complementares",
  parcialmente_divergentes: "Vieses descrevem consequências parcialmente divergentes",
  divergentes: "Vieses descrevem consequências divergentes",
  unico: "Cenário apresentado por um único viés",
};

export const ROTULO_PASSO: Record<string, string> = {
  proposta: "Proposta",
  contexto: "Fato oficial",
  consequencia: "Consequência possível",
};

export const ROTULO_ORIGEM: Record<string, string> = {
  oficial: "Fonte oficial",
  reportagem: "Reportagem",
};

export const AVISO_REPORTAGEM = "Reportagem — não constitui fato comprovado";

/** Formata datas ISO (AAAA-MM-DD...) em pt-BR; devolve o texto original se não for data. */
export function formatarData(v: string | null | undefined): string {
  if (!v) return "data não informada";
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(v);
  if (!m) return v;
  return `${m[3]}/${m[2]}/${m[1]}`;
}
