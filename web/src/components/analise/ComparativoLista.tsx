import type { DiferencaRi, PontoComparativo } from "@/types";
import { ORDEM_CANDIDATOS } from "@/lib/candidatos";
import { CandidatoBadge } from "../CandidatoBadge";
import { ConfiancaBadge } from "../ConfiancaBadge";
import { ViesTag } from "../ViesTag";
import { PropostaRef, idsPorPagina } from "../conteudo/PropostaRef";
import { textoLegivel } from "@/lib/data/texto";

export interface ComparativoListaProps {
  aproximacoes: PontoComparativo[];
  diferencas: (PontoComparativo | DiferencaRi)[];
}

function Ids({ p }: { p: PontoComparativo }) {
  return (
    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
      {ORDEM_CANDIDATOS.map((c) => {
        const ids = c === "lula" ? p.lula_ids : p.flavio_ids;
        return (
          <div key={c} className="flex flex-wrap items-center gap-1">
            <CandidatoBadge candidato={c} tamanho="sm" comNumero={false} />
            {ids.length ? idsPorPagina(ids).map((id) => <PropostaRef key={id} id={id} />) : <span className="text-xs text-gray-700">—</span>}
          </div>
        );
      })}
    </div>
  );
}

function Concretude({ d }: { d: DiferencaRi }) {
  return (
    <div className="mt-2 rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-800">
      <p className="font-semibold">Diferença de concretude — trechos literais citados</p>
      <ul className="mt-1 space-y-1">
        {d.citacoes_literais?.map((ci, i) => (
          <li key={i}>
            <q className="italic">{ci.citacao}</q> <PropostaRef id={ci.proposta_id} />
          </li>
        ))}
      </ul>
      {d.base_justificativas_confianca?.length ? (
        <>
          <p className="mt-2 font-semibold">Justificativas de confiança dos analistas (reproduzidas literalmente)</p>
          <ul className="mt-1 space-y-1">
            {d.base_justificativas_confianca.map((b, i) => (
              <li key={i} className="flex flex-wrap items-center gap-1">
                <CandidatoBadge candidato={b.candidato} tamanho="sm" comNumero={false} />
                <ViesTag vies={b.vies} />
                <ConfiancaBadge confianca={b.confianca} />
                <span>{textoLegivel(b.justificativa_confianca)}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

/** Aproximações e diferenças entre os dois planos, com as propostas de cada lado. */
export function ComparativoLista({ aproximacoes, diferencas }: ComparativoListaProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="cartao">
        <h3 className="font-semibold text-gray-900">Aproximações</h3>
        {aproximacoes.length ? (
          <ul className="mt-2 space-y-3 text-sm">
            {aproximacoes.map((p, i) => (
              <li key={i}>
                {textoLegivel(p.ponto)}
                <Ids p={p} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-gray-700">Nenhuma aproximação registrada pela síntese.</p>
        )}
      </div>
      <div className="cartao">
        <h3 className="font-semibold text-gray-900">Diferenças</h3>
        {diferencas.length ? (
          <ul className="mt-2 space-y-3 text-sm">
            {diferencas.map((p, i) => (
              <li key={i}>
                {textoLegivel(p.ponto)}
                <Ids p={p} />
                {"tipo" in p && p.tipo === "concretude" ? <Concretude d={p} /> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-gray-700">Nenhuma diferença registrada pela síntese.</p>
        )}
      </div>
    </div>
  );
}
