import { CANDIDATOS_ORDEM } from "@/types/comum";
import { CANDIDATOS } from "@/lib/candidatos";
import type { Caminho, PerguntaView } from "../tipos";
import { LinkComparativo } from "./ListaPropostas";

const CAMINHOS: readonly Caminho[] = ["A", "B"];

function planosDoCaminho(p: PerguntaView, caminho: Caminho): string {
  const nomes = CANDIDATOS_ORDEM.filter((c) => p.posicoes[c].opcao === caminho).map(
    (c) => CANDIDATOS[c].nome,
  );
  if (nomes.length === 0) return "não corresponde a nenhum dos planos";
  return `corresponde ao plano de ${nomes.join(" e ao plano de ")}`;
}

/**
 * Perguntas respondidas com a posição central da escala, "Não tenho uma opinião formada sobre o tema": ficam fora do
 * cálculo; aqui só se mostra a qual plano corresponde cada caminho, para consulta.
 */
export function ListaSemOpiniao({ perguntas }: { perguntas: PerguntaView[] }) {
  if (perguntas.length === 0) return null;
  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-gray-900">Sem opinião formada ({perguntas.length})</h2>
      <p className="mt-1 text-sm text-gray-700">
        Nestas situações você respondeu que não tem uma opinião formada. Elas ficam fora do cálculo
        dos dois candidatos.
      </p>
      <ul className="mt-3 grid items-start gap-3 md:grid-cols-2">
        {perguntas.map((p) => (
          <li key={p.id} className="rounded-md border border-gray-300 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">{p.categoria}</p>
            <p className="mt-1 font-medium text-gray-900">{p.situacao}</p>
            <ul className="mt-2 space-y-1 text-sm text-gray-800">
              {CAMINHOS.map((k) => (
                <li key={k}>
                  <span className="font-semibold">Caminho {k}:</span> {p.opcoes[k]}{" "}
                  <span className="text-gray-700">({planosDoCaminho(p, k)})</span>
                </li>
              ))}
            </ul>
            <p className="mt-2">
              <LinkComparativo p={p} />
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
