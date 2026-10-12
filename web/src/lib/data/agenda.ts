import path from "node:path";
import type { Vies } from "@/types";
import { lerJsonOpcional } from "./ler";

export interface ItemAgendaDef {
  id: string;
  vies_origem: Vies;
  categoria: string;
  item: string;
  criterio: string;
}

export interface AgendaArquivo {
  versao: number | null;
  metodo?: string;
  checklist: ItemAgendaDef[];
}

/** Lista comum de agenda (content/agenda.json, extraída pelo sync-data). */
export function getAgenda(): AgendaArquivo | null {
  return lerJsonOpcional<AgendaArquivo>(path.join(process.cwd(), "content", "agenda.json"));
}

export function criterioAgenda(id: string): string | undefined {
  return getAgenda()?.checklist.find((i) => i.id === id)?.criterio;
}
