import { type Entity, type Link, linkId, type Scene } from "./scene";

export type Kept<T> = { from: T; to: T; changed: boolean };

export type SceneDiff = {
  entities: {
    exit: Entity[];
    enter: Entity[];
    stay: (Kept<Entity> & { moved: boolean })[];
  };
  links: { exit: Link[]; enter: Link[]; stay: Kept<Link>[] };
};

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Compara dos escenas por id y clasifica qué sale, qué entra y qué cambia. */
export function diffScenes(prev: Scene, next: Scene): SceneDiff {
  const prevEnts = new Map(prev.entities.map((e) => [e.id, e]));
  const nextEnts = new Map(next.entities.map((e) => [e.id, e]));
  const prevLinks = new Map(prev.links.map((l) => [linkId(l), l]));
  const nextLinks = new Map(next.links.map((l) => [linkId(l), l]));

  const diff: SceneDiff = {
    entities: { exit: [], enter: [], stay: [] },
    links: { exit: [], enter: [], stay: [] },
  };

  for (const e of prev.entities) {
    if (!nextEnts.has(e.id)) diff.entities.exit.push(e);
  }
  for (const e of next.entities) {
    const from = prevEnts.get(e.id);
    if (!from) {
      diff.entities.enter.push(e);
      continue;
    }
    // Un cambio de tipo se trata como sustitución.
    if (from.type !== e.type) {
      diff.entities.exit.push(from);
      diff.entities.enter.push(e);
      continue;
    }
    const moved = from.x !== e.x || from.y !== e.y;
    const changed = !same({ ...from, x: 0, y: 0 }, { ...e, x: 0, y: 0 });
    diff.entities.stay.push({ from, to: e, moved, changed });
  }

  for (const l of prev.links) {
    if (!nextLinks.has(linkId(l))) diff.links.exit.push(l);
  }
  for (const l of next.links) {
    const from = prevLinks.get(linkId(l));
    if (!from) diff.links.enter.push(l);
    else diff.links.stay.push({ from, to: l, changed: !same(from, l) });
  }

  return diff;
}
