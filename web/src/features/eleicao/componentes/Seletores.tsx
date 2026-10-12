"use client";

/** Seletor de turno e de abrangência (Brasil → UF → município; Exterior → país → cidade). */
import { useId, useState } from "react";
import type { Abrangencia } from "../abrangencia";
import { NOME_UF, UFS } from "../tse/config";
import type { Turno } from "../tipos";

/** Item escolhível (UF/município/país/cidade): só código e nome. */
export interface Opcao {
  codigo: string;
  nome: string;
}

const normal = (s: string) => s.toLocaleLowerCase("pt-BR").normalize("NFD").replace(/\p{M}/gu, "").trim();

/** Campo de busca com lista (datalist): digita parte do nome e escolhe. */
function Busca({
  rotulo,
  opcoes,
  valor,
  onEscolher,
  desabilitado,
}: {
  rotulo: string;
  opcoes: Opcao[];
  valor?: string;
  onEscolher: (f: Opcao) => void;
  desabilitado?: boolean;
}) {
  const id = useId();
  const [texto, setTexto] = useState<string | null>(null);
  const atual = opcoes.find((o) => o.codigo === valor)?.nome ?? "";
  const mostrado = texto ?? atual;

  function confirmar(v: string) {
    const q = normal(v);
    if (!q) return;
    const exato = opcoes.find((o) => normal(o.nome) === q);
    const parcial = opcoes.filter((o) => normal(o.nome).includes(q));
    const escolhido = exato ?? (parcial.length === 1 ? parcial[0] : undefined);
    if (escolhido) {
      setTexto(null);
      onEscolher(escolhido);
    }
  }

  return (
    <label className="flex w-full min-w-0 flex-col text-sm text-gray-800 md:w-auto" htmlFor={`${id}-in`}>
      {rotulo}
      <input
        id={`${id}-in`}
        list={`${id}-lista`}
        value={mostrado}
        disabled={desabilitado || !opcoes.length}
        placeholder={opcoes.length ? "Digite para buscar" : "Carregando…"}
        onChange={(e) => {
          setTexto(e.target.value);
          // Escolha direta pela lista do navegador dispara change com o nome exato.
          if (opcoes.some((o) => o.nome === e.target.value)) confirmar(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            confirmar(e.currentTarget.value);
          }
        }}
        onBlur={() => setTexto(null)}
        className="mt-1 w-full min-w-0 rounded border border-gray-400 px-2 py-1 md:w-56"
      />
      <datalist id={`${id}-lista`}>
        {opcoes.map((o) => (
          <option key={o.codigo} value={o.nome} />
        ))}
      </datalist>
    </label>
  );
}

export interface SeletoresProps {
  turno: Turno;
  onTurno: (t: Turno) => void;
  abr: Abrangencia;
  onAbr: (a: Abrangencia) => void;
  /** Municípios da UF selecionada (para a busca). */
  municipios: Opcao[];
  paises: Opcao[];
  cidades: Opcao[];
}

export function Seletores({ turno, onTurno, abr, onAbr, municipios, paises, cidades }: SeletoresProps) {
  const exterior = abr.nivel === "EXTERIOR" || abr.nivel === "PAIS" || abr.nivel === "CIDADE";
  const uf = abr.nivel === "UF" || abr.nivel === "MUN" ? abr.uf : "";
  const pais = abr.nivel === "PAIS" || abr.nivel === "CIDADE" ? abr.pais : undefined;

  const botao = (ativo: boolean) =>
    `rounded px-3 py-1.5 text-sm font-semibold border ${
      ativo ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-900 border-gray-400 hover:bg-gray-100"
    }`;

  return (
    <div className="flex min-w-0 flex-col gap-4 rounded-lg border border-gray-300 bg-white p-3 md:flex-row md:flex-wrap md:items-end">
      <fieldset>
        <legend className="mb-1 text-sm font-semibold text-gray-900">Turno</legend>
        <div className="flex flex-wrap gap-2">
          {([1, 2] as const).map((t) => (
            <button key={t} type="button" aria-pressed={turno === t} className={botao(turno === t)} onClick={() => onTurno(t)}>
              {t}º turno
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1 text-sm font-semibold text-gray-900">Onde</legend>
        <div className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={!exterior} className={botao(!exterior)} onClick={() => onAbr({ nivel: "BR" })}>
            Brasil
          </button>
          <button type="button" aria-pressed={exterior} className={botao(exterior)} onClick={() => onAbr({ nivel: "EXTERIOR" })}>
            Exterior
          </button>
        </div>
      </fieldset>

      {!exterior ? (
        <>
          <label className="flex w-full min-w-0 flex-col text-sm text-gray-800 md:w-auto">
            Estado
            <select
              value={uf}
              onChange={(e) => onAbr(e.target.value ? { nivel: "UF", uf: e.target.value } : { nivel: "BR" })}
              className="mt-1 w-full min-w-0 rounded border border-gray-400 px-2 py-1 md:w-auto"
            >
              <option value="">Todos (Brasil)</option>
              {UFS.map((s) => (
                <option key={s} value={s}>
                  {NOME_UF[s]} ({s})
                </option>
              ))}
            </select>
          </label>
          {uf ? (
            <Busca
              key={`mun-${uf}`}
              rotulo="Município"
              opcoes={municipios}
              valor={abr.nivel === "MUN" ? abr.municipio : undefined}
              onEscolher={(f) => onAbr({ nivel: "MUN", uf, municipio: f.codigo })}
            />
          ) : null}
        </>
      ) : (
        <>
          <Busca
            key="pais"
            rotulo="País"
            opcoes={paises}
            valor={pais}
            onEscolher={(f) => onAbr({ nivel: "PAIS", pais: f.codigo })}
          />
          {pais ? (
            <Busca
              key={`cid-${pais}`}
              rotulo="Cidade"
              opcoes={cidades}
              valor={abr.nivel === "CIDADE" ? abr.cidade : undefined}
              onEscolher={(f) => onAbr({ nivel: "CIDADE", pais, cidade: f.codigo })}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
