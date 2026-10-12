import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CabecalhoDossie, ListaAfirmacoes, Vazio } from "@/components/rh/Dossie";
import { FontesRh } from "@/components/rh/FontesRh";
import { FontesDossieSobDemanda } from "@/components/sobDemanda/FontesDossieSobDemanda";
import { Secao } from "@/components/Secao";
import { CANDIDATOS, ORDEM_CANDIDATOS, isCandidatoId } from "@/lib/candidatos";
import { fontesRhPorId, getDossie } from "@/lib/data/rh";
import { formatarData } from "@/lib/rotulos";
import { textoLegivel } from "@/lib/data/texto";

export function generateStaticParams() {
  return ORDEM_CANDIDATOS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/candidatos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  return { title: isCandidatoId(slug) ? `${CANDIDATOS[slug].nome} — dossiê: trajetória` : "Candidato" };
}

/** Dossiê, parte 1: formação, trajetória, cargos, atuação, declarações, consultas, lacunas e fontes. */
export default async function CandidatoPage({ params }: PageProps<"/candidatos/[slug]">) {
  const { slug } = await params;
  if (!isCandidatoId(slug)) notFound();
  const d = getDossie(slug);
  const fontes = fontesRhPorId(slug);
  const s = d.secoes;

  return (
    <div className="space-y-10">
      <CabecalhoDossie candidato={slug} aba="perfil" />

      <Secao id="formacao" titulo="Formação">
        <ListaAfirmacoes itens={s.formacao} fontes={fontes} />
      </Secao>
      <Secao id="trajetoria" titulo="Trajetória profissional">
        <ListaAfirmacoes itens={s.trajetoria_profissional} fontes={fontes} />
      </Secao>
      <Secao id="cargos" titulo="Cargos e mandatos">
        {s.cargos_e_mandatos.length ? (
          <ul className="space-y-3">
            {s.cargos_e_mandatos.map((c, i) => (
              <li key={i} className="cartao">
                <p className="font-semibold text-gray-900">{textoLegivel(c.cargo)}</p>
                <p className="meta">
                  {formatarData(c.inicio)} — {c.fim ? formatarData(c.fim) : "em exercício ou sem data de término"} ·{" "}
                  {textoLegivel(c.como_obteve)}
                </p>
                <FontesRh ids={c.fonte_ids} fontes={fontes} />
              </li>
            ))}
          </ul>
        ) : (
          <Vazio />
        )}
      </Secao>
      <Secao id="atuacao" titulo="Atuação parlamentar e executiva">
        <ListaAfirmacoes itens={s.atuacao_parlamentar_e_executiva} fontes={fontes} />
      </Secao>
      <Secao id="declaracoes" titulo="Declarações ao TSE">
        <ListaAfirmacoes itens={s.declaracoes_tse} fontes={fontes} />
      </Secao>
      <Secao
        id="consultas"
        titulo="Consultas sem registro"
        descricao="Consultas a órgãos oficiais que não retornaram registro em nome do candidato."
      >
        {s.consultas_sem_registro.length ? (
          <ul className="space-y-3">
            {s.consultas_sem_registro.map((c, i) => (
              <li key={i} className="cartao">
                <p className="font-medium text-gray-900">{textoLegivel(c.consulta)}</p>
                <p className="meta">
                  {textoLegivel(c.orgao)} · consulta: {formatarData(c.data_consulta)} · resultado: {textoLegivel(c.resultado)}
                </p>
                <FontesRh ids={c.fonte_ids} fontes={fontes} />
              </li>
            ))}
          </ul>
        ) : (
          <Vazio />
        )}
      </Secao>
      <Secao
        id="lacunas"
        titulo="Lacunas"
        descricao="Informações que não puderam ser obtidas ou confirmadas em fonte oficial, e o motivo."
      >
        {s.lacunas.length ? (
          <ul className="space-y-2">
            {s.lacunas.map((l, i) => (
              <li key={i} className="caixa bg-gray-50 text-sm">
                <p className="font-medium text-gray-900">{textoLegivel(l.tema)}</p>
                <p className="text-gray-800">{textoLegivel(l.motivo)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <Vazio />
        )}
      </Secao>
      <Secao id="fontes" titulo="Todas as fontes do dossiê">
        <FontesDossieSobDemanda
          candidato={slug}
          nOficiais={d.fontes.filter((f) => f.tipo !== "reportagem").length}
          nReportagens={d.fontes.filter((f) => f.tipo === "reportagem").length}
        />
      </Secao>
    </div>
  );
}
