"use client";

/**
 * Tabela LATERAL dos locais de votação do município aberto (mesma coluna e
 * altura da tabela de estados/municípios; rolagem interna). Filtro por nome,
 * bairro ou endereço; ordenação; mais votado; Lula, Flávio, Outros candidatos
 * (só no 1º turno), brancos, nulos, abstenção e comparecimento (% e número, com
 * as bases dos cartões). Hover/foco na linha = hover no pin (cresce + tooltip);
 * clique abre o detalhe completo numa linha expandida dentro da própria tabela.
 */
import { Fragment, useEffect, useMemo, useState } from "react";
import { FonteLink } from "@/components/FonteLink";
import { formatarNumero, formatarPct, lider, pctCandidato, percentuais } from "../calculos";
import { bordaCandidato, NUMERO_FLAVIO, NUMERO_LULA } from "../cores-eleicao";
import {
  carregarFonteLocais,
  idLocal,
  temCoordenadas,
  type EstadoLocais,
  type FocoLocal,
  type FonteLocais,
  type LocalVotacao,
} from "../locais";
import type { CandidatoInfo, Turno } from "../tipos";
import { DetalheLocal, votosNoLocal, votosOutros } from "./DetalheLocal";
import { rotuloUrl } from "./FonteDados";

function useFonteLocais(turno: Turno): FonteLocais | null {
  const [f, setF] = useState<{ turno: Turno; v: FonteLocais | null } | null>(null);
  useEffect(() => {
    let vivo = true;
    carregarFonteLocais(turno).then((v) => vivo && setF({ turno, v }));
    return () => {
      vivo = false;
    };
  }, [turno]);
  return f?.turno === turno ? f.v : null;
}

const normal = (s: string) => s.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/\p{M}/gu, "");

function Celula({ pct, n }: { pct: number; n: number }) {
  return (
    <td className="px-1 py-1 text-right tabular-nums sm:px-2">
      {formatarPct(pct)}
      <span className="block text-xs text-gray-600">{formatarNumero(n)}</span>
    </td>
  );
}

type Ordem = "nome" | "comparecimento" | "lula" | "flavio";

export interface ListaLocaisProps {
  turno: Turno;
  nomeMunicipio: string;
  locais: EstadoLocais;
  candidatos: CandidatoInfo[];
  foco: FocoLocal | null;
  onFoco: (f: FocoLocal | null) => void;
}

/** Fonte dos dados por local (exibida abaixo da tabela lateral). */
export function FonteLocaisTexto({ turno }: { turno: Turno }) {
  const fonte = useFonteLocais(turno);
  return (
    <p className="text-xs text-gray-700">
      Locais de votação e resultados por local: TSE
      {fonte?.data_arquivo_tse ? ` (arquivos de ${fonte.data_arquivo_tse})` : ""}
      {fonte?.urls?.length ? ": " : "."}
      {fonte?.urls?.map((u, i) => (
        <span key={u}>
          {i ? " · " : ""}
          <FonteLink href={u} tipo="oficial" titulo={u}>
            {rotuloUrl(u)}
          </FonteLink>
        </span>
      ))}
    </p>
  );
}

export function ListaLocais({ turno, nomeMunicipio, locais, candidatos, foco, onFoco }: ListaLocaisProps) {
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<Ordem>("nome");
  const [aberto, setAberto] = useState<string | null>(null);
  const nome = (n: number) => candidatos.find((c) => c.numero === n)?.nome_urna ?? `Nº ${n}`;
  const numeros = candidatos.map((c) => c.numero);
  const haOutros = numeros.some((n) => n !== NUMERO_LULA && n !== NUMERO_FLAVIO);
  const lista = useMemo(() => (locais.estado === "ok" ? locais.dados.locais : []), [locais]);
  const linhas = useMemo(() => {
    const q = normal(busca.trim());
    const base = q ? lista.filter((l) => normal(`${l.nome} ${l.bairro ?? ""} ${l.endereco ?? ""}`).includes(q)) : lista;
    const pct = (l: LocalVotacao, n: number) => pctCandidato(votosNoLocal(l, n), l.totais);
    return [...base].sort((a, b) => {
      if (ordem === "comparecimento") return b.totais.comparecimento - a.totais.comparecimento;
      if (ordem === "lula") return pct(b, NUMERO_LULA) - pct(a, NUMERO_LULA);
      if (ordem === "flavio") return pct(b, NUMERO_FLAVIO) - pct(a, NUMERO_FLAVIO);
      return a.nome.localeCompare(b.nome, "pt-BR");
    });
  }, [lista, busca, ordem]);

  if (locais.estado === "carregando") return <p className="text-sm text-gray-700">Carregando locais de votação…</p>;
  if (locais.estado === "ausente") {
    return (
      <p role="status" className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        {turno === 2
          ? "Dados por local de votação do 2º turno serão publicados pelo TSE após a totalização."
          : "Os dados por local de votação deste município ainda não estão disponíveis."}
      </p>
    );
  }
  const semCoord = lista.filter((l) => !temCoordenadas(l)).length;
  const colunas = 8 + (haOutros ? 1 : 0);
  const sairTabela = (id: string) => foco?.origem === "tabela" && foco.id === id && onFoco(null);

  return (
    <div className="min-w-0 lg:flex lg:h-full lg:flex-col">
      <div className="mb-2 flex min-w-0 flex-wrap items-end gap-3">
        <label className="text-sm text-gray-800">
          Filtrar locais
          <input
            type="search"
            value={busca}
            placeholder="nome, bairro ou endereço"
            onChange={(e) => setBusca(e.target.value)}
            className="mt-1 block w-full max-w-xs rounded border border-gray-400 px-2 py-1 text-sm sm:ml-2 sm:mt-0 sm:inline-block sm:w-auto"
          />
        </label>
        <label className="text-sm text-gray-800">
          Ordenar por
          <select
            value={ordem}
            onChange={(e) => setOrdem(e.target.value as Ordem)}
            className="ml-2 rounded border border-gray-400 px-2 py-1 text-sm"
          >
            <option value="nome">nome</option>
            <option value="comparecimento">comparecimento</option>
            <option value="lula">% {nome(NUMERO_LULA)}</option>
            <option value="flavio">% {nome(NUMERO_FLAVIO)}</option>
          </select>
        </label>
      </div>
      <p className="mb-2 text-xs text-gray-700">
        {formatarNumero(lista.length)} locais. Candidatos: % dos válidos; brancos e nulos: % do comparecimento;
        abstenção e comparecimento: % do eleitorado apurado.{haOutros ? " Outros candidatos: soma dos demais." : ""}
        {semCoord ? ` ${formatarNumero(semCoord)} sem coordenadas utilizáveis (marcados "fora do mapa").` : ""}
      </p>
      <div className="relative lg:min-h-[16rem] lg:flex-1">
        <div className="max-h-[28rem] w-full max-w-full overflow-auto rounded border border-gray-300 lg:absolute lg:inset-0 lg:max-h-none">
          <table className="w-full min-w-[48rem] border-collapse text-xs sm:text-sm">
            <caption className="sr-only">
              Resultado por local de votação em {nomeMunicipio}. Selecione um local para ver o detalhe completo.
            </caption>
            <thead className="sticky top-0 z-[2] bg-gray-100 text-left">
              <tr>
                <th scope="col" className="sticky left-0 z-[3] bg-gray-100 px-1 py-1 sm:px-2">Local</th>
                <th scope="col" className="px-1 py-1 sm:px-2">Mais votado</th>
                <th scope="col" className="px-1 py-1 text-right sm:px-2">{nome(NUMERO_LULA)}</th>
                <th scope="col" className="px-1 py-1 text-right sm:px-2">{nome(NUMERO_FLAVIO)}</th>
                {haOutros ? <th scope="col" className="px-1 py-1 text-right sm:px-2">Outros candidatos</th> : null}
                <th scope="col" className="px-1 py-1 text-right sm:px-2">Brancos</th>
                <th scope="col" className="px-1 py-1 text-right sm:px-2">Nulos</th>
                <th scope="col" className="px-1 py-1 text-right sm:px-2">Abstenção</th>
                <th scope="col" className="px-1 py-1 text-right sm:px-2">Comparecimento</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => {
                const id = idLocal(l);
                const t = l.totais;
                const p = percentuais(t);
                const ld = lider(l.candidatos, t);
                const expandido = aberto === id;
                const ativo = foco?.id === id || expandido;
                return (
                  <Fragment key={id}>
                    <tr
                      className={`cursor-pointer border-t border-gray-200 align-top hover:bg-gray-50 ${ativo ? "bg-gray-100 [&>th]:bg-gray-100" : ""}`}
                      onMouseEnter={() => onFoco({ id, origem: "tabela" })}
                      onMouseLeave={() => sairTabela(id)}
                      onFocus={() => onFoco({ id, origem: "tabela" })}
                      onBlur={() => sairTabela(id)}
                      onClick={() => setAberto(expandido ? null : id)}
                    >
                      <th scope="row" className="sticky left-0 z-[1] min-w-[9rem] border-r border-gray-200 bg-white px-1 py-1 text-left font-normal sm:min-w-[13rem] sm:px-2">
                        <button
                          type="button"
                          aria-expanded={expandido}
                          className="w-full rounded text-left text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-900"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAberto(expandido ? null : id);
                          }}
                        >
                          {l.nome}
                          {l.bairro ? <span className="block text-xs text-gray-600">{l.bairro}</span> : null}
                          {!temCoordenadas(l) ? <span className="block text-xs text-gray-600">fora do mapa</span> : null}
                          {l.fora_do_municipio ? <span className="block text-xs text-gray-600">coordenada fora do município</span> : null}
                        </button>
                      </th>
                      <td className="px-1 py-1 sm:px-2">
                        {ld ? (
                          <span className="inline-flex items-start gap-1 text-gray-900">
                            <span className="mt-1 inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: bordaCandidato(ld.numero) }} aria-hidden="true" />
                            {nome(ld.numero)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <Celula pct={pctCandidato(votosNoLocal(l, NUMERO_LULA), t)} n={votosNoLocal(l, NUMERO_LULA)} />
                      <Celula pct={pctCandidato(votosNoLocal(l, NUMERO_FLAVIO), t)} n={votosNoLocal(l, NUMERO_FLAVIO)} />
                      {haOutros ? <Celula pct={pctCandidato(votosOutros(l), t)} n={votosOutros(l)} /> : null}
                      <Celula pct={p.brancos} n={t.brancos} />
                      <Celula pct={p.nulos} n={t.nulos} />
                      <Celula pct={p.abstencoes} n={t.abstencoes} />
                      <Celula pct={p.comparecimento} n={t.comparecimento} />
                    </tr>
                    {expandido ? (
                      <tr className="bg-gray-50">
                        <td colSpan={colunas} className="px-2 py-2">
                          <div className="sticky left-2 max-w-[min(32rem,80vw)] rounded border border-gray-200 bg-white p-2 text-xs">
                            <DetalheLocal local={l} nome={nome} numeros={numeros} modo="completo" />
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
              {!linhas.length ? (
                <tr>
                  <td colSpan={colunas} className="px-2 py-3 text-center text-gray-600">Nenhum local para o filtro.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
