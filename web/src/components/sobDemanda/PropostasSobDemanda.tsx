"use client";

import type { CandidatoId } from "@/types";
import { pdfPagina } from "@/lib/candidatos";
import { urlPropostas, useSobDemanda, type MapaPropostas } from "@/lib/cliente/sobDemanda";
import { DetalhesSobDemanda, EstadoBloco } from "./Blocos";

const TIPO: Record<string, string> = {
  proposta: "Proposta",
  diagnostico: "Diagnóstico",
  principio: "Princípio",
};

export interface PropostasSobDemandaProps {
  candidato: CandidatoId;
  /** Ids com a categoria da página como principal (ou todos, se não houver categoria). */
  principais: string[];
  /** Ids com a categoria da página como secundária. */
  secundarias?: string[];
  /** Nome da categoria da página, se houver. */
  categoria?: string;
}

/**
 * Lista de propostas (trecho literal + resumo + página do PDF) carregada ao
 * abrir o bloco, a partir de public/dados/propostas/<candidato>.json.
 */
export function PropostasSobDemanda({
  candidato: c,
  principais,
  secundarias = [],
  categoria,
}: PropostasSobDemandaProps) {
  const { estado, carregar } = useSobDemanda<[MapaPropostas]>([urlPropostas(c)]);
  const ids = [...principais, ...secundarias];
  const resumo = categoria
    ? `Ver as propostas (${principais.length} com esta categoria como principal, ${secundarias.length} como secundária)`
    : `Ver as propostas`;
  return (
    <DetalhesSobDemanda resumo={resumo} aoAbrir={carregar}>
      <EstadoBloco estado={estado} tentar={carregar} />
      {estado.status === "ok" ? (
        <ol className="mt-3 space-y-4">
          {ids.map((id) => {
            const it = estado.dados[0][id];
            if (!it) return null;
            const sec = categoria && it.cp && it.cp !== categoria;
            const pags = it.pf && it.pf !== it.p ? `pp. ${it.p}–${it.pf}` : `p. ${it.p}`;
            return (
              <li key={id} id={id} className="scroll-mt-20 border-l-2 border-gray-300 pl-3">
                <p className="flex flex-wrap items-center gap-2 text-xs text-gray-700">
                  <span>
                    {TIPO[it.t] ?? it.t} · {pags}
                  </span>
                  {sec ? <span className="chip">Tema secundário (principal: {it.cp})</span> : null}
                </p>
                <blockquote className="mt-1 text-sm text-gray-900">“{it.tl}”</blockquote>
                <p className="mt-1 text-xs text-gray-700">
                  <span className="font-medium">Resumo neutro:</span> {it.r}
                </p>
                <a
                  href={pdfPagina(c, it.p)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lk mt-1 inline-block text-sm"
                >
                  <span className="tag-fonte">PDF</span> Plano de governo, {pags}
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
              </li>
            );
          })}
        </ol>
      ) : null}
    </DetalhesSobDemanda>
  );
}
