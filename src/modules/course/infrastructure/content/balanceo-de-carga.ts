import type { Lesson } from "@/modules/course/domain/lesson";
import type { Entity, Flow, Link } from "@/modules/diagram/domain/scene";

const cli: Entity = {
  id: "cli",
  type: "device",
  x: 0,
  y: 0,
  label: "Clientes",
  icon: "users",
  tone: "indigo",
  tags: ["×1000"],
};
const lb = (tags?: string[]): Entity => ({
  id: "lb",
  type: "block",
  x: 4,
  y: 0,
  label: "Balanceador",
  icon: "split",
  tone: "amber",
  tags,
});
const server = (n: 1 | 2 | 3, extra: Partial<Entity> = {}): Entity => ({
  id: `s${n}`,
  type: "block",
  x: 8,
  y: (n - 2) * 4,
  label: `Servidor ${n}`,
  icon: "server",
  tone: "violet",
  ...extra,
});
const sesiones: Entity = {
  id: "ses",
  type: "db",
  x: 12,
  y: 0,
  label: "Sesiones",
  tone: "cyan",
};

const entrada: Link = { from: "cli", to: "lb", heads: "both" };
const a = (n: 1 | 2 | 3, style?: Link["style"]): Link => ({
  from: "lb",
  to: `s${n}`,
  heads: "both",
  via: "y",
  style,
});
const aSesiones = (n: 1 | 2 | 3): Link => ({ from: `s${n}`, to: "ses", heads: "both", via: "x" });

const hacia = (n: 1 | 2 | 3, rate: number, extra: Partial<Flow> = {}): Flow => ({
  route: ["cli", "lb", `s${n}`],
  kind: "request",
  rate,
  bounce: true,
  ...extra,
});

export const balanceoDeCarga: Lesson = {
  slug: "balanceo-de-carga",
  module: "Sistemas en producción",
  track: "extra",
  title: "Balanceo de carga",
  summary:
    "Cómo repartir el tráfico entre varias máquinas, qué criterio usar y qué pasa cuando una de ellas falla.",
  minutes: 9,
  goals: [
    "Explicar por qué añadir servidores no basta por sí solo",
    "Comparar el reparto por turnos con el de menos conexiones",
    "Entender para qué sirven las comprobaciones de salud",
  ],
  steps: [
    {
      title: "Un servidor para todos",
      kind: "problema",
      body: [
        "La tienda se hace popular y todo el tráfico llega a la misma máquina. Al acercarse a su límite empieza a responder tarde y a rechazar peticiones.",
        "Comprar una máquina más grande ayuda un tiempo, pero tiene techo y sigue siendo un único punto de fallo.",
      ],
      metrics: [
        { label: "Peticiones/s", value: 1000 },
        { label: "Errores", value: 35, unit: "%" },
      ],
      scene: {
        entities: [cli, server(2, { label: "Servidor", load: 0.97 })],
        links: [{ from: "cli", to: "s2", heads: "both" }],
        flows: [{ route: ["cli", "s2"], kind: "request", rate: 3.2, bounce: true, fail: 0.35 }],
      },
    },
    {
      title: "Más máquinas, mismo problema",
      kind: "problema",
      body: [
        "Arrancas un segundo servidor idéntico. No cambia nada: los clientes solo conocen una dirección y siguen enviándolo todo al primero.",
        "Hace falta algo que reciba el tráfico y decida a qué máquina va cada petición.",
      ],
      changes: ["+ Servidor 1 (sin tráfico)"],
      metrics: [
        { label: "Peticiones/s", value: 1000 },
        { label: "Errores", value: 35, unit: "%" },
      ],
      scene: {
        entities: [cli, server(1, { load: 0.02 }), server(2, { label: "Servidor", load: 0.97 })],
        links: [
          { from: "cli", to: "s2", heads: "both" },
          { from: "cli", to: "s1", heads: "none", via: "y", style: "off" },
        ],
        flows: [{ route: ["cli", "s2"], kind: "request", rate: 3.2, bounce: true, fail: 0.35 }],
      },
    },
    {
      title: "Un balanceador en medio",
      kind: "tecnica",
      body: [
        "El balanceador se coloca delante de los servidores. Los clientes hablan solo con él, y él reenvía cada petición a una de las máquinas que tiene detrás.",
        "Para los clientes sigue habiendo una sola dirección. Detrás puedes añadir o quitar servidores sin que nadie lo note.",
      ],
      changes: ["+ Balanceador", "~ El tráfico se reparte entre dos servidores"],
      metrics: [
        { label: "Peticiones/s", value: 1000 },
        { label: "Errores", value: 0, unit: "%" },
      ],
      scene: {
        entities: [cli, lb(), server(1, { load: 0.5 }), server(2, { load: 0.5 })],
        links: [entrada, a(1), a(2)],
        flows: [hacia(1, 1.5), hacia(2, 1.5)],
      },
    },
    {
      title: "Por turnos",
      kind: "tecnica",
      body: [
        "El criterio más simple es repartir por turnos: la primera petición al servidor 1, la segunda al 2, la tercera al 3 y vuelta a empezar.",
        "No necesita saber nada de los servidores y funciona bien cuando todas las peticiones cuestan más o menos lo mismo.",
      ],
      changes: ["+ Servidor 3", "~ Reparto por turnos"],
      metrics: [
        { label: "Peticiones/s", value: 1000 },
        { label: "Carga media", value: 33, unit: "%" },
      ],
      scene: {
        entities: [
          cli,
          lb(["1 → 2 → 3"]),
          server(1, { load: 0.33 }),
          server(2, { load: 0.33 }),
          server(3, { load: 0.33 }),
        ],
        links: [entrada, a(1), a(2), a(3)],
        flows: [hacia(1, 1), hacia(2, 1), hacia(3, 1)],
      },
    },
    {
      title: "Menos conexiones",
      kind: "tecnica",
      body: [
        "No todas las peticiones pesan igual. Si al servidor 2 le tocan varias exportaciones largas, por turnos seguiría recibiendo su tercio aunque esté saturado.",
        "Con el criterio de menos conexiones, el balanceador envía cada petición a la máquina que menos trabajo tiene abierto en ese instante.",
      ],
      changes: ["~ Reparto según conexiones abiertas"],
      metrics: [
        { label: "Peticiones/s", value: 1000 },
        { label: "Carga máxima", value: 88, unit: "%" },
      ],
      scene: {
        entities: [
          cli,
          lb(["menos conexiones"]),
          server(1, { load: 0.45 }),
          server(2, { load: 0.88, tags: ["tareas largas"] }),
          server(3, { load: 0.45 }),
        ],
        links: [entrada, a(1), a(2), a(3)],
        flows: [
          hacia(1, 1.3),
          hacia(2, 0.4, { kind: "slow", speed: 2.4, dwellAt: { s2: 1.2 } }),
          hacia(3, 1.3),
        ],
      },
    },
    {
      title: "Comprobaciones de salud",
      kind: "tecnica",
      body: [
        "El servidor 3 se cuelga. Si el balanceador no se entera, una de cada tres peticiones se perdería.",
        "Por eso sondea a cada servidor cada pocos segundos. Cuando uno deja de contestar lo saca del reparto, y lo vuelve a meter cuando se recupera.",
      ],
      changes: ["− Servidor 3 fuera del reparto", "~ El balanceador sondea a cada servidor"],
      metrics: [
        { label: "Peticiones/s", value: 1000 },
        { label: "Errores", value: 0, unit: "%" },
        { label: "Carga media", value: 50, unit: "%" },
      ],
      scene: {
        entities: [
          cli,
          lb(["sondeo cada 5 s"]),
          server(1, { load: 0.5 }),
          server(2, { load: 0.5 }),
          server(3, { dead: true, load: 0 }),
        ],
        links: [entrada, a(1), a(2), a(3, "cut")],
        flows: [
          hacia(1, 1.5),
          hacia(2, 1.5),
          { route: ["lb", "s3"], kind: "ping", rate: 0.45, fail: 1 },
        ],
      },
    },
    {
      title: "¿Dónde vive la sesión?",
      kind: "solucion",
      body: [
        "Queda un detalle: si el carrito de un usuario se guarda en la memoria del servidor 1 y su siguiente petición cae en el 2, el carrito desaparece.",
        "La salida habitual es sacar ese estado a un almacén compartido. Así cualquier servidor puede atender a cualquier usuario y perder una máquina no pierde sesiones.",
      ],
      changes: ["+ Almacén de sesiones compartido", "~ Servidor 3 recuperado"],
      metrics: [
        { label: "Peticiones/s", value: 1000 },
        { label: "Carga media", value: 33, unit: "%" },
      ],
      scene: {
        entities: [
          cli,
          lb(),
          server(1, { load: 0.33 }),
          server(2, { load: 0.33 }),
          server(3, { load: 0.33 }),
          sesiones,
        ],
        links: [entrada, a(1), a(2), a(3), aSesiones(1), aSesiones(2), aSesiones(3)],
        flows: [
          { route: ["cli", "lb", "s1", "ses"], kind: "request", rate: 0.9, bounce: true },
          { route: ["cli", "lb", "s2", "ses"], kind: "request", rate: 0.9, bounce: true },
          { route: ["cli", "lb", "s3", "ses"], kind: "request", rate: 0.9, bounce: true },
        ],
      },
    },
    {
      title: "Resumen",
      kind: "resumen",
      body: [
        "Un balanceador da una sola dirección a muchos servidores, reparte el tráfico con un criterio y deja fuera a los que no responden.",
        "Funciona mejor cuando los servidores no guardan estado propio. Y recuerda que el balanceador también es una máquina: en producción se despliega por duplicado.",
      ],
      scene: {
        entities: [
          cli,
          lb(),
          server(1, { load: 0.33 }),
          server(2, { load: 0.33 }),
          server(3, { load: 0.33 }),
          sesiones,
          {
            id: "tabla",
            type: "panel",
            x: 1,
            y: 7,
            label: "Qué criterio usar",
            rows: [
              ["Peticiones parecidas", "por turnos"],
              ["Duración variable", "menos conexiones"],
              ["Servidor caído", "sondeo de salud"],
              ["Estado de usuario", "almacén común"],
            ],
          },
        ],
        links: [entrada, a(1), a(2), a(3), aSesiones(1), aSesiones(2), aSesiones(3)],
        flows: [
          { route: ["cli", "lb", "s1", "ses"], kind: "request", rate: 0.9, bounce: true },
          { route: ["cli", "lb", "s2", "ses"], kind: "request", rate: 0.9, bounce: true },
          { route: ["cli", "lb", "s3", "ses"], kind: "request", rate: 0.9, bounce: true },
        ],
      },
    },
  ],
};
