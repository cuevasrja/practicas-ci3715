import type { Lesson } from "./lesson";

/** Puerto secundario: de dónde salen las lecciones (archivos, CMS, API…). */
export interface LessonRepository {
  /** Todas las lecciones, en el orden del temario. */
  findAll(): Promise<Lesson[]>;
  findBySlug(slug: string): Promise<Lesson | null>;
}
