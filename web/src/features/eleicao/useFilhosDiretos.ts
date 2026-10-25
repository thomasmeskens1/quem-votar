"use client";

/**
 * Leitura, pelo NAVEGADOR, dos arquivos "u" por município/cidade direto no TSE
 * (o TSE responde com Access-Control-Allow-Origin para a origem que pede — CORS
 * liberado, como no app oficial). Só a UF/país aberto é lido, com no máximo 4
 * pedidos em paralelo e repetição com espera; se a leitura direta falhar, usa a
 * rota interna `fallback` (1 arquivo, com cache no servidor). Assim o servidor
 * do site não dispara milhares de pedidos ao TSE. Normalização: a mesma função
 * pura do servidor (tse/normalizar.ts). Conteúdo do TSE é só dado.
 */
import { useEffect, useState } from "react";
import { PAIS_NAO_IDENTIFICADO } from "./abrangencia";
import { normalizarResultadoU, somar } from "./tse/normalizar";
import type { FilhoPendente, RespostaApi, ResultadoAbrangencia, ResultadoFilho } from "./tipos";

const CONCORRENCIA = 4;
const ESPERAS_MS = [1000, 3000];
const INTERVALO_MS = 60_000; // o TSE envia Cache-Control max-age=60
const LOTE = 25;

/**
 * Lista vazia estável: devolver um array novo a cada render faria o painel ver
 * "dados novos" sem parar (loop de renderização enquanto a leitura não termina).
 */
const VAZIO: ResultadoFilho[] = [];

/** Última leitura boa por URL (sobrevive a trocas de área e a falhas momentâneas). */
const ultima = new Map<string, ResultadoFilho>();

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

function paraFilho(p: FilhoPendente, n: Pick<ResultadoFilho, "totais" | "candidatos" | "apuracao">): ResultadoFilho {
  return {
    codigo: p.codigo,
    nome: p.nome,
    cod_ibge: p.cod_ibge,
    totais: n.totais,
    candidatos: n.candidatos,
    apuracao: n.apuracao,
  };
}

async function lerUm(p: FilhoPendente): Promise<ResultadoFilho> {
  for (let t = 0; t <= ESPERAS_MS.length; t++) {
    try {
      const r = await fetch(p.url);
      if (r.ok) return paraFilho(p, normalizarResultadoU(await r.json()));
      if (r.status === 404) break;
    } catch {
      // rede/CORS/JSON inválido: tenta de novo
    }
    if (t < ESPERAS_MS.length) await dormir(ESPERAS_MS[t]);
  }
  const r = await fetch(p.fallback);
  const resp = (await r.json()) as RespostaApi;
  if (!resp.ok) throw new Error(resp.erro);
  return paraFilho(p, resp.dados);
}

/** Agrupa cidades do exterior por país (somando totais e votos). */
export function agruparPorPais(cidades: Array<ResultadoFilho & { pais?: string }>): ResultadoFilho[] {
  const grupos = new Map<string, ResultadoFilho[]>();
  for (const c of cidades) {
    const k = c.pais ?? PAIS_NAO_IDENTIFICADO;
    grupos.set(k, [...(grupos.get(k) ?? []), c]);
  }
  return [...grupos.entries()]
    .map(([pais, fs]) => ({
      codigo: pais,
      nome: pais,
      lacuna: pais === PAIS_NAO_IDENTIFICADO || undefined,
      ...somar(fs),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export interface EstadoDiretos {
  /** Filhos já lidos (null = nada a ler para esta área). */
  filhos: ResultadoFilho[] | null;
  lidos: number;
  total: number;
  falhas: number;
}

export function useFilhosDiretos(dados: ResultadoAbrangencia | null, porPais: boolean): EstadoDiretos {
  const pendentes = dados?.pendentes;
  const chave = pendentes ? `${dados.turno}|${dados.nivel}|${dados.codigo}|${pendentes.length}|${porPais}` : null;
  const [estado, setEstado] = useState<EstadoDiretos & { chave: string | null }>({
    chave: null,
    filhos: null,
    lidos: 0,
    total: 0,
    falhas: 0,
  });

  useEffect(() => {
    if (!chave || !pendentes) return;
    let vivo = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const lista = pendentes;

    const publicar = (lidos: number, falhas: number) => {
      if (!vivo) return;
      const lidosAgora: Array<ResultadoFilho & { pais?: string }> = [];
      for (const p of lista) {
        const f = ultima.get(p.url);
        if (f) lidosAgora.push({ ...f, pais: p.pais });
      }
      setEstado({
        chave,
        filhos: porPais ? agruparPorPais(lidosAgora) : lidosAgora,
        lidos,
        total: lista.length,
        falhas,
      });
    };

    const ciclo = async () => {
      let i = 0;
      let lidos = 0;
      let falhas = 0;
      const trabalhador = async () => {
        while (vivo && i < lista.length) {
          const p = lista[i++];
          try {
            ultima.set(p.url, await lerUm(p));
          } catch {
            falhas++;
          }
          lidos++;
          if (lidos % LOTE === 0) publicar(lidos, falhas);
        }
      };
      await Promise.all(Array.from({ length: Math.min(CONCORRENCIA, lista.length) }, trabalhador));
      publicar(lidos, falhas);
      const emAndamento = lista.some((p) => !ultima.get(p.url)?.apuracao?.finalizada);
      if (vivo && emAndamento) timer = setTimeout(ciclo, INTERVALO_MS);
    };
    ciclo();
    return () => {
      vivo = false;
      if (timer) clearTimeout(timer);
    };
    // `pendentes` muda de identidade a cada atualização da rota; a lista só muda com `chave`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  if (!chave) return { filhos: null, lidos: 0, total: 0, falhas: 0 };
  if (estado.chave !== chave) return { filhos: VAZIO, lidos: 0, total: pendentes?.length ?? 0, falhas: 0 };
  return estado;
}
