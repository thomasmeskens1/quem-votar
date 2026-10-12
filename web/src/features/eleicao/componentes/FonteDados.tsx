/** Bloco de fonte: sempre exibido (diretriz 4). */
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

export function FonteDados({
  turno,
  fonte,
  apuracao,
  notas,
  leituraDireta,
}: {
  turno: 1 | 2;
  fonte: Fonte;
  apuracao?: Apuracao;
  notas?: string[];
  /** Municípios/cidades lidos pelo navegador direto no TSE. */
  leituraDireta?: boolean;
}) {
  return (
    <div className="min-w-0 break-words rounded border border-gray-300 bg-gray-50 p-3 text-sm text-gray-800">
      <p className="font-semibold">
        Fonte: Tribunal Superior Eleitoral (TSE) — {turno}º turno, Presidente
        {fonte.tipo === "ao-vivo" ? " · dados de resultados.tse.jus.br" : " · arquivo oficial consolidado"}
      </p>
      <ul className="mt-1 space-y-1">
        {apuracao?.atualizado_tse ? <li>Última totalização informada pelo TSE: {data(apuracao.atualizado_tse)}</li> : null}
        {fonte.data_arquivo_tse ? <li>Data do arquivo do TSE: {fonte.data_arquivo_tse}</li> : null}
        {fonte.obtido_em ? <li>Consultado por este site em: {data(fonte.obtido_em)}</li> : null}
        {fonte.sha256 ? <li className="break-all">SHA-256 do arquivo baixado: {fonte.sha256}</li> : null}
        {fonte.urls.map((u) => (
          <li key={u} className="break-all">
            <FonteLink href={u} tipo="oficial" className="break-all">{u}</FonteLink>
          </li>
        ))}
        {leituraDireta ? (
          <li className="text-xs text-gray-700">
            Resultados por município/cidade: lidos pelo seu navegador diretamente nos arquivos públicos do TSE (um arquivo
            por município, no mesmo padrão do segundo endereço acima).
          </li>
        ) : null}
        {notas?.map((n) => (
          <li key={n} className="text-xs text-gray-700">Nota metodológica: {n}</li>
        ))}
        <li>
          <FonteLink href={TSE_PAGINA} tipo="oficial">Página de resultados do TSE</FonteLink>
        </li>
      </ul>
    </div>
  );
}
