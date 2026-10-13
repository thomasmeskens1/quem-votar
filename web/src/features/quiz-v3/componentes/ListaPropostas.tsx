import Link from "next/link";
import type { CandidatoId } from "@/types/comum";
import { CandidatoBadge } from "@/components/CandidatoBadge";
import { PdfPaginaLink } from "@/components/PdfPaginaLink";
import { CANDIDATOS } from "@/lib/candidatos";
import { CORES_CANDIDATOS } from "@/lib/cores";
import type { ItemResultado, ResultadoCandidato } from "../calculo";
import type { CitacaoView, PerguntaView } from "../tipos";

export function LinkComparativo({ p }: { p: PerguntaView }) {
  return (
    <Link href={`/comparativo/${p.categoriaSlug}`} prefetch={false} className="lk text-sm">
      Comparativo de {p.categoria}
    </Link>
  );
}

/** Trechos citados do plano, com link para a página do documento oficial. */
export function Citacoes({ c, citacoes }: { c: CandidatoId; citacoes: CitacaoView[] }) {
  return (
    <>
      {citacoes.map((cit) => (
        <figure key={`${cit.propostaId}-${cit.texto.slice(0, 20)}`} className="mt-2">
          <blockquote
            className="border-l-4 pl-3 text-sm italic text-gray-800"
            style={{ borderColor: CORES_CANDIDATOS[c].borda }}
          >
            &ldquo;{cit.texto}&rdquo;
          </blockquote>
          {cit.pagina ? (
            <figcaption className="mt-1 pl-4 text-sm">
              <PdfPaginaLink candidato={c} pagina={cit.pagina} paginaFim={cit.paginaFim ?? undefined} />
            </figcaption>
          ) : null}
        </figure>
      ))}
    </>
  );
}

function textoPontos(pontos: number): string {
  if (pontos === 1) return "1 ponto";
  if (pontos === 0.5) return "meio ponto";
  return "nenhum ponto";
}

function ItemSituacao({ c, item }: { c: CandidatoId; item: ItemResultado }) {
  const { pergunta: p } = item;
  const mesmo = item.caminho === item.caminhoDoPlano;
  const resposta = mesmo
    ? item.intensidade === "totalmente"
      ? `Totalmente o caminho do plano (caminho ${item.caminho})`
      : `Mais para o caminho do plano (caminho ${item.caminho})`
    : item.intensidade === "totalmente"
      ? `Totalmente o outro caminho (caminho ${item.caminho}): ${p.opcoes[item.caminho]}`
      : `Mais para o outro caminho (caminho ${item.caminho}): ${p.opcoes[item.caminho]}`;
  return (
    <li className="rounded-md border border-gray-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">{p.categoria}</p>
      <p className="mt-1 font-medium text-gray-900">{p.situacao}</p>
      <dl className="mt-2 space-y-1 text-sm text-gray-800">
        <div>
          <dt className="inline font-semibold">Caminho do plano (caminho {item.caminhoDoPlano}):</dt>{" "}
          <dd className="inline">{p.opcoes[item.caminhoDoPlano]}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Sua resposta:</dt>{" "}
          <dd className="inline">
            {resposta}
            {item.importante ? " · Importante para mim" : ""}
          </dd>
        </div>
        <div>
          <dt className="inline font-semibold">Pontuação:</dt>{" "}
          <dd className="inline">
            {textoPontos(item.pontos)}
            {item.importante && item.pontos > 0 ? " (vale o dobro)" : ""}
          </dd>
        </div>
      </dl>
      <Citacoes c={c} citacoes={p.posicoes[c].citacoes} />
      <p className="mt-2">
        <LinkComparativo p={p} />
      </p>
    </li>
  );
}

function Grupo({
  titulo,
  c,
  itens,
  vazio,
}: {
  titulo: string;
  c: CandidatoId;
  itens: ItemResultado[];
  vazio: string;
}) {
  return (
    <div className="mt-4">
      <h4 className="text-base font-semibold text-gray-900">
        {titulo} ({itens.length})
      </h4>
      {itens.length === 0 ? (
        <p className="mt-1 text-sm text-gray-700">{vazio}</p>
      ) : (
        <ul className="mt-2 space-y-3">
          {itens.map((i) => (
            <ItemSituacao key={i.pergunta.id} c={c} item={i} />
          ))}
        </ul>
      )}
    </div>
  );
}

/** Situações em que a pessoa respondeu para o caminho do plano ou para o outro caminho, para um candidato. */
export function ListaPropostas({ c, r }: { c: CandidatoId; r: ResultadoCandidato }) {
  const cor = CORES_CANDIDATOS[c];
  return (
    <section
      aria-label={`Propostas: ${CANDIDATOS[c].nome}`}
      className="rounded-lg border-2 p-3 sm:p-4"
      style={{ borderColor: cor.borda, backgroundColor: cor.fundo }}
    >
      <h3>
        <CandidatoBadge candidato={c} tamanho="lg" />
      </h3>
      <Grupo
        titulo="Situações em que você escolheu o caminho do plano"
        c={c}
        itens={r.mesmoCaminho}
        vazio="Nenhuma entre as perguntas respondidas."
      />
      <Grupo
        titulo="Situações em que você escolheu o outro caminho"
        c={c}
        itens={r.outroCaminho}
        vazio="Nenhuma entre as perguntas respondidas."
      />

      <div className="mt-4">
        <h4 className="text-base font-semibold text-gray-900">
          Sem proposta registrada ({r.semProposta.length})
        </h4>
        <p className="mt-1 text-sm text-gray-700">
          O plano não trata do tema destas situações. Elas ficam fora do cálculo deste candidato.
        </p>
        {r.semProposta.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {r.semProposta.map((p) => (
              <li key={p.id} className="rounded-md border border-dashed border-gray-400 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">{p.categoria}</p>
                <p className="mt-1 text-gray-900">{p.situacao}</p>
                <p className="mt-1 text-sm font-medium text-gray-700">Sem proposta registrada</p>
                <p className="mt-1">
                  <LinkComparativo p={p} />
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
