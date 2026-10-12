import type { ReactNode } from "react";
import type { CandidatoId } from "@/types/comum";
import { ORDEM_CANDIDATOS } from "@/lib/candidatos";
import { CandidatoBadge } from "./CandidatoBadge";

export interface ParCandidatosProps {
  /** Conteúdo de cada coluna; chamado na ordem fixa (13, 22). */
  render: (c: CandidatoId) => ReactNode;
  /** Exibe o badge do candidato no topo de cada coluna (padrão: true). */
  comCabecalho?: boolean;
  /** Prefixo de id para âncoras (ex.: "propostas" gera "propostas-lula"). */
  idPrefixo?: string;
}

/**
 * Duas colunas de mesma largura e estrutura, uma por candidato (empilhadas
 * no celular, sempre na ordem 13, 22). Usada em todas as telas comparativas.
 */
export function ParCandidatos({ render, comCabecalho = true, idPrefixo }: ParCandidatosProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {ORDEM_CANDIDATOS.map((c) => (
        <div
          key={c}
          id={idPrefixo ? `${idPrefixo}-${c}` : undefined}
          className={`cartao bt-${c}`}
        >
          {comCabecalho ? (
            <div className="mb-3">
              <CandidatoBadge candidato={c} />
            </div>
          ) : null}
          {render(c)}
        </div>
      ))}
    </div>
  );
}
