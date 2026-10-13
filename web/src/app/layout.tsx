import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import Link from "next/link";
import { AvisoFontes, ReabrirAviso } from "@/components/AvisoFontes";
import { NavPrincipal } from "@/components/NavPrincipal";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Voto em Quem — comparação das propostas do 2º turno",
    template: "%s · Voto em Quem",
  },
  description:
    "Comparação das propostas de governo registradas no TSE pelos candidatos do 2º turno da eleição presidencial de 2026, com fontes oficiais.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-white text-gray-900">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow"
        >
          Pular para o conteúdo
        </a>
        <header className="sticky top-0 z-40 border-b border-gray-300 bg-gray-50/95 backdrop-blur supports-[backdrop-filter]:bg-gray-50/85">
          <div className="relative mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between">
            <Link href="/" className="py-1 text-lg font-bold text-gray-900">
              Voto em Quem
            </Link>
            <NavPrincipal />
          </div>
        </header>
        <main id="conteudo" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
          {children}
        </main>
        <footer className="border-t border-gray-300 bg-gray-50">
          <div className="mx-auto max-w-6xl px-4 py-4 text-xs text-gray-700">
            <p>
              Fontes: planos de governo registrados no TSE e fontes oficiais citadas em cada
              informação. Candidatos sempre exibidos na ordem do número de urna (13, 22).{" "}
              <Link href="/metodologia" className="lk">
                Metodologia
              </Link>
              {" · "}
              <ReabrirAviso />
              {" · "}
              <Link href="/privacidade" className="lk">
                Privacidade
              </Link>
            </p>
          </div>
        </footer>
        <AvisoFontes />
        <Analytics />
      </body>
    </html>
  );
}
