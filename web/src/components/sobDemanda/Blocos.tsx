"use client";

import type { ReactNode } from "react";
import type { Argumento, CandidatoId } from "@/types";
import { pdfPagina } from "@/lib/candidatos";
import type { EstadoCarga, MapaPropostas } from "@/lib/cliente/sobDemanda";
import { legivel } from "@/lib/texto";

/** Mensagens de carregamento/erro de um bloco sob demanda (anunciadas por leitores de tela). */
export function EstadoBloco({
  estado,
  tentar,
}: {
  estado: EstadoCarga<unknown[]>;
  tentar: () => void;
}) {
  if (estado.status === "carregando" || estado.status === "ocioso") {
    return (
      <p role="status" className="mt-2 text-xs text-gray-700">
        Carregando…
      </p>
    );
  }
  if (estado.status === "erro") {
    return (
      <p role="alert" className="mt-2 text-xs text-gray-800">
        Não foi possível carregar este conteúdo.{" "}
        <button type="button" onClick={tentar} className="lk">
          Tentar novamente
        </button>
      </p>
    );
  }
  return null;
}

/** <details> que dispara a carga ao ser aberto. */
export function DetalhesSobDemanda({
  resumo,
  aoAbrir,
  children,
  className = "",
}: {
  resumo: ReactNode;
  aoAbrir: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <details
      className={className}
      onToggle={(e) => {
        if (e.currentTarget.open) aoAbrir();
      }}
    >
      <summary>{resumo}</summary>
      {children}
    </details>
  );
}

/** Referência curta a um item do plano ("p. 15", link para o PDF); o id não é exibido. */
export function RefCliente({ id, c, mapa }: { id: string; c: CandidatoId; mapa: MapaPropostas }) {
  const it = mapa[id];
  if (!it) return <span className="chip">proposta do plano</span>;
  return (
    <a href={pdfPagina(c, it.p)} title={it.r} className="chip lk" aria-label={`Plano de governo, página ${it.p}`}>
      p. {it.p}
    </a>
  );
}

/** Texto sem ids técnicos, com ids de propostas convertidos em página do plano. */
export function textoCliente(t: string, mapa: MapaPropostas): string {
  return legivel(t, { proposta: (id) => (mapa[id] ? `proposta da p. ${mapa[id].p}` : null) });
}

/** Argumento de um viés com as citações literais e as páginas do plano. */
export function ArgumentoCliente({
  argumento,
  c,
  mapa,
}: {
  argumento: Argumento;
  c: CandidatoId;
  mapa: MapaPropostas;
}) {
  const citados = new Set(argumento.citacoes.map((ci) => ci.proposta_id));
  const paginas = new Set<number>();
  const outros = argumento.proposta_ids.filter((id) => {
    if (citados.has(id) || !mapa[id] || paginas.has(mapa[id].p)) return false;
    paginas.add(mapa[id].p);
    return true;
  });
  return (
    <div className="text-sm text-gray-900">
      <p>{textoCliente(argumento.argumento, mapa)}</p>
      {argumento.citacoes.length ? (
        <ul className="mt-1 space-y-1">
          {argumento.citacoes.map((ci, i) => (
            <li key={i} className="text-xs text-gray-800">
              <q className="italic">{ci.texto}</q> <RefCliente id={ci.proposta_id} c={c} mapa={mapa} />
            </li>
          ))}
        </ul>
      ) : null}
      {outros.length ? (
        <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-gray-700">
          Também citadas (página do plano):
          {outros.map((id) => (
            <RefCliente key={id} id={id} c={c} mapa={mapa} />
          ))}
        </p>
      ) : null}
    </div>
  );
}
