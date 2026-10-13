import type { Metadata } from "next";
import { QuizApp } from "@/features/quiz-v3/componentes/QuizApp";
import { getQuizDados } from "@/features/quiz-v3/dados";

/**
 * Versão 3 do Quiz Eleitoral, em teste: os mesmos dados da versão 2, com resposta numa escala
 * de 5 posições. Fora dos buscadores; as respostas da pessoa nunca saem do navegador.
 */
export const metadata: Metadata = {
  title: "Quiz Eleitoral (versão de teste)",
  description:
    "Versão de teste do quiz apartidário de afinidade com as propostas dos planos de governo registrados no TSE pelos candidatos do 2º turno.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function QuizTestePage() {
  return (
    <QuizApp
      dados={getQuizDados()}
      selo={
        <p className="inline-block rounded-full border border-amber-700 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-900">
          Versão de teste
        </p>
      }
    />
  );
}
