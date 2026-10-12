import Link from "next/link";
import type { Afirmacao, CandidatoId, FonteRh } from "@/types";
import { CANDIDATOS, pdfPlano } from "@/lib/candidatos";
import { getRegistro } from "@/lib/data/propostas";
import { getDossie } from "@/lib/data/rh";
import { formatarData } from "@/lib/rotulos";
import { CandidatoBadge } from "../CandidatoBadge";
import { FonteLink } from "../FonteLink";
import { FontesRh } from "./FontesRh";

export type AbaDossie = "perfil" | "processos";

const ABAS: { id: AbaDossie; rotulo: string; sufixo: string; secoes: [string, string][] }[] = [
  {
    id: "perfil",
    rotulo: "Trajetória",
    sufixo: "",
    secoes: [
      ["formacao", "Formação"],
      ["trajetoria", "Trajetória profissional"],
      ["cargos", "Cargos e mandatos"],
      ["atuacao", "Atuação parlamentar e executiva"],
      ["declaracoes", "Declarações ao TSE"],
      ["consultas", "Consultas sem registro"],
      ["lacunas", "Lacunas"],
      ["fontes", "Todas as fontes"],
    ],
  },
  {
    id: "processos",
    rotulo: "Processos, ações e reportagens",
    sufixo: "/processos",
    secoes: [
      ["processos", "Processos e investigações"],
      ["civeis", "Ações cíveis"],
      ["reportagens", "Reportagens"],
    ],
  },
];

/** Cabeçalho comum às duas páginas do dossiê, com as abas (links) e as seções da aba atual. */
export function CabecalhoDossie({ candidato: c, aba }: { candidato: CandidatoId; aba: AbaDossie }) {
  const r = getRegistro(c);
  const d = getDossie(c);
  const atual = ABAS.find((a) => a.id === aba)!;
  return (
    <header className="space-y-3">
      <p className="text-sm">
        <Link href="/candidatos" className="lk">
          Candidatos
        </Link>{" "}
        <span aria-hidden="true">/</span> {CANDIDATOS[c].nome}
      </p>
      <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold text-gray-900">
        Dossiê <CandidatoBadge candidato={c} tamanho="lg" />
      </h1>
      <p className="text-sm text-gray-800">
        {r.nome_completo} · {r.partido}
      </p>
      <p className="max-w-3xl text-sm text-gray-800">
        Informações de histórico reunidas sem viés, a partir de fontes oficiais (tribunais, órgãos de
        controle, Congresso, Ministérios Públicos e Presidência). Matérias de imprensa aparecem apenas
        como reportagem, com link, e nunca como fato comprovado. Dados atualizados em{" "}
        {formatarData(d.gerado_em)}.
      </p>
      <FonteLink href={pdfPlano(c)} tipo="pdf">
        Plano de governo registrado no TSE
      </FonteLink>
      <nav aria-label="Partes do dossiê">
        <ul className="flex flex-wrap gap-1 border-b border-gray-300">
          {ABAS.map((a) => (
            <li key={a.id}>
              <Link
                href={`/candidatos/${c}${a.sufixo}`}
                aria-current={a.id === aba ? "page" : undefined}
                className={`-mb-px block rounded-t border px-3 py-2 text-sm font-medium ${
                  a.id === aba
                    ? "border-gray-300 border-b-white bg-white text-gray-900"
                    : "border-transparent text-blue-800 underline underline-offset-2"
                }`}
              >
                {a.rotulo}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <nav aria-label="Seções desta parte do dossiê" className="text-sm">
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {atual.secoes.map(([id, t]) => (
            <li key={id}>
              <a href={`#${id}`} className="lk">
                {t}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

export function Vazio() {
  return <p className="text-sm text-gray-700">Nenhum registro nesta seção.</p>;
}

export function ListaAfirmacoes({ itens, fontes }: { itens: Afirmacao[]; fontes: Map<string, FonteRh> }) {
  if (!itens.length) return <Vazio />;
  return (
    <ul className="space-y-3">
      {itens.map((a, i) => (
        <li key={i} className="cartao">
          {a.periodo ? <p className="meta font-medium">{a.periodo}</p> : null}
          <p className="text-gray-900">{a.afirmacao}</p>
          {a.observacao ? <p className="meta mt-1">{a.observacao}</p> : null}
          <FontesRh ids={a.fonte_ids} fontes={fontes} />
        </li>
      ))}
    </ul>
  );
}
