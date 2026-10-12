import path from "node:path";
import type { CandidatoId, ItemPlano, PropostasArquivo, RegistroCandidato } from "@/types";
import { candidatoDoItem } from "@/lib/candidatos";
import { lerJson } from "./ler";

export function getPropostas(c: CandidatoId): PropostasArquivo {
  return lerJson<PropostasArquivo>(path.join(process.cwd(), "content", "propostas", `${c}.json`));
}

const indices = new Map<CandidatoId, Map<string, ItemPlano>>();

function indice(c: CandidatoId): Map<string, ItemPlano> {
  let m = indices.get(c);
  if (!m) {
    m = new Map(getPropostas(c).itens.map((i) => [i.id, i]));
    indices.set(c, m);
  }
  return m;
}

/** Busca um item do plano pelo id (ex.: "lula-057"). */
export function getItem(id: string): ItemPlano | null {
  const c = candidatoDoItem(id);
  if (!c) return null;
  return indice(c).get(id) ?? null;
}

/** Itens do tipo "proposta" cuja categoria principal ou secundária é a informada. */
export function propostasDaCategoria(c: CandidatoId, categoria: string): ItemPlano[] {
  return getPropostas(c).itens.filter(
    (i) => i.tipo === "proposta" && i.categorias.includes(categoria),
  );
}

export function getRegistro(c: CandidatoId): RegistroCandidato {
  return lerJson<RegistroCandidato>(path.join(process.cwd(), "content", "fontes", c, "registro.json"));
}
