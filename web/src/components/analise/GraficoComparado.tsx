import type { CandidatoId } from "@/types";
import { CANDIDATOS } from "@/lib/candidatos";
import type { ContagemCategoria } from "@/lib/data/contagem";
import { CandidatoBadge } from "../CandidatoBadge";

export interface GraficoComparadoProps {
  /** Contagem por categoria de cada candidato (mesma ordem de categorias). */
  lula: ContagemCategoria[];
  flavio: ContagemCategoria[];
}

/**
 * Largura mínima da barra (px) no celular de 390px, descontando margens.
 * O rótulo só fica dentro do segmento se couber nessa largura; senão vai
 * para baixo da barra, do mesmo lado (nenhum rótulo é cortado).
 */
const LARGURA_MIN_BARRA = 320;

function cabeDentro(texto: string, pct: number) {
  return texto.length * 7 + 14 <= (pct / 100) * LARGURA_MIN_BARRA;
}

interface Linha {
  categoria: string;
  n: Record<CandidatoId, number>;
  pct: Record<CandidatoId, number>;
  secundaria: Record<CandidatoId, boolean>;
}

function montar(lula: ContagemCategoria[], flavio: ContagemCategoria[]): Linha[] {
  return lula.map((l, i) => {
    const f = flavio[i];
    const total = l.quantidade + f.quantidade;
    const pl = total ? Math.round((l.quantidade / total) * 100) : 0;
    return {
      categoria: l.categoria,
      n: { lula: l.quantidade, flavio: f.quantidade },
      pct: { lula: pl, flavio: total ? 100 - pl : 0 },
      secundaria: { lula: l.status === "apenas_secundaria", flavio: f.status === "apenas_secundaria" },
    };
  });
}

function rotulo(l: Linha, c: CandidatoId) {
  return `${l.n[c]} · ${l.pct[c]}%${l.secundaria[c] ? " (tema secundário)" : ""}`;
}

/**
 * Uma barra 100% por categoria: Lula (13) à esquerda, Flávio (22) à direita,
 * com número de propostas e percentual sobre a soma dos dois. Visual em
 * HTML/CSS (aria-hidden) + tabela equivalente para leitores de tela.
 */
export function GraficoComparado({ lula, flavio }: GraficoComparadoProps) {
  const linhas = montar(lula, flavio);
  return (
    <div className="cartao">
      <div className="grid grid-cols-1 gap-1 md:grid-cols-[15rem_1fr] md:gap-3">
        <span className="hidden md:block" />
        <div className="flex items-center justify-between gap-2">
          <CandidatoBadge candidato="lula" tamanho="sm" />
          <CandidatoBadge candidato="flavio" tamanho="sm" />
        </div>
      </div>

      <ul aria-hidden="true" className="mt-3 space-y-3">
        {linhas.map((l) => {
          const foraL = !cabeDentro(rotulo(l, "lula"), l.pct.lula);
          const foraF = !cabeDentro(rotulo(l, "flavio"), l.pct.flavio);
          return (
            <li key={l.categoria} className="grid grid-cols-1 gap-1 md:grid-cols-[15rem_1fr] md:items-center md:gap-3">
              <span className="text-xs text-gray-800 md:text-right">{l.categoria}</span>
              <div>
                <div className="flex h-6 w-full overflow-hidden rounded text-xs font-semibold text-white">
                  {l.pct.lula > 0 ? (
                    <span className="seg seg-lula" style={{ width: `${l.pct.lula}%` }}>
                      {foraL ? null : rotulo(l, "lula")}
                    </span>
                  ) : null}
                  {l.pct.flavio > 0 ? (
                    <span className="seg seg-flavio" style={{ width: `${l.pct.flavio}%` }}>
                      {foraF ? null : rotulo(l, "flavio")}
                    </span>
                  ) : null}
                </div>
                {foraL || foraF ? (
                  <div className="mt-0.5 flex justify-between gap-2 text-xs font-semibold">
                    <span className="txt-lula">{foraL ? rotulo(l, "lula") : ""}</span>
                    <span className="txt-flavio text-right">{foraF ? rotulo(l, "flavio") : ""}</span>
                  </div>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {/* sr-only no invólucro: a tabela em si não respeita largura de 1px */}
      <div className="sr-only">
      <table>
        <caption>
          Quantidade de propostas por categoria e percentual de cada candidato sobre a soma dos dois
        </caption>
        <thead>
          <tr>
            <th scope="col">Categoria</th>
            <th scope="col">{CANDIDATOS.lula.nome} (13)</th>
            <th scope="col">{CANDIDATOS.flavio.nome} (22)</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.categoria}>
              <th scope="row">{l.categoria}</th>
              <td>
                {l.n.lula} propostas, {l.pct.lula}%{l.secundaria.lula ? ", apenas como tema secundário" : ""}
              </td>
              <td>
                {l.n.flavio} propostas, {l.pct.flavio}%{l.secundaria.flavio ? ", apenas como tema secundário" : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
