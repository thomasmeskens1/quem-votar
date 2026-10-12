"use client";

/**
 * Faz o conteúdo da página de apuração ocupar a largura da janela (fora do
 * container estreito do layout global), com margem lateral de 5% (mínimo 16 px).
 * Mede a largura útil (sem a barra de rolagem) para não criar rolagem horizontal.
 * Antes da medição (e sem JS), ocupa a largura normal do container.
 */
import { useEffect, useRef, type ReactNode } from "react";

export function LarguraTotal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    const pai = el?.parentElement;
    if (!el || !pai) return;
    const ajustar = () => {
      const largura = document.documentElement.clientWidth;
      // Início da área de conteúdo do pai (borda esquerda + padding).
      const esquerda = pai.getBoundingClientRect().left + window.scrollX + parseFloat(getComputedStyle(pai).paddingLeft || "0");
      el.style.width = `${largura}px`;
      el.style.marginLeft = `${-esquerda}px`;
    };
    ajustar();
    const obs = new ResizeObserver(ajustar);
    obs.observe(document.documentElement);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className="box-border px-[max(16px,5vw)]">
      {children}
    </div>
  );
}
