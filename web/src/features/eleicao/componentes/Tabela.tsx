"use client";

/** Tabela alternativa ao mapa: uma linha por UF/município/país/cidade. */
import { useMemo, useState } from "react";
import { formatarNumero, formatarPct, lider, pctCandidato } from "../calculos";
import { bordaCandidato } from "../cores-eleicao";
import type { CandidatoInfo, ResultadoFilho } from "../tipos";

export interface TabelaProps {
  titulo: string;
  rotuloUnidade: string;
  filhos: ResultadoFilho[];
  /** Números dos candidatos com coluna própria (ex.: [13, 22]). */
  colunas: number[];
  candidatos: CandidatoInfo[];
  selecionado?: string;
  onSelecionar?: (f: ResultadoFilho) => void;
  /** Hover/foco numa linha destaca a área no mapa (null ao sair). */
  onDestaque?: (codigo: string | null) => void;
  /** Ocupa a altura do contêiner (a tabela rola por dentro) em telas largas. */
  preencher?: boolean;
}

type Ordem = "nome" | "votos" | number;

export function Tabela(props: TabelaProps) {
  const { titulo, rotuloUnidade, filhos, colunas, candidatos, selecionado, onSelecionar, onDestaque, preencher } = props;
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("nome");
  const nome = (n: number) => candidatos.find((c) => c.numero === n)?.nome_urna ?? `Nº ${n}`;

  const linhas = useMemo(() => {
    const q = busca.trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/\p{M}/gu, "");
    const base = q
      ? filhos.filter((f) => f.nome.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/\p{M}/gu, "").includes(q))
      : filhos;
    const votosDe = (f: ResultadoFilho, n: number) => f.candidatos.find((c) => c.numero === n)?.votos ?? 0;
    return [...base].sort((a, b) => {
      if (ordem === "nome") return a.nome.localeCompare(b.nome, "pt-BR");
      if (ordem === "votos") return b.totais.comparecimento - a.totais.comparecimento;
      return pctCandidato(votosDe(b, ordem), b.totais) - pctCandidato(votosDe(a, ordem), a.totais);
    });
  }, [filhos, busca, ordem]);

  const idBusca = `busca-${rotuloUnidade}`;
  return (
    <div className={`min-w-0 ${preencher ? "lg:flex lg:h-full lg:flex-col" : ""}`}>
      <div className="mb-2 flex min-w-0 flex-wrap items-end gap-3">
        <label htmlFor={idBusca} className="text-sm text-gray-800">
          Filtrar {rotuloUnidade}
          <input
            id={idBusca}
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="mt-1 block w-full max-w-xs rounded border border-gray-400 px-2 py-1 text-sm sm:ml-2 sm:mt-0 sm:inline-block sm:w-auto"
          />
        </label>
        <label className="text-sm text-gray-800">
          Ordenar por
          <select
            value={String(ordem)}
            onChange={(e) => {
              const v = e.target.value;
              setOrdem(v === "nome" || v === "votos" ? v : Number(v));
            }}
            className="ml-2 rounded border border-gray-400 px-2 py-1 text-sm"
          >
            <option value="nome">nome</option>
            <option value="votos">comparecimento</option>
            {colunas.map((n) => (
              <option key={n} value={n}>
                % {nome(n)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {/* Em telas largas a tabela ocupa a altura restante da coluna (igual à do mapa) e rola por dentro. */}
      <div className={preencher ? "relative lg:min-h-[16rem] lg:flex-1" : ""}>
      <div
        className={`max-h-[28rem] w-full max-w-full overflow-auto rounded border border-gray-300 ${
          preencher ? "lg:absolute lg:inset-0 lg:max-h-none" : ""
        }`}
      >
        <table className="w-full border-collapse text-xs sm:text-sm">
          <caption className="sr-only">
            {titulo}. Em telas estreitas, comparecimento e seções apuradas aparecem ao selecionar a linha.
          </caption>
          <thead className="sticky top-0 bg-gray-100 text-left">
            <tr>
              <th scope="col" className="px-1 py-1 sm:px-2">{rotuloUnidade}</th>
              <th scope="col" className="px-1 py-1 sm:px-2">Mais votado</th>
              {colunas.map((n) => (
                <th key={n} scope="col" className="px-1 py-1 sm:px-2 text-right">{nome(n)}</th>
              ))}
              <th scope="col" className="hidden px-1 py-1 sm:px-2 text-right sm:table-cell">Comparecimento</th>
              <th scope="col" className="hidden px-1 py-1 sm:px-2 text-right sm:table-cell">Seções apuradas</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((f) => {
              const l = lider(f.candidatos, f.totais);
              const sel = f.codigo === selecionado;
              return (
                <tr
                  key={f.codigo}
                  className={`border-t border-gray-200 hover:bg-gray-50 ${onSelecionar ? "cursor-pointer" : ""} ${sel ? "bg-gray-100 font-semibold" : ""}`}
                  // A linha inteira abre o item; o botão do nome continua sendo o alvo de teclado.
                  onClick={onSelecionar ? () => onSelecionar(f) : undefined}
                  onMouseEnter={() => onDestaque?.(f.codigo)}
                  onMouseLeave={() => onDestaque?.(null)}
                  onFocus={() => onDestaque?.(f.codigo)}
                  onBlur={() => onDestaque?.(null)}
                >
                  <th scope="row" className="px-1 py-1 sm:px-2 text-left font-normal">
                    {onSelecionar ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelecionar(f);
                        }}
                        aria-current={sel ? "true" : undefined}
                        className="w-full cursor-pointer rounded text-left text-gray-900 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-900"
                      >
                        {f.nome}
                      </button>
                    ) : (
                      f.nome
                    )}
                    {f.grupo ? <span className="block text-xs text-gray-600">{f.grupo}</span> : null}
                    {f.lacuna ? <span className="block text-xs text-amber-800">lacuna de identificação</span> : null}
                    {f.motivo ? <span className="block text-xs text-gray-600">{f.motivo}</span> : null}
                  </th>
                  <td className="px-1 py-1 sm:px-2">
                    {l ? (
                      <span className="inline-flex items-start gap-1 text-gray-900">
                        <span
                          className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: bordaCandidato(l.numero) }}
                          aria-hidden="true"
                        />
                        {nome(l.numero)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  {colunas.map((n) => {
                    const v = f.candidatos.find((c) => c.numero === n)?.votos ?? 0;
                    return (
                      <td key={n} className="px-1 py-1 sm:px-2 text-right tabular-nums">
                        {formatarPct(pctCandidato(v, f.totais))}
                        <span className="block text-xs text-gray-600">{formatarNumero(v)}</span>
                      </td>
                    );
                  })}
                  <td className="hidden px-1 py-1 sm:px-2 text-right tabular-nums sm:table-cell">
                    {formatarNumero(f.totais.comparecimento)}
                  </td>
                  <td className="hidden px-1 py-1 sm:px-2 text-right tabular-nums sm:table-cell">
                    {f.apuracao ? formatarPct(f.apuracao.pct_secoes_totalizadas) : <abbr title="Resultado consolidado do TSE" className="no-underline">final</abbr>}
                  </td>
                </tr>
              );
            })}
            {!linhas.length ? (
              <tr>
                <td colSpan={4 + colunas.length} className="px-2 py-3 text-center text-gray-600">
                  Nenhum resultado para o filtro.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
