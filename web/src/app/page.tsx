import Link from "next/link";
import { CandidatoBadge } from "@/components/CandidatoBadge";
import { FonteLink } from "@/components/FonteLink";
import { ParCandidatos } from "@/components/ParCandidatos";
import { pdfPlano } from "@/lib/candidatos";
import { getRegistro } from "@/lib/data/propostas";
import { GraficoComparado } from "@/components/analise/GraficoComparado";
import { contagemPorCategoria } from "@/lib/data/contagem";
import { getQuizDados } from "@/features/quiz/dados";

const ATALHOS = [
  {
    href: "/comparativo",
    titulo: "Comparativo por categoria",
    texto: "As propostas dos dois planos nas 16 categorias, com as leituras de três vieses lado a lado.",
  },
  {
    href: "/candidatos",
    titulo: "Candidatos",
    texto: "Dossiê de cada candidato: formação, cargos, processos e consultas, com fontes oficiais.",
  },
  {
    href: "/internacional",
    titulo: "Internacional",
    texto: "Propostas com impacto internacional e cenários ligados a fatos oficiais.",
  },
  {
    href: "/eleicao",
    titulo: "Apuração",
    texto: "Resultados oficiais do TSE por Brasil, estado, município e exterior.",
  },
  {
    href: "/metodologia",
    titulo: "Metodologia",
    texto: "Fontes, método de análise, critérios de neutralidade e lacunas.",
  },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-10">
      <section aria-labelledby="titulo-home">
        <h1 id="titulo-home" className="text-2xl font-bold text-gray-900 md:text-3xl">
          Propostas do 2º turno da eleição presidencial de 2026
        </h1>
        <p className="mt-3 max-w-3xl text-gray-800 lg:text-lg lg:leading-relaxed">
          Este site reúne e organiza as propostas dos planos de governo registrados no Tribunal
          Superior Eleitoral (TSE) pelos dois candidatos do 2º turno. Toda informação exibida
          indica sua fonte: trechos dos planos levam à página do PDF oficial; dados de histórico e
          de contexto internacional levam ao documento de origem.
        </p>
        <p className="mt-3 max-w-3xl text-gray-800 lg:text-lg lg:leading-relaxed">
          As análises interpretativas aparecem sempre em três leituras identificadas — de
          esquerda, de centro e de direita — exibidas lado a lado. O site não indica voto nem
          atribui nota aos candidatos.
        </p>
      </section>
      <ChamadaQuiz total={getQuizDados().perguntas.length} />
      </div>

      <section aria-labelledby="titulo-candidatos">
        <h2 id="titulo-candidatos" className="text-xl font-bold text-gray-900">
          Candidatos
        </h2>
        <p className="mt-1 text-sm text-gray-700">Ordem fixa pelo número de urna.</p>
        <div className="mt-3">
          <ParCandidatos
            comCabecalho={false}
            render={(c) => {
              const r = getRegistro(c);
              const fonte = r.fontes[0];
              return (
                <div className="space-y-2 text-sm">
                  <CandidatoBadge candidato={c} tamanho="lg" />
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                    <dt className="font-medium text-gray-700">Nome completo</dt>
                    <dd>{r.nome_completo}</dd>
                    <dt className="font-medium text-gray-700">Número</dt>
                    <dd>{r.numero_urna}</dd>
                    <dt className="font-medium text-gray-700">Partido</dt>
                    <dd>{r.partido}</dd>
                    <dt className="font-medium text-gray-700">Coligação</dt>
                    <dd>{r.coligacao}</dd>
                  </dl>
                  <div className="flex flex-col gap-1">
                    <FonteLink href={pdfPlano(c)} tipo="pdf">
                      Plano de governo registrado no TSE ({fonte?.num_paginas} páginas)
                    </FonteLink>
                    {fonte ? (
                      <FonteLink href={fonte.pagina_origem} tipo="oficial">
                        Portal de Dados Abertos do TSE
                      </FonteLink>
                    ) : null}
                  </div>
                  <Link
                    href={`/candidatos/${c}`}
                    className="inline-block font-medium text-blue-800 underline underline-offset-2"
                  >
                    Ver dossiê do candidato
                  </Link>
                </div>
              );
            }}
          />
        </div>
      </section>

      <section aria-labelledby="titulo-grafico">
        <h2 id="titulo-grafico" className="text-xl font-bold text-gray-900">
          Propostas por categoria
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-gray-700">
          Quantidade de propostas de cada plano associadas a cada uma das 16 categorias (como
          categoria principal ou secundária), a mesma contagem exibida no Comparativo. Cada barra
          mostra a divisão entre os dois planos, com o número de propostas de cada um. A quantidade não mede qualidade nem detalhamento das propostas.
        </p>
        <div className="mt-3">
          <GraficoComparado lula={contagemPorCategoria("lula")} flavio={contagemPorCategoria("flavio")} />
        </div>
      </section>

      <section aria-labelledby="titulo-atalhos">
        <h2 id="titulo-atalhos" className="text-xl font-bold text-gray-900">
          Navegue
        </h2>
        <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ATALHOS.map((a) => (
            <li key={a.href}>
              <Link
                href={a.href}
                className="block h-full rounded-lg border border-gray-300 bg-white p-4 hover:border-gray-500 hover:bg-gray-50"
              >
                <span className="block font-semibold text-gray-900">{a.titulo}</span>
                <span className="mt-1 block text-sm text-gray-700">{a.texto}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** Chamada para o quiz (coluna direita da primeira seção). */
function ChamadaQuiz({ total }: { total: number }) {
  return (
    <aside
      aria-labelledby="titulo-chamada-quiz"
      className="rounded-xl border-2 border-destaque bg-destaque-fundo p-5 shadow-sm"
    >
      <p className="inline-block rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-destaque ring-1 ring-destaque">
        Quiz apartidário
      </p>
      <h2 id="titulo-chamada-quiz" className="mt-3 text-xl font-bold leading-snug text-gray-900">
        Com quais propostas você mais se identifica?
      </h2>
      <p className="mt-2 text-sm text-gray-800">
        Diga se concorda ou discorda de {total} afirmações sobre economia, segurança, educação,
        meio ambiente e outros temas. No fim, veja sua afinidade com as propostas escritas em cada
        plano de governo, com o trecho e a página de cada uma.
      </p>
      <Link
        href="/quiz"
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-destaque px-5 py-2 text-base font-semibold text-white shadow-sm hover:bg-destaque-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque"
      >
        Fazer o Quiz Eleitoral
      </Link>
      <ul className="mt-4 space-y-1.5 text-xs text-gray-700">
        <li>
          <strong className="text-gray-900">Apartidário:</strong> afirmações neutras, revisadas por
          leituras de esquerda, de centro e de direita; a posição de cada candidato vem de trecho
          literal do plano.
        </li>
        <li>
          <strong className="text-gray-900">Não é recomendação de voto:</strong> o resultado mede
          afinidade com propostas, não com pessoas ou partidos.
        </li>
        <li>
          <strong className="text-gray-900">Privado:</strong> suas respostas ficam só no seu
          navegador e não são armazenadas nem enviadas.
        </li>
      </ul>
    </aside>
  );
}
