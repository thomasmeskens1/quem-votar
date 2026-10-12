// Testes mínimos do normalizador e dos cálculos (sem dependências).
// Executar dentro de web/:  node src/features/eleicao/__tests__/normalizar.test.mjs
// Requer Node >= 22.18 / 23.6 (remoção de tipos nativa para importar .ts).
// Opcional: AO_VIVO=1 também baixa os JSON reais do TSE e confere as regras do esquema.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  conferirTotais,
  dataHoraTse,
  inteiro,
  municipiosDaUf,
  normalizarResultadoU,
  somar,
  titulo,
} from "../tse/normalizar.ts";
import { comparar, formatarDelta, intensidade, lider, percentuais } from "../calculos.ts";
import { parseAbrangencia, parseTurno, segmentos } from "../abrangencia.ts";

const fixture = (nome) => JSON.parse(readFileSync(new URL(`./fixtures/${nome}`, import.meta.url), "utf8"));

test("inteiro aceita só inteiros não negativos", () => {
  assert.equal(inteiro("123"), 123);
  assert.equal(inteiro("51,93"), 0);
  assert.equal(inteiro(undefined), 0);
  assert.equal(inteiro("-5"), 0);
});

test("dataHoraTse converte para ISO de Brasília", () => {
  assert.equal(dataHoraTse("25/10/2026", "18:39:51"), "2026-10-25T18:39:51-03:00");
  assert.equal(dataHoraTse("", ""), null);
});

test("normaliza arquivo -u parcial do TSE", () => {
  const n = normalizarResultadoU(fixture("tse-u-parcial.json"));
  assert.equal(n.turno, 2);
  assert.deepEqual(n.totais, {
    eleitores_aptos: 4000, comparecimento: 900, abstencoes: 100, votos_validos: 850, brancos: 20, nulos: 30,
  });
  assert.deepEqual(n.candidatos, [{ numero: 22, votos: 450 }, { numero: 13, votos: 400 }]);
  assert.deepEqual(n.candidatos_info.map((c) => c.numero), [13, 22]); // ordem do TSE (seq)
  assert.equal(n.candidatos_info[1].nome_urna, "FLAVIO BOLSONARO");
  assert.equal(n.candidatos_info[1].partido, "PL");
  assert.equal(n.apuracao.pct_secoes_totalizadas, 25);
  assert.equal(n.apuracao.finalizada, false);
  assert.equal(n.apuracao.atualizado_tse, "2026-10-25T18:39:51-03:00");
  assert.deepEqual(conferirTotais(n.totais), []);
  assert.equal(conferirTotais({ ...n.totais, abstencoes: 9999 }).length, 1);
  assert.equal(conferirTotais({ ...n.totais, brancos: 0 }).length, 1);
});

test("2º turno zerado: usa dg/hg e 0% apurado", () => {
  const n = normalizarResultadoU(fixture("tse-u-zerado.json"));
  assert.equal(n.apuracao.pct_secoes_totalizadas, 0);
  assert.equal(n.apuracao.atualizado_tse, "2026-10-12T13:32:21-03:00");
  assert.equal(lider(n.candidatos, n.totais), null);
});

test("rejeita JSON fora do formato", () => {
  assert.throws(() => normalizarResultadoU({ foo: 1 }));
  assert.throws(() => normalizarResultadoU(null));
});

test("municípios do config com cod_ibge e nome em título", () => {
  const cfg = fixture("tse-mun-config.json");
  const sp = municipiosDaUf(cfg, "SP");
  assert.equal(sp.length, 2);
  assert.deepEqual(sp[1], { cod_tse: "62910", cod_ibge: "3549904", nome: "São José dos Campos", capital: false });
  assert.equal(municipiosDaUf(cfg, "zz")[0].cod_ibge, undefined);
  assert.equal(titulo("RIO DE JANEIRO"), "Rio de Janeiro");
});

test("somar agrega totais, votos e apuração", () => {
  const a = normalizarResultadoU(fixture("tse-u-parcial.json"));
  const s = somar([a, a]);
  assert.equal(s.totais.votos_validos, 1700);
  assert.deepEqual(s.candidatos[0], { numero: 22, votos: 900 });
  assert.equal(s.apuracao.secoes_total, 400);
  assert.equal(s.apuracao.pct_secoes_totalizadas, 25);
});

test("percentuais e comparativo seguem o esquema", () => {
  const t1 = {
    totais: { eleitores_aptos: 1000, comparecimento: 800, abstencoes: 200, votos_validos: 740, brancos: 20, nulos: 40 },
    candidatos: [{ numero: 13, votos: 370 }, { numero: 22, votos: 296 }, { numero: 55, votos: 74 }],
  };
  const t2 = {
    totais: { eleitores_aptos: 1000, comparecimento: 750, abstencoes: 250, votos_validos: 700, brancos: 20, nulos: 30 },
    candidatos: [{ numero: 13, votos: 350 }, { numero: 22, votos: 350 }],
  };
  const p = percentuais(t1.totais);
  assert.equal(p.brancos, 2.5);
  assert.equal(p.abstencoes, 20);
  const l = lider(t1.candidatos, t1.totais);
  assert.equal(l.numero, 13);
  assert.ok(Math.abs(l.margem - 10) < 1e-9);
  const c = comparar(t1, t2, [13, 22]);
  assert.equal(c.candidatos[0].votos.delta, -20);
  assert.ok(Math.abs(c.candidatos[1].pct.delta - 10) < 1e-9);
  assert.equal(c.abstencoes.votos.delta, 50);
  assert.equal(formatarDelta(-20, "votos"), "−20");
  assert.ok(intensidade(0) >= 0.25 && intensidade(100) === 1);
});

test("rota: turno e abrangência validados", () => {
  assert.equal(parseTurno("2"), 2);
  assert.equal(parseTurno("3"), null);
  assert.deepEqual(parseAbrangencia(["uf", "sp", "071072"]), { nivel: "MUN", uf: "SP", municipio: "71072" });
  assert.deepEqual(parseAbrangencia(["exterior", "Estados Unidos"]), { nivel: "PAIS", pais: "Estados Unidos" });
  assert.equal(parseAbrangencia(["uf", "XX"]), null);
  assert.equal(parseAbrangencia(["uf", "SP", "../x"]), null);
  assert.equal(parseAbrangencia(["exterior", "<script>"]), null);
  assert.deepEqual(segmentos({ nivel: "CIDADE", pais: "Portugal", cidade: "29539" }), ["exterior", "Portugal", "29539"]);
});

if (process.env.AO_VIVO === "1") {
  test("AO VIVO: JSON reais do TSE (1º turno, Brasil e SP) fecham as contas", async () => {
    const base = "https://resultados.tse.jus.br/oficial/ele2026/6257/dados";
    for (const url of [`${base}/br/br-c0001-e006257-u.json`, `${base}/sp/sp-c0001-e006257-u.json`]) {
      const r = await fetch(url);
      assert.equal(r.status, 200, url);
      const n = normalizarResultadoU(await r.json());
      assert.equal(n.turno, 1);
      assert.ok(n.candidatos.length >= 2);
      assert.deepEqual(conferirTotais(n.totais), [], url);
      console.log(url, n.apuracao, n.candidatos.slice(0, 2));
    }
  });
}
