import path from "node:path";
import type { CandidatoId } from "@/types/comum";
import { CANDIDATOS_ORDEM } from "@/types/comum";
import { lerJsonOpcional } from "@/lib/data/ler";
import { getItem } from "@/lib/data/propostas";
import { slugify } from "@/lib/slug";
import exemplo from "./__fixtures__/perguntas.exemplo.json";
import type {
  CitacaoView,
  PerguntaArquivo,
  PerguntasArquivo,
  PerguntaView,
  PosicaoCandidato,
  PosicaoView,
  QuizDados,
} from "./tipos";

/**
 * Carrega as perguntas do quiz (somente no servidor / durante o build).
 * Lê content/quiz/perguntas.json (cópia de dados/quiz/perguntas.json feita pelo
 * sync-data); enquanto o arquivo não existir, usa a fixture de exemplo.
 * Cada citação recebe a página do PDF a partir de content/propostas/<c>.json.
 */
const POSICOES: readonly PosicaoCandidato[] = ["a_favor", "contra", "sem_proposta"];

function normalizar(t: string): string {
  return t.replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();
}

function montarPosicao(p: PerguntaArquivo, c: CandidatoId): PosicaoView {
  const bruto = p.posicoes?.[c];
  if (!bruto || !POSICOES.includes(bruto.posicao)) {
    throw new Error(`[quiz] Pergunta ${p.id}: posição inválida para ${c}.`);
  }
  if (bruto.posicao === "sem_proposta") return { posicao: "sem_proposta", citacoes: [] };

  const citacoes: CitacaoView[] = [];
  for (const cit of bruto.citacoes ?? []) {
    const item = getItem(cit.proposta_id);
    if (!item || !cit.proposta_id.startsWith(`${c}-`)) {
      throw new Error(`[quiz] Pergunta ${p.id}: proposta ${cit.proposta_id} não encontrada para ${c}.`);
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
    return { posicao: "sem_proposta", citacoes: [] };
  }
  return { posicao: bruto.posicao, citacoes };
}

function montarPergunta(p: PerguntaArquivo): PerguntaView {
  if (!p.id || !p.afirmacao || !p.categoria) {
    throw new Error(`[quiz] Pergunta incompleta: ${JSON.stringify(p).slice(0, 120)}`);
  }
  const posicoes = Object.fromEntries(
    CANDIDATOS_ORDEM.map((c) => [c, montarPosicao(p, c)]),
  ) as Record<CandidatoId, PosicaoView>;
  return {
    id: p.id,
    categoria: p.categoria,
    categoriaSlug: slugify(p.categoria),
    afirmacao: p.afirmacao,
    explicacao: p.explicacao?.trim() || null,
    posicoes,
  };
}

export function getQuizDados(): QuizDados {
  const real = lerJsonOpcional<PerguntasArquivo>(
    path.join(process.cwd(), "content", "quiz", "perguntas.json"),
  );
  const arquivo = real ?? (exemplo as PerguntasArquivo);
  if (!Array.isArray(arquivo.perguntas) || arquivo.perguntas.length === 0) {
    throw new Error("[quiz] perguntas.json sem perguntas.");
  }
  const ids = new Set<string>();
  for (const p of arquivo.perguntas) {
    if (ids.has(p.id)) throw new Error(`[quiz] id de pergunta repetido: ${p.id}`);
    ids.add(p.id);
  }
  return { exemplo: !real, perguntas: arquivo.perguntas.map(montarPergunta) };
}
