import { EMPTY_PROGRESS, type Progress } from "@/modules/course/domain/progress";
import type { ProgressRepository } from "@/modules/course/domain/progress-repository";

function parse(raw: string): Progress {
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return EMPTY_PROGRESS;
    const clean: Record<string, number> = {};
    for (const [slug, step] of Object.entries(value)) {
      if (typeof step === "number" && Number.isInteger(step) && step > 0) clean[slug] = step;
    }
    return clean;
  } catch {
    return EMPTY_PROGRESS;
  }
}

/**
 * Adaptador: progreso en el localStorage del navegador. Los métodos son
 * propiedades flecha para poder pasarlos sueltos a useSyncExternalStore.
 */
export class LocalStorageProgressRepository implements ProgressRepository {
  private listeners = new Set<() => void>();
  private cachedRaw: string | null = null;
  private cached: Progress = EMPTY_PROGRESS;

  constructor(private readonly key: string) {}

  load = (): Progress => {
    let raw = "";
    try {
      raw = localStorage.getItem(this.key) ?? "";
    } catch {
      // Almacenamiento bloqueado: se trabaja con progreso vacío.
    }
    if (raw !== this.cachedRaw) {
      this.cachedRaw = raw;
      this.cached = raw ? parse(raw) : EMPTY_PROGRESS;
    }
    return this.cached;
  };

  save = (progress: Progress): void => {
    try {
      localStorage.setItem(this.key, JSON.stringify(progress));
    } catch {
      return;
    }
    for (const listener of this.listeners) listener();
  };

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    // Cambios hechos desde otra pestaña.
    window.addEventListener("storage", listener);
    return () => {
      this.listeners.delete(listener);
      window.removeEventListener("storage", listener);
    };
  };
}
