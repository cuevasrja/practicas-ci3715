/** Atajos para escribir diagramas de secuencia en las lecciones. */
import type {
  FragmentOp,
  MessageKind,
  Participant,
  Row,
  SequenceScene,
} from "@/modules/diagram/domain/sequence";

export const actor = (id: string, name: string): Participant => ({ id, kind: "actor", name });
export const obj = (id: string, name: string, stereotype?: string): Participant => ({
  id,
  kind: "object",
  name,
  stereotype,
});
export const ext = (id: string, name: string): Participant => ({ id, kind: "external", name });

const message =
  (kind: MessageKind) =>
  (from: string, to: string, label: string): Row => ({ type: "message", from, to, label, kind });

/** Línea continua, triángulo negro. */
export const sync = message("sync");
/** Línea continua, triángulo blanco; nunca tiene retorno. */
export const async_ = message("async");
/** Línea punteada, triángulo blanco. */
export const ret = message("return");
/** El objeto `to` aparece a esta altura. */
export const create = (from: string, to: string): Row => message("create")(from, to, "«create»");
export const self = (id: string, label: string): Row => sync(id, id, label);

const fragment =
  (op: FragmentOp) =>
  (guard: string): Row => ({ type: "fragment", op, guard });
export const alt = fragment("alt");
export const opt = fragment("opt");
export const loop = fragment("loop");
export const brk = fragment("break");
export const par = fragment("par");
export const els = (guard: string): Row => ({ type: "else", guard });
export const end: Row = { type: "end" };
export const stage = (label: string): Row => ({ type: "stage", label });

/**
 * Un diagrama escrito por tramos: cada tramo es lo que revela un paso.
 * `at(n)` devuelve la escena con los `n` primeros tramos a la vista, así no
 * hay que contar filas a mano.
 */
export function diagram(participants: Participant[], chunks: Row[][]) {
  const rows = chunks.flat();
  const cursors = [0];
  for (const chunk of chunks) cursors.push(cursors[cursors.length - 1] + chunk.length);
  return {
    chunks: chunks.length,
    at(n: number): SequenceScene {
      const cursor = cursors[Math.max(0, Math.min(n, chunks.length))];
      return { kind: "sequence", participants, rows, cursor };
    },
  };
}
