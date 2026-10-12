/**
 * Bloco de fonte: sempre exibido (diretriz 4). Os links levam aos arquivos
 * oficiais; o texto visível é uma descrição legível (sem nomes técnicos de
 * arquivo), e o endereço completo fica no título do link.
 */
import { FonteLink } from "@/components/FonteLink";
import { TSE_PAGINA } from "../tse/config";
import type { Apuracao, Fonte } from "../tipos";

const fmtData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "medium",
  timeZone: "America/Sao_Paulo",
});

function data(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : `${fmtData.format(d)} (Brasília)`;
}

/** Descrição legível de um endereço de arquivo do TSE. */
export function rotuloUrl(u: string): string {
  if (/votacao_candidato_munzona/.test(u)) return "Votação por candidato, município e zona — dados abertos do TSE";
  if (/detalhe_votacao_munzona/.test(u)) return "Detalhe da votação (comparecimento, brancos e nulos) por município e zona — dados abertos do TSE";
  if (/votacao_secao|local_votacao|eleitorado_local/i.test(u)) return "Votação e locais de votação por seção — dados abertos do TSE";
  if (/locais-votacao-exterior/.test(u)) return "Locais de votação no exterior (país de cada cidade) — TSE";
  if (/\/config\/mun-e\d+-cm\.json$/.test(u)) return "Cadastro de municípios e códigos do IBGE da eleição — resultados do TSE";
  const m = /\/dados\/([a-z]{2})\/([a-z]{2})(\d*)-c\d+-e(\d+)-u\.json$/.exec(u);
  if (m) {
    const turno = m[4].endsWith("6258") ? "2º turno" : "1º turno";
    const abr = m[1] === "br" ? "Brasil" : m[1] === "zz" ? (m[3] ? "uma cidade no exterior (exemplo)" : "exterior") : m[3] ? `um município de ${m[1].toUpperCase()} (exemplo)` : m[1].toUpperCase();
    return `Resultado de Presidente, ${turno}, ${abr} — resultados do TSE`;
  }
  try {
    return `Arquivo oficial em ${new URL(u).hostname}`;
  } catch {
    return "Arquivo oficial do TSE";
  }
}

/** "nome=hash; nome=hash" → só os códigos de verificação. */
function hashes(s: string): string[] {
  return s
    .split(/[;,]\s*/)
    .map((x) => x.split("=").pop()?.trim() ?? "")
    .filter((x) => /^[0-9a-f]{16,}$/i.test(x));
}

export function FonteDados({
  turno,
  fonte,
  apuracao,
  leituraDireta,
}: {
  turno: 1 | 2;
  fonte: Fonte;
  apuracao?: Apuracao;
  /** Municípios/cidades lidos pelo navegador direto no TSE. */
  leituraDireta?: boolean;
}) {
  const codigos = fonte.sha256 ? hashes(fonte.sha256) : [];
  return (
    <div className="min-w-0 break-words rounded border border-gray-300 bg-gray-50 p-3 text-sm text-gray-800">
      <p className="font-semibold">
        Fonte: Tribunal Superior Eleitoral (TSE) — {turno}º turno, Presidente
        {fonte.tipo === "ao-vivo" ? " · resultados publicados durante a apuração" : " · arquivos oficiais consolidados"}
      </p>
      <ul className="mt-1 space-y-1">
        {apuracao?.atualizado_tse ? <li>Última totalização informada pelo TSE: {data(apuracao.atualizado_tse)}</li> : null}
        {fonte.data_arquivo_tse ? <li>Data dos arquivos do TSE: {fonte.data_arquivo_tse}</li> : null}
        {fonte.obtido_em ? <li>Consultado por este site em: {data(fonte.obtido_em)}</li> : null}
        {fonte.urls.map((u) => (
          <li key={u}>
            <FonteLink href={u} tipo="oficial" titulo={u} className="break-words">
              {rotuloUrl(u)}
            </FonteLink>
          </li>
        ))}
        {leituraDireta ? (
          <li className="text-xs text-gray-700">
            Resultados por município e por cidade no exterior: lidos pelo seu navegador diretamente nos arquivos
            públicos do TSE, um por município ou cidade.
          </li>
        ) : null}
        {codigos.length ? (
          <li className="break-all text-xs text-gray-700">
            Códigos de verificação de integridade (SHA-256) dos arquivos baixados: {codigos.join(" · ")}
          </li>
        ) : null}
        <li>
          <FonteLink href={TSE_PAGINA} tipo="oficial">Página de resultados do TSE</FonteLink>
        </li>
      </ul>
    </div>
  );
}
