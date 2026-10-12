import type { CandidatoId } from "@/types/comum";
import { CANDIDATOS } from "@/lib/candidatos";

export interface CandidatoBadgeProps {
  candidato: CandidatoId;
  /** Exibe o número de urna antes do nome (padrão: true). */
  comNumero?: boolean;
  tamanho?: "sm" | "md" | "lg";
}

const TAM = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-1",
  lg: "text-base px-3 py-1.5",
};

/**
 * Identificação do candidato com a mesma forma e tamanho para os dois.
 * Cores nas classes .cb-* de globals.css (mesmos valores de CORES_CANDIDATOS).
 */
export function CandidatoBadge({ candidato, comNumero = true, tamanho = "md" }: CandidatoBadgeProps) {
  const m = CANDIDATOS[candidato];
  return (
    <span className={`cb cb-${candidato} ${TAM[tamanho]}`}>
      {comNumero ? (
        <span className="cb-n">
          <span className="sr-only">número </span>
          {m.numero}
        </span>
      ) : null}
      <span>{m.nome}</span>
    </span>
  );
}
