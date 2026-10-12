import type { CandidatoId, Vies } from "@/types";
import { VIESES_ORDEM } from "@/types/comum";
import { ViesTag } from "../ViesTag";
import { ArgumentosSobDemanda } from "../sobDemanda/ArgumentosSobDemanda";
import { textoLegivel } from "@/lib/data/texto";

/** Qual análise de cada viés detalha a leitura (resolvida no navegador ao abrir). */
export interface SelecaoAnalise {
  /** RP: nome da categoria. */
  categoria?: string;
  /** RI: índices das análises do viés. */
  indices?: number[];
  nPros: number;
  nContras: number;
}

export interface LeiturasViesesProps {
  /** Leitura sintética de cada viés. */
  leituras: Record<Vies, string>;
  candidato: CandidatoId;
  origem: "rp" | "ri";
  /** Análises de origem por viés; sem seleção, não há bloco de argumentos. */
  selecoes?: Partial<Record<Vies, SelecaoAnalise | null>>;
}

/** As três leituras exibidas lado a lado e identificadas pelo viés (diretriz 9). */
export function LeiturasVieses({ leituras, candidato, origem, selecoes }: LeiturasViesesProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {VIESES_ORDEM.map((v) => {
        const s = selecoes?.[v];
        return (
          <div key={v} className={`caixa bl-${v} p-3`}>
            <ViesTag vies={v} />
            <p className="mt-2 text-sm text-gray-900">{textoLegivel(leituras[v])}</p>
            {s && s.nPros + s.nContras > 0 ? (
              <ArgumentosSobDemanda
                candidato={candidato}
                origem={origem}
                vies={v}
                categoria={s.categoria}
                indices={s.indices}
                nPros={s.nPros}
                nContras={s.nContras}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
