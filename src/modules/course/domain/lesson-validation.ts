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

  lesson.steps.forEach((step, i) => {
    const where = `paso ${i + 1}`;
    const ids = new Set<string>();
    for (const e of step.scene.entities) {
      if (ids.has(e.id)) problems.push(`${where}: id de entidad repetido "${e.id}"`);
      ids.add(e.id);
    }
    for (const l of step.scene.links) {
      for (const end of [l.from, l.to]) {
        if (!ids.has(end)) problems.push(`${where}: el enlace usa "${end}", que no existe`);
      }
    }
    for (const f of step.scene.flows) {
      if (f.route.length < 2) problems.push(`${where}: flujo con menos de dos nodos`);
      for (let k = 0; k < f.route.length - 1; k++) {
        const [a, b] = [f.route[k], f.route[k + 1]];
        const linked = step.scene.links.some(
          (l) => (l.from === a && l.to === b) || (l.from === b && l.to === a),
        );
        if (!linked) problems.push(`${where}: el flujo va de "${a}" a "${b}" sin enlace`);
      }
    }
  });
  return problems;
}
