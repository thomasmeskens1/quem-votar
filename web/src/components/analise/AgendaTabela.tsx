import type { CandidatoId, StatusAgenda, Vies } from "@/types";
import { ORDEM_CANDIDATOS } from "@/lib/candidatos";
import { CandidatoBadge } from "../CandidatoBadge";
import { StatusChip } from "../StatusChip";
import { ViesTag } from "../ViesTag";
import { PropostaRefs } from "../conteudo/PropostaRef";

export interface LinhaAgenda {
  id: string;
  item: string;
  vies_origem: Vies;
  criterio?: string;
  por_candidato: Partial<
    Record<CandidatoId, { status: StatusAgenda; ids: string[]; obs?: string | null }>
  >;
}

export interface AgendaTabelaProps {
  linhas: LinhaAgenda[];
}

/**
 * Lista comum de itens de agenda (diretriz 12): o mesmo item, com o mesmo
 * critério, aplicado aos dois planos. Em telas largas vira uma grade de 3 colunas.
 */
export function AgendaTabela({ linhas }: AgendaTabelaProps) {
  if (!linhas.length) {
    return <p className="text-sm text-gray-700">Nenhum item da lista comum de agenda nesta categoria.</p>;
  }
  return (
    <ul className="divide-y divide-gray-200 rounded-lg border border-gray-300 bg-white">
      {linhas.map((l) => (
        <li key={l.id} className="grid grid-cols-1 gap-3 p-3 md:grid-cols-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900">{l.item}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-gray-700">
              <span className="font-mono">{l.id}</span>
              <span>· item proposto a partir das prioridades do</span>
              <ViesTag vies={l.vies_origem} />
            </div>
            {l.criterio ? (
              <p className="mt-1 text-xs text-gray-700">
                <span className="font-medium">Critério:</span> {l.criterio}
              </p>
            ) : null}
          </div>
          {ORDEM_CANDIDATOS.map((c) => {
            const s = l.por_candidato[c];
            return (
              <div key={c} className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <CandidatoBadge candidato={c} tamanho="sm" />
                  {s ? <StatusChip dominio="agenda" status={s.status} /> : <span className="text-xs text-gray-700">não avaliado</span>}
                </div>
                {s?.ids.length ? <PropostaRefs ids={s.ids} rotulo="Base" /> : null}
                {s?.obs ? <p className="mt-1 text-xs text-gray-700">{s.obs}</p> : null}
              </div>
            );
          })}
        </li>
      ))}
    </ul>
  );
}
