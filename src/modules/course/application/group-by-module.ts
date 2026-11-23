import type { LessonSummary } from "./lesson-summary";

/** Agrupa las lecciones por módulo conservando el orden del temario. */
export function groupByModule(lessons: LessonSummary[]): [string, LessonSummary[]][] {
  const groups = new Map<string, LessonSummary[]>();
  for (const l of lessons) {
    const group = groups.get(l.module);
    if (group) group.push(l);
    else groups.set(l.module, [l]);
  }
  return [...groups];
}
