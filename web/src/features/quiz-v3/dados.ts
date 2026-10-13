import path from "node:path";
import type { CandidatoId } from "@/types/comum";
import { CANDIDATOS_ORDEM } from "@/types/comum";
import { lerJsonOpcional } from "@/lib/data/ler";
import { getItem } from "@/lib/data/propostas";
import { slugify } from "@/lib/slug";
import exemplo from "./__fixtures__/perguntas.v2.exemplo.json";
import type {
  Caminho,
  CitacaoView,
  PerguntaArquivo,
  PerguntasArquivo,
  PerguntaView,
  PosicaoView,
  QuizDados,
  TermoView,
} from "./tipos";

/**
 * Carrega as perguntas do quiz, versão 2 (somente no servidor / durante o build).
 * Lê content/quiz/perguntas.json (cópia de dados/quiz/perguntas.json feita pelo
 * sync-data) apenas quando "versao" === 2; caso contrário, usa a fixture de exemplo.
 * Cada citação recebe a página do PDF a partir de content/propostas/<c>.json.
 */
const CAMINHOS: readonly Caminho[] = ["A", "B"];
const TIPOS = ["dilema", "unilateral", "convergente"];

function normalizar(t: string): string {
  return t.replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();
}

function texto(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function montarPosicao(p: PerguntaArquivo, c: CandidatoId): PosicaoView {
  const bruto = p.posicoes?.[c];
  if (!bruto || !(bruto.opcao === null || CAMINHOS.includes(bruto.opcao))) {
    throw new Error(`[quiz] Pergunta ${p.id}: opção inválida para ${c} (use A, B ou null).`);
  }
  for (const id of bruto.proposta_ids ?? []) {
    if (!id.startsWith(`${c}-`) || !getItem(id)) {
      throw new Error(`[quiz] Pergunta ${p.id}: proposta ${id} não encontrada para ${c}.`);
    }
  }
  if (bruto.opcao === null) return { opcao: null, citacoes: [] };

  const citacoes: CitacaoView[] = [];
  for (const cit of bruto.citacoes ?? []) {
    const item = getItem(cit.proposta_id);
    if (!item || !cit.proposta_id.startsWith(`${c}-`)) {
      throw new Error(`[quiz] Pergunta ${p.id}: proposta ${cit.proposta_id} não encontrada para ${c}.`);
    }
    if (item.tipo !== "proposta") {
      console.warn(`[quiz] Pergunta ${p.id}: ${cit.proposta_id} não é item do tipo proposta.`);
    }
    if (!normalizar(item.trecho_literal).includes(normalizar(cit.texto))) {
      console.warn(`[quiz] Pergunta ${p.id}: citação de ${cit.proposta_id} não é trecho literal exato.`);
    }
    citacoes.push({
      propostaId: cit.proposta_id,
      texto: cit.texto,
      pagina: item.pagina ?? null,
      paginaFim: item.pagina_fim ?? null,
    });
  }
  if (citacoes.length === 0) {
    // Diretriz 18: posição só vem de trecho citado. Sem citação, a posição não é usada.
    console.warn(`[quiz] Pergunta ${p.id}: ${c} sem citação; tratado como sem proposta registrada.`);
    return { opcao: null, citacoes: [] };
  }
  return { opcao: bruto.opcao, citacoes };
}

function montarTermos(p: PerguntaArquivo): TermoView[] {
  if (p.termos !== undefined && !Array.isArray(p.termos)) {
    throw new Error(`[quiz] Pergunta ${p.id}: "termos" deve ser uma lista.`);
  }
  return (p.termos ?? [])
    .map((t) => ({ termo: texto(t?.termo), explicacao: texto(t?.explicacao) }))
    .filter((t) => {
      if (t.termo && t.explicacao) return true;
      console.warn(`[quiz] Pergunta ${p.id}: termo sem nome ou sem explicação ignorado.`);
      return false;
    });
}

function montarPergunta(p: PerguntaArquivo): PerguntaView {
  const situacao = texto(p.situacao);
  const pergunta = texto(p.pergunta);
  const opcoes = { A: texto(p.opcoes?.A), B: texto(p.opcoes?.B) };
  if (!p.id || !p.categoria || !situacao || !pergunta || !opcoes.A || !opcoes.B) {
    throw new Error(`[quiz] Pergunta incompleta: ${JSON.stringify(p).slice(0, 120)}`);
  }
  if (p.tipo !== undefined && !TIPOS.includes(p.tipo)) {
    console.warn(`[quiz] Pergunta ${p.id}: tipo de par desconhecido (${String(p.tipo)}).`);
  }
  const posicoes = Object.fromEntries(
    CANDIDATOS_ORDEM.map((c) => [c, montarPosicao(p, c)]),
  ) as Record<CandidatoId, PosicaoView>;
  if (CANDIDATOS_ORDEM.every((c) => posicoes[c].opcao === null)) {
    console.warn(`[quiz] Pergunta ${p.id}: nenhum candidato com posição; não entra em nenhum cálculo.`);
  }
  return {
    id: p.id,
    categoria: p.categoria,
    categoriaSlug: slugify(p.categoria),
    situacao,
    fonteSituacao: texto(p.fonte_situacao) || null,
    pergunta,
    opcoes,
    termos: montarTermos(p),
    posicoes,
  };
}

export function getQuizDados(): QuizDados {
  const real = lerJsonOpcional<PerguntasArquivo>(
    path.join(process.cwd(), "content", "quiz", "perguntas.json"),
  );
  const usarReal = real?.versao === 2;
  const arquivo = usarReal ? real : (exemplo as PerguntasArquivo);
  if (!Array.isArray(arquivo.perguntas) || arquivo.perguntas.length === 0) {
    throw new Error("[quiz] perguntas.json sem perguntas.");
  }
  const ids = new Set<string>();
  for (const p of arquivo.perguntas) {
    if (ids.has(p.id)) throw new Error(`[quiz] id de pergunta repetido: ${p.id}`);
    ids.add(p.id);
  }
  return {
    exemplo: !usarReal || arquivo.exemplo === true,
    perguntas: arquivo.perguntas.map(montarPergunta),
  };
}
