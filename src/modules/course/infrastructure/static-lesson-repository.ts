import type { Lesson } from "@/modules/course/domain/lesson";
import type { LessonRepository } from "@/modules/course/domain/lesson-repository";
import { validateLesson } from "@/modules/course/domain/lesson-validation";

/** Adaptador: lecciones definidas como datos en el propio repositorio. */
export class StaticLessonRepository implements LessonRepository {
  constructor(private readonly lessons: readonly Lesson[]) {
    for (const lesson of lessons) {
      const problems = validateLesson(lesson);
      if (problems.length > 0) {
        throw new Error(`Lección "${lesson.slug}" no válida:\n- ${problems.join("\n- ")}`);
      }
    }
  }

  async findAll(): Promise<Lesson[]> {
    return [...this.lessons];
  }

  async findBySlug(slug: string): Promise<Lesson | null> {
    return this.lessons.find((l) => l.slug === slug) ?? null;
  }
}
