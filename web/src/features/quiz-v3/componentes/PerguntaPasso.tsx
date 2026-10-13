"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Caminho, Escala, PerguntaView, Resposta } from "../tipos";

/** Posição central da escala, fixada pelo site (não vem nos dados). */
export const TEXTO_SEM_OPINIAO = "Não tenho uma opinião formada sobre o tema";

/** Textos das 5 posições da escala, na ordem em que aparecem. */
export const TEXTOS_ESCALA: Record<Escala, string> = {
  1: "Totalmente o caminho A",
  2: "Mais para o caminho A",
  3: TEXTO_SEM_OPINIAO,
  4: "Mais para o caminho B",
  5: "Totalmente o caminho B",
};

const ESCALA: readonly Escala[] = [1, 2, 3, 4, 5];
const CAMINHOS: readonly Caminho[] = ["A", "B"];

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
 * Uma situação por vez, com os dois caminhos (A e B) por extenso e a resposta numa escala de
 * 5 posições. A escala é um grupo de rádio nativo (setas do teclado alternam a posição); nenhum
 * candidato aparece durante o quiz e os caminhos não indicam de qual plano vêm.
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
  // "Importante" pode ser marcado antes da resposta; vale só para a pergunta em que foi marcado.
  const [pendente, setPendente] = useState<{ id: string; valor: boolean } | null>(null);
  const importante = resposta ? resposta.importante : pendente?.id === pergunta.id && pendente.valor;

  useEffect(() => {
    titulo.current?.focus();
  }, [pergunta.id]);

  return (
    <section aria-labelledby={`${idBase}-titulo`} className="mx-auto max-w-3xl">
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
          <p className="text-base leading-relaxed text-gray-800">
            <span className="font-semibold text-gray-900">Situação: </span>
            {pergunta.situacao}
          </p>
          {pergunta.fonteSituacao ? (
            <p className="mt-1 text-xs text-gray-600">Fonte: {pergunta.fonteSituacao}</p>
          ) : null}
          <h2
            id={`${idBase}-titulo`}
            ref={titulo}
            tabIndex={-1}
            className="mt-3 text-xl font-semibold leading-snug text-gray-900 outline-none sm:text-2xl"
          >
            {pergunta.pergunta}
          </h2>

          <label className="mt-3 inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={importante}
              onChange={(e) =>
                resposta
                  ? onResponder({ ...resposta, importante: e.target.checked })
                  : setPendente({ id: pergunta.id, valor: e.target.checked })
              }
              className="h-4 w-4 shrink-0 accent-gray-800"
            />
            <span>
              <span className="font-semibold text-gray-900">Importante para mim</span>{" "}
              <span className="text-gray-600">(vale o dobro)</span>
            </span>
          </label>

          <div id={`${idBase}-caminhos`} className="mt-2 grid gap-3 md:grid-cols-2">
            {CAMINHOS.map((k) => (
              <div key={k} className="rounded-md border border-gray-300 bg-gray-50 p-3">
                <p className="text-sm font-bold uppercase tracking-wide text-gray-700">Caminho {k}</p>
                <p className="mt-1 text-base leading-relaxed text-gray-900">{pergunta.opcoes[k]}</p>
              </div>
            ))}
          </div>

          <p id={`${idBase}-escala`} className="mt-4 text-base font-semibold text-gray-900">
            Sua resposta
          </p>
          <div
            role="radiogroup"
            aria-labelledby={`${idBase}-titulo ${idBase}-escala`}
            aria-describedby={`${idBase}-caminhos`}
            className="mt-2 grid gap-2 sm:grid-cols-5"
          >
            {ESCALA.map((e) => {
              const id = `${idBase}-${e}`;
              const marcada = resposta?.escala === e;
              return (
                <label
                  key={e}
                  htmlFor={id}
                  className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 text-base has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gray-900 sm:flex-col sm:items-center sm:gap-2 sm:px-2 sm:text-center sm:text-sm ${
                    marcada ? "border-gray-900 bg-gray-100" : "border-gray-300 bg-white hover:bg-gray-50"
                  } ${e === 3 ? "text-gray-800 sm:border-dashed" : "text-gray-900"}`}
                >
                  <input
                    id={id}
                    type="radio"
                    name={nome}
                    value={e}
                    checked={marcada}
                    onChange={() => onResponder({ escala: e, importante })}
                    className="mt-1 h-4 w-4 shrink-0 accent-gray-800 sm:mt-0"
                  />
                  <span className={marcada ? "font-semibold" : undefined}>{TEXTOS_ESCALA[e]}</span>
                </label>
              );
            })}
          </div>

          {pergunta.termos.length > 0 ? (
            <div className="mt-4 border-t border-gray-200 pt-3 text-sm text-gray-700">
              <p className="font-semibold text-gray-800">O que significa</p>
              <dl className="mt-1 space-y-1">
                {pergunta.termos.map((t) => (
                  <div key={t.termo}>
                    <dt className="inline font-semibold text-gray-900">{t.termo}:</dt>{" "}
                    <dd className="inline">{t.explicacao}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
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
