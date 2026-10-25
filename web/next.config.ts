import type { NextConfig } from "next";
import { PAGINAS_FORA_DO_AR, SO_APURACAO } from "./src/lib/modo";

/** Cache-Control para arquivos de public/, do mais estável ao mais sujeito a mudança. */
const cache = (maxAge: number, swr: number) => [
  { key: "Cache-Control", value: `public, max-age=${maxAge}, stale-while-revalidate=${swr}` },
];
const HORA = 3600;
const DIA = 24 * HORA;

const nextConfig: NextConfig = {
  async redirects() {
    if (!SO_APURACAO) return [];
    // Temporário (307): o site completo volta ao desligar SO_APURACAO.
    return PAGINAS_FORA_DO_AR.map((source) => ({ source, destination: "/eleicao", permanent: false }));
  },
  async headers() {
    return [
      // Malhas dos mapas (IBGE/Natural Earth) e PDFs oficiais dos planos: não mudam.
      { source: "/geo/:path*", headers: cache(30 * DIA, 7 * DIA) },
      { source: "/fontes/:path*", headers: cache(30 * DIA, 7 * DIA) },
      // Resultado consolidado do 1º turno e locais de votação: definitivos; 1 dia cobre eventual correção.
      { source: "/dados/eleicao/2026/1turno/:path*", headers: cache(DIA, 7 * DIA) },
      // 2º turno: arquivos gerados após a apuração podem ser atualizados.
      { source: "/dados/eleicao/2026/2turno/:path*", headers: cache(5 * 60, HORA) },
      // Propostas e análises: podem ser revisadas a qualquer publicação.
      { source: "/dados/:dir(propostas|rh|ri|rp)/:path*", headers: cache(HORA, DIA) },
    ];
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
