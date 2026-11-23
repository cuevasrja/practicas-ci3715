import { withStep } from "@/modules/course/domain/progress";
import type { ProgressRepository } from "@/modules/course/domain/progress-repository";

/** Caso de uso: el estudiante ha llegado al paso `step` (1-based) de una lección. */
export function recordProgress(repo: ProgressRepository, slug: string, step: number): void {
  const current = repo.load();
  const next = withStep(current, slug, step);
  if (next !== current) repo.save(next);
}
