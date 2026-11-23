/** Paso más alto alcanzado (1-based) por slug de lección. */
export type Progress = Readonly<Record<string, number>>;

export const EMPTY_PROGRESS: Progress = Object.freeze({});

/**
 * Registra que se alcanzó `step`. El progreso nunca retrocede: si ya se había
 * llegado más lejos devuelve el mismo objeto.
 */
export function withStep(progress: Progress, slug: string, step: number): Progress {
  if (!Number.isInteger(step) || step < 1) return progress;
  if ((progress[slug] ?? 0) >= step) return progress;
  return { ...progress, [slug]: step };
}

/** Pasos completados de una lección, acotado a su longitud. */
export function stepsDone(progress: Progress, slug: string, total: number): number {
  return Math.max(0, Math.min(progress[slug] ?? 0, total));
}

export function percentDone(done: number, total: number): number {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

/** Paso en el que retomar, o `null` si toca empezar desde el principio. */
export function resumeStep(done: number, total: number): number | null {
  return done > 1 && done < total ? done : null;
}
