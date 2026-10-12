import type { Metadata } from "next";
import { LarguraTotal } from "@/features/eleicao/componentes/LarguraTotal";
import { PainelApuracao } from "@/features/eleicao/componentes/PainelApuracao";

export const metadata: Metadata = {
  title: "Apuração — Eleição presidencial 2026",
  description:
    "Resultados oficiais do TSE para Presidente em 2026: 1º e 2º turno, por estado, município e exterior, com brancos, nulos e abstenção.",
};

export default function PaginaEleicao() {
  return (
    <LarguraTotal>
      <div className="space-y-4">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">Apuração — Presidente 2026</h1>
          <p className="text-sm text-gray-700">
            Resultados oficiais do Tribunal Superior Eleitoral (TSE). 1º turno em 04/10/2026; 2º turno em 25/10/2026,
            com atualização automática durante a apuração.
          </p>
        </header>
        <PainelApuracao />
      </div>
    </LarguraTotal>
  );
}
