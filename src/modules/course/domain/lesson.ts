/** Modelo de una lección: una secuencia de pasos, cada uno con su escena. */
import type { Scene } from "@/modules/diagram/domain/scene";

export type StepKind = "problema" | "tecnica" | "solucion" | "resumen";

export type Metric = { label: string; value: number; unit?: string };

export type Step = {
  title: string;
  kind: StepKind;
  body: string[];
  note?: string;
  /** Lista de cambios; el primer carácter marca el tipo: + ~ − */
  changes?: string[];
  metrics?: Metric[];
  scene: Scene;
};

export type LessonTrack = "principal" | "catalogo" | "extra";

export type Lesson = {
  slug: string;
  /** Módulo del temario al que pertenece. */
  module: string;
  /**
   * `principal`: clases del curso, en orden. `catalogo`: referencia de estilos
   * y patrones. `extra`: material complementario.
   */
  track: LessonTrack;
  /** Rótulo corto en el temario, por ejemplo «Clase 8». */
  label?: string;
  title: string;
  summary: string;
  minutes: number;
  goals: string[];
  steps: Step[];
};
