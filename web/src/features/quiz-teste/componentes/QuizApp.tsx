"use client";

import { useMemo, useState } from "react";
import { calcularResultado, embaralhar } from "../calculo";
import type { QuizDados, Resposta, Respostas } from "../tipos";
import { PerguntaPasso } from "./PerguntaPasso";
import { QuizInicio } from "./QuizInicio";
import { QuizResultado } from "./QuizResultado";

type Etapa = "inicio" | "perguntas" | "resultado";

/**
 * Estado do quiz somente em memória (useState): nada vai para localStorage,
 * cookies, URL ou rede. Recarregar a página recomeça o quiz.
 */
export function QuizApp({ dados }: { dados: QuizDados }) {
  const [etapa, setEtapa] = useState<Etapa>("inicio");
  const [ordem, setOrdem] = useState<string[]>([]);
  const [indice, setIndice] = useState(0);
  const [respostas, setRespostas] = useState<Respostas>({});

  const porId = useMemo(() => new Map(dados.perguntas.map((p) => [p.id, p])), [dados.perguntas]);
  const total = dados.perguntas.length;

  const resultado = useMemo(
    () => (etapa === "resultado" ? calcularResultado(dados.perguntas, respostas) : null),
    [etapa, dados.perguntas, respostas],
  );

  function comecar() {
    setOrdem(embaralhar(dados.perguntas.map((p) => p.id)));
    setRespostas({});
    setIndice(0);
    setEtapa("perguntas");
    window.scrollTo(0, 0);
  }

  function responder(id: string, r: Resposta) {
    setRespostas((atual) => ({ ...atual, [id]: r }));
  }

  function avancar() {
    if (indice + 1 >= ordem.length) setEtapa("resultado");
    else setIndice(indice + 1);
    window.scrollTo(0, 0);
  }

  function voltar() {
    if (indice === 0) setEtapa("inicio");
    else setIndice(indice - 1);
  }

  if (etapa === "inicio") {
    return <QuizInicio total={total} exemplo={dados.exemplo} onComecar={comecar} />;
  }

  if (etapa === "resultado" && resultado) {
    return (
      <QuizResultado
        resultado={resultado}
        onRefazer={comecar}
        onRever={() => {
          setIndice(0);
          setEtapa("perguntas");
          window.scrollTo(0, 0);
        }}
      />
    );
  }

  const pergunta = porId.get(ordem[indice]);
  if (!pergunta) return null;
  return (
    <PerguntaPasso
      key={pergunta.id}
      pergunta={pergunta}
      numero={indice + 1}
      total={ordem.length}
      resposta={respostas[pergunta.id]}
      onResponder={(r) => responder(pergunta.id, r)}
      onVoltar={voltar}
      onAvancar={avancar}
    />
  );
}
