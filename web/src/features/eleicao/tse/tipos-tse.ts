/** Formato bruto (parcial) dos JSON do TSE 2026 — só os campos usados. Ver config.ts. */

export interface TseCandidato {
  n: string;
  sqcand?: string;
  nm?: string;
  nmu?: string;
  st?: string;
  e?: string;
  seq?: string;
  vap?: string;
}

export interface TsePartido {
  n?: string;
  sg?: string;
  cand?: TseCandidato[];
}

export interface TseAgremiacao {
  n?: string;
  com?: string;
  par?: TsePartido[];
}

export interface TseCargo {
  cd?: string;
  agr?: TseAgremiacao[];
}

export interface TseSecoes {
  ts?: string;
  st?: string;
  sni?: string;
}

export interface TseEleitorado {
  te?: string;
  c?: string;
  a?: string;
  esni?: string;
}

export interface TseVotos {
  tv?: string;
  vv?: string;
  vb?: string;
  tvn?: string;
  vn?: string;
  vnt?: string;
}

/** Arquivo "<abr>-c0001-e00XXXX-u.json". */
export interface TseResultadoU {
  ele?: string;
  t?: string;
  tpabr?: string;
  cdabr?: string;
  dg?: string;
  hg?: string;
  dt?: string;
  ht?: string;
  tf?: string;
  carg?: TseCargo[];
  s?: TseSecoes;
  e?: TseEleitorado;
  v?: TseVotos;
}

/** Arquivo "config/mun-e00XXXX-cm.json". */
export interface TseMunicipiosConfig {
  dg?: string;
  hg?: string;
  abr?: Array<{
    cd: string;
    ds?: string;
    mu?: Array<{ cd: string; cdi?: string; nm?: string; c?: string }>;
  }>;
}
