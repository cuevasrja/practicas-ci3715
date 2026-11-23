<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Sistemas animados

Curso interactivo de diseño de sistemas: lecciones por pasos con diagramas
isométricos animados. Next.js 16 (App Router, Cache Components), React 19,
TypeScript estricto, Tailwind v4, bun. Todo el contenido y la interfaz están
en español.

## Comandos

```
bun dev            # servidor de desarrollo (solo puede haber uno por carpeta)
bun run check      # typecheck + lint + pruebas; ejecútalo antes de dar algo por hecho
bun test           # pruebas del dominio y la aplicación
bun run lint       # Biome: lint, formato y fronteras de la arquitectura
bun run format     # aplica el formato y los arreglos seguros de Biome
bun run build      # compilación de producción
```

Usa siempre bun, nunca npm, pnpm ni yarn.

## Arquitectura

Hexagonal, por módulos. Lee `docs/ARQUITECTURA.md` antes de mover o crear
archivos.

```
src/modules/diagram/   motor de diagramas (no conoce las lecciones)
src/modules/course/    temario y progreso
  domain/              modelo y reglas puras; define los puertos secundarios
  application/         casos de uso, DTO y puertos primarios
  infrastructure/      adaptadores y container
src/ui/                componentes y hooks de React
src/app/               rutas de Next
```

Reglas, comprobadas por Biome (`biome.jsonc`):

- Las dependencias apuntan hacia dentro: `ui/app → infrastructure → application → domain`.
- `domain/` y `application/` son TypeScript puro: sin React, sin Next, sin
  `window`, `document` ni `localStorage`.
- La interfaz entra a un módulo por su `container`, no por los detalles de un
  adaptador (`infrastructure/svg`, `infrastructure/content`).
- `course` puede importar el dominio de `diagram`; `diagram` nunca importa
  `course`.
- Si el lint marca un import restringido, mueve el código a la capa correcta.
  No desactives la regla.
- Al crear un módulo nuevo, copia en `biome.jsonc` los tres bloques de
  `overrides` (domain, application, infrastructure) de un módulo existente.

## Dónde va cada cambio

| Tarea                                    | Lugar                                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------ |
| Lección nueva o editar una               | `src/modules/course/infrastructure/content/` — sigue `docs/LECCIONES.md` |
| Regla de negocio                         | `domain/` del módulo, con prueba                                         |
| Nueva operación para la interfaz         | Caso de uso en `application/`, expuesto en el `container`                |
| Otro origen de datos                     | Adaptador nuevo que implemente el puerto, cambiado en el `container`     |
| Aspecto de nodos, enlaces o paquetes     | `diagram/infrastructure/svg/render.ts` y `src/app/globals.css`           |
| Tiempos y comportamiento de la animación | `diagram/infrastructure/svg/svg-scene-player.ts`                         |
| Componentes y atajos de teclado          | `src/ui/components/`                                                     |

## Convenciones

- Colores solo mediante las variables CSS de `globals.css`; cada una tiene
  valor para tema claro y oscuro. No uses colores fijos en los componentes.
- El paso actual vive en la URL (`?paso=N`) mediante `use-url-step.ts`. No uses
  `useSearchParams`.
- En las rutas dinámicas, `params` se lee dentro de `<Suspense>` (lo exige
  Cache Components).
- El modelo de escena es serializable: sin funciones ni clases, porque viaja de
  un Server Component a uno de cliente.
- Toda animación respeta `prefers-reduced-motion`.
- El formato lo decide Biome: ejecuta `bun run format` en vez de ajustar
  espacios o el orden de los imports a mano.
- Un `biome-ignore` necesita siempre su motivo en la misma línea.
- Comentarios, nombres de lecciones y textos visibles en español; identificadores
  de código en inglés.
- El contenido de las lecciones es original. No copies textos ni diagramas de
  otros cursos.

## Verificación

- Dominio y aplicación: pruebas con `bun test`.
- Adaptador SVG e interfaz: no tienen pruebas automáticas. Ábrelos en el
  navegador y recorre los pasos afectados; di explícitamente si no lo hiciste.

## Registro de cambios y decisiones

Al terminar un cambio que el usuario notaría, añade una línea en
`CHANGELOG.md`, bajo `[Sin publicar]`.

Si tomaste una decisión de diseño (elegir entre alternativas, añadir una
dependencia, cambiar una frontera o una convención), añade una entrada en
`docs/DECISIONES.md` con la plantilla que hay al final del archivo y enlázala
desde el changelog. No reescribas decisiones antiguas: si una deja de valer,
márcala como «Sustituida por D-0XX» y escribe la nueva.
