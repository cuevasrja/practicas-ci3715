import type { Lesson } from "@/modules/course/domain/lesson";
import { bd, cola, escena, ficha, ida, nodo, persona, tabla, une, vuelta } from "./iso-helpers";

export const patronesComportamiento1: Lesson = {
  slug: "patrones-de-comportamiento-1",
  module: "Patrones de diseño",
  track: "catalogo",
  title: "Patrones de comportamiento I",
  summary:
    "Cómo se reparten las responsabilidades: Command, Chain of Responsibility, Iterator, Mediator, Memento y Observer.",
  minutes: 14,
  goals: [
    "Explicar qué gana una petición al convertirse en un objeto",
    "Distinguir Mediator de Observer preguntando quién decide",
    "Reconocer una cadena de responsabilidad en un middleware",
  ],
  steps: [
    {
      title: "Quién hace qué, y en qué orden",
      kind: "tecnica",
      body: [
        "Los patrones de comportamiento tratan de cómo colaboran los objetos: quién decide, quién avisa a quién y quién puede cortar el paso.",
        "Para no confundirlos entre sí, la pregunta útil es siempre la misma: ¿quién decide?",
      ],
      note: "En la clase 10 se ven Command y Observer por su huella en un diagrama de secuencia.",
      scene: escena(
        [
          nodo("a", 0, 0, "Emisor", "cyan"),
          nodo("b", 5, 0, "Receptor", "violet", { tags: ["¿quién decide?"] }),
        ],
        [une("a", "b")],
      ),
    },

    ...ficha(
      "Command",
      {
        body: [
          "El usuario registra un gasto compartido en el metro, sin cobertura. La pantalla llama al servidor, la llamada falla y el gasto se pierde.",
          "Una llamada directa ocurre ahora o no ocurre. No se puede guardar para después, ni reintentar, ni deshacer.",
        ],
        scene: escena(
          [
            persona("p", 0, 0, "Pantalla", { icon: "browser" }),
            nodo("s", 6, 0, "Servidor", "slate", { icon: "server", tags: ["sin conexión"] }),
          ],
          [une("p", "s", { style: "cut" })],
          [ida(["p", "s"], "drop", 0.8, { fail: 1 })],
        ),
      },
      {
        body: [
          "Command convierte la petición en un objeto con todo lo necesario para ejecutarla. Como objeto, se puede encolar, registrar, reintentar y deshacer.",
          "Quien la invoca solo sabe decir ejecutar(). El comando conoce a su receptor.",
        ],
        enCuentasClaras:
          "cada caso de uso es un comando con su entrada; las operaciones compartidas hechas sin red se encolan y se reintentan.",
        changes: ["+ La petición es un objeto", "+ Cola de pendientes que se reintenta"],
        scene: escena(
          [
            persona("p", 0, 0, "Pantalla", { icon: "browser" }),
            nodo("c", 4, 0, "RegistrarGastoCmd", "amber", { icon: "files", tags: ["Command"] }),
            cola("q", 9, 0, "Cola de pendientes", { tags: ["reintentar"] }),
            nodo("s", 14, 0, "Servidor", "emerald", { icon: "server" }),
          ],
          [une("p", "c"), une("c", "q"), une("q", "s")],
          [ida(["p", "c", "q", "s"], "write", 0.8, { dwellAt: { q: 0.9 } })],
        ),
      },
    ),

    ...ficha(
      "Chain of Responsibility",
      {
        body: [
          "Antes de ejecutar un caso de uso hay que comprobar que el usuario está autenticado, que es miembro del grupo y que los datos son válidos.",
          "Si todo eso vive dentro del caso de uso, cada caso repite las mismas comprobaciones y mezcla seguridad con reglas de negocio.",
        ],
        scene: escena(
          [
            persona("u", 0, 0, "Petición"),
            nodo("cu", 6, 0, "Caso de uso", "rose", {
              icon: "server",
              tags: ["¿autenticado?", "¿miembro?", "¿válido?"],
            }),
          ],
          [une("u", "cu")],
          [ida(["u", "cu"], "slow", 0.7)],
        ),
      },
      {
        body: [
          "La petición pasa por una cadena de manejadores. Cada uno hace una sola comprobación y decide: la pasa al siguiente o corta ahí.",
          "Conviene cuando varios objetos pueden atender o rechazar una petición y el orden importa. Cualquier eslabón puede cortar; esa es la diferencia con un decorador.",
        ],
        enCuentasClaras:
          "el middleware del servidor: autenticación, autorización de miembro, validación y, al final, el caso de uso.",
        changes: [
          "+ Tres manejadores encadenados",
          "~ El caso de uso solo ve peticiones ya comprobadas",
        ],
        scene: escena(
          [
            persona("u", 0, 0, "Petición"),
            nodo("a", 4, 0, "Autenticación", "amber", { icon: "shield" }),
            nodo("z", 8, 0, "Autorización", "amber", { icon: "shield" }),
            nodo("v", 12, 0, "Validación", "amber", { icon: "shield" }),
            nodo("cu", 16, 0, "Caso de uso", "emerald", { icon: "server" }),
          ],
          [une("u", "a"), une("a", "z"), une("z", "v"), une("v", "cu")],
          [
            ida(["u", "a", "z", "v", "cu"], "request", 0.7),
            ida(["u", "a", "z"], "drop", 0.4, { fail: 1 }),
          ],
        ),
      },
    ),

    ...ficha(
      "Iterator",
      {
        body: [
          "Para reconstruir los saldos hay que recorrer el registro de eventos del libro. El código carga todo el registro en memoria y lo recorre.",
          "Con un registro largo no cabe. Y quien recorre necesita saber cómo está guardado por dentro.",
        ],
        scene: escena(
          [
            nodo("s", 0, 0, "CalcularSaldos", "cyan", { icon: "server" }),
            bd("r", 6, 0, "Registro de eventos", "rose", { load: 1, tags: ["todo en memoria"] }),
          ],
          [une("s", "r", { heads: "both" })],
          [vuelta(["s", "r"], "slow", 0.8, { speed: 2, dwellAt: { r: 1.2 } })],
        ),
      },
      {
        body: [
          "Un iterador entrega los elementos de uno en uno con dos operaciones: ¿hay siguiente? y dame el siguiente. La colección decide cómo los obtiene.",
          "Así se recorren colecciones distintas con la misma interfaz, sin exponer su estructura ni cargarlas enteras.",
        ],
        enCuentasClaras:
          "recorrer el registro de eventos del libro para reconstruir saldos sin cargarlos todos en memoria.",
        changes: ["+ Iterador: los eventos llegan de uno en uno"],
        scene: escena(
          [
            nodo("s", 0, 0, "CalcularSaldos", "cyan", { icon: "server" }),
            nodo("i", 5, 0, "Iterador", "amber", { tags: ["haySiguiente()", "siguiente()"] }),
            bd("r", 10, 0, "Registro de eventos", "emerald", { load: 0.15 }),
          ],
          [une("s", "i", { heads: "both" }), une("i", "r", { heads: "both" })],
          [vuelta(["s", "i", "r"], "query", 2)],
        ),
      },
    ),

    ...ficha(
      "Mediator",
      {
        body: [
          "En el formulario de un gasto, el monto afecta a la lista de participantes, la regla de división afecta al monto de cada uno, y todo afecta a si se puede guardar.",
          "Si cada control habla con los demás, las conexiones crecen con cada control nuevo y nadie tiene la visión completa.",
        ],
        metrics: [{ label: "Conexiones", value: 6 }],
        scene: escena(
          [
            nodo("m", 0, 0, "CampoMonto", "rose"),
            nodo("l", 5, -4, "ListaParticipantes", "rose"),
            nodo("r", 5, 4, "SelectorRegla", "rose"),
            nodo("b", 10, 0, "BotonGuardar", "rose"),
          ],
          [
            une("m", "l", { via: "y", heads: "both" }),
            une("m", "r", { via: "y", heads: "both" }),
            une("m", "b", { heads: "both" }),
            une("l", "r", { heads: "both" }),
            une("l", "b", { via: "x", heads: "both" }),
            une("r", "b", { via: "x", heads: "both" }),
          ],
          [ida(["m", "l", "b"], "slow", 0.5), ida(["r", "m", "b"], "slow", 0.5)],
        ),
      },
      {
        body: [
          "Un mediador se coloca en el centro. Los colegas solo le avisan a él de lo que les pasa, y es él quien decide a quién llamar.",
          "El dibujo pasa de una malla a una estrella. Las reglas de coordinación quedan en un solo sitio.",
        ],
        enCuentasClaras:
          "el contexto de React de una pantalla coordina los campos del formulario de gasto.",
        changes: ["+ FormularioGasto como mediador", "− Los controles ya no se conocen entre sí"],
        metrics: [{ label: "Conexiones", value: 4 }],
        scene: escena(
          [
            nodo("m", 0, 0, "CampoMonto", "cyan"),
            nodo("l", 5, -4, "ListaParticipantes", "cyan"),
            nodo("r", 5, 4, "SelectorRegla", "cyan"),
            nodo("b", 10, 0, "BotonGuardar", "cyan"),
            nodo("f", 5, 0, "FormularioGasto", "amber", { icon: "split", tags: ["Mediator"] }),
          ],
          [
            une("m", "f", { heads: "both" }),
            une("l", "f", { heads: "both" }),
            une("r", "f", { heads: "both" }),
            une("b", "f", { heads: "both" }),
          ],
          [
            ida(["m", "f", "l"]),
            ida(["m", "f", "b"], "request", 0.5),
            ida(["r", "f", "l"], "request", 0.5),
          ],
        ),
      },
    ),

    ...ficha(
      "Memento",
      {
        body: [
          "El usuario edita un gasto, se equivoca en el monto y quiere volver a como estaba. El gasto ya cambió y el valor anterior se perdió.",
          "Guardar copias desde fuera obligaría a exponer todos los campos internos del gasto, justo lo que el encapsulamiento quiere evitar.",
        ],
        scene: escena(
          [
            persona("e", 0, 0, "Editor", { icon: "browser" }),
            nodo("g", 6, 0, "Gasto", "rose", { icon: "files", tags: ["monto: 80 → 8"] }),
          ],
          [une("e", "g")],
          [ida(["e", "g"], "slow", 0.6)],
        ),
      },
      {
        body: [
          "El propio objeto crea una instantánea de su estado y sabe restaurarse a partir de ella. Quien la guarda no puede mirar dentro.",
          "Es la otra manera de deshacer: Command revierte la operación; Memento restaura el estado anterior.",
        ],
        enCuentasClaras:
          "este patrón no está en las láminas del curso; se incluye porque completa el catálogo original.",
        changes: ["+ Instantánea del gasto", "+ Historial que la guarda sin abrirla"],
        scene: escena(
          [
            persona("e", 0, 0, "Editor", { icon: "browser" }),
            nodo("g", 5, 0, "Gasto", "emerald", { icon: "files", tags: ["monto: 80"] }),
            nodo("i", 12, 0, "Instantánea", "amber", { tags: ["monto: 80"] }),
            cola("h", 12, 5, "Historial"),
          ],
          [
            une("e", "g"),
            une("g", "i", { heads: "both", label: "guardar / restaurar" }),
            une("i", "h", { heads: "both" }),
          ],
          [vuelta(["e", "g", "i", "h"], "write", 0.6)],
        ),
      },
    ),

    ...ficha(
      "Observer",
      {
        body: [
          "Al registrar un gasto compartido, el libro personal debe anotar un movimiento. Lo directo es que el módulo de gastos compartidos llame al libro.",
          "Con eso, compartido conoce al libro. Y mañana conocerá a notificaciones, a estadísticas y a todo lo que quiera enterarse.",
        ],
        scene: escena(
          [
            nodo("c", 0, 0, "Compartido", "rose", { tags: ["conoce a todos"] }),
            nodo("l", 6, -3, "Libro", "slate", { icon: "files" }),
            nodo("n", 6, 3, "Notificaciones", "slate"),
          ],
          [une("c", "l", { via: "y" }), une("c", "n", { via: "y" })],
          [ida(["c", "l"], "slow", 0.6), ida(["c", "n"], "slow", 0.6)],
        ),
      },
      {
        body: [
          "El sujeto mantiene una lista de observadores que solo conoce por una interfaz. Cuando algo cambia, les avisa a todos; cada uno decide qué hacer.",
          "El emisor no decide nada sobre sus receptores. Añadir uno no toca al emisor.",
        ],
        enCuentasClaras:
          "PublicadorEventos: GastoCompartidoRegistrado hace que Libro escriba el movimiento; los dos contextos no se conocen.",
        changes: ["+ PublicadorEventos", "~ Compartido ya no conoce a Libro"],
        scene: escena(
          [
            nodo("c", 0, 0, "Compartido", "cyan"),
            nodo("p", 5, 0, "PublicadorEventos", "amber", {
              icon: "split",
              tags: ["suscribir()", "notificar()"],
            }),
            nodo("l", 11, -3, "Libro", "emerald", { icon: "files", tags: ["actualizar()"] }),
            nodo("n", 11, 3, "Notificaciones", "emerald", { tags: ["actualizar()"] }),
          ],
          [une("c", "p"), une("p", "l", { via: "y" }), une("p", "n", { via: "y" })],
          [ida(["c", "p", "l"], "write", 0.7), ida(["c", "p", "n"], "write", 0.7)],
        ),
      },
    ),

    {
      title: "Resumen",
      kind: "resumen",
      body: [
        "Mediator y Observer se confunden a menudo. En Observer el emisor avisa y no decide nada; en Mediator el objeto central decide a quién llamar.",
        "Command y Memento son dos caminos para deshacer: uno guarda la operación, el otro el estado.",
      ],
      scene: escena(
        [
          nodo("a", 0, 0, "Emisor", "cyan"),
          nodo("x", 5, 0, "Intermediario", "amber"),
          nodo("b", 10, 0, "Receptor", "emerald"),
          tabla(0, 5, "Qué resuelve cada uno", [
            ["Command", "petición como objeto"],
            ["Chain of Resp.", "manejadores en orden"],
            ["Iterator", "recorrer sin exponer"],
            ["Mediator", "el centro decide"],
            ["Memento", "guardar y restaurar"],
            ["Observer", "avisar sin conocer"],
          ]),
        ],
        [une("a", "x"), une("x", "b")],
        [ida(["a", "x", "b"])],
      ),
    },
  ],
};
