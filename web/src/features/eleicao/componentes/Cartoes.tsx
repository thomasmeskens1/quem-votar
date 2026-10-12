/** Cartões de resultado: candidatos, brancos, nulos, abstenção, comparecimento e % apurado. */
import { formatarNumero, formatarPct, pctCandidato, percentuais } from "../calculos";
import { bordaCandidato, COR_FUNDO_NEUTRO, corCandidato, corPreenchimento, fundoCandidato } from "../cores-eleicao";
import type { Apuracao, CandidatoInfo, CandidatoVotos, Totais } from "../tipos";

export interface CartoesProps {
  totais: Totais;
  candidatos: CandidatoVotos[];
  info: CandidatoInfo[];
  apuracao?: Apuracao;
}

function Barra({ pct, cor }: { pct: number; cor: string }) {
  return (
    <div className="mt-2 h-2 w-full rounded bg-gray-200" aria-hidden="true">
      <div className="h-2 rounded" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: cor }} />
    </div>
  );
}

export function Apurado({ apuracao }: { apuracao?: Apuracao }) {
  if (!apuracao) {
    return (
      <p className="text-sm text-gray-700">
        Resultado consolidado (arquivo oficial de resultados do TSE).
      </p>
    );
  }
  const p = apuracao.pct_secoes_totalizadas;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-semibold text-gray-900">Seções totalizadas</span>
        <span className="text-2xl font-bold tabular-nums text-gray-900">{formatarPct(p)}</span>
      </div>
      <div
        className="mt-1 h-3 w-full rounded bg-gray-200"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(p * 100) / 100}
        aria-label="Percentual de seções totalizadas"
      >
        <div className="h-3 rounded bg-gray-800" style={{ width: `${Math.min(100, p)}%` }} />
      </div>
      <p className="mt-1 text-xs text-gray-700">
        {formatarNumero(apuracao.secoes_totalizadas)} de {formatarNumero(apuracao.secoes_total)} seções
        {apuracao.finalizada ? " · totalização encerrada" : " · em andamento"}
      </p>
    </div>
  );
}

export function Cartoes({ totais, candidatos, info }: CartoesProps) {
  const p = percentuais(totais);
  const nome = (n: number) => info.find((c) => c.numero === n);
  const ordenados = [...candidatos].sort((a, b) => b.votos - a.votos);
  const outros = [
    { rotulo: "Brancos", votos: totais.brancos, pct: p.brancos, base: "do comparecimento" },
    { rotulo: "Nulos", votos: totais.nulos, pct: p.nulos, base: "do comparecimento" },
    { rotulo: "Abstenção", votos: totais.abstencoes, pct: p.abstencoes, base: "do eleitorado apurado*" },
    { rotulo: "Comparecimento", votos: totais.comparecimento, pct: p.comparecimento, base: "do eleitorado apurado*" },
  ];

  return (
    <div className="min-w-0 space-y-4">
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Votos por candidato">
        {ordenados.map((c, i) => {
          const ci = nome(c.numero);
          const pc = pctCandidato(c.votos, totais);
          const cor = corCandidato(c.numero);
          return (
            <li
              key={c.numero}
              className="min-w-0 rounded-lg border border-gray-300 p-3"
              style={{
                borderLeft: `6px solid ${bordaCandidato(c.numero)}`,
                backgroundColor: i < 2 ? fundoCandidato(c.numero) : COR_FUNDO_NEUTRO,
              }}
            >
              <p className="break-words text-sm font-semibold" style={{ color: cor }}>
                {ci?.nome_urna ?? `Nº ${c.numero}`}{" "}
                <span className="font-normal text-gray-700">
                  ({c.numero}{ci?.partido ? ` · ${ci.partido}` : ""})
                </span>
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{formatarPct(pc)}</p>
              <p className="text-sm tabular-nums text-gray-700">{formatarNumero(c.votos)} votos</p>
              {ci?.situacao_turno ? <p className="text-xs text-gray-600">Situação TSE: {ci.situacao_turno}</p> : null}
              <Barra pct={pc} cor={corPreenchimento(c.numero)} />
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-gray-700">
        Percentual dos candidatos sobre os votos válidos ({formatarNumero(totais.votos_validos)}).
      </p>
      <dl className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 lg:grid-cols-4">
        {outros.map((o) => (
          <div key={o.rotulo} className="min-w-0 rounded-lg border border-gray-300 bg-white p-3">
            <dt className="text-sm font-semibold text-gray-800">{o.rotulo}</dt>
            <dd className="mt-1 text-xl font-bold tabular-nums text-gray-900">{formatarPct(o.pct)}</dd>
            <dd className="text-sm tabular-nums text-gray-700">{formatarNumero(o.votos)}</dd>
            <dd className="text-xs text-gray-600">{o.base}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-gray-700">
        * Eleitorado apurado = comparecimento + abstenções ({formatarNumero(totais.comparecimento + totais.abstencoes)}),
        como faz o TSE; exclui eleitores de seções não instaladas e, durante a apuração, de seções ainda não
        totalizadas. Eleitorado apto: {formatarNumero(totais.eleitores_aptos)}
        {totais.secoes_nao_instaladas
          ? ` · seções não instaladas: ${formatarNumero(totais.secoes_nao_instaladas)}${
              totais.eleitores_secoes_nao_instaladas !== undefined
                ? ` (${formatarNumero(totais.eleitores_secoes_nao_instaladas)} eleitores)`
                : ""
            }`
          : ""}
      </p>
    </div>
  );
}
