/**
 * Normalização dos JSON do TSE para o formato do esquema (totais/candidatos).
 * Funções puras, sem imports de runtime (só `import type`), para poderem ser
 * testadas com `node` puro — ver __tests__/normalizar.test.mjs.
 */
import type {
  Apuracao,
  CandidatoInfo,
  CandidatoVotos,
  Totais,
  Turno,
} from "../tipos";
import type { TseMunicipiosConfig, TseResultadoU } from "./tipos-tse";

export interface Normalizado {
  eleicao: number;
  turno: Turno;
  totais: Totais;
  candidatos: CandidatoVotos[];
  candidatos_info: CandidatoInfo[];
  apuracao: Apuracao;
}

/** Converte número do TSE (string de inteiro, sem separador) em inteiro >= 0. */
export function inteiro(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) && v > 0 ? Math.round(v) : 0;
  if (typeof v !== "string") return 0;
  const limpo = v.trim();
  if (!/^\d+$/.test(limpo)) return 0;
  return Number(limpo);
}

/** "05/10/2026" + "12:51:05" → "2026-10-05T12:51:05-03:00" (horário de Brasília). */
export function dataHoraTse(data?: string, hora?: string): string | null {
  const d = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((data ?? "").trim());
  if (!d) return null;
  const h = /^(\d{2}):(\d{2}):(\d{2})$/.exec((hora ?? "").trim());
  const hhmmss = h ? `${h[1]}:${h[2]}:${h[3]}` : "00:00:00";
  return `${d[3]}-${d[2]}-${d[1]}T${hhmmss}-03:00`;
}

export function totaisVazios(): Totais {
  return {
    eleitores_aptos: 0,
    comparecimento: 0,
    abstencoes: 0,
    votos_validos: 0,
    brancos: 0,
    nulos: 0,
  };
}

function ehObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Valida o mínimo do arquivo "u" (fronteira com sistema externo). */
export function ehResultadoU(v: unknown): v is TseResultadoU {
  return ehObjeto(v) && Array.isArray(v.carg) && ehObjeto(v.e) && ehObjeto(v.v);
}

/** Normaliza um arquivo "<abr>-c0001-e00XXXX-u.json". */
export function normalizarResultadoU(raw: unknown): Normalizado {
  if (!ehResultadoU(raw)) throw new Error("JSON do TSE em formato inesperado");
  const e = raw.e ?? {};
  const v = raw.v ?? {};
  const s = raw.s ?? {};

  const brancos = inteiro(v.vb);
  // tvn = nulos (vn) + nulos técnicos (vnt). Se faltar, soma as partes.
  const nulos = v.tvn !== undefined ? inteiro(v.tvn) : inteiro(v.vn) + inteiro(v.vnt);
  const totais: Totais = {
    eleitores_aptos: inteiro(e.te),
    comparecimento: inteiro(e.c),
    abstencoes: inteiro(e.a),
    votos_validos: inteiro(v.vv),
    brancos,
    nulos,
  };
  if (s.sni !== undefined) totais.secoes_nao_instaladas = inteiro(s.sni);
  if (e.esni !== undefined) totais.eleitores_secoes_nao_instaladas = inteiro(e.esni);

  const candidatos: CandidatoVotos[] = [];
  const info: Array<CandidatoInfo & { seq: number }> = [];
  const cargo = (raw.carg ?? []).find((c) => c.cd === undefined || c.cd === "1") ?? raw.carg?.[0];
  for (const agr of cargo?.agr ?? []) {
    for (const par of agr.par ?? []) {
      for (const c of par.cand ?? []) {
        const numero = inteiro(c.n);
        if (!numero) continue;
        candidatos.push({ numero, votos: inteiro(c.vap) });
        info.push({
          numero,
          nome_urna: (c.nmu ?? c.nm ?? String(numero)).trim(),
          partido: (par.sg ?? "").trim(),
          sq_candidato: c.sqcand,
          situacao_turno: c.st || undefined,
          seq: inteiro(c.seq) || 999,
        });
      }
    }
  }
  candidatos.sort((a, b) => b.votos - a.votos || a.numero - b.numero);
  info.sort((a, b) => a.seq - b.seq || a.numero - b.numero);

  const secoesTotal = inteiro(s.ts);
  const secoesTot = inteiro(s.st);
  const apuracao: Apuracao = {
    secoes_total: secoesTotal,
    secoes_totalizadas: secoesTot,
    pct_secoes_totalizadas: secoesTotal ? (secoesTot / secoesTotal) * 100 : 0,
    finalizada: raw.tf === "s",
    atualizado_tse: dataHoraTse(raw.dt, raw.ht) ?? dataHoraTse(raw.dg, raw.hg),
  };

  return {
    eleicao: 2026,
    turno: raw.t === "2" ? 2 : 1,
    totais,
    candidatos,
    candidatos_info: info.map((c) => ({
      numero: c.numero,
      nome_urna: c.nome_urna,
      partido: c.partido,
      sq_candidato: c.sq_candidato,
      situacao_turno: c.situacao_turno,
    })),
    apuracao,
  };
}

/** Soma totais e votos de várias abrangências (ex.: cidades → país). */
export function somar(
  partes: Array<{ totais: Totais; candidatos: CandidatoVotos[]; apuracao?: Apuracao }>,
): { totais: Totais; candidatos: CandidatoVotos[]; apuracao?: Apuracao } {
  const totais = totaisVazios();
  const votos = new Map<number, number>();
  let st = 0;
  let ts = 0;
  let temApuracao = false;
  let finalizada = true;
  let ultima: string | null = null;
  for (const p of partes) {
    for (const k of Object.keys(p.totais) as Array<keyof Totais>) {
      totais[k] = (totais[k] ?? 0) + (p.totais[k] ?? 0);
    }
    for (const c of p.candidatos) votos.set(c.numero, (votos.get(c.numero) ?? 0) + c.votos);
    if (p.apuracao) {
      temApuracao = true;
      st += p.apuracao.secoes_totalizadas;
      ts += p.apuracao.secoes_total;
      finalizada = finalizada && p.apuracao.finalizada;
      const a = p.apuracao.atualizado_tse;
      if (a && (!ultima || a > ultima)) ultima = a;
    }
  }
  const candidatos = [...votos.entries()]
    .map(([numero, v]) => ({ numero, votos: v }))
    .sort((a, b) => b.votos - a.votos || a.numero - b.numero);
  const apuracao: Apuracao | undefined = temApuracao
    ? {
        secoes_total: ts,
        secoes_totalizadas: st,
        pct_secoes_totalizadas: ts ? (st / ts) * 100 : 0,
        finalizada,
        atualizado_tse: ultima,
      }
    : undefined;
  return { totais, candidatos, apuracao };
}

/** Confere as regras do esquema; devolve a lista de inconsistências (vazia = ok). */
export function conferirTotais(t: Totais): string[] {
  const erros: string[] = [];
  const soma = t.votos_validos + t.brancos + t.nulos;
  if (soma !== t.comparecimento) {
    erros.push(`válidos+brancos+nulos (${soma}) ≠ comparecimento (${t.comparecimento})`);
  }
  // Durante a apuração o eleitorado apurado ainda não soma o total de aptos. Mesmo
  // encerrada, c + a = eleitorado das seções instaladas: no 1º turno de 2026 o TSE
  // informa 41 seções não instaladas (423 eleitores, campos sni/esni) no Brasil.
  // Por isso a regra aqui é c + a <= aptos (nunca maior).
  if (t.comparecimento + t.abstencoes > t.eleitores_aptos) {
    erros.push(
      `comparecimento+abstenções (${t.comparecimento + t.abstencoes}) ≠ aptos (${t.eleitores_aptos})`,
    );
  }
  return erros;
}

export interface MunicipioTse {
  cod_tse: string;
  cod_ibge?: string;
  nome: string;
  capital: boolean;
}

/** Lista os municípios (ou cidades do exterior, uf = "ZZ") do config do TSE. */
export function municipiosDaUf(config: unknown, uf: string): MunicipioTse[] {
  if (!ehObjeto(config) || !Array.isArray(config.abr)) return [];
  const abr = (config as TseMunicipiosConfig).abr?.find(
    (a) => a.cd?.toLowerCase() === uf.toLowerCase(),
  );
  return (abr?.mu ?? [])
    .filter((m) => typeof m.cd === "string" && /^\d+$/.test(m.cd))
    .map((m) => ({
      cod_tse: m.cd,
      cod_ibge: m.cdi || undefined,
      nome: titulo(m.nm ?? m.cd),
      capital: m.c === "s",
    }));
}

const MINUSCULAS = new Set(["de", "da", "do", "das", "dos", "e", "d'"]);

/** "SÃO JOSÉ DOS CAMPOS" → "São José dos Campos". */
export function titulo(s: string): string {
  return s
    .toLocaleLowerCase("pt-BR")
    .split(/(\s+|-)/)
    .map((p, i) =>
      i > 0 && MINUSCULAS.has(p) ? p : p.charAt(0).toLocaleUpperCase("pt-BR") + p.slice(1),
    )
    .join("");
}
