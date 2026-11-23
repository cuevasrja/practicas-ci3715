import type { Lesson } from "@/modules/course/domain/lesson";

/** DTO: lo que la interfaz necesita para listar una lección sin sus escenas. */
export type LessonSummary = {
  slug: string;
  module: string;
  title: string;
  summary: string;
  minutes: number;
  steps: number;
};

export function toSummary(lesson: Lesson): LessonSummary {
  return {
    slug: lesson.slug,
    module: lesson.module,
    title: lesson.title,
    summary: lesson.summary,
    minutes: lesson.minutes,
    steps: lesson.steps.length,
  };
}
