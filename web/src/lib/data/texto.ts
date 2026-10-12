import { legivel } from "@/lib/texto";
import { getAgenda } from "./agenda";
import { getItem } from "./propostas";

/**
 * Versão de servidor de `legivel`: resolve ids de propostas para a página do
 * plano e ids de itens de agenda para o nome do item.
 */
export function textoLegivel(t: string | null | undefined): string {
  return legivel(t, {
    proposta: (id) => {
      const i = getItem(id);
      return i ? `proposta da p. ${i.pagina}` : null;
    },
    agenda: (id) => {
      const i = getAgenda()?.checklist.find((x) => x.id === id);
      return i ? `item de agenda “${i.item}”` : null;
    },
  });
}
