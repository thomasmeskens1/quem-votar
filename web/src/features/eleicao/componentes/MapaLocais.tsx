"use client";

/**
 * Município em destaque: contorno (malha do IBGE) + "pins" dos locais de votação,
 * coloridos pelo mais votado no local. Hover/foco mostram o detalhe do local; a
 * lista abaixo do mapa é a alternativa acessível (inclui locais sem coordenadas).
 */
import { geoMercator, geoPath } from "d3-geo";
import { useEffect, useMemo, useState } from "react";
import { formatarNumero, formatarPct, lider, pctCandidato, percentuais } from "../calculos";
import { corCandidato, NUMERO_FLAVIO, NUMERO_LULA } from "../cores-eleicao";
import { FonteLink } from "@/components/FonteLink";
import {
  carregarFonteLocais,
  idLocal,
  qtdSecoes,
  temCoordenadas,
  useLocais,
  type FonteLocais,
  type LocalVotacao,
} from "../locais";
import { carregarMalha, chaveFeicao, MALHA, type ColecaoMalha } from "../malhas";
import type { CandidatoInfo, Turno } from "../tipos";
import { rotuloUrl } from "./FonteDados";
import { movimentoReduzido } from "./Mapa";

export interface MapaLocaisProps {
  turno: Turno;
  uf: string;
  codIbge?: string;
  codTse: string;
  nomeMunicipio: string;
  candidatos: CandidatoInfo[];
}

const L = 600;
const A = 520;

function Detalhe({ local, nome, numeros }: { local: LocalVotacao; nome: (n: number) => string; numeros: number[] }) {
  const t = local.totais;
  // Candidatos com 0 voto vêm omitidos no arquivo: completa com zero.
  const votos = numeros
    .map((n) => ({ numero: n, votos: local.candidatos.find((c) => c.numero === n)?.votos ?? 0 }))
    .sort((a, b) => b.votos - a.votos || a.numero - b.numero);
  const p = percentuais(t);
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
        {votos.map((c) => (
          <li key={c.numero} className="flex justify-between gap-3">
            <span style={{ color: corCandidato(c.numero) }}>{nome(c.numero)}</span>
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

export function MapaLocais({ turno, uf, codIbge, codTse, nomeMunicipio, candidatos }: MapaLocaisProps) {
  const locais = useLocais(turno, uf, codTse);
  const [malha, setMalha] = useState<{ uf: string; geo: ColecaoMalha } | null>(null);
  const [foco, setFoco] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);
  const m = MALHA.uf(uf);

  useEffect(() => {
    let vivo = true;
    carregarMalha(m.url, m.objeto)
      .then((g) => vivo && setMalha({ uf, geo: g }))
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, [m.url, m.objeto, uf]);

  const desenho = useMemo(() => {
    if (!malha || malha.uf !== uf) return null;
    const f = malha.geo.features.find((x) => chaveFeicao("municipios", x) === codIbge);
    if (!f) return null;
    const proj = geoMercator().fitExtent([[20, 20], [L - 20, A - 20]], f);
    return { d: geoPath(proj)(f) ?? "", proj };
  }, [malha, uf, codIbge]);

  useEffect(() => {
    if (!desenho) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setPronto(true)));
    return () => cancelAnimationFrame(id);
  }, [desenho]);

  const nome = (n: number) => candidatos.find((c) => c.numero === n)?.nome_urna ?? `Nº ${n}`;
  const numeros = candidatos.map((c) => c.numero);
  const fonte = useFonteLocais(turno);
  const lista = locais.estado === "ok" ? locais.dados.locais : [];
  const maxAptos = Math.max(1, ...lista.map((l) => l.totais.eleitores_aptos));
  const pins = desenho
    ? lista
        .filter(temCoordenadas)
        .map((l) => {
          const xy = desenho.proj([l.lon as number, l.lat as number]);
          return xy ? { l, x: xy[0], y: xy[1], r: 3 + 6 * Math.sqrt(l.totais.eleitores_aptos / maxAptos) } : null;
        })
        .filter((p): p is { l: LocalVotacao; x: number; y: number; r: number } => p !== null)
        .sort((a, b) => b.r - a.r)
    : [];
  const semCoord = lista.filter((l) => !temCoordenadas(l));
  const ativo = foco ? pins.find((p) => idLocal(p.l) === foco) : undefined;
  const reduzido = movimentoReduzido();

  return (
    <div className="space-y-3">
      {locais.estado === "ausente" ? (
        <p role="status" className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {turno === 2
            ? "Dados por local de votação do 2º turno serão publicados pelo TSE após a totalização."
            : "Os dados por local de votação deste município ainda não estão disponíveis."}
        </p>
      ) : null}
      <div
        className="relative w-full min-w-0 rounded border border-gray-200 bg-gray-50"
        style={{
          opacity: pronto || reduzido ? 1 : 0,
          transform: pronto || reduzido ? "scale(1)" : "scale(0.94)",
          transition: reduzido ? "none" : "opacity 450ms ease-out, transform 450ms ease-out",
        }}
      >
        {desenho ? (
          <svg viewBox={`0 0 ${L} ${A}`} className="h-auto w-full" role="group" aria-label={`Mapa de ${nomeMunicipio} com ${pins.length} locais de votação. Use Tab para percorrer os locais.`} onMouseLeave={() => setFoco(null)}>
            <path d={desenho.d} fill="#ffffff" stroke="#6b7280" strokeWidth={1.2} aria-hidden="true" />
            {pins.map(({ l, x, y, r }) => {
              const ld = lider(l.candidatos, l.totais);
              const id = idLocal(l);
              return (
                <circle
                  key={id}
                  cx={x}
                  cy={y}
                  r={r}
                  fill={ld ? corCandidato(ld.numero) : "#9ca3af"}
                  fillOpacity={0.85}
                  stroke={foco === id ? "#111827" : "#ffffff"}
                  strokeWidth={foco === id ? 2.5 : 1}
                  tabIndex={0}
                  role="img"
                  aria-label={`${l.nome}: ${l.candidatos
                    .slice()
                    .sort((a, b) => b.votos - a.votos)
                    .slice(0, 2)
                    .map((c) => `${nome(c.numero)} ${formatarPct(pctCandidato(c.votos, l.totais))}`)
                    .join(", ")}`}
                  className="cursor-pointer outline-none"
                  onMouseEnter={() => setFoco(id)}
                  onFocus={() => setFoco(id)}
                  onBlur={() => setFoco(null)}
                />
              );
            })}
          </svg>
        ) : (
          <div className="w-full animate-pulse bg-gray-100" style={{ aspectRatio: `${L}/${A}` }}>
            <span className="sr-only">Carregando mapa do município</span>
          </div>
        )}
        {ativo ? (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-10 hidden w-64 -translate-x-1/2 rounded border border-gray-300 bg-white px-2 py-1 text-xs shadow sm:block"
            style={{
              left: `${Math.min(70, Math.max(30, (ativo.x / L) * 100))}%`,
              ...(ativo.y / A > 0.5 ? { bottom: `${100 - (ativo.y / A) * 100 + 3}%` } : { top: `${(ativo.y / A) * 100 + 3}%` }),
            }}
          >
            <Detalhe local={ativo.l} nome={nome} numeros={numeros} />
          </div>
        ) : null}
      </div>
      {ativo ? (
        <div className="rounded border border-gray-300 bg-white p-2 text-xs sm:hidden" aria-hidden="true">
          <Detalhe local={ativo.l} nome={nome} numeros={numeros} />
        </div>
      ) : null}
      {locais.estado === "ok" ? (
        <>
        <ListaLocais locais={lista} semCoord={semCoord.length} foco={foco} onFoco={setFoco} nome={nome} numeros={numeros} />
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
        </>
      ) : null}
    </div>
  );
}

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

function ListaLocais({
  locais,
  semCoord,
  foco,
  onFoco,
  nome,
  numeros,
}: {
  locais: LocalVotacao[];
  numeros: number[];
  semCoord: number;
  foco: string | null;
  onFoco: (id: string | null) => void;
  nome: (n: number) => string;
}) {
  const ordenados = [...locais].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  return (
    <div className="min-w-0">
      <h3 className="text-base font-semibold text-gray-900">Locais de votação ({formatarNumero(locais.length)})</h3>
      {semCoord ? (
        <p className="text-xs text-gray-700">
          {formatarNumero(semCoord)} local(is) sem coordenadas utilizáveis no cadastro do TSE aparecem só nesta lista
          (marcados como &quot;fora do mapa&quot;).
        </p>
      ) : null}
      <div className="mt-2 max-h-[28rem] overflow-auto rounded border border-gray-300">
        <table className="w-full border-collapse text-xs sm:text-sm">
          <caption className="sr-only">Resultado por local de votação. Selecione um local para ver o detalhe.</caption>
          <thead className="sticky top-0 bg-gray-100 text-left">
            <tr>
              <th scope="col" className="px-1 py-1 sm:px-2">Local</th>
              <th scope="col" className="px-1 py-1 text-right sm:px-2">{nome(NUMERO_LULA)}</th>
              <th scope="col" className="px-1 py-1 text-right sm:px-2">{nome(NUMERO_FLAVIO)}</th>
              <th scope="col" className="hidden px-1 py-1 text-right sm:table-cell sm:px-2">Comparecimento</th>
            </tr>
          </thead>
          <tbody>
            {ordenados.map((l) => {
              const id = idLocal(l);
              const v = (n: number) => l.candidatos.find((c) => c.numero === n)?.votos ?? 0;
              return (
                <tr key={id} className={`border-t border-gray-200 align-top ${foco === id ? "bg-gray-100" : ""}`}>
                  <th scope="row" className="px-1 py-1 text-left font-normal sm:px-2">
                    <details onToggle={(e) => onFoco((e.currentTarget as HTMLDetailsElement).open ? id : null)}>
                      <summary className="cursor-pointer rounded text-gray-900 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-900">
                        {l.nome}
                        {!temCoordenadas(l) ? <span className="ml-1 text-xs text-gray-600">(fora do mapa)</span> : null}
                        {l.fora_do_municipio ? <span className="ml-1 text-xs text-gray-600">(coordenada fora do município)</span> : null}
                      </summary>
                      <div className="mt-1 rounded bg-white p-2 text-xs">
                        <Detalhe local={l} nome={nome} numeros={numeros} />
                      </div>
                    </details>
                  </th>
                  <td className="px-1 py-1 text-right tabular-nums sm:px-2">{formatarPct(pctCandidato(v(NUMERO_LULA), l.totais))}</td>
                  <td className="px-1 py-1 text-right tabular-nums sm:px-2">{formatarPct(pctCandidato(v(NUMERO_FLAVIO), l.totais))}</td>
                  <td className="hidden px-1 py-1 text-right tabular-nums sm:table-cell sm:px-2">{formatarNumero(l.totais.comparecimento)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
