import type { Lesson } from "@/modules/course/domain/lesson";
import type { Entity } from "@/modules/diagram/domain/scene";
import { bd, cola, escena, ida, nodo, persona, tabla, une, vuelta, zona } from "./iso-helpers";

// --- Microservicios: un gateway y tres servicios, cada uno con su base de datos.
const cliente = persona("cli", 0, 0, "Apps cliente");
const gateway = nodo("gw", 4, 0, "API Gateway", "amber", { icon: "split" });
const servicio = (n: 1 | 2 | 3, extra: Partial<Entity> = {}): Entity =>
  nodo(`s${n}`, 9, (n - 2) * 4, ["Catálogo", "Carrito", "Órdenes"][n - 1], "violet", {
    icon: "server",
    ...extra,
  });
const base = (n: 1 | 2 | 3): Entity => bd(`b${n}`, 14, (n - 2) * 4, "BD");
const micro = (caido = false) =>
  escena(
    [
      cliente,
      gateway,
      servicio(1),
      servicio(2),
      servicio(3, caido ? { dead: true } : {}),
      base(1),
      base(2),
      base(3),
    ],
    [
      une("cli", "gw", { heads: "both" }),
      une("gw", "s1", { via: "y", heads: "both" }),
      une("gw", "s2", { heads: "both" }),
      une("gw", "s3", { via: "y", heads: "both", style: caido ? "cut" : "solid" }),
      une("s1", "b1", { heads: "both" }),
      une("s2", "b2", { heads: "both" }),
      une("s3", "b3", { heads: "both" }),
    ],
    [
      vuelta(["cli", "gw", "s1", "b1"], "request", 0.6),
      vuelta(["cli", "gw", "s2", "b2"], "request", 0.6),
      caido
        ? ida(["gw", "s3"], "drop", 0.5, { fail: 1 })
        : vuelta(["cli", "gw", "s3", "b3"], "request", 0.6),
    ],
  );

// --- Hexágono: adaptadores primarios a la izquierda, secundarios a la derecha.
const nucleo = (tags: string[]): Entity =>
  nodo("core", 5, 0, "Núcleo de la aplicación", "emerald", { icon: "shield", tags });

export const estilosDistribuidos: Lesson = {
  slug: "estilos-de-arquitectura-distribuidos",
  module: "Estilos de arquitectura",
  track: "catalogo",
  title: "Estilos distribuidos y hexagonal",
  summary:
    "Monolito modular, SOA con bus de servicios, microservicios, dirigido por eventos, CQRS y arquitectura hexagonal.",
  minutes: 12,
  goals: [
    "Explicar qué separa un monolito modular de los microservicios",
    "Reconocer el aislamiento del almacenamiento y la independencia de procesos",
    "Decidir cuándo conviene un estilo dirigido por eventos o CQRS",
    "Explicar qué protege la arquitectura hexagonal",
  ],
  steps: [
    {
      title: "Monolito modular",
      kind: "tecnica",
      body: [
        "Un solo programa que se despliega entero, pero partido por dentro en módulos con fronteras claras. Cada módulo expone una interfaz y esconde lo demás.",
        "Es el punto de partida razonable para un equipo pequeño: una sola cosa que desplegar y operar, y las llamadas entre módulos no pasan por la red.",
      ],
      note: "Cuesta: todo se despliega junto y un fallo grave tumba la aplicación completa.",
      scene: escena(
        [
          zona("z", 7.5, 0, 9, 11, "Un solo despliegue", "amber"),
          persona("cli", 0, 0, "Clientes"),
          nodo("m1", 5, -3, "Módulo Gastos", "amber", { icon: "server" }),
          nodo("m2", 5, 3, "Módulo Grupos", "amber", { icon: "server" }),
          bd("datos", 10, 0, "Base de datos"),
        ],
        [
          une("cli", "m1", { via: "y", heads: "both" }),
          une("cli", "m2", { via: "y", heads: "both" }),
          une("m1", "m2", { heads: "both", label: "interfaz" }),
          une("m1", "datos", { via: "x", heads: "both" }),
          une("m2", "datos", { via: "x", heads: "both" }),
        ],
        [
          vuelta(["cli", "m1", "datos"], "request", 0.7),
          vuelta(["cli", "m2", "datos"], "request", 0.7),
        ],
      ),
    },
    {
      title: "SOA con bus de servicios",
      kind: "tecnica",
      body: [
        "En la arquitectura orientada a servicios, cada servicio agrupa funciones con un propósito común, y muchas aplicaciones los reutilizan. Se comunican por mensajes a través de un bus.",
        "Las responsabilidades quedan claras y la cohesión es alta. El problema aparece en el centro: el bus acaba concentrando reglas y se vuelve un monolito de comunicación.",
      ],
      note: "Cuesta: el bus central es un cuello de botella y un punto único de fallo.",
      scene: escena(
        [
          persona("c1", 0, -3, "Escritorio", { icon: "browser" }),
          persona("c2", 0, 3, "Móvil"),
          cola("esb", 5, 0, "Bus de servicios (ESB)", { load: 0.88 }),
          nodo("a", 10, -4, "Buscar", "violet", { icon: "server" }),
          nodo("b", 10, 0, "Agendar", "violet", { icon: "server" }),
          nodo("c", 10, 4, "Recetar", "violet", { icon: "server" }),
        ],
        [
          une("c1", "esb", { via: "y", heads: "both" }),
          une("c2", "esb", { via: "y", heads: "both" }),
          une("esb", "a", { via: "y", heads: "both" }),
          une("esb", "b", { heads: "both" }),
          une("esb", "c", { via: "y", heads: "both" }),
        ],
        [
          vuelta(["c1", "esb", "a"], "request", 0.7),
          vuelta(["c2", "esb", "b"], "request", 0.7),
          vuelta(["c1", "esb", "c"], "request", 0.5),
        ],
      ),
    },
    {
      title: "Microservicios",
      kind: "tecnica",
      body: [
        "Servicios pequeños que se despliegan por separado. Un gateway recibe las peticiones y las reparte. Ya no hay un bus con reglas en medio.",
        "La regla que los define es el aislamiento del almacenamiento: cada servicio tiene su base de datos y nadie más la toca. Lo que necesite de otro, se lo pide por su interfaz.",
      ],
      note: "Cuesta: red, datos repartidos y mucha operación. Para un equipo de cinco personas suele ser excesivo.",
      scene: micro(),
    },
    {
      title: "Independencia de procesos",
      kind: "tecnica",
      body: [
        "Cada servicio es un proceso aparte, así que falla por separado. Si órdenes se cae, el catálogo y el carrito siguen atendiendo.",
        "Esa independencia hay que diseñarla: quien llama a otro servicio debe saber qué hacer cuando no responde. En un diagrama de secuencia es un alt por cada llamada de red.",
      ],
      changes: ["− Órdenes deja de responder", "~ Los otros dos servicios siguen funcionando"],
      scene: micro(true),
    },
    {
      title: "Dirigido por eventos",
      kind: "tecnica",
      body: [
        "El productor no llama a nadie: publica un evento en un tema y sigue con lo suyo. El broker lo entrega a quien esté suscrito.",
        "Productor y consumidores no se conocen, así que se pueden añadir consumidores sin tocar al productor. A cambio, seguir qué pasó y en qué orden es más difícil.",
      ],
      note: "Mismos papeles, distintos nombres: publisher, producer o emitter; subscriber, consumer o receiver; topic, exchange o queue.",
      scene: escena(
        [
          nodo("prod", 0, 0, "Productor", "cyan", { icon: "server" }),
          cola("topic", 5, 0, "Tema (broker)"),
          nodo("s1", 10, -3, "Consumidor: saldos", "violet", { icon: "server" }),
          nodo("s2", 10, 3, "Consumidor: avisos", "violet", { icon: "server" }),
        ],
        [une("prod", "topic"), une("topic", "s1", { via: "y" }), une("topic", "s2", { via: "y" })],
        [ida(["prod", "topic", "s1"], "write", 0.8), ida(["prod", "topic", "s2"], "write", 0.8)],
      ),
    },
    {
      title: "CQRS",
      kind: "tecnica",
      body: [
        "Separa las escrituras (comandos) de las lecturas (consultas) en dos servicios, cada uno con su propio modelo de datos. Los comandos responden «aceptado» y publican eventos.",
        "Con esos eventos se mantiene al día el modelo de lectura. Sirve cuando leer y escribir tienen cargas muy distintas.",
      ],
      note: "Cuesta: dos modelos que mantener y consistencia eventual. Una lectura puede no ver todavía la última escritura.",
      scene: escena(
        [
          persona("u", 0, 0, "Usuario"),
          nodo("cmd", 5, -3, "Servicio de comandos", "amber", { icon: "server" }),
          nodo("qry", 5, 3, "Servicio de consultas", "cyan", { icon: "server" }),
          bd("w", 10, -3, "BD de escritura", "amber"),
          bd("r", 10, 3, "BD de lectura", "cyan"),
        ],
        [
          une("u", "cmd", { via: "y", label: "POST" }),
          une("u", "qry", { via: "y", heads: "both", label: "GET" }),
          une("cmd", "w"),
          une("qry", "r", { heads: "both" }),
          une("w", "r", { label: "eventos" }),
        ],
        [
          ida(["u", "cmd", "w"], "write", 0.5),
          ida(["w", "r"], "ping", 0.5),
          vuelta(["u", "qry", "r"], "query", 1.4),
        ],
      ),
    },
    {
      title: "Hexagonal",
      kind: "tecnica",
      body: [
        "Puertos y adaptadores, con el dominio al centro. El núcleo define puertos: de entrada, lo que ofrece, y de salida, lo que necesita.",
        "Los adaptadores primarios lo conducen: un controlador REST o un comando de terminal. Los secundarios son conducidos por él: el repositorio o el cliente de un servicio externo. Todas las dependencias apuntan hacia el centro.",
      ],
      note: "Cuesta: más interfaces y más estructura desde el primer día.",
      scene: escena(
        [
          nodo("rest", 0, -3, "Controlador REST", "cyan", { icon: "globe" }),
          nodo("cli", 0, 3, "Comando de terminal", "cyan", { icon: "browser" }),
          nucleo(["puertos"]),
          bd("repo", 10, -3, "Repositorio ORM", "indigo"),
          nodo("ext", 10, 3, "Cliente externo", "indigo", { icon: "globe" }),
        ],
        [
          une("rest", "core", { via: "y", label: "entrada" }),
          une("cli", "core", { via: "y", label: "entrada" }),
          une("core", "repo", { via: "y", heads: "both", label: "salida" }),
          une("core", "ext", { via: "y", heads: "both", label: "salida" }),
        ],
        [
          vuelta(["rest", "core", "repo"], "request", 0.7),
          vuelta(["cli", "core", "ext"], "request", 0.5),
        ],
      ),
    },
    {
      title: "Probar sin infraestructura",
      kind: "solucion",
      body: [
        "Lo que se compra con esa estructura: los adaptadores se cambian sin tocar el núcleo. Para probar, el que conduce es el ejecutor de pruebas y los secundarios son versiones en memoria.",
        "El dominio se prueba completo sin base de datos, sin red y sin interfaz. Las pruebas corren en milisegundos y no dependen de nada externo.",
      ],
      changes: [
        "− Controlador REST y comando de terminal",
        "+ Ejecutor de pruebas",
        "~ Adaptadores secundarios en memoria",
        "~ El núcleo no cambia",
      ],
      scene: escena(
        [
          nodo("test", 0, 0, "Ejecutor de pruebas", "rose", { icon: "shield" }),
          nucleo(["sin cambios"]),
          bd("mem", 10, -3, "Repositorio en memoria", "slate"),
          nodo("fake", 10, 3, "Cliente simulado", "slate", { icon: "globe" }),
        ],
        [
          une("test", "core", { label: "entrada" }),
          une("core", "mem", { via: "y", heads: "both", label: "salida" }),
          une("core", "fake", { via: "y", heads: "both", label: "salida" }),
        ],
        [
          vuelta(["test", "core", "mem"], "request", 1.2),
          vuelta(["test", "core", "fake"], "request", 0.9),
        ],
      ),
    },
    {
      title: "Resumen",
      kind: "resumen",
      body: [
        "Ninguno de estos estilos es gratis. Lo que resuelve uno es lo que complica otro, y la decisión sale de los requerimientos no funcionales.",
        "Para el proyecto del curso: capas o hexagonal como base, eventos para el trabajo lento, y los demás hay que reconocerlos, no usarlos.",
      ],
      scene: escena(
        [
          nodo("rest", 0, -3, "Controlador REST", "cyan", { icon: "globe" }),
          nucleo(["puertos"]),
          bd("repo", 10, -3, "Repositorio ORM", "indigo"),
          tabla(1, 6, "Qué resuelve y qué cuesta", [
            ["Monolito modular", "simple · todo junto"],
            ["SOA", "reuso · bus central"],
            ["Microservicios", "equipos aparte · red"],
            ["Eventos", "desacopla · seguir el hilo"],
            ["CQRS", "cargas distintas · 2 modelos"],
            ["Hexagonal", "probar · más interfaces"],
          ]),
        ],
        [
          une("rest", "core", { via: "y", label: "entrada" }),
          une("core", "repo", { via: "y", heads: "both", label: "salida" }),
        ],
        [vuelta(["rest", "core", "repo"], "request", 0.7)],
      ),
    },
  ],
};
