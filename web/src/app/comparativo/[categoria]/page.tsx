import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CandidatoId, Vies } from "@/types";
import { VIESES_ORDEM } from "@/types/comum";
import { AgendaTabela, type LinhaAgenda } from "@/components/analise/AgendaTabela";
import { ComparativoLista } from "@/components/analise/ComparativoLista";
import { ConsensoDivergencias } from "@/components/analise/ConsensoDivergencias";
import { LeiturasVieses, type SelecaoAnalise } from "@/components/analise/LeiturasVieses";
import { PropostasLista } from "@/components/analise/PropostasLista";
import { CandidatoBadge } from "@/components/CandidatoBadge";
import { Legendas } from "@/components/Legenda";
import { ParCandidatos } from "@/components/ParCandidatos";
import { Secao } from "@/components/Secao";
import { SemProposta } from "@/components/SemProposta";
import { StatusChip } from "@/components/StatusChip";
import { ORDEM_CANDIDATOS } from "@/lib/candidatos";
import { categoriaPorSlug, getCategorias } from "@/lib/data/categorias";
import { criterioAgenda } from "@/lib/data/agenda";
import { getAnaliseRp, getCategoriaRp } from "@/lib/data/rp";
import { slugify } from "@/lib/slug";

export function generateStaticParams() {
  return getCategorias().map((c) => ({ categoria: slugify(c.nome) }));
}

export async function generateMetadata({
  params,
}: PageProps<"/comparativo/[categoria]">): Promise<Metadata> {
  const { categoria } = await params;
  const cat = categoriaPorSlug(categoria);
  return { title: cat ? `${cat.nome} — comparativo` : "Comparativo" };
}

function selecoes(c: CandidatoId, categoria: string) {
  const r: Partial<Record<Vies, SelecaoAnalise | null>> = {};
  for (const v of VIESES_ORDEM) {
    const a = getAnaliseRp(v, c, categoria);
    r[v] = a ? { categoria, nPros: a.pros.length, nContras: a.contras.length } : null;
  }
  return r;
}

export default async function CategoriaPage({ params }: PageProps<"/comparativo/[categoria]">) {
  const { categoria } = await params;
  const cat = categoriaPorSlug(categoria);
  if (!cat) notFound();
  const rp = getCategoriaRp(cat.nome);

  const agenda = new Map<string, LinhaAgenda>();
  for (const c of ORDEM_CANDIDATOS) {
    for (const it of rp?.por_candidato[c]?.itens_agenda ?? []) {
      const l = agenda.get(it.id) ?? {
        id: it.id,
        item: it.item,
        vies_origem: it.vies_origem,
        criterio: criterioAgenda(it.id),
        por_candidato: {},
      };
      l.por_candidato[c] = { status: it.status, ids: it.ids };
      agenda.set(it.id, l);
    }
  }

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-sm">
          <Link href="/comparativo" className="text-blue-800 underline underline-offset-2">
            Comparativo
          </Link>{" "}
          <span aria-hidden="true">/</span> {cat.nome}
        </p>
        <h1 className="text-2xl font-bold text-gray-900">{cat.nome}</h1>
        <div className="max-w-3xl text-sm text-gray-800">
          <p>
            <span className="font-medium">Inclui:</span> {cat.inclui.join("; ")}.
          </p>
          {cat.exclui.length ? (
            <p className="mt-1">
              <span className="font-medium">Não inclui:</span> {cat.exclui.join("; ")}.
            </p>
          ) : null}
        </div>
        <Legendas />
        <nav aria-label="Seções desta página" className="text-sm">
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-blue-800 underline underline-offset-2">
            <li><a href="#propostas">Propostas</a></li>
            <li><a href="#leituras">Leituras por viés</a></li>
            <li><a href="#consensos">Consensos e divergências</a></li>
            <li><a href="#comparativo">Comparativo</a></li>
            <li><a href="#agenda">Lista comum de agenda</a></li>
          </ul>
        </nav>
      </header>

      {!rp ? (
        <p className="text-gray-800">A síntese desta categoria ainda não está disponível.</p>
      ) : (
        <>
          <Secao
            id="propostas"
            titulo="Propostas"
            descricao="Trechos literais dos planos de governo, com link para a página do PDF registrado no TSE."
          >
            <ParCandidatos
              idPrefixo="propostas"
              render={(c) => {
                const p = rp.por_candidato[c];
                if (!p || p.status === "sem_proposta_registrada" || !p.proposta_ids.length) {
                  return <SemProposta />;
                }
                return (
                  <div className="space-y-3">
                    <StatusChip dominio="categoria" status={p.status} comDescricao />
                    <PropostasLista candidato={c} ids={p.proposta_ids} categoria={cat.nome} />
                  </div>
                );
              }}
            />
          </Secao>

          <Secao
            id="leituras"
            titulo="Leituras por viés"
            descricao="Cada viés apenas interpreta os trechos citados do plano; nenhum acrescenta fatos (diretriz 9). As três leituras aparecem lado a lado."
          >
            <div className="space-y-6">
              {ORDEM_CANDIDATOS.map((c) => {
                const p = rp.por_candidato[c];
                return (
                  <div
                    key={c}
                    className={`cartao bt-${c}`}
                  >
                    <h3 className="mb-3">
                      <CandidatoBadge candidato={c} />
                    </h3>
                    {!p || p.status === "sem_proposta_registrada" ? (
                      <SemProposta />
                    ) : (
                      <LeiturasVieses
                        leituras={p.leituras}
                        candidato={c}
                        origem="rp"
                        selecoes={selecoes(c, cat.nome)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </Secao>

          <Secao
            id="consensos"
            titulo="Consensos e divergências"
            descricao="Consenso: ponto em que os três vieses convergem. Divergência: posição de cada viés sobre o mesmo ponto."
          >
            <ParCandidatos
              render={(c) => {
                const p = rp.por_candidato[c];
                if (!p || p.status === "sem_proposta_registrada") return <SemProposta />;
                return (
                  <ConsensoDivergencias
                    consenso={p.consenso}
                    divergencias={p.divergencias}
                    candidato={c}
                    origem="rp"
                    categoria={cat.nome}
                  />
                );
              }}
            />
          </Secao>

          <Secao
            id="comparativo"
            titulo="Comparativo entre os planos"
            descricao="Descritivo: não há vencedor nem nota."
          >
            <ComparativoLista
              aproximacoes={rp.comparativo.aproximacoes}
              diferencas={rp.comparativo.diferencas}
            />
            {rp.observacao_simetria ? (
              <p className="mt-3 rounded border border-gray-200 bg-gray-50 p-3 text-xs text-gray-800">
                <span className="font-semibold">Nota de simetria da síntese:</span>{" "}
                {rp.observacao_simetria}
              </p>
            ) : null}
          </Secao>

          <Secao
            id="agenda"
            titulo="Lista comum de itens de agenda"
            descricao="O que cada plano traz ou não traz é apresentado somente por esta lista comum, com itens derivados igualmente das prioridades dos três vieses e aplicados da mesma forma aos dois candidatos (diretriz 12)."
          >
            <AgendaTabela linhas={[...agenda.values()]} />
          </Secao>
        </>
      )}
    </div>
  );
}
