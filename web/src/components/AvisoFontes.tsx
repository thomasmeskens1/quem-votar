"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/** Evento global para reabrir o aviso (usado pelo link "Sobre as fontes" do rodapé). */
export const EVENTO_ABRIR_AVISO = "voto-em-quem:abrir-aviso";

const CHAVE = "voto-em-quem:aviso-fontes-visto";
/** Último recurso se o armazenamento do navegador falhar: uma vez por sessão (carga da página). */
let vistoNestaSessao = false;

function jaVisto(): boolean {
  if (vistoNestaSessao) return true;
  try {
    if (window.localStorage.getItem(CHAVE)) return true;
  } catch {
    /* armazenamento indisponível */
  }
  try {
    if (window.sessionStorage.getItem(CHAVE)) return true;
  } catch {
    /* armazenamento indisponível */
  }
  return false;
}

function marcarVisto() {
  vistoNestaSessao = true;
  try {
    window.localStorage.setItem(CHAVE, "1");
    return;
  } catch {
    /* tenta a sessão */
  }
  try {
    window.sessionStorage.setItem(CHAVE, "1");
  } catch {
    /* fica só em memória */
  }
}

/**
 * Aviso exibido na primeira visita (qualquer página de entrada). Usa <dialog>
 * nativo com showModal(): fundo escurecido, conteúdo da página inerte (foco
 * preso no aviso), Esc fecha. O servidor renderiza o diálogo fechado, então
 * não há diferença de hidratação; a abertura acontece só no navegador.
 */
export function AvisoFontes() {
  const ref = useRef<HTMLDialogElement>(null);
  const botao = useRef<HTMLButtonElement>(null);
  const retorno = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;

    const abrir = () => {
      if (d.open) return;
      retorno.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      document.documentElement.classList.add("modal-aberto");
      try {
        d.showModal();
      } catch {
        d.setAttribute("open", "");
      }
      botao.current?.focus();
    };
    const aoFechar = () => {
      marcarVisto();
      document.documentElement.classList.remove("modal-aberto");
      const r = retorno.current;
      if (r && r !== document.body && document.contains(r)) r.focus();
    };

    d.addEventListener("close", aoFechar);
    window.addEventListener(EVENTO_ABRIR_AVISO, abrir);
    if (!jaVisto()) abrir();
    return () => {
      d.removeEventListener("close", aoFechar);
      window.removeEventListener(EVENTO_ABRIR_AVISO, abrir);
      document.documentElement.classList.remove("modal-aberto");
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-modal="true"
      aria-labelledby="aviso-titulo"
      aria-describedby="aviso-texto"
      className="aviso"
    >
      <h2 id="aviso-titulo" className="text-lg font-bold tracking-wide text-gray-900">
        ATENÇÃO!
      </h2>
      <div id="aviso-texto" className="mt-3 space-y-3 text-sm leading-relaxed text-gray-800">
        <p>
          Todas as informações deste site foram extraídas de <strong>fontes oficiais</strong>: os
          planos de governo registrados no <strong>Tribunal Superior Eleitoral</strong>, dados
          públicos da <strong>Justiça Eleitoral</strong>, de tribunais, de órgãos de controle e do{" "}
          <strong>Congresso Nacional</strong>. Cada dado apresentado indica a sua origem.
        </p>
        <p>
          Quando uma informação não tiver comprovação em fonte oficial — como matérias da imprensa
          —, isso é sinalizado de forma expressa, e ela não é apresentada como fato comprovado.
        </p>
        <p>
          <strong>Este site não recomenda voto em nenhum candidato.</strong>
        </p>
      </div>
      <div className="mt-5 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/metodologia" className="lk text-center text-sm" onClick={() => ref.current?.close()}>
          Saiba mais da nossa Metodologia
        </Link>
        <form method="dialog">
          <button
            ref={botao}
            type="submit"
            className="w-full rounded bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-700 sm:w-auto"
          >
            Entendi
          </button>
        </form>
      </div>
    </dialog>
  );
}

/** Link discreto (botão) que reabre o aviso. */
export function ReabrirAviso({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      className={`lk ${className}`}
      onClick={() => window.dispatchEvent(new Event(EVENTO_ABRIR_AVISO))}
    >
      Sobre as fontes
    </button>
  );
}
