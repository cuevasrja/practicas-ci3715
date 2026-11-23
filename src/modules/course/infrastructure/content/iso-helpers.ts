/** Atajos para escribir escenas isométricas en las lecciones del catálogo. */
import type { Metric, Step } from "@/modules/course/domain/lesson";
import type {
  Entity,
  Flow,
  IsoScene,
  Link,
  PacketKind,
  Tone,
} from "@/modules/diagram/domain/scene";

type Extra = Partial<Omit<Entity, "id" | "x" | "y" | "label">>;

export const nodo = (
  id: string,
  x: number,
  y: number,
  label: string,
  tone: Tone = "slate",
  extra: Extra = {},
): Entity => ({ id, type: "block", x, y, label, tone, ...extra });

export const persona = (
  id: string,
  x: number,
  y: number,
  label: string,
  extra: Extra = {},
): Entity => ({ id, type: "device", x, y, label, tone: "indigo", icon: "users", ...extra });

export const bd = (
  id: string,
  x: number,
  y: number,
  label: string,
  tone: Tone = "emerald",
  extra: Extra = {},
): Entity => ({ id, type: "db", x, y, label, tone, ...extra });

export const cola = (
  id: string,
  x: number,
  y: number,
  label: string,
  extra: Extra = {},
): Entity => ({
  id,
  type: "queue",
  x,
  y,
  label,
  tone: "amber",
  ...extra,
});

export const zona = (
  id: string,
  x: number,
  y: number,
  w: number,
  d: number,
  label: string,
  tone: Tone = "cyan",
): Entity => ({ id, type: "zone", x, y, w, d, label, tone });

export const tabla = (x: number, y: number, label: string, rows: [string, string][]): Entity => ({
  id: "tabla",
  type: "panel",
  x,
  y,
  label,
  rows,
});

export const une = (from: string, to: string, extra: Partial<Link> = {}): Link => ({
  from,
  to,
  ...extra,
});

/** Tráfico en un solo sentido. */
export const ida = (
  route: string[],
  kind: PacketKind = "request",
  rate = 0.7,
  extra: Partial<Flow> = {},
): Flow => ({ route, kind, rate, ...extra });

/** Tráfico de ida y vuelta. */
export const vuelta = (
  route: string[],
  kind: PacketKind = "request",
  rate = 0.7,
  extra: Partial<Flow> = {},
): Flow => ({ route, kind, rate, bounce: true, ...extra });

export const escena = (entities: Entity[], links: Link[] = [], flows: Flow[] = []): IsoScene => ({
  entities,
  links,
  flows,
});

type Half = { body: string[]; scene: IsoScene; metrics?: Metric[]; title?: string };

/**
 * Los dos pasos de una ficha del catálogo: primero el problema, sin el patrón
 * o el estilo, y después la solución, con dónde aparece en Cuentas Claras.
 */
export function ficha(
  nombre: string,
  problema: Half,
  solucion: Half & { enCuentasClaras?: string; changes?: string[] },
): Step[] {
  return [
    {
      title: problema.title ?? `${nombre}: el problema`,
      kind: "problema",
      body: problema.body,
      metrics: problema.metrics,
      scene: problema.scene,
    },
    {
      title: solucion.title ?? `${nombre}: la solución`,
      kind: "solucion",
      body: solucion.body,
      note: solucion.enCuentasClaras ? `En Cuentas Claras: ${solucion.enCuentasClaras}` : undefined,
      changes: solucion.changes,
      metrics: solucion.metrics,
      scene: solucion.scene,
    },
  ];
}
