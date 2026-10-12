import fs from "node:fs";
import path from "node:path";

/**
 * Leitura dos JSON de web/content (gerados por scripts/sync-data.mjs), com
 * cache em memória. Somente para uso no servidor / durante o build.
 *
 * Os chamadores montam o caminho com segmentos FIXOS por tipo de dado, ex.:
 * path.join(process.cwd(), "content", "rp", vies, `${c}.json`), para que o
 * rastreamento de arquivos do Next fique restrito a cada pasta (nunca a
 * content/ inteiro, que também recebe os dados eleitorais).
 */
const cache = new Map<string, unknown>();

export function lerJson<T>(arquivo: string): T {
  if (cache.has(arquivo)) return cache.get(arquivo) as T;
  if (!fs.existsSync(arquivo)) {
    throw new Error(
      `Arquivo de dados ausente: ${path.relative(process.cwd(), arquivo)}. Rode "npm run sync".`,
    );
  }
  const dados = JSON.parse(fs.readFileSync(arquivo, "utf8")) as T;
  cache.set(arquivo, dados);
  return dados;
}

/** Lê um JSON opcional; devolve null se não existir. */
export function lerJsonOpcional<T>(arquivo: string): T | null {
  return fs.existsSync(arquivo) ? lerJson<T>(arquivo) : null;
}
