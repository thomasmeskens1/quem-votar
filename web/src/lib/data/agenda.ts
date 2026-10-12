import type { Vies } from "@/types";
import { existeJson, lerJson } from "./ler";

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
  return existeJson("agenda.json") ? lerJson<AgendaArquivo>("agenda.json") : null;
}

export function criterioAgenda(id: string): string | undefined {
  return getAgenda()?.checklist.find((i) => i.id === id)?.criterio;
}
