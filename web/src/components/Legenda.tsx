import { VIESES_ORDEM } from "@/types/comum";
import { ORDEM_CANDIDATOS } from "@/lib/candidatos";
import { CandidatoBadge } from "./CandidatoBadge";
import { ViesTag } from "./ViesTag";

/** Legenda das cores dos três vieses. */
export function LegendaVieses() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-800" aria-label="Legenda dos vieses">
      <span className="font-medium">Leituras:</span>
      {VIESES_ORDEM.map((v) => (
        <ViesTag key={v} vies={v} />
      ))}
    </div>
  );
}

/** Legenda dos candidatos, na ordem fixa por número de urna. */
export function LegendaCandidatos() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-800" aria-label="Legenda dos candidatos">
      <span className="font-medium">Candidatos (ordem por número de urna):</span>
      {ORDEM_CANDIDATOS.map((c) => (
        <CandidatoBadge key={c} candidato={c} tamanho="sm" />
      ))}
    </div>
  );
}

/** As duas legendas juntas, para o topo das páginas comparativas. */
export function Legendas() {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <LegendaCandidatos />
      <LegendaVieses />
    </div>
  );
}
