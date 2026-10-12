"use client";

/**
 * Mapa coroplético (SVG, d3-geo + topojson-client). Cor = candidato mais votado;
 * intensidade = margem sobre o 2º colocado (só nos tons dos candidatos). Áreas
 * com dados são focáveis (Tab) e selecionáveis com Enter/Espaço; áreas sem dados
 * ficam em cinza e não são interativas. Ao selecionar, o mapa "entra" na área
 * com uma animação de zoom (desligada com prefers-reduced-motion). A tabela ao
 * lado é a alternativa textual.
 */
import { geoArea, geoMercator, geoNaturalEarth1, geoPath } from "d3-geo";
import type { Feature, Geometry, MultiPolygon } from "geojson";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatarPct, lider, pctCandidato } from "../calculos";
import { COR_DESTAQUE, COR_SEM_DADOS, COR_TRACO_CLARO, corCandidato, corMapa } from "../cores-eleicao";
import { carregarMalha, chaveFeicao, nomeFeicao, type ColecaoMalha, type TipoMalha } from "../malhas";
import type { CandidatoInfo, ResultadoFilho } from "../tipos";
import { EstiloRealce, estiloRealce, useRealce } from "./Realce";

export interface MapaProps {
  url: string;
  objeto: string;
  tipo: TipoMalha;
  /** Resultados indexados pela chave da feição (UF, cod_ibge ou ISO-3). */
  dados: Map<string, ResultadoFilho>;
  /** Mostra só esta feição, ampliada (país ou município em destaque). */
  somente?: string;
  selecionado?: string;
  /** Sem esta função, o mapa não tem clique (só tooltip). */
  onSelecionar?: (chave: string, filho: ResultadoFilho) => void;
  /** Ao montar, começa ampliado nesta feição e se afasta (animação de "voltar"). */
  zoomDe?: string;
  candidatos: CandidatoInfo[];
  rotulo: string;
}

const LARGURA = 600;
const DURACAO_MS = 600;
type Transf = { tx: number; ty: number; k: number };
const IDENTIDADE: Transf = { tx: 0, ty: 0, k: 1 };

/**
 * Para enquadrar um país em destaque: só as partes com pelo menos 10% da área
 * da maior (ex.: Portugal continental sem Açores/Madeira); o resto é desenhado,
 * mas não define o enquadramento.
 */
function principal(f: Feature<Geometry, Record<string, unknown>>): Feature<Geometry, Record<string, unknown>> {
  if (f.geometry?.type !== "MultiPolygon") return f;
  const partes = (f.geometry as MultiPolygon).coordinates.map((c) => ({
    c,
    a: geoArea({ type: "Polygon", coordinates: c }),
  }));
  const max = Math.max(...partes.map((p) => p.a));
  return { ...f, geometry: { type: "MultiPolygon", coordinates: partes.filter((p) => p.a >= 0.1 * max).map((p) => p.c) } };
}

export const movimentoReduzido = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function Mapa(props: MapaProps) {
  const { url, objeto, tipo, dados, somente, selecionado, onSelecionar, zoomDe, candidatos, rotulo } = props;
  const [carga, setCarga] = useState<{ url: string; geo?: ColecaoMalha; erro?: string } | null>(null);
  const [foco, setFoco] = useState<{ chave: string; x: number; y: number } | null>(null);
  const [alvo, setAlvo] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    let vivo = true;
    carregarMalha(url, objeto)
      .then((g) => vivo && setCarga({ url, geo: g }))
      .catch(() => vivo && setCarga({ url, erro: "Não foi possível carregar o mapa. Use a tabela." }));
    return () => {
      vivo = false;
    };
  }, [url, objeto]);
  const geo = carga?.url === url ? (carga.geo ?? null) : null;
  const erro = carga?.url === url ? (carga.erro ?? null) : null;

  const mundo = tipo === "paises" && !somente;
  const altura = mundo ? 330 : 520;

  const caminhos = useMemo(() => {
    if (!geo) return [];
    const feicoes = somente ? geo.features.filter((f) => chaveFeicao(tipo, f) === somente) : geo.features;
    if (!feicoes.length) return [];
    const colecao = { type: "FeatureCollection" as const, features: somente ? feicoes.map(principal) : feicoes };
    const proj = (mundo ? geoNaturalEarth1() : geoMercator()).fitSize([LARGURA, altura], colecao);
    const gerador = geoPath(proj);
    return feicoes.map((f) => {
      const chave = chaveFeicao(tipo, f) ?? "";
      const [cx, cy] = gerador.centroid(f);
      const [[x0, y0], [x1, y1]] = gerador.bounds(f);
      return { chave, nome: nomeFeicao(f) ?? chave, d: gerador(f) ?? "", cx, cy, caixa: { x0, y0, x1, y1 } };
    });
  }, [geo, somente, tipo, mundo, altura]);

  // Dispara a transição de entrada (fade/zoom de volta) depois do primeiro desenho.
  useEffect(() => {
    if (!caminhos.length) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setPronto(true)));
    return () => cancelAnimationFrame(id);
  }, [caminhos.length]);
  useEffect(() => () => clearTimeout(timer.current), []);
  // "Grow up" da área em foco (só áreas com dados; nunca durante o zoom de entrada).
  const realce = useRealce(!alvo && foco && dados.has(foco.chave) ? foco.chave : null);

  function transfPara(chave: string | null | undefined): Transf {
    const c = chave ? caminhos.find((x) => x.chave === chave) : undefined;
    if (!c) return IDENTIDADE;
    const { x0, y0, x1, y1 } = c.caixa;
    const k = Math.min(20, 0.9 / Math.max((x1 - x0) / LARGURA, (y1 - y0) / altura, 1e-6));
    return { k, tx: LARGURA / 2 - k * ((x0 + x1) / 2), ty: altura / 2 - k * ((y0 + y1) / 2) };
  }

  const nomeCand = (n: number) => candidatos.find((c) => c.numero === n)?.nome_urna ?? `Nº ${n}`;

  function cor(chave: string) {
    const f = dados.get(chave);
    const l = f ? lider(f.candidatos, f.totais) : null;
    return l ? corMapa(l.numero, l.margem) : COR_SEM_DADOS;
  }

  function descricao(nome: string, f: ResultadoFilho) {
    const top = f.candidatos.slice(0, 2).map((c) => `${nomeCand(c.numero)} ${formatarPct(pctCandidato(c.votos, f.totais))}`);
    return `${nome}: ${top.join(", ") || "sem votos apurados"}`;
  }

  function escolher(chave: string, f: ResultadoFilho) {
    if (!onSelecionar || alvo) return;
    setFoco(null);
    if (movimentoReduzido()) return onSelecionar(chave, f);
    setAlvo(chave);
    timer.current = setTimeout(() => {
      onSelecionar(chave, f);
      // Fica ampliado até o próximo nível chegar (o mapa é trocado); se não chegar, volta.
      timer.current = setTimeout(() => setAlvo(null), 8000);
    }, DURACAO_MS);
  }

  if (erro) return <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{erro}</p>;
  if (!geo) {
    return (
      <div className="w-full animate-pulse rounded bg-gray-100" style={{ aspectRatio: `${LARGURA}/${altura}` }}>
        <span className="sr-only">Carregando mapa</span>
      </div>
    );
  }
  if (!caminhos.length) return <p className="text-sm text-gray-700">Contorno indisponível para esta área.</p>;

  const reduzido = movimentoReduzido();
  const t = alvo ? transfPara(alvo) : !pronto && zoomDe ? transfPara(zoomDe) : IDENTIDADE;
  const estiloGrupo = {
    transform: `translate(${t.tx}px, ${t.ty}px) scale(${t.k})`,
    transformOrigin: "0 0",
    transition: pronto && !reduzido ? `transform ${DURACAO_MS}ms ease-in-out` : "none",
  };
  const entrada = {
    opacity: pronto || zoomDe || reduzido ? 1 : 0,
    transition: reduzido ? "none" : "opacity 400ms ease-out",
  };
  const ativo = foco ? dados.get(foco.chave) : undefined;
  const nomeAtivo = foco ? caminhos.find((c) => c.chave === foco.chave)?.nome : undefined;

  return (
    <div className="relative w-full min-w-0 overflow-hidden" style={entrada}>
      <svg viewBox={`0 0 ${LARGURA} ${altura}`} className="h-auto w-full" role="group" aria-label={rotulo} onMouseLeave={() => setFoco(null)}>
        <EstiloRealce />
        <g style={estiloGrupo}>
          {caminhos.map((c) => {
            const f = dados.get(c.chave);
            const sel = c.chave === selecionado;
            const apagado = alvo && c.chave !== alvo;
            const traco = sel ? COR_DESTAQUE : COR_TRACO_CLARO;
            if (!f) {
              return (
                <path key={c.chave || c.nome} d={c.d} fill={COR_SEM_DADOS} stroke={COR_TRACO_CLARO} strokeWidth={0.5}
                  vectorEffect="non-scaling-stroke" aria-hidden="true" style={{ pointerEvents: "none" }} />
              );
            }
            const interativo = !!onSelecionar;
            return (
              <path
                key={c.chave || c.nome}
                d={c.d}
                fill={cor(c.chave)}
                stroke={traco}
                strokeWidth={sel ? 2 : tipo === "municipios" ? 0.4 : 0.8}
                vectorEffect="non-scaling-stroke"
                tabIndex={0}
                role={interativo ? "button" : "img"}
                aria-label={descricao(c.nome, f)}
                aria-pressed={interativo ? sel : undefined}
                style={{ opacity: apagado ? 0.25 : 1, transition: reduzido ? undefined : "opacity 400ms" }}
                className={`outline-none focus-visible:stroke-black focus-visible:[stroke-width:2.5] ${interativo ? "cursor-pointer hover:brightness-110" : ""}`}
                onMouseMove={() => !alvo && setFoco({ chave: c.chave, x: c.cx, y: c.cy })}
                onFocus={() => !alvo && setFoco({ chave: c.chave, x: c.cx, y: c.cy })}
                onBlur={() => setFoco(null)}
                onClick={() => escolher(c.chave, f)}
                onKeyDown={(e) => {
                  if (interativo && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    escolher(c.chave, f);
                  }
                }}
              />
            );
          })}
          {(["saindo", "entrando"] as const).map((fase) => {
            const chave = realce[fase];
            const c = chave ? caminhos.find((x) => x.chave === chave) : undefined;
            if (!c) return null;
            return (
              <path
                key={`${fase}-${c.chave}`}
                d={c.d}
                fill={cor(c.chave)}
                stroke={COR_DESTAQUE}
                strokeWidth={1.5}
                vectorEffect="non-scaling-stroke"
                aria-hidden="true"
                style={estiloRealce(fase, tipo === "ufs" || mundo ? 1.08 : 1.12, reduzido)}
              />
            );
          })}
        </g>
      </svg>
      {foco && nomeAtivo && ativo ? (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-10 w-44 max-w-[60%] -translate-x-1/2 -translate-y-full rounded border border-gray-300 bg-white px-2 py-1 text-xs shadow"
          style={{
            left: `${Math.min(80, Math.max(20, (foco.x / LARGURA) * 100))}%`,
            top: `${Math.max(15, (foco.y / altura) * 100)}%`,
          }}
        >
          <p className="font-semibold text-gray-900">{nomeAtivo}</p>
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
        </div>
      ) : null}
    </div>
  );
}
