export type Ease = (t: number) => number;

export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

export const linear: Ease = (t) => t;

export const easeOut: Ease = (t) => 1 - (1 - t) ** 3;

export const easeInOut: Ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Sobrepasa ligeramente el destino antes de asentarse. */
export const easeBack: Ease = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
