/** Proyección isométrica 2:1 y geometría de enlaces (sin DOM). */

export type Pt = { x: number; y: number };

export const TILE_W = 32;
export const TILE_H = 16;

/** Rejilla (x, y, altura en px) -> pantalla. */
export function project(x: number, y: number, z = 0): Pt {
  return { x: (x - y) * TILE_W, y: (x + y) * TILE_H - z };
}

/** Profundidad de pintado: mayor = más cerca del espectador. */
export function depth(x: number, y: number): number {
  return x + y;
}

function dist(a: Pt, b: Pt): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function towards(a: Pt, b: Pt, d: number): Pt {
  const len = dist(a, b);
  if (len === 0) return { ...a };
  const t = d / len;
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export type LinkGeometry = {
  /** Atributo `d` del path, en coordenadas de pantalla. */
  d: string;
  /** Punto inicial y final en pantalla. */
  start: Pt;
  end: Pt;
  /** Ángulo (grados) de llegada al final y de salida del inicio. */
  endAngle: number;
  startAngle: number;
  /** Punto medio aproximado, para la etiqueta. */
  mid: Pt;
};

const CORNER = 0.45;

/**
 * Recorte de un extremo, en celdas. `back` se usa cuando el enlace llega por
 * detrás del nodo, donde la altura del volumen taparía el final del trazo.
 */
export type Radius = number | { front: number; back: number };

function pick(r: Radius, node: Pt, other: Pt): number {
  if (typeof r === "number") return r;
  const fromBack = other.x < node.x - 1e-6 || other.y < node.y - 1e-6;
  return fromBack ? r.back : r.front;
}

/**
 * Camino entre dos nodos siguiendo los ejes de la rejilla: recto si están
 * alineados, con un codo redondeado si no. Los radios recortan los extremos
 * para que el enlace no entre en el nodo.
 */
export function linkGeometry(
  a: Pt,
  b: Pt,
  radiusA: Radius,
  radiusB: Radius,
  via: "x" | "y" = "x",
): LinkGeometry | null {
  const aligned = Math.abs(a.x - b.x) < 1e-6 || Math.abs(a.y - b.y) < 1e-6;
  const corner: Pt | null = aligned ? null : via === "x" ? { x: b.x, y: a.y } : { x: a.x, y: b.y };

  const first = corner ?? b;
  const last = corner ?? a;
  const ra = pick(radiusA, a, first);
  const rb = pick(radiusB, b, last);
  if (!corner && dist(a, b) <= ra + rb) return null;

  const g0 = towards(a, first, Math.min(ra, dist(a, first)));
  const g1 = towards(b, last, Math.min(rb, dist(b, last)));
  const p = (g: Pt) => project(g.x, g.y);
  const f = (n: number) => Math.round(n * 100) / 100;
  const fmt = (q: Pt) => `${f(q.x)} ${f(q.y)}`;

  const start = p(g0);
  const end = p(g1);
  let d: string;
  let mid: Pt;
  let inDir: Pt;
  let outDir: Pt;

  if (!corner) {
    d = `M${fmt(start)} L${fmt(end)}`;
    mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    inDir = { x: end.x - start.x, y: end.y - start.y };
    outDir = inDir;
  } else {
    const r1 = Math.min(CORNER, dist(g0, corner) / 2);
    const r2 = Math.min(CORNER, dist(g1, corner) / 2);
    const c0 = p(towards(corner, g0, r1));
    const c1 = p(towards(corner, g1, r2));
    const c = p(corner);
    d = `M${fmt(start)} L${fmt(c0)} Q${fmt(c)} ${fmt(c1)} L${fmt(end)}`;
    // La etiqueta va en el tramo más largo.
    const longFirst = dist(g0, corner) >= dist(g1, corner);
    mid = longFirst
      ? { x: (start.x + c0.x) / 2, y: (start.y + c0.y) / 2 }
      : { x: (c1.x + end.x) / 2, y: (c1.y + end.y) / 2 };
    outDir = { x: c0.x - start.x, y: c0.y - start.y };
    inDir = { x: end.x - c1.x, y: end.y - c1.y };
  }

  const deg = (v: Pt) => (Math.atan2(v.y, v.x) * 180) / Math.PI;
  return {
    d,
    start,
    end,
    mid,
    endAngle: deg(inDir),
    startAngle: deg({ x: -outDir.x, y: -outDir.y }),
  };
}

export type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

export function emptyBounds(): Bounds {
  return { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
}

export function growBounds(b: Bounds, x: number, y: number): void {
  if (x < b.minX) b.minX = x;
  if (x > b.maxX) b.maxX = x;
  if (y < b.minY) b.minY = y;
  if (y > b.maxY) b.maxY = y;
}
