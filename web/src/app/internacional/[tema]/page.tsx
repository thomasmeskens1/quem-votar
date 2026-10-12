import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CandidatoId, SinteseCandidatoRi, Vies } from "@/types";
import { AgendaTabela, type LinhaAgenda } from "@/components/analise/AgendaTabela";
import { CenarioCard } from "@/components/analise/CenarioCard";
import { ComparativoLista } from "@/components/analise/ComparativoLista";
import { ConsensoDivergencias } from "@/components/analise/ConsensoDivergencias";
import { LeiturasVieses, type SelecaoAnalise } from "@/components/analise/LeiturasVieses";
import { PropostasLista } from "@/components/analise/PropostasLista";
import { CandidatoBadge } from "@/components/CandidatoBadge";
import { Legendas } from "@/components/Legenda";
import { ParCandidatos } from "@/components/ParCandidatos";
import { Secao } from "@/components/Secao";
import { SemProposta } from "@/components/SemProposta";
import { QuantidadePropostas } from "@/components/QuantidadePropostas";
import { ORDEM_CANDIDATOS } from "@/lib/candidatos";
import { getAnaliseRiArquivo, getTemasRi, temaRiPorSlug } from "@/lib/data/ri";
import { slugify } from "@/lib/slug";
import { textoLegivel } from "@/lib/data/texto";

export function generateStaticParams() {
  return getTemasRi().map((t) => ({ tema: slugify(t.categoria) }));
}

export async function generateMetadata({
  params,
}: PageProps<"/internacional/[tema]">): Promise<Metadata> {
  const { tema } = await params;
  const t = temaRiPorSlug(tema);
  return { title: t ? `${t.categoria} — internacional` : "Internacional" };
}

function selecoes(c: CandidatoId, p: SinteseCandidatoRi) {
  const r: Partial<Record<Vies, SelecaoAnalise>> = {};
  for (const o of p.analises_origem ?? []) {
    const a = getAnaliseRiArquivo(o.vies, c).analises[o.indice_analise];
    if (!a) continue;
    const s = (r[o.vies] ??= { indices: [], nPros: 0, nContras: 0 });
    s.indices?.push(o.indice_analise);
    s.nPros += a.pros.length;
    s.nContras += a.contras.length;
  }
  return r;
}

function semProposta(p: SinteseCandidatoRi | undefined) {
  return !p || p.status === "sem_proposta_registrada";
}

export default async function TemaPage({ params }: PageProps<"/internacional/[tema]">) {
  const { tema } = await params;
  const t = temaRiPorSlug(tema);
  if (!t) notFound();
  const temaIdx = getTemasRi().indexOf(t);

  const linhas: LinhaAgenda[] = t.ausencias_checklist.map((i) => ({
    id: i.id,
    item: i.item,
    criterio: i.criterio,
    vies_origem: i.vies_origem,
    por_candidato: { lula: i.lula, flavio: i.flavio },
  }));

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-sm">
          <Link href="/internacional" className="text-blue-800 underline underline-offset-2">
            Internacional
          </Link>{" "}
          <span aria-hidden="true">/</span> {t.categoria}
        </p>
        <h1 className="text-2xl font-bold text-gray-900">{t.categoria}</h1>
        <p className="max-w-3xl text-sm text-gray-800">
          <span className="font-medium">Escopo:</span> {textoLegivel(t.escopo)}
        </p>
        <Legendas />
        <nav aria-label="Seções desta página" className="text-sm">
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-blue-800 underline underline-offset-2">
            <li><a href="#propostas">Propostas</a></li>
            <li><a href="#leituras">Leituras por viés</a></li>
            <li><a href="#consensos">Consensos e divergências</a></li>
            <li><a href="#cenarios">Cenários</a></li>
            <li><a href="#comparativo">Comparativo</a></li>
            <li><a href="#agenda">Lista comum de agenda</a></li>
          </ul>
        </nav>
      </header>

      <Secao id="propostas" titulo="Propostas" descricao="Trechos literais dos planos, com a página do PDF oficial.">
        <ParCandidatos
          render={(c) => {
            const p = t.por_candidato[c];
            if (semProposta(p) || !p.proposta_ids.length) return <SemProposta texto={p?.mensagem} />;
            return (
              <div className="space-y-3">
                <QuantidadePropostas quantidade={p.proposta_ids.length} status={p.status} />
                <PropostasLista candidato={c} ids={p.proposta_ids} />
              </div>
            );
          }}
        />
      </Secao>

      <Secao
        id="leituras"
        titulo="Leituras por viés"
        descricao="Cada viés apenas interpreta trechos citados; as três leituras aparecem lado a lado."
      >
        <div className="space-y-6">
          {ORDEM_CANDIDATOS.map((c) => {
            const p = t.por_candidato[c];
            return (
              <div
                key={c}
                className={`cartao bt-${c}`}
              >
                <h3 className="mb-3">
                  <CandidatoBadge candidato={c} />
                </h3>
                {semProposta(p) ? (
                  <SemProposta texto={p?.mensagem} />
                ) : (
                  <LeiturasVieses leituras={p.leituras} candidato={c} origem="ri" selecoes={selecoes(c, p)} />
                )}
              </div>
            );
          })}
        </div>
      </Secao>

      <Secao
        id="consensos"
        titulo="Consensos e divergências"
        descricao="Consenso: os três vieses convergem. Convergência parcial: dois vieses convergem e o terceiro não se manifestou. Divergência: posição de cada viés."
      >
        <ParCandidatos
          render={(c) => {
            const p = t.por_candidato[c];
            if (semProposta(p)) return <SemProposta texto={p?.mensagem} />;
            return (
              <ConsensoDivergencias
                consenso={p.consenso}
                convergencias={p.convergencias_parciais}
                divergencias={p.divergencias}
                candidato={c}
                origem="ri"
              />
            );
          }}
        />
      </Secao>

      <Secao
        id="cenarios"
        titulo="Cenários"
        descricao="Cada cenário liga uma proposta citada a um fato oficial (com link da fonte) e descreve uma consequência possível, com horizonte e nível de confiança atribuídos pelo analista de cada viés."
      >
        <ParCandidatos
          render={(c) => {
            const lista = t.cenarios
              .map((x, idx) => ({ x, idx }))
              .filter(({ x }) => x.candidato === c);
            if (semProposta(t.por_candidato[c])) return <SemProposta texto={t.por_candidato[c]?.mensagem} />;
            if (!lista.length) {
              return <p className="text-sm text-gray-700">Nenhum cenário registrado neste tema.</p>;
            }
            return (
              <div className="space-y-4">
                {lista.map(({ x, idx }) => (
                  <CenarioCard key={idx} cenario={x} candidato={c} temaIndice={temaIdx} cenarioIndice={idx} />
                ))}
              </div>
            );
          }}
        />
      </Secao>

      <Secao id="comparativo" titulo="Comparativo entre os planos" descricao="Descritivo: não há vencedor nem nota.">
        <ComparativoLista aproximacoes={t.comparativo.aproximacoes} diferencas={t.comparativo.diferencas} />
        {t.observacao_simetria ? (
          <p className="mt-3 rounded border border-gray-200 bg-gray-50 p-3 text-xs text-gray-800">
            <span className="font-semibold">Nota de simetria da síntese:</span> {textoLegivel(t.observacao_simetria)}
          </p>
        ) : null}
      </Secao>

      <Secao
        id="agenda"
        titulo="Lista comum de itens de agenda"
        descricao="Itens da lista comum aplicados igualmente aos dois planos."
      >
        <AgendaTabela linhas={linhas} />
      </Secao>
    </div>
  );
}
