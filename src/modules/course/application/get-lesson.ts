import type { Lesson } from "@/modules/course/domain/lesson";
import type { LessonRepository } from "@/modules/course/domain/lesson-repository";
import { type LessonSummary, toSummary } from "./lesson-summary";

export type LessonView = {
  lesson: Lesson;
  /** Temario completo, para la navegación lateral. */
  lessons: LessonSummary[];
  /** Lección siguiente dentro del mismo recorrido (principal o extra), si la hay. */
  next: LessonSummary | null;
};

/** Caso de uso: una lección con su contexto dentro del temario. */
export async function getLesson(repo: LessonRepository, slug: string): Promise<LessonView | null> {
  const all = await repo.findAll();
  const index = all.findIndex((l) => l.slug === slug);
  if (index === -1) return null;
  const lesson = all[index];
  const track = all.filter((l) => l.track === lesson.track);
  const next = track[track.indexOf(lesson) + 1];
  return {
    lesson,
    lessons: all.map(toSummary),
    next: next ? toSummary(next) : null,
  };
}
