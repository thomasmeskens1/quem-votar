import type { ReactNode } from "react";

export interface CardProps {
  titulo?: ReactNode;
  /** Nível do título (padrão h3). */
  nivel?: 2 | 3 | 4;
  subtitulo?: ReactNode;
  /** Cor de acento da borda superior (ex.: token de candidato ou viés). */
  acento?: string;
  as?: "section" | "article" | "div" | "li";
  id?: string;
  className?: string;
  children?: ReactNode;
}

/** Bloco com borda e espaçamento padrão. */
export function Card({
  titulo,
  nivel = 3,
  subtitulo,
  acento,
  as: Tag = "div",
  id,
  className = "",
  children,
}: CardProps) {
  const H = `h${nivel}` as "h2" | "h3" | "h4";
  return (
    <Tag
      id={id}
      className={`rounded-lg border border-gray-300 bg-white p-4 ${className}`}
      style={acento ? { borderTop: `4px solid ${acento}` } : undefined}
    >
      {titulo ? <H className="text-base font-semibold text-gray-900">{titulo}</H> : null}
      {subtitulo ? <div className="mt-1 text-sm text-gray-700">{subtitulo}</div> : null}
      <div className={titulo || subtitulo ? "mt-3" : ""}>{children}</div>
    </Tag>
  );
}
