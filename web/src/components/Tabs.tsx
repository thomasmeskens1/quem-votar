"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export interface TabItem {
  id: string;
  rotulo: ReactNode;
  conteudo: ReactNode;
}

export interface TabsProps {
  abas: TabItem[];
  /** Nome acessível do grupo de abas. */
  rotuloGrupo: string;
  /** Id da aba inicialmente selecionada (padrão: a primeira). */
  inicial?: string;
}

/**
 * Abas acessíveis (padrão WAI-ARIA): setas esquerda/direita, Home e End
 * movem o foco entre as abas; o painel ativo é focável.
 */
export function Tabs({ abas, rotuloGrupo, inicial }: TabsProps) {
  const base = useId();
  const [ativa, setAtiva] = useState(inicial ?? abas[0]?.id);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKey(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    let prox = -1;
    if (e.key === "ArrowRight") prox = (i + 1) % abas.length;
    else if (e.key === "ArrowLeft") prox = (i - 1 + abas.length) % abas.length;
    else if (e.key === "Home") prox = 0;
    else if (e.key === "End") prox = abas.length - 1;
    if (prox >= 0) {
      e.preventDefault();
      setAtiva(abas[prox].id);
      refs.current[prox]?.focus();
    }
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label={rotuloGrupo}
        className="flex flex-wrap gap-1 border-b border-gray-300"
      >
        {abas.map((a, i) => {
          const sel = a.id === ativa;
          return (
            <button
              key={a.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${a.id}`}
              aria-selected={sel}
              aria-controls={`${base}-painel-${a.id}`}
              tabIndex={sel ? 0 : -1}
              onClick={() => setAtiva(a.id)}
              onKeyDown={(e) => onKey(e, i)}
              className={`-mb-px rounded-t border px-3 py-2 text-sm font-medium ${
                sel
                  ? "border-gray-300 border-b-white bg-white text-gray-900"
                  : "border-transparent text-gray-700 hover:text-gray-900"
              }`}
            >
              {a.rotulo}
            </button>
          );
        })}
      </div>
      {abas.map((a) => (
        <div
          key={a.id}
          role="tabpanel"
          id={`${base}-painel-${a.id}`}
          aria-labelledby={`${base}-tab-${a.id}`}
          hidden={a.id !== ativa}
          tabIndex={0}
          className="pt-4"
        >
          {a.conteudo}
        </div>
      ))}
    </div>
  );
}
