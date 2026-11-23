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
  stage,
  sync,
} from "./sequence-helpers";

// Ejercicio guiado: comprar boletos de cine con pasarela y webhook.
const d = diagram(
  [
    actor("c", "Cliente"),
    obj("nav", ":Navegador"),
    obj("srv", ":ServidorCine"),
    obj("repo", ":RepositorioAsientos"),
    ext("pas", ":Pasarela"),
    obj("broker", ":Broker", "broker"),
    obj("correo", ":ServicioCorreo", "consumidor"),
  ],
  [
    [stage("Etapa 1 · reservar y pagar"), sync("c", "nav", "elige asientos y pulsa Pagar")],
    [
      sync("nav", "srv", "POST /compras (funcionId, asientos)"),
      sync("srv", "repo", "bloquear(asientos, 10 min)"),
      ret("repo", "srv", "bloqueados o no"),
    ],
    [
      alt("algún asiento ocupado"),
      ret("srv", "nav", "409 (asientos ocupados)"),
      ret("nav", "c", "pide elegir otros asientos"),
    ],
    [
      els("todos libres"),
      sync("srv", "pas", "crearSesion(compraId, monto, secreto)"),
      ret("pas", "srv", "urlPago"),
    ],
    [
      ret("srv", "nav", "302 Location: urlPago"),
      sync("nav", "pas", "GET urlPago"),
      ret("pas", "nav", "formulario de pago"),
    ],
    [
      sync("c", "nav", "ingresa la tarjeta"),
      sync("nav", "pas", "POST /pagar (tarjeta)"),
      ret("pas", "nav", "pago en proceso"),
      ret("nav", "c", "muestra «procesando»"),
      end,
    ],
    [
      stage("Etapa 2 · confirmar la compra"),
      sync("pas", "srv", "POST /webhooks/pago (compraId, resultado, firma)"),
      self("srv", "verificarFirma(firma)"),
    ],
    [
      alt("pago aprobado"),
      sync("srv", "repo", "confirmar(asientos)"),
      self("srv", "generarBoletos(QR)"),
    ],
    [
      async_("srv", "broker", "publicar(CompraConfirmada)"),
      ret("srv", "pas", "200"),
      async_("broker", "correo", "entregar(CompraConfirmada)"),
      async_("correo", "c", "correo con los boletos"),
    ],
    [els("pago rechazado"), sync("srv", "repo", "liberar(asientos)"), ret("srv", "pas", "200")],
    [end],
  ],
);

export const clase11: Lesson = {
  slug: "clase-11-repaso-parcial-2",
  module: "Secuencias de diseño",
  track: "principal",
  label: "Clase 11",
  title: "Repaso: comprar boletos de cine",
  summary:
    "El ejercicio guiado del repaso: dos párrafos de requerimientos convertidos en una secuencia con redirección, webhook y eventos.",
  minutes: 14,
  goals: [
    "Traducir un enunciado a participantes, mensajes y fragmentos",
    "Dibujar una redirección como 302 y una petición nueva del navegador",
    "Dibujar un webhook como petición que inicia el sistema externo",
    "Decidir en qué momento la orden queda pagada",
  ],
  steps: [
    {
      title: "Del texto a los participantes",
      kind: "tecnica",
      body: [
        "El parcial da dos párrafos y pide el diagrama. Primero se marca el texto: cada persona es un actor, y cada sistema que no construimos es un «sistema externo», con fondo gris.",
        "En un sistema distribuido el navegador es un participante aparte: lo necesitaremos para dibujar la redirección.",
      ],
      note: "Primero participantes y camino feliz. Las excepciones, al final.",
      scene: d.at(0),
    },
    {
      title: "Etapa 1: el cliente inicia",
      kind: "tecnica",
      body: [
        "El enunciado tiene dos párrafos, así que el diagrama tiene dos etapas. Una línea las separa.",
        "La primera empieza cuando el cliente elige sus asientos y pulsa Pagar.",
      ],
      changes: ["+ Etapa 1", "+ elige asientos y pulsa Pagar"],
      scene: d.at(1),
    },
    {
      title: "Bloquear los asientos",
      kind: "tecnica",
      body: [
        "El servidor intenta bloquear los asientos durante 10 minutos, para que nadie más los compre mientras se paga.",
        "El dato del enunciado viaja como parámetro. Si el texto dice «10 minutos», el mensaje lo lleva.",
      ],
      changes: ["+ POST /compras", "+ bloquear(asientos, 10 min)"],
      scene: d.at(2),
    },
    {
      title: "alt: algún asiento ocupado",
      kind: "problema",
      body: [
        "«Si alguno ya está ocupado…» es un «si no» del texto: se dibuja como alt, con su guarda.",
        "La rama termina en el cliente, que debe elegir otros asientos.",
      ],
      changes: ["+ alt [algún asiento ocupado]", "+ 409"],
      scene: d.at(3),
    },
    {
      title: "Crear la sesión de pago",
      kind: "tecnica",
      body: [
        "Con los asientos bloqueados, el servidor le pide a la pasarela una sesión de pago y recibe la dirección donde el cliente pagará.",
        "El secreto de la tienda viaja aquí, de servidor a servidor. Nunca pasa por el navegador.",
      ],
      changes: ["+ else [todos libres]", "+ crearSesion(compraId, monto, secreto)"],
      scene: d.at(4),
    },
    {
      title: "La redirección",
      kind: "tecnica",
      body: [
        "«Redirige al cliente a la pasarela» no es una flecha del servidor a la pasarela. El servidor responde 302 al navegador, y el navegador hace una petición nueva.",
        "Es el error que más resta en esta parte: una flecha directa entre servidores donde hay una redirección.",
      ],
      changes: ["+ 302 Location: urlPago", "+ GET urlPago, desde el navegador"],
      scene: d.at(5),
    },
    {
      title: "La tienda nunca ve la tarjeta",
      kind: "tecnica",
      body: [
        "El cliente escribe su tarjeta en la página de la pasarela. Esos datos van del navegador a la pasarela, sin tocar nuestro servidor.",
        "La primera etapa termina con el cliente viendo que el pago está en proceso. Todavía no hay boletos.",
      ],
      changes: ["+ POST /pagar (tarjeta), a la pasarela"],
      scene: d.at(6),
    },
    {
      title: "Etapa 2: el webhook",
      kind: "tecnica",
      body: [
        "«Más tarde, la pasarela notifica el resultado» es un webhook: una petición nueva que inicia el sistema externo hacia nuestro servidor.",
        "Viene firmada, y el servidor verifica la firma antes de creerle. Solo aquí se sabe si el pago pasó; por eso la página de confirmación no marca la compra como pagada.",
      ],
      changes: ["+ Etapa 2", "+ POST /webhooks/pago", "+ verificarFirma(firma)"],
      scene: d.at(7),
    },
    {
      title: "alt: pago aprobado",
      kind: "solucion",
      body: [
        "Si el pago fue aprobado, el servidor confirma los asientos y genera los boletos con su código QR.",
        "Este es el único punto del diagrama en el que la compra queda pagada.",
      ],
      changes: ["+ alt [pago aprobado]", "+ confirmar(asientos)", "+ generarBoletos(QR)"],
      scene: d.at(8),
    },
    {
      title: "Publicar y responder",
      kind: "tecnica",
      body: [
        "«Sin esperar» en el texto es un asíncrono: el servidor publica CompraConfirmada y responde 200 a la pasarela de inmediato.",
        "El servicio de correo consume el evento después y le envía los boletos al cliente. Ninguno de esos mensajes tiene retorno.",
      ],
      changes: ["+ publicar(CompraConfirmada)", "+ 200", "+ correo con los boletos"],
      scene: d.at(9),
    },
    {
      title: "else: pago rechazado",
      kind: "problema",
      body: [
        "La otra rama del alt: si el pago fue rechazado, se liberan los asientos para que otro pueda comprarlos.",
        "La pasarela recibe su 200 igual: el webhook se atendió, aunque el resultado fuera malo.",
      ],
      changes: ["+ else [pago rechazado]", "+ liberar(asientos)"],
      scene: d.at(10),
    },
    {
      title: "Lista de revisión",
      kind: "resumen",
      body: [
        "Antes de entregar, repasa con la lista de errores: cada «si no» tiene su alt con guarda, cada «sin esperar» es asíncrono y sin retorno, las redirecciones pasan por el navegador y los secretos no.",
        "Y en cada rama, alguien le responde a quien inició la petición. Deja unos minutos del examen para esta revisión.",
      ],
      scene: d.at(11),
    },
  ],
};
