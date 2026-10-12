import { rotuloStatus, type DominioStatus } from "@/lib/rotulos";

export interface StatusChipProps {
  /** "processo" (RH), "agenda" (lista comum) ou "categoria" (síntese). */
  dominio: DominioStatus;
  status: string;
  /** Mostra a descrição do status após o rótulo. */
  comDescricao?: boolean;
}

/**
 * Chip de status com vocabulário em linguagem clara (ver lib/rotulos.ts).
 * As cores vêm das classes .st-* em globals.css (mesmos valores de CORES_STATUS).
 */
export function StatusChip({ dominio, status, comDescricao = false }: StatusChipProps) {
  const r = rotuloStatus(dominio, status);
  const chip = (
    <span className={`st st-${r.tom}`} title={r.descricao}>
      {r.rotulo}
    </span>
  );
  if (!comDescricao || !r.descricao) return chip;
  return (
    <span className="inline-flex flex-wrap items-baseline gap-1">
      {chip}
      <span className="text-xs text-gray-700">— {r.descricao}</span>
    </span>
  );
}
