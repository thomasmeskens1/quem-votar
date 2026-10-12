"use client";

/**
 * Carga (navegador) das malhas TopoJSON de web/public/geo e da correspondência
 * país do TSE → ISO (paises-tse.json). Malhas: IBGE (Brasil) e mundo.topo.json
 * (objeto "paises", properties.iso_a3/nome_pt) — ver web/public/geo/fonte.json.
 */
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";

export type PropsMalha = Record<string, unknown>;
export type FeicaoMalha = Feature<Geometry, PropsMalha>;
export type ColecaoMalha = FeatureCollection<Geometry, PropsMalha>;

const cache = new Map<string, Promise<ColecaoMalha>>();

export function carregarMalha(url: string, objeto: string): Promise<ColecaoMalha> {
  let p = cache.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`malha ${url}: ${r.status}`);
        return r.json() as Promise<Topology>;
      })
      .then((topo) => {
        const obj = (topo.objects[objeto] ?? Object.values(topo.objects)[0]) as GeometryCollection<PropsMalha>;
        return feature(topo, obj) as ColecaoMalha;
      });
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return p;
}

const texto = (v: unknown) => (typeof v === "string" && v ? v : undefined);

export type TipoMalha = "ufs" | "municipios" | "paises";

/** Chave da feição: sigla da UF, cod_ibge do município ou ISO-3 do país. */
export function chaveFeicao(tipo: TipoMalha, f: FeicaoMalha): string | undefined {
  const p = f.properties ?? {};
  if (tipo === "ufs") return texto(p.uf);
  if (tipo === "municipios") return texto(p.cod_ibge);
  return texto(p.iso_a3) ?? texto(f.id);
}

export function nomeFeicao(f: FeicaoMalha): string | undefined {
  const p = f.properties ?? {};
  return texto(p.nome_pt) ?? texto(p.nome);
}

export const MALHA = {
  brasil: { url: "/geo/br-uf.topo.json", objeto: "ufs", tipo: "ufs" as const },
  uf: (uf: string) => ({ url: `/geo/municipios/${uf}.topo.json`, objeto: "municipios", tipo: "municipios" as const }),
  mundo: { url: "/geo/mundo.topo.json", objeto: "paises", tipo: "paises" as const },
};

let paisesTse: Promise<Map<string, string>> | null = null;

/** Nome do país como o TSE grafa → ISO-3 (vazio se o arquivo não existir). */
export function carregarPaisesTse(): Promise<Map<string, string>> {
  if (!paisesTse) {
    paisesTse = fetch("/geo/paises-tse.json")
      .then((r) => (r.ok ? r.json() : {}))
      .then((j: unknown) => {
        const m = new Map<string, string>();
        const obj = (j && typeof j === "object" ? (j as Record<string, unknown>).paises : null) ?? {};
        if (obj && typeof obj === "object" && !Array.isArray(obj)) {
          for (const [nome, iso] of Object.entries(obj as Record<string, unknown>)) {
            if (typeof iso === "string") m.set(nome, iso);
          }
        }
        return m;
      })
      .catch(() => new Map<string, string>());
  }
  return paisesTse;
}
