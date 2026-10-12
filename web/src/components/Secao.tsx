import type { ReactNode } from "react";

export interface SecaoProps {
  id: string;
  titulo: string;
  descricao?: ReactNode;
  children: ReactNode;
}

/** Seção de página com título h2 ancorável. */
export function Secao({ id, titulo, descricao, children }: SecaoProps) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-20">
      <h2 id={`${id}-titulo`} className="text-xl font-bold text-gray-900">
        {titulo}
      </h2>
      {descricao ? <div className="mt-1 max-w-3xl text-sm text-gray-700">{descricao}</div> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}
