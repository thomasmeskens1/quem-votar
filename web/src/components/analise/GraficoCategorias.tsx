import type { CandidatoId } from "@/types";
import { CANDIDATOS } from "@/lib/candidatos";
import type { ContagemCategoria } from "@/lib/data/contagem";

export interface GraficoCategoriasProps {
  candidato: CandidatoId;
  dados: ContagemCategoria[];
  /** Valor máximo da escala, comum aos dois candidatos. */
  maximo: number;
}

/**
 * Barras horizontais (HTML/CSS) com a quantidade de propostas por categoria.
 * É uma tabela de verdade: leitores de tela leem categoria e número; as barras
 * são decorativas (aria-hidden). A escala é a mesma para os dois candidatos.
 */
export function GraficoCategorias({ candidato: c, dados, maximo }: GraficoCategoriasProps) {
  const escala = Math.max(1, maximo);
  return (
    <table className="w-full table-fixed border-collapse text-xs">
      <caption className="sr-only">
        Quantidade de propostas por categoria no plano de {CANDIDATOS[c].nome}
      </caption>
      <thead className="sr-only">
        <tr>
          <th scope="col">Categoria</th>
          <th scope="col">Propostas</th>
        </tr>
      </thead>
      <tbody>
        {dados.map((d) => (
          <tr key={d.categoria}>
            <th scope="row" className="w-[42%] py-1 pr-2 text-left align-middle font-normal text-gray-800">
              {d.categoria}
            </th>
            <td className="py-1 align-middle">
              <span className="flex items-center gap-1.5">
                {d.quantidade > 0 ? (
                  <span
                    aria-hidden="true"
                    className={`barra barra-${c}`}
                    style={{ width: `${(d.quantidade / escala) * 85}%` }}
                  />
                ) : null}
                <span className="shrink-0 font-semibold text-gray-900">
                  {d.quantidade}
                  {d.status === "apenas_secundaria" ? (
                    <span className="font-normal text-gray-700"> (tema secundário)</span>
                  ) : null}
                </span>
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
