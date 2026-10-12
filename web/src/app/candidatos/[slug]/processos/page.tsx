import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CabecalhoDossie, Vazio } from "@/components/rh/Dossie";
import { AvisoReportagem, FontesRh } from "@/components/rh/FontesRh";
import { ProcessoCard } from "@/components/rh/ProcessoCard";
import { Secao } from "@/components/Secao";
import { CANDIDATOS, ORDEM_CANDIDATOS, isCandidatoId } from "@/lib/candidatos";
import { fontesRhPorId, getDossie } from "@/lib/data/rh";
import { textoLegivel } from "@/lib/data/texto";

export function generateStaticParams() {
  return ORDEM_CANDIDATOS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/candidatos/[slug]/processos">): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: isCandidatoId(slug) ? `${CANDIDATOS[slug].nome} — dossiê: processos e ações` : "Candidato",
  };
}

/** Dossiê, parte 2: processos e investigações, ações cíveis e reportagens. */
export default async function ProcessosPage({ params }: PageProps<"/candidatos/[slug]/processos">) {
  const { slug } = await params;
  if (!isCandidatoId(slug)) notFound();
  const d = getDossie(slug);
  const fontes = fontesRhPorId(slug);
  const s = d.secoes;

  return (
    <div className="space-y-10">
      <CabecalhoDossie candidato={slug} aba="processos" />

      <Secao
        id="processos"
        titulo="Processos e investigações"
        descricao="Situação em linguagem clara, com o texto literal da fonte quando disponível. O histórico mostra a origem de cada registro."
      >
        {s.processos_e_investigacoes.length ? (
          <div className="space-y-4">
            {s.processos_e_investigacoes.map((p, i) => (
              <ProcessoCard
                key={i}
                processo={p}
                fontes={fontes}
                candidato={slug}
                secao="processos_e_investigacoes"
                indice={i}
              />
            ))}
          </div>
        ) : (
          <Vazio />
        )}
      </Secao>
      <Secao id="civeis" titulo="Ações cíveis">
        {s.acoes_civeis.length ? (
          <div className="space-y-4">
            {s.acoes_civeis.map((p, i) => (
              <ProcessoCard key={i} processo={p} fontes={fontes} candidato={slug} secao="acoes_civeis" indice={i} />
            ))}
          </div>
        ) : (
          <Vazio />
        )}
      </Secao>
      <Secao id="reportagens" titulo="Reportagens" descricao="Conteúdo de imprensa: não constitui fato comprovado.">
        {s.reportagens.length ? (
          <ul className="space-y-3">
            {s.reportagens.map((rep, i) => (
              <li key={i} className="cartao border-dashed border-gray-500">
                <p className="fila font-medium text-gray-900">
                  {textoLegivel(rep.tema)} <AvisoReportagem />
                </p>
                <p className="mt-1">{textoLegivel(rep.resumo_neutro)}</p>
                <FontesRh ids={rep.fonte_ids} fontes={fontes} />
              </li>
            ))}
          </ul>
        ) : (
          <Vazio />
        )}
      </Secao>
    </div>
  );
}
