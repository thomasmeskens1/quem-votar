"use client";

/**
 * Mapa coroplético (SVG, d3-geo + topojson-client). Cor = candidato mais votado;
 * intensidade = margem sobre o 2º colocado. Cada área é focável (Tab) e
 * selecionável com Enter/Espaço; a tabela ao lado é a alternativa textual.
 */
import { geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { useEffect, useMemo, useState } from "react";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { formatarPct, intensidade, lider, pctCandidato } from "../calculos";
import { COR_SEM_DADOS, corCandidato, misturar } from "../cores-eleicao";
import type { CandidatoInfo, ResultadoFilho } from "../tipos";

type Props = { uf?: string; cod_ibge?: string; nome?: string };

export interface MapaProps {
  /** Caminho público da malha (ex.: /geo/br-uf.topo.json). */
  url: string;
  objeto: "ufs" | "municipios";
  /** Filhos com resultados, indexados pela mesma chave da feição. */
  dados: Map<string, ResultadoFilho>;
  /** Chave da feição: sigla da UF (ufs) ou cod_ibge (municípios). */
  chaveDe: (p: Props) => string | undefined;
  selecionado?: string;
  onSelecionar: (chave: string, filho: ResultadoFilho) => void;
  candidatos: CandidatoInfo[];
  rotulo: string;
}

const LARGURA = 600;
const ALTURA = 560;
const cacheMalhas = new Map<string, Promise<FeatureCollection<Geometry, Props>>>();

function carregarMalha(url: string, objeto: string) {
  let p = cacheMalhas.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`malha ${url}: ${r.status}`);
        return r.json() as Promise<Topology>;
      })
      .then((topo) => {
        const obj = (topo.objects[objeto] ?? Object.values(topo.objects)[0]) as GeometryCollection<Props>;
        return feature(topo, obj) as FeatureCollection<Geometry, Props>;
      });
    p.catch(() => cacheMalhas.delete(url));
    cacheMalhas.set(url, p);
  }
  return p;
}

export function Mapa({ url, objeto, dados, chaveDe, selecionado, onSelecionar, candidatos, rotulo }: MapaProps) {
  const [carga, setCarga] = useState<{ url: string; geo?: FeatureCollection<Geometry, Props>; erro?: string } | null>(
    null,
  );
  const [foco, setFoco] = useState<{ chave: string; x: number; y: number } | null>(null);

  useEffect(() => {
    let vivo = true;
    carregarMalha(url, objeto)
      .then((g) => vivo && setCarga({ url, geo: g }))
      .catch(() => vivo && setCarga({ url, erro: "Não foi possível carregar o mapa. Use a tabela abaixo." }));
    return () => {
      vivo = false;
    };
  }, [url, objeto]);
  const geo = carga?.url === url ? (carga.geo ?? null) : null;
  const erro = carga?.url === url ? (carga.erro ?? null) : null;

  const caminhos = useMemo(() => {
    if (!geo) return [];
    const proj = geoMercator().fitSize([LARGURA, ALTURA], geo);
    const gerador = geoPath(proj);
    return geo.features.map((f: Feature<Geometry, Props>) => {
      const chave = chaveDe(f.properties ?? {}) ?? "";
      const [cx, cy] = gerador.centroid(f);
      return { chave, nome: f.properties?.nome ?? chave, d: gerador(f) ?? "", cx, cy };
    });
  }, [geo, chaveDe]);

  const nomeCand = (n: number) => candidatos.find((c) => c.numero === n)?.nome_urna ?? `Nº ${n}`;

  function cor(chave: string) {
    const f = dados.get(chave);
    const l = f ? lider(f.candidatos, f.totais) : null;
    return l ? misturar(corCandidato(l.numero), intensidade(l.margem)) : COR_SEM_DADOS;
  }

  function descricao(chave: string, nome: string) {
    const f = dados.get(chave);
    if (!f) return `${nome}: sem dados`;
    const top = f.candidatos.slice(0, 2).map((c) => `${nomeCand(c.numero)} ${formatarPct(pctCandidato(c.votos, f.totais))}`);
    return `${nome}: ${top.join(", ") || "sem votos apurados"}`;
  }

  if (erro) return <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{erro}</p>;
  if (!geo) return <div className="aspect-[15/14] w-full animate-pulse rounded bg-gray-100" aria-label="Carregando mapa" />;

  const ativo = foco ? dados.get(foco.chave) : undefined;
  const nomeAtivo = foco ? caminhos.find((c) => c.chave === foco.chave)?.nome : undefined;

  return (
    <div className="relative w-full min-w-0 overflow-hidden">
      <svg
        viewBox={`0 0 ${LARGURA} ${ALTURA}`}
        className="h-auto w-full"
        role="group"
        aria-label={rotulo}
        onMouseLeave={() => setFoco(null)}
      >
        {caminhos.map((c) => {
          const sel = c.chave === selecionado;
          const f = dados.get(c.chave);
          return (
            <path
              key={c.chave || c.nome}
              d={c.d}
              fill={cor(c.chave)}
              stroke={sel ? "#111827" : "#ffffff"}
              strokeWidth={sel ? 2 : objeto === "ufs" ? 0.8 : 0.3}
              tabIndex={f ? 0 : -1}
              role={f ? "button" : undefined}
              aria-label={descricao(c.chave, c.nome)}
              aria-pressed={f ? sel : undefined}
              className="cursor-pointer outline-none hover:opacity-80 focus-visible:stroke-black focus-visible:[stroke-width:2.5]"
              onMouseMove={() => setFoco({ chave: c.chave, x: c.cx, y: c.cy })}
              onFocus={() => setFoco({ chave: c.chave, x: c.cx, y: c.cy })}
              onBlur={() => setFoco(null)}
              onClick={() => f && onSelecionar(c.chave, f)}
              onKeyDown={(e) => {
                if (f && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onSelecionar(c.chave, f);
                }
              }}
            />
          );
        })}
      </svg>
      {foco && nomeAtivo ? (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-10 w-44 max-w-[60%] -translate-x-1/2 -translate-y-full rounded border border-gray-300 bg-white px-2 py-1 text-xs shadow"
          style={{
            // Mantém o tooltip dentro do mapa (sem estourar a largura da tela).
            left: `${Math.min(80, Math.max(20, (foco.x / LARGURA) * 100))}%`,
            top: `${Math.max(15, (foco.y / ALTURA) * 100)}%`,
          }}
        >
          <p className="font-semibold text-gray-900">{nomeAtivo}</p>
          {ativo ? (
            <ul>
              {ativo.candidatos.slice(0, 3).map((c) => (
                <li key={c.numero} className="flex justify-between gap-3">
                  <span style={{ color: corCandidato(c.numero) }}>{nomeCand(c.numero)}</span>
                  <span className="tabular-nums">{formatarPct(pctCandidato(c.votos, ativo.totais))}</span>
                </li>
              ))}
              {ativo.apuracao ? (
                <li className="text-gray-600">Seções apuradas: {formatarPct(ativo.apuracao.pct_secoes_totalizadas)}</li>
              ) : null}
            </ul>
          ) : (
            <p className="text-gray-600">Sem dados</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
