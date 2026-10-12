import type {
  CandidatoId,
  ConvergenciaParcial,
  Divergencia,
  PontoConsenso,
  RefArgumento,
} from "@/types";
import { VIESES_ORDEM } from "@/types/comum";
import { ViesTag } from "../ViesTag";
import { PropostaRefs } from "../conteudo/PropostaRef";
import { OrigensSobDemanda } from "../sobDemanda/ArgumentosSobDemanda";
import { textoLegivel } from "@/lib/data/texto";

export interface ConsensoDivergenciasProps {
  consenso: PontoConsenso[];
  convergencias?: ConvergenciaParcial[];
  divergencias: Divergencia[];
  candidato: CandidatoId;
  /** Origem dos argumentos: Relações Públicas ou Relações Internacionais. */
  origem: "rp" | "ri";
  /** RP: categoria em que as referências são resolvidas. */
  categoria?: string;
}

/** Mantém só os campos usados no navegador (reduz o payload). */
function enxugar(refs: RefArgumento[]) {
  return refs.map(({ vies, lista, indice, indice_analise }) =>
    indice_analise === undefined ? { vies, lista, indice } : { vies, lista, indice, indice_analise },
  );
}

const TIPO = { pro: "Avaliação favorável", contra: "Ressalva" } as const;

/** Consensos (3 vieses), convergências parciais (2) e divergências lado a lado. */
export function ConsensoDivergencias({
  consenso,
  convergencias = [],
  divergencias,
  candidato,
  origem,
  categoria,
}: ConsensoDivergenciasProps) {
  const ctx = { candidato, origem, categoria };
  return (
    <div className="space-y-4 text-sm">
      <div>
        <h4 className="font-semibold text-gray-900">Consensos entre os três vieses</h4>
        {consenso.length ? (
          <ul className="mt-2 space-y-3">
            {consenso.map((p, i) => (
              <li key={i}>
                <span className="chip mr-1 font-semibold">
                  {TIPO[p.tipo]}
                </span>
                {textoLegivel(p.ponto)}
                <PropostaRefs ids={p.proposta_ids} />
                <OrigensSobDemanda refs={enxugar(p.refs)} {...ctx} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-gray-700">Nenhum ponto de consenso registrado pela síntese.</p>
        )}
      </div>
      {convergencias.length ? (
        <div>
          <h4 className="font-semibold text-gray-900">Convergências parciais (dois vieses)</h4>
          <ul className="mt-2 space-y-3">
            {convergencias.map((p, i) => (
              <li key={i}>
                <span className="chip mr-1 font-semibold">
                  {TIPO[p.tipo]}
                </span>
                {textoLegivel(p.ponto)}
                <div className="mt-1 flex flex-wrap gap-1">
                  {p.vieses.map((v) => (
                    <ViesTag key={v} vies={v} />
                  ))}
                </div>
                <PropostaRefs ids={p.proposta_ids} />
                <OrigensSobDemanda refs={enxugar(p.refs)} {...ctx} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <div>
        <h4 className="font-semibold text-gray-900">Divergências</h4>
        {divergencias.length ? (
          <ul className="mt-2 space-y-4">
            {divergencias.map((d, i) => (
              <li key={i}>
                <p className="font-medium text-gray-900">{textoLegivel(d.ponto)}</p>
                {d.proposta_ids?.length ? <PropostaRefs ids={d.proposta_ids} /> : null}
                <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
                  {VIESES_ORDEM.map((v) => {
                    const pos = d.posicoes.find((p) => p.vies === v);
                    return (
                      <div key={v} className={`caixa bl-${v}`}>
                        <ViesTag vies={v} />
                        {pos ? (
                          <>
                            <p className="mt-1">{textoLegivel(pos.posicao)}</p>
                            <OrigensSobDemanda refs={enxugar(pos.refs)} {...ctx} />
                          </>
                        ) : (
                          <p className="mt-1 text-gray-700">Este viés não se manifestou sobre o ponto.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-gray-700">Nenhuma divergência registrada pela síntese.</p>
        )}
      </div>
    </div>
  );
}
