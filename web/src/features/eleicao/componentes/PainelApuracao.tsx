"use client";

/** Painel de apuração (inspirado no painel de TV): seletores, mapa, cartões, comparativo e fonte. */
import { useCallback, useMemo, useState } from "react";
import { FonteLink } from "@/components/FonteLink";
import type { Abrangencia } from "../abrangencia";
import { FAIXAS_MARGEM, intensidade } from "../calculos";
import { somar } from "../tse/normalizar";
import { useFilhosDiretos } from "../useFilhosDiretos";
import { COR_OUTROS, corCandidato, misturar, NUMERO_FLAVIO, NUMERO_LULA } from "../cores-eleicao";
import { NOME_UF } from "../tse/config";
import type { Apuracao, CandidatoVotos, ResultadoAbrangencia, ResultadoFilho, Totais, Turno } from "../tipos";
import { useResultado } from "../useResultado";
import { Apurado, Cartoes } from "./Cartoes";
import { Comparativo } from "./Comparativo";
import { FonteDados } from "./FonteDados";
import { Mapa } from "./Mapa";
import { Seletores } from "./Seletores";
import { Tabela } from "./Tabela";

const COLUNAS = [NUMERO_LULA, NUMERO_FLAVIO];
const PAIS_LACUNA = "País não identificado";

interface Recorte {
  nome: string;
  totais: Totais;
  candidatos: CandidatoVotos[];
  apuracao?: Apuracao;
}

/** Abrangência que traz os filhos usados pelo mapa/tabela. */
function nivelMapa(abr: Abrangencia): Abrangencia {
  if (abr.nivel === "MUN") return { nivel: "UF", uf: abr.uf };
  if (abr.nivel === "CIDADE") return { nivel: "PAIS", pais: abr.pais };
  return abr;
}

function recorte(d: ResultadoAbrangencia | null, abr: Abrangencia): Recorte | null {
  if (!d) return null;
  if (abr.nivel === "MUN" || abr.nivel === "CIDADE") {
    const cod = abr.nivel === "MUN" ? abr.municipio : abr.cidade;
    const f = d.filhos?.find((x) => x.codigo === cod);
    if (!f) return null;
    return { ...f, nome: abr.nivel === "MUN" ? `${f.nome} (${abr.uf})` : `${f.nome} (${abr.pais})` };
  }
  return d;
}

function Legenda({ numeros, nome }: { numeros: number[]; nome: (n: number) => string }) {
  // 13 e 22 têm cor própria; os demais candidatos compartilham o cinza neutro.
  const itens = [NUMERO_LULA, NUMERO_FLAVIO]
    .filter((n) => numeros.includes(n))
    .map((n) => ({ chave: String(n), rotulo: nome(n), cor: corCandidato(n) }));
  if (numeros.some((n) => n !== NUMERO_LULA && n !== NUMERO_FLAVIO)) {
    itens.push({ chave: "outros", rotulo: "Outros candidatos", cor: COR_OUTROS });
  }
  return (
    <div className="mt-2 space-y-1 text-xs text-gray-800" aria-label="Legenda do mapa">
      {itens.map((it) => (
        <div key={it.chave} className="flex flex-wrap items-center gap-1">
          <span className="w-full font-semibold sm:w-32" style={{ color: it.cor }}>{it.rotulo}</span>
          {FAIXAS_MARGEM.map((f) => (
            <span key={f.rotulo} className="flex items-center gap-1">
              <span
                className="inline-block h-3 w-5 rounded-sm border border-gray-300"
                style={{ backgroundColor: misturar(it.cor, intensidade(f.margem)) }}
                aria-hidden="true"
              />
              <span className="mr-2">{f.rotulo}</span>
            </span>
          ))}
        </div>
      ))}
      <p>Cor: candidato mais votado; intensidade: vantagem (em pontos percentuais) sobre o 2º colocado. Cinza: sem dados.</p>
    </div>
  );
}

export function PainelApuracao() {
  // null = automático: mostra o 2º turno assim que o TSE tiver seções totalizadas.
  const [turnoManual, setTurno] = useState<Turno | null>(null);
  const [abr, setAbr] = useState<Abrangencia>({ nivel: "BR" });

  const abrMapa = useMemo(() => nivelMapa(abr), [abr]);
  const exterior = abr.nivel === "EXTERIOR" || abr.nivel === "PAIS" || abr.nivel === "CIDADE";

  // O 2º turno só é buscado em profundidade quando o TSE já tem seções totalizadas.
  const r2br = useResultado(2, { nivel: "BR" });
  const iniciou2 =
    !!r2br.dados && (r2br.dados.fonte.tipo === "estatico" || (r2br.dados.apuracao?.secoes_totalizadas ?? 0) > 0);
  const r1 = useResultado(1, abrMapa);
  const r2prof = useResultado(2, iniciou2 && abrMapa.nivel !== "BR" ? abrMapa : null);
  const r2 = abrMapa.nivel === "BR" ? r2br : r2prof;
  const listaPaises = useResultado(1, exterior ? { nivel: "EXTERIOR" } : null);

  const turnoEscolhido: Turno = turnoManual ?? (iniciou2 ? 2 : 1);
  const turno: Turno = turnoEscolhido === 2 && iniciou2 ? 2 : 1;
  const atual = turno === 2 ? r2 : r1;
  // Ao vivo, municípios/cidades da área aberta são lidos pelo navegador direto no TSE.
  const diretos = useFilhosDiretos(atual.dados, abrMapa.nivel === "EXTERIOR");
  const dados = useMemo(() => {
    const d = atual.dados;
    if (!d?.pendentes) return d;
    const filhosLidos = diretos.filhos ?? [];
    if (!d.totais_dos_filhos) return { ...d, filhos: filhosLidos };
    const s = somar(filhosLidos);
    return { ...d, filhos: filhosLidos, totais: s.totais, candidatos: s.candidatos, apuracao: s.apuracao };
  }, [atual.dados, diretos.filhos]);
  const vista = recorte(dados, abr);
  const info = useMemo(
    () => (dados?.candidatos_info.length ? dados.candidatos_info : (r1.dados?.candidatos_info ?? [])),
    [dados, r1.dados],
  );
  const nome = useCallback((n: number) => info.find((c) => c.numero === n)?.nome_urna ?? `Nº ${n}`, [info]);

  const escolherFilho = useCallback(
    (f: ResultadoFilho) => {
      if (abrMapa.nivel === "BR") setAbr(f.codigo === "ZZ" ? { nivel: "EXTERIOR" } : { nivel: "UF", uf: f.codigo });
      else if (abrMapa.nivel === "UF") setAbr({ nivel: "MUN", uf: abrMapa.uf, municipio: f.codigo });
      else if (abrMapa.nivel === "EXTERIOR") setAbr({ nivel: "PAIS", pais: f.codigo });
      else if (abrMapa.nivel === "PAIS") setAbr({ nivel: "CIDADE", pais: abrMapa.pais, cidade: f.codigo });
    },
    [abrMapa],
  );

  const filhos = useMemo(() => dados?.filhos ?? [], [dados]);
  const mapa = useMemo(() => {
    if (abrMapa.nivel === "BR") {
      const m = new Map(filhos.filter((f) => f.codigo !== "ZZ").map((f) => [f.codigo, f] as const));
      return { url: "/geo/br-uf.topo.json", objeto: "ufs" as const, dados: m, sel: undefined };
    }
    if (abrMapa.nivel === "UF") {
      const m = new Map(filhos.filter((f) => f.cod_ibge).map((f) => [f.cod_ibge as string, f] as const));
      const sel = abr.nivel === "MUN" ? filhos.find((f) => f.codigo === abr.municipio)?.cod_ibge : undefined;
      return { url: `/geo/municipios/${abrMapa.uf}.topo.json`, objeto: "municipios" as const, dados: m, sel };
    }
    return null;
  }, [abrMapa, abr, filhos]);
  const chaveDe = useCallback(
    (p: { uf?: string; cod_ibge?: string }) => (mapa?.objeto === "ufs" ? p.uf : p.cod_ibge),
    [mapa?.objeto],
  );

  const migalhas: Array<{ rotulo: string; abr: Abrangencia }> = [{ rotulo: "Brasil", abr: { nivel: "BR" } }];
  if (abr.nivel === "UF" || abr.nivel === "MUN") migalhas.push({ rotulo: NOME_UF[abr.uf], abr: { nivel: "UF", uf: abr.uf } });
  if (exterior) migalhas.push({ rotulo: "Exterior", abr: { nivel: "EXTERIOR" } });
  if (abr.nivel === "PAIS" || abr.nivel === "CIDADE") migalhas.push({ rotulo: abr.pais, abr: { nivel: "PAIS", pais: abr.pais } });
  if (vista && (abr.nivel === "MUN" || abr.nivel === "CIDADE")) migalhas.push({ rotulo: vista.nome, abr });

  const rotuloFilho = { BR: "Estado", UF: "Município", EXTERIOR: "País", PAIS: "Cidade" }[abrMapa.nivel as "BR"] ?? "Área";
  const aguardando2 = !iniciou2;
  const recorte1 = recorte(r1.dados, abr);
  const recorte2 = !iniciou2 ? null : turno === 2 ? recorte(dados, abr) : recorte(r2.dados, abr);

  return (
    <div className="min-w-0 space-y-6">
      <Seletores
        turno={turnoEscolhido}
        onTurno={setTurno}
        abr={abr}
        onAbr={setAbr}
        municipios={abrMapa.nivel === "UF" ? (atual.dados?.pendentes ?? filhos) : []}
        paises={listaPaises.dados?.filhos ?? []}
        cidades={abrMapa.nivel === "PAIS" ? (atual.dados?.pendentes ?? filhos) : []}
      />

      <nav aria-label="Abrangência selecionada" className="text-sm">
        <ol className="flex flex-wrap gap-1">
          {migalhas.map((m, i) => (
            <li key={m.rotulo + i} className="flex items-center gap-1">
              {i > 0 ? <span aria-hidden="true">›</span> : null}
              {i < migalhas.length - 1 ? (
                <button type="button" className="text-blue-800 underline underline-offset-2" onClick={() => setAbr(m.abr)}>
                  {m.rotulo}
                </button>
              ) : (
                <span aria-current="page" className="font-semibold">{m.rotulo}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {turnoEscolhido === 2 && aguardando2 ? (
        <p role="status" className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          2º turno (25/10/2026): aguardando apuração. O TSE ainda não totalizou seções; exibindo o resultado do 1º turno.
          Esta página verifica novos dados a cada 30 segundos.
        </p>
      ) : null}

      {atual.erro && !dados ? (
        <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">{atual.erro}</p>
      ) : null}
      {filhos.some((f) => f.lacuna) || (abr.nivel !== "BR" && "pais" in abr && abr.pais === PAIS_LACUNA) ? (
        <p className="rounded border border-gray-300 bg-gray-50 p-3 text-sm text-gray-800">
          <strong>{PAIS_LACUNA}:</strong> o arquivo de resultados do TSE identifica as cidades do exterior, mas não o
          país. O país de cada cidade vem da página oficial do TSE &quot;Locais de votação no exterior&quot;; as cidades
          sem correspondência segura nessa página ficam neste grupo, sem que o país seja deduzido.
        </p>
      ) : null}
      {diretos.total > 0 && (diretos.lidos < diretos.total || diretos.falhas > 0) ? (
        <p role="status" className="rounded border border-gray-300 bg-gray-50 p-2 text-sm text-gray-800">
          {diretos.lidos < diretos.total
            ? `Lendo os resultados por ${abrMapa.nivel === "UF" ? "município" : "cidade"} direto no TSE: ${diretos.lidos} de ${diretos.total}.`
            : `${diretos.falhas} arquivo(s) do TSE não puderam ser lidos agora; nova tentativa em 1 minuto.`}
        </p>
      ) : null}
      {dados?.avisos?.map((a) => (
        <p key={a} className="rounded border border-amber-300 bg-amber-50 p-2 text-sm text-amber-900">{a}</p>
      ))}

      <section aria-labelledby="titulo-resumo" aria-busy={atual.carregando} className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <h2 id="titulo-resumo" className="min-w-0 break-words text-xl font-bold text-gray-900">
            {vista?.nome ?? "Carregando…"} — {turno}º turno, Presidente
          </h2>
          <div className="w-full md:w-80">
            <Apurado apuracao={vista?.apuracao} />
          </div>
        </div>
        {vista ? <Cartoes totais={vista.totais} candidatos={vista.candidatos} info={info} apuracao={vista.apuracao} /> : null}
      </section>

      {dados?.filhos?.length ? (
        <section aria-labelledby="titulo-mapa" className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[5fr_7fr]">
          <h2 id="titulo-mapa" className="text-lg font-bold text-gray-900 lg:col-span-2">
            Resultado por {rotuloFilho.toLowerCase()}
          </h2>
          {mapa ? (
            <div className="min-w-0">
              <Mapa
                url={mapa.url}
                objeto={mapa.objeto}
                dados={mapa.dados}
                chaveDe={chaveDe}
                selecionado={mapa.sel}
                onSelecionar={(_, f) => escolherFilho(f)}
                candidatos={info}
                rotulo={`Mapa: candidato mais votado por ${rotuloFilho.toLowerCase()} em ${dados.nome}. Use Tab para navegar e Enter para selecionar.`}
              />
              <Legenda numeros={[...new Set(filhos.map((f) => f.candidatos[0]?.numero).filter((n): n is number => !!n))]} nome={nome} />
              <p className="mt-1 text-xs text-gray-700">
                Malha:{" "}
                <FonteLink href="https://servicodados.ibge.gov.br/api/docs/malhas?versao=3" tipo="oficial">
                  IBGE, malha municipal 2022 (MT: malha 2025)
                </FonteLink>
              </p>
            </div>
          ) : null}
          <div className={`min-w-0 ${mapa ? "" : "lg:col-span-2"}`}>
            <Tabela
              titulo={`Resultado por ${rotuloFilho.toLowerCase()} em ${dados.nome}`}
              rotuloUnidade={rotuloFilho}
              filhos={filhos}
              colunas={COLUNAS}
              candidatos={info}
              selecionado={abr.nivel === "MUN" ? abr.municipio : abr.nivel === "CIDADE" ? abr.cidade : undefined}
              onSelecionar={escolherFilho}
            />
          </div>
        </section>
      ) : null}

      <section aria-labelledby="titulo-comparativo" className="space-y-2">
        <h2 id="titulo-comparativo" className="text-lg font-bold text-gray-900">Comparativo 1º × 2º turno</h2>
        <Comparativo
          turno1={recorte1}
          turno2={recorte2}
          info={info}
          aguardando={aguardando2}
          abrirSegundo={iniciou2 && turno === 1 ? () => setTurno(2) : undefined}
          nomeAbrangencia={vista?.nome ?? recorte1?.nome ?? "esta área"}
        />
        <p className="text-xs text-gray-700">
          No 1º turno aparecem todos os candidatos; as análises de propostas deste site tratam apenas de Lula e Flávio
          Bolsonaro.
        </p>
      </section>

      <section aria-labelledby="titulo-fonte" className="space-y-2">
        <h2 id="titulo-fonte" className="text-lg font-bold text-gray-900">Fonte dos dados</h2>
        {dados ? (
          <FonteDados
            turno={turno}
            fonte={dados.fonte}
            apuracao={vista?.apuracao}
            notas={dados.notas}
            leituraDireta={!!dados.pendentes}
          />
        ) : null}
        {turno === 2 && r1.dados ? <FonteDados turno={1} fonte={r1.dados.fonte} /> : null}
      </section>
    </div>
  );
}
