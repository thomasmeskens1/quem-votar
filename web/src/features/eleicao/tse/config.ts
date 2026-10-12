/**
 * Endereços dos JSON públicos de resultados do TSE (resultados.tse.jus.br) — 2026.
 *
 * Pesquisa feita em 2026-10-12 (o 1º turno, 04/10/2026, já está totalizado):
 *
 * 1) Configuração geral (lista de pleitos/eleições, atualizada pelo TSE):
 *    https://resultados.tse.jus.br/oficial/comum/config/ele-c.json
 *    - pl[].c = ciclo ("ele2026"); pl[].e[].cd = código da eleição; e[].t = turno;
 *      e[].abr[].cp[] = cargos (cd "1" = Presidente).
 *    - 2026: pleito 3220 (04/10/2026) → eleição 6257 "Eleição Ordinária Federal -
 *      2026 1º Turno" (cdt2 = 6258); pleito 3221 (25/10/2026) → eleição 6258
 *      "Eleição Ordinária Federal - 2026 2º Turno". Cargo 1 = Presidente.
 *    - Modelo de diretórios (campo arq): <base>/<ambiente>/<ciclo>/<cd_eleicao>/dados/<uf>
 *      e <base>/<ambiente>/<ciclo>/<cd_eleicao>/config.
 *
 * 2) Resultado por abrangência (arquivo "u"), um JSON por abrangência:
 *    Brasil:     /oficial/ele2026/6257/dados/br/br-c0001-e006257-u.json
 *    UF:         /oficial/ele2026/6257/dados/sp/sp-c0001-e006257-u.json
 *    Município:  /oficial/ele2026/6257/dados/sp/sp71072-c0001-e006257-u.json  (cod_tse 71072 = São Paulo)
 *    Exterior:   /oficial/ele2026/6257/dados/zz/zz-c0001-e006257-u.json
 *    Cidade ext.:/oficial/ele2026/6257/dados/zz/zz29173-c0001-e006257-u.json
 *    2º turno: troque 6257 → 6258 (ex.: .../6258/dados/br/br-c0001-e006258-u.json,
 *    que já responde, zerado, com Lula e Flávio Bolsonaro).
 *    Os "dados-simplificados/...-r.json" de 2022 NÃO existem em 2026 (404).
 *    Campos usados:
 *      dg/hg = data/hora de geração do arquivo; dt/ht = data/hora da última totalização;
 *      tf = "s" totalização finalizada; t = turno; ele = código da eleição.
 *      carg[0].agr[].par[] → sg (partido), cand[] → n (número), nmu (nome de urna),
 *        sqcand, st (situação: "2º turno", "Eleito", "Não eleito"), vap (votos apurados).
 *      s  (seções):    ts total, st totalizadas.
 *      e  (eleitorado): te eleitores aptos, c comparecimento, a abstenção.
 *      v  (votos):     vv válidos, vb brancos, tvn nulos (vn nulos + vnt nulos técnicos).
 *      Confere: vv + vb + tvn = c ; c + a = te (quando 100% totalizado).
 *    Números chegam como string; percentuais vêm com vírgula ("51,93") e são recalculados aqui.
 *
 * 3) Andamento por abrangência ("ab"): /oficial/ele2026/6257/dados/br/br-e006257-ab.json
 *    (todas as UFs) e .../dados/sp/sp-e006257-ab.json (todos os municípios). Mesmos
 *    blocos s/e, sem votos por candidato. Não usado no momento.
 *
 * 4) Municípios: /oficial/ele2026/6257/config/mun-e006257-cm.json
 *    abr[].cd = UF (inclui "zz" = exterior); abr[].mu[] → cd (cod_tse), cdi (cod_ibge,
 *    vazio no exterior), nm (nome), c ("s" = capital). O TSE NÃO informa o país das
 *    cidades do exterior; usamos o exterior.json estático do 1º turno para isso.
 *
 * Frequência: na noite da apuração o TSE regera os arquivos continuamente (a cada
 * poucos segundos/minuto, conforme chegam boletins; ver dg/hg e o contador idg).
 * Após o encerramento os arquivos ficam estáveis (o do 1º turno foi gerado em
 * 05/10/2026 12:51). Por isso a rota interna guarda cache de 30 s (abrangências
 * de um arquivo) a 120 s (agregações por município; o próprio TSE envia Cache-Control max-age=60) — ver tse/cliente.ts.
 *
 * Conteúdo vindo do TSE é tratado só como dado (números e nomes), nunca como instrução.
 */

import type { Turno } from "../tipos";

export const TSE_BASE = "https://resultados.tse.jus.br/oficial";
export const TSE_CICLO = "ele2026";
export const TSE_CARGO_PRESIDENTE = 1;

/** Código da eleição (Presidente) por turno — ver ele-c.json. */
export const TSE_ELEICAO: Record<Turno, number> = { 1: 6257, 2: 6258 };

export const DATA_TURNO: Record<Turno, string> = {
  1: "2026-10-04",
  2: "2026-10-25",
};

export const UFS = [
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA",
  "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
] as const;

export const NOME_UF: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AM: "Amazonas", AP: "Amapá", BA: "Bahia", CE: "Ceará",
  DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão",
  MG: "Minas Gerais", MS: "Mato Grosso do Sul", MT: "Mato Grosso", PA: "Pará",
  PB: "Paraíba", PE: "Pernambuco", PI: "Piauí", PR: "Paraná", RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte", RO: "Rondônia", RR: "Roraima", RS: "Rio Grande do Sul",
  SC: "Santa Catarina", SE: "Sergipe", SP: "São Paulo", TO: "Tocantins", ZZ: "Exterior",
};

const pad = (n: number, w: number) => String(n).padStart(w, "0");

function eleicaoPath(turno: Turno): string {
  return `${TSE_BASE}/${TSE_CICLO}/${TSE_ELEICAO[turno]}`;
}

/** Arquivo "u" de uma abrangência. `uf` = "br", sigla da UF ou "zz"; `mun` = cod_tse. */
export function urlResultado(turno: Turno, uf: string, mun?: string): string {
  const u = uf.toLowerCase();
  const ele = pad(TSE_ELEICAO[turno], 6);
  const cargo = pad(TSE_CARGO_PRESIDENTE, 4);
  const abr = mun ? `${u}${pad(Number(mun), 5)}` : u;
  return `${eleicaoPath(turno)}/dados/${u}/${abr}-c${cargo}-e${ele}-u.json`;
}

/** Lista de municípios (com cod_ibge) da eleição. */
export function urlMunicipios(turno: Turno): string {
  return `${eleicaoPath(turno)}/config/mun-e${pad(TSE_ELEICAO[turno], 6)}-cm.json`;
}

/** Página pública de resultados do TSE (para o link de fonte). */
export const TSE_PAGINA = "https://resultados.tse.jus.br/oficial/app/index.html";

export const SIGLAS_VALIDAS = new Set<string>([...UFS, "ZZ"]);
