#!/usr/bin/env node
/**
 * Sincroniza os dados do projeto para dentro de web/ antes de `dev` e `build`.
 *
 * - ../dados/**            -> web/content/**        (exceto dados/revisao, que é interno)
 * - ../dados/eleicao/**    -> web/public/dados/eleicao/**  (servido estaticamente)
 * - ../fontes/<c>/plano-de-governo.pdf -> web/public/fontes/<c>/plano-de-governo.pdf
 * - ../fontes/<c>/registro.json        -> web/content/fontes/<c>/registro.json
 * - ../dados/revisao/ausencias.json     -> web/content/agenda.json (somente versao, metodo e
 *   checklist: id, vies_origem, categoria, item, criterio — autorizado pelo orquestrador)
 * - JSON enxutos carregados sob demanda pelo navegador -> web/public/dados/{propostas,rp,ri,rh}/
 *
 * As pastas geradas estão no .gitignore. Se ../dados não existir (ex.: deploy
 * feito só com a pasta web/), o script mantém o conteúdo já presente.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const webDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rootDir = path.resolve(webDir, "..");
const dadosDir = path.join(rootDir, "dados");
const fontesDir = path.join(rootDir, "fontes");

const contentDir = path.join(webDir, "content");
const publicFontesDir = path.join(webDir, "public", "fontes");
const publicDadosDir = path.join(webDir, "public", "dados");
const publicEleicaoDir = path.join(publicDadosDir, "eleicao");

const EXCLUIR_DE_DADOS = new Set(["revisao"]);

function copiarArvore(origem, destino, filtroTopo) {
  let n = 0;
  fs.mkdirSync(destino, { recursive: true });
  for (const entrada of fs.readdirSync(origem, { withFileTypes: true })) {
    if (filtroTopo && !filtroTopo(entrada.name)) continue;
    const o = path.join(origem, entrada.name);
    const d = path.join(destino, entrada.name);
    if (entrada.isDirectory()) n += copiarArvore(o, d);
    else if (entrada.isFile()) {
      fs.copyFileSync(o, d);
      n += 1;
    }
  }
  return n;
}

function limpar(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function main() {
  if (!fs.existsSync(dadosDir)) {
    if (fs.existsSync(contentDir)) {
      console.log("[sync-data] ../dados não encontrado; mantendo web/content existente.");
      return;
    }
    console.error("[sync-data] ../dados não encontrado e web/content não existe.");
    process.exit(1);
  }

  limpar(contentDir);
  const nDados = copiarArvore(dadosDir, contentDir, (nome) => !EXCLUIR_DE_DADOS.has(nome));

  let nEleicao = 0;
  limpar(publicEleicaoDir);
  const eleicaoDir = path.join(dadosDir, "eleicao");
  if (fs.existsSync(eleicaoDir)) nEleicao = copiarArvore(eleicaoDir, publicEleicaoDir);

  let nPdf = 0;
  limpar(publicFontesDir);
  if (fs.existsSync(fontesDir)) {
    for (const cand of fs.readdirSync(fontesDir, { withFileTypes: true })) {
      if (!cand.isDirectory()) continue;
      const pdf = path.join(fontesDir, cand.name, "plano-de-governo.pdf");
      const reg = path.join(fontesDir, cand.name, "registro.json");
      if (fs.existsSync(pdf)) {
        fs.mkdirSync(path.join(publicFontesDir, cand.name), { recursive: true });
        fs.copyFileSync(pdf, path.join(publicFontesDir, cand.name, "plano-de-governo.pdf"));
        nPdf += 1;
      }
      if (fs.existsSync(reg)) {
        fs.mkdirSync(path.join(contentDir, "fontes", cand.name), { recursive: true });
        fs.copyFileSync(reg, path.join(contentDir, "fontes", cand.name, "registro.json"));
      }
    }
  }

  const nAgenda = publicarAgenda();
  const nSobDemanda = publicarSobDemanda();

  fs.writeFileSync(
    path.join(contentDir, "_sync.json"),
    JSON.stringify({ sincronizado_em: new Date().toISOString() }, null, 2),
  );
  console.log(
    `[sync-data] ${nDados} arquivos em content/, ${nEleicao} em public/dados/eleicao/, ` +
      `${nPdf} PDFs em public/fontes/, ${nAgenda} itens em content/agenda.json, ` +
      `${nSobDemanda} JSON sob demanda em public/dados/.`,
  );
}

/**
 * Publica a lista comum de agenda (diretriz 12) a partir de dados/revisao/ausencias.json,
 * copiando SOMENTE versao, metodo e checklist (id, vies_origem, categoria, item, criterio).
 */
function publicarAgenda() {
  const origem = path.join(dadosDir, "revisao", "ausencias.json");
  if (!fs.existsSync(origem)) return 0;
  const a = JSON.parse(fs.readFileSync(origem, "utf8"));
  const checklist = (Array.isArray(a.checklist) ? a.checklist : []).map((i) => ({
    id: i.id,
    vies_origem: i.vies_origem,
    categoria: i.categoria,
    item: i.item,
    criterio: i.criterio,
  }));
  const saida = { versao: a.versao ?? null, ...(a.metodo ? { metodo: a.metodo } : {}), checklist };
  fs.writeFileSync(path.join(contentDir, "agenda.json"), JSON.stringify(saida, null, 2));
  return checklist.length;
}

const CANDIDATOS = ["lula", "flavio"];
const VIESES = ["esquerda", "centro", "direita"];

function escreverJson(rel, dados) {
  const destino = path.join(publicDadosDir, rel);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, JSON.stringify(dados));
}

/**
 * JSON estáticos carregados sob demanda pelo navegador (mantém o HTML leve):
 * propostas enxutas, análises de RP/RI por viés e dossiês de RH.
 */
function publicarSobDemanda() {
  for (const sub of ["propostas", "rp", "ri", "rh"]) limpar(path.join(publicDadosDir, sub));
  let n = 0;
  const sinteseRi = path.join(contentDir, "ri", "sintese.json");
  if (fs.existsSync(sinteseRi)) {
    const s = JSON.parse(fs.readFileSync(sinteseRi, "utf8"));
    s.categorias.forEach((t, i) => {
      // cenários por tema (índice na síntese) → cenário → origem: cadeia, justificativa, título original
      escreverJson(
        `ri/cenarios/${i}.json`,
        t.cenarios.map((c) =>
          c.origens.map((o) => ({
            cadeia: o.cadeia,
            j: o.justificativa_confianca,
            to: o.titulo_original,
          })),
        ),
      );
      n += 1;
    });
  }
  const contexto = path.join(contentDir, "ri", "contexto.json");
  if (fs.existsSync(contexto)) {
    const ctx = JSON.parse(fs.readFileSync(contexto, "utf8"));
    const itens = {};
    for (const [secao, lista] of Object.entries(ctx.secoes)) {
      if (secao === "lacunas" || !Array.isArray(lista)) continue;
      for (const i of lista) itens[i.id] = { tema: i.tema, data: i.data_referencia ?? null, f: i.fonte_ids };
    }
    const fontes = {};
    for (const f of ctx.fontes) fontes[f.id] = { o: f.orgao, t: f.titulo, u: f.url };
    escreverJson("ri/contexto.json", { itens, fontes });
    n += 1;
  }
  for (const c of CANDIDATOS) {
    const prop = path.join(contentDir, "propostas", `${c}.json`);
    if (fs.existsSync(prop)) {
      const d = JSON.parse(fs.readFileSync(prop, "utf8"));
      const itens = {};
      for (const i of d.itens) {
        itens[i.id] = {
          t: i.tipo,
          p: i.pagina,
          pf: i.pagina_fim ?? null,
          tl: i.trecho_literal,
          r: i.resumo_neutro,
          cp: i.categoria_principal,
        };
      }
      escreverJson(`propostas/${c}.json`, itens);
      n += 1;
    }
    for (const origem of ["rp", "ri"]) {
      for (const v of VIESES) {
        const f = path.join(contentDir, origem, v, `${c}.json`);
        if (!fs.existsSync(f)) continue;
        const d = JSON.parse(fs.readFileSync(f, "utf8"));
        const analises = d.analises.map((a) => ({
          categoria: a.categoria ?? a.tema,
          pros: a.pros,
          contras: a.contras,
          observacao: a.observacao ?? null,
        }));
        escreverJson(`${origem}/${v}/${c}.json`, analises);
        n += 1;
      }
    }
    const rh = path.join(contentDir, "rh", `${c}.json`);
    if (fs.existsSync(rh)) {
      const d = JSON.parse(fs.readFileSync(rh, "utf8"));
      const det = (lista) =>
        lista.map((p) => ({
          historico_status: p.historico_status,
          trecho_fonte: p.trecho_fonte ?? null,
          observacao: p.observacao ?? null,
        }));
      escreverJson(`rh/${c}.json`, {
        fontes: d.fontes.map((f) => ({
          id: f.id,
          t: f.titulo,
          o: f.orgao_ou_veiculo,
          u: f.url,
          tp: f.tipo,
          a: f.data_acesso ?? null,
          dp: f.data_publicacao ?? null,
        })),
        processos_e_investigacoes: det(d.secoes.processos_e_investigacoes),
        acoes_civeis: det(d.secoes.acoes_civeis),
      });
      n += 1;
    }
  }
  return n;
}

main();
