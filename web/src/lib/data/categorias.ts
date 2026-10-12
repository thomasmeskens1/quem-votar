import type { CategoriaDef, CategoriasArquivo } from "@/types";
import { slugify } from "@/lib/slug";
import { lerJson } from "./ler";

export function getCategoriasArquivo(): CategoriasArquivo {
  return lerJson<CategoriasArquivo>("categorias.json");
}

export function getCategorias(): CategoriaDef[] {
  return getCategoriasArquivo().categorias;
}

export function categoriaPorSlug(slug: string): CategoriaDef | null {
  return getCategorias().find((c) => slugify(c.nome) === slug) ?? null;
}
