/**
 * Modelo de un diagrama de secuencia de diseño. Serializable, igual que la
 * escena isométrica: viaja de un Server Component a uno de cliente.
 */

export type ParticipantKind = "actor" | "object" | "external";

export type Participant = {
  id: string;
  kind: ParticipantKind;
  /** Texto de la caja: `:App`, `g:Grupo`, o el rol del actor. */
  name: string;
  /** Capa o rol, sin comillas angulares: `presentación`, `broker`. */
  stereotype?: string;
};

/**
 * - `sync`: línea continua, triángulo negro.
 * - `async`: línea continua, triángulo blanco; nunca tiene retorno.
 * - `return`: línea punteada, triángulo blanco.
 * - `create`: línea punteada hacia la caja del objeto nuevo.
 */
export type MessageKind = "sync" | "async" | "return" | "create";

export type FragmentOp = "alt" | "opt" | "loop" | "break" | "par" | "ref";

export type MessageRow = {
  type: "message";
  /** `from === to` es un mensaje a sí mismo. */
  from: string;
  to: string;
  label: string;
  kind: MessageKind;
};

export type Row =
  | MessageRow
  | { type: "fragment"; op: FragmentOp; guard: string }
  | { type: "else"; guard: string }
  | { type: "end" }
  | { type: "stage"; label: string };

export type SequenceScene = {
  kind: "sequence";
  participants: Participant[];
  rows: Row[];
  /** Número de filas ya mostradas: se ven las filas `0..cursor-1`. */
  cursor: number;
};

/** Devuelve la lista de problemas de un diagrama (vacía si es coherente). */
export function validateSequence(scene: SequenceScene): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const p of scene.participants) {
    if (ids.has(p.id)) problems.push(`participante repetido "${p.id}"`);
    ids.add(p.id);
  }
  if (!Number.isInteger(scene.cursor) || scene.cursor < 0 || scene.cursor > scene.rows.length) {
    problems.push(`cursor ${scene.cursor} fuera de rango (0..${scene.rows.length})`);
  }

  const open: FragmentOp[] = [];
  const created = new Set<string>();
  scene.rows.forEach((row, i) => {
    const where = `fila ${i + 1}`;
    if (row.type === "message") {
      for (const end of [row.from, row.to]) {
        if (!ids.has(end)) problems.push(`${where}: participante desconocido "${end}"`);
      }
      if (row.kind === "create") {
        if (row.from === row.to) problems.push(`${where}: un objeto no se crea a sí mismo`);
        if (created.has(row.to)) problems.push(`${where}: "${row.to}" se crea dos veces`);
        created.add(row.to);
      }
    } else if (row.type === "fragment") {
      open.push(row.op);
    } else if (row.type === "else") {
      const op = open.at(-1);
      if (op !== "alt" && op !== "par") {
        problems.push(`${where}: "else" fuera de un alt o par`);
      }
    } else if (row.type === "end") {
      if (open.pop() === undefined) problems.push(`${where}: "end" sin fragmento abierto`);
    }
  });
  if (open.length > 0) problems.push(`quedan ${open.length} fragmentos sin cerrar`);
  return problems;
}
