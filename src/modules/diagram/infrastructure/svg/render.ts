/** Construcción de nodos SVG para entidades y enlaces. */

import {
  type Bounds,
  growBounds,
  type LinkGeometry,
  project,
  TILE_H,
  TILE_W,
} from "@/modules/diagram/domain/iso";
import type { Entity, Link } from "@/modules/diagram/domain/scene";
import { ICONS } from "./icons";

const NS = "http://www.w3.org/2000/svg";

type Attrs = Record<string, string | number>;

export function el<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  parent?: Element,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, tag);
  for (const k in attrs) node.setAttribute(k, String(attrs[k]));
  parent?.appendChild(node);
  return node;
}

type Shape = {
  /** Medio tamaño de la huella en celdas (cajas). */
  sx: number;
  sy: number;
  /** Altura en px. */
  h: number;
  /** Recorte de los enlaces, en celdas. */
  r: number;
};

const SHAPES: Record<Entity["type"], Shape> = {
  block: { sx: 0.75, sy: 0.75, h: 30, r: 1.0 },
  device: { sx: 0.62, sy: 0.82, h: 8, r: 1.05 },
  queue: { sx: 1.1, sy: 0.55, h: 14, r: 1.35 },
  db: { sx: 0.75, sy: 0.75, h: 32, r: 1.3 },
  zone: { sx: 0, sy: 0, h: 0, r: 0 },
  panel: { sx: 0, sy: 0, h: 0, r: 0 },
};

const DB_RX = 38;
const DB_RY = 19;
const PANEL_W = 236;
const ROW_H = 20;

export function linkRadius(e: Entity): { front: number; back: number } {
  const s = SHAPES[e.type];
  return { front: s.r, back: s.r + s.h / TILE_W };
}

/** Semiejes de la sombra en el suelo. */
export function shadowSize(e: Entity): { rx: number; ry: number } {
  const s = SHAPES[e.type];
  const rx = (s.sx + s.sy) * TILE_W * 0.82;
  return { rx, ry: rx / 2 };
}

function pts(list: [number, number][]): string {
  return list.map(([x, y]) => `${x},${y}`).join(" ");
}

function loadClass(load: number): string {
  return load >= 0.85 ? "gauge--high" : load >= 0.6 ? "gauge--mid" : "gauge--low";
}

/** Rellena `body` (ya vacío o no) con el dibujo de la entidad. */
export function buildEntity(g: SVGGElement, body: SVGGElement, e: Entity): void {
  g.setAttribute(
    "class",
    `ent ent--${e.type} tone-${e.tone ?? "slate"}${e.dead ? " ent--dead" : ""}`,
  );
  g.dataset.id = e.id;
  body.replaceChildren();

  if (e.type === "zone") {
    buildZone(body, e);
    return;
  }
  if (e.type === "panel") {
    buildPanel(body, e);
    return;
  }

  const s = SHAPES[e.type];
  let footY: number; // punto más bajo de la huella
  let topY: number; // punto más alto del cuerpo

  if (e.type === "db") {
    const h = s.h;
    el(
      "path",
      {
        class: "face-left",
        d: `M${-DB_RX} ${-h} L${-DB_RX} 0 A${DB_RX} ${DB_RY} 0 0 0 ${DB_RX} 0 L${DB_RX} ${-h} Z`,
      },
      body,
    );
    el(
      "path",
      {
        class: "face-band",
        d: `M${-DB_RX} ${-h / 2} A${DB_RX} ${DB_RY} 0 0 0 ${DB_RX} ${-h / 2}`,
      },
      body,
    );
    el("ellipse", { class: "face-top", cx: 0, cy: -h, rx: DB_RX, ry: DB_RY }, body);
    footY = DB_RY;
    topY = -h - DB_RY;
  } else {
    const ex = s.sx * TILE_W;
    const ey = s.sy * TILE_W;
    const N: [number, number] = [ey - ex, -(s.sx + s.sy) * TILE_H];
    const E: [number, number] = [ex + ey, (s.sx - s.sy) * TILE_H];
    const S: [number, number] = [ex - ey, (s.sx + s.sy) * TILE_H];
    const W: [number, number] = [-ex - ey, (s.sy - s.sx) * TILE_H];
    const up = ([x, y]: [number, number]): [number, number] => [x, y - s.h];
    el("polygon", { class: "face-left", points: pts([W, S, up(S), up(W)]) }, body);
    el("polygon", { class: "face-right", points: pts([S, E, up(E), up(S)]) }, body);
    el("polygon", { class: "face-top", points: pts([up(N), up(E), up(S), up(W)]) }, body);
    if (e.type === "queue") {
      for (const k of [-0.5, 0, 0.5]) {
        const a = project(k * s.sx * 1.2, -s.sy * 0.7, s.h);
        const b = project(k * s.sx * 1.2, s.sy * 0.7, s.h);
        el("line", { class: "face-band", x1: a.x, y1: a.y, x2: b.x, y2: b.y }, body);
      }
    }
    footY = S[1];
    topY = N[1] - s.h;
  }

  if (e.icon) {
    const k = e.type === "device" ? 0.95 : 1.1;
    el(
      "path",
      {
        class: "ent-icon",
        d: ICONS[e.icon],
        transform: `translate(0 ${-s.h}) matrix(1 .5 -1 .5 0 0) scale(${k}) translate(-12 -12)`,
      },
      body,
    );
  }

  if (e.dead) {
    el(
      "path",
      {
        class: "ent-cross",
        d: "M-9 -9L9 9M-9 9L9 -9",
        transform: `translate(0 ${-s.h - 4})`,
      },
      body,
    );
  }

  const labelY = footY + 17;
  const label = el("text", { class: "ent-label", x: 0, y: labelY, "text-anchor": "middle" }, body);
  label.textContent = e.label;

  if (e.load !== undefined) {
    const w = 44;
    const load = Math.max(0, Math.min(1, e.load));
    el(
      "rect",
      { class: "gauge-track", x: -w / 2, y: labelY + 7, width: w, height: 5, rx: 2.5 },
      body,
    );
    el(
      "rect",
      {
        class: `gauge-fill ${loadClass(load)}`,
        x: -w / 2,
        y: labelY + 7,
        width: Math.max(3, w * load),
        height: 5,
        rx: 2.5,
      },
      body,
    );
  }

  if (e.tags?.length) {
    const CH = 6.4;
    const PAD = 7;
    const GAP = 5;
    const widths = e.tags.map((t) => t.length * CH + PAD * 2);
    const total = widths.reduce((a, b) => a + b, 0) + GAP * (widths.length - 1);
    let x = -total / 2;
    const y = topY - 22;
    e.tags.forEach((t, i) => {
      el("rect", { class: "tag-box", x, y, width: widths[i], height: 17, rx: 8.5 }, body);
      const tx = el(
        "text",
        {
          class: "tag-text",
          x: x + widths[i] / 2,
          y: y + 12,
          "text-anchor": "middle",
        },
        body,
      );
      tx.textContent = t;
      x += widths[i] + GAP;
    });
  }
}

function zoneCorners(e: Entity): [number, number][] {
  const w = (e.w ?? 4) / 2;
  const d = (e.d ?? 4) / 2;
  return (
    [
      [-w, -d],
      [w, -d],
      [w, d],
      [-w, d],
    ] as const
  ).map(([x, y]) => {
    const p = project(x, y);
    return [p.x, p.y];
  });
}

function buildZone(body: SVGGElement, e: Entity): void {
  const c = zoneCorners(e);
  el("polygon", { class: "zone-area", points: pts(c) }, body);
  const label = el(
    "text",
    {
      class: "zone-label",
      x: c[0][0],
      y: c[0][1] - 9,
      "text-anchor": "middle",
    },
    body,
  );
  label.textContent = e.label;
}

function panelHeight(e: Entity): number {
  return 38 + (e.rows?.length ?? 0) * ROW_H + 8;
}

function buildPanel(body: SVGGElement, e: Entity): void {
  const h = panelHeight(e);
  el(
    "rect",
    { class: "panel-box", x: -PANEL_W / 2, y: 0, width: PANEL_W, height: h, rx: 10 },
    body,
  );
  const title = el("text", { class: "panel-title", x: -PANEL_W / 2 + 14, y: 23 }, body);
  title.textContent = e.label;
  (e.rows ?? []).forEach(([k, v], i) => {
    const y = 38 + i * ROW_H + 13;
    const a = el("text", { class: "panel-key", x: -PANEL_W / 2 + 14, y }, body);
    a.textContent = k;
    const b = el(
      "text",
      {
        class: "panel-val",
        x: PANEL_W / 2 - 14,
        y,
        "text-anchor": "end",
      },
      body,
    );
    b.textContent = v;
  });
}

/** Amplía `b` con el espacio que ocupa la entidad en pantalla. */
export function entityBounds(e: Entity, b: Bounds): void {
  const p = project(e.x, e.y);
  if (e.type === "zone") {
    for (const [x, y] of zoneCorners(e)) growBounds(b, p.x + x, p.y + y);
    growBounds(b, p.x, p.y + zoneCorners(e)[0][1] - 24);
    return;
  }
  if (e.type === "panel") {
    growBounds(b, p.x - PANEL_W / 2, p.y);
    growBounds(b, p.x + PANEL_W / 2, p.y + panelHeight(e));
    return;
  }
  const s = SHAPES[e.type];
  const half = Math.max(56, e.label.length * 3.6);
  growBounds(b, p.x - half, p.y - s.h - 30 - (e.tags?.length ? 26 : 0));
  growBounds(b, p.x + half, p.y + 50 + (e.load !== undefined ? 12 : 0));
}

export type LinkNodes = {
  g: SVGGElement;
  path: SVGPathElement;
  headEnd: SVGPolygonElement | null;
  headStart: SVGPolygonElement | null;
  label: SVGTextElement | null;
  cut: SVGPathElement | null;
};

const HEAD = "0,0 -9,-4.5 -9,4.5";

export function buildLink(g: SVGGElement, l: Link): LinkNodes {
  g.replaceChildren();
  const style = l.style ?? "solid";
  g.setAttribute("class", `link link--${style}`);
  const path = el("path", { class: "link-line" }, g);
  const heads = l.heads ?? "end";
  const headEnd = heads !== "none" ? el("polygon", { class: "link-head", points: HEAD }, g) : null;
  const headStart =
    heads === "both" ? el("polygon", { class: "link-head", points: HEAD }, g) : null;
  const cut =
    style === "cut" ? el("path", { class: "link-cut", d: "M-5 -5L5 5M-5 5L5 -5" }, g) : null;
  let label: SVGTextElement | null = null;
  if (l.label) {
    label = el("text", { class: "link-label", "text-anchor": "middle" }, g);
    label.textContent = l.label;
  }
  return { g, path, headEnd, headStart, label, cut };
}

export function placeLink(n: LinkNodes, geom: LinkGeometry): void {
  n.path.setAttribute("d", geom.d);
  n.headEnd?.setAttribute(
    "transform",
    `translate(${geom.end.x} ${geom.end.y}) rotate(${geom.endAngle})`,
  );
  n.headStart?.setAttribute(
    "transform",
    `translate(${geom.start.x} ${geom.start.y}) rotate(${geom.startAngle})`,
  );
  n.cut?.setAttribute("transform", `translate(${geom.mid.x} ${geom.mid.y})`);
  if (n.label) {
    n.label.setAttribute("x", String(geom.mid.x));
    n.label.setAttribute("y", String(geom.mid.y + (n.cut ? 22 : 17)));
  }
}
