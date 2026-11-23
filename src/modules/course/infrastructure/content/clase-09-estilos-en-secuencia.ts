import type { Lesson } from "@/modules/course/domain/lesson";
import { actor, alt, async_, diagram, els, end, obj, ret, self, sync } from "./sequence-helpers";

// Liquidar una deuda en Cuentas Claras con microservicios y eventos.
const d = diagram(
  [
    actor("m", "Miembro"),
    obj("app", ":App"),
    obj("gw", ":Gateway"),
    obj("pagos", ":ServicioPagos", "productor"),
    obj("bd", ":BDPagos"),
    obj("grupos", ":ServicioGrupos"),
    obj("broker", ":Broker", "broker"),
    obj("saldos", ":ServicioSaldos", "consumidor"),
    obj("notif", ":ServicioNotificaciones", "consumidor"),
  ],
  [
    [
      sync("m", "app", "registrarPago(acreedor, monto)"),
      sync("app", "gw", "POST /pagos (grupoId, acreedor, monto)"),
    ],
    [sync("gw", "pagos", "POST /pagos (grupoId, deudor, acreedor, monto)")],
    [
      sync("pagos", "grupos", "GET /grupos/{id}/miembros"),
      ret("grupos", "pagos", "pertenecen o no"),
    ],
    [
      alt("alguno no pertenece"),
      ret("pagos", "gw", "422"),
      ret("gw", "app", "422"),
      ret("app", "m", "muestra el error"),
    ],
    [els("ambos pertenecen"), sync("pagos", "bd", "insertar(pago)")],
    [async_("pagos", "broker", "publicar(PagoRegistrado)")],
    [
      ret("pagos", "gw", "201 (pago)"),
      ret("gw", "app", "201 (pago)"),
      ret("app", "m", "pago registrado"),
    ],
    [
      async_("broker", "saldos", "entregar(PagoRegistrado)"),
      self("saldos", "recalcularDeudas(grupoId)"),
    ],
    [
      async_("broker", "notif", "entregar(PagoRegistrado)"),
      async_("notif", "m", "aviso al acreedor"),
    ],
    [end],
  ],
);

export const clase09: Lesson = {
  slug: "clase-9-estilos-en-secuencia",
  module: "Secuencias de diseño",
  track: "principal",
  label: "Clase 9",
  title: "Particionamiento y estilos en secuencia",
  summary:
    "La arquitectura decide quiénes participan y qué mensajes se cruzan. Liquidar una deuda con microservicios y eventos.",
  minutes: 13,
  goals: [
    "Reconocer un estilo de arquitectura por su huella en la secuencia",
    "Dibujar un mensaje asíncrono y saber por qué no tiene retorno",
    "Explicar el aislamiento del almacenamiento entre servicios",
    "Ubicar la respuesta al actor respecto al trabajo de los consumidores",
  ],
  steps: [
    {
      title: "La arquitectura pone los participantes",
      kind: "tecnica",
      body: [
        "Antes de dibujar un mensaje hay que saber cómo está partido el sistema. Aquí es un sistema de microservicios dirigido por eventos: un gateway, servicios con su propia base de datos y un broker.",
        "El estereotipo, en cursiva sobre el nombre, dice qué papel juega cada uno: productor, broker o consumidor.",
      ],
      note: "Cada estilo deja una huella: en capas todo baja de forma síncrona; con eventos aparecen mensajes que nadie espera.",
      scene: d.at(0),
    },
    {
      title: "Todo entra por el gateway",
      kind: "tecnica",
      body: [
        "El miembro registra el pago en la app, y la app hace una sola llamada HTTP al gateway. No conoce a los servicios que hay detrás.",
        "Es la relación cliente-servidor: siempre inicia el cliente, y el servidor no sabe nada de sus clientes.",
      ],
      changes: ["+ registrarPago(acreedor, monto)", "+ POST /pagos"],
      scene: d.at(1),
    },
    {
      title: "El gateway enruta al servicio",
      kind: "tecnica",
      body: [
        "El gateway reenvía la petición al servicio de pagos y añade lo que sabe por la sesión: quién es el deudor.",
        "Es una llamada por red entre procesos distintos. Cada servicio puede fallar por separado; a eso se le llama independencia de procesos.",
      ],
      changes: ["+ POST /pagos (grupoId, deudor, acreedor, monto)"],
      scene: d.at(2),
    },
    {
      title: "Preguntar al dueño de los datos",
      kind: "tecnica",
      body: [
        "Pagos necesita saber si deudor y acreedor pertenecen al grupo. Esos datos son del servicio de grupos, así que se los pide por su interfaz.",
        "Lo que nunca se dibuja es una flecha de pagos a la base de datos de grupos. Es el aislamiento del almacenamiento: nadie toca la base de datos de otro.",
      ],
      changes: ["+ GET /grupos/{id}/miembros"],
      scene: d.at(3),
    },
    {
      title: "alt: alguno no pertenece",
      kind: "problema",
      body: [
        "Si alguno de los dos no es miembro, no hay pago. El servicio responde 422 y el error sube por el gateway y la app hasta el miembro.",
        "En esta rama no se guarda nada ni se publica nada.",
      ],
      changes: ["+ alt [alguno no pertenece]", "+ 422"],
      scene: d.at(4),
    },
    {
      title: "Cada servicio, su base de datos",
      kind: "tecnica",
      body: [
        "Cuando ambos pertenecen, pagos guarda el pago en su propia base de datos. Solo él escribe ahí.",
        "La rama del error queda atenuada: ya no es la que se está recorriendo.",
      ],
      changes: ["+ else [ambos pertenecen]", "+ insertar(pago)"],
      scene: d.at(5),
    },
    {
      title: "Publicar un evento",
      kind: "tecnica",
      body: [
        "Ahora pagos avisa de que algo ocurrió: publica PagoRegistrado en el broker. Es un mensaje asíncrono, línea continua con triángulo de relleno blanco.",
        "Un asíncrono nunca tiene retorno. El productor no espera, ni sabe quién va a escuchar el evento.",
      ],
      changes: ["+ publicar(PagoRegistrado), asíncrono"],
      scene: d.at(6),
    },
    {
      title: "Responder sin esperar",
      kind: "solucion",
      body: [
        "Fíjate en el orden: el 201 sale ya, justo después de publicar. El miembro ve «pago registrado» antes de que nadie haya procesado el evento.",
        "Esa es la huella del estilo: la respuesta al actor no depende del trabajo de los consumidores.",
      ],
      note: "En el parcial: el 201 va después de publicar y antes de las entregas del broker.",
      changes: ["+ 201 (pago) hasta el miembro"],
      scene: d.at(7),
    },
    {
      title: "Un consumidor: saldos",
      kind: "tecnica",
      body: [
        "Más tarde, el broker entrega el evento al servicio de saldos, que recalcula las deudas del grupo con un mensaje a sí mismo.",
        "Saldos no le responde a pagos. Si mañana se cae, los pagos se siguen registrando y él se pone al día cuando vuelva.",
      ],
      changes: ["+ entregar(PagoRegistrado)", "+ recalcularDeudas(grupoId)"],
      scene: d.at(8),
    },
    {
      title: "Otro consumidor: notificaciones",
      kind: "tecnica",
      body: [
        "El mismo evento llega a notificaciones, que avisa al acreedor. Añadir este consumidor no obligó a cambiar una sola línea del servicio de pagos.",
        "Eso es bajo acoplamiento: el productor no conoce a sus consumidores.",
      ],
      changes: ["+ Segundo consumidor del mismo evento"],
      scene: d.at(9),
    },
    {
      title: "Resumen",
      kind: "resumen",
      body: [
        "La arquitectura decide los participantes y el tipo de mensajes. En microservicios, cada servicio guarda lo suyo y se habla por interfaces; con eventos, el productor publica y sigue.",
        "Al revisar: ningún servicio lee la base de datos de otro, publicar no tiene retorno y la respuesta al actor sale antes que los consumidores.",
      ],
      scene: d.at(10),
    },
  ],
};
