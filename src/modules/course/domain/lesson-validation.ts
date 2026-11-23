import { validateScene } from "@/modules/diagram/domain/scene-validation";
import type { Lesson } from "./lesson";

/**
 * Comprueba que una lección es coherente. Devuelve la lista de problemas
 * encontrados (vacía si todo está bien).
 */
export function validateLesson(lesson: Lesson): string[] {
  const problems: string[] = [];
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(lesson.slug)) {
    problems.push(`slug no válido: "${lesson.slug}"`);
  }
  if (lesson.steps.length === 0) problems.push("la lección no tiene pasos");

  const titles = new Set<string>();
  lesson.steps.forEach((step, i) => {
    const where = `paso ${i + 1}`;
    if (titles.has(step.title)) problems.push(`${where}: título repetido "${step.title}"`);
    titles.add(step.title);
    for (const problem of validateScene(step.scene)) problems.push(`${where}: ${problem}`);
  });
  return problems;
}
