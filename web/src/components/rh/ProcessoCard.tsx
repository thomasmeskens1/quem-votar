import type { CandidatoId, FonteRh, Processo } from "@/types";
import { formatarData } from "@/lib/rotulos";
import { DetalhesProcesso } from "../sobDemanda/DetalhesProcesso";
import { StatusChip } from "../StatusChip";
import { AvisoReportagem, FontesRh } from "./FontesRh";
import { textoLegivel } from "@/lib/data/texto";

export interface ProcessoCardProps {
  processo: Processo;
  fontes: Map<string, FonteRh>;
  candidato: CandidatoId;
  secao: "processos_e_investigacoes" | "acoes_civeis";
  /** Posição do processo na seção (para carregar os detalhes). */
  indice: number;
}

/**
 * Processo, investigação ou ação cível do dossiê. Situação, descrição,
 * desfecho noticiado e fontes ficam no HTML; histórico, trecho das fontes e
 * observações são carregados ao abrir.
 */
export function ProcessoCard({ processo: p, fontes, candidato, secao, indice }: ProcessoCardProps) {
  return (
    <article className="cartao">
      <h4 className="font-semibold text-gray-900">{textoLegivel(p.titulo)}</h4>
      <p className="mt-1">
        <span className="rot">Órgão:</span> {textoLegivel(p.orgao)}
        {p.numero_processo ? (
          <>
            {" · "}
            <span className="rot">Número:</span> <span className="break-all">{p.numero_processo}</span>
          </>
        ) : null}
      </p>
      <p className="fila mt-1">
        <span className="rot">Situação atual:</span>
        <StatusChip dominio="processo" status={p.status_atual} />
        <span className="meta">
          {p.data_status ? `desde ${formatarData(p.data_status)}` : "data da situação não informada"}
          {p.data_certidao ? ` · certidão de ${formatarData(p.data_certidao)}` : ""}
        </span>
      </p>
      {p.status_descricao_fonte ? (
        <p className="meta mt-1">
          Texto da fonte: <q className="italic">{textoLegivel(p.status_descricao_fonte)}</q>
        </p>
      ) : null}
      <p className="mt-2 text-gray-900">{textoLegivel(p.descricao)}</p>

      {p.ultimo_status_oficial ? (
        <div className="caixa mt-2 bg-gray-50">
          <p className="fila">
            <span className="meta font-semibold">Último status em fonte oficial:</span>
            <StatusChip dominio="processo" status={p.ultimo_status_oficial.status} />
            <span className="meta">{formatarData(p.ultimo_status_oficial.data)}</span>
          </p>
          <FontesRh ids={p.ultimo_status_oficial.fonte_ids} fontes={fontes} />
        </div>
      ) : null}

      {p.desfecho_noticiado ? (
        <div className="caixa mt-2 border-dashed border-gray-500">
          <p className="fila meta font-semibold">
            Desfecho noticiado <AvisoReportagem />
          </p>
          <p className="mt-1">{textoLegivel(p.desfecho_noticiado.resumo)}</p>
          <FontesRh ids={p.desfecho_noticiado.fonte_ids} fontes={fontes} />
        </div>
      ) : null}

      <FontesRh ids={p.fonte_ids} fontes={fontes} />

      {p.historico_status.length || p.trecho_fonte || p.observacao ? (
        <DetalhesProcesso
          candidato={candidato}
          secao={secao}
          indice={indice}
          nHistorico={p.historico_status.length}
        />
      ) : null}
    </article>
  );
}
