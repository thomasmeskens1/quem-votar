import type { CandidatoId, CenarioSintese, OrigemCenario } from "@/types";
import { getFonteContexto, getItemContexto } from "@/lib/data/ri";
import { ROTULO_RELACAO } from "@/lib/rotulos";
import { ConfiancaBadge, HorizonteBadge } from "../ConfiancaBadge";
import { ViesTag } from "../ViesTag";
import { PropostaRef } from "../conteudo/PropostaRef";
import { CadeiaSobDemanda } from "../sobDemanda/CadeiaSobDemanda";

export interface CenarioCardProps {
  cenario: CenarioSintese;
  candidato: CandidatoId;
  /** Índice do tema na síntese de RI (para carregar a cadeia). */
  temaIndice: number;
  /** Índice do cenário dentro do tema. */
  cenarioIndice: number;
}

/** Fontes de uma origem: propostas citadas e fontes oficiais dos fatos (sempre visíveis). */
function Base({ o }: { o: OrigemCenario }) {
  const props = o.cadeia.filter((p) => p.passo === "proposta" && p.ref_id).map((p) => p.ref_id!);
  const fontes = new Map<string, { o: string; u: string; t: string }>();
  for (const p of o.cadeia) {
    if (p.passo !== "contexto" || !p.ref_id) continue;
    for (const fid of getItemContexto(p.ref_id)?.fonte_ids ?? []) {
      const f = getFonteContexto(fid);
      if (f) fontes.set(fid, { o: f.orgao, u: f.url, t: f.titulo });
    }
  }
  return (
    <div className="meta mt-2 space-y-1">
      {props.length ? (
        <p className="fila">
          <span className="font-medium">Proposta:</span>
          {props.map((id) => (
            <PropostaRef key={id} id={id} />
          ))}
        </p>
      ) : null}
      {fontes.size ? (
        <p className="fila">
          <span className="font-medium">Fato oficial:</span>
          {[...fontes.values()].map((f) => (
            <a key={f.u} href={f.u} title={f.t} className="lk">
              <span className="tag-fonte">Oficial</span> {f.o}
            </a>
          ))}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Cenário de RI por viés de origem: horizonte, confiança e as fontes ficam no
 * HTML; a cadeia completa e a justificativa da confiança são carregadas ao abrir.
 */
export function CenarioCard({ cenario, candidato, temaIndice, cenarioIndice }: CenarioCardProps) {
  return (
    <article className="cartao bg-gray-50">
      <h4 className="font-semibold text-gray-900">{cenario.titulo}</h4>
      <p className="meta mt-1">
        {ROTULO_RELACAO[cenario.relacao_entre_vieses] ?? cenario.relacao_entre_vieses}
      </p>
      <div className="mt-2 space-y-3">
        {cenario.origens.map((o, i) => (
          <div key={i} className={`caixa bl-${o.vies}`}>
            <div className="fila">
              <ViesTag vies={o.vies} />
              <HorizonteBadge horizonte={o.horizonte} />
              <ConfiancaBadge confianca={o.confianca} />
            </div>
            <Base o={o} />
            <CadeiaSobDemanda
              candidato={candidato}
              tema={temaIndice}
              cenario={cenarioIndice}
              origem={i}
              nPassos={o.cadeia.length}
              titulo={cenario.titulo}
            />
          </div>
        ))}
      </div>
    </article>
  );
}
