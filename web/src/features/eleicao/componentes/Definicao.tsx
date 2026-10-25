/**
 * Definição matemática do 2º turno: com os números oficiais do TSE, compara a
 * vantagem de quem está à frente com o máximo de votos que ainda pode ser
 * apurado (eleitores aptos das seções não totalizadas, no cenário extremo em que
 * todos votariam no segundo colocado). É um cálculo do site, não a proclamação
 * do resultado, que cabe ao TSE.
 */
import { formatarNumero } from "../calculos";
import type { Apuracao, CandidatoInfo, CandidatoVotos, Totais } from "../tipos";

export interface SituacaoDefinicao {
  liderNumero: number;
  vantagem: number;
  /** Votos que ainda podem entrar na apuração (limite máximo). */
  restantes: number;
  definido: boolean;
  /** Quantos dos votos restantes ainda precisam ser apurados, mantida a vantagem atual. */
  faltam: number;
}

export function calcularDefinicao(totais: Totais, candidatos: CandidatoVotos[]): SituacaoDefinicao | null {
  const [a, b] = [...candidatos].sort((x, y) => y.votos - x.votos);
  if (!a || !b) return null;
  const vantagem = a.votos - b.votos;
  const apurado = totais.comparecimento + totais.abstencoes;
  const naoInstaladas = totais.eleitores_secoes_nao_instaladas ?? 0;
  const restantes = Math.max(0, totais.eleitores_aptos - apurado - naoInstaladas);
  // Definido quando nem todos os votos restantes para o segundo colocado empatariam a disputa.
  const definido = vantagem > restantes;
  return { liderNumero: a.numero, vantagem, restantes, definido, faltam: definido ? 0 : restantes - vantagem + 1 };
}

export function Definicao({
  totais,
  candidatos,
  info,
  apuracao,
}: {
  totais: Totais;
  candidatos: CandidatoVotos[];
  info: CandidatoInfo[];
  apuracao?: Apuracao;
}) {
  const s = calcularDefinicao(totais, candidatos);
  if (!s || totais.comparecimento === 0) return null;
  const lider = info.find((c) => c.numero === s.liderNumero)?.nome_urna ?? `Nº ${s.liderNumero}`;
  const encerrada = !!apuracao?.finalizada;

  return (
    <section
      aria-labelledby="titulo-definicao"
      className="rounded-lg border border-gray-300 bg-white p-4"
    >
      <h3 id="titulo-definicao" className="text-base font-bold text-gray-900">
        Definição matemática do 2º turno
      </h3>
      <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="min-w-0 rounded border border-gray-200 bg-gray-50 p-3">
          <dt className="text-sm font-semibold text-gray-800">Vantagem de quem está à frente</dt>
          <dd className="mt-1 text-xl font-bold tabular-nums text-gray-900">{formatarNumero(s.vantagem)}</dd>
          <dd className="text-xs text-gray-600">votos ({lider})</dd>
        </div>
        <div className="min-w-0 rounded border border-gray-200 bg-gray-50 p-3">
          <dt className="text-sm font-semibold text-gray-800">Votos que ainda podem ser apurados</dt>
          <dd className="mt-1 text-xl font-bold tabular-nums text-gray-900">{formatarNumero(s.restantes)}</dd>
          <dd className="text-xs text-gray-600">no máximo (eleitores das seções ainda não totalizadas)</dd>
        </div>
        <div className="min-w-0 rounded border border-gray-200 bg-gray-50 p-3">
          <dt className="text-sm font-semibold text-gray-800">
            {s.definido ? "Situação" : "Faltam apurar, no mínimo"}
          </dt>
          <dd className="mt-1 text-xl font-bold tabular-nums text-gray-900">
            {s.definido ? "Definido matematicamente" : formatarNumero(s.faltam)}
          </dd>
          <dd className="text-xs text-gray-600">
            {s.definido ? "os votos restantes não alteram quem está à frente" : "votos, mantida a vantagem atual"}
          </dd>
        </div>
      </dl>
      <p role="status" className="mt-3 text-sm text-gray-800">
        {encerrada
          ? "A totalização do TSE foi encerrada."
          : s.definido
            ? `Mesmo que todos os eleitores das seções ainda não totalizadas votassem no segundo colocado, ${lider} continuaria à frente.`
            : "Ainda não há definição matemática: os votos que faltam apurar ainda poderiam mudar quem está à frente."}
      </p>
      <p className="mt-2 text-xs text-gray-600">
        Cálculo do site com os números oficiais do TSE, no cenário mais extremo: todos os eleitores aptos das seções
        ainda não totalizadas comparecendo e votando no segundo colocado. Por isso a definição matemática tende a vir
        depois das projeções divulgadas pela imprensa. A proclamação do resultado é feita pelo TSE.
      </p>
    </section>
  );
}
