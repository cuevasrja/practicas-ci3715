# Arquitectura

El proyecto sigue una arquitectura hexagonal (puertos y adaptadores) organizada
por módulos. La regla que lo sostiene todo: **las dependencias solo apuntan
hacia dentro**.

```
  src/app, src/ui          adaptadores primarios (Next.js, React)
        │
        ▼
  infrastructure/          adaptadores secundarios + container (composición)
        │
        ▼
  application/             casos de uso y puertos primarios
        │
        ▼
  domain/                  modelo y reglas puras, puertos secundarios
```

Biome hace cumplir estas fronteras (los `overrides` de `biome.jsonc`). Si `bun run lint`
se queja de un import restringido, el import está en la capa equivocada: no
desactives la regla.

## Módulos

### `src/modules/diagram` — el motor de diagramas animados

Sabe representar y animar una escena. No sabe nada de lecciones. Hay dos tipos
de escena: la isométrica (nodos, enlaces y tráfico) y el diagrama de secuencia
(participantes y mensajes de arriba abajo).

| Capa           | Archivo                                  | Qué contiene                                                                                                       |
| -------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| domain         | `scene.ts`                               | Modelo de escena: `Entity`, `Link`, `Flow`, `Scene`                                                                |
| domain         | `sequence.ts`, `sequence-layout.ts`      | Modelo del diagrama de secuencia y su geometría: columnas, filas, fragmentos, barras de activación y rama atenuada |
| domain         | `scene-validation.ts`                    | `validateScene()`: coherencia de una escena de cualquier tipo                                                      |
| domain         | `iso.ts`                                 | Proyección isométrica 2:1 y geometría de enlaces                                                                   |
| domain         | `diff.ts`                                | Comparación de dos escenas: qué entra, sale, se mueve o cambia                                                     |
| domain         | `tween.ts`, `easing.ts`                  | Planificador de tweens independiente del reloj                                                                     |
| domain         | `packets.ts`                             | Simulación del avance de un paquete por una ruta                                                                   |
| application    | `scene-player.ts`                        | Puerto primario `ScenePlayer`                                                                                      |
| infrastructure | `svg/svg-scene-player.ts`                | Adaptador que implementa `ScenePlayer` sobre SVG                                                                   |
| infrastructure | `svg/svg-sequence-player.ts`             | Adaptador que implementa `ScenePlayer` para diagramas de secuencia                                                 |
| infrastructure | `svg/switching-scene-player.ts`          | Elige el adaptador según el tipo de escena                                                                         |
| infrastructure | `svg/render.ts`, `camera.ts`, `icons.ts` | Dibujo de nodos, cámara, iconos                                                                                    |
| infrastructure | `container.ts`                           | `createScenePlayer()`: elige el adaptador                                                                          |

Todo el dominio es matemática pura y se prueba sin navegador. El adaptador SVG
es el único sitio donde se toca el DOM y `requestAnimationFrame`.

### `src/modules/course` — el temario y el progreso

| Capa           | Archivo                                | Qué contiene                                                |
| -------------- | -------------------------------------- | ----------------------------------------------------------- |
| domain         | `lesson.ts`                            | Modelo `Lesson`, `Step`, `Metric`                           |
| domain         | `lesson-validation.ts`                 | `validateLesson()`: coherencia de una lección               |
| domain         | `progress.ts`                          | Reglas del progreso (nunca retrocede, porcentaje, reanudar) |
| domain         | `lesson-repository.ts`                 | Puerto secundario `LessonRepository`                        |
| domain         | `progress-repository.ts`               | Puerto secundario `ProgressRepository`                      |
| application    | `list-lessons.ts`, `get-lesson.ts`     | Casos de uso de lectura                                     |
| application    | `group-by-module.ts`                   | Agrupa el temario por módulo                                |
| application    | `record-progress.ts`                   | Caso de uso de escritura                                    |
| application    | `lesson-summary.ts`                    | DTO `LessonSummary`                                         |
| infrastructure | `content/*.ts`                         | Las lecciones, como datos                                   |
| infrastructure | `static-lesson-repository.ts`          | Adaptador de `LessonRepository`                             |
| infrastructure | `local-storage-progress-repository.ts` | Adaptador de `ProgressRepository`                           |
| infrastructure | `container.ts`                         | Composición del lado servidor                               |
| infrastructure | `progress-container.ts`                | Composición del lado cliente                                |

Cada lección pertenece a un recorrido (`track`): `principal` para las clases
de CI-3715, en orden; `catalogo` para la referencia de estilos y patrones; y
`extra` para el material complementario. «Siguiente
lección» no cruza de un recorrido al otro.

`course` depende del dominio de `diagram` (un paso contiene una `Scene`).
Nunca al revés.

### `src/ui` y `src/app` — adaptadores primarios

- `src/app`: rutas de Next. Los Server Components llaman a `courseContainer`
  y pasan los datos como props.
- `src/ui/components`: componentes React. `StageView` es el puente entre React
  y `ScenePlayer`.
- `src/ui/hooks`: estado de navegador (`?paso=N`, movimiento reducido,
  progreso reactivo).

La interfaz entra a cada módulo por su `container`. Puede importar tipos del
dominio y de la aplicación, pero no los detalles de un adaptador
(`infrastructure/svg`, `infrastructure/content`).

## Qué puede importar cada capa

| Desde ↓ / Hacia → | domain                       | application | infrastructure   | ui / app | React, Next, DOM |
| ----------------- | ---------------------------- | ----------- | ---------------- | -------- | ---------------- |
| domain            | sí                           | no          | no               | no       | no               |
| application       | sí                           | sí          | no               | no       | no               |
| infrastructure    | sí                           | sí          | sí               | no       | sí               |
| ui / app          | sí (tipos y funciones puras) | sí          | solo `container` | sí       | sí               |

## Recorrido de una petición

Abrir `/leccion/cache?paso=3`:

1. `src/app/leccion/[slug]/page.tsx` llama a `courseContainer.getLesson(slug)`.
2. El caso de uso `getLesson` pide las lecciones al puerto `LessonRepository`.
3. `StaticLessonRepository` las devuelve desde `content/`.
4. La página pasa `lesson`, `lessons` y `next` a `LessonPlayer` (cliente).
5. `LessonPlayer` lee el paso de la URL y entrega `step.scene` a `StageView`.
6. `StageView` crea un `ScenePlayer` con `createScenePlayer()` y llama a
   `goTo(scene)`.
7. `SvgScenePlayer` usa `diffScenes` del dominio para decidir la transición y
   la anima.
8. `LessonPlayer` llama a `progressContainer.recordProgress(slug, paso)`, que
   guarda a través de `ProgressRepository`.

## Cómo extender

| Quiero…                                       | Toco…                                                                                                           |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Añadir una lección                            | `course/infrastructure/content/` (ver `docs/LECCIONES.md`)                                                      |
| Servir lecciones desde un CMS o una API       | Un adaptador nuevo de `LessonRepository` y una línea en `course/infrastructure/container.ts`                    |
| Guardar el progreso en servidor               | Un adaptador nuevo de `ProgressRepository` y `progress-container.ts`                                            |
| Dibujar con Canvas o WebGL                    | Un adaptador nuevo de `ScenePlayer` y `diagram/infrastructure/container.ts`                                     |
| Un tipo de nodo nuevo                         | `diagram/domain/scene.ts` (tipo) y `diagram/infrastructure/svg/render.ts` (dibujo)                              |
| Un tipo de paquete nuevo                      | `scene.ts`, la velocidad en `svg-scene-player.ts`, el color en `globals.css`, la etiqueta en `LessonPlayer.tsx` |
| Un elemento nuevo de la notación de secuencia | `diagram/domain/sequence.ts` (tipo), `sequence-layout.ts` (geometría) y `svg/svg-sequence-player.ts` (dibujo)   |
| Una regla de negocio nueva                    | `domain/` del módulo, con su prueba                                                                             |

## Pruebas

- `src/modules/diagram/domain/diagram.test.ts`: proyección, tweens, diff y
  paquetes.
- `src/modules/course/course.test.ts`: progreso, validación, casos de uso
  (con repositorios en memoria) y validez de todo el contenido publicado.

El adaptador SVG y la interfaz no tienen pruebas automáticas: se comprueban en
el navegador.
