# Registro de cambios

Qué cambió en cada versión. El porqué de cada decisión de diseño está en
[`docs/DECISIONES.md`](docs/DECISIONES.md); las entradas de aquí enlazan a su
decisión con `(D-0XX)`.

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
Las secciones son: Añadido, Cambiado, Corregido, Eliminado.

## [Sin publicar]

### Añadido

- Catálogo de estilos de arquitectura y patrones de diseño, en seis lecciones
  aparte del flujo principal (D-016):
  - Estilos clásicos: cliente-servidor, par a par, capas cerradas y abiertas,
    tres niveles, repositorio, tuberías y filtros, MVC, MVP y MVVM.
  - Estilos distribuidos: monolito modular, SOA con bus de servicios,
    microservicios, dirigido por eventos, CQRS y hexagonal.
  - Patrones creacionales: Factory Method, Abstract Factory, Builder, Object
    Pool, Prototype y Singleton.
  - Patrones estructurales: Adapter, Bridge, Composite, Facade, Decorator,
    Flyweight y Proxy.
  - Patrones de comportamiento: Command, Chain of Responsibility, Iterator,
    Mediator, Memento, Observer, State, Strategy, Template Method, Visitor e
    Interpreter.
- Atajos para escribir escenas isométricas y fichas de problema y solución
  (`content/iso-helpers.ts`).

### Corregido

- Textos que se pisaban en los diagramas: los paneles de resumen se ensanchan
  según su contenido y las etiquetas de los enlaces buscan un sitio libre, sin
  tapar nombres de nodos ni quedar atravesadas por su propia línea.
- El encuadre reserva espacio para los contadores, las herramientas y la
  leyenda, y tiene en cuenta las etiquetas superiores de los nodos.
- En pantallas estrechas los contadores se quedan en una sola fila.

### Cambiado

- Las lecciones tienen un tercer recorrido, `catalogo`, que la portada muestra
  entre las clases y el material extra.

## [0.3.0] - 2026-11-23

### Añadido

- Las 11 clases de CI-3715 como flujo principal, una lección por clase, en
  tres bloques: proceso y análisis (1 a 3), diseño (4 a 7) y secuencias de
  diseño (8 a 11) (D-015).
- Diagramas de secuencia animados: actores, líneas de vida, mensajes
  síncronos, asíncronos y de retorno, creación de objetos, mensajes a sí
  mismo, fragmentos (`alt`, `opt`, `loop`, `break`, `par`) y etapas. La rama
  de un `alt` que no se recorre se atenúa (D-013).
- Atajos para escribir diagramas de secuencia por tramos
  (`content/sequence-helpers.ts`).
- `docs/CONTEXTO-CURSO.md`: el contexto del curso como referencia.
- Script `bun run format`.

### Cambiado

- Las tres lecciones anteriores pasan a ser material extra (D-015).
- La paleta y la tipografía son las de las láminas del curso, en todo el
  sitio (D-014).
- El sitio se presenta como material de CI-3715: portada, título y cabecera.
- La barra lateral muestra el temario completo agrupado por bloque.
- El encuadre de las escenas isométricas incluye las esquinas de los enlaces.
- Biome sustituye a ESLint como linter y pasa a ser también el formateador.
  Las fronteras de la arquitectura se conservan como `overrides` en
  `biome.jsonc` (D-012).

### Eliminado

- `eslint`, `eslint-config-next` y `eslint.config.mjs`.

## [0.2.0] - 2026-11-23

### Cambiado

- El código se reorganiza en una arquitectura hexagonal con dos módulos,
  `diagram` y `course`, más `ui` y `app` como adaptadores primarios (D-008,
  D-010).
- El motor de animación queda detrás del puerto `ScenePlayer`; la interfaz ya
  no conoce la clase que dibuja en SVG (D-008).
- Las lecciones se leen a través del puerto `LessonRepository` y el progreso a
  través de `ProgressRepository` (D-009).
- Cada lección declara el módulo del temario al que pertenece; la portada
  agrupa por módulo.

### Añadido

- Reglas de ESLint que impiden imports contra el sentido de las capas (D-008).
- Validación de lecciones en el dominio: el repositorio rechaza contenido con
  enlaces o flujos rotos al arrancar.
- Pruebas de progreso, validación y casos de uso.
- Scripts `bun run check`, `typecheck` y `test`.
- Documentación: `AGENTS.md`, `CLAUDE.md`, `docs/ARQUITECTURA.md`,
  `docs/LECCIONES.md`, `docs/DECISIONES.md` y este archivo.

### Corregido

- Next avisaba de que `params` se leía fuera de `<Suspense>` en
  `/leccion/[slug]` (D-007).

## [0.1.0] - 2026-11-23

### Añadido

- Motor propio de diagramas isométricos animados sobre SVG: transiciones entre
  escenas, paquetes que recorren los enlaces, cámara con zoom y arrastre
  (D-001, D-002).
- Tres lecciones originales: «El ciclo de una petición», «Balanceo de carga» y
  «Caché» (D-003).
- Reproductor de lección con panel de explicación, contadores animados, tira
  de pasos y atajos de teclado (`←` `→` `R` `Espacio` `0`).
- Paso actual en la URL (`?paso=N`) (D-004).
- Progreso guardado en el navegador (D-005).
- Tema claro y oscuro con identidad visual propia (D-006).
- Soporte de `prefers-reduced-motion`.
