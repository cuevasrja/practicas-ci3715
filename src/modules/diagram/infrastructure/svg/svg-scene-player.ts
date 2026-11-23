/**
 * Adaptador SVG del puerto ScenePlayer: anima la transición entre escenas y
 * mueve los paquetes escribiendo atributos SVG en cada fotograma.
 */
import type { ScenePlayer, ScenePlayerOptions } from "@/modules/diagram/application/scene-player";
import { diffScenes } from "@/modules/diagram/domain/diff";
import { clamp01, easeBack, easeInOut, easeOut, lerp } from "@/modules/diagram/domain/easing";
import {
  depth,
  emptyBounds,
  growBounds,
  type LinkGeometry,
  linkGeometry,
  project,
} from "@/modules/diagram/domain/iso";
import {
  advance,
  alongLink,
  BASE_SPEED,
  HOP_DWELL,
  newPacket,
  type PacketState,
} from "@/modules/diagram/domain/packets";
import {
  EMPTY_SCENE,
  type Entity,
  type Flow,
  flowKey,
  type IsoScene,
  type Link,
  linkId,
  type PacketKind,
} from "@/modules/diagram/domain/scene";
import { Timeline } from "@/modules/diagram/domain/tween";
import { attachControls, Camera, type View } from "./camera";
import {
  buildEntity,
  buildLink,
  el,
  entityBounds,
  type LinkNodes,
  linkRadius,
  placeLink,
  shadowSize,
} from "./render";

export const TIMING = {
  exit: 400,
  move: 800,
  enter: 650,
  stagger: 120,
  draw: 550,
};

const ENTER_LIFT = 26;
const EXIT_LIFT = 18;
const MAX_PACKETS = 240;

const KIND_SPEED: Record<PacketKind, number> = {
  request: 1,
  response: 1,
  handshake: 1.15,
  query: 1,
  write: 0.85,
  slow: 0.4,
  drop: 1,
  ping: 1.3,
};

type EntRec = {
  data: Entity;
  g: SVGGElement;
  body: SVGGElement;
  shadow: SVGEllipseElement | null;
  x: number;
  y: number;
  lift: number;
  opacity: number;
};

type LinkRec = {
  id: string;
  data: Link;
  nodes: LinkNodes;
  geom: LinkGeometry | null;
  len: number;
  /** 0..1: cuánto del enlace está dibujado. */
  progress: number;
  opacity: number;
  leaving: boolean;
  /** La etiqueta ya tiene su sitio definitivo y puede mostrarse. */
  labelReady: boolean;
};

type FlowRec = { flow: Flow; key: string; acc: number; active: boolean };

type Packet = {
  flow: FlowRec;
  state: PacketState;
  segs: { link: LinkRec; reversed: boolean }[];
  node: SVGElement;
  x: number;
  y: number;
};

export class SvgScenePlayer implements ScenePlayer<IsoScene> {
  private timeline = new Timeline();
  private camera: Camera;
  private scene: IsoScene = EMPTY_SCENE;
  private ents = new Map<string, EntRec>();
  private links = new Map<string, LinkRec>();
  private flows: FlowRec[] = [];
  private packets: Packet[] = [];
  private layers: Record<"ground" | "links" | "packets" | "ents" | "fx", SVGGElement>;
  private raf = 0;
  private last = 0;
  private linksDirty = false;
  private labelsDirty = false;
  private paused: boolean;
  private reduced: boolean;
  private detach: () => void;
  private observer: ResizeObserver;
  private timers = new Set<ReturnType<typeof setTimeout>>();

  constructor(
    private svg: SVGSVGElement,
    opts: ScenePlayerOptions = {},
  ) {
    this.reduced = !!opts.reducedMotion;
    this.paused = this.reduced;
    svg.replaceChildren();

    const defs = el("defs", {}, svg);
    const pattern = el(
      "pattern",
      {
        id: "sa-grid",
        width: 64,
        height: 32,
        patternUnits: "userSpaceOnUse",
        patternTransform: "translate(-32 0)",
      },
      defs,
    );
    el("path", { class: "grid-line", d: "M32 0L64 16L32 32L0 16Z" }, pattern);
    el("rect", { x: -6000, y: -6000, width: 12000, height: 12000, fill: "url(#sa-grid)" }, svg);

    const layer = (name: string) => el("g", { class: `layer-${name}` }, svg);
    this.layers = {
      ground: layer("ground"),
      links: layer("links"),
      packets: layer("packets"),
      ents: layer("ents"),
      fx: layer("fx"),
    };

    this.camera = new Camera(svg);
    this.camera.resize();
    this.camera.apply();
    this.detach = attachControls(svg, this.camera, () => {});
    this.observer = new ResizeObserver(() => {
      if (this.camera.resize()) this.fit(true);
    });
    this.observer.observe(svg);

    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  // ---------------------------------------------------------------- API

  /** Anima desde la escena actual hasta `next`. */
  goTo(next: IsoScene, opts: { instant?: boolean } = {}): void {
    const instant = opts.instant || this.reduced;
    this.timeline.finishAll();
    this.timeline.sync(performance.now());

    const diff = diffScenes(this.scene, next);
    this.scene = next;
    const T = TIMING;
    let t = 0;

    // 1. Salidas
    for (const l of diff.links.exit) {
      const rec = this.links.get(linkId(l));
      if (!rec) continue;
      rec.leaving = true;
      this.timeline.add({
        duration: T.exit * 0.6,
        update: (k) => {
          rec.opacity = 1 - k;
          this.paintLink(rec);
        },
        done: () => {
          rec.nodes.g.remove();
          if (this.links.get(rec.id) === rec) this.links.delete(rec.id);
        },
      });
    }
    for (const e of diff.entities.exit) {
      const rec = this.ents.get(e.id);
      if (!rec) continue;
      this.ents.delete(e.id);
      this.timeline.add({
        duration: T.exit,
        ease: easeInOut,
        update: (k) => {
          rec.lift = EXIT_LIFT * k;
          rec.opacity = 1 - k;
          this.paintEnt(rec);
        },
        done: () => rec.g.remove(),
      });
    }
    if (diff.entities.exit.length || diff.links.exit.length) t += T.exit;

    // 2. Flujos: se conservan los que siguen, el resto se retira ya.
    const keep = new Map(this.flows.map((f) => [f.key, f]));
    const nextFlows: FlowRec[] = [];
    const fresh: FlowRec[] = [];
    for (const flow of next.flows) {
      const key = flowKey(flow);
      const old = keep.get(key);
      if (old) {
        nextFlows.push(old);
        continue;
      }
      const rec: FlowRec = { flow, key, acc: 1, active: false };
      nextFlows.push(rec);
      fresh.push(rec);
    }
    const alive = new Set(nextFlows);
    this.packets = this.packets.filter((p) => {
      if (alive.has(p.flow)) return true;
      p.node.remove();
      return false;
    });
    this.flows = nextFlows;

    // 3. Lo que se queda: cambia de estado y/o se mueve.
    let anyMove = false;
    for (const s of diff.entities.stay) {
      const rec = this.ents.get(s.to.id);
      if (!rec) continue;
      rec.data = s.to;
      if (s.changed) {
        buildEntity(rec.g, rec.body, s.to);
        this.flash(rec);
      }
      if (s.moved) {
        anyMove = true;
        const fx = rec.x;
        const fy = rec.y;
        this.timeline.add({
          delay: t,
          duration: T.move,
          ease: easeInOut,
          update: (k) => {
            rec.x = lerp(fx, s.to.x, k);
            rec.y = lerp(fy, s.to.y, k);
            this.paintEnt(rec);
            this.linksDirty = true;
          },
          done: () => this.sortEnts(),
        });
      }
    }
    for (const s of diff.links.stay) {
      const rec = this.links.get(linkId(s.to));
      if (!rec || !s.changed) continue;
      rec.data = s.to;
      rec.nodes = buildLink(rec.nodes.g, s.to);
      this.layoutLink(rec);
    }
    if (anyMove) t += T.move;

    // 4. Entradas, escalonadas.
    const readyAt = new Map<string, number>();
    diff.entities.enter.forEach((e, i) => {
      const rec = this.createEnt(e);
      const delay = t + i * T.stagger;
      readyAt.set(e.id, delay + T.enter * 0.55);
      this.timeline.add({
        delay,
        duration: T.enter,
        update: (k) => {
          rec.lift = ENTER_LIFT * (1 - easeBack(k));
          rec.opacity = clamp01(k * 2.2);
          this.paintEnt(rec);
        },
      });
    });
    this.sortEnts();
    let end = diff.entities.enter.length
      ? t + (diff.entities.enter.length - 1) * T.stagger + T.enter
      : t;

    for (const l of diff.links.enter) {
      const rec = this.createLink(l);
      const delay = Math.max(readyAt.get(l.from) ?? t, readyAt.get(l.to) ?? t);
      end = Math.max(end, delay + T.draw);
      this.timeline.add({
        delay,
        duration: T.draw,
        ease: easeInOut,
        update: (k) => {
          rec.progress = k;
          this.paintLink(rec);
        },
        done: () => {
          this.labelsDirty = true;
        },
      });
    }

    // 5. Cámara y arranque de los flujos nuevos.
    const from = { ...this.camera.view };
    const to = this.targetView();
    this.timeline.add({
      delay: Math.min(t, T.exit) * 0.5,
      duration: T.move,
      ease: easeInOut,
      update: (k) => this.setView(from, to, k),
    });
    this.timeline.add({
      delay: end,
      duration: 0,
      done: () => {
        for (const f of fresh) f.active = true;
        this.labelsDirty = true;
      },
    });

    if (instant) {
      this.timeline.finishAll();
      this.flushLinks();
      this.resolveLabels();
      this.labelsDirty = false;
    }
  }

  /** Repite la última transición: salta a `prev` y anima hasta `current`. */
  replay(prev: IsoScene, current: IsoScene): void {
    this.clearPackets();
    this.goTo(prev, { instant: true });
    this.goTo(current);
  }

  setPaused(paused: boolean): void {
    this.paused = paused;
  }

  /** Reencuadra la escena actual. */
  fit(instant = false): void {
    const from = { ...this.camera.view };
    const to = this.targetView();
    if (instant || this.reduced) {
      this.setView(from, to, 1);
      return;
    }
    this.timeline.sync(performance.now());
    this.timeline.add({
      duration: 450,
      ease: easeOut,
      update: (k) => this.setView(from, to, k),
    });
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.detach();
    this.observer.disconnect();
    for (const t of this.timers) clearTimeout(t);
    this.timers.clear();
    this.timeline.clear();
    this.svg.replaceChildren();
  }

  // ------------------------------------------------------------- bucle

  private frame = (now: number): void => {
    const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    this.timeline.tick(now);
    this.flushLinks();
    if (this.labelsDirty) {
      this.labelsDirty = false;
      this.resolveLabels();
    }
    if (!this.paused) this.stepPackets(dt);
    this.raf = requestAnimationFrame(this.frame);
  };

  private flushLinks(): void {
    if (!this.linksDirty) return;
    this.linksDirty = false;
    for (const rec of this.links.values()) this.layoutLink(rec);
  }

  // --------------------------------------------------------- entidades

  private createEnt(e: Entity): EntRec {
    const flat = e.type === "zone";
    const g = el("g", {}, flat ? this.layers.ground : this.layers.ents);
    const shadow =
      e.type === "zone" || e.type === "panel"
        ? null
        : el("ellipse", { class: "ent-shadow", cx: 0, cy: 5, ...shadowSize(e) }, g);
    const body = el("g", { class: "ent-body" }, g);
    buildEntity(g, body, e);
    const rec: EntRec = {
      data: e,
      g,
      body,
      shadow,
      x: e.x,
      y: e.y,
      lift: ENTER_LIFT,
      opacity: 0,
    };
    this.ents.set(e.id, rec);
    this.paintEnt(rec);
    return rec;
  }

  private paintEnt(rec: EntRec): void {
    const p = project(rec.x, rec.y);
    rec.g.setAttribute("transform", `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);
    rec.g.style.opacity = String(rec.opacity);
    rec.body.setAttribute("transform", `translate(0 ${(-rec.lift).toFixed(2)})`);
    if (rec.shadow) {
      rec.shadow.style.opacity = String(clamp01(1 - Math.abs(rec.lift) / 40));
    }
  }

  private sortEnts(): void {
    const order = [...this.ents.values()]
      .filter((r) => r.data.type !== "zone")
      .sort((a, b) => {
        const pa = a.data.type === "panel" ? 1 : 0;
        const pb = b.data.type === "panel" ? 1 : 0;
        return pa - pb || depth(a.data.x, a.data.y) - depth(b.data.x, b.data.y);
      });
    for (const r of order) this.layers.ents.appendChild(r.g);
  }

  private flash(rec: EntRec): void {
    if (this.reduced) return;
    rec.body.classList.remove("ent-flash");
    // Reinicia la animación CSS.
    void rec.body.getBoundingClientRect();
    rec.body.classList.add("ent-flash");
  }

  // ------------------------------------------------------------ enlaces

  private createLink(l: Link): LinkRec {
    const g = el("g", {}, this.layers.links);
    const rec: LinkRec = {
      id: linkId(l),
      data: l,
      nodes: buildLink(g, l),
      geom: null,
      len: 0,
      progress: 0,
      opacity: 1,
      leaving: false,
      labelReady: false,
    };
    this.links.set(rec.id, rec);
    this.layoutLink(rec);
    return rec;
  }

  private layoutLink(rec: LinkRec): void {
    const a = this.ents.get(rec.data.from);
    const b = this.ents.get(rec.data.to);
    rec.geom =
      a && b
        ? linkGeometry(
            { x: a.x, y: a.y },
            { x: b.x, y: b.y },
            linkRadius(a.data),
            linkRadius(b.data),
            rec.data.via,
          )
        : null;
    if (!rec.geom) {
      if (!rec.leaving) rec.nodes.g.style.display = "none";
      rec.len = 0;
      return;
    }
    rec.nodes.g.style.display = "";
    placeLink(rec.nodes, rec.geom);
    rec.len = rec.nodes.path.getTotalLength();
    this.paintLink(rec);
  }

  /**
   * Recoloca las etiquetas de los enlaces para que no pisen los textos de los
   * nodos ni otras etiquetas. Prueba varias posiciones a lo largo del enlace,
   * por debajo y por encima, y se queda con la que menos solapa.
   */
  private resolveLabels(): void {
    const MARGIN = 3;
    const obstacles: DOMRect[] = [];
    for (const ent of this.ents.values()) {
      // Textos y volúmenes: una etiqueta tampoco debe quedar detrás de un nodo.
      for (const node of ent.g.querySelectorAll(
        "text, .tag-box, .face-top, .face-left, .face-right, .panel-box",
      )) {
        obstacles.push(node.getBoundingClientRect());
      }
    }
    const overlap = (a: DOMRect, b: DOMRect) =>
      Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left) + MARGIN) *
      Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) + MARGIN);

    for (const rec of this.links.values()) {
      const label = rec.nodes.label;
      if (!label || !rec.geom || rec.leaving || rec.len === 0) continue;
      const below = rec.nodes.cut ? 22 : 17;
      const place = (x: number, y: number, anchor: "start" | "end") => {
        label.setAttribute("x", x.toFixed(1));
        label.setAttribute("y", y.toFixed(1));
        label.setAttribute("text-anchor", anchor);
        return label.getBoundingClientRect();
      };
      type Spot = { x: number; y: number; anchor: "start" | "end"; cost: number };
      let best: Spot | null = null;
      search: for (const t of [0.5, 0.36, 0.64, 0.24, 0.76]) {
        const at = rec.nodes.path.getPointAtLength(rec.len * t);
        const ahead = rec.nodes.path.getPointAtLength(Math.min(rec.len, rec.len * t + 2));
        // El enlace es diagonal: el texto se ancla del lado en que la línea se
        // aleja, para que no lo atraviese.
        const descends = (ahead.x - at.x) * (ahead.y - at.y) >= 0;
        for (const under of [true, false]) {
          const anchor = under === descends ? "end" : "start";
          const x = at.x + (anchor === "end" ? -5 : 5);
          const y = at.y + (under ? below : -9);
          const rect = place(x, y, anchor);
          let cost = 0;
          for (const o of obstacles) cost += overlap(rect, o);
          if (!best || cost < best.cost) best = { x, y, anchor, cost };
          if (cost === 0) break search;
        }
      }
      if (best) obstacles.push(place(best.x, best.y, best.anchor));
      if (!rec.labelReady) {
        rec.labelReady = true;
        this.paintLink(rec);
      }
    }
  }

  private paintLink(rec: LinkRec): void {
    const { nodes, progress, len } = rec;
    const solid = (rec.data.style ?? "solid") === "solid";
    if (solid) {
      if (progress < 1) {
        nodes.path.style.strokeDasharray = `${len} ${len}`;
        nodes.path.style.strokeDashoffset = String(len * (1 - progress));
      } else {
        nodes.path.style.strokeDasharray = "";
        nodes.path.style.strokeDashoffset = "";
      }
      nodes.g.style.opacity = String(rec.opacity);
    } else {
      nodes.g.style.opacity = String(rec.opacity * progress);
    }
    const late = String(clamp01((progress - 0.8) / 0.2));
    if (nodes.headEnd) nodes.headEnd.style.opacity = late;
    if (nodes.headStart) nodes.headStart.style.opacity = late;
    if (nodes.label) nodes.label.style.opacity = rec.labelReady ? late : "0";
  }

  // ----------------------------------------------------------- paquetes

  private stepPackets(dt: number): void {
    for (const f of this.flows) {
      if (!f.active) continue;
      f.acc += f.flow.rate * dt;
      while (f.acc >= 1) {
        f.acc -= 1;
        if (this.packets.length < MAX_PACKETS) this.spawn(f);
      }
    }

    const survivors: Packet[] = [];
    for (const p of this.packets) {
      if (p.segs.some((s) => s.link.leaving || !s.link.geom)) {
        p.node.remove();
        continue;
      }
      const { flow } = p.flow;
      const route = flow.route;
      const lens = p.segs.map((s) => s.link.len);
      const event = advance(p.state, dt, lens, {
        speed: BASE_SPEED * KIND_SPEED[flow.kind] * (flow.speed ?? 1),
        bounce: !!flow.bounce,
        dwellAt: (i) => flow.dwellAt?.[route[i]] ?? HOP_DWELL,
      });

      const failed =
        (event === "turn" || (event === "done" && !flow.bounce)) &&
        !!flow.fail &&
        Math.random() < flow.fail;
      if (event === "done" || failed) {
        this.burst(p.x, p.y, failed ? "fail" : "ok");
        p.node.remove();
        continue;
      }
      if (event === "turn") p.node.classList.add("pkt--back");

      const seg = p.segs[p.state.seg];
      const at = seg.link.nodes.path.getPointAtLength(
        alongLink(p.state.dist, seg.link.len, seg.reversed),
      );
      p.x = at.x;
      p.y = at.y;
      p.node.setAttribute("transform", `translate(${at.x.toFixed(1)} ${at.y.toFixed(1)})`);
      p.node.style.visibility = p.state.dwell > 0 ? "hidden" : "visible";
      survivors.push(p);
    }
    this.packets = survivors;
  }

  private spawn(f: FlowRec): void {
    const route = f.flow.route;
    const segs: Packet["segs"] = [];
    for (let i = 0; i < route.length - 1; i++) {
      const a = route[i];
      const b = route[i + 1];
      let found: Packet["segs"][number] | null = null;
      for (const link of this.links.values()) {
        if (link.leaving || link.progress < 1 || !link.geom) continue;
        if (link.data.from === a && link.data.to === b) found = { link, reversed: false };
        else if (link.data.from === b && link.data.to === a) found = { link, reversed: true };
        if (found) break;
      }
      if (!found) return;
      segs.push(found);
    }
    if (segs.length === 0) return;

    const cls = `pkt pkt--${f.flow.kind}`;
    const node =
      f.flow.kind === "write"
        ? el("rect", { class: cls, x: -4, y: -4, width: 8, height: 8, rx: 2 }, this.layers.packets)
        : el("circle", { class: cls, r: 4.4 }, this.layers.packets);
    node.style.visibility = "hidden";
    this.packets.push({ flow: f, state: newPacket(), segs, node, x: 0, y: 0 });
  }

  private clearPackets(): void {
    for (const p of this.packets) p.node.remove();
    this.packets = [];
    this.layers.fx.replaceChildren();
  }

  private burst(x: number, y: number, kind: "ok" | "fail"): void {
    if (this.reduced) return;
    const node = el("circle", { class: `fx fx--${kind}`, cx: x, cy: y, r: 5 }, this.layers.fx);
    const timer = setTimeout(() => {
      node.remove();
      this.timers.delete(timer);
    }, 520);
    this.timers.add(timer);
  }

  // -------------------------------------------------------------- cámara

  private targetView(): View {
    const b = emptyBounds();
    const byId = new Map(this.scene.entities.map((e) => [e.id, e]));
    for (const e of this.scene.entities) entityBounds(e, b);
    // La esquina de un enlace con codo puede quedar fuera de los nodos.
    for (const l of this.scene.links) {
      const from = byId.get(l.from);
      const to = byId.get(l.to);
      if (!from || !to || from.x === to.x || from.y === to.y) continue;
      const corner = l.via === "y" ? project(from.x, to.y) : project(to.x, from.y);
      growBounds(b, corner.x - 14, corner.y - 14);
      growBounds(b, corner.x + 14, corner.y + 14);
    }
    return this.camera.fit(b);
  }

  private setView(from: View, to: View, k: number): void {
    this.camera.view = {
      cx: lerp(from.cx, to.cx, k),
      cy: lerp(from.cy, to.cy, k),
      scale: lerp(from.scale, to.scale, k),
    };
    this.camera.apply();
  }
}
