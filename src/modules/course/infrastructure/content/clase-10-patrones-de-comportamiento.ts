import type { Lesson } from "@/modules/course/domain/lesson";
import {
  actor,
  alt,
  async_,
  diagram,
  els,
  end,
  ext,
  obj,
  ret,
  self,
  sync,
} from "./sequence-helpers";

// Deshacer un gasto: Command + Observer.
const d = diagram(
  [
    actor("u", "Usuario"),
    obj("p", ":PantallaGrupo"),
    obj("h", ":Historial"),
    obj("c", ":RegistrarGastoCmd"),
    obj("g", ":Grupo"),
    obj("vs", ":VistaSaldos"),
    obj("n", ":Notificador"),
    ext("sc", ":ServicioCorreo"),
  ],
  [
    [sync("u", "p", "pulsa Deshacer")],
    [sync("p", "h", "desapilar()"), ret("h", "p", "cmd o ninguno")],
    [alt("historial vacío"), ret("p", "u", "nada que deshacer")],
    [els("hay un comando"), sync("p", "c", "deshacer()")],
    [sync("c", "g", "eliminarGasto(gasto)")],
    [self("g", "notificar()")],
    [sync("g", "vs", "actualizar()"), sync("vs", "g", "getSaldos()"), ret("g", "vs", "saldos")],
    [sync("g", "n", "actualizar()"), async_("n", "sc", "enviarAviso(miembros, gasto eliminado)")],
    [ret("p", "u", "muestra el grupo actualizado")],
    [end],
  ],
);

export const clase10: Lesson = {
  slug: "clase-10-patrones-de-comportamiento",
  module: "Secuencias de diseño",
  track: "principal",
  label: "Clase 10",
  title: "Patrones de comportamiento en secuencia",
  summary:
    "Cada patrón deja una huella en quién llama a quién. Deshacer un gasto combina Command y Observer.",
  minutes: 12,
  goals: [
    "Reconocer Command por su historial y su operación deshacer",
    "Reconocer Observer por la notificación a través de una interfaz",
    "Distinguir patrones preguntando quién decide",
  ],
  steps: [
    {
      title: "Quién llama a quién",
      kind: "tecnica",
      body: [
        "En la clase 5 vimos los patrones por su diagrama de clases. Aquí los reconocemos por el orden de los mensajes: cada uno deja una huella en la secuencia.",
        "El ejemplo es deshacer un gasto en Cuentas Claras. Participan una pantalla, un historial, un comando, el grupo y dos objetos que quieren enterarse de los cambios.",
      ],
      note: "Para no confundir dos patrones, pregunta siempre quién decide.",
      scene: d.at(0),
    },
    {
      title: "El usuario pide deshacer",
      kind: "tecnica",
      body: [
        "El usuario pulsa Deshacer. La pantalla no sabe qué hay que revertir: podría ser un gasto, un pago o cualquier otra operación.",
        "Ese es el problema que resuelve Command: tratar una petición como un objeto que se puede guardar y deshacer.",
      ],
      changes: ["+ pulsa Deshacer"],
      scene: d.at(1),
    },
    {
      title: "El historial guarda los comandos",
      kind: "tecnica",
      body: [
        "Cuando se registró el gasto, el comando se apiló en el historial. Ahora la pantalla le pide el último.",
        "El retorno dice lo que puede volver: un comando, o ninguno si no hay nada que deshacer.",
      ],
      changes: ["+ desapilar()", "+ retorno: cmd o ninguno"],
      scene: d.at(2),
    },
    {
      title: "alt: historial vacío",
      kind: "problema",
      body: [
        "Si no hay comandos, la interacción termina aquí con un aviso al usuario.",
        "Aunque sea corta, esta rama también responde al actor.",
      ],
      changes: ["+ alt [historial vacío]"],
      scene: d.at(3),
    },
    {
      title: "Command: deshacer()",
      kind: "tecnica",
      body: [
        "Hay un comando, y la pantalla solo le dice deshacer(). No necesita saber de qué clase es ni qué hizo.",
        "Esa es la huella de Command: quien invoca habla con el comando, y el comando sabe a qué receptor llamar.",
      ],
      changes: ["+ else [hay un comando]", "+ deshacer()"],
      scene: d.at(4),
    },
    {
      title: "El comando llama al receptor",
      kind: "tecnica",
      body: [
        "El comando guardó en su momento qué gasto registró y en qué grupo. Ahora le pide al grupo que lo elimine.",
        "A diferencia de una Strategy, el comando se guarda y se puede deshacer; por eso recuerda sus datos.",
      ],
      changes: ["+ eliminarGasto(gasto)"],
      scene: d.at(5),
    },
    {
      title: "Observer: notificar()",
      kind: "tecnica",
      body: [
        "El grupo ha cambiado y hay objetos que deben enterarse. Con un mensaje a sí mismo recorre su lista de suscriptores.",
        "El grupo no sabe quiénes son ni qué harán. Solo sabe que todos entienden actualizar().",
      ],
      changes: ["+ notificar(), mensaje a sí mismo"],
      scene: d.at(6),
    },
    {
      title: "El suscriptor consulta el estado",
      kind: "tecnica",
      body: [
        "La vista de saldos recibe actualizar() y es ella quien vuelve al grupo a pedir los saldos nuevos.",
        "Esa ida y vuelta es la huella de Observer: el publicador avisa, y cada suscriptor pregunta lo que le interesa.",
      ],
      changes: ["+ actualizar()", "+ getSaldos() y su retorno"],
      scene: d.at(7),
    },
    {
      title: "Otro suscriptor, otra reacción",
      kind: "tecnica",
      body: [
        "El notificador recibe exactamente el mismo mensaje y hace algo distinto: envía un correo. Lo manda de forma asíncrona a un sistema externo, sin esperar respuesta.",
        "En un Mediator sería el mediador quien decide a quién llamar. En Observer el publicador no decide nada.",
      ],
      changes: ["+ actualizar()", "+ enviarAviso(...), asíncrono"],
      scene: d.at(8),
    },
    {
      title: "La respuesta al usuario",
      kind: "solucion",
      body: [
        "Con el gasto eliminado y las vistas al día, la pantalla muestra el grupo actualizado.",
        "El correo puede seguir en camino: al ser asíncrono, nadie lo espera.",
      ],
      changes: ["+ muestra el grupo actualizado"],
      scene: d.at(9),
    },
    {
      title: "Resumen",
      kind: "resumen",
      body: [
        "Command: se crea el comando, se ejecuta, se apila, y más tarde alguien le dice deshacer(). Observer: tras un cambio, el mismo actualizar() llega a cada suscriptor por una interfaz.",
        "Las distinciones que más se preguntan: en Observer el publicador no decide y en Mediator sí; en Strategy elige el cliente y en State el propio estado; en una cadena de responsabilidad cualquier eslabón puede cortar.",
      ],
      scene: d.at(10),
    },
  ],
};
