import type { ReactNode } from "react";

export type TipoFonte = "pdf" | "oficial" | "reportagem" | "externo";

export interface FonteLinkProps {
  href: string;
  children: ReactNode;
  tipo?: TipoFonte;
  /** Texto adicional (tooltip). */
  titulo?: string;
  className?: string;
}

const PREFIXO: Record<TipoFonte, string> = {
  pdf: "PDF",
  oficial: "Oficial",
  reportagem: "Reportagem",
  externo: "Link",
};

/** Link de fonte. Links externos e PDFs abrem em nova aba, com aviso acessível. */
export function FonteLink({ href, children, tipo = "externo", titulo, className = "" }: FonteLinkProps) {
  const novaAba = /^https?:\/\//.test(href) || tipo === "pdf";
  return (
    <a
      href={href}
      title={titulo}
      className={`lk text-sm ${className}`}
      {...(novaAba ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <span className="tag-fonte">{PREFIXO[tipo]}</span> {children}
      {novaAba ? <span className="sr-only"> (abre em nova aba)</span> : null}
    </a>
  );
}
