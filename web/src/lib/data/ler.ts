import fs from "node:fs";
import path from "node:path";

/**
 * Lê um JSON de web/content (gerado por scripts/sync-data.mjs) com cache em memória.
 * Somente para uso no servidor / durante o build.
 */
const cache = new Map<string, unknown>();

export function conteudoDir(): string {
  return path.join(process.cwd(), "content");
}

export function lerJson<T>(relativo: string): T {
  const chave = relativo.split(path.sep).join("/");
  if (cache.has(chave)) return cache.get(chave) as T;
  const arquivo = path.join(conteudoDir(), chave);
  if (!fs.existsSync(arquivo)) {
    throw new Error(
      `Arquivo de dados ausente: content/${chave}. Rode "npm run sync" (scripts/sync-data.mjs).`,
    );
  }
  const dados = JSON.parse(fs.readFileSync(arquivo, "utf8")) as T;
  cache.set(chave, dados);
  return dados;
}

export function existeJson(relativo: string): boolean {
  return fs.existsSync(path.join(conteudoDir(), relativo));
}
