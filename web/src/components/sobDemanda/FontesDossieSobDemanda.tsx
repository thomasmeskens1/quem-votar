"use client";

import type { CandidatoId } from "@/types";
import { urlRh, useSobDemanda, type RhPublico } from "@/lib/cliente/sobDemanda";
import { AVISO_REPORTAGEM, formatarData } from "@/lib/rotulos";
import { DetalhesSobDemanda, EstadoBloco } from "./Blocos";

export interface FontesDossieSobDemandaProps {
  candidato: CandidatoId;
  nOficiais: number;
  nReportagens: number;
}

/** Lista completa das fontes do dossiê (título, datas), carregada ao abrir. */
export function FontesDossieSobDemanda({ candidato, nOficiais, nReportagens }: FontesDossieSobDemandaProps) {
  const { estado, carregar } = useSobDemanda<[RhPublico]>([urlRh(candidato)]);
  return (
    <DetalhesSobDemanda
      aoAbrir={carregar}
      resumo={`Ver as ${nOficiais + nReportagens} fontes (${nOficiais} oficiais, ${nReportagens} reportagens)`}
    >
      <EstadoBloco estado={estado} tentar={carregar} />
      {estado.status === "ok" ? (
        <ul className="mt-2 space-y-1">
          {estado.dados[0].fontes.map((f) => {
            const rep = f.tp === "reportagem";
            return (
              <li key={f.id} className="text-xs text-gray-800">
                <a href={f.u} target="_blank" rel="noopener noreferrer" className="lk">
                  <span className="tag-fonte">{rep ? "Reportagem" : "Oficial"}</span> {f.o} — {f.t}
                  <span className="sr-only"> (nova aba)</span>
                </a>{" "}
                <span className="text-gray-700">
                  (acesso em {formatarData(f.a)}
                  {f.dp ? `; publicação ${formatarData(f.dp)}` : ""})
                </span>
                {rep ? <span className="aviso-rep">{AVISO_REPORTAGEM}</span> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </DetalhesSobDemanda>
  );
}
