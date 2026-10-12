/**
 * Tipos normalizados da apuração (formato consumido pela página /eleicao).
 *
 * `totais` e `candidatos` seguem exatamente o contrato de
 * dados/eleicao/esquema.json. Os demais campos (apuracao, filhos, fonte.tipo)
 * são extensões usadas apenas pela camada web.
 */

export type Turno = 1 | 2;

/** Mesmo formato de `exemplo_totais` do esquema. */
export interface Totais {
  eleitores_aptos: number;
  comparecimento: number;
  abstencoes: number;
  votos_validos: number;
  brancos: number;
  nulos: number;
  /** Seções não instaladas (TSE: sni) e seus eleitores (esni) — opcionais. */
  secoes_nao_instaladas?: number;
  eleitores_secoes_nao_instaladas?: number;
}

/** Mesmo formato de `candidatos[]` do esquema. */
export interface CandidatoVotos {
  numero: number;
  votos: number;
}

/** Mesmo formato de `exemplo_candidatos.json` do esquema. */
export interface CandidatoInfo {
  numero: number;
  nome_urna: string;
  partido: string;
  sq_candidato?: string;
  situacao_turno?: string;
}

/** Andamento da totalização (só existe nos dados ao vivo do TSE). */
export interface Apuracao {
  secoes_total: number;
  secoes_totalizadas: number;
  /** 0–100, calculado de secoes_totalizadas / secoes_total. */
  pct_secoes_totalizadas: number;
  /** Totalização encerrada nesta abrangência (campo "tf" do TSE). */
  finalizada: boolean;
  /** Horário (ISO, -03:00) da última totalização/geração informada pelo TSE. */
  atualizado_tse: string | null;
}

export interface Fonte {
  orgao: "TSE";
  /** "ao-vivo" = JSON de resultados.tse.jus.br; "estatico" = arquivos de dados/eleicao. */
  tipo: "ao-vivo" | "estatico";
  urls: string[];
  data_arquivo_tse?: string;
  sha256?: string;
  /** Quando este servidor obteve os dados (ISO). */
  obtido_em?: string;
}

export type Nivel = "BR" | "UF" | "MUN" | "EXTERIOR" | "PAIS" | "CIDADE";

/** Uma unidade filha (UF, município, país, cidade) com seus resultados. */
export interface ResultadoFilho {
  /** Sigla da UF ("SP", "ZZ"), cod_tse do município/cidade ou nome do país. */
  codigo: string;
  nome: string;
  cod_ibge?: string;
  /** Continente (países do exterior). */
  grupo?: string;
  /** Agrupamento com lacuna de identificação (ex.: "País não identificado"). */
  lacuna?: boolean;
  /** Explicação da lacuna (por cidade, quando houver). */
  motivo?: string;
  totais: Totais;
  candidatos: CandidatoVotos[];
  apuracao?: Apuracao;
}

export interface FilhoPendente {
  /** cod_tse do município/cidade. */
  codigo: string;
  nome: string;
  cod_ibge?: string;
  /** País da cidade no exterior (ou "País não identificado"). */
  pais?: string;
  /** Arquivo "u" no TSE. */
  url: string;
  /** Rota interna para o mesmo arquivo (reserva). */
  fallback: string;
}

export interface ResultadoAbrangencia {
  eleicao: number;
  turno: Turno;
  cargo: "Presidente";
  nivel: Nivel;
  codigo: string;
  nome: string;
  /** UF do município, ou país da cidade no exterior. */
  pai?: string;
  totais: Totais;
  candidatos: CandidatoVotos[];
  candidatos_info: CandidatoInfo[];
  apuracao?: Apuracao;
  /** UFs (BR), municípios (UF), países (EXTERIOR) ou cidades (PAIS). */
  filhos?: ResultadoFilho[];
  fonte: Fonte;
  gerado_em: string;
  /**
   * Filhos ainda não lidos (dados ao vivo de UF/exterior/país): o NAVEGADOR busca
   * cada arquivo "u" direto no TSE (CORS liberado), só da área aberta, e usa a rota
   * `fallback` (1 arquivo, com cache) se a leitura direta falhar.
   */
  pendentes?: FilhoPendente[];
  /** Totais devem ser somados a partir dos filhos (país no exterior, ao vivo). */
  totais_dos_filhos?: boolean;
  /** Notas metodológicas do arquivo de dados. */
  notas?: string[];
  /** Avisos não fatais (ex.: municípios que não puderam ser lidos). */
  avisos?: string[];
}

/** Resposta da rota /api/eleicao. */
export type RespostaApi =
  | { ok: true; dados: ResultadoAbrangencia }
  | { ok: false; erro: string; aguardando?: boolean };
