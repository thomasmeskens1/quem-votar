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
import { formatarPct, lider, pctCandidato } from "../calculos";
import { COR_CONTORNO, COR_DESTAQUE, COR_SEM_DADOS, COR_TRACO_CLARO, NUMERO_FLAVIO, NUMERO_LULA, tomEscala } from "../cores-eleicao";
import { idLocal, temCoordenadas, type EstadoLocais, type FocoLocal, type LocalVotacao } from "../locais";
import { carregarMalha, chaveFeicao, MALHA, type ColecaoMalha } from "../malhas";
import type { CandidatoInfo, Turno } from "../tipos";
import { DetalheLocal, votosNoLocal } from "./DetalheLocal";
import { movimentoReduzido } from "./Mapa";
import { EstiloRealce, estiloRealce, useRealce } from "./Realce";
import { TooltipFixo } from "./TooltipFixo";

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

  // Tooltip: hover/foco no pin ou hover/foco na linha da tabela de locais.
  const tooltipAberto = foco?.origem === "mapa" || foco?.origem === "tabela";

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
  const realce = useRealce(foco?.id ?? null);

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
            onMouseLeave={() => foco?.origem === "mapa" && onFoco(null)}
          >
            <EstiloRealce />
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
                  onBlur={() => foco?.origem === "mapa" && onFoco(null)}
                />
              );
            })}
            {(["saindo", "entrando"] as const).map((fase) => {
              const id = realce[fase];
              const p = id ? pins.find((x) => idLocal(x.l) === id) : undefined;
              if (!p) return null;
              const ld = lider(p.l.candidatos, p.l.totais);
              return (
                <circle
                  key={`${fase}-${id}`}
                  cx={p.x}
                  cy={p.y}
                  r={p.r}
                  fill={ld ? tomEscala(ld.numero, 2) : COR_SEM_DADOS}
                  stroke={COR_DESTAQUE}
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                  aria-hidden="true"
                  style={estiloRealce(fase, 1.5, reduzido)}
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
      {ativo ? (
        <TooltipFixo ancora={() => svgRef.current?.querySelector(`[data-local="${idLocal(ativo.l)}"]`) ?? null}>
          <DetalheLocal local={ativo.l} nome={nome} numeros={numeros} modo="resumo" />
        </TooltipFixo>
      ) : null}
    </div>
  );
}
