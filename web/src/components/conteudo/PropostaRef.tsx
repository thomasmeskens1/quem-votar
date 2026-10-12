import { candidatoDoItem, pdfPagina } from "@/lib/candidatos";
import { getItem } from "@/lib/data/propostas";

export interface PropostaRefProps {
  /** Id do item do plano (ex.: "lula-057"). */
  id: string;
}

/**
 * Referência curta a um item do plano: id + página, com link para a página
 * do PDF oficial (abre na mesma aba, para manter o HTML enxuto).
 * Componente de servidor (lê web/content).
 */
export function PropostaRef({ id }: PropostaRefProps) {
  const c = candidatoDoItem(id);
  const item = getItem(id);
  if (!c || !item) return <span className="chip font-mono">{id}</span>;
  return (
    <a href={pdfPagina(c, item.pagina)} className="chip lk">
      <span className="font-mono">{id}</span> p. {item.pagina}
    </a>
  );
}

export interface PropostaRefsProps {
  ids: string[];
  rotulo?: string;
}

/** Lista de referências a itens do plano. */
export function PropostaRefs({ ids, rotulo = "Propostas citadas" }: PropostaRefsProps) {
  if (!ids.length) return null;
  return (
    <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-gray-700">
      <span className="font-medium">{rotulo}:</span>
      {ids.map((id) => (
        <PropostaRef key={id} id={id} />
      ))}
    </p>
  );
}
