import type { Bounds } from "@/modules/diagram/domain/iso";

export type View = { cx: number; cy: number; scale: number };

const MIN_SCALE = 0.3;
const MAX_SCALE = 3;
const FIT_MAX = 1.35;
const PAD = 36;
const PAD_TOP = 72;
const PAD_BOTTOM = 52;

export class Camera {
  view: View = { cx: 0, cy: 0, scale: 1 };
  w = 1;
  h = 1;

  constructor(private svg: SVGSVGElement) {}

  resize(): boolean {
    const r = this.svg.getBoundingClientRect();
    const changed = r.width !== this.w || r.height !== this.h;
    this.w = Math.max(1, r.width);
    this.h = Math.max(1, r.height);
    return changed;
  }

  apply(): void {
    const { cx, cy, scale } = this.view;
    const vw = this.w / scale;
    const vh = this.h / scale;
    this.svg.setAttribute("viewBox", `${cx - vw / 2} ${cy - vh / 2} ${vw} ${vh}`);
  }

  /**
   * Vista que encuadra `b` en el tamaño actual. Arriba y abajo se reserva
   * sitio para los controles superpuestos (contadores, herramientas, leyenda).
   */
  fit(b: Bounds): View {
    if (!Number.isFinite(b.minX)) return { cx: 0, cy: 0, scale: 1 };
    const bw = b.maxX - b.minX + PAD * 2;
    const bh = b.maxY - b.minY + PAD_TOP + PAD_BOTTOM;
    const scale = Math.max(MIN_SCALE, Math.min(FIT_MAX, this.w / bw, this.h / bh));
    const shift = (PAD_TOP - PAD_BOTTOM) / 2 / scale;
    return { cx: (b.minX + b.maxX) / 2, cy: (b.minY + b.maxY) / 2 - shift, scale };
  }

  /** Zoom manteniendo fijo el punto de pantalla (px, py). */
  zoomAt(px: number, py: number, factor: number): void {
    const v = this.view;
    const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, v.scale * factor));
    const wx = v.cx + (px - this.w / 2) / v.scale;
    const wy = v.cy + (py - this.h / 2) / v.scale;
    v.cx = wx - (px - this.w / 2) / next;
    v.cy = wy - (py - this.h / 2) / next;
    v.scale = next;
    this.apply();
  }

  pan(dx: number, dy: number): void {
    this.view.cx -= dx / this.view.scale;
    this.view.cy -= dy / this.view.scale;
    this.apply();
  }
}

/** Rueda para zoom, arrastre para mover, dos dedos para pellizcar. */
export function attachControls(svg: SVGSVGElement, cam: Camera, onUse: () => void): () => void {
  const pointers = new Map<number, { x: number; y: number }>();
  let pinch = 0;

  const local = (e: { clientX: number; clientY: number }) => {
    const r = svg.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const p = local(e);
    cam.zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.0015));
    onUse();
  };
  const onDown = (e: PointerEvent) => {
    pointers.set(e.pointerId, local(e));
    svg.setPointerCapture(e.pointerId);
    pinch = 0;
  };
  const onMove = (e: PointerEvent) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const cur = local(e);
    pointers.set(e.pointerId, cur);
    if (pointers.size === 1) {
      cam.pan(cur.x - prev.x, cur.y - prev.y);
      onUse();
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch > 0 && d > 0) cam.zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, d / pinch);
      pinch = d;
      onUse();
    }
  };
  const onUp = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
    pinch = 0;
  };

  svg.addEventListener("wheel", onWheel, { passive: false });
  svg.addEventListener("pointerdown", onDown);
  svg.addEventListener("pointermove", onMove);
  svg.addEventListener("pointerup", onUp);
  svg.addEventListener("pointercancel", onUp);
  return () => {
    svg.removeEventListener("wheel", onWheel);
    svg.removeEventListener("pointerdown", onDown);
    svg.removeEventListener("pointermove", onMove);
    svg.removeEventListener("pointerup", onUp);
    svg.removeEventListener("pointercancel", onUp);
  };
}
