"use client";

/**
 * Município em destaque: contorno (malha do IBGE) + "pins" dos locais de votação,
 * coloridos pelo mais votado no local. Hover, toque e foco por teclado mostram o
 * detalhe do local num tooltip em portal (document.body, position fixed), sempre
 * por cima do resto da página e reposicionado para caber na janela. A lista de
 * locais (ListaLocais) é a alternativa acessível e ocupa a largura toda abaixo.
 */
import { geoMercator, geoPath } from "d3-geo";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatarPct, lider, pctCandidato } from "../calculos";
import { COR_CONTORNO, COR_DESTAQUE, COR_SEM_DADOS, COR_TRACO_CLARO, NUMERO_FLAVIO, NUMERO_LULA, tomEscala } from "../cores-eleicao";
import { idLocal, temCoordenadas, type EstadoLocais, type FocoLocal, type LocalVotacao } from "../locais";
import { carregarMalha, chaveFeicao, MALHA, type ColecaoMalha } from "../malhas";
import type { CandidatoInfo, Turno } from "../tipos";
import { DetalheLocal, votosNoLocal } from "./DetalheLocal";
import { movimentoReduzido } from "./Mapa";

export interface MapaLocaisProps {
  turno: Turno;
  uf: string;
  codIbge?: string;
  nomeMunicipio: string;
  candidatos: CandidatoInfo[];
  locais: EstadoLocais;
  foco: FocoLocal | null;
  onFoco: (f: FocoLocal | null) => void;
}

const L = 600;
const A = 520;
const LARG_TOOLTIP = 272;
const MARGEM = 8;

/** Posiciona o tooltip (fixed) junto ao pin, sem sair da janela. */
function posicionar(el: HTMLDivElement | null, ancora: Element | null) {
  if (!el || !ancora) return;
  const r = ancora.getBoundingClientRect();
  const h = el.offsetHeight;
  const w = Math.min(LARG_TOOLTIP, window.innerWidth - 2 * MARGEM);
  const left = Math.min(Math.max(MARGEM, r.left + r.width / 2 - w / 2), window.innerWidth - w - MARGEM);
  const acima = r.top - h - MARGEM;
  const top = acima >= MARGEM ? acima : Math.max(MARGEM, Math.min(r.bottom + MARGEM, window.innerHeight - h - MARGEM));
  el.style.width = `${w}px`;
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
  el.style.visibility = "visible";
}

export function MapaLocais({ turno, uf, codIbge, nomeMunicipio, candidatos, locais, foco, onFoco }: MapaLocaisProps) {
  const [malha, setMalha] = useState<{ uf: string; geo: ColecaoMalha } | null>(null);
  const [pronto, setPronto] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
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

  // O tooltip é fixo na janela: some ao rolar a página ou redimensionar.
  const tooltipAberto = foco?.origem === "mapa";
  useEffect(() => {
    if (!tooltipAberto) return;
    const fechar = () => onFoco(null);
    window.addEventListener("scroll", fechar, { passive: true, capture: true });
    window.addEventListener("resize", fechar);
    return () => {
      window.removeEventListener("scroll", fechar, { capture: true });
      window.removeEventListener("resize", fechar);
    };
  }, [tooltipAberto, onFoco]);

  const nome = (n: number) => candidatos.find((c) => c.numero === n)?.nome_urna ?? `Nº ${n}`;
  const numeros = candidatos.map((c) => c.numero);
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
  const ativo = tooltipAberto ? pins.find((p) => idLocal(p.l) === foco.id) : undefined;
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
        className="w-full min-w-0 rounded border border-gray-200 bg-gray-50"
        style={{
          opacity: pronto || reduzido ? 1 : 0,
          transform: pronto || reduzido ? "scale(1)" : "scale(0.94)",
          transition: reduzido ? "none" : "opacity 450ms ease-out, transform 450ms ease-out",
        }}
      >
        {desenho ? (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${L} ${A}`}
            className="h-auto w-full"
            role="group"
            aria-label={`Mapa de ${nomeMunicipio} com ${pins.length} locais de votação. Use Tab para percorrer os locais; a lista completa está abaixo.`}
            onMouseLeave={() => tooltipAberto && onFoco(null)}
          >
            <path d={desenho.d} fill={COR_TRACO_CLARO} stroke={COR_CONTORNO} strokeWidth={1.2} aria-hidden="true" />
            {pins.map(({ l, x, y, r }) => {
              const ld = lider(l.candidatos, l.totais);
              const id = idLocal(l);
              const destacado = foco?.id === id;
              return (
                <circle
                  key={id}
                  data-local={id}
                  cx={x}
                  cy={y}
                  r={r}
                  fill={ld ? tomEscala(ld.numero, 2) : COR_SEM_DADOS}
                  fillOpacity={0.85}
                  stroke={destacado ? COR_DESTAQUE : COR_TRACO_CLARO}
                  strokeWidth={destacado ? 2.5 : 1}
                  tabIndex={0}
                  role="img"
                  aria-label={`${l.nome}: ${nome(NUMERO_LULA)} ${formatarPct(pctCandidato(votosNoLocal(l, NUMERO_LULA), l.totais))}, ${nome(NUMERO_FLAVIO)} ${formatarPct(pctCandidato(votosNoLocal(l, NUMERO_FLAVIO), l.totais))}`}
                  className="cursor-pointer outline-none"
                  onMouseEnter={() => onFoco({ id, origem: "mapa" })}
                  onFocus={() => onFoco({ id, origem: "mapa" })}
                  onClick={() => onFoco({ id, origem: "mapa" })}
                  onBlur={() => tooltipAberto && onFoco(null)}
                />
              );
            })}
          </svg>
        ) : (
          <div className="w-full animate-pulse bg-gray-100" style={{ aspectRatio: `${L}/${A}` }}>
            <span className="sr-only">Carregando mapa do município</span>
          </div>
        )}
      </div>
      {ativo
        ? createPortal(
            <div
              role="tooltip"
              ref={(el) => posicionar(el, svgRef.current?.querySelector(`[data-local="${idLocal(ativo.l)}"]`) ?? null)}
              className="pointer-events-none fixed z-[1000] max-h-[80vh] overflow-auto rounded border border-gray-300 bg-white px-2 py-1 text-xs shadow-lg"
              style={{ visibility: "hidden", left: 0, top: 0, width: LARG_TOOLTIP }}
            >
              <DetalheLocal local={ativo.l} nome={nome} numeros={numeros} modo="resumo" />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
