import type { Metadata } from "next";
import Link from "next/link";
import { CandidatoBadge } from "@/components/CandidatoBadge";
import { Legendas } from "@/components/Legenda";
import { StatusChip } from "@/components/StatusChip";
import { ORDEM_CANDIDATOS } from "@/lib/candidatos";
import { getCategorias } from "@/lib/data/categorias";
import { getCategoriaRp } from "@/lib/data/rp";
import { slugify } from "@/lib/slug";

export const metadata: Metadata = {
  title: "Comparativo por categoria",
  description: "As propostas dos dois planos de governo organizadas nas 16 categorias.",
};

export default function ComparativoIndex() {
  const categorias = getCategorias();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Comparativo por categoria</h1>
        <p className="mt-2 max-w-3xl text-gray-800">
          As propostas de cada plano foram classificadas em 16 categorias, com os mesmos critérios
          para os dois candidatos. Em cada categoria: as propostas com trecho literal e página do
          PDF, as leituras dos três vieses lado a lado, consensos e divergências, o comparativo e a
          lista comum de itens de agenda.
        </p>
      </header>
      <Legendas />
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {categorias.map((cat) => {
          const rp = getCategoriaRp(cat.nome);
          return (
            <li key={cat.nome}>
              <Link
                href={`/comparativo/${slugify(cat.nome)}`}
                className="block h-full rounded-lg border border-gray-300 bg-white p-4 hover:border-gray-500 hover:bg-gray-50"
              >
                <span className="block text-lg font-semibold text-gray-900">{cat.nome}</span>
                <span className="mt-1 block text-xs text-gray-700">
                  Inclui: {cat.inclui.join("; ")}
                </span>
                <span className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {ORDEM_CANDIDATOS.map((c) => {
                    const p = rp?.por_candidato[c];
                    return (
                      <span key={c} className="flex flex-col items-start gap-1">
                        <CandidatoBadge candidato={c} tamanho="sm" />
                        <StatusChip dominio="categoria" status={p?.status ?? "sem_proposta_registrada"} />
                        <span className="text-xs text-gray-700">
                          {p?.proposta_ids.length ?? 0} proposta(s) associada(s)
                        </span>
                      </span>
                    );
                  })}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
