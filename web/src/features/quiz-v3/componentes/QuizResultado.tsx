"use client";

import { useEffect, useRef } from "react";
import type { CandidatoId } from "@/types/comum";
import { CANDIDATOS_ORDEM } from "@/types/comum";
import { CandidatoBadge } from "@/components/CandidatoBadge";
import { CANDIDATOS } from "@/lib/candidatos";
import { CORES_CANDIDATOS } from "@/lib/cores";
import type { Afinidade, ResultadoQuiz } from "../calculo";
import { ListaPropostas } from "./ListaPropostas";
import { ListaSemOpiniao } from "./ListaSemOpiniao";

function textoBase(n: number): string {
  return n === 1 ? "baseado em 1 pergunta" : `baseado em ${n} perguntas`;
}

function CartaoAfinidade({ c, a }: { c: CandidatoId; a: Afinidade }) {
  const cor = CORES_CANDIDATOS[c];
  return (
    <div className="rounded-lg border-2 p-4" style={{ borderColor: cor.borda, backgroundColor: cor.fundo }}>
      <CandidatoBadge candidato={c} tamanho="lg" />
      {a.percentual === null ? (
        <p className="mt-3 text-base text-gray-800">
          Sem base de cálculo: nenhuma das situações em que você respondeu para um dos caminhos trata de proposta
          registrada no plano deste candidato.
        </p>
      ) : (
        <>
          <p className="mt-3 text-4xl font-bold" style={{ color: cor.base }}>
            {a.percentual}%
            <span className="sr-only"> de afinidade com as propostas de {CANDIDATOS[c].nome}</span>
          </p>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-white" aria-hidden="true">
            <div
              className="h-full rounded-full"
              style={{ width: `${a.percentual}%`, backgroundColor: cor.preenchimento }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-800">de afinidade com as propostas, {textoBase(a.base)}</p>
        </>
      )}
    </div>
  );
}

function CelulaCategoria({ a }: { a: Afinidade | undefined }) {
  if (!a || a.percentual === null) {
    return <span className="text-gray-700">Sem proposta registrada</span>;
  }
  return (
    <>
      <span className="font-semibold">{a.percentual}%</span>{" "}
      <span className="text-gray-700">({a.base === 1 ? "1 pergunta" : `${a.base} perguntas`})</span>
    </>
  );
}

export interface QuizResultadoProps {
  resultado: ResultadoQuiz;
  onRefazer: () => void;
  onRever: () => void;
}

/** Resultado: afinidade geral, por categoria e as propostas correspondentes, com o mesmo destaque para os dois. */
export function QuizResultado({ resultado, onRefazer, onRever }: QuizResultadoProps) {
  const titulo = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    titulo.current?.focus();
  }, []);
  const { respondidas, semOpiniao, categorias, porCandidato } = resultado;
  const nSemOpiniao = semOpiniao.length;

  return (
    <section aria-labelledby="quiz-resultado" className="mx-auto max-w-5xl">
      <h1 id="quiz-resultado" ref={titulo} tabIndex={-1} className="text-2xl font-bold text-gray-900 outline-none sm:text-3xl">
        Sua afinidade com as propostas dos planos
      </h1>
      <p className="mt-2 text-base text-gray-800">
        Você respondeu para um dos caminhos em {respondidas} {respondidas === 1 ? "situação" : "situações"}
        {nSemOpiniao > 0
          ? ` e respondeu que não tem opinião formada em ${nSemOpiniao} (fora do cálculo)`
          : ""}
        . Em cada situação, o plano que corresponde ao caminho da sua resposta recebe 1 ponto se você
        respondeu &quot;totalmente&quot; e meio ponto se respondeu &quot;mais para&quot;; o plano do outro
        caminho não recebe ponto. A afinidade é a média desses pontos (perguntas marcadas como importantes
        valem o dobro). Situações em que o plano não tem proposta registrada ficam fora do cálculo daquele
        candidato.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {CANDIDATOS_ORDEM.map((c) => (
          <CartaoAfinidade key={c} c={c} a={porCandidato[c].geral} />
        ))}
      </div>

      {categorias.length > 0 ? (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900">Afinidade por categoria</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">Afinidade por categoria e candidato</caption>
              <thead>
                <tr className="border-b border-gray-400">
                  <th scope="col" className="py-2 pr-2 font-semibold">Categoria</th>
                  {CANDIDATOS_ORDEM.map((c) => (
                    <th key={c} scope="col" className="px-2 py-2 font-semibold">
                      <CandidatoBadge candidato={c} tamanho="sm" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categorias.map((cat) => (
                  <tr key={cat} className="border-b border-gray-200">
                    <th scope="row" className="py-2 pr-2 font-medium text-gray-900">{cat}</th>
                    {CANDIDATOS_ORDEM.map((c) => (
                      <td key={c} className="px-2 py-2">
                        <CelulaCategoria a={porCandidato[c].porCategoria[cat]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900">Caminhos de cada plano nas suas respostas</h2>
        <p className="mt-1 text-sm text-gray-700">
          Cada item traz a situação, o caminho que corresponde ao plano, a sua resposta, a pontuação, o trecho citado do
          plano de governo com o link para a página do documento oficial e a página do comparativo da
          categoria.
        </p>
        <div className="mt-4 grid items-start gap-4 md:grid-cols-2">
          {CANDIDATOS_ORDEM.map((c) => (
            <ListaPropostas key={c} c={c} r={porCandidato[c]} />
          ))}
        </div>
      </div>

      <ListaSemOpiniao perguntas={semOpiniao} />

      <p className="mt-8 rounded-md border border-gray-400 bg-gray-50 px-4 py-3 text-base font-medium text-gray-900">
        Este resultado mede afinidade com propostas escritas nos planos; não substitui a leitura dos planos
        completos.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onRever}
          className="min-h-11 rounded-md border border-gray-400 bg-white px-4 py-2 text-base font-medium text-gray-900 hover:bg-gray-50"
        >
          Rever minhas respostas
        </button>
        <button
          type="button"
          onClick={onRefazer}
          className="min-h-11 rounded-md bg-gray-900 px-5 py-2 text-base font-semibold text-white hover:bg-gray-800"
        >
          Refazer o quiz
        </button>
      </div>
    </section>
  );
}
