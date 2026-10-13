import { redirect } from "next/navigation";

/** A versão de teste virou o Quiz Eleitoral oficial: o endereço antigo leva a /quiz. */
export default function QuizTestePage() {
  redirect("/quiz");
}
