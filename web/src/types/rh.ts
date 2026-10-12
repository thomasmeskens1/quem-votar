import type { CandidatoId } from "./comum";

export interface FonteRh {
  id: string;
  titulo: string;
  orgao_ou_veiculo: string;
  url: string;
  tipo: "oficial" | "reportagem" | string;
  data_publicacao: string | null;
  data_acesso: string;
  titulo_editado?: boolean;
}

export interface Afirmacao {
  afirmacao: string;
  periodo?: string | null;
  fonte_ids: string[];
  trecho_fonte?: string;
  observacao?: string;
}

export interface Cargo {
  cargo: string;
  inicio: string;
  fim: string | null;
  como_obteve: string;
  fonte_ids: string[];
  trecho_fonte?: string;
}

export interface HistoricoStatus {
  status: string;
  data: string | null;
  fonte_ids: string[];
  status_descricao_fonte?: string | null;
  origem: string;
  observacao?: string | null;
}

export interface Processo {
  titulo: string;
  descricao: string;
  orgao: string;
  numero_processo: string | null;
  status_atual: string;
  data_status: string | null;
  status_descricao_fonte?: string;
  historico_status: HistoricoStatus[];
  fonte_ids: string[];
  trecho_fonte?: string;
  ultimo_status_oficial: { status: string; data: string; fonte_ids: string[] } | null;
  desfecho_noticiado: { resumo: string; fonte_ids: string[]; observacao?: string } | null;
  data_certidao: string | null;
  observacao: string | null;
}

export interface ConsultaSemRegistro {
  consulta: string;
  orgao: string;
  data_consulta: string;
  resultado: string;
  fonte_ids: string[];
  trecho_fonte?: string;
}

export interface Reportagem {
  tema: string;
  resumo_neutro: string;
  fonte_ids: string[];
  observacao?: string;
}

export interface Lacuna {
  tema: string;
  motivo: string;
}

export interface DossieRh {
  candidato: CandidatoId;
  gerado_em: string;
  fontes: FonteRh[];
  secoes: {
    formacao: Afirmacao[];
    trajetoria_profissional: Afirmacao[];
    cargos_e_mandatos: Cargo[];
    atuacao_parlamentar_e_executiva: Afirmacao[];
    declaracoes_tse: Afirmacao[];
    processos_e_investigacoes: Processo[];
    acoes_civeis: Processo[];
    consultas_sem_registro: ConsultaSemRegistro[];
    reportagens: Reportagem[];
    lacunas: Lacuna[];
  };
}
