import type { LessonRepository } from "@/modules/course/domain/lesson-repository";
import { type LessonSummary, toSummary } from "./lesson-summary";

/** Caso de uso: el temario, en orden. */
export async function listLessons(repo: LessonRepository): Promise<LessonSummary[]> {
  return (await repo.findAll()).map(toSummary);
}
