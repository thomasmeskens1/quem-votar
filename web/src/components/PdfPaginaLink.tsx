import type { CandidatoId } from "@/types/comum";
import { pdfPagina } from "@/lib/candidatos";
import { FonteLink } from "./FonteLink";

export interface PdfPaginaLinkProps {
  candidato: CandidatoId;
  pagina: number;
  paginaFim?: number;
  /** Rótulo opcional (ex.: id do item). */
  rotulo?: string;
  titulo?: string;
}

/** Link para a página do plano de governo oficial (PDF obtido no TSE). */
export function PdfPaginaLink({ candidato, pagina, paginaFim, rotulo, titulo }: PdfPaginaLinkProps) {
  const pags = paginaFim && paginaFim !== pagina ? `pp. ${pagina}–${paginaFim}` : `p. ${pagina}`;
  return (
    <FonteLink href={pdfPagina(candidato, pagina)} tipo="pdf" titulo={titulo}>
      {rotulo ? `${rotulo} · ` : ""}Plano de governo, {pags}
    </FonteLink>
  );
}
