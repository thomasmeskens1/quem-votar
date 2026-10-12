import type { Metadata } from "next";
import Link from "next/link";
import { CandidatoBadge } from "@/components/CandidatoBadge";
import { ParCandidatos } from "@/components/ParCandidatos";
import { getDossie } from "@/lib/data/rh";
import { getRegistro } from "@/lib/data/propostas";
import { formatarData } from "@/lib/rotulos";

export const metadata: Metadata = {
  title: "Candidatos",
  description: "Dossiês dos candidatos do 2º turno, com fontes oficiais.",
};

export default function CandidatosIndex() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Candidatos</h1>
        <p className="mt-2 max-w-3xl text-gray-800">
          Dossiês com formação, trajetória, cargos, declarações ao TSE, processos, ações cíveis,
          consultas sem registro, reportagens (sempre identificadas) e lacunas. As seções são as
          mesmas para os dois candidatos.
        </p>
      </header>
      <ParCandidatos
        comCabecalho={false}
        render={(c) => {
          const r = getRegistro(c);
          const d = getDossie(c);
          return (
            <div className="space-y-2 text-sm">
              <CandidatoBadge candidato={c} tamanho="lg" />
              <p>{r.nome_completo}</p>
              <p className="text-gray-700">{r.partido}</p>
              <p className="text-xs text-gray-700">
                {d.fontes.length} fontes consultadas · atualizado em {formatarData(d.gerado_em)}
              </p>
              <p className="flex flex-col gap-1">
                <Link href={`/candidatos/${c}`} className="lk font-medium">
                  Dossiê: trajetória, cargos, declarações e lacunas
                </Link>
                <Link href={`/candidatos/${c}/processos`} className="lk font-medium">
                  Dossiê: processos, ações e reportagens
                </Link>
              </p>
            </div>
          );
        }}
      />
    </div>
  );
}
