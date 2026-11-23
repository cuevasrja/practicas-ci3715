/** Simulación del avance de un paquete por una ruta (sin DOM). */

export const BASE_SPEED = 150; // px/s
export const HOP_DWELL = 0.16; // s dentro de cada nodo intermedio

export type PacketState = {
  /** Índice del tramo actual (tramo i une los nodos i e i+1). */
  seg: number;
  /** Distancia recorrida desde el inicio del tramo, en px. */
  dist: number;
  dir: 1 | -1;
  /** Segundos restantes de espera dentro de un nodo. */
  dwell: number;
  returning: boolean;
  done: boolean;
};

export type AdvanceOptions = {
  speed: number;
  bounce: boolean;
  /** Espera al llegar al nodo `i` de la ruta. */
  dwellAt: (nodeIndex: number) => number;
};

export type AdvanceEvent = "none" | "turn" | "done";

export function newPacket(): PacketState {
  return { seg: 0, dist: 0, dir: 1, dwell: 0, returning: false, done: false };
}

/**
 * Avanza `dt` segundos. `lens[i]` es la longitud del tramo i.
 * Devuelve "turn" si en este paso alcanzó el final y da la vuelta,
 * "done" si terminó su recorrido.
 */
export function advance(
  p: PacketState,
  dt: number,
  lens: number[],
  o: AdvanceOptions,
): AdvanceEvent {
  if (p.done || lens.length === 0) {
    p.done = true;
    return "done";
  }
  let left = dt;
  let guard = 0;
  while (left > 0 && guard++ < 64) {
    if (p.dwell > 0) {
      const used = Math.min(p.dwell, left);
      p.dwell -= used;
      left -= used;
      continue;
    }
    const len = lens[p.seg];
    const target = p.dir === 1 ? len : 0;
    const remaining = Math.abs(target - p.dist);
    const step = o.speed * left;
    if (step < remaining) {
      p.dist += p.dir * step;
      break;
    }
    left -= o.speed > 0 ? remaining / o.speed : left;
    p.dist = target;
    const last = lens.length - 1;
    if (p.dir === 1) {
      if (p.seg < last) {
        p.seg += 1;
        p.dist = 0;
        p.dwell = o.dwellAt(p.seg);
      } else if (o.bounce && !p.returning) {
        p.returning = true;
        p.dir = -1;
        p.dwell = o.dwellAt(lens.length);
        return "turn";
      } else {
        p.done = true;
        return "done";
      }
    } else if (p.seg > 0) {
      p.seg -= 1;
      p.dist = lens[p.seg];
      p.dwell = o.dwellAt(p.seg + 1);
    } else {
      p.done = true;
      return "done";
    }
  }
  return "none";
}

/** Posición a lo largo del path del enlace, que puede estar definido al revés. */
export function alongLink(dist: number, len: number, reversed: boolean): number {
  const d = reversed ? len - dist : dist;
  return Math.min(len, Math.max(0, d));
}
