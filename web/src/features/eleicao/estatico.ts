/**
 * Leitura (servidor) dos JSON estáticos gerados por scripts/eleicao conforme
 * dados/eleicao/esquema.json. O sync-data do site copia dados/eleicao/** para
 * web/content/eleicao/** (lido aqui) e web/public/dados/eleicao/** (servido em
 * /dados/eleicao/...).
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NOME_UF } from "./tse/config";
import { titulo } from "./tse/normalizar";
import type {
  CandidatoInfo,
  CandidatoVotos,
  Fonte,
  ResultadoAbrangencia,
  ResultadoFilho,
  Totais,
  Turno,
} from "./tipos";
import type { Abrangencia } from "./abrangencia";

interface Bloco {
  totais: Totais;
  candidatos: CandidatoVotos[];
}
interface ArquivoBase extends Bloco {
  eleicao: number;
  turno: number;
  gerado_em: string;
  notas?: string[];
  fonte?: { urls?: string[]; data_arquivo_tse?: string; sha256?: string };
}
interface BrasilJson extends ArquivoBase {
  ufs: Array<Bloco & { uf: string; nome?: string }>;
}
interface UfJson extends ArquivoBase {
  uf: string;
  nome?: string;
  municipios: Array<Bloco & { cod_tse: string; cod_ibge?: string; nome: string }>;
}
interface ExteriorJson extends ArquivoBase {
  paises: Array<
    Bloco & {
      pais: string;
      continente?: string | null;
      lacuna?: boolean;
      cidades: Array<Bloco & { cod_tse: string; nome: string }>;
    }
  >;
  lacunas?: Array<{ cod_tse: string; nome?: string; motivo?: string }>;
}

// Cada caminho é escrito por extenso (só turno e UF variam), para o build rastrear
// apenas esses arquivos e não a pasta de locais de votação inteira.
async function lerJson<T>(arquivo: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(arquivo, "utf8")) as T;
  } catch {
    return null;
  }
}

const pastaTurno = (t: Turno) => `${t}turno`;

function fonteDe(arq: ArquivoBase): Fonte {
  return {
    orgao: "TSE",
    tipo: "estatico",
    urls: arq.fonte?.urls ?? [],
    data_arquivo_tse: arq.fonte?.data_arquivo_tse,
    sha256: arq.fonte?.sha256,
  };
}

function bloco(b: Bloco): Bloco {
  return { totais: b.totais, candidatos: [...b.candidatos].sort((x, y) => y.votos - x.votos) };
}

export async function candidatosEstaticos(turno: Turno): Promise<CandidatoInfo[]> {
  const arq = await lerJson<{ candidatos?: CandidatoInfo[] }>(
    path.join(process.cwd(), "content", "eleicao", "2026", pastaTurno(turno), "candidatos.json"),
  );
  return arq?.candidatos ?? [];
}

/** Mapa cod_tse da cidade no exterior → país (do exterior.json do 1º turno). */
export async function paisPorCidade(): Promise<Map<string, string>> {
  const ext = await lerJson<ExteriorJson>(path.join(process.cwd(), "content", "eleicao", "2026", "1turno", "exterior.json"));
  const mapa = new Map<string, string>();
  for (const p of ext?.paises ?? []) {
    if (p.lacuna) continue;
    for (const c of p.cidades ?? []) mapa.set(String(Number(c.cod_tse)), p.pais);
  }
  return mapa;
}

function base(
  arq: ArquivoBase,
  turno: Turno,
  info: CandidatoInfo[],
  meta: Pick<ResultadoAbrangencia, "nivel" | "codigo" | "nome" | "pai">,
  b: Bloco,
  filhos?: ResultadoFilho[],
): ResultadoAbrangencia {
  return {
    eleicao: 2026,
    turno,
    cargo: "Presidente",
    ...meta,
    ...bloco(b),
    candidatos_info: info,
    filhos,
    notas: Array.isArray(arq.notas) ? arq.notas.filter((n) => typeof n === "string") : undefined,
    fonte: fonteDe(arq),
    gerado_em: arq.gerado_em,
  };
}

/** Lê uma abrangência dos arquivos estáticos; null se o arquivo não existir. */
export async function lerEstatico(
  turno: Turno,
  abr: Abrangencia,
): Promise<ResultadoAbrangencia | null> {
  const pasta = pastaTurno(turno);
  const info = await candidatosEstaticos(turno);

  if (abr.nivel === "BR") {
    const br = await lerJson<BrasilJson>(path.join(process.cwd(), "content", "eleicao", "2026", pasta, "brasil.json"));
    if (!br) return null;
    const filhos = br.ufs.map((u) => ({
      codigo: u.uf,
      nome: u.nome ?? NOME_UF[u.uf] ?? u.uf,
      ...bloco(u),
    }));
    return base(br, turno, info, { nivel: "BR", codigo: "BR", nome: "Brasil" }, br, filhos);
  }

  if (abr.nivel === "UF" || abr.nivel === "MUN") {
    const uf = await lerJson<UfJson>(path.join(process.cwd(), "content", "eleicao", "2026", pasta, "uf", `${abr.uf}.json`));
    if (!uf) return null;
    const nomeUf = uf.nome ?? NOME_UF[abr.uf] ?? abr.uf;
    if (abr.nivel === "UF") {
      const filhos = uf.municipios.map((m) => ({
        codigo: String(Number(m.cod_tse)),
        nome: titulo(m.nome),
        cod_ibge: m.cod_ibge,
        ...bloco(m),
      }));
      return base(uf, turno, info, { nivel: "UF", codigo: abr.uf, nome: nomeUf }, uf, filhos);
    }
    const m = uf.municipios.find((x) => Number(x.cod_tse) === Number(abr.municipio));
    if (!m) return null;
    return base(uf, turno, info, {
      nivel: "MUN",
      codigo: String(Number(m.cod_tse)),
      nome: titulo(m.nome),
      pai: abr.uf,
    }, m);
  }

  const ext = await lerJson<ExteriorJson>(path.join(process.cwd(), "content", "eleicao", "2026", pasta, "exterior.json"));
  if (!ext) return null;
  if (abr.nivel === "EXTERIOR") {
    const filhos = ext.paises.map((p) => ({
      codigo: p.pais,
      nome: p.pais,
      grupo: p.continente ?? undefined,
      lacuna: p.lacuna || undefined,
      ...bloco(p),
    }));
    return base(ext, turno, info, { nivel: "EXTERIOR", codigo: "ZZ", nome: "Exterior" }, ext, filhos);
  }
  const pais = ext.paises.find((p) => p.pais === abr.pais);
  if (!pais) return null;
  if (abr.nivel === "PAIS") {
    const motivos = new Map((ext.lacunas ?? []).map((l) => [String(Number(l.cod_tse)), l.motivo]));
    const filhos = pais.cidades.map((c) => ({
      codigo: String(Number(c.cod_tse)),
      nome: titulo(c.nome),
      motivo: pais.lacuna ? motivos.get(String(Number(c.cod_tse))) : undefined,
      ...bloco(c),
    }));
    return base(ext, turno, info, { nivel: "PAIS", codigo: pais.pais, nome: pais.pais }, pais, filhos);
  }
  const cidade = pais.cidades.find((c) => Number(c.cod_tse) === Number(abr.cidade));
  if (!cidade) return null;
  return base(ext, turno, info, {
    nivel: "CIDADE",
    codigo: String(Number(cidade.cod_tse)),
    nome: titulo(cidade.nome),
    pai: pais.pais,
  }, cidade);
}
