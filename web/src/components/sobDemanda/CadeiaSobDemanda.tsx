"use client";

import type { CandidatoId, PassoCadeia } from "@/types";
import { urlPropostas, useSobDemanda, type MapaPropostas } from "@/lib/cliente/sobDemanda";
import { ROTULO_PASSO, formatarData } from "@/lib/rotulos";
import { DetalhesSobDemanda, EstadoBloco, RefCliente } from "./Blocos";

interface OrigemPublica {
  cadeia: PassoCadeia[];
  /** justificativa da confiança */
  j: string;
  /** título original do cenário no viés */
  to: string;
}

interface ContextoPublico {
  itens: Record<string, { tema: string; data: string | null; f: string[] }>;
  fontes: Record<string, { o: string; t: string; u: string }>;
}

export interface CadeiaSobDemandaProps {
  candidato: CandidatoId;
  /** Índice do tema na síntese de RI. */
  tema: number;
  /** Índice do cenário no tema. */
  cenario: number;
  /** Índice da origem (viés) no cenário. */
  origem: number;
  nPassos: number;
  /** Título do cenário na síntese (para indicar título original diferente). */
  titulo?: string;
}

/** Cadeia completa proposta → fato oficial → consequência, carregada ao abrir. */
export function CadeiaSobDemanda({ candidato: c, tema, cenario, origem, nPassos, titulo }: CadeiaSobDemandaProps) {
  const { estado, carregar } = useSobDemanda<[OrigemPublica[][], ContextoPublico, MapaPropostas]>(
    [`/dados/ri/cenarios/${tema}.json`, "/dados/ri/contexto.json", urlPropostas(c)],
  );
  const o = estado.status === "ok" ? estado.dados[0][cenario]?.[origem] : undefined;
  const cadeia = o?.cadeia ?? [];
  return (
    <DetalhesSobDemanda
      className="mt-2"
      aoAbrir={carregar}
      resumo={`Ver a cadeia (${nPassos} passos: proposta → fato oficial → consequência) e a justificativa da confiança`}
    >
      <EstadoBloco estado={estado} tentar={carregar} />
      {o && titulo && o.to !== titulo ? <p className="meta mt-2">Título original: {o.to}</p> : null}
      {estado.status === "ok" ? (
        <ol className="mt-2 space-y-1.5" aria-label="Cadeia do cenário">
          {cadeia.map((p, j) => {
            const ctx = p.passo === "contexto" && p.ref_id ? estado.dados[1].itens[p.ref_id] : null;
            return (
              <li
                key={j}
                className={`rounded border border-gray-500 bg-white p-2 ${p.passo === "consequencia" ? "border-dashed" : ""}`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">
                  {j + 1}. {ROTULO_PASSO[p.passo] ?? p.passo}
                </p>
                <p className="mt-1 text-sm text-gray-900">{p.texto}</p>
                {p.citacao ? (
                  <p className="mt-1 text-xs text-gray-800">
                    <q className="italic">{p.citacao}</q>
                  </p>
                ) : null}
                {p.passo === "proposta" && p.ref_id ? (
                  <p className="mt-1">
                    <RefCliente id={p.ref_id} c={c} mapa={estado.dados[2]} />
                  </p>
                ) : null}
                {ctx ? (
                  <div className="mt-1 text-xs text-gray-700">
                    <p>
                      Dado de referência: {ctx.tema}
                      {ctx.data ? ` (${formatarData(ctx.data)})` : ""}
                    </p>
                    {ctx.f.map((fid) => {
                      const f = estado.dados[1].fontes[fid];
                      return f ? (
                        <a key={fid} href={f.u} target="_blank" rel="noopener noreferrer" className="lk block">
                          <span className="tag-fonte">Oficial</span> {f.o} — {f.t}
                          <span className="sr-only"> (abre em nova aba)</span>
                        </a>
                      ) : null;
                    })}
                  </div>
                ) : null}
                {p.passo === "consequencia" ? (
                  <p className="mt-1 text-xs text-gray-700">Projeção do analista, não um fato.</p>
                ) : null}
              </li>
            );
          })}
        </ol>
      ) : null}
      {o ? (
        <p className="meta mt-2">
          <span className="font-medium">Justificativa da confiança:</span> {o.j}
        </p>
      ) : null}
    </DetalhesSobDemanda>
  );
}
