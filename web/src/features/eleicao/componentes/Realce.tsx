"use client";

/**
 * Animação de "grow up" das áreas e pins dos mapas. A área em foco (hover ou
 * teclado) ganha uma CÓPIA desenhada no topo do SVG, que cresce a partir do
 * próprio centro (transform-box: fill-box), com contorno e sombra de destaque.
 * A cópia não recebe eventos de ponteiro (pointer-events: none), então o hover
 * continua sendo da área original e não há tremor/loop nas bordas. Ao sair, a
 * cópia encolhe e é removida. Com prefers-reduced-motion: sem escala, só o
 * contorno de destaque.
 */
import { useEffect, useState, type CSSProperties } from "react";
import { COR_DESTAQUE } from "../cores-eleicao";

export const DURACAO_REALCE_MS = 200;

/** Keyframes do realce (uma vez por mapa). */
export function EstiloRealce() {
  return (
    <style>{`
@keyframes eleicao-crescer { from { transform: scale(1); } to { transform: scale(var(--k)); } }
@keyframes eleicao-encolher { from { transform: scale(var(--k)); } to { transform: scale(1); } }
`}</style>
  );
}

/** Chave em realce e chave saindo (para a animação de volta). */
export function useRealce(atual: string | null): { entrando: string | null; saindo: string | null } {
  const [anterior, setAnterior] = useState<string | null>(atual);
  const [saindo, setSaindo] = useState<string | null>(null);
  // Guarda a chave anterior durante a renderização (padrão do React para valores derivados).
  if (atual !== anterior) {
    setSaindo(anterior);
    setAnterior(atual);
  }
  useEffect(() => {
    if (!saindo) return;
    const t = setTimeout(() => setSaindo(null), DURACAO_REALCE_MS + 20);
    return () => clearTimeout(t);
  }, [saindo]);
  return { entrando: atual, saindo: saindo && saindo !== atual ? saindo : null };
}

export function estiloRealce(fase: "entrando" | "saindo", escala: number, reduzido: boolean): CSSProperties {
  const base: CSSProperties = {
    pointerEvents: "none",
    transformBox: "fill-box",
    transformOrigin: "center",
    filter: `drop-shadow(0 1px 2px ${COR_DESTAQUE})`,
    ["--k" as string]: String(escala),
  };
  if (reduzido) return fase === "entrando" ? base : { ...base, display: "none" };
  return {
    ...base,
    transform: fase === "entrando" ? `scale(${escala})` : "scale(1)",
    animation: `${fase === "entrando" ? "eleicao-crescer" : "eleicao-encolher"} ${DURACAO_REALCE_MS}ms ease-out both`,
  };
}
