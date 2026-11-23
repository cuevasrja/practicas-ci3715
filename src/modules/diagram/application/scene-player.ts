import type { Scene } from "@/modules/diagram/domain/scene";

export type ScenePlayerOptions = {
  /** Sin transiciones ni tráfico inicial (prefers-reduced-motion). */
  reducedMotion?: boolean;
};

/**
 * Puerto primario del módulo: lo que la interfaz puede pedirle a un
 * reproductor de escenas, sin saber con qué tecnología dibuja.
 */
export interface ScenePlayer {
  /** Anima desde la escena actual hasta `next`. */
  goTo(next: Scene, opts?: { instant?: boolean }): void;
  /** Repite una transición: salta a `prev` y anima hasta `current`. */
  replay(prev: Scene, current: Scene): void;
  /** Detiene o reanuda el tráfico de paquetes. */
  setPaused(paused: boolean): void;
  /** Reencuadra la escena actual. */
  fit(instant?: boolean): void;
  /** Libera el bucle de animación, los listeners y los nodos creados. */
  destroy(): void;
}
