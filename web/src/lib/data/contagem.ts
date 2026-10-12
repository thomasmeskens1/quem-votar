import type { CandidatoId, StatusCategoria } from "@/types";
import { getCategorias } from "./categorias";
import { getCategoriaRp } from "./rp";

export interface ContagemCategoria {
  categoria: string;
  quantidade: number;
  status: StatusCategoria;
}

/**
 * Quantidade de propostas associadas a cada categoria (a mesma lista usada na
 * página da categoria: ids da síntese, categoria principal ou secundária).
 */
export function contagemPorCategoria(c: CandidatoId): ContagemCategoria[] {
  return getCategorias().map((cat) => {
    const p = getCategoriaRp(cat.nome)?.por_candidato[c];
    const quantidade = p?.proposta_ids.length ?? 0;
    return {
      categoria: cat.nome,
      quantidade,
      status: !p || quantidade === 0 ? "sem_proposta_registrada" : p.status,
    };
  });
}

export function rotuloQuantidade(n: number): string {
  return n === 1 ? "1 proposta" : `${n} propostas`;
}
