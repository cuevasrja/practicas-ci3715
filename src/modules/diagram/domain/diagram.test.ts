import { describe, expect, test } from "bun:test";
import { diffScenes } from "./diff";
import { easeBack, easeInOut, easeOut } from "./easing";
import { linkGeometry, project } from "./iso";
import { advance, alongLink, newPacket } from "./packets";
import type { Entity, IsoScene } from "./scene";
import { type MessageRow, type Participant, type Row, validateSequence } from "./sequence";
import { dimmedRows, layoutSequence, wrapLabel } from "./sequence-layout";
import { Timeline } from "./tween";

const ent = (id: string, x: number, y: number, extra: Partial<Entity> = {}): Entity => ({
  id,
  type: "block",
  x,
  y,
  label: id,
  ...extra,
});

describe("iso", () => {
  test("proyección 2:1", () => {
    expect(project(0, 0)).toEqual({ x: 0, y: 0 });
    expect(project(1, 0)).toEqual({ x: 32, y: 16 });
    expect(project(0, 1)).toEqual({ x: -32, y: 16 });
    expect(project(1, 1, 10)).toEqual({ x: 0, y: 22 });
  });

  test("enlace recto recortado en ambos extremos", () => {
    const g = linkGeometry({ x: 0, y: 0 }, { x: 4, y: 0 }, 1, 1)!;
    expect(g.start).toEqual(project(1, 0));
    expect(g.end).toEqual(project(3, 0));
    expect(g.d).toBe("M32 16 L96 48");
    expect(g.endAngle).toBeCloseTo(26.565, 2);
  });

  test("enlace con codo usa una curva", () => {
    const g = linkGeometry({ x: 0, y: 0 }, { x: 4, y: 4 }, 1, 1, "x")!;
    expect(g.d).toContain("Q");
    expect(g.end).toEqual(project(4, 3));
  });

  test("nodos demasiado juntos no generan enlace", () => {
    expect(linkGeometry({ x: 0, y: 0 }, { x: 1, y: 0 }, 1, 1)).toBeNull();
  });
});

describe("easing", () => {
  test("extremos fijos", () => {
    for (const e of [easeOut, easeInOut, easeBack]) {
      expect(e(0)).toBeCloseTo(0, 6);
      expect(e(1)).toBeCloseTo(1, 6);
    }
  });
  test("back sobrepasa el destino", () => {
    expect(easeBack(0.8)).toBeGreaterThan(1);
  });
});

describe("diff", () => {
  const scene = (entities: Entity[], links: IsoScene["links"] = []): IsoScene => ({
    entities,
    links,
    flows: [],
  });

  test("clasifica entradas, salidas, movimientos y cambios", () => {
    const a = scene(
      [ent("a", 0, 0), ent("b", 4, 0), ent("c", 8, 0)],
      [
        { from: "a", to: "b" },
        { from: "b", to: "c" },
      ],
    );
    const b = scene(
      [ent("a", 0, 2), ent("b", 4, 0, { load: 0.9 }), ent("d", 8, 4)],
      [
        { from: "a", to: "b", style: "off" },
        { from: "b", to: "d" },
      ],
    );
    const d = diffScenes(a, b);
    expect(d.entities.exit.map((e) => e.id)).toEqual(["c"]);
    expect(d.entities.enter.map((e) => e.id)).toEqual(["d"]);
    const stay = Object.fromEntries(d.entities.stay.map((s) => [s.to.id, s]));
    expect(stay.a.moved).toBe(true);
    expect(stay.a.changed).toBe(false);
    expect(stay.b.moved).toBe(false);
    expect(stay.b.changed).toBe(true);
    expect(d.links.exit).toEqual([{ from: "b", to: "c" }]);
    expect(d.links.enter).toEqual([{ from: "b", to: "d" }]);
    expect(d.links.stay[0].changed).toBe(true);
  });

  test("cambiar de tipo sustituye la entidad", () => {
    const d = diffScenes(scene([ent("a", 0, 0)]), scene([ent("a", 0, 0, { type: "db" })]));
    expect(d.entities.exit.length).toBe(1);
    expect(d.entities.enter.length).toBe(1);
    expect(d.entities.stay.length).toBe(0);
  });
});

describe("tween", () => {
  test("respeta retraso, duración y orden de finalización", () => {
    const tl = new Timeline();
    const log: string[] = [];
    let v = 0;
    tl.sync(1000);
    tl.add({ delay: 100, duration: 200, update: (t) => (v = t), done: () => log.push("a") });
    tl.add({ duration: 50, done: () => log.push("b") });
    tl.tick(1050);
    expect(v).toBe(0);
    expect(log).toEqual(["b"]);
    tl.tick(1200);
    expect(v).toBeCloseTo(0.5, 6);
    tl.tick(1400);
    expect(v).toBe(1);
    expect(log).toEqual(["b", "a"]);
    expect(tl.active).toBe(false);
  });

  test("finishAll ejecuta también los tweens encadenados", () => {
    const tl = new Timeline();
    const log: string[] = [];
    tl.add({ delay: 300, duration: 100, done: () => log.push("tarde") });
    tl.add({
      duration: 100,
      done: () => {
        log.push("pronto");
        tl.add({ duration: 100, done: () => log.push("encadenado") });
      },
    });
    tl.finishAll();
    expect(log).toEqual(["pronto", "tarde", "encadenado"]);
  });
});

describe("paquetes", () => {
  const opts = { speed: 100, bounce: false, dwellAt: () => 0 };

  test("recorre un tramo y termina", () => {
    const p = newPacket();
    expect(advance(p, 0.5, [100], opts)).toBe("none");
    expect(p.dist).toBeCloseTo(50, 6);
    expect(advance(p, 0.6, [100], opts)).toBe("done");
    expect(p.done).toBe(true);
  });

  test("espera en el nodo intermedio", () => {
    const p = newPacket();
    const o = { ...opts, dwellAt: () => 0.5 };
    advance(p, 1.2, [100, 100], o);
    expect(p.seg).toBe(1);
    expect(p.dist).toBe(0);
    expect(p.dwell).toBeCloseTo(0.3, 6);
    advance(p, 0.5, [100, 100], o);
    expect(p.dist).toBeCloseTo(20, 6);
  });

  test("ida y vuelta", () => {
    const p = newPacket();
    const o = { ...opts, bounce: true };
    const events: string[] = [];
    for (let i = 0; i < 50 && !p.done; i++) events.push(advance(p, 0.25, [100, 50], o));
    expect(events.filter((e) => e === "turn").length).toBe(1);
    expect(events.at(-1)).toBe("done");
    expect(p.seg).toBe(0);
    expect(p.dist).toBe(0);
    expect(p.returning).toBe(true);
  });

  test("posición sobre un enlace invertido", () => {
    expect(alongLink(30, 100, false)).toBe(30);
    expect(alongLink(30, 100, true)).toBe(70);
    expect(alongLink(130, 100, false)).toBe(100);
  });
});

describe("recorte por detrás", () => {
  test("un enlace que llega por detrás del nodo se recorta más", () => {
    const r = { front: 1, back: 2 };
    const g = linkGeometry({ x: 0, y: 0 }, { x: 6, y: 0 }, r, r)!;
    // Sale por delante de A (hacia +x) y llega por detrás de B (desde -x).
    expect(g.start).toEqual(project(1, 0));
    expect(g.end).toEqual(project(4, 0));
  });
});

describe("secuencia", () => {
  const participants: Participant[] = [
    { id: "u", kind: "actor", name: "Usuario" },
    { id: "a", kind: "object", name: ":App" },
    { id: "g", kind: "object", name: ":Grupo" },
    { id: "r", kind: "object", name: ":Recibo" },
  ];
  const msg = (from: string, to: string, kind: MessageRow["kind"], label = "m"): Row => ({
    type: "message",
    from,
    to,
    kind,
    label,
  });
  const rows: Row[] = [
    msg("u", "a", "sync"), // 0
    msg("a", "g", "sync", "registrarGasto(pagador, monto, participantes)"), // 1
    { type: "fragment", op: "alt", guard: "pagador es miembro" }, // 2
    msg("g", "r", "create", "«create»"), // 3
    { type: "fragment", op: "opt", guard: "hay correo" }, // 4
    msg("g", "g", "sync", "notificar()"), // 5
    { type: "end" }, // 6
    msg("g", "a", "return", "gasto"), // 7
    { type: "else", guard: "no es miembro" }, // 8
    msg("g", "a", "return", "ErrorPagador"), // 9
    { type: "end" }, // 10
    msg("a", "u", "return"), // 11
  ];
  const layout = layoutSequence(participants, rows);

  test("las columnas siguen el orden y se separan para que quepa la etiqueta", () => {
    const xs = layout.heads.map((h) => h.x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    const short = layoutSequence(participants, [msg("a", "g", "sync", "x")]);
    expect(xs[2] - xs[1]).toBeGreaterThan(short.heads[2].x - short.heads[1].x);
  });

  test("una etiqueta larga se parte antes de sus parámetros", () => {
    expect(wrapLabel("obtener(grupoId)")).toEqual(["obtener(grupoId)"]);
    expect(wrapLabel("POST /grupos/{id}/gastos (pagador, monto)")).toEqual([
      "POST /grupos/{id}/gastos",
      "(pagador, monto)",
    ]);
    expect(wrapLabel("muestra el gasto y los saldos actualizados")).toHaveLength(1);
  });

  test("las filas bajan y cada fragmento envuelve a los que contiene", () => {
    const ys = layout.rows.flatMap((r) => (r.type === "message" ? [r.y] : []));
    expect(ys).toEqual([...ys].sort((a, b) => a - b));
    const alt = layout.rows[2];
    const opt = layout.rows[4];
    if (alt.type !== "fragment" || opt.type !== "fragment") throw new Error("tipos");
    expect(alt.end).toBe(10);
    expect(alt.x).toBeLessThan(opt.x);
    expect(alt.x + alt.w).toBeGreaterThan(opt.x + opt.w);
    expect(alt.y + alt.h).toBeGreaterThan(opt.y + opt.h);
  });

  test("el objeto creado aparece a la altura de su mensaje", () => {
    const recibo = layout.heads[3];
    const create = layout.rows[3];
    if (create.type !== "message") throw new Error("tipo");
    expect(recibo.createdAt).toBe(3);
    expect(recibo.y).toBeLessThan(create.y);
    expect(recibo.y + recibo.h).toBeGreaterThan(create.y);
    expect(create.x2).toBe(recibo.x - recibo.w / 2);
  });

  test("una llamada síncrona abre una barra que su retorno cierra", () => {
    const app = layout.bars.find((b) => b.participant === "a");
    const last = layout.rows[11];
    if (last.type !== "message") throw new Error("tipo");
    expect(app?.startRow).toBe(0);
    expect(app?.y2).toBe(last.y);
    // El grupo retorna en las dos ramas: la barra llega hasta la más baja.
    const grupo = layout.bars.find((b) => b.participant === "g" && b.startRow === 1);
    const error = layout.rows[9];
    if (error.type !== "message") throw new Error("tipo");
    expect(grupo?.y2).toBe(error.y);
    expect(layout.bars.some((b) => b.participant === "u")).toBe(false);
  });

  test("se atenúa la rama del alt que no se toma", () => {
    expect([...dimmedRows(rows, 2)]).toEqual([]);
    expect([...dimmedRows(rows, 8)].sort((a, b) => a - b)).toEqual([8, 9]);
    expect([...dimmedRows(rows, 10)].sort((a, b) => a - b)).toEqual([3, 4, 5, 6, 7]);
    expect([...dimmedRows(rows, 12)]).toEqual([]);
  });

  test("la validación detecta diagramas incoherentes", () => {
    const scene = { kind: "sequence" as const, participants, rows, cursor: 3 };
    expect(validateSequence(scene)).toEqual([]);
    const bad = validateSequence({
      ...scene,
      cursor: 99,
      rows: [msg("u", "zz", "sync"), { type: "else", guard: "x" }, { type: "end" }],
    }).join("\n");
    expect(bad).toContain("cursor 99 fuera de rango");
    expect(bad).toContain('participante desconocido "zz"');
    expect(bad).toContain('"else" fuera de un alt');
    expect(bad).toContain('"end" sin fragmento abierto');
  });
});
