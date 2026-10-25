/**
 * Modo "só Apuração" (dia do 2º turno): todas as páginas, exceto a Apuração e a
 * Política de Privacidade, redirecionam para /eleicao, e o menu mostra só a
 * Apuração. Para reabrir o site completo, troque para false e publique.
 */
export const SO_APURACAO = true;

/** Páginas tiradas do ar enquanto SO_APURACAO estiver ligado. */
export const PAGINAS_FORA_DO_AR = [
  "/",
  "/comparativo/:path*",
  "/candidatos/:path*",
  "/internacional/:path*",
  "/metodologia",
  "/quiz",
  "/quiz-teste",
];
