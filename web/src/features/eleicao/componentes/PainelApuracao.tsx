"use client";

/** Painel de apuração (inspirado no painel de TV): seletores, mapa, cartões, comparativo e fonte. */
import { useCallback, useEffect, useMemo, useState } from "react";
import { chave, pai, PAIS_NAO_IDENTIFICADO, parseAbrangencia, type Abrangencia } from "../abrangencia";
import { somar } from "../tse/normalizar";
import { useFilhosDiretos } from "../useFilhosDiretos";
import { NUMERO_FLAVIO, NUMERO_LULA } from "../cores-eleicao";
import { NOME_UF } from "../tse/config";
import type { Apuracao, CandidatoVotos, ResultadoAbrangencia, ResultadoFilho, Totais, Turno } from "../tipos";
import { useResultado } from "../useResultado";
import { Apurado, Cartoes } from "./Cartoes";
import { Comparativo } from "./Comparativo";
import { FonteDados } from "./FonteDados";
import { useLocais, type FocoLocal } from "../locais";
import { AreaMapa } from "./AreaMapa";
import { ListaLocais } from "./ListaLocais";
import { Seletores } from "./Seletores";
import { Tabela } from "./Tabela";

const COLUNAS = [NUMERO_LULA, NUMERO_FLAVIO];
const PAIS_LACUNA = PAIS_NAO_IDENTIFICADO;

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

interface Quadro {
  abr: Abrangencia;
  dados: ResultadoAbrangencia;
  r1: ResultadoAbrangencia | null;
  r2: ResultadoAbrangencia | null;
  turno: Turno;
}

/** Os dados recebidos são da abrangência do mapa pedida? */
function corresponde(d: ResultadoAbrangencia, a: Abrangencia): boolean {
  if (a.nivel === "BR") return d.nivel === "BR";
  if (a.nivel === "UF") return d.nivel === "UF" && d.codigo === a.uf;
  if (a.nivel === "EXTERIOR") return d.nivel === "EXTERIOR";
  if (a.nivel === "PAIS") return d.nivel === "PAIS" && d.codigo === a.pais;
  return false;
}

/** "?area=uf/SP/71072" (vazio = Brasil), preservando os outros parâmetros. */
function urlDe(a: Abrangencia): string {
  const u = new URL(window.location.href);
  if (a.nivel === "BR") u.searchParams.delete("area");
  else u.searchParams.set("area", chave(a));
  return `${u.pathname}${u.search}${u.hash}`;
}

/** Abrangência ao entrar num filho do mapa/tabela. */
function entrarEm(abrMapa: Abrangencia, f: ResultadoFilho): Abrangencia {
  if (abrMapa.nivel === "BR") return f.codigo === "ZZ" ? { nivel: "EXTERIOR" } : { nivel: "UF", uf: f.codigo };
  if (abrMapa.nivel === "UF") return { nivel: "MUN", uf: abrMapa.uf, municipio: f.codigo };
  if (abrMapa.nivel === "EXTERIOR") return { nivel: "PAIS", pais: f.codigo };
  if (abrMapa.nivel === "PAIS") return { nivel: "CIDADE", pais: abrMapa.pais, cidade: f.codigo };
  return abrMapa;
}

function rotuloDe(a: Abrangencia): string {
  if (a.nivel === "BR") return "Brasil";
  if (a.nivel === "UF") return NOME_UF[a.uf];
  if (a.nivel === "EXTERIOR") return "Exterior";
  if (a.nivel === "PAIS") return a.pais;
  return "a área anterior";
}

export function PainelApuracao() {
  // null = automático: mostra o 2º turno assim que o TSE tiver seções totalizadas.
  const [turnoManual, setTurno] = useState<Turno | null>(null);
  // alvo = área pedida; o que aparece na tela (quadro) só troca quando os dados do alvo chegam.
  const [alvo, setAlvo] = useState<Abrangencia>({ nivel: "BR" });
  const [voltouDe, setVoltouDe] = useState<Abrangencia | null>(null);
  const [focoLocal, setFocoLocal] = useState<FocoLocal | null>(null);
  // Linha da tabela sob o mouse/foco: destaca a mesma área no mapa.
  const [destaque, setDestaque] = useState<string | null>(null);

  const abrMapaAlvo = useMemo(() => nivelMapa(alvo), [alvo]);
  const exteriorAlvo = alvo.nivel === "EXTERIOR" || alvo.nivel === "PAIS" || alvo.nivel === "CIDADE";

  // O 2º turno só é buscado em profundidade quando o TSE já tem seções totalizadas.
  const r2br = useResultado(2, { nivel: "BR" });
  const iniciou2 =
    !!r2br.dados && (r2br.dados.fonte.tipo === "estatico" || (r2br.dados.apuracao?.secoes_totalizadas ?? 0) > 0);
  const r1 = useResultado(1, abrMapaAlvo);
  const r2prof = useResultado(2, iniciou2 && abrMapaAlvo.nivel !== "BR" ? abrMapaAlvo : null);
  const r2 = abrMapaAlvo.nivel === "BR" ? r2br : r2prof;
  const listaPaises = useResultado(1, exteriorAlvo ? { nivel: "EXTERIOR" } : null);

  const turnoEscolhido: Turno = turnoManual ?? (iniciou2 ? 2 : 1);
  const turnoAlvo: Turno = turnoEscolhido === 2 && iniciou2 ? 2 : 1;
  const atual = turnoAlvo === 2 ? r2 : r1;
  // Ao vivo, municípios/cidades da área aberta são lidos pelo navegador direto no TSE.
  const diretos = useFilhosDiretos(atual.dados, abrMapaAlvo.nivel === "EXTERIOR");
  const dadosAlvo = useMemo(() => {
    const d = atual.dados;
    if (!d?.pendentes) return d;
    const filhosLidos = diretos.filhos ?? [];
    if (!d.totais_dos_filhos) return { ...d, filhos: filhosLidos };
    const s = somar(filhosLidos);
    return { ...d, filhos: filhosLidos, totais: s.totais, candidatos: s.candidatos, apuracao: s.apuracao };
  }, [atual.dados, diretos.filhos]);

  // Quadro exibido: troca só quando os dados do alvo chegam (sem tela em branco nem "reload").
  const pronto = !!dadosAlvo && corresponde(dadosAlvo, abrMapaAlvo);
  const quadroNovo: Quadro | null = pronto
    ? { abr: alvo, dados: dadosAlvo, r1: r1.dados, r2: r2.dados, turno: turnoAlvo }
    : null;
  const [ultimo, setUltimo] = useState<Quadro | null>(null);
  if (
    quadroNovo &&
    (!ultimo ||
      ultimo.abr !== quadroNovo.abr ||
      ultimo.dados !== quadroNovo.dados ||
      ultimo.r1 !== quadroNovo.r1 ||
      ultimo.r2 !== quadroNovo.r2 ||
      ultimo.turno !== quadroNovo.turno)
  ) {
    setUltimo(quadroNovo);
  }
  const quadro = quadroNovo ?? ultimo;
  const trocando = !quadroNovo && !!ultimo && !atual.erro;
  const abr = quadro?.abr ?? alvo;
  const abrMapa = nivelMapa(abr);
  const exterior = abr.nivel === "EXTERIOR" || abr.nivel === "PAIS" || abr.nivel === "CIDADE";
  const dados = quadro?.dados ?? null;
  const turno: Turno = quadro?.turno ?? turnoAlvo;
  const r1dados = quadro?.r1 ?? null;
  const r2dados = quadro?.r2 ?? null;
  const vista = recorte(dados, abr);
  // Locais de votação: só do turno exibido (no 2º turno nunca se mostram os do 1º).
  const locais = useLocais(turno, abr.nivel === "MUN" ? abr.uf : null, abr.nivel === "MUN" ? abr.municipio : null);
  const info = useMemo(
    () => (dados?.candidatos_info.length ? dados.candidatos_info : (r1dados?.candidatos_info ?? [])),
    [dados, r1dados],
  );

  // Navegação: seletores, tabela e mapa usam irPara; "Voltar" guarda de onde veio (animação de afastar).
  const irPara = useCallback((a: Abrangencia, de: Abrangencia | null = null, historico = true) => {
    setVoltouDe(de);
    setFocoLocal(null);
    setDestaque(null);
    setAlvo(a);
    // URL compartilhável sem navegação do Next (sem recarregar nem remontar a página).
    if (historico) window.history.pushState({ eleicao: chave(a) }, "", urlDe(a));
  }, []);

  // Abre a área da URL (link compartilhado) e trata o botão Voltar/Avançar do navegador.
  useEffect(() => {
    const daUrl = () => parseAbrangencia(new URLSearchParams(window.location.search).get("area")?.split("/") ?? []);
    const inicial = daUrl();
    if (inicial && inicial.nivel !== "BR") queueMicrotask(() => irPara(inicial, null, false));
    const aoVoltar = () => irPara(daUrl() ?? { nivel: "BR" }, null, false);
    window.addEventListener("popstate", aoVoltar);
    return () => window.removeEventListener("popstate", aoVoltar);
  }, [irPara]);
  const anterior = pai(abr);
  const voltar = anterior ? { rotulo: rotuloDe(anterior), acao: () => irPara(anterior, abr) } : null;

  const filhos = useMemo(() => dados?.filhos ?? [], [dados]);

  const migalhas: Array<{ rotulo: string; abr: Abrangencia }> = [{ rotulo: "Brasil", abr: { nivel: "BR" } }];
  if (abr.nivel === "UF" || abr.nivel === "MUN") migalhas.push({ rotulo: NOME_UF[abr.uf], abr: { nivel: "UF", uf: abr.uf } });
  if (exterior) migalhas.push({ rotulo: "Exterior", abr: { nivel: "EXTERIOR" } });
  if (abr.nivel === "PAIS" || abr.nivel === "CIDADE") migalhas.push({ rotulo: abr.pais, abr: { nivel: "PAIS", pais: abr.pais } });
  if (vista && (abr.nivel === "MUN" || abr.nivel === "CIDADE")) migalhas.push({ rotulo: vista.nome, abr });

  const rotuloFilho = { BR: "Estado", UF: "Município", EXTERIOR: "País", PAIS: "Cidade" }[abrMapa.nivel as "BR"] ?? "Área";
  const aguardando2 = !iniciou2;
  const recorte1 = recorte(r1dados, abr);
  const recorte2 = !iniciou2 ? null : turno === 2 ? recorte(dados, abr) : recorte(r2dados, abr);

  return (
    <div className="min-w-0 space-y-6">
      <Seletores
        turno={turnoEscolhido}
        onTurno={setTurno}
        abr={alvo}
        onAbr={(a) => irPara(a)}
        municipios={abrMapaAlvo.nivel === "UF" ? (atual.dados?.pendentes ?? atual.dados?.filhos ?? []) : []}
        paises={listaPaises.dados?.filhos ?? []}
        cidades={abrMapaAlvo.nivel === "PAIS" ? (atual.dados?.pendentes ?? atual.dados?.filhos ?? []) : []}
      />

      <div role="status" aria-live="polite" className="h-0 overflow-visible">
        {trocando ? (
          <span className="inline-flex items-center gap-2 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-800">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-400 border-t-transparent motion-reduce:animate-none" aria-hidden="true" />
            Carregando {rotuloDe(alvo)}…
          </span>
        ) : null}
      </div>

      <nav aria-label="Abrangência selecionada" className="text-sm">
        <ol className="flex flex-wrap gap-1">
          {migalhas.map((m, i) => (
            <li key={m.rotulo + i} className="flex items-center gap-1">
              {i > 0 ? <span aria-hidden="true">›</span> : null}
              {i < migalhas.length - 1 ? (
                <button type="button" className="text-blue-800 underline underline-offset-2" onClick={() => irPara(m.abr)}>
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

      {atual.erro && !quadroNovo ? (
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

      {dados && (dados.filhos?.length || dados.pendentes) ? (
        <section aria-labelledby="titulo-mapa" className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[5fr_7fr]">
          <h2 id="titulo-mapa" className="text-lg font-bold text-gray-900 lg:col-span-2">
            {abr.nivel === "MUN" && vista ? `Mapa dos locais de votação — ${vista.nome}` : `Resultado por ${rotuloFilho.toLowerCase()}`}
          </h2>
          <AreaMapa
            turno={turno}
            abr={abr}
            dados={dados}
            info={info}
            onEntrar={(f) => irPara(entrarEm(abrMapa, f))}
            voltar={voltar}
            voltouDe={voltouDe}
            locais={locais}
            focoLocal={focoLocal}
            onFocoLocal={setFocoLocal}
            destaque={destaque}
          />
          <div className="min-w-0">
            <Tabela
              titulo={`Resultado por ${rotuloFilho.toLowerCase()} em ${dados.nome}`}
              rotuloUnidade={rotuloFilho}
              filhos={filhos}
              colunas={COLUNAS}
              candidatos={info}
              selecionado={abr.nivel === "MUN" ? abr.municipio : abr.nivel === "CIDADE" ? abr.cidade : undefined}
              onSelecionar={(f) => irPara(entrarEm(abrMapa, f))}
              onDestaque={setDestaque}
              preencher
            />
          </div>
        </section>
      ) : null}

      {abr.nivel === "MUN" && locais ? (
        <ListaLocais
          turno={turno}
          nomeMunicipio={vista?.nome ?? abr.municipio}
          locais={locais}
          candidatos={info}
          foco={focoLocal}
          onFoco={setFocoLocal}
        />
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
            leituraDireta={!!dados.pendentes}
          />
        ) : null}
        {turno === 2 && r1dados ? <FonteDados turno={1} fonte={r1dados.fonte} /> : null}
      </section>
    </div>
  );
}
