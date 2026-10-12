/**
 * Abrangência selecionada e (de)serialização dos segmentos da rota
 * /api/eleicao/[turno]/[...abrangencia]:
 *   br                      → Brasil (filhos: UFs + ZZ)
 *   uf/SP                   → UF (filhos: municípios)
 *   uf/SP/71072             → município (cod_tse)
 *   exterior                → exterior (filhos: países)
 *   exterior/Portugal       → país (filhos: cidades)
 *   exterior/Portugal/29539 → cidade no exterior (cod_tse)
 * Sem imports de runtime (testável com node puro).
 */
import type { Turno } from "./tipos";

export type Abrangencia =
  | { nivel: "BR" }
  | { nivel: "UF"; uf: string }
  | { nivel: "MUN"; uf: string; municipio: string }
  | { nivel: "EXTERIOR" }
  | { nivel: "PAIS"; pais: string }
  | { nivel: "CIDADE"; pais: string; cidade: string };

/** Grupo das cidades do exterior sem país identificado (lacuna, ver exterior.json). */
export const PAIS_NAO_IDENTIFICADO = "País não identificado";

const SIGLAS = new Set(
  "AC AL AM AP BA CE DF ES GO MA MG MS MT PA PB PE PI PR RJ RN RO RR RS SC SE SP TO".split(" "),
);

export function parseTurno(s: string | undefined): Turno | null {
  if (s === "1" || s === "1turno") return 1;
  if (s === "2" || s === "2turno") return 2;
  return null;
}

const ehCodigo = (s: string | undefined): s is string => !!s && /^\d{1,6}$/.test(s);
// Nome de país: letras (com acento), espaços, hífen, apóstrofo, ponto; até 80 caracteres.
const ehPais = (s: string | undefined): s is string =>
  !!s && s.length <= 80 && /^[\p{L}][\p{L}\s.'’-]*$/u.test(s);

/** Valida os segmentos (já decodificados). Devolve null se inválidos. */
export function parseAbrangencia(seg: string[]): Abrangencia | null {
  const [tipo, a, b, ...resto] = seg;
  if (resto.length) return null;
  if (tipo === "br" && !a) return { nivel: "BR" };
  if (tipo === "uf") {
    const uf = a?.toUpperCase();
    if (!uf || !SIGLAS.has(uf)) return null;
    if (b === undefined) return { nivel: "UF", uf };
    return ehCodigo(b) ? { nivel: "MUN", uf, municipio: String(Number(b)) } : null;
  }
  if (tipo === "exterior") {
    if (a === undefined) return { nivel: "EXTERIOR" };
    if (!ehPais(a)) return null;
    if (b === undefined) return { nivel: "PAIS", pais: a };
    return ehCodigo(b) ? { nivel: "CIDADE", pais: a, cidade: String(Number(b)) } : null;
  }
  return null;
}

export function segmentos(abr: Abrangencia): string[] {
  switch (abr.nivel) {
    case "BR":
      return ["br"];
    case "UF":
      return ["uf", abr.uf];
    case "MUN":
      return ["uf", abr.uf, abr.municipio];
    case "EXTERIOR":
      return ["exterior"];
    case "PAIS":
      return ["exterior", abr.pais];
    case "CIDADE":
      return ["exterior", abr.pais, abr.cidade];
  }
}

export function caminhoApi(turno: Turno, abr: Abrangencia): string {
  return `/api/eleicao/${turno}/${segmentos(abr).map(encodeURIComponent).join("/")}`;
}

export function chave(abr: Abrangencia): string {
  return segmentos(abr).join("/");
}

/** Abrangência "mãe" (para o botão voltar e para o mapa). */
export function pai(abr: Abrangencia): Abrangencia | null {
  switch (abr.nivel) {
    case "BR":
      return null;
    case "UF":
    case "EXTERIOR":
      return { nivel: "BR" };
    case "MUN":
      return { nivel: "UF", uf: abr.uf };
    case "PAIS":
      return { nivel: "EXTERIOR" };
    case "CIDADE":
      return { nivel: "PAIS", pais: abr.pais };
  }
}
