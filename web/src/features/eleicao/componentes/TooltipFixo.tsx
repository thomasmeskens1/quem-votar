"use client";

/**
 * Tooltip dos mapas em portal (document.body, position: fixed, z-index alto):
 * fica sempre por cima de tabelas e cabeçalhos, não é cortado por contêineres
 * com overflow e se reposiciona (acima ou abaixo da âncora, dentro da janela)
 * ao rolar ou redimensionar. Largura ajustada ao conteúdo (max-content).
 */
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

const MARGEM = 8;

function posicionar(el: HTMLDivElement | null, ancora: Element | null) {
  if (!el) return;
  if (!ancora) {
    el.style.visibility = "hidden";
    return;
  }
  const r = ancora.getBoundingClientRect();
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const left = Math.min(Math.max(MARGEM, r.left + r.width / 2 - w / 2), window.innerWidth - w - MARGEM);
  const acima = r.top + r.height / 2 - h - 12;
  const top = acima >= MARGEM ? acima : Math.max(MARGEM, Math.min(r.top + r.height / 2 + 12, window.innerHeight - h - MARGEM));
  el.style.left = `${Math.max(MARGEM, left)}px`;
  el.style.top = `${top}px`;
  el.style.visibility = "visible";
}

export function TooltipFixo({ ancora, children }: { ancora: () => Element | null; children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const ancoraRef = useRef(ancora);
  useEffect(() => {
    ancoraRef.current = ancora;
    posicionar(ref.current, ancora());
  });
  useEffect(() => {
    const f = () => posicionar(ref.current, ancoraRef.current());
    window.addEventListener("scroll", f, { passive: true, capture: true });
    window.addEventListener("resize", f);
    return () => {
      window.removeEventListener("scroll", f, { capture: true });
      window.removeEventListener("resize", f);
    };
  }, []);
  return createPortal(
    <div
      ref={ref}
      role="tooltip"
      className="pointer-events-none fixed z-[1000] max-h-[80vh] w-max overflow-auto rounded border border-gray-300 bg-white px-2 py-1 text-xs shadow-lg"
      style={{ visibility: "hidden", left: 0, top: 0, maxWidth: "min(24rem, calc(100vw - 16px))" }}
    >
      {children}
    </div>,
    document.body,
  );
}
