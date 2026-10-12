"use client";

import { useState } from "react";
import type { Argumento, CandidatoId, HistoricoStatus, Vies } from "@/types";

/**
 * Dados publicados em public/dados/ por scripts/sync-data.mjs e carregados
 * pelo navegador apenas quando o leitor expande um bloco (mantém o HTML leve).
 */

/** Item do plano em formato enxuto (public/dados/propostas/<c>.json). */
export interface PropostaEnxuta {
  t: string; // tipo
  p: number; // página
  pf: number | null; // página final
  tl: string; // trecho literal
  r: string; // resumo neutro
  cp: string | null; // categoria principal
}

export type MapaPropostas = Record<string, PropostaEnxuta>;

/** Análise de um viés (public/dados/rp|ri/<vies>/<c>.json), na ordem original. */
export interface AnalisePublica {
  categoria: string;
  pros: Argumento[];
  contras: Argumento[];
  observacao: string | null;
}

export interface DetalheProcessoPublico {
  historico_status: HistoricoStatus[];
  trecho_fonte: string | null;
  observacao: string | null;
}

export interface FontePublica {
  id: string;
  t: string;
  o: string;
  u: string;
  tp: string;
  /** data de acesso */
  a?: string | null;
  /** data de publicação */
  dp?: string | null;
}

export interface RhPublico {
  fontes: FontePublica[];
  processos_e_investigacoes: DetalheProcessoPublico[];
  acoes_civeis: DetalheProcessoPublico[];
}

export const urlPropostas = (c: CandidatoId) => `/dados/propostas/${c}.json`;
export const urlAnalises = (origem: "rp" | "ri", v: Vies, c: CandidatoId) =>
  `/dados/${origem}/${v}/${c}.json`;
export const urlRh = (c: CandidatoId) => `/dados/rh/${c}.json`;

const cache = new Map<string, Promise<unknown>>();

export function buscarJson<T>(url: string): Promise<T> {
  let p = cache.get(url);
  if (!p) {
    p = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`);
      return r.json();
    });
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return p as Promise<T>;
}

export type EstadoCarga<T> =
  | { status: "ocioso" }
  | { status: "carregando" }
  | { status: "ok"; dados: T }
  | { status: "erro" };

/**
 * Carrega um conjunto de JSON sob demanda. `carregar` deve ser chamado num
 * evento (ex.: ao abrir um <details>); chamadas repetidas são ignoradas.
 */
export function useSobDemanda<T extends unknown[]>(urls: string[]) {
  const [estado, setEstado] = useState<EstadoCarga<T>>({ status: "ocioso" });
  function carregar() {
    if (estado.status === "ok" || estado.status === "carregando") return;
    setEstado({ status: "carregando" });
    Promise.all(urls.map((u) => buscarJson<unknown>(u)))
      .then((dados) => setEstado({ status: "ok", dados: dados as T }))
      .catch(() => setEstado({ status: "erro" }));
  }
  return { estado, carregar };
}
