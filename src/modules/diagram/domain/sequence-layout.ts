/** Geometría de un diagrama de secuencia (sin DOM). Unidades en px. */
import type { Bounds } from "./iso";
import type { FragmentOp, MessageKind, Participant, Row } from "./sequence";

/** Ancho medio de un carácter de etiqueta, para estimar sin medir texto. */
const CH = 6.5;
export const HEAD_H = 58;
export const BOX_H = 38;
export const BAR_W = 8;
const SELF_W = 34;
const MIN_GAP = 110;

const ROW_H = {
  message: 40,
  self: 52,
  create: 50,
  fragment: 36,
  else: 32,
  end: 18,
  stage: 46,
} as const;

export type HeadLayout = {
  participant: Participant;
  /** Centro horizontal: también es la x de su línea de vida. */
  x: number;
  /** Borde superior de la cabecera. */
  y: number;
  w: number;
  h: number;
  /** La cabecera aparece a media altura porque el objeto se crea ahí. */
  createdAt: number | null;
};

export type RowLayout =
  | {
      type: "message";
      kind: MessageKind;
      /** La etiqueta, ya partida en una o dos líneas. */
      lines: string[];
      self: boolean;
      y: number;
      x1: number;
      x2: number;
    }
  | {
      type: "fragment";
      op: FragmentOp;
      guard: string;
      x: number;
      y: number;
      w: number;
      h: number;
      /** Índice de su fila `end`. */
      end: number;
    }
  | { type: "else"; guard: string; x1: number; x2: number; y: number }
  | { type: "end" }
  | { type: "stage"; label: string; x1: number; x2: number; y: number };

export type BarLayout = {
  participant: string;
  x: number;
  y1: number;
  y2: number;
  /** Fila del mensaje que la activa. */
  startRow: number;
};

export type SequenceLayout = {
  heads: HeadLayout[];
  rows: RowLayout[];
  bars: BarLayout[];
  /** Altura a la que termina el diagrama (fin de las líneas de vida). */
  bottom: number;
  bounds: Bounds;
};

const textW = (s: string) => s.length * CH;
const LINE_H = 15;
const WRAP_AT = 26;

/**
 * Una etiqueta larga se parte antes de su lista de parámetros para que el
 * diagrama no se ensanche: `POST /gastos` arriba y `(monto, moneda)` debajo.
 */
export function wrapLabel(label: string): string[] {
  const cut = label.indexOf("(");
  if (label.length <= WRAP_AT || cut <= 0) return [label];
  return [label.slice(0, cut).trimEnd(), label.slice(cut)];
}

const labelW = (label: string) => Math.max(...wrapLabel(label).map(textW));

function headWidth(p: Participant): number {
  const name = p.name.length * 7.4 + 28;
  const stereo = p.stereotype ? (p.stereotype.length + 2) * 6 + 22 : 0;
  const base = p.kind === "actor" ? 64 : 88;
  return Math.max(base, name, stereo);
}

export function layoutSequence(participants: Participant[], rows: Row[]): SequenceLayout {
  const col = new Map(participants.map((p, i) => [p.id, i]));
  const n = participants.length;
  const widths = participants.map(headWidth);

  // 1. Separación entre columnas: cabeceras y etiquetas deben caber.
  const gaps: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    gaps.push(Math.max(MIN_GAP, (widths[i] + widths[i + 1]) / 2 + 26));
  }
  let rightPad = 0;
  for (const row of rows) {
    if (row.type !== "message") continue;
    const a = col.get(row.from);
    const b = col.get(row.to);
    if (a === undefined || b === undefined) continue;
    const need = labelW(row.label) + 30;
    if (a === b) {
      const room = need + SELF_W + 16;
      if (a < n - 1) gaps[a] = Math.max(gaps[a], room);
      else rightPad = Math.max(rightPad, room);
      continue;
    }
    const [lo, hi] = a < b ? [a, b] : [b, a];
    let have = 0;
    for (let i = lo; i < hi; i++) have += gaps[i];
    if (need > have) {
      const extra = (need - have) / (hi - lo);
      for (let i = lo; i < hi; i++) gaps[i] += extra;
    }
  }
  const xs: number[] = [0];
  for (const g of gaps) xs.push(xs[xs.length - 1] + g);
  const xOf = (id: string) => xs[col.get(id) ?? 0];

  const heads: HeadLayout[] = participants.map((p, i) => ({
    participant: p,
    x: xs[i],
    y: 0,
    w: widths[i],
    h: HEAD_H,
    createdAt: null,
  }));

  // 2. Filas, fragmentos y barras de activación en una sola pasada.
  type OpenFragment = { index: number; minX: number; maxX: number; inner: number; elses: number[] };
  type Activation = { id: number; participant: string; caller: string; row: number; y: number };
  const out: RowLayout[] = [];
  const fragments: OpenFragment[] = [];
  const barsById = new Map<number, BarLayout>();
  let stack: Activation[] = [];
  const snapshots: Activation[][] = [];
  let nextId = 0;
  let y = HEAD_H + 4;
  let maxRight = xs[n - 1] + widths[n - 1] / 2 + rightPad;
  let minLeft = -widths[0] / 2;

  const touch = (lo: number, hi: number) => {
    for (const f of fragments) {
      f.minX = Math.min(f.minX, lo);
      f.maxX = Math.max(f.maxX, hi);
    }
  };
  const closeBar = (a: Activation, y2: number) => {
    const prev = barsById.get(a.id);
    const level = stack.filter((s) => s.participant === a.participant && s.id < a.id).length;
    barsById.set(a.id, {
      participant: a.participant,
      x: xOf(a.participant) + level * (BAR_W / 2),
      y1: a.y,
      y2: Math.max(prev?.y2 ?? 0, y2),
      startRow: a.row,
    });
  };

  // Una llamada sin retorno dibujado dentro de un operando termina con él.
  const closeDangling = (snap: Activation[], at: number) => {
    for (const a of stack) if (!snap.includes(a)) closeBar(a, at);
  };

  rows.forEach((row, index) => {
    if (row.type === "message") {
      const self = row.from === row.to;
      const kind = row.kind;
      const lines = wrapLabel(row.label);
      y += self ? ROW_H.self : kind === "create" ? ROW_H.create : ROW_H.message;
      y += (lines.length - 1) * LINE_H;
      const fromX = xOf(row.from);
      const toX = xOf(row.to);
      const dir = toX >= fromX ? 1 : -1;
      const x1 = fromX + (self ? BAR_W / 2 : dir * (BAR_W / 2));
      let x2 = self ? x1 : toX - dir * (BAR_W / 2);

      if (kind === "create") {
        const head = heads[col.get(row.to) ?? 0];
        head.createdAt = index;
        head.h = BOX_H;
        head.y = y - BOX_H / 2;
        x2 = toX - dir * (head.w / 2);
        touch(Math.min(fromX, toX - head.w / 2), Math.max(fromX, toX + head.w / 2));
      } else if (self) {
        const right = fromX + SELF_W + 14 + labelW(row.label);
        maxRight = Math.max(maxRight, right);
        touch(fromX, right);
      } else {
        touch(Math.min(fromX, toX), Math.max(fromX, toX));
      }

      // Activaciones: una llamada síncrona abre barra; su retorno la cierra.
      const isActor = (id: string) => participants[col.get(id) ?? 0]?.kind === "actor";
      if (kind === "sync" && !isActor(row.to)) {
        const a = { id: nextId++, participant: row.to, caller: row.from, row: index, y };
        if (self) {
          stack.push(a);
          closeBar(a, y + 14);
          stack.pop();
        } else {
          stack.push(a);
        }
      } else if (kind === "async" && !isActor(row.to)) {
        const a = { id: nextId++, participant: row.to, caller: row.from, row: index, y };
        stack.push(a);
        closeBar(a, y + 16);
        stack.pop();
      } else if (kind === "return") {
        for (let i = stack.length - 1; i >= 0; i--) {
          if (stack[i].participant === row.from) {
            closeBar(stack[i], y);
            stack.splice(i, 1);
            break;
          }
        }
      }
      out.push({ type: "message", kind, lines, self, y, x1, x2 });
    } else if (row.type === "fragment") {
      y += ROW_H.fragment;
      fragments.push({ index, minX: Infinity, maxX: -Infinity, inner: 0, elses: [] });
      snapshots.push([...stack]);
      out.push({
        type: "fragment",
        op: row.op,
        guard: row.guard,
        x: 0,
        y: y - 24,
        w: 0,
        h: 0,
        end: index,
      });
    } else if (row.type === "else") {
      y += ROW_H.else;
      fragments.at(-1)?.elses.push(index);
      // Cada operando de un alt parte del mismo estado de activaciones.
      const snap = snapshots.at(-1);
      if (snap) {
        closeDangling(snap, y - 14);
        stack = [...snap];
      }
      out.push({ type: "else", guard: row.guard, x1: 0, x2: 0, y: y - 14 });
    } else if (row.type === "end") {
      y += ROW_H.end;
      const f = fragments.pop();
      const snap = snapshots.pop();
      if (snap) {
        closeDangling(snap, y - 8);
        stack = stack.filter((a) => snap.includes(a));
      }
      if (f) {
        const header = out[f.index];
        if (header.type === "fragment") {
          const empty = !Number.isFinite(f.minX);
          const lo = empty ? xs[0] : f.minX;
          const hi = empty ? xs[n - 1] : f.maxX;
          const pad = 34 + 14 * f.inner;
          const label = textW(`${header.op} [${header.guard}]`) + 44;
          header.x = lo - pad;
          header.w = Math.max(hi - lo + pad * 2, label);
          header.h = y - header.y;
          header.end = index;
          for (const e of f.elses) {
            const divider = out[e];
            if (divider.type === "else") {
              divider.x1 = header.x;
              divider.x2 = header.x + header.w;
            }
          }
          const parent = fragments.at(-1);
          if (parent) {
            parent.minX = Math.min(parent.minX, header.x);
            parent.maxX = Math.max(parent.maxX, header.x + header.w);
            parent.inner = Math.max(parent.inner, f.inner + 1);
          }
          minLeft = Math.min(minLeft, header.x);
          maxRight = Math.max(maxRight, header.x + header.w);
        }
      }
      out.push({ type: "end" });
    } else {
      y += ROW_H.stage;
      out.push({ type: "stage", label: row.label, x1: 0, x2: 0, y: y - 12 });
    }
  });

  const bottom = y + 34;
  for (const a of stack) closeBar(a, bottom - 14);
  for (const row of out) {
    if (row.type === "stage") {
      row.x1 = minLeft - 6;
      row.x2 = maxRight + 6;
    }
  }

  return {
    heads,
    rows: out,
    bars: [...barsById.values()].sort((a, b) => a.startRow - b.startRow),
    bottom,
    bounds: { minX: minLeft - 10, minY: -8, maxX: maxRight + 10, maxY: bottom + 6 },
  };
}

/**
 * Filas que deben atenuarse: las de los operandos hermanos de cada `alt` que
 * contiene la fila actual (la última visible). Así se ve qué rama se toma.
 */
export function dimmedRows(rows: Row[], cursor: number): Set<number> {
  type Slot = { fragment: number; operand: number; alt: boolean };
  const chains: Slot[][] = [];
  const open: Slot[] = [];
  rows.forEach((row, i) => {
    if (row.type === "fragment") {
      chains.push(open.map((s) => ({ ...s })));
      open.push({ fragment: i, operand: 0, alt: row.op === "alt" });
      return;
    }
    if (row.type === "else") {
      const top = open.at(-1);
      if (top) top.operand += 1;
    }
    if (row.type === "end") {
      open.pop();
      chains.push(open.map((s) => ({ ...s })));
      return;
    }
    chains.push(open.map((s) => ({ ...s })));
  });

  const dimmed = new Set<number>();
  const current = chains[cursor - 1];
  if (!current) return dimmed;
  for (const here of current) {
    if (!here.alt) continue;
    chains.forEach((chain, i) => {
      const there = chain.find((s) => s.fragment === here.fragment);
      if (there && there.operand !== here.operand) dimmed.add(i);
    });
  }
  return dimmed;
}
