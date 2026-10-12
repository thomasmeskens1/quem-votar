import { ROTULO_CONFIANCA, ROTULO_HORIZONTE } from "@/lib/rotulos";

export interface ConfiancaBadgeProps {
  /** "alta" | "media" | "baixa" ou texto composto vindo da síntese. */
  confianca: string;
}

const NIVEL: Record<string, number> = { baixa: 1, media: 2, alta: 3 };

/** Nível de confiança de um cenário, com indicador de 3 barras. */
export function ConfiancaBadge({ confianca }: ConfiancaBadgeProps) {
  const n = NIVEL[confianca];
  const rotulo = ROTULO_CONFIANCA[confianca] ?? `Confiança: ${confianca.replace(/media/g, "média")}`;
  return (
    <span className="selo">
      {n ? (
        <span aria-hidden="true" className="inline-flex items-end gap-0.5">
          {[1, 2, 3].map((i) => (
            <span
              key={i}
              className={`inline-block w-1 ${i <= n ? "bg-gray-800" : "bg-gray-300"}`}
              style={{ height: 4 + i * 3 }}
            />
          ))}
        </span>
      ) : null}
      {rotulo}
    </span>
  );
}

export interface HorizonteBadgeProps {
  horizonte: string;
}

/** Horizonte temporal de um cenário. */
export function HorizonteBadge({ horizonte }: HorizonteBadgeProps) {
  const r = ROTULO_HORIZONTE[horizonte] ?? `Horizonte: ${horizonte.replace(/medio/g, "médio")}`;
  return <span className="selo bg-gray-50">{r}</span>;
}
