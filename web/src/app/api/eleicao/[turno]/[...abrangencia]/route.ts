/**
 * GET /api/eleicao/{1|2}/{br | uf/SP | uf/SP/71072 | exterior | exterior/Portugal | exterior/Portugal/29539}
 *   ?fonte=auto|tse|estatico (padrão auto)
 *
 * Proxy com cache curto para os JSON do TSE (evita CORS e excesso de requisições
 * ao TSE): resultados normalizados ficam em cache 30–60 s no servidor (ver
 * features/eleicao/tse/cliente.ts) e a resposta leva Cache-Control para a CDN.
 * Reserva: arquivos estáticos oficiais do 1º turno (features/eleicao/estatico.ts).
 */
import type { NextRequest } from "next/server";
import { parseAbrangencia, parseTurno } from "@/features/eleicao/abrangencia";
import { obterResultado, SemDados, type ModoFonte } from "@/features/eleicao/servico";
import type { RespostaApi } from "@/features/eleicao/tipos";

const MODOS = new Set<ModoFonte>(["auto", "tse", "estatico"]);

function json(corpo: RespostaApi, status: number, cache: string) {
  return Response.json(corpo, { status, headers: { "Cache-Control": cache } });
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ turno: string; abrangencia: string[] }> },
) {
  const { turno: t, abrangencia } = await ctx.params;
  const turno = parseTurno(t);
  let segs: string[];
  try {
    segs = abrangencia.map((s) => decodeURIComponent(s));
  } catch {
    segs = [];
  }
  const abr = parseAbrangencia(segs);
  const modoParam = req.nextUrl.searchParams.get("fonte") ?? "auto";
  if (!turno || !abr || !MODOS.has(modoParam as ModoFonte)) {
    return json({ ok: false, erro: "Parâmetros inválidos" }, 400, "public, max-age=300");
  }

  try {
    const dados = await obterResultado(turno, abr, modoParam as ModoFonte);
    const finalizado = dados.fonte.tipo === "estatico" || dados.apuracao?.finalizada;
    return json(
      { ok: true, dados },
      200,
      finalizado
        ? "public, s-maxage=600, stale-while-revalidate=3600"
        : "public, s-maxage=5, stale-while-revalidate=5",
    );
  } catch (erro) {
    if (erro instanceof SemDados) {
      return json({ ok: false, erro: erro.message, aguardando: erro.aguardando }, 503, "public, s-maxage=15");
    }
    return json({ ok: false, erro: "Erro interno" }, 500, "no-store");
  }
}
