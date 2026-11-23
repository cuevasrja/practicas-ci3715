/**
 * Modelo de una escena del diagrama. Todo es serializable (sin funciones)
 * para poder pasarlo de un Server Component a uno de cliente.
 */

export type Tone = "slate" | "indigo" | "cyan" | "amber" | "rose" | "emerald" | "violet";

export type EntityType = "block" | "device" | "db" | "queue" | "zone" | "panel";

export type IconName =
  | "server"
  | "globe"
  | "browser"
  | "users"
  | "database"
  | "bolt"
  | "split"
  | "files"
  | "shield";

export type Entity = {
  id: string;
  type: EntityType;
  /** Posición en la rejilla isométrica. */
  x: number;
  y: number;
  label: string;
  icon?: IconName;
  tone?: Tone;
  /** Carga 0..1; dibuja un medidor bajo la etiqueta. */
  load?: number;
  /** Nodo caído. */
  dead?: boolean;
  /** Etiquetas cortas sobre el nodo. */
  tags?: string[];
  /** Solo `zone`: tamaño en celdas. */
  w?: number;
  d?: number;
  /** Solo `panel`: filas etiqueta / valor. */
  rows?: [string, string][];
};

export type LinkStyle = "solid" | "off" | "cut";

export type Link = {
  /** Por defecto `${from}>${to}`. */
  id?: string;
  from: string;
  to: string;
  label?: string;
  style?: LinkStyle;
  heads?: "end" | "both" | "none";
  /** Eje por el que sale el codo cuando los nodos no están alineados. */
  via?: "x" | "y";
};

export type PacketKind =
  | "request"
  | "response"
  | "handshake"
  | "query"
  | "write"
  | "slow"
  | "drop"
  | "ping";

export type Flow = {
  /** Ids de entidades; cada par consecutivo debe tener un enlace. */
  route: string[];
  kind: PacketKind;
  /** Paquetes por segundo. */
  rate: number;
  /** Vuelve al origen tras llegar al final. */
  bounce?: boolean;
  /** Probabilidad 0..1 de fallar al llegar al final. */
  fail?: number;
  /** Multiplicador de velocidad. */
  speed?: number;
  /** Segundos de espera dentro de un nodo concreto. */
  dwellAt?: Record<string, number>;
};

export type Scene = {
  entities: Entity[];
  links: Link[];
  flows: Flow[];
};

export const EMPTY_SCENE: Scene = { entities: [], links: [], flows: [] };

export function linkId(l: Link): string {
  return l.id ?? `${l.from}>${l.to}`;
}

export function flowKey(f: Flow): string {
  return JSON.stringify(f);
}
