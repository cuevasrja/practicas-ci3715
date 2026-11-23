import type { Lesson } from "@/modules/course/domain/lesson";
import { bd, escena, ida, nodo, persona, tabla, une, vuelta, zona } from "./iso-helpers";

// Las cuatro capas, en forma de L para poder dibujar el salto de una capa.
const presentacion = nodo("pres", 0, 0, "Presentación", "cyan", { icon: "browser" });
const aplicacion = nodo("apli", 5, 0, "Aplicación", "amber", { icon: "server" });
const dominio = nodo("dom", 5, 5, "Dominio", "emerald", { icon: "shield" });
const persistencia = bd("pers", 10, 5, "Persistencia", "indigo");
const capas = [presentacion, aplicacion, dominio, persistencia];
const cadena = [
  une("pres", "apli", { heads: "both" }),
  une("apli", "dom", { heads: "both" }),
  une("dom", "pers", { heads: "both" }),
];

export const estilosClasicos: Lesson = {
  slug: "estilos-de-arquitectura-clasicos",
  module: "Estilos de arquitectura",
  track: "catalogo",
  title: "Estilos clásicos",
  summary:
    "Cliente-servidor, par a par, capas abiertas y cerradas, tres niveles, repositorio, tuberías y filtros, MVC, MVP y MVVM.",
  minutes: 14,
  goals: [
    "Reconocer cada estilo por cómo se reparten y se hablan sus partes",
    "Distinguir una arquitectura de capas cerrada de una abierta",
    "Diferenciar MVC, MVP y MVVM por quién actualiza la vista",
  ],
  steps: [
    {
      title: "El antiejemplo: espagueti",
      kind: "problema",
      body: [
        "Sin un estilo, las relaciones van en cualquier dirección. Cada parte conoce a todas las demás, y cambiar una puede afectar a todo el sistema.",
        "Un estilo de arquitectura es un acuerdo sobre qué partes hay y cuáles pueden hablarse. Cada uno resuelve algo y cuesta algo.",
      ],
      metrics: [{ label: "Dependencias", value: 6 }],
      scene: escena(
        [
          nodo("a", 0, 0, "Pedidos"),
          nodo("b", 5, -3, "Pagos"),
          nodo("c", 5, 3, "Inventario"),
          nodo("d", 10, 0, "Envíos"),
        ],
        [
          une("a", "b", { via: "y", heads: "both" }),
          une("a", "c", { via: "y", heads: "both" }),
          une("a", "d", { heads: "both" }),
          une("b", "c", { heads: "both" }),
          une("b", "d", { via: "x", heads: "both" }),
          une("c", "d", { via: "x", heads: "both" }),
        ],
        [ida(["a", "b", "c", "d"], "request", 0.5), ida(["d", "a", "c", "b"], "request", 0.5)],
      ),
    },
    {
      title: "Cliente-servidor",
      kind: "tecnica",
      body: [
        "La base de casi todos los demás. El servidor ofrece servicios y los clientes los piden: petición y respuesta.",
        "Siempre inicia el cliente. El servidor no conoce a sus clientes, y por eso puede atender a muchos distintos a la vez.",
      ],
      note: "Cuesta: el servidor es un punto único de fallo y de carga.",
      scene: escena(
        [
          persona("c1", 0, -3, "Cliente web", { icon: "browser" }),
          persona("c2", 0, 3, "Cliente móvil"),
          nodo("srv", 5, 0, "Servidor", "violet", { icon: "server" }),
          bd("datos", 10, 0, "Datos"),
        ],
        [
          une("c1", "srv", { via: "y", heads: "both" }),
          une("c2", "srv", { via: "y", heads: "both" }),
          une("srv", "datos", { heads: "both" }),
        ],
        [vuelta(["c1", "srv", "datos"]), vuelta(["c2", "srv", "datos"])],
      ),
    },
    {
      title: "Par a par",
      kind: "tecnica",
      body: [
        "Una generalización del anterior: cada nodo es cliente y servidor a la vez. Cualquiera puede pedirle un servicio a cualquier otro.",
        "No hay un centro que se caiga, pero tampoco uno que coordine: es más difícil de razonar y puede haber bloqueos mutuos.",
      ],
      note: "Ejemplos: redes de intercambio de archivos o la sincronización directa entre dispositivos.",
      scene: escena(
        [
          nodo("p1", 0, 0, "Par A", "violet", { icon: "server" }),
          nodo("p2", 5, -3, "Par B", "violet", { icon: "server" }),
          nodo("p3", 5, 3, "Par C", "violet", { icon: "server" }),
        ],
        [
          une("p1", "p2", { via: "y", heads: "both" }),
          une("p1", "p3", { via: "y", heads: "both" }),
          une("p2", "p3", { heads: "both" }),
        ],
        [
          vuelta(["p1", "p2"], "request", 0.5),
          vuelta(["p3", "p1"], "request", 0.5),
          vuelta(["p2", "p3"], "request", 0.5),
        ],
      ),
    },
    {
      title: "Capas cerradas",
      kind: "tecnica",
      body: [
        "Una capa ofrece servicios a la de arriba usando solo las de abajo. En una arquitectura cerrada, cada capa usa únicamente la inmediatamente inferior.",
        "El recorrido de una petición es lineal y fácil de seguir. Cambiar una capa afecta, como mucho, a la que tiene encima.",
      ],
      note: "Cuesta: toda petición atraviesa todas las capas, aunque alguna no aporte nada.",
      scene: escena(capas, cadena, [vuelta(["pres", "apli", "dom", "pers"], "request", 0.8)]),
    },
    {
      title: "Capas abiertas",
      kind: "tecnica",
      body: [
        "En una arquitectura abierta, una capa puede saltarse las intermedias y usar una más profunda. Aquí la aplicación lee directamente de persistencia.",
        "Se gana rapidez y se pierde aislamiento: ahora cambiar la persistencia obliga a revisar dos capas en lugar de una.",
      ],
      changes: ["+ La aplicación salta el dominio"],
      scene: escena(
        capas,
        [...cadena, une("apli", "pers", { via: "x", heads: "both", label: "salto" })],
        [
          vuelta(["pres", "apli", "dom", "pers"], "request", 0.5),
          vuelta(["apli", "pers"], "query", 0.7),
        ],
      ),
    },
    {
      title: "La regla que no se rompe",
      kind: "problema",
      body: [
        "Abierta o cerrada, hay algo que nunca se permite: que una capa baja conozca a una alta. Las llamadas bajan; hacia arriba solo suben los retornos.",
        "Si el repositorio importa algo del controlador, las capas dejaron de ser capas. Revísalo en los imports de tu proyecto.",
      ],
      changes: ["− Persistencia no puede llamar a presentación"],
      scene: escena(
        capas,
        [...cadena, une("pers", "pres", { via: "x", style: "cut" })],
        [
          vuelta(["pres", "apli", "dom", "pers"], "request", 0.6),
          ida(["pers", "pres"], "drop", 0.6, { fail: 1 }),
        ],
      ),
    },
    {
      title: "Tres niveles",
      kind: "tecnica",
      body: [
        "Cuando las capas se reparten en máquinas distintas se habla de niveles. El reparto clásico: interfaz en el equipo del usuario, lógica en un servidor de aplicaciones y almacenamiento en un servidor de datos.",
        "Una capa es una división lógica del código; un nivel, una división física del despliegue. No siempre coinciden.",
      ],
      note: "Con cuatro niveles, la interfaz se parte en dos: lo que corre en el cliente y lo que se genera en el servidor.",
      scene: escena(
        [
          zona("z1", 0, 0, 4.4, 4.4, "Equipo del usuario", "indigo"),
          zona("z2", 6, 0, 4.4, 4.4, "Servidor de aplicaciones", "amber"),
          zona("z3", 12, 0, 4.4, 4.4, "Servidor de datos", "emerald"),
          persona("ui", 0, 0, "Interfaz", { icon: "browser" }),
          nodo("log", 6, 0, "Lógica", "amber", { icon: "server" }),
          bd("alm", 12, 0, "Almacenamiento"),
        ],
        [une("ui", "log", { heads: "both" }), une("log", "alm", { heads: "both" })],
        [vuelta(["ui", "log", "alm"], "request", 0.8)],
      ),
    },
    {
      title: "Repositorio",
      kind: "tecnica",
      body: [
        "Todos los subsistemas trabajan sobre una misma estructura de datos central. No se hablan entre sí: lo que uno escribe, otro lo lee.",
        "Añadir un subsistema es fácil y todos ven datos consistentes. A cambio, el repositorio es un cuello de botella y cambiar su esquema afecta a todos.",
      ],
      note: "Ejemplos: un compilador alrededor de su árbol sintáctico, o un entorno de desarrollo alrededor del proyecto.",
      scene: escena(
        [
          bd("repo", 5, 0, "Repositorio", "emerald", { load: 0.85 }),
          nodo("s1", 0, 0, "Editor", "cyan"),
          nodo("s2", 5, -5, "Compilador", "cyan"),
          nodo("s3", 10, 0, "Depurador", "cyan"),
          nodo("s4", 5, 5, "Analizador", "cyan"),
        ],
        [
          une("s1", "repo", { heads: "both" }),
          une("s2", "repo", { heads: "both" }),
          une("s3", "repo", { heads: "both" }),
          une("s4", "repo", { heads: "both" }),
        ],
        [
          vuelta(["s1", "repo"], "write", 0.6),
          vuelta(["s2", "repo"], "query", 0.6),
          vuelta(["s3", "repo"], "query", 0.6),
          vuelta(["s4", "repo"], "query", 0.6),
        ],
      ),
    },
    {
      title: "Tuberías y filtros",
      kind: "tecnica",
      body: [
        "El trabajo es una cadena de transformaciones. Cada filtro recibe datos por una tubería, hace una sola cosa y entrega el resultado al siguiente.",
        "Los filtros no se conocen entre sí, así que se pueden reordenar, sustituir o ejecutar en paralelo. No sirve cuando hace falta interacción de ida y vuelta.",
      ],
      note: "En el traductor del laboratorio: audio, transcripción, traducción y síntesis de voz.",
      scene: escena(
        [
          persona("in", 0, 0, "Audio"),
          nodo("f1", 4, 0, "Transcribir", "cyan"),
          nodo("f2", 8, 0, "Traducir", "amber"),
          nodo("f3", 12, 0, "Sintetizar", "violet"),
          persona("out", 16, 0, "Voz traducida"),
        ],
        [une("in", "f1"), une("f1", "f2"), une("f2", "f3"), une("f3", "out")],
        [ida(["in", "f1", "f2", "f3", "out"], "request", 1)],
      ),
    },
    {
      title: "MVC",
      kind: "tecnica",
      body: [
        "Modelo-vista-controlador separa tres cosas: el modelo guarda el estado, las vistas lo muestran y el controlador recibe lo que hace el usuario.",
        "Las vistas se suscriben al modelo. Cuando el modelo cambia les avisa, y son ellas las que le consultan el estado nuevo. El modelo no depende de ninguna vista concreta.",
      ],
      note: "Es el patrón Observer aplicado a la interfaz: por eso se pueden añadir vistas sin tocar el modelo.",
      scene: escena(
        [
          persona("u", 0, 0, "Usuario"),
          nodo("ctl", 4, 0, "Controlador", "amber", { icon: "split" }),
          nodo("mod", 9, 0, "Modelo", "emerald", { icon: "files" }),
          nodo("v1", 9, 5, "Vista de saldos", "cyan", { icon: "browser" }),
          nodo("v2", 14, 0, "Vista de gráfico", "cyan", { icon: "browser" }),
        ],
        [
          une("u", "ctl"),
          une("ctl", "mod"),
          une("mod", "v1", { heads: "both", label: "avisa" }),
          une("mod", "v2", { heads: "both", label: "avisa" }),
        ],
        [
          ida(["u", "ctl", "mod"], "request", 0.7),
          vuelta(["v1", "mod"], "query", 0.6),
          vuelta(["v2", "mod"], "query", 0.6),
        ],
      ),
    },
    {
      title: "MVP",
      kind: "tecnica",
      body: [
        "En modelo-vista-presentador la vista es pasiva: no conoce al modelo. Todo pasa por el presentador, que recibe los eventos, habla con el modelo y le dice a la vista qué mostrar.",
        "Como la vista no decide nada, el presentador se puede probar sin interfaz gráfica.",
      ],
      note: "La diferencia con MVC: aquí la vista nunca consulta al modelo por su cuenta.",
      scene: escena(
        [
          nodo("v", 0, 0, "Vista", "cyan", { icon: "browser", tags: ["pasiva"] }),
          nodo("p", 5, 0, "Presentador", "amber", { icon: "split" }),
          nodo("m", 10, 0, "Modelo", "emerald", { icon: "files" }),
        ],
        [une("v", "p", { heads: "both" }), une("p", "m", { heads: "both" })],
        [vuelta(["v", "p", "m"], "request", 0.8)],
      ),
    },
    {
      title: "MVVM",
      kind: "tecnica",
      body: [
        "En modelo-vista-ViewModel, la vista se enlaza a las propiedades del ViewModel. Cuando una propiedad cambia, la vista se actualiza sola.",
        "El ViewModel nunca llama a la vista: solo publica que una propiedad cambió. Es el estilo de la mayoría de los marcos de interfaz actuales.",
      ],
      note: "En un diagrama de secuencia se reconoce por el mensaje «propiedad cambiada» y por la ausencia de llamadas del ViewModel a la vista.",
      scene: escena(
        [
          nodo("v", 0, 0, "Vista", "cyan", { icon: "browser" }),
          nodo("vm", 5, 0, "ViewModel", "amber", { icon: "split", tags: ["propiedades"] }),
          nodo("m", 10, 0, "Modelo", "emerald", { icon: "files" }),
        ],
        [une("v", "vm", { heads: "both", label: "enlace" }), une("vm", "m", { heads: "both" })],
        [vuelta(["v", "vm"], "ping", 1.2), vuelta(["vm", "m"], "request", 0.6)],
      ),
    },
    {
      title: "Resumen",
      kind: "resumen",
      body: [
        "No hay un estilo mejor: hay uno que encaja con las metas de diseño. Antes de elegir, pregunta qué resuelve y qué cuesta.",
        "Los tres últimos responden a la misma pregunta, cómo separar la interfaz del estado, con una respuesta distinta sobre quién actualiza la vista.",
      ],
      scene: escena(
        [
          nodo("v", 0, 0, "Vista", "cyan", { icon: "browser" }),
          nodo("vm", 5, 0, "ViewModel", "amber", { icon: "split" }),
          nodo("m", 10, 0, "Modelo", "emerald", { icon: "files" }),
          tabla(-1, 5, "Qué define a cada uno", [
            ["Cliente-servidor", "inicia el cliente"],
            ["Par a par", "todos piden y sirven"],
            ["Capas", "solo se llama hacia abajo"],
            ["Tres niveles", "capas en máquinas"],
            ["Repositorio", "datos al centro"],
            ["Tuberías y filtros", "cadena de pasos"],
            ["MVC", "la vista se suscribe"],
            ["MVP", "la vista es pasiva"],
            ["MVVM", "la vista se enlaza"],
          ]),
        ],
        [une("v", "vm", { heads: "both", label: "enlace" }), une("vm", "m", { heads: "both" })],
        [vuelta(["v", "vm"], "ping", 1.2), vuelta(["vm", "m"], "request", 0.6)],
      ),
    },
  ],
};
