import type { Metadata } from "next";
import Link from "next/link";
import { CandidatoBadge } from "@/components/CandidatoBadge";
import { FonteLink } from "@/components/FonteLink";
import { Legendas } from "@/components/Legenda";
import { ParCandidatos } from "@/components/ParCandidatos";
import { Secao } from "@/components/Secao";
import { ViesTag } from "@/components/ViesTag";
import { VIESES_ORDEM } from "@/types/comum";
import { CANDIDATOS, ORDEM_CANDIDATOS, pdfPlano } from "@/lib/candidatos";
import { CORES_CANDIDATOS, CORES_VIESES, ROTULO_VIES } from "@/lib/cores";
import { getCategoriasArquivo } from "@/lib/data/categorias";
import { getAgenda } from "@/lib/data/agenda";
import { existeJson, lerJson } from "@/lib/data/ler";
import { getPropostas, getRegistro } from "@/lib/data/propostas";
import { getDossie } from "@/lib/data/rh";
import { getContextoRi, getSinteseRi } from "@/lib/data/ri";
import { getAnaliseRpArquivo, getSinteseRp } from "@/lib/data/rp";
import { formatarData } from "@/lib/rotulos";

export const metadata: Metadata = {
  title: "Metodologia",
  description: "Fontes, funcionamento dos agentes, critérios de neutralidade, lacunas e atualização.",
};

const NEUTRALIDADE = [
  "Somente as propostas de Lula e de Flávio Bolsonaro são analisadas.",
  "Nenhuma informação sobre os projetos é deduzida ou suposta: a fonte principal são os planos de governo registrados no TSE.",
  "Toda informação exibida indica sua fonte: propostas levam à página do PDF; histórico e contexto internacional levam ao documento de origem.",
  "Os analistas com viés (esquerda, centro e direita) apenas interpretam trechos citados dos planos e não acrescentam fatos; as três leituras aparecem lado a lado e identificadas.",
  "Quando um candidato não tem proposta numa categoria, o site exibe \"Sem proposta registrada\", sem preencher a ausência com interpretação.",
  "O que cada plano não traz é apresentado somente pela lista comum de itens de agenda, derivada igualmente das prioridades dos três vieses e aplicada da mesma forma aos dois candidatos.",
  "O mesmo critério de detalhamento vale para os dois candidatos: a crítica por falta de meta, prazo ou fonte de recursos feita a um é aplicada à proposta equivalente do outro.",
  "No histórico dos candidatos, só são fatos as informações de tribunais, órgãos de controle, Congresso, Assembleias, Ministérios Públicos e Presidência; matérias de imprensa aparecem como \"Reportagem — não constitui fato comprovado\".",
  "Procedimentos no Congresso (Conselho de Ética, pedidos de impeachment e similares) só entram nos dossiês após a fase de protocolo, com o mesmo critério para os dois.",
  "A interface usa a mesma estrutura, tamanho e destaque para os dois candidatos em todas as telas e não usa linguagem valorativa.",
];

const AGENTES = [
  ["Extração de propostas", "Lê o PDF de cada plano página a página, registra cada item (princípio, diagnóstico ou proposta) com trecho literal, página e resumo neutro, e o classifica nas 16 categorias com critérios comuns."],
  ["Relações Públicas (3 vieses + síntese)", "Três analistas — de esquerda, de centro e de direita — apontam pontos a favor e ressalvas de cada categoria, sempre citando trechos literais. O sintetizador reúne consensos, divergências e o comparativo, sem criar argumentos novos."],
  ["Relações Internacionais (3 vieses + contexto + síntese)", "Um agente de contexto reúne fatos geopolíticos e de comércio exterior de fontes oficiais. Os três analistas interpretam as propostas com impacto internacional e constroem cenários ligando proposta citada → fato oficial → consequência, com horizonte e confiança. O sintetizador agrupa tudo em temas comuns."],
  ["Recursos Humanos (sem viés)", "Reúne formação, trajetória, cargos, declarações ao TSE, processos, ações e consultas de cada candidato a partir de fontes oficiais, registrando lacunas e marcando reportagens."],
  ["Revisão", "Auditorias conferem fontes, linguagem, simetria de tratamento e a lista comum de agenda antes da publicação. As citações são conferidas por script como trechos literais dos planos."],
];

export default function MetodologiaPage() {
  const cats = getCategoriasArquivo();
  const ctx = getContextoRi();
  const agenda = getAgenda();
  const sync = existeJson("_sync.json") ? lerJson<{ sincronizado_em: string }>("_sync.json") : null;
  const datas: [string, string][] = [
    ...ORDEM_CANDIDATOS.map((c): [string, string] => [`Propostas — ${CANDIDATOS[c].nome}`, getPropostas(c).gerado_em]),
    ...ORDEM_CANDIDATOS.flatMap((c) =>
      VIESES_ORDEM.map((v): [string, string] => [
        `Relações Públicas, viés de ${ROTULO_VIES[v].toLowerCase()} — ${CANDIDATOS[c].nome}`,
        getAnaliseRpArquivo(v, c).gerado_em,
      ]),
    ),
    ["Síntese de Relações Públicas", getSinteseRp().gerado_em],
    ["Contexto internacional", ctx.gerado_em],
    ["Síntese de Relações Internacionais", getSinteseRi().gerado_em],
    ...ORDEM_CANDIDATOS.map((c): [string, string] => [`Dossiê — ${CANDIDATOS[c].nome}`, getDossie(c).gerado_em]),
  ];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Metodologia</h1>
        <p className="mt-2 max-w-3xl text-gray-800">
          Como os dados foram obtidos, organizados e analisados, e quais regras garantem o mesmo
          tratamento aos dois candidatos.
        </p>
      </header>

      <Secao id="fontes" titulo="Fontes: planos de governo registrados no TSE">
        <ParCandidatos
          render={(c) => {
            const r = getRegistro(c);
            return (
              <div className="space-y-3 text-sm">
                <p className="text-gray-800">Situação: {r.situacao_candidatura}</p>
                {r.fontes.map((f) => (
                  <div key={f.id} className="space-y-1">
                    <p className="font-medium text-gray-900">{f.titulo}</p>
                    <FonteLink href={pdfPlano(c)} tipo="pdf">
                      Baixar PDF ({f.num_paginas} páginas, {(f.tamanho_bytes / 1048576).toFixed(1)} MB)
                    </FonteLink>
                    <p className="text-xs text-gray-800">
                      SHA-256: <code className="break-all font-mono">{f.sha256}</code>
                    </p>
                    <p className="text-xs text-gray-700">
                      Órgão: {f.orgao} · coletado em {formatarData(f.data_coleta)}
                    </p>
                    <div className="flex flex-col gap-0.5">
                      <FonteLink href={f.url} tipo="oficial">Arquivo oficial do TSE (ZIP com as propostas)</FonteLink>
                      <FonteLink href={f.pagina_origem} tipo="oficial">Conjunto de dados no Portal de Dados Abertos do TSE</FonteLink>
                    </div>
                  </div>
                ))}
                <details>
                  <summary className="cursor-pointer text-sm font-medium text-blue-800 underline underline-offset-2">
                    Observações da coleta ({r.observacoes.length})
                  </summary>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-gray-800">
                    {r.observacoes.map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                </details>
              </div>
            );
          }}
        />
        <p className="mt-3 text-sm text-gray-800">
          Para conferir a integridade, calcule o SHA-256 do PDF baixado (ex.: <code>sha256sum plano-de-governo.pdf</code>)
          e compare com o valor acima.
        </p>
      </Secao>

      <Secao id="agentes" titulo="Como os agentes funcionam">
        <ol className="space-y-3">
          {AGENTES.map(([t, d]) => (
            <li key={t} className="rounded-lg border border-gray-300 bg-white p-3 text-sm">
              <p className="font-semibold text-gray-900">{t}</p>
              <p className="mt-1 text-gray-800">{d}</p>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-sm text-gray-800">
          Categorias: {cats.regra_geral}{" "}
          <Link href="/comparativo" className="text-blue-800 underline underline-offset-2">
            Ver as 16 categorias
          </Link>
          .
        </p>
      </Secao>

      <Secao id="neutralidade" titulo="Diretrizes de neutralidade">
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-800">
          {NEUTRALIDADE.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </Secao>

      <Secao
        id="agenda"
        titulo="Lista comum de itens de agenda"
        descricao="O que cada plano traz ou não traz é apresentado somente por esta lista, aplicada igualmente aos dois planos (diretriz 12)."
      >
        {agenda ? (
          <div className="space-y-3 text-sm">
            {agenda.metodo ? <p className="text-gray-800">{agenda.metodo}</p> : null}
            <p className="text-xs text-gray-700">
              Versão {agenda.versao ?? "—"} · {agenda.checklist.length} itens. Status: presente (o critério é
              atendido), parcial (o tema é tratado, mas falta o elemento exigido pelo critério) ou ausente
              (nenhuma proposta trata do tema do item).
            </p>
            <ul className="divide-y divide-gray-200 rounded-lg border border-gray-300 bg-white">
              {agenda.checklist.map((i) => (
                <li key={i.id} className="grid grid-cols-1 gap-1 p-3 md:grid-cols-[14rem_1fr]">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{i.item}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-gray-700">
                      <span className="font-mono">{i.id}</span> · {i.categoria} <ViesTag vies={i.vies_origem} />
                    </p>
                  </div>
                  <p className="min-w-0 text-gray-800">
                    <span className="font-medium">Critério:</span> {i.criterio}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-gray-700">Lista não disponível nesta versão dos dados.</p>
        )}
      </Secao>

      <Secao id="ordem-cores" titulo="Ordem de exibição e cores">
        <div className="space-y-3 text-sm text-gray-800">
          <p>
            Os candidatos aparecem sempre na ordem crescente do número de urna: 13 ({CANDIDATOS.lula.nome}) e
            depois 22 ({CANDIDATOS.flavio.nome}). As cores foram escolhidas apenas para distinguir
            candidatos e vieses e não correspondem às cores oficiais dos partidos.
          </p>
          <Legendas />
          <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {ORDEM_CANDIDATOS.map((c) => (
              <li key={c} className="flex items-center gap-2">
                <CandidatoBadge candidato={c} tamanho="sm" /> cor {CORES_CANDIDATOS[c].nomeCor}
              </li>
            ))}
            {VIESES_ORDEM.map((v) => (
              <li key={v}>
                Viés de {ROTULO_VIES[v].toLowerCase()}: cor {CORES_VIESES[v].nomeCor}
              </li>
            ))}
          </ul>
        </div>
      </Secao>

      <Secao id="lacunas" titulo="Lacunas gerais">
        <div className="space-y-4 text-sm">
          <ParCandidatos
            render={(c) => {
              const p = getPropostas(c);
              return (
                <div>
                  <p className="font-medium text-gray-900">Extração do plano</p>
                  <p className="text-xs text-gray-700">
                    {p.cobertura.paginas_processadas.length} de {p.cobertura.total_paginas} páginas
                    processadas; páginas sem texto extraível: {p.cobertura.paginas_sem_texto.join(", ") || "nenhuma"}.
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-gray-800">
                    {p.cobertura.observacoes.map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                  <Link href={`/candidatos/${c}#lacunas`} className="mt-2 inline-block text-blue-800 underline underline-offset-2">
                    Lacunas do dossiê
                  </Link>
                </div>
              );
            }}
          />
          <div className="rounded-lg border border-gray-300 bg-white p-4">
            <p className="font-medium text-gray-900">Contexto internacional</p>
            <ul className="mt-2 space-y-1 text-xs text-gray-800">
              {(ctx.secoes.lacunas ?? []).map((l) => (
                <li key={l.id}>
                  <span className="font-medium">{l.tema}:</span> {l.motivo}
                </li>
              ))}
            </ul>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-blue-800 underline underline-offset-2">
                Fontes oficiais do contexto internacional ({ctx.fontes.length})
              </summary>
              <ul className="mt-2 space-y-1">
                {ctx.fontes.map((f) => (
                  <li key={f.id}>
                    <FonteLink href={f.url} tipo="oficial">
                      {f.orgao} — {f.titulo}
                    </FonteLink>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </div>
      </Secao>

      <Secao id="atualizacao" titulo="Data de atualização">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Data de geração de cada conjunto de dados</caption>
          <thead>
            <tr className="border-b border-gray-300">
              <th scope="col" className="py-1 pr-3 font-semibold">Conjunto de dados</th>
              <th scope="col" className="py-1 font-semibold">Gerado em</th>
            </tr>
          </thead>
          <tbody>
            {datas.map(([n, d]) => (
              <tr key={n} className="border-b border-gray-200">
                <td className="py-1 pr-3">{n}</td>
                <td className="py-1">{formatarData(d)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sync ? (
          <p className="mt-2 text-xs text-gray-700">
            Dados incorporados ao site em {formatarData(sync.sincronizado_em)}.
          </p>
        ) : null}
      </Secao>
    </div>
  );
}
