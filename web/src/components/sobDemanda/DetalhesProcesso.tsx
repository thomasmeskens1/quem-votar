"use client";

import { legivel } from "@/lib/texto";
import type { CandidatoId } from "@/types";
import { urlRh, useSobDemanda, type FontePublica, type RhPublico } from "@/lib/cliente/sobDemanda";
import { AVISO_REPORTAGEM, ROTULO_ORIGEM, formatarData } from "@/lib/rotulos";
import { StatusChip } from "../StatusChip";
import { DetalhesSobDemanda, EstadoBloco } from "./Blocos";

export interface DetalhesProcessoProps {
  candidato: CandidatoId;
  secao: "processos_e_investigacoes" | "acoes_civeis";
  indice: number;
  nHistorico: number;
}

function Fontes({ ids, fontes }: { ids: string[]; fontes: Map<string, FontePublica> }) {
  return (
    <ul className="mt-0.5 flex flex-col gap-0.5">
      {ids.map((id) => {
        const f = fontes.get(id);
        if (!f) return <li key={id} className="text-xs">Fonte {id}</li>;
        const rep = f.tp === "reportagem";
        return (
          <li key={id} className="text-xs">
            <a href={f.u} target="_blank" rel="noopener noreferrer" className="lk">
              <span className="tag-fonte">{rep ? "Reportagem" : "Oficial"}</span> {f.o} — {f.t}
              <span className="sr-only"> (abre em nova aba)</span>
            </a>
            {rep ? <span className="aviso-rep">{AVISO_REPORTAGEM}</span> : null}
          </li>
        );
      })}
    </ul>
  );
}

/** Histórico, trecho das fontes e observações de um processo, carregados ao abrir. */
export function DetalhesProcesso({ candidato, secao, indice, nHistorico }: DetalhesProcessoProps) {
  const { estado, carregar } = useSobDemanda<[RhPublico]>([urlRh(candidato)]);
  const rh = estado.status === "ok" ? estado.dados[0] : null;
  const d = rh?.[secao][indice];
  const fontes = new Map((rh?.fontes ?? []).map((f) => [f.id, f]));
  return (
    <DetalhesSobDemanda
      className="mt-2"
      aoAbrir={carregar}
      resumo={`Histórico (${nHistorico} registro(s)), trecho das fontes e observações`}
    >
      <EstadoBloco estado={estado} tentar={carregar} />
      {d ? (
        <div className="mt-2 space-y-2">
          <ol className="space-y-2 border-l border-gray-300 pl-3">
            {d.historico_status.map((h, i) => (
              <li key={i}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-gray-800">{formatarData(h.data)}</span>
                  <StatusChip dominio="processo" status={h.status} />
                  <span className="text-xs text-gray-700">Origem: {ROTULO_ORIGEM[h.origem] ?? h.origem}</span>
                  {h.origem === "reportagem" ? <span className="aviso-rep">{AVISO_REPORTAGEM}</span> : null}
                </div>
                {h.status_descricao_fonte ? (
                  <p className="text-xs text-gray-800">
                    Texto da fonte: <q className="italic">{legivel(h.status_descricao_fonte)}</q>
                  </p>
                ) : null}
                {h.observacao ? <p className="text-xs text-gray-700">{legivel(h.observacao)}</p> : null}
                <Fontes ids={h.fonte_ids} fontes={fontes} />
              </li>
            ))}
          </ol>
          {d.trecho_fonte ? (
            <p className="text-xs text-gray-800">
              <span className="font-medium">Trecho das fontes:</span> <q className="italic">{legivel(d.trecho_fonte)}</q>
            </p>
          ) : null}
          {d.observacao ? (
            <p className="text-xs text-gray-700">
              <span className="font-medium">Observação:</span> {legivel(d.observacao)}
            </p>
          ) : null}
        </div>
      ) : null}
    </DetalhesSobDemanda>
  );
}
