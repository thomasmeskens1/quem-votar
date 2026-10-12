"use client";

import type { ReactNode } from "react";
import type { Argumento, CandidatoId } from "@/types";
import { pdfPagina } from "@/lib/candidatos";
import type { EstadoCarga, MapaPropostas } from "@/lib/cliente/sobDemanda";

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
      <summary className="lk sum">{resumo}</summary>
      {children}
    </details>
  );
}

/** Referência curta a um item do plano (id + página, link para o PDF). */
export function RefCliente({ id, c, mapa }: { id: string; c: CandidatoId; mapa: MapaPropostas }) {
  const it = mapa[id];
  if (!it) return <span className="chip font-mono">{id}</span>;
  return (
    <a href={pdfPagina(c, it.p)} target="_blank" rel="noopener noreferrer" title={it.r} className="chip lk">
      <span className="font-mono">{id}</span> p. {it.p}
      <span className="sr-only"> (PDF do plano de governo, abre em nova aba)</span>
    </a>
  );
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
  const outros = argumento.proposta_ids.filter((id) => !citados.has(id));
  return (
    <div className="text-sm text-gray-900">
      <p>{argumento.argumento}</p>
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
          Também citadas:
          {outros.map((id) => (
            <RefCliente key={id} id={id} c={c} mapa={mapa} />
          ))}
        </p>
      ) : null}
    </div>
  );
}
