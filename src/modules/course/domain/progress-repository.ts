import type { Progress } from "./progress";

/** Puerto secundario: dónde se guarda el progreso del estudiante. */
export interface ProgressRepository {
  /** Debe devolver la misma referencia mientras el progreso no cambie. */
  load(): Progress;
  save(progress: Progress): void;
  /** Avisa cuando el progreso cambia; devuelve la función para darse de baja. */
  subscribe(listener: () => void): () => void;
}
