"use client";

import type { Argumento, CandidatoId, Vies } from "@/types";
import { VIESES_ORDEM } from "@/types/comum";
import {
  urlAnalises,
  urlPropostas,
  useSobDemanda,
  type AnalisePublica,
  type MapaPropostas,
} from "@/lib/cliente/sobDemanda";
import { ViesTag } from "../ViesTag";
import { ArgumentoCliente, DetalhesSobDemanda, EstadoBloco } from "./Blocos";

export interface ArgumentosSobDemandaProps {
  candidato: CandidatoId;
  origem: "rp" | "ri";
  vies: Vies;
  /** RP: nome da categoria. RI: índices das análises do viés. */
  categoria?: string;
  indices?: number[];
  nPros: number;
  nContras: number;
}

/** Prós e ressalvas de um viés, com citações, carregados ao abrir. */
export function ArgumentosSobDemanda(p: ArgumentosSobDemandaProps) {
  const { estado, carregar } = useSobDemanda<[MapaPropostas, AnalisePublica[]]>([
    urlPropostas(p.candidato),
    urlAnalises(p.origem, p.vies, p.candidato),
  ]);
  let analises: AnalisePublica[] = [];
  if (estado.status === "ok") {
    const todas = estado.dados[1];
    analises = p.indices
      ? p.indices.map((i) => todas[i]).filter(Boolean)
      : todas.filter((a) => a.categoria === p.categoria);
  }
  const lista = (titulo: string, args: Argumento[]) =>
    args.length ? (
      <div className="mt-2">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-700">{titulo}</h4>
        <ul className="mt-1 space-y-2">
          {args.map((a, i) => (
            <li key={i} className="border-l border-gray-300 pl-2">
              {estado.status === "ok" ? (
                <ArgumentoCliente argumento={a} c={p.candidato} mapa={estado.dados[0]} />
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    ) : null;
  return (
    <DetalhesSobDemanda
      className="mt-2"
      aoAbrir={carregar}
      resumo={`Argumentos e citações (${p.nPros} a favor, ${p.nContras} ressalvas)`}
    >
      <EstadoBloco estado={estado} tentar={carregar} />
      {lista("A favor, segundo este viés", analises.flatMap((a) => a.pros))}
      {lista("Ressalvas, segundo este viés", analises.flatMap((a) => a.contras))}
      {analises
        .filter((a) => a.observacao)
        .map((a, i) => (
          <p key={i} className="mt-2 text-xs text-gray-700">
            <span className="font-medium">Observação do analista:</span> {a.observacao}
          </p>
        ))}
    </DetalhesSobDemanda>
  );
}

export interface RefPublica {
  vies: Vies;
  lista: "pros" | "contras";
  indice: number;
  indice_analise?: number;
}

export interface OrigensSobDemandaProps {
  candidato: CandidatoId;
  origem: "rp" | "ri";
  /** RP: categoria em que a ref é resolvida. */
  categoria?: string;
  refs: RefPublica[];
}

/** Argumentos de origem de um consenso/divergência, carregados ao abrir. */
export function OrigensSobDemanda({ candidato: c, origem, categoria, refs }: OrigensSobDemandaProps) {
  const vieses = VIESES_ORDEM.filter((v) => refs.some((r) => r.vies === v));
  const { estado, carregar } = useSobDemanda<[MapaPropostas, ...AnalisePublica[][]]>([
    urlPropostas(c),
    ...vieses.map((v) => urlAnalises(origem, v, c)),
  ]);
  if (!refs.length) return null;
  return (
    <DetalhesSobDemanda
      className="mt-1"
      aoAbrir={carregar}
      resumo={<span className="text-xs">Ver argumentos de origem ({refs.length})</span>}
    >
      <EstadoBloco estado={estado} tentar={carregar} />
      {estado.status === "ok" ? (
        <ul className="mt-1 space-y-2">
          {refs.map((r, i) => {
            const analises = estado.dados[1 + vieses.indexOf(r.vies)] as AnalisePublica[];
            const a =
              r.indice_analise !== undefined
                ? analises[r.indice_analise]
                : analises.find((x) => x.categoria === categoria);
            const arg = a?.[r.lista]?.[r.indice];
            if (!arg) return null;
            return (
              <li key={i} className="border-l border-gray-300 pl-2">
                <ViesTag vies={r.vies} />
                <div className="mt-1">
                  <ArgumentoCliente argumento={arg} c={c} mapa={estado.dados[0]} />
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </DetalhesSobDemanda>
  );
}
