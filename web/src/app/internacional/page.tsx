import type { Metadata } from "next";
import Link from "next/link";
import { CandidatoBadge } from "@/components/CandidatoBadge";
import { Legendas } from "@/components/Legenda";
import { QuantidadePropostas } from "@/components/QuantidadePropostas";
import { ORDEM_CANDIDATOS } from "@/lib/candidatos";
import { getSinteseRi } from "@/lib/data/ri";
import { slugify } from "@/lib/slug";
import { textoLegivel } from "@/lib/data/texto";

export const metadata: Metadata = {
  title: "Internacional",
  description:
    "Propostas com impacto internacional, leituras de três vieses e cenários ligados a fatos oficiais.",
};

const NOTAS = [
  "Os temas são comuns aos dois candidatos; um candidato aparece com \"Sem proposta registrada\" apenas quando não tem nenhuma proposta no tema.",
  "Consenso reúne pontos em que as três leituras convergem; convergência parcial, pontos em que duas convergem e a terceira não se manifestou; divergência mostra a posição de cada leitura.",
  "Cenários equivalentes de leituras diferentes foram agrupados; cada leitura mantém sua cadeia, seu horizonte e seu nível de confiança.",
  "O comparativo é descritivo: não há vencedor nem nota. O que um plano não traz aparece apenas pela lista comum de itens de agenda.",
  "O mesmo critério de detalhamento vale para os dois candidatos: críticas por falta de metas, prazos ou recursos são registradas para os dois quando se aplicam.",
];

export default function InternacionalIndex() {
  const s = getSinteseRi();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Relações internacionais</h1>
        <p className="mt-2 max-w-3xl text-gray-800">
          As propostas com impacto internacional foram agrupadas em {s.categorias.length} temas
          comuns aos dois candidatos. Cada tema traz as leituras dos três vieses e cenários de
          possíveis consequências, sempre na cadeia proposta citada → fato oficial (com link da
          fonte) → consequência, com horizonte e nível de confiança.
        </p>
      </header>
      <Legendas />
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {s.categorias.map((t) => (
          <li key={t.categoria}>
            <Link
              href={`/internacional/${slugify(t.categoria)}`}
              className="block h-full rounded-lg border border-gray-300 bg-white p-4 hover:border-gray-500 hover:bg-gray-50"
            >
              <span className="block text-lg font-semibold text-gray-900">{t.categoria}</span>
              <span className="mt-1 block text-xs text-gray-700">{textoLegivel(t.escopo)}</span>
              <span className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {ORDEM_CANDIDATOS.map((c) => (
                  <span key={c} className="flex flex-col items-start gap-2.5">
                    <CandidatoBadge candidato={c} tamanho="sm" />
                    <QuantidadePropostas quantidade={t.por_candidato[c].proposta_ids.length} status={t.por_candidato[c].status} />
                  </span>
                ))}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <section aria-labelledby="notas-ri" className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h2 id="notas-ri" className="font-semibold text-gray-900">
          Como ler esta seção
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-800">
          {NOTAS.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
