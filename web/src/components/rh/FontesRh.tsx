import type { FonteRh } from "@/types";
import { AVISO_REPORTAGEM } from "@/lib/rotulos";

export interface FontesRhProps {
  ids: string[];
  fontes: Map<string, FonteRh>;
}

/**
 * Links das fontes de uma afirmação do dossiê, em forma compacta (órgão ou
 * veículo, com o título completo na dica). Reportagens recebem aviso.
 */
export function FontesRh({ ids, fontes }: FontesRhProps) {
  if (!ids.length) return null;
  return (
    <p className="fontes">
      <span className="text-gray-700">Fontes:</span>
      {ids.map((id) => {
        const f = fontes.get(id);
        if (!f) return <span key={id}>{id}</span>;
        const rep = f.tipo === "reportagem";
        return (
          <span key={id}>
            <a href={f.url} title={f.titulo} className="lk">
              <span className="tag-fonte">{rep ? "Reportagem" : "Oficial"}</span> {f.orgao_ou_veiculo}
            </a>
            {rep ? <AvisoReportagem /> : null}
          </span>
        );
      })}
    </p>
  );
}

/** Rótulo obrigatório para conteúdo de imprensa (diretriz 8). */
export function AvisoReportagem() {
  return <span className="aviso-rep">{AVISO_REPORTAGEM}</span>;
}
