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
};
const app = (extra: Partial<Entity> = {}): Entity => ({
  id: "app",
  type: "block",
  x: 4,
  y: 0,
  label: "Aplicación",
  icon: "server",
  tone: "violet",
  ...extra,
});
const db = (load: number): Entity => ({
  id: "db",
  type: "db",
  x: 9,
  y: 0,
  label: "Base de datos",
  tone: "emerald",
  load,
});
const cache = (extra: Partial<Entity> = {}): Entity => ({
  id: "cache",
  type: "block",
  x: 4,
  y: -4,
  label: "Caché",
  icon: "bolt",
  tone: "amber",
  ...extra,
});

const entrada: Link = { from: "cli", to: "app", heads: "both" };
const aDatos: Link = { from: "app", to: "db", heads: "both" };
const aCache: Link = { from: "app", to: "cache", heads: "both" };

const acierto = (rate: number): Flow => ({
  route: ["cli", "app", "cache"],
  kind: "request",
  rate,
  bounce: true,
});
const consulta = (rate: number): Flow => ({
  route: ["app", "db"],
  kind: "query",
  rate,
  bounce: true,
  dwellAt: { db: 0.5 },
});
const guardar = (rate: number): Flow => ({ route: ["app", "cache"], kind: "write", rate });

export const cacheLesson: Lesson = {
  slug: "cache",
  module: "Sistemas en producción",
  track: "extra",
  title: "Caché",
  summary:
    "Guardar respuestas ya calculadas para no repetir trabajo, y los problemas que aparecen cuando los datos cambian.",
  minutes: 9,
  goals: [
    "Distinguir un acierto de un fallo de caché",
    "Elegir entre caducidad e invalidación para mantener los datos al día",
    "Saber qué ocurre cuando la caché se queda sin memoria",
  ],
  steps: [
    {
      title: "Cada lectura llega a la base de datos",
      kind: "problema",
      body: [
        "La página de un producto se pide miles de veces por minuto y casi siempre devuelve lo mismo. Aun así, cada visita lanza la misma consulta.",
        "La base de datos pasa el día repitiendo trabajo que ya hizo hace un segundo.",
      ],
      metrics: [
        { label: "Latencia", value: 180, unit: "ms" },
        { label: "Consultas/s", value: 1000 },
      ],
      scene: {
        entities: [cli, app({ load: 0.6 }), db(0.93)],
        links: [entrada, aDatos],
        flows: [
          {
            route: ["cli", "app", "db"],
            kind: "request",
            rate: 2,
            bounce: true,
            dwellAt: { db: 0.7 },
          },
        ],
      },
    },
    {
      title: "Guardar lo que ya se calculó",
      kind: "tecnica",
      body: [
        "Una caché es un almacén en memoria, muy rápido, donde se guarda el resultado junto a una clave como producto:42.",
        "La aplicación la coloca a su lado y, cada vez que calcula una respuesta, deja una copia allí.",
      ],
      changes: ["+ Caché en memoria"],
      metrics: [
        { label: "Latencia", value: 180, unit: "ms" },
        { label: "Consultas/s", value: 1000 },
      ],
      scene: {
        entities: [cli, app({ load: 0.6 }), db(0.93), cache({ load: 0.1 })],
        links: [entrada, aDatos, aCache],
        flows: [
          {
            route: ["cli", "app", "db"],
            kind: "request",
            rate: 2,
            bounce: true,
            dwellAt: { db: 0.7 },
          },
          guardar(1.2),
        ],
      },
    },
    {
      title: "Acierto: la respuesta ya está",
      kind: "tecnica",
      body: [
        "Ahora, antes de consultar la base de datos, la aplicación mira en la caché. Si la clave existe, responde con esa copia y termina.",
        "Leer de memoria tarda una fracción de lo que cuesta la consulta, y la base de datos ni se entera.",
      ],
      changes: ["~ Las lecturas repetidas no llegan a la base de datos"],
      metrics: [
        { label: "Latencia", value: 12, unit: "ms" },
        { label: "Consultas/s", value: 0 },
      ],
      scene: {
        entities: [cli, app({ load: 0.3 }), db(0.05), cache({ load: 0.4, tags: ["acierto"] })],
        links: [entrada, aDatos, aCache],
        flows: [acierto(2.4)],
      },
    },
    {
      title: "Fallo: toca ir a buscarlo",
      kind: "tecnica",
      body: [
        "Si la clave no está, es un fallo de caché. La aplicación consulta la base de datos como antes, responde, y guarda el resultado para la próxima vez.",
        "Lo que importa es la proporción: con un 80 % de aciertos, la base de datos recibe una quinta parte del tráfico.",
      ],
      changes: ["~ Los fallos consultan la base de datos y rellenan la caché"],
      metrics: [
        { label: "Aciertos", value: 80, unit: "%" },
        { label: "Latencia", value: 46, unit: "ms" },
        { label: "Consultas/s", value: 200 },
      ],
      scene: {
        entities: [cli, app({ load: 0.35 }), db(0.2), cache({ load: 0.5, tags: ["fallo"] })],
        links: [entrada, aDatos, aCache],
        flows: [acierto(2), consulta(0.5), guardar(0.5)],
      },
    },
    {
      title: "Los datos envejecen",
      kind: "problema",
      body: [
        "El precio del producto cambia en la base de datos, pero la caché sigue sirviendo la copia antigua. Nadie le ha avisado.",
        "La defensa más simple es ponerle fecha de caducidad a cada entrada. Pasado ese tiempo se borra sola y la siguiente lectura trae el dato fresco.",
      ],
      note: "Una caducidad corta da datos más frescos y menos aciertos; una larga, lo contrario.",
      changes: ["~ Cada entrada caduca a los 60 s"],
      metrics: [
        { label: "Aciertos", value: 80, unit: "%" },
        { label: "Desfase máx.", value: 60, unit: "s" },
      ],
      scene: {
        entities: [
          cli,
          app({ load: 0.35 }),
          db(0.2),
          cache({ load: 0.5, tags: ["caduca en 60 s"] }),
        ],
        links: [entrada, aDatos, aCache],
        flows: [acierto(2), consulta(0.4), guardar(0.4)],
      },
    },
    {
      title: "Invalidar al escribir",
      kind: "solucion",
      body: [
        "Cuando un minuto de desfase es demasiado, la aplicación borra la entrada en el mismo momento en que modifica el dato.",
        "La siguiente lectura falla, va a la base de datos y repone la copia correcta. Caducidad e invalidación suelen usarse juntas: una como red de seguridad de la otra.",
      ],
      changes: ["~ Cada escritura borra su entrada en la caché"],
      metrics: [
        { label: "Aciertos", value: 76, unit: "%" },
        { label: "Desfase máx.", value: 0, unit: "s" },
      ],
      scene: {
        entities: [
          cli,
          app({ load: 0.4 }),
          db(0.3),
          cache({ load: 0.5, tags: ["borrar producto:42"] }),
        ],
        links: [entrada, aDatos, aCache],
        flows: [
          acierto(1.6),
          { route: ["cli", "app", "db"], kind: "write", rate: 0.5 },
          { route: ["app", "cache"], kind: "drop", rate: 0.5 },
        ],
      },
    },
    {
      title: "La memoria se llena",
      kind: "tecnica",
      body: [
        "La memoria es limitada y el catálogo no. Cuando la caché se llena, para guardar algo nuevo tiene que tirar algo viejo.",
        "El criterio más habitual es desalojar lo que lleva más tiempo sin leerse: si nadie lo ha pedido últimamente, es poco probable que lo pidan ahora.",
      ],
      changes: ["~ Al llenarse, se desaloja lo menos usado"],
      metrics: [
        { label: "Memoria", value: 100, unit: "%" },
        { label: "Aciertos", value: 72, unit: "%" },
      ],
      scene: {
        entities: [
          cli,
          app({ load: 0.4 }),
          db(0.3),
          cache({ load: 1, tags: ["llena", "desalojo"] }),
        ],
        links: [entrada, aDatos, aCache],
        flows: [acierto(1.8), consulta(0.6), guardar(0.6)],
      },
    },
    {
      title: "Resumen",
      kind: "resumen",
      body: [
        "Una caché cambia memoria por tiempo: guarda respuestas para no recalcularlas. Su valor se mide en la tasa de aciertos.",
        "A cambio hay que decidir cuánto desfase se tolera, cuándo se borra una entrada y qué se desaloja cuando no cabe más.",
      ],
      scene: {
        entities: [
          cli,
          app({ load: 0.35 }),
          db(0.2),
          cache({ load: 0.6 }),
          {
            id: "tabla",
            type: "panel",
            x: 0,
            y: 5,
            label: "Decisiones de una caché",
            rows: [
              ["¿Está la clave?", "acierto / fallo"],
              ["Datos al día", "caducidad"],
              ["Cambio inmediato", "invalidar"],
              ["Sin memoria", "desalojar"],
            ],
          },
        ],
        links: [entrada, aDatos, aCache],
        flows: [acierto(2), consulta(0.5), guardar(0.5)],
      },
    },
  ],
};
