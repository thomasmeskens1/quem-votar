"use client";

/**
 * Lista (largura total) dos locais de votação do município aberto: alternativa
 * acessível ao mapa de pins. Colunas: Lula, Flávio, Outros candidatos (soma; só
 * no 1º turno), brancos, nulos, abstenção e comparecimento — % e número, com a
 * mesma base dos cartões. Cada linha abre o detalhe com todos os candidatos.
 */
import { useEffect, useMemo, useState } from "react";
import { FonteLink } from "@/components/FonteLink";
import { formatarNumero, formatarPct, pctCandidato, percentuais } from "../calculos";
import { NUMERO_FLAVIO, NUMERO_LULA } from "../cores-eleicao";
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
    <td className="px-2 py-1 text-right tabular-nums">
      {formatarPct(pct)}
      <span className="block text-xs text-gray-600">{formatarNumero(n)}</span>
    </td>
  );
}

export interface ListaLocaisProps {
  turno: Turno;
  nomeMunicipio: string;
  locais: EstadoLocais;
  candidatos: CandidatoInfo[];
  foco: FocoLocal | null;
  onFoco: (f: FocoLocal | null) => void;
}

export function ListaLocais({ turno, nomeMunicipio, locais, candidatos, foco, onFoco }: ListaLocaisProps) {
  const fonte = useFonteLocais(turno);
  const [busca, setBusca] = useState("");
  const nome = (n: number) => candidatos.find((c) => c.numero === n)?.nome_urna ?? `Nº ${n}`;
  const numeros = candidatos.map((c) => c.numero);
  const haOutros = numeros.some((n) => n !== NUMERO_LULA && n !== NUMERO_FLAVIO);
  const lista = useMemo(() => (locais.estado === "ok" ? locais.dados.locais : []), [locais]);
  const linhas = useMemo(() => {
    const q = normal(busca.trim());
    const base = q ? lista.filter((l) => normal(`${l.nome} ${l.bairro ?? ""} ${l.endereco ?? ""}`).includes(q)) : lista;
    return [...base].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [lista, busca]);

  if (locais.estado === "carregando") return <p className="text-sm text-gray-700">Carregando locais de votação…</p>;
  if (locais.estado !== "ok") return null;
  const semCoord = lista.filter((l: LocalVotacao) => !temCoordenadas(l)).length;
  const colunas = 7 + (haOutros ? 1 : 0);

  return (
    <section aria-labelledby="titulo-locais" className="min-w-0 space-y-2">
      <h2 id="titulo-locais" className="text-lg font-bold text-gray-900">
        Locais de votação em {nomeMunicipio} ({formatarNumero(lista.length)})
      </h2>
      <p className="text-xs text-gray-700">
        Candidatos: % dos votos válidos; brancos e nulos: % do comparecimento; abstenção e comparecimento: % do
        eleitorado apurado.{haOutros ? " Outros candidatos: soma dos demais candidatos do turno." : ""}
        {semCoord
          ? ` ${formatarNumero(semCoord)} local(is) sem coordenadas utilizáveis no cadastro do TSE aparecem só nesta lista (marcados "fora do mapa").`
          : ""}
      </p>
      <label className="block text-sm text-gray-800">
        Filtrar locais (nome, bairro ou endereço)
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="mt-1 block w-full max-w-sm rounded border border-gray-400 px-2 py-1 text-sm"
        />
      </label>
      <div className="max-h-[32rem] w-full max-w-full overflow-auto rounded border border-gray-300">
        <table className="w-full min-w-[44rem] border-collapse text-xs sm:text-sm">
          <caption className="sr-only">
            Resultado por local de votação em {nomeMunicipio}. Abra um local para ver todos os candidatos.
          </caption>
          <thead className="sticky top-0 z-[1] bg-gray-100 text-left">
            <tr>
              <th scope="col" className="sticky left-0 z-[2] bg-gray-100 px-2 py-1">Local</th>
              <th scope="col" className="px-2 py-1 text-right">{nome(NUMERO_LULA)}</th>
              <th scope="col" className="px-2 py-1 text-right">{nome(NUMERO_FLAVIO)}</th>
              {haOutros ? <th scope="col" className="px-2 py-1 text-right">Outros candidatos</th> : null}
              <th scope="col" className="px-2 py-1 text-right">Brancos</th>
              <th scope="col" className="px-2 py-1 text-right">Nulos</th>
              <th scope="col" className="px-2 py-1 text-right">Abstenção</th>
              <th scope="col" className="px-2 py-1 text-right">Comparecimento</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              const id = idLocal(l);
              const t = l.totais;
              const p = percentuais(t);
              return (
                <tr
                  key={id}
                  className={`border-t border-gray-200 align-top hover:bg-gray-50 ${foco?.id === id ? "bg-gray-100 [&>th]:bg-gray-100" : ""}`}
                  onMouseEnter={() => onFoco({ id, origem: "tabela" })}
                  onMouseLeave={() => foco?.origem === "tabela" && foco.id === id && onFoco(null)}
                  onFocus={() => onFoco({ id, origem: "tabela" })}
                  onBlur={() => foco?.origem === "tabela" && foco.id === id && onFoco(null)}
                >
                  <th scope="row" className="sticky left-0 z-[1] min-w-[9rem] border-r border-gray-200 bg-white px-2 py-1 text-left font-normal sm:min-w-[14rem]">
                    <details onToggle={(e) => onFoco((e.currentTarget as HTMLDetailsElement).open ? { id, origem: "lista" } : null)}>
                      <summary className="cursor-pointer rounded text-gray-900 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-900">
                        {l.nome}
                        {l.bairro ? <span className="ml-1 text-xs text-gray-600">· {l.bairro}</span> : null}
                        {!temCoordenadas(l) ? <span className="ml-1 text-xs text-gray-600">(fora do mapa)</span> : null}
                        {l.fora_do_municipio ? <span className="ml-1 text-xs text-gray-600">(coordenada fora do município)</span> : null}
                      </summary>
                      <div className="mt-1 rounded bg-white p-2 text-xs">
                        <DetalheLocal local={l} nome={nome} numeros={numeros} modo="completo" />
                      </div>
                    </details>
                  </th>
                  <Celula pct={pctCandidato(votosNoLocal(l, NUMERO_LULA), t)} n={votosNoLocal(l, NUMERO_LULA)} />
                  <Celula pct={pctCandidato(votosNoLocal(l, NUMERO_FLAVIO), t)} n={votosNoLocal(l, NUMERO_FLAVIO)} />
                  {haOutros ? <Celula pct={pctCandidato(votosOutros(l), t)} n={votosOutros(l)} /> : null}
                  <Celula pct={p.brancos} n={t.brancos} />
                  <Celula pct={p.nulos} n={t.nulos} />
                  <Celula pct={p.abstencoes} n={t.abstencoes} />
                  <Celula pct={p.comparecimento} n={t.comparecimento} />
                </tr>
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
    </section>
  );
}
