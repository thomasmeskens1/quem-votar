import { redirect } from "next/navigation";

/** Endereço de testes do quiz: sem versão em teste no momento, leva ao Quiz Eleitoral oficial. */
export default function QuizTestePage() {
  redirect("/quiz");
}
