import type { Metadata } from "next";
import { QuizApp } from "@/features/quiz-teste/componentes/QuizApp";
import { getQuizDados } from "@/features/quiz-teste/dados";

/**
 * Versão 2 do Quiz Eleitoral (situações com dois caminhos), em teste: fora do
 * menu e sem indexação. O Quiz Eleitoral publicado continua em /quiz.
 */
export const metadata: Metadata = {
  title: "Quiz Eleitoral (versão de teste)",
  description: "Versão de teste do Quiz Eleitoral apartidário.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function QuizTestePage() {
  return (
    <div>
      <p className="mb-4">
        <span className="inline-block rounded-full border border-gray-700 bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-900">
          Versão de teste
        </span>
      </p>
      <QuizApp dados={getQuizDados()} />
    </div>
  );
}
