import type { StatusCategoria } from "@/types";
import { StatusChip } from "./StatusChip";

export interface QuantidadePropostasProps {
  quantidade: number;
  status: StatusCategoria;
}

function rotulo(n: number) {
  return n === 1 ? "1 proposta" : `${n} propostas`;
}

/**
 * Tag com a quantidade de propostas ("69 propostas"), usada nos cards do
 * Comparativo e nas páginas de categoria. Mantém "Apenas como tema
 * secundário" e "Sem proposta registrada" quando se aplicam.
 */
export function QuantidadePropostas({ quantidade, status }: QuantidadePropostasProps) {
  if (status === "sem_proposta_registrada" || quantidade === 0) {
    return <StatusChip dominio="categoria" status="sem_proposta_registrada" />;
  }
  return (
    <span className="fila">
      <span className="st st-neutro">{rotulo(quantidade)}</span>
      {status === "apenas_secundaria" ? <StatusChip dominio="categoria" status="apenas_secundaria" /> : null}
    </span>
  );
}
