/**
 * Cliente (servidor) dos JSON ao vivo do TSE. Cada abrangência normalizada fica
 * em cache ("use cache" + cacheLife) por 30 s (um arquivo) ou 60 s (Brasil, que lê
 * 29 arquivos). Arquivos por município/cidade NÃO são lidos em massa aqui: o
 * navegador os busca direto no TSE (CORS liberado) — ver ../useFilhosDiretos.ts.
 * URLs, campos e frequência: ver ./config.ts.
 */
import { cacheLife } from "next/cache";
import { caminhoApi, PAIS_NAO_IDENTIFICADO, type Abrangencia } from "../abrangencia";
import { paisPorCidade } from "../estatico";
import type { FilhoPendente, ResultadoAbrangencia, ResultadoFilho, Turno } from "../tipos";
import { NOME_UF, UFS, urlMunicipios, urlResultado } from "./config";
import {
  municipiosDaUf,
  normalizarResultadoU,
  totaisVazios,
  type MunicipioTse,
  type Normalizado,
} from "./normalizar";

const TIMEOUT_MS = 8000;
// O TSE devolveu 403 (AccessDenied) em rajadas de requisições paralelas durante os
// testes; com 4 conexões simultâneas e novas tentativas espaçadas o bloqueio passa em segundos.
const CONCORRENCIA = 4;
const ESPERAS_MS = [1000, 3000, 6000];

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Disjuntor: após um 403/429 persistente, pausa novas leituras por 30 s (protege o TSE). */
let pausadoAte = 0;
const PAUSA_MS = 30_000;

async function buscarJson(url: string): Promise<unknown> {
  if (Date.now() < pausadoAte) throw new Error(`TSE limitando requisições; leitura adiada (${url})`);
  for (let tentativa = 0; ; tentativa++) {
    try {
      const res = await fetch(url, {
        cache: "no-store",
        headers: { Accept: "application/json", "User-Agent": "voto-em-quem/1.0 (painel de apuração)" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.ok) return await res.json();
      // 404 é definitivo (arquivo ainda não publicado); 403/429/5xx podem ser limitação momentânea.
      if (res.status === 404 || tentativa >= ESPERAS_MS.length) {
        if (res.status === 403 || res.status === 429) pausadoAte = Date.now() + PAUSA_MS;
        throw new Error(`TSE respondeu ${res.status} para ${url}`);
      }
    } catch (e) {
      if (tentativa >= ESPERAS_MS.length || (e instanceof Error && / 404 /.test(e.message))) throw e;
    }
    await dormir(ESPERAS_MS[tentativa]);
  }
}

/**
 * Última leitura válida de cada arquivo (memória da instância). Se o TSE falhar
 * num ciclo, o município/cidade mantém o último dado obtido em vez de sumir do mapa.
 */
const ultimaLeitura = new Map<string, Normalizado>();

async function buscarNormalizado(url: string): Promise<Normalizado> {
  try {
    const n = normalizarResultadoU(await buscarJson(url));
    ultimaLeitura.set(url, n);
    return n;
  } catch (e) {
    const anterior = ultimaLeitura.get(url);
    if (anterior) return anterior;
    throw e;
  }
}

/** map com limite de concorrência; falhas viram null. */
async function mapLimite<T, R>(itens: T[], fn: (x: T) => Promise<R>): Promise<Array<R | null>> {
  const saida: Array<R | null> = new Array(itens.length).fill(null);
  let i = 0;
  const trabalhador = async () => {
    while (i < itens.length) {
      const k = i++;
      try {
        saida[k] = await fn(itens[k]);
      } catch (e) {
        console.warn("[eleicao] falha ao ler arquivo do TSE:", e instanceof Error ? e.message : e);
        saida[k] = null;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCORRENCIA, itens.length) }, trabalhador));
  return saida;
}

async function municipiosTse(turno: Turno): Promise<Record<string, MunicipioTse[]>> {
  "use cache";
  cacheLife("hours");
  const cfg = await buscarJson(urlMunicipios(turno));
  const out: Record<string, MunicipioTse[]> = {};
  for (const uf of [...UFS, "ZZ"]) out[uf] = municipiosDaUf(cfg, uf);
  return out;
}

function montar(
  turno: Turno,
  meta: Pick<ResultadoAbrangencia, "nivel" | "codigo" | "nome" | "pai">,
  n: Pick<Normalizado, "totais" | "candidatos"> & Partial<Pick<Normalizado, "candidatos_info" | "apuracao">>,
  urls: string[],
  filhos?: ResultadoFilho[],
  avisos: string[] = [],
): ResultadoAbrangencia {
  const agora = new Date().toISOString();
  return {
    eleicao: 2026,
    turno,
    cargo: "Presidente",
    ...meta,
    totais: n.totais,
    candidatos: n.candidatos,
    candidatos_info: n.candidatos_info ?? [],
    apuracao: n.apuracao,
    filhos,
    fonte: { orgao: "TSE", tipo: "ao-vivo", urls, obtido_em: agora },
    gerado_em: agora,
    avisos: avisos.length ? avisos : undefined,
  };
}

function filho(codigo: string, nome: string, n: Normalizado | null, cod_ibge?: string): ResultadoFilho | null {
  if (!n) return null;
  return { codigo, nome, cod_ibge, totais: n.totais, candidatos: n.candidatos, apuracao: n.apuracao };
}

const naoNulo = <T,>(x: T | null): x is T => x !== null;

/** Abrangências de um único arquivo (município, cidade) — cache de 30 s. */
async function aoVivoSimples(turno: Turno, abr: Abrangencia): Promise<ResultadoAbrangencia> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 30, expire: 600 });
  const muns = await municipiosTse(turno).catch(() => ({}) as Record<string, MunicipioTse[]>);
  if (abr.nivel === "MUN") {
    const url = urlResultado(turno, abr.uf, abr.municipio);
    const m = muns[abr.uf]?.find((x) => x.cod_tse === abr.municipio.padStart(5, "0"));
    return montar(
      turno,
      { nivel: "MUN", codigo: abr.municipio, nome: m?.nome ?? abr.municipio, pai: abr.uf },
      await buscarNormalizado(url),
      [url],
    );
  }
  if (abr.nivel === "CIDADE") {
    const url = urlResultado(turno, "zz", abr.cidade);
    const c = muns.ZZ?.find((x) => x.cod_tse === abr.cidade.padStart(5, "0"));
    return montar(
      turno,
      { nivel: "CIDADE", codigo: abr.cidade, nome: c?.nome ?? abr.cidade, pai: abr.pais },
      await buscarNormalizado(url),
      [url],
    );
  }
  throw new Error("abrangência não suportada em aoVivoSimples");
}

/** Brasil (29 arquivos) e UF/exterior/país (1 arquivo + lista de pendentes) — cache de 60 s. */
async function aoVivoAgregado(turno: Turno, abr: Abrangencia): Promise<ResultadoAbrangencia> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 900 });
  const avisos: string[] = [];

  if (abr.nivel === "BR") {
    const url = urlResultado(turno, "br");
    const siglas = [...UFS, "ZZ"];
    const [br, ufs] = await Promise.all([
      buscarNormalizado(url),
      mapLimite(siglas, (uf) => buscarNormalizado(urlResultado(turno, uf))),
    ]);
    const filhos = siglas.map((uf, i) => filho(uf, NOME_UF[uf], ufs[i])).filter(naoNulo);
    if (filhos.length < siglas.length) avisos.push(`${siglas.length - filhos.length} UF(s) indisponível(is) no TSE`);
    return montar(turno, { nivel: "BR", codigo: "BR", nome: "Brasil" }, br, [url, urlResultado(turno, "sp")], filhos, avisos);
  }

  // UF, exterior e país: o servidor lê só o arquivo agregado (1 arquivo) e devolve a
  // lista de arquivos por município/cidade em `pendentes`; quem os lê é o navegador,
  // direto no TSE, apenas para a área aberta (ver useFilhosDiretos.ts).
  const muns = await municipiosTse(turno);

  if (abr.nivel === "UF") {
    const url = urlResultado(turno, abr.uf);
    const pendentes: FilhoPendente[] = (muns[abr.uf] ?? []).map((m) => {
      const codigo = String(Number(m.cod_tse));
      return {
        codigo,
        nome: m.nome,
        cod_ibge: m.cod_ibge,
        url: urlResultado(turno, abr.uf, m.cod_tse),
        fallback: caminhoApi(turno, { nivel: "MUN", uf: abr.uf, municipio: codigo }),
      };
    });
    const r = montar(turno, { nivel: "UF", codigo: abr.uf, nome: NOME_UF[abr.uf] ?? abr.uf }, await buscarNormalizado(url), [
      url,
      pendentes[0]?.url ?? url,
    ]);
    return { ...r, pendentes };
  }

  if (abr.nivel === "EXTERIOR" || abr.nivel === "PAIS") {
    const mapa = await paisPorCidade();
    let pendentes: FilhoPendente[] = (muns.ZZ ?? []).map((c) => {
      const codigo = String(Number(c.cod_tse));
      const pais = mapa.get(codigo) ?? PAIS_NAO_IDENTIFICADO;
      return {
        codigo,
        nome: c.nome,
        pais,
        url: urlResultado(turno, "zz", c.cod_tse),
        fallback: caminhoApi(turno, { nivel: "CIDADE", pais, cidade: codigo }),
      };
    });
    if (abr.nivel === "PAIS") {
      pendentes = pendentes.filter((c) => c.pais === abr.pais);
      if (!pendentes.length) throw new Error("país sem cidades no exterior");
      const vazio = { totais: totaisVazios(), candidatos: [] };
      const r = montar(turno, { nivel: "PAIS", codigo: abr.pais, nome: abr.pais }, vazio, [pendentes[0].url]);
      return { ...r, pendentes, totais_dos_filhos: true };
    }
    const url = urlResultado(turno, "zz");
    const r = montar(turno, { nivel: "EXTERIOR", codigo: "ZZ", nome: "Exterior" }, await buscarNormalizado(url), [
      url,
      pendentes[0]?.url ?? url,
    ]);
    return { ...r, pendentes };
  }

  throw new Error("abrangência não suportada em aoVivoAgregado");
}

/** Resultado ao vivo do TSE para a abrangência (lança erro se o TSE falhar). */
export async function resultadoAoVivo(turno: Turno, abr: Abrangencia): Promise<ResultadoAbrangencia> {
  const r =
    abr.nivel === "MUN" || abr.nivel === "CIDADE"
      ? await aoVivoSimples(turno, abr)
      : await aoVivoAgregado(turno, abr);
  // Lista de candidatos vem do arquivo principal; nas agregações por soma, completa com o do Brasil.
  if (!r.candidatos_info.length) {
    const br = await aoVivoSimplesBrasil(turno).catch(() => null);
    if (br) return { ...r, candidatos_info: br.candidatos_info };
  }
  return r;
}

async function aoVivoSimplesBrasil(turno: Turno): Promise<Normalizado> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 30, expire: 600 });
  return buscarNormalizado(urlResultado(turno, "br"));
}
