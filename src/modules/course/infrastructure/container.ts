import { getLesson } from "@/modules/course/application/get-lesson";
import { listLessons } from "@/modules/course/application/list-lessons";
import { LESSONS } from "./content";
import { StaticLessonRepository } from "./static-lesson-repository";

/**
 * Raíz de composición del lado servidor: une los casos de uso con el
 * adaptador de lecciones. Para servirlas desde otro origen basta con cambiar
 * el repositorio aquí.
 */
const lessons = new StaticLessonRepository(LESSONS);

export const courseContainer = {
  listLessons: () => listLessons(lessons),
  getLesson: (slug: string) => getLesson(lessons, slug),
};
