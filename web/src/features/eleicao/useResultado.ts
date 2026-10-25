"use client";

/** Busca /api/eleicao com cache em memória e atualização periódica durante a apuração. */
import { useEffect, useState } from "react";
import { caminhoApi, type Abrangencia } from "./abrangencia";
import type { RespostaApi, ResultadoAbrangencia, Turno } from "./tipos";

export interface EstadoResultado {
  dados: ResultadoAbrangencia | null;
  erro: string | null;
  aguardando: boolean;
  carregando: boolean;
}

const INTERVALO_MS = 25_000;
const memoria = new Map<string, { em: number; resp: RespostaApi }>();

async function buscar(url: string, forcar: boolean): Promise<RespostaApi> {
  const m = memoria.get(url);
  if (!forcar && m && Date.now() - m.em < INTERVALO_MS) return m.resp;
  try {
    const r = await fetch(url);
    const resp = (await r.json()) as RespostaApi;
    memoria.set(url, { em: Date.now(), resp });
    return resp;
  } catch {
    return { ok: false, erro: "Falha de rede ao consultar os resultados." };
  }
}

/** Se `abr` for null, não busca nada. */
export function useResultado(turno: Turno, abr: Abrangencia | null): EstadoResultado {
  const url = abr ? caminhoApi(turno, abr) : null;
  const [estado, setEstado] = useState<EstadoResultado & { url: string | null }>({
    url: null,
    dados: null,
    erro: null,
    aguardando: false,
    carregando: false,
  });

  useEffect(() => {
    if (!url) return;
    let vivo = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Enquanto estado.url !== url, o retorno abaixo já indica "carregando".
    const ciclo = async (forcar: boolean) => {
      const resp = await buscar(url, forcar);
      if (!vivo) return;
      if (resp.ok) {
        setEstado({ url, dados: resp.dados, erro: null, aguardando: false, carregando: false });
        const emAndamento = resp.dados.fonte.tipo === "ao-vivo" && !resp.dados.apuracao?.finalizada;
        if (emAndamento) timer = setTimeout(() => ciclo(true), INTERVALO_MS);
      } else {
        setEstado((e) => ({
          url,
          dados: e.url === url ? e.dados : null,
          erro: resp.erro,
          aguardando: !!resp.aguardando,
          carregando: false,
        }));
        if (resp.aguardando) timer = setTimeout(() => ciclo(true), INTERVALO_MS * 2);
      }
    };
    ciclo(false);
    return () => {
      vivo = false;
      if (timer) clearTimeout(timer);
    };
  }, [url]);

  if (!url) return { dados: null, erro: null, aguardando: false, carregando: false };
  if (estado.url !== url) {
    // Volta a uma área já vista: usa a resposta em memória, sem piscar.
    const m = memoria.get(url);
    if (m?.resp.ok) return { dados: m.resp.dados, erro: null, aguardando: false, carregando: true };
    return { dados: null, erro: null, aguardando: false, carregando: true };
  }
  return estado;
}
