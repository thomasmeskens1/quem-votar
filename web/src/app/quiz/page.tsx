import type { Metadata } from "next";
import { QuizApp } from "@/features/quiz/componentes/QuizApp";
import { getQuizDados } from "@/features/quiz/dados";

/**
 * Quiz de afinidade (diretriz 18) — versão de teste, fora do menu e sem indexação.
 * Os dados públicos das perguntas são embutidos no HTML no build; as respostas
 * da pessoa nunca saem do navegador.
 */
export const metadata: Metadata = {
  title: "Quiz de afinidade (versão de teste)",
  description: "Quiz de afinidade com as propostas dos planos de governo registrados no TSE.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function QuizPage() {
  const dados = getQuizDados();
  return (
    <div>
      <p className="mb-4">
        <span className="inline-block rounded-full border border-gray-700 bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-900">
          Versão de teste
        </span>
      </p>
      <QuizApp dados={dados} />
    </div>
  );
}
