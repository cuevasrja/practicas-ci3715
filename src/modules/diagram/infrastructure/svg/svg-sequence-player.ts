/**
 * Adaptador SVG del puerto ScenePlayer para diagramas de secuencia. Dibuja el
 * diagrama completo una vez y revela las filas hasta el cursor, animando las
 * que acaban de aparecer.
 */
import type { ScenePlayer, ScenePlayerOptions } from "@/modules/diagram/application/scene-player";
import { clamp01, easeInOut, easeOut, lerp } from "@/modules/diagram/domain/easing";
import type { SequenceScene } from "@/modules/diagram/domain/sequence";
import {
  BAR_W,
  type BarLayout,
  dimmedRows,
  HEAD_H,
  type HeadLayout,
  layoutSequence,
  type RowLayout,
  type SequenceLayout,
} from "@/modules/diagram/domain/sequence-layout";
import { Timeline } from "@/modules/diagram/domain/tween";
import { attachControls, Camera, type View } from "./camera";
import { el } from "./render";

const T = { message: 430, block: 240, hide: 180, camera: 600, budget: 2200 };
const DIM = 0.26;
const SELF_W = 34;
const ARROW = "0,0 -10,-4.6 -10,4.6";
/** Por debajo de esta escala el texto deja de leerse: se sigue al mensaje. */
const MIN_SCALE = 0.95;
const MAX_SCALE = 1.2;
const PAD = 26;

type RowNode = {
  layout: RowLayout;
  g: SVGGElement | null;
  /** 0..1: cuánto de la fila se ha revelado. */
  shown: number;
  draw: (k: number) => void;
  /** Texto de la guarda del primer operando (solo fragmentos). */
  guard: SVGTextElement | null;
};

type HeadNode = { layout: HeadLayout; g: SVGGElement; line: SVGLineElement };
type BarNode = { layout: BarLayout; rect: SVGRectElement };

export class SvgSequencePlayer implements ScenePlayer<SequenceScene> {
  private timeline = new Timeline();
  private camera: Camera;
  private world: SVGGElement;
  private sticky: SVGGElement;
  private raf = 0;
  private reduced: boolean;
  private detach: () => void;
  private observer: ResizeObserver;

  private key = "";
  private layout: SequenceLayout | null = null;
  private rows: RowNode[] = [];
  private heads: HeadNode[] = [];
  private bars: BarNode[] = [];
  private dimmed = new Set<number>();
  private cursor = 0;
  private revealY = 0;

  constructor(
    private svg: SVGSVGElement,
    opts: ScenePlayerOptions = {},
  ) {
    this.reduced = !!opts.reducedMotion;
    svg.replaceChildren();
    this.world = el("g", { class: "sq-world" }, svg);
    this.sticky = el("g", { class: "sq-sticky" }, svg);

    this.camera = new Camera(svg);
    this.camera.resize();
    this.camera.apply();
    this.detach = attachControls(svg, this.camera, () => this.placeSticky());
    this.observer = new ResizeObserver(() => {
      if (this.camera.resize()) this.fit(true);
    });
    this.observer.observe(svg);
    this.raf = requestAnimationFrame(this.frame);
  }

  // ---------------------------------------------------------------- API

  goTo(next: SequenceScene, opts: { instant?: boolean } = {}): void {
    let instant = opts.instant || this.reduced;
    this.timeline.finishAll();
    this.timeline.sync(performance.now());

    const key = JSON.stringify([next.participants, next.rows]);
    if (key !== this.key) {
      this.key = key;
      this.build(next);
      this.setView(this.camera.view, this.targetView(0), 1);
      // Al entrar directamente a un paso avanzado no se anima todo lo anterior.
      if (next.cursor > 4) instant = true;
    }
    const from = this.cursor;
    const to = Math.max(0, Math.min(next.cursor, this.rows.length));
    this.cursor = to;
    this.dimmed = dimmedRows(next.rows, to);
    this.markCurrent();

    let total = 0;
    if (to > from) {
      const raw = this.rows
        .slice(from, to)
        .map((r) => (r.layout.type === "message" ? T.message : r.g ? T.block : 0));
      const sum = raw.reduce((a, b) => a + b, 0);
      const k = sum > T.budget ? T.budget / sum : 1;
      raw.forEach((duration, i) => {
        const node = this.rows[from + i];
        this.timeline.add({
          delay: total,
          duration: duration * k,
          ease: node.layout.type === "message" ? easeInOut : easeOut,
          update: (p) => {
            node.shown = p;
            this.paintRow(from + i);
          },
        });
        total += duration * k;
      });
    } else if (to < from) {
      total = T.hide;
      for (let i = to; i < from; i++) {
        const node = this.rows[i];
        const start = node.shown;
        this.timeline.add({
          duration: T.hide,
          update: (p) => {
            node.shown = start * (1 - p);
            this.paintRow(i);
          },
        });
      }
    }
    // Las filas que no cambian de visibilidad pueden cambiar de atenuado.
    for (let i = 0; i < Math.min(from, to); i++) this.paintRow(i);

    const y0 = this.revealY;
    const y1 = this.rowY(to - 1);
    this.timeline.add({
      duration: Math.max(total, 1),
      update: (p) => {
        this.revealY = lerp(y0, y1, p);
        this.paintBars();
      },
    });

    const v0 = { ...this.camera.view };
    const v1 = this.targetView(to);
    this.timeline.add({
      duration: T.camera,
      ease: easeInOut,
      update: (p) => this.setView(v0, v1, p),
    });

    if (instant) this.timeline.finishAll();
  }

  replay(prev: SequenceScene, current: SequenceScene): void {
    this.goTo(prev, { instant: true });
    this.goTo(current);
  }

  /** Un diagrama de secuencia no tiene tráfico continuo que pausar. */
  setPaused(): void {}

  fit(instant = false): void {
    const from = { ...this.camera.view };
    const to = this.targetView(this.cursor);
    if (instant || this.reduced) {
      this.setView(from, to, 1);
      return;
    }
    this.timeline.sync(performance.now());
    this.timeline.add({
      duration: 450,
      ease: easeOut,
      update: (p) => this.setView(from, to, p),
    });
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.detach();
    this.observer.disconnect();
    this.timeline.clear();
    this.svg.replaceChildren();
  }

  // ------------------------------------------------------- construcción

  private frame = (now: number): void => {
    this.timeline.tick(now);
    this.raf = requestAnimationFrame(this.frame);
  };

  private build(scene: SequenceScene): void {
    this.world.replaceChildren();
    this.sticky.replaceChildren();
    const layout = layoutSequence(scene.participants, scene.rows);
    this.layout = layout;
    this.cursor = 0;
    this.revealY = HEAD_H;

    const lifelines = el("g", { class: "sq-lifelines" }, this.world);
    const fragments = el("g", { class: "sq-fragments" }, this.world);
    const bars = el("g", { class: "sq-bars" }, this.world);
    const messages = el("g", { class: "sq-messages" }, this.world);
    const created = el("g", { class: "sq-created" }, this.world);

    const b = layout.bounds;
    el(
      "rect",
      {
        class: "sq-band",
        x: b.minX - 4000,
        y: -400,
        width: b.maxX - b.minX + 8000,
        height: 400 + HEAD_H + 10,
      },
      this.sticky,
    );

    this.heads = layout.heads.map((h) => {
      const line = el(
        "line",
        { class: "sq-lifeline", x1: h.x, x2: h.x, y1: h.y + h.h, y2: layout.bottom },
        lifelines,
      );
      const g = el("g", {}, h.createdAt === null ? this.sticky : created);
      drawHead(g, h);
      if (h.createdAt !== null) {
        g.style.opacity = "0";
        line.style.opacity = "0";
      }
      return { layout: h, g, line };
    });

    this.bars = layout.bars.map((bar) => ({
      layout: bar,
      rect: el(
        "rect",
        { class: "sq-bar", x: bar.x - BAR_W / 2, y: bar.y1, width: BAR_W, height: 0, rx: 2 },
        bars,
      ),
    }));

    this.rows = layout.rows.map((row) => {
      if (row.type === "message") return messageNode(el("g", {}, messages), row);
      if (row.type === "end")
        return { layout: row, g: null, shown: 0, draw: () => {}, guard: null };
      return blockNode(el("g", {}, fragments), row);
    });
    this.rows.forEach((_, i) => {
      this.paintRow(i);
    });
    this.paintBars();
  }

  // ------------------------------------------------------------- pintado

  private paintRow(i: number): void {
    const node = this.rows[i];
    const dim = this.dimmed.has(i) ? DIM : 1;
    if (node.g) {
      node.g.style.opacity = String(clamp01(node.shown * 3) * dim);
      node.draw(node.shown);
      // La guarda del primer operando se atenúa con su rama, no con el marco.
      if (node.guard) node.guard.style.opacity = this.dimmed.has(i + 1) ? String(DIM) : "";
    }
    const head = this.heads.find((h) => h.layout.createdAt === i);
    if (head) {
      const k = clamp01((node.shown - 0.6) / 0.4) * dim;
      head.g.style.opacity = String(k);
      head.line.style.opacity = String(k);
    }
  }

  private paintBars(): void {
    for (const bar of this.bars) {
      const { y1, y2, startRow } = bar.layout;
      const on = (this.rows[startRow]?.shown ?? 0) > 0.85;
      const end = Math.min(y2, Math.max(this.revealY, y1 + 12));
      bar.rect.setAttribute("height", String(on ? Math.max(0, end - y1) : 0));
      bar.rect.style.opacity = this.dimmed.has(startRow) ? String(DIM) : "";
    }
  }

  /** Resalta el último mensaje revelado. */
  private markCurrent(): void {
    let current = -1;
    for (let i = this.cursor - 1; i >= 0; i--) {
      if (this.rows[i].layout.type === "message") {
        current = i;
        break;
      }
    }
    this.rows.forEach((node, i) => {
      node.g?.classList.toggle("sq-current", i === current);
    });
  }

  /** Altura de la fila `i`; un `end` usa el borde inferior de su fragmento. */
  private rowY(i: number): number {
    for (let k = i; k >= 0; k--) {
      const row = this.rows[k]?.layout;
      if (!row) continue;
      if (row.type === "end") {
        const header = this.rows.find(
          (r) => r.layout.type === "fragment" && r.layout.end === k,
        )?.layout;
        if (header?.type === "fragment") return header.y + header.h;
        continue;
      }
      return row.y;
    }
    return HEAD_H;
  }

  // -------------------------------------------------------------- cámara

  private targetView(cursor: number): View {
    const layout = this.layout;
    if (!layout) return { cx: 0, cy: 0, scale: 1 };
    const { w, h } = this.camera;
    const b = layout.bounds;
    const bw = b.maxX - b.minX;
    const bh = b.maxY - b.minY;
    const fitScale = Math.min((w - PAD * 2) / bw, (h - PAD * 2) / bh);
    const scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, fitScale));
    const vw = w / scale;
    const vh = h / scale;
    const pad = PAD / scale;

    let cx = (b.minX + b.maxX) / 2;
    if (bw + pad * 2 > vw) {
      const row = this.currentMessage(cursor);
      const focus = row ? (row.x1 + row.x2) / 2 : b.minX + vw / 2;
      cx = clamp(focus, b.minX - pad + vw / 2, b.maxX + pad - vw / 2);
    }
    let cy = (b.minY + b.maxY) / 2;
    if (bh + pad * 2 > vh) {
      // El mensaje actual queda algo por debajo del centro; arriba se ve el contexto.
      const focus = cursor > 0 ? this.rowY(cursor - 1) : b.minY;
      cy = clamp(focus - vh * 0.12, b.minY - pad + vh / 2, b.maxY + pad - vh / 2);
    }
    return { cx, cy, scale };
  }

  private currentMessage(cursor: number) {
    for (let i = cursor - 1; i >= 0; i--) {
      const row = this.rows[i]?.layout;
      if (row?.type === "message") return row;
    }
    return null;
  }

  private setView(from: View, to: View, k: number): void {
    this.camera.view = {
      cx: lerp(from.cx, to.cx, k),
      cy: lerp(from.cy, to.cy, k),
      scale: lerp(from.scale, to.scale, k),
    };
    this.camera.apply();
    this.placeSticky();
  }

  /** Mantiene las cabeceras pegadas arriba cuando el diagrama se desplaza. */
  private placeSticky(): void {
    const { cy, scale } = this.camera.view;
    const top = cy - this.camera.h / 2 / scale;
    const offset = Math.max(0, top + 8 / scale);
    this.sticky.setAttribute("transform", `translate(0 ${offset.toFixed(2)})`);
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v));
}

// --------------------------------------------------------------- dibujo

function drawHead(g: SVGGElement, h: HeadLayout): void {
  const p = h.participant;
  g.setAttribute("class", `sq-head sq-head--${p.kind}`);
  if (p.kind === "actor") {
    const cx = h.x;
    const top = h.y + 2;
    el("circle", { class: "sq-actor", cx, cy: top + 7, r: 6 }, g);
    el(
      "path",
      {
        class: "sq-actor",
        d: `M${cx} ${top + 13}V${top + 28}M${cx - 10} ${top + 19}H${cx + 10}M${cx} ${top + 28}l-8 10M${cx} ${top + 28}l8 10`,
      },
      g,
    );
    const name = el(
      "text",
      { class: "sq-name", x: cx, y: h.y + h.h - 3, "text-anchor": "middle" },
      g,
    );
    name.textContent = p.name;
    return;
  }
  const stereo = p.stereotype ?? (p.kind === "external" ? "sistema externo" : null);
  const boxH = h.createdAt === null ? h.h - 14 : h.h;
  const boxY = h.createdAt === null ? h.y + 14 : h.y;
  el("rect", { class: "sq-box", x: h.x - h.w / 2, y: boxY, width: h.w, height: boxH, rx: 6 }, g);
  if (stereo) {
    const s = el("text", { class: "sq-stereo", x: h.x, y: boxY + 15, "text-anchor": "middle" }, g);
    s.textContent = `«${stereo}»`;
  }
  const name = el(
    "text",
    {
      class: "sq-name",
      x: h.x,
      y: boxY + (stereo ? boxH - 9 : boxH / 2 + 4.5),
      "text-anchor": "middle",
    },
    g,
  );
  name.textContent = p.name;
}

function messageNode(g: SVGGElement, row: Extract<RowLayout, { type: "message" }>): RowNode {
  g.setAttribute("class", `sq-msg sq-msg--${row.kind}`);
  const label = el("text", { class: "sq-label" }, g);
  const tspans = row.lines.map((text) => {
    const span = el("tspan", {}, label);
    span.textContent = text;
    return span;
  });
  /** Coloca las líneas de la etiqueta; la última queda en `baseline`. */
  const placeLabel = (x: number, baseline: number, anchor: "start" | "middle") => {
    label.setAttribute("text-anchor", anchor);
    tspans.forEach((span, i) => {
      span.setAttribute("x", String(x));
      span.setAttribute("y", String(baseline - (tspans.length - 1 - i) * 15));
    });
  };
  const head = el("polygon", { class: "sq-arrow", points: ARROW }, g);

  if (row.self) {
    const x = row.x1;
    const top = row.y - 14;
    const path = el(
      "path",
      {
        class: "sq-line",
        d: `M${x} ${top}h${SELF_W}v24H${x + 3}`,
        pathLength: 1,
      },
      g,
    );
    path.style.strokeDasharray = "1 1";
    head.setAttribute("transform", `translate(${x + 3} ${top + 24}) rotate(180)`);
    placeLabel(x + SELF_W + 10, row.y + 2 + (tspans.length - 1) * 7.5, "start");
    return {
      layout: row,
      g,
      shown: 0,
      guard: null,
      draw: (k) => {
        path.style.strokeDashoffset = String(1 - k);
        head.style.opacity = String(clamp01((k - 0.9) / 0.1));
        label.style.opacity = String(clamp01(k * 2));
      },
    };
  }

  const line = el("line", { class: "sq-line", x1: row.x1, y1: row.y, x2: row.x1, y2: row.y }, g);
  const angle = row.x2 >= row.x1 ? 0 : 180;
  placeLabel((row.x1 + row.x2) / 2, row.y - 8, "middle");
  return {
    layout: row,
    g,
    shown: 0,
    guard: null,
    draw: (k) => {
      const tip = lerp(row.x1, row.x2, k);
      line.setAttribute("x2", String(tip));
      head.setAttribute("transform", `translate(${tip} ${row.y}) rotate(${angle})`);
      label.style.opacity = String(clamp01((k - 0.35) / 0.4));
    },
  };
}

function blockNode(
  g: SVGGElement,
  row: Exclude<RowLayout, { type: "message" } | { type: "end" }>,
): RowNode {
  let guard: SVGTextElement | null = null;
  if (row.type === "fragment") {
    g.setAttribute("class", `sq-frag sq-frag--${row.op}`);
    el("rect", { class: "sq-frame", x: row.x, y: row.y, width: row.w, height: row.h, rx: 4 }, g);
    const tab = row.op.length * 7 + 18;
    el(
      "path",
      {
        class: "sq-tab",
        d: `M${row.x} ${row.y}h${tab}v12l-7 7H${row.x}z`,
      },
      g,
    );
    const op = el("text", { class: "sq-op", x: row.x + 7, y: row.y + 13.5 }, g);
    op.textContent = row.op;
    guard = el("text", { class: "sq-guard", x: row.x + tab + 8, y: row.y + 14 }, g);
    guard.textContent = `[${row.guard}]`;
  } else if (row.type === "else") {
    g.setAttribute("class", "sq-else");
    el("line", { class: "sq-divider", x1: row.x1, x2: row.x2, y1: row.y, y2: row.y }, g);
    const text = el("text", { class: "sq-guard", x: row.x1 + 10, y: row.y + 15 }, g);
    text.textContent = `[${row.guard}]`;
  } else {
    g.setAttribute("class", "sq-stage");
    el("line", { class: "sq-stage-line", x1: row.x1, x2: row.x2, y1: row.y, y2: row.y }, g);
    const w = row.label.length * 6.6 + 22;
    el(
      "rect",
      { class: "sq-stage-pill", x: row.x1, y: row.y - 11, width: w, height: 22, rx: 11 },
      g,
    );
    const text = el("text", { class: "sq-stage-text", x: row.x1 + 11, y: row.y + 4 }, g);
    text.textContent = row.label;
  }
  return { layout: row, g, shown: 0, draw: () => {}, guard };
}
