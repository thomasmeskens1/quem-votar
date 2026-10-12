export interface SemPropostaProps {
  /** Texto alternativo; o padrão segue a diretriz 11. */
  texto?: string;
}

/** Mensagem padrão para ausência de proposta numa categoria (diretriz 11). */
export function SemProposta({ texto = "Sem proposta registrada" }: SemPropostaProps) {
  return (
    <p className="rounded border border-dashed border-gray-400 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
      {texto}
    </p>
  );
}
