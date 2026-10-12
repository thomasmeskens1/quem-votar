import type { CandidatoId } from "@/types";
import { getItem } from "@/lib/data/propostas";
import { PropostasSobDemanda } from "../sobDemanda/PropostasSobDemanda";

export interface PropostasListaProps {
  candidato: CandidatoId;
  /** Ids dos itens do plano associados à categoria/tema. */
  ids: string[];
  /** Nome da categoria da página (para separar principal/secundária). */
  categoria?: string;
}

/**
 * Lista recolhível de propostas (trecho literal + página do PDF). A divisão
 * principal/secundária é feita no servidor; os trechos são carregados ao abrir.
 */
export function PropostasLista({ candidato, ids, categoria }: PropostasListaProps) {
  const existentes = ids.filter((id) => getItem(id));
  const principais = categoria
    ? existentes.filter((id) => getItem(id)?.categoria_principal === categoria)
    : existentes;
  const secundarias = categoria ? existentes.filter((id) => !principais.includes(id)) : [];
  return (
    <PropostasSobDemanda
      candidato={candidato}
      principais={principais}
      secundarias={secundarias}
      categoria={categoria}
    />
  );
}
