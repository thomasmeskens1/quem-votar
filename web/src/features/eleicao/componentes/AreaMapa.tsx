"use client";

/**
 * Área do mapa do painel: escolhe a malha conforme o nível (Brasil → UF →
 * município com locais de votação; Exterior → mapa-múndi → país em destaque),
 * mostra o botão "← Voltar", a legenda e a fonte da malha.
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FonteLink } from "@/components/FonteLink";
import type { Abrangencia } from "../abrangencia";
import { COR_OUTROS, COR_SEM_DADOS, corCandidato, FAIXAS_MAPA, NUMERO_FLAVIO, NUMERO_LULA, tomEscala } from "../cores-eleicao";
import type { EstadoLocais, FocoLocal } from "../locais";
import { carregarPaisesTse, MALHA } from "../malhas";
import { NOME_UF } from "../tse/config";
import type { CandidatoInfo, ResultadoAbrangencia, ResultadoFilho, Turno } from "../tipos";
import { Mapa } from "./Mapa";
import { MapaLocais } from "./MapaLocais";

function Legenda({ numeros, nome }: { numeros: number[]; nome: (n: number) => string }) {
  // 13 e 22 têm cor própria; os demais candidatos compartilham um cinza escuro.
  const itens = [NUMERO_LULA, NUMERO_FLAVIO]
    .filter((n) => numeros.includes(n))
    .map((n) => ({ chave: String(n), numero: n, rotulo: nome(n), cor: corCandidato(n) }));
  const haOutros = numeros.some((n) => n !== NUMERO_LULA && n !== NUMERO_FLAVIO);
  return (
    <div className="mt-2 space-y-1 text-xs text-gray-800" aria-label="Legenda do mapa">
      {itens.map((it) => (
        <div key={it.chave} className="flex flex-wrap items-center gap-1">
          <span className="w-full font-semibold sm:w-32" style={{ color: it.cor }}>{it.rotulo}</span>
          {FAIXAS_MAPA.map((f, i) => (
            <span key={f.rotulo} className="flex items-center gap-1">
              <span
                className="inline-block h-3 w-5 rounded-sm border border-gray-300"
                style={{ backgroundColor: tomEscala(it.numero, i) }}
                aria-hidden="true"
              />
              <span className="mr-2">{f.rotulo}</span>
            </span>
          ))}
        </div>
      ))}
      {haOutros ? (
        <p className="flex items-center gap-1">
          <span className="inline-block h-3 w-5 rounded-sm border border-gray-300" style={{ backgroundColor: COR_OUTROS }} aria-hidden="true" />
          Outros candidatos (qualquer margem)
        </p>
      ) : null}
      <p className="flex items-center gap-1">
        <span className="inline-block h-3 w-5 rounded-sm border border-gray-300" style={{ backgroundColor: COR_SEM_DADOS }} aria-hidden="true" />
        Sem dados (ou sem eleitores) — não interativo.
      </p>
      <p>Cor: candidato mais votado; intensidade: vantagem (em pontos percentuais) sobre o 2º colocado.</p>
    </div>
  );
}

function usePaisesTse(ativo: boolean): Map<string, string> | null {
  const [m, setM] = useState<Map<string, string> | null>(null);
  useEffect(() => {
    if (!ativo) return;
    let vivo = true;
    carregarPaisesTse().then((x) => vivo && setM(x));
    return () => {
      vivo = false;
    };
  }, [ativo]);
  return m;
}

export interface AreaMapaProps {
  turno: Turno;
  abr: Abrangencia;
  /** Dados da abrangência do mapa (com filhos). */
  dados: ResultadoAbrangencia;
  info: CandidatoInfo[];
  /** Entrar num filho (estado, município, país). */
  onEntrar: (f: ResultadoFilho) => void;
  voltar: { rotulo: string; acao: () => void } | null;
  /** Área de onde o usuário voltou (para a animação de afastar). */
  voltouDe: Abrangencia | null;
  /** Locais de votação do município aberto (nível MUN). */
  locais: EstadoLocais | null;
  focoLocal: FocoLocal | null;
  onFocoLocal: (f: FocoLocal | null) => void;
}

export function AreaMapa(props: AreaMapaProps) {
  const { turno, abr, dados, info, onEntrar, voltar, voltouDe, locais, focoLocal, onFocoLocal } = props;
  const exterior = abr.nivel === "EXTERIOR" || abr.nivel === "PAIS" || abr.nivel === "CIDADE";
  const paises = usePaisesTse(exterior);
  const nome = (n: number) => info.find((c) => c.numero === n)?.nome_urna ?? `Nº ${n}`;
  const filhos = useMemo(() => dados.filhos ?? [], [dados]);

  const config = useMemo(() => {
    if (abr.nivel === "BR") {
      const m = new Map(filhos.filter((f) => f.codigo !== "ZZ").map((f) => [f.codigo, f] as const));
      return { ...MALHA.brasil, dados: m, somente: undefined, clicavel: true, rotulo: "estado" };
    }
    if (abr.nivel === "UF") {
      const m = new Map(filhos.filter((f) => f.cod_ibge).map((f) => [f.cod_ibge as string, f] as const));
      return { ...MALHA.uf(abr.uf), dados: m, somente: undefined, clicavel: true, rotulo: "município" };
    }
    if (!paises) return null;
    if (abr.nivel === "EXTERIOR") {
      const m = new Map<string, ResultadoFilho>();
      for (const f of filhos) {
        const iso = paises.get(f.codigo);
        if (iso && f.totais.eleitores_aptos > 0) m.set(iso, f);
      }
      return { ...MALHA.mundo, dados: m, somente: undefined, clicavel: true, rotulo: "país" };
    }
    if (abr.nivel === "PAIS" || abr.nivel === "CIDADE") {
      const iso = paises.get(abr.pais);
      if (!iso) return { semMapa: true as const };
      const pais: ResultadoFilho = { codigo: abr.pais, nome: abr.pais, totais: dados.totais, candidatos: dados.candidatos, apuracao: dados.apuracao };
      return { ...MALHA.mundo, dados: new Map([[iso, pais]]), somente: iso, clicavel: false, rotulo: "país" };
    }
    return null;
  }, [abr, filhos, paises, dados]);

  // Chave (no mapa atual) da área de onde se voltou: UF, cod_ibge ou ISO do país.
  let zoomDe: string | undefined;
  if (voltouDe?.nivel === "UF" && abr.nivel === "BR") zoomDe = voltouDe.uf;
  if (voltouDe?.nivel === "MUN" && abr.nivel === "UF") zoomDe = filhos.find((f) => f.codigo === voltouDe.municipio)?.cod_ibge;
  if (voltouDe?.nivel === "PAIS" && abr.nivel === "EXTERIOR") zoomDe = paises?.get(voltouDe.pais);

  const lideres = [...new Set(filhos.map((f) => f.candidatos[0]?.numero).filter((n): n is number => !!n))];

  let mapa: ReactNode = null;
  if (abr.nivel === "MUN") {
    const f = filhos.find((x) => x.codigo === abr.municipio);
    mapa = (
      <MapaLocais
        key={`${turno}-${abr.uf}-${abr.municipio}`}
        turno={turno}
        uf={abr.uf}
        codIbge={f?.cod_ibge}
        nomeMunicipio={f?.nome ?? abr.municipio}
        candidatos={info}
        locais={locais ?? { estado: "carregando" }}
        foco={focoLocal}
        onFoco={onFocoLocal}
      />
    );
  } else if (config && "semMapa" in config) {
    mapa = (
      <p className="rounded border border-gray-300 bg-gray-50 p-3 text-sm text-gray-800">
        Sem mapa para este grupo: o país destas cidades não foi identificado. Veja as cidades na tabela.
      </p>
    );
  } else if (config) {
    mapa = (
      <Mapa
        key={`${config.url}-${config.somente ?? ""}`}
        url={config.url}
        objeto={config.objeto}
        tipo={config.tipo}
        dados={config.dados}
        somente={config.somente}
        zoomDe={zoomDe}
        onSelecionar={config.clicavel ? (_, f) => onEntrar(f) : undefined}
        candidatos={info}
        rotulo={
          config.clicavel
            ? `Mapa: candidato mais votado por ${config.rotulo} em ${dados.nome}. Use Tab para percorrer e Enter para entrar.`
            : `Mapa de ${dados.nome} em destaque, colorido pelo candidato mais votado.`
        }
      />
    );
  } else {
    mapa = <div className="aspect-[15/13] w-full animate-pulse rounded bg-gray-100" />;
  }

  const fonteMalha = exterior
    ? { href: "https://www.naturalearthdata.com/", texto: "Natural Earth (domínio público)" }
    : { href: "https://servicodados.ibge.gov.br/api/docs/malhas?versao=3", texto: "IBGE, malha municipal 2022 (MT: malha 2025)" };

  return (
    <div className="min-w-0 space-y-2">
      {voltar ? (
        <button
          type="button"
          onClick={voltar.acao}
          className="inline-flex items-center gap-1 rounded border border-gray-400 bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-900"
        >
          <span aria-hidden="true">←</span> Voltar para {voltar.rotulo}
        </button>
      ) : null}
      {mapa}
      {abr.nivel !== "MUN" ? <Legenda numeros={abr.nivel === "PAIS" || abr.nivel === "CIDADE" ? [dados.candidatos[0]?.numero ?? 0] : lideres} nome={nome} /> : null}
      <p className="text-xs text-gray-700">
        Malha:{" "}
        <FonteLink href={fonteMalha.href} tipo={exterior ? "externo" : "oficial"}>
          {fonteMalha.texto}
        </FonteLink>
        {abr.nivel === "UF" || abr.nivel === "MUN" ? ` · ${NOME_UF[abr.uf]}` : ""}
      </p>
    </div>
  );
}
