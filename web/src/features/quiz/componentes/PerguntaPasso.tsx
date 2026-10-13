"use client";

import { useEffect, useId, useRef } from "react";
import type { Escolha, PerguntaView, Resposta } from "../tipos";

/** Opção C, fixada pelo site (não vem nos dados) e sempre a última. */
export const TEXTO_SEM_OPINIAO = "Não tenho uma opinião formada sobre o tema";

const ESCOLHAS: readonly Escolha[] = ["A", "B", "C"];

export function textoEscolha(p: PerguntaView, e: Escolha): string {
  return e === "C" ? TEXTO_SEM_OPINIAO : p.opcoes[e];
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
 * Uma situação por vez, com dois caminhos (A e B) e a opção C. As respostas formam
 * um grupo de rádio nativo (setas do teclado alternam a opção); nenhum candidato
 * aparece durante o quiz e os caminhos não indicam de qual plano vêm.
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
          <p id={`${idBase}-situacao`} className="text-base leading-relaxed text-gray-800">
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

          <div
            role="radiogroup"
            aria-labelledby={`${idBase}-titulo`}
            aria-describedby={`${idBase}-situacao`}
            className="mt-4 grid gap-2"
          >
            {ESCOLHAS.map((e) => {
              const id = `${idBase}-${e}`;
              const marcada = resposta?.escolha === e;
              return (
                <label
                  key={e}
                  htmlFor={id}
                  className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 text-base has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gray-900 ${
                    marcada ? "border-gray-900 bg-gray-100" : "border-gray-300 bg-white hover:bg-gray-50"
                  } ${e === "C" ? "mt-1 text-gray-800" : "text-gray-900"}`}
                >
                  <input
                    id={id}
                    type="radio"
                    name={nome}
                    value={e}
                    checked={marcada}
                    onChange={() => onResponder({ escolha: e, importante: !!resposta?.importante })}
                    className="mt-1 h-4 w-4 shrink-0 accent-gray-800"
                  />
                  <span className={marcada ? "font-semibold" : undefined}>
                    <span aria-hidden="true" className="mr-1 font-semibold text-gray-600">
                      {e})
                    </span>
                    {textoEscolha(pergunta, e)}
                  </span>
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
