import { clamp01, type Ease, linear } from "./easing";

export type TweenSpec = {
  delay?: number;
  duration: number;
  ease?: Ease;
  /** Recibe el progreso ya suavizado. */
  update?: (t: number) => void;
  done?: () => void;
};

type Tween = Required<Pick<TweenSpec, "duration">> & {
  start: number;
  ease: Ease;
  update?: (t: number) => void;
  done?: () => void;
  seq: number;
};

/**
 * Planificador de tweens independiente del reloj: quien lo use llama a
 * `tick(ahora)` en cada fotograma. Tiempos en milisegundos.
 */
export class Timeline {
  private tweens: Tween[] = [];
  private now = 0;
  private seq = 0;

  get active(): boolean {
    return this.tweens.length > 0;
  }

  /** Fija el reloj sin avanzar tweens (al reanudar tras una pausa larga). */
  sync(now: number): void {
    this.now = now;
  }

  add(spec: TweenSpec): void {
    this.tweens.push({
      start: this.now + (spec.delay ?? 0),
      duration: Math.max(0, spec.duration),
      ease: spec.ease ?? linear,
      update: spec.update,
      done: spec.done,
      seq: this.seq++,
    });
  }

  tick(now: number): void {
    this.now = now;
    if (this.tweens.length === 0) return;
    const finished: Tween[] = [];
    const rest: Tween[] = [];
    for (const tw of this.tweens) {
      if (now < tw.start) {
        rest.push(tw);
        continue;
      }
      const raw = tw.duration === 0 ? 1 : clamp01((now - tw.start) / tw.duration);
      tw.update?.(tw.ease(raw));
      if (raw >= 1) finished.push(tw);
      else rest.push(tw);
    }
    // Los `done` pueden añadir tweens nuevos; se conservan.
    this.tweens = rest;
    finished.sort(byEnd);
    for (const tw of finished) tw.done?.();
  }

  /** Lleva todos los tweens a su estado final, en orden cronológico. */
  finishAll(): void {
    let guard = 0;
    while (this.tweens.length > 0 && guard++ < 1000) {
      const batch = this.tweens.sort(byEnd);
      this.tweens = [];
      for (const tw of batch) {
        tw.update?.(tw.ease(1));
        tw.done?.();
      }
    }
  }

  clear(): void {
    this.tweens = [];
  }
}

function byEnd(a: Tween, b: Tween): number {
  return a.start + a.duration - (b.start + b.duration) || a.seq - b.seq;
}
