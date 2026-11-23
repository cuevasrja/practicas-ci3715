import type { Lesson } from "@/modules/course/domain/lesson";
import type { Entity, Flow, Link } from "@/modules/diagram/domain/scene";

const nav = (tags: string[]): Entity => ({
  id: "nav",
  type: "device",
  x: 0,
  y: 0,
  label: "Tu navegador",
  icon: "browser",
  tone: "indigo",
  tags,
});
const dns: Entity = {
  id: "dns",
  type: "block",
  x: 0,
  y: -5,
  label: "Resolvedor DNS",
  icon: "globe",
  tone: "amber",
};
const srv = (extra: Partial<Entity> = {}): Entity => ({
  id: "srv",
  type: "block",
  x: 5,
  y: 0,
  label: "Servidor web",
  icon: "server",
  tone: "violet",
  ...extra,
});
const db = (extra: Partial<Entity> = {}): Entity => ({
  id: "db",
  type: "db",
  x: 10,
  y: 0,
  label: "Base de datos",
  tone: "emerald",
  ...extra,
});
const est: Entity = {
  id: "est",
  type: "block",
  x: 0,
  y: 4,
  label: "Archivos estáticos",
  icon: "files",
  tone: "cyan",
};

const dnsOn: Link = { from: "nav", to: "dns", heads: "both" };
const dnsOff: Link = { from: "nav", to: "dns", heads: "both", style: "off", label: "en caché" };
const web = (label: string): Link => ({ from: "nav", to: "srv", heads: "both", label });
const datos: Link = { from: "srv", to: "db", heads: "both" };
const estaticos: Link = { from: "nav", to: "est", heads: "both" };

const pagina: Flow = { route: ["nav", "srv", "db"], kind: "request", rate: 0.7, bounce: true };

export const cicloDeUnaPeticion: Lesson = {
  slug: "ciclo-de-una-peticion",
  module: "Fundamentos",
  title: "El ciclo de una petición",
  summary:
    "Qué ocurre entre que pulsas Intro y aparece la página: DNS, conexión, cifrado, servidor y base de datos.",
  minutes: 10,
  goals: [
    "Nombrar las etapas por las que pasa una petición web",
    "Saber qué etapas se pagan una vez y cuáles en cada petición",
    "Localizar en qué etapa se está perdiendo el tiempo",
  ],
  steps: [
    {
      title: "Solo tienes un nombre",
      kind: "problema",
      body: [
        "Escribes tienda.ejemplo/zapatos y pulsas Intro. El navegador conoce un nombre, pero en la red los paquetes viajan hacia direcciones numéricas.",
        "Antes de pedir nada necesita averiguar a qué máquina hablarle.",
      ],
      note: "Todo lo que verás a continuación suele caber en menos de un segundo.",
      metrics: [{ label: "Total", value: 0, unit: "ms" }],
      scene: { entities: [nav(["tienda.ejemplo"])], links: [], flows: [] },
    },
    {
      title: "DNS: del nombre al número",
      kind: "tecnica",
      body: [
        "El navegador pregunta a un resolvedor DNS: «¿qué dirección tiene tienda.ejemplo?». El resolvedor responde con una IP, por ejemplo 203.0.113.7.",
        "Es una consulta pequeña, pero es un viaje de ida y vuelta completo antes de empezar lo importante.",
      ],
      changes: ["+ Resolvedor DNS"],
      metrics: [
        { label: "DNS", value: 30, unit: "ms" },
        { label: "Total", value: 30, unit: "ms" },
      ],
      scene: {
        entities: [nav(["tienda.ejemplo"]), dns],
        links: [dnsOn],
        flows: [{ route: ["nav", "dns"], kind: "ping", rate: 0.8, bounce: true }],
      },
    },
    {
      title: "TCP: abrir la conexión",
      kind: "tecnica",
      body: [
        "Con la IP en la mano, el navegador abre una conexión TCP con el servidor. Ambos intercambian tres mensajes cortos para acordar que se escuchan.",
        "La respuesta DNS queda guardada: mientras no caduque, las próximas visitas se saltan el paso anterior.",
      ],
      changes: ["+ Servidor web", "~ La respuesta DNS queda en caché"],
      metrics: [
        { label: "DNS", value: 30, unit: "ms" },
        { label: "TCP", value: 25, unit: "ms" },
        { label: "Total", value: 55, unit: "ms" },
      ],
      scene: {
        entities: [nav(["203.0.113.7"]), dns, srv()],
        links: [dnsOff, web("TCP")],
        flows: [{ route: ["nav", "srv"], kind: "handshake", rate: 1, bounce: true }],
      },
    },
    {
      title: "TLS: cifrar el canal",
      kind: "tecnica",
      body: [
        "La dirección empieza por https, así que antes de enviar datos se negocia el cifrado. El servidor presenta su certificado y ambos acuerdan una clave.",
        "A partir de aquí nadie entre medias puede leer ni alterar lo que viaja.",
      ],
      note: "Reutilizar conexiones abiertas evita repetir TCP y TLS en cada petición.",
      changes: ["~ La conexión pasa a estar cifrada"],
      metrics: [
        { label: "DNS", value: 30, unit: "ms" },
        { label: "TCP", value: 25, unit: "ms" },
        { label: "TLS", value: 40, unit: "ms" },
        { label: "Total", value: 95, unit: "ms" },
      ],
      scene: {
        entities: [nav(["203.0.113.7"]), dns, srv({ tags: ["certificado"] })],
        links: [dnsOff, web("TCP + TLS")],
        flows: [{ route: ["nav", "srv"], kind: "handshake", rate: 1.8, bounce: true }],
      },
    },
    {
      title: "La petición HTTP",
      kind: "tecnica",
      body: [
        "Por fin sale la petición: un texto que dice qué recurso quieres (GET /zapatos) junto a cabeceras como el idioma o las cookies.",
        "Hasta ahora todo eran preparativos. Este es el primer mensaje que el servidor trata como trabajo.",
      ],
      changes: ["~ El servidor empieza a trabajar"],
      metrics: [
        { label: "Conexión", value: 95, unit: "ms" },
        { label: "Envío", value: 15, unit: "ms" },
        { label: "Total", value: 110, unit: "ms" },
      ],
      scene: {
        entities: [nav(["GET /zapatos"]), dns, srv({ load: 0.3 })],
        links: [dnsOff, web("HTTPS")],
        flows: [{ route: ["nav", "srv"], kind: "request", rate: 0.9 }],
      },
    },
    {
      title: "El servidor consulta sus datos",
      kind: "tecnica",
      body: [
        "El servidor no tiene la página guardada: la construye. Para ello pregunta a la base de datos qué zapatos hay, con qué precio y cuántos quedan.",
        "Esa consulta es otro viaje de ida y vuelta, esta vez dentro del centro de datos.",
      ],
      changes: ["+ Base de datos"],
      metrics: [
        { label: "Conexión", value: 95, unit: "ms" },
        { label: "Envío", value: 15, unit: "ms" },
        { label: "Servidor", value: 60, unit: "ms" },
        { label: "Total", value: 170, unit: "ms" },
      ],
      scene: {
        entities: [nav(["GET /zapatos"]), dns, srv({ load: 0.45 }), db()],
        links: [dnsOff, web("HTTPS"), datos],
        flows: [
          { route: ["nav", "srv"], kind: "request", rate: 0.9 },
          { route: ["srv", "db"], kind: "query", rate: 0.9, bounce: true },
        ],
      },
    },
    {
      title: "La respuesta vuelve",
      kind: "solucion",
      body: [
        "Con los datos, el servidor monta el HTML y lo devuelve por la misma conexión con un código 200 OK. El navegador empieza a pintar.",
        "Ese es el recorrido completo: nombre, conexión, petición, datos y respuesta.",
      ],
      changes: ["~ El ciclo se cierra"],
      metrics: [
        { label: "Conexión", value: 95, unit: "ms" },
        { label: "Servidor", value: 75, unit: "ms" },
        { label: "Descarga", value: 20, unit: "ms" },
        { label: "Total", value: 190, unit: "ms" },
      ],
      scene: {
        entities: [nav(["200 OK"]), dns, srv({ load: 0.45 }), db()],
        links: [dnsOff, web("HTTPS"), datos],
        flows: [pagina],
      },
    },
    {
      title: "Una página, muchas peticiones",
      kind: "tecnica",
      body: [
        "El HTML menciona hojas de estilo, scripts, fuentes e imágenes. El navegador lanza una petición por cada uno, varias a la vez.",
        "Estos archivos no cambian de un usuario a otro, así que suele servirlos una máquina aparte dedicada solo a eso.",
      ],
      changes: ["+ Servidor de archivos estáticos"],
      metrics: [
        { label: "Peticiones", value: 24 },
        { label: "Total", value: 480, unit: "ms" },
      ],
      scene: {
        entities: [nav(["HTML", "CSS", "JS", "IMG"]), dns, srv({ load: 0.45 }), db(), est],
        links: [dnsOff, web("HTTPS"), datos, estaticos],
        flows: [pagina, { route: ["nav", "est"], kind: "request", rate: 2.4, bounce: true }],
      },
    },
    {
      title: "Cuando una etapa se atasca",
      kind: "problema",
      body: [
        "Un día la página tarda más de un segundo. La red va igual que siempre: lo que ha cambiado es una consulta que ahora recorre millones de filas.",
        "Medir cada etapa por separado es lo que permite ver que el tiempo se queda en la base de datos y no en otro sitio.",
      ],
      note: "Optimizar la etapa equivocada no mejora nada. Primero se mide, luego se arregla.",
      changes: ["~ La base de datos responde lento"],
      metrics: [
        { label: "Conexión", value: 95, unit: "ms" },
        { label: "Servidor", value: 920, unit: "ms" },
        { label: "Descarga", value: 20, unit: "ms" },
        { label: "Total", value: 1035, unit: "ms" },
      ],
      scene: {
        entities: [
          nav(["esperando…"]),
          dns,
          srv({ load: 0.8 }),
          db({ load: 0.96, tags: ["consulta lenta"] }),
          est,
        ],
        links: [dnsOff, web("HTTPS"), datos, estaticos],
        flows: [
          {
            route: ["nav", "srv", "db"],
            kind: "slow",
            rate: 0.6,
            bounce: true,
            speed: 2,
            dwellAt: { db: 1.6 },
          },
        ],
      },
    },
    {
      title: "Resumen",
      kind: "resumen",
      body: [
        "Una petición es una cadena de etapas: resolver el nombre, conectar, cifrar, pedir, calcular y responder.",
        "DNS, TCP y TLS se pagan al abrir la conexión; el trabajo del servidor y la descarga se pagan en cada petición. Saber cuál es cuál te dice dónde mirar cuando algo va lento.",
      ],
      metrics: [{ label: "Total", value: 190, unit: "ms" }],
      scene: {
        entities: [
          nav(["200 OK"]),
          dns,
          srv({ load: 0.45 }),
          db(),
          est,
          {
            id: "tabla",
            type: "panel",
            x: -6.5,
            y: 3,
            label: "Reparto del tiempo",
            rows: [
              ["DNS", "30 ms"],
              ["TCP", "25 ms"],
              ["TLS", "40 ms"],
              ["Envío", "15 ms"],
              ["Servidor", "60 ms"],
              ["Descarga", "20 ms"],
              ["Total", "190 ms"],
            ],
          },
        ],
        links: [dnsOff, web("HTTPS"), datos, estaticos],
        flows: [pagina, { route: ["nav", "est"], kind: "request", rate: 1.2, bounce: true }],
      },
    },
  ],
};
