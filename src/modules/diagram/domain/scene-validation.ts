import { isSequence, type Scene } from "./scene";
import { validateSequence } from "./sequence";

/** Problemas de coherencia de una escena de cualquier tipo (vacío si no hay). */
export function validateScene(scene: Scene): string[] {
  if (isSequence(scene)) return validateSequence(scene);

  const problems: string[] = [];
  const ids = new Set<string>();
  for (const e of scene.entities) {
    if (ids.has(e.id)) problems.push(`id de entidad repetido "${e.id}"`);
    ids.add(e.id);
  }
  for (const l of scene.links) {
    for (const end of [l.from, l.to]) {
      if (!ids.has(end)) problems.push(`el enlace usa "${end}", que no existe`);
    }
  }
  for (const f of scene.flows) {
    if (f.route.length < 2) problems.push("flujo con menos de dos nodos");
    for (let k = 0; k < f.route.length - 1; k++) {
      const [a, b] = [f.route[k], f.route[k + 1]];
      const linked = scene.links.some(
        (l) => (l.from === a && l.to === b) || (l.from === b && l.to === a),
      );
      if (!linked) problems.push(`el flujo va de "${a}" a "${b}" sin enlace`);
    }
  }
  return problems;
}
