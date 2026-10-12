import type { Vies } from "@/types/comum";
import { ROTULO_VIES } from "@/lib/cores";

export interface ViesTagProps {
  vies: Vies;
  tamanho?: "sm" | "md";
  /** Prefixa com "Viés de" (padrão: true). */
  comPrefixo?: boolean;
}

/**
 * Identificação do viés de uma leitura (diretriz 9). As cores vêm das classes
 * .vt-* em globals.css (mesmos valores de CORES_VIESES em lib/cores.ts).
 */
export function ViesTag({ vies, tamanho = "sm", comPrefixo = true }: ViesTagProps) {
  return (
    <span className={`vt vt-${vies}${tamanho === "md" ? " vt-md" : ""}`}>
      {comPrefixo ? `Viés de ${ROTULO_VIES[vies].toLowerCase()}` : ROTULO_VIES[vies]}
    </span>
  );
}
