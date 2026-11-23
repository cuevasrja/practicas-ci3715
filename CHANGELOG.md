# Registro de cambios

Qué cambió en cada versión. El porqué de cada decisión de diseño está en
[`docs/DECISIONES.md`](docs/DECISIONES.md); las entradas de aquí enlazan a su
decisión con `(D-0XX)`.

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).
Las secciones son: Añadido, Cambiado, Corregido, Eliminado.

## [Sin publicar]

### Cambiado

- Biome sustituye a ESLint como linter y pasa a ser también el formateador.
  Las fronteras de la arquitectura se conservan como `overrides` en
  `biome.jsonc` (D-012).
- Todo el código se reformatea con Biome (ancho de 100, imports ordenados).

### Añadido

- Script `bun run format`.

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
