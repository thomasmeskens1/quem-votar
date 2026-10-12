"use client";

/**
 * Locais de votação (colégios eleitorais) de um município:
 * /dados/eleicao/2026/<turno>turno/locais/<UF>/<cod_tse>.json (contrato em
 * dados/eleicao/esquema.json). Cada turno usa só o seu arquivo: no 2º turno,
 * os pins do 1º nunca aparecem como se fossem do 2º.
 */
import { useEffect, useState } from "react";
import type { CandidatoVotos, Fonte, Totais, Turno } from "./tipos";

export interface LocalVotacao {
  nr_zona: number | string;
  nr_local: number | string;
  nome: string;
  endereco?: string;
  bairro?: string;
  lat?: number | null;
  lon?: number | null;
  /** Número de seções ou lista das seções. */
  secoes?: number | Array<number | string>;
  totais: Totais;
  /** Candidatos com 0 voto são omitidos (ausência = 0). */
  candidatos: CandidatoVotos[];
  /** Coordenada do TSE cai fora do contorno do município (pin aparece, com nota). */
  fora_do_municipio?: boolean;
  /** Coordenada do TSE fora do Brasil (lat/lon nulos: só na lista). */
  coordenadas_tse_fora_do_brasil?: boolean;
}

export interface FonteLocais {
  urls?: string[];
  data_arquivo_tse?: string;
}

export interface ArquivoLocais {
  eleicao: number;
  turno: number;
  uf: string;
  cod_tse: string;
  cod_ibge?: string;
  nome?: string;
  gerado_em?: string;
  fonte?: Partial<Fonte> & { urls?: string[] };
  locais: LocalVotacao[];
  sem_coordenadas?: Array<string | number>;
}

export type EstadoLocais =
  | { estado: "carregando" }
  | { estado: "ausente" }
  | { estado: "ok"; dados: ArquivoLocais };

export const idLocal = (l: LocalVotacao) => `${l.nr_zona}-${l.nr_local}`;
export const temCoordenadas = (l: LocalVotacao) =>
  typeof l.lat === "number" && typeof l.lon === "number" && Number.isFinite(l.lat) && Number.isFinite(l.lon);
export const qtdSecoes = (l: LocalVotacao) => (Array.isArray(l.secoes) ? l.secoes.length : (l.secoes ?? 0));

function valido(j: unknown): j is ArquivoLocais {
  return !!j && typeof j === "object" && Array.isArray((j as ArquivoLocais).locais);
}

async function buscar(turno: Turno, uf: string, codTse: string): Promise<ArquivoLocais | null> {
  const nomes = [codTse.padStart(5, "0"), String(Number(codTse))];
  for (const cod of [...new Set(nomes)]) {
    try {
      const r = await fetch(`/dados/eleicao/2026/${turno}turno/locais/${uf}/${cod}.json`);
      if (!r.ok) continue;
      const j: unknown = await r.json();
      if (valido(j)) return j;
    } catch {
      // tenta o próximo nome
    }
  }
  return null;
}

let fontes: Partial<Record<Turno, Promise<FonteLocais | null>>> = {};

/** Fonte dos arquivos de locais (locais/fonte.json do turno). */
export function carregarFonteLocais(turno: Turno): Promise<FonteLocais | null> {
  const f =
    fontes[turno] ??
    fetch(`/dados/eleicao/2026/${turno}turno/locais/fonte.json`)
      .then((r) => (r.ok ? (r.json() as Promise<FonteLocais>) : null))
      .catch(() => null);
  fontes = { ...fontes, [turno]: f };
  return f;
}

/** Local em destaque: pelo mapa (abre o tooltip) ou pela lista (só realça o pin). */
export interface FocoLocal {
  id: string;
  origem: "mapa" | "lista";
}

/** Carrega os locais do município (null = nenhum município aberto). */
export function useLocais(turno: Turno, uf: string | null, codTse: string | null): EstadoLocais | null {
  const chave = uf && codTse ? `${turno}|${uf}|${codTse}` : null;
  const [estado, setEstado] = useState<{ chave: string; v: EstadoLocais } | null>(null);
  useEffect(() => {
    if (!chave || !uf || !codTse) return;
    let vivo = true;
    buscar(turno, uf, codTse).then((d) => {
      if (vivo) setEstado({ chave, v: d ? { estado: "ok", dados: d } : { estado: "ausente" } });
    });
    return () => {
      vivo = false;
    };
  }, [chave, turno, uf, codTse]);
  if (!chave) return null;
  return estado?.chave === chave ? estado.v : { estado: "carregando" };
}
