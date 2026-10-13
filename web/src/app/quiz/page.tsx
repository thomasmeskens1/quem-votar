import type { Metadata } from "next";
import { QuizApp } from "@/features/quiz/componentes/QuizApp";
import { getQuizDados } from "@/features/quiz/dados";

/**
 * Quiz Eleitoral de afinidade (diretriz 18). Os dados públicos das perguntas
 * são embutidos no HTML no build; as respostas da pessoa nunca saem do navegador.
 */
export const metadata: Metadata = {
  title: "Quiz Eleitoral",
  description:
    "Quiz apartidário de afinidade com as propostas dos planos de governo registrados no TSE pelos candidatos do 2º turno.",
};

export default function QuizPage() {
  return <QuizApp dados={getQuizDados()} />;
}
