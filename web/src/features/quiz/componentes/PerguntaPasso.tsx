"use client";

import { useEffect, useId, useRef } from "react";
import type { PerguntaView, Resposta, ValorResposta } from "../tipos";

type Opcao = { chave: string; valor: ValorResposta | null; rotulo: string };

export const OPCOES: readonly Opcao[] = [
  { chave: "2", valor: 2, rotulo: "Concordo totalmente" },
  { chave: "1", valor: 1, rotulo: "Concordo" },
  { chave: "0", valor: 0, rotulo: "Neutro" },
  { chave: "-1", valor: -1, rotulo: "Discordo" },
  { chave: "-2", valor: -2, rotulo: "Discordo totalmente" },
];

export function rotuloResposta(v: ValorResposta | null): string {
  return OPCOES.find((o) => o.valor === v)?.rotulo ?? "";
}

export interface PerguntaPassoProps {
  pergunta: PerguntaView;
  numero: number;
  total: number;
  resposta: Resposta | undefined;
  onResponder: (r: Resposta) => void;
  onVoltar: () => void;
  onAvancar: () => void;
}

/**
 * Uma afirmação por vez. As respostas formam um grupo de rádio nativo (setas
 * do teclado alternam a opção); nenhum candidato aparece durante o quiz.
 */
export function PerguntaPasso({
  pergunta,
  numero,
  total,
  resposta,
  onResponder,
  onVoltar,
  onAvancar,
}: PerguntaPassoProps) {
  const titulo = useRef<HTMLHeadingElement>(null);
  const idBase = useId();
  const nome = `${idBase}-resposta`;
  const ultima = numero === total;
  const escolhida = resposta ? OPCOES.find((o) => o.valor === resposta.valor)?.chave : undefined;

  useEffect(() => {
    titulo.current?.focus();
  }, [pergunta.id]);

  return (
    <section aria-labelledby={`${idBase}-titulo`} className="mx-auto max-w-2xl">
      <div className="mb-4">
        <p className="mb-1 text-sm font-medium text-gray-700" aria-live="polite">
          Pergunta {numero} de {total}
        </p>
        <div
          role="progressbar"
          aria-label="Progresso do quiz"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={numero}
          aria-valuetext={`${numero} de ${total}`}
          className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
        >
          <div className="h-full rounded-full bg-gray-700" style={{ width: `${(numero / total) * 100}%` }} />
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (resposta) onAvancar();
        }}
      >
        <div className="rounded-lg border border-gray-300 p-4 sm:p-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
            {pergunta.categoria}
          </p>
          <h2
            id={`${idBase}-titulo`}
            ref={titulo}
            tabIndex={-1}
            className="text-xl font-semibold leading-snug text-gray-900 outline-none sm:text-2xl"
          >
            {pergunta.afirmacao}
          </h2>
          {pergunta.explicacao ? (
            <p className="mt-2 text-sm text-gray-700">{pergunta.explicacao}</p>
          ) : null}

          <div role="radiogroup" aria-labelledby={`${idBase}-titulo`} className="mt-5 grid gap-2">
            {OPCOES.map((o) => {
              const id = `${idBase}-${o.chave}`;
              const marcada = escolhida === o.chave;
              return (
                <label
                  key={o.chave}
                  htmlFor={id}
                  className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-base has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gray-900 ${
                    marcada ? "border-gray-900 bg-gray-100 font-semibold" : "border-gray-300 bg-white hover:bg-gray-50"
                  }`}
                >
                  <input
                    id={id}
                    type="radio"
                    name={nome}
                    value={o.chave}
                    checked={marcada}
                    onChange={() =>
                      onResponder({ valor: o.valor, importante: !!resposta?.importante })
                    }
                    className="h-4 w-4 accent-gray-800"
                  />
                  {o.rotulo}
                </label>
              );
            })}
          </div>

          <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3 text-base">
            <input
              type="checkbox"
              checked={!!resposta?.importante}
              disabled={!resposta}
              onChange={(e) => resposta && onResponder({ ...resposta, importante: e.target.checked })}
              className="h-4 w-4 accent-gray-800"
              aria-describedby={`${idBase}-peso`}
            />
            Importante para mim
          </label>
          <p id={`${idBase}-peso`} className="ml-7 text-sm text-gray-600">
            Esta pergunta passa a valer o dobro no cálculo. Escolha uma resposta para marcar.
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onVoltar}
            className="min-h-11 rounded-md border border-gray-400 bg-white px-4 py-2 text-base font-medium text-gray-900 hover:bg-gray-50"
          >
            Voltar
          </button>
          <button
            type="submit"
            disabled={!resposta}
            className="min-h-11 rounded-md bg-gray-900 px-5 py-2 text-base font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {ultima ? "Ver resultado" : "Próxima"}
          </button>
        </div>
      </form>
    </section>
  );
}
