import type { Lesson } from "@/modules/course/domain/lesson";
import type { LessonRepository } from "@/modules/course/domain/lesson-repository";
import { type LessonSummary, toSummary } from "./lesson-summary";

export type LessonView = {
  lesson: Lesson;
  /** Temario completo, para la navegación lateral. */
  lessons: LessonSummary[];
  /** Lección siguiente en el temario, si la hay. */
  next: LessonSummary | null;
};

/** Caso de uso: una lección con su contexto dentro del temario. */
export async function getLesson(repo: LessonRepository, slug: string): Promise<LessonView | null> {
  const all = await repo.findAll();
  const index = all.findIndex((l) => l.slug === slug);
  if (index === -1) return null;
  const next = all[index + 1];
  return {
    lesson: all[index],
    lessons: all.map(toSummary),
    next: next ? toSummary(next) : null,
  };
}
