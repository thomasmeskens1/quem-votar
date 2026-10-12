import { CANDIDATOS, candidatoDoItem, pdfPagina } from "@/lib/candidatos";
import { getItem } from "@/lib/data/propostas";

export interface PropostaRefProps {
  /** Id do item do plano (ex.: "lula-057"); não é exibido. */
  id: string;
}

/**
 * Referência curta a um item do plano, exibida como "p. 15" (página do plano),
 * com link para a página do PDF oficial. O id técnico não aparece na tela.
 * Componente de servidor (lê web/content).
 */
export function PropostaRef({ id }: PropostaRefProps) {
  const c = candidatoDoItem(id);
  const item = getItem(id);
  if (!c || !item) return <span className="chip">proposta do plano</span>;
  return (
    <a
      href={pdfPagina(c, item.pagina)}
      className="chip lk"
      aria-label={`Plano de governo de ${CANDIDATOS[c].nome}, página ${item.pagina}`}
    >
      p. {item.pagina}
    </a>
  );
}

/** Mantém um id por página (o link leva à mesma página do PDF). */
export function idsPorPagina(ids: string[]): string[] {
  const vistas = new Set<string>();
  return ids.filter((id) => {
    const i = getItem(id);
    const chave = i ? `${candidatoDoItem(id)}-${i.pagina}` : id;
    if (vistas.has(chave)) return false;
    vistas.add(chave);
    return true;
  });
}

export interface PropostaRefsProps {
  ids: string[];
  rotulo?: string;
}

/** Lista de referências às páginas do plano. */
export function PropostaRefs({ ids, rotulo = "Propostas citadas (página do plano)" }: PropostaRefsProps) {
  if (!ids.length) return null;
  return (
    <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-gray-700">
      <span className="font-medium">{rotulo}:</span>
      {idsPorPagina(ids).map((id) => (
        <PropostaRef key={id} id={id} />
      ))}
    </p>
  );
}
