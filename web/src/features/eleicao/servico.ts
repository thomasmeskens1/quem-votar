/**
 * Escolha da fonte de dados (servidor):
 *  - 1º turno, modo "auto": arquivos estáticos oficiais (dados/eleicao, completos e
 *    com cod_ibge/país); se ainda não existirem, JSON ao vivo do TSE.
 *  - 2º turno: JSON ao vivo do TSE. Se o TSE falhar, devolve erro "aguardando"
 *    (a página mostra o 1º turno e o estado "aguardando apuração"); se já houver
 *    estáticos do 2º turno, eles são usados como reserva.
 *  - modo "tse": força o TSE ao vivo (com reserva nos estáticos se falhar).
 *  - modo "estatico": só arquivos estáticos.
 */
import type { Abrangencia } from "./abrangencia";
import { lerEstatico } from "./estatico";
import { resultadoAoVivo } from "./tse/cliente";
import type { ResultadoAbrangencia, Turno } from "./tipos";

export type ModoFonte = "auto" | "tse" | "estatico";

export class SemDados extends Error {
  constructor(
    msg: string,
    readonly aguardando: boolean,
  ) {
    super(msg);
  }
}

export async function obterResultado(
  turno: Turno,
  abr: Abrangencia,
  modo: ModoFonte = "auto",
): Promise<ResultadoAbrangencia> {
  const estatico = () => lerEstatico(turno, abr).catch(() => null);

  if (modo === "estatico" || (modo === "auto" && turno === 1)) {
    const e = await estatico();
    if (e) return e;
    if (modo === "estatico") throw new SemDados("Arquivo estático não encontrado", false);
  }

  try {
    return await resultadoAoVivo(turno, abr);
  } catch (erro) {
    const e = await estatico();
    if (e) {
      return {
        ...e,
        avisos: [...(e.avisos ?? []), "TSE indisponível no momento; exibindo arquivo oficial consolidado."],
      };
    }
    console.warn("[eleicao] TSE indisponível:", erro instanceof Error ? erro.message : erro);
    throw new SemDados("Não foi possível obter os dados do TSE no momento. Nova tentativa em instantes.", turno === 2);
  }
}
