import { describe, expect, test } from "bun:test";
import { diffScenes } from "./diff";
import { easeBack, easeInOut, easeOut } from "./easing";
import { linkGeometry, project } from "./iso";
import { advance, alongLink, newPacket } from "./packets";
import type { Entity, Scene } from "./scene";
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
  const scene = (entities: Entity[], links: Scene["links"] = []): Scene => ({
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
