import type { CandidatoId, DossieRh, FonteRh } from "@/types";
import { lerJson } from "./ler";

export function getDossie(c: CandidatoId): DossieRh {
  return lerJson<DossieRh>(`rh/${c}.json`);
}

export function fontesRhPorId(c: CandidatoId): Map<string, FonteRh> {
  return new Map(getDossie(c).fontes.map((f) => [f.id, f]));
}
