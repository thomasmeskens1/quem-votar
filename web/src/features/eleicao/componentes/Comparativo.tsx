/** Comparativo 1º × 2º turno na abrangência selecionada. */
import { comparar, formatarDelta, formatarNumero, formatarPct, type Variacao } from "../calculos";
import { corCandidato, NUMERO_FLAVIO, NUMERO_LULA } from "../cores-eleicao";
import type { CandidatoInfo, CandidatoVotos, Totais } from "../tipos";

interface Bloco {
  totais: Totais;
  candidatos: CandidatoVotos[];
}

export interface ComparativoProps {
  turno1: Bloco | null;
  turno2: Bloco | null;
  info: CandidatoInfo[];
  /** 2º turno ainda sem seções totalizadas. */
  aguardando: boolean;
  nomeAbrangencia: string;
  /** 2º turno em apuração, mas exibido o 1º: oferece abrir o 2º para comparar. */
  abrirSegundo?: () => void;
}

function Linha({ rotulo, votos, pct, cor }: { rotulo: string; votos: Variacao; pct: Variacao; cor?: string }) {
  return (
    <tr className="border-t border-gray-200">
      <th scope="row" className="px-2 py-1 text-left font-semibold" style={cor ? { color: cor } : undefined}>
        {rotulo}
      </th>
      <td className="px-1 py-1 text-right tabular-nums sm:px-2">
        {formatarPct(pct.antes)}
        <span className="block text-xs text-gray-600">{formatarNumero(votos.antes)}</span>
      </td>
      <td className="px-1 py-1 text-right tabular-nums sm:px-2">
        {formatarPct(pct.depois)}
        <span className="block text-xs text-gray-600">{formatarNumero(votos.depois)}</span>
      </td>
      <td className="px-1 py-1 text-right tabular-nums sm:px-2">
        {formatarDelta(pct.delta, "pp")}
        <span className="block text-xs text-gray-600">{formatarDelta(votos.delta, "votos")}</span>
      </td>
    </tr>
  );
}

export function Comparativo({ turno1, turno2, info, aguardando, nomeAbrangencia, abrirSegundo }: ComparativoProps) {
  if (!turno1) {
    return <p className="text-sm text-gray-700">Dados do 1º turno indisponíveis para {nomeAbrangencia}.</p>;
  }
  const nome = (n: number) => info.find((c) => c.numero === n)?.nome_urna ?? `Nº ${n}`;
  if (!turno2 && !aguardando && abrirSegundo) {
    return (
      <p className="text-sm text-gray-800">
        Para comparar os turnos em {nomeAbrangencia},{" "}
        <button type="button" onClick={abrirSegundo} className="text-blue-800 underline underline-offset-2">
          abra o 2º turno
        </button>
        .
      </p>
    );
  }
  if (!turno2 || aguardando) {
    return (
      <div className="rounded border border-gray-300 bg-gray-50 p-3 text-sm text-gray-800">
        <p className="font-semibold">2º turno: aguardando apuração (25/10/2026).</p>
        <p className="mt-1">
          A comparação entre os turnos em {nomeAbrangencia} aparece aqui assim que o TSE começar a totalizar as
          seções do 2º turno. Até lá, os números acima são do 1º turno.
        </p>
      </div>
    );
  }
  const c = comparar(turno1, turno2, [NUMERO_LULA, NUMERO_FLAVIO]);
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <caption className="mb-2 text-left text-sm text-gray-700">
          Variação do 1º para o 2º turno em {nomeAbrangencia}. Candidatos: % dos votos válidos; brancos e nulos: %
          do comparecimento; abstenção e comparecimento: % do eleitorado.
        </caption>
        <thead className="bg-gray-100">
          <tr>
            <th scope="col" className="px-2 py-1 text-left">Opção</th>
            <th scope="col" className="px-2 py-1 text-right">1º turno</th>
            <th scope="col" className="px-2 py-1 text-right">2º turno</th>
            <th scope="col" className="px-2 py-1 text-right">Variação</th>
          </tr>
        </thead>
        <tbody>
          {c.candidatos.map((x) => (
            <Linha key={x.numero} rotulo={nome(x.numero)} votos={x.votos} pct={x.pct} cor={corCandidato(x.numero)} />
          ))}
          <Linha rotulo="Brancos" {...c.brancos} />
          <Linha rotulo="Nulos" {...c.nulos} />
          <Linha rotulo="Abstenção" {...c.abstencoes} />
          <Linha rotulo="Comparecimento" {...c.comparecimento} />
        </tbody>
      </table>
    </div>
  );
}
