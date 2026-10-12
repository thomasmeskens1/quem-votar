/** Detalhe de um local de votação (tooltip do pin e linha expandida da lista). */
import { formatarNumero, formatarPct, pctCandidato, percentuais } from "../calculos";
import { COR_OUTROS, corCandidato, NUMERO_FLAVIO, NUMERO_LULA } from "../cores-eleicao";
import { qtdSecoes, type LocalVotacao } from "../locais";

/** Votos de um candidato no local (candidatos com 0 voto vêm omitidos no arquivo). */
export const votosNoLocal = (l: LocalVotacao, n: number) => l.candidatos.find((c) => c.numero === n)?.votos ?? 0;

/** Soma dos votos de todos os candidatos que não são Lula nem Flávio. */
export const votosOutros = (l: LocalVotacao) =>
  l.candidatos.filter((c) => c.numero !== NUMERO_LULA && c.numero !== NUMERO_FLAVIO).reduce((s, c) => s + c.votos, 0);

export interface DetalheLocalProps {
  local: LocalVotacao;
  nome: (n: number) => string;
  /** Números dos candidatos do turno. */
  numeros: number[];
  /** "resumo": Lula, Flávio e Outros (soma); "completo": todos os candidatos. */
  modo: "resumo" | "completo";
}

export function DetalheLocal({ local, nome, numeros, modo }: DetalheLocalProps) {
  const t = local.totais;
  const p = percentuais(t);
  const haOutros = numeros.some((n) => n !== NUMERO_LULA && n !== NUMERO_FLAVIO);
  const linhas =
    modo === "resumo"
      ? [
          { chave: "13", rotulo: nome(NUMERO_LULA), cor: corCandidato(NUMERO_LULA), votos: votosNoLocal(local, NUMERO_LULA) },
          { chave: "22", rotulo: nome(NUMERO_FLAVIO), cor: corCandidato(NUMERO_FLAVIO), votos: votosNoLocal(local, NUMERO_FLAVIO) },
          ...(haOutros ? [{ chave: "outros", rotulo: "Outros candidatos", cor: COR_OUTROS, votos: votosOutros(local) }] : []),
        ]
      : numeros
          .map((n) => ({ chave: String(n), rotulo: nome(n), cor: corCandidato(n), votos: votosNoLocal(local, n) }))
          .sort((a, b) => b.votos - a.votos);

  return (
    <div className="space-y-1">
      <p className="font-semibold text-gray-900">{local.nome}</p>
      {local.endereco || local.bairro ? (
        <p className="text-gray-700">{[local.endereco, local.bairro].filter(Boolean).join(" · ")}</p>
      ) : null}
      <p className="text-gray-700">
        Zona {local.nr_zona} · {formatarNumero(qtdSecoes(local))} seção(ões) · {formatarNumero(t.eleitores_aptos)} aptos
      </p>
      <p className="text-gray-700">
        Comparecimento {formatarNumero(t.comparecimento)} ({formatarPct(p.comparecimento)}) · abstenção{" "}
        {formatarNumero(t.abstencoes)} ({formatarPct(p.abstencoes)})
      </p>
      <p className="text-gray-700">
        Brancos {formatarNumero(t.brancos)} ({formatarPct(p.brancos)}) · nulos {formatarNumero(t.nulos)} (
        {formatarPct(p.nulos)})
      </p>
      <ul>
        {linhas.map((c) => (
          <li key={c.chave} className="flex justify-between gap-4 whitespace-nowrap">
            <span style={{ color: c.cor }}>{c.rotulo}</span>
            <span className="tabular-nums">
              {formatarNumero(c.votos)} · {formatarPct(pctCandidato(c.votos, t))}
            </span>
          </li>
        ))}
      </ul>
      {local.fora_do_municipio ? (
        <p className="text-gray-600">Nota: a coordenada informada pelo TSE fica fora do contorno do município.</p>
      ) : null}
      {local.coordenadas_tse_fora_do_brasil ? (
        <p className="text-gray-600">Nota: a coordenada informada pelo TSE fica fora do Brasil; local mostrado só na lista.</p>
      ) : null}
    </div>
  );
}
