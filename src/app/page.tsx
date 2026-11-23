import { groupByModule } from "@/modules/course/application/group-by-module";
import { courseContainer } from "@/modules/course/infrastructure/container";
import { LessonList } from "@/ui/components/LessonList";
import { SiteHeader } from "@/ui/components/SiteHeader";

export default async function Home() {
  const lessons = await courseContainer.listLessons();
  const course = groupByModule(lessons.filter((l) => l.track === "principal"));
  const catalog = groupByModule(lessons.filter((l) => l.track === "catalogo"));
  const extras = groupByModule(lessons.filter((l) => l.track === "extra"));
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12 sm:py-16">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Universidad Simón Bolívar · Ingeniería de Software
        </p>
        <h1 className="mt-3 max-w-2xl font-display text-4xl font-bold leading-[1.1] text-ink sm:text-5xl">
          CI-3715, clase por clase y mensaje por mensaje.
        </h1>
        <p className="mt-4 max-w-xl text-xl leading-relaxed text-ink-2">
          Cada clase es un diagrama que avanza delante de ti: de SCRUM y los requerimientos al
          diagrama de secuencia de diseño, con Cuentas Claras como ejemplo.
        </p>

        {course.map(([module, group], i) => (
          <section key={module}>
            <h2 className="mt-12 mb-4 text-xs font-bold uppercase tracking-wider text-muted">
              Bloque {i + 1} · {module}
            </h2>
            <LessonList lessons={group} />
          </section>
        ))}

        {catalog.length > 0 ? (
          <div className="mt-16 border-t border-line pt-2">
            <h2 className="mt-8 font-display text-2xl font-bold text-ink">Catálogo</h2>
            <p className="mt-1 max-w-xl text-[15px] text-ink-2">
              Todos los estilos de arquitectura y patrones de diseño del curso, uno por uno: el
              problema que resuelven, cómo lo resuelven y dónde aparecen en Cuentas Claras.
            </p>
            {catalog.map(([module, group]) => (
              <section key={module}>
                <h3 className="mt-8 mb-4 text-xs font-bold uppercase tracking-wider text-muted">
                  {module}
                </h3>
                <LessonList lessons={group} />
              </section>
            ))}
          </div>
        ) : null}

        {extras.length > 0 ? (
          <div className="mt-16 border-t border-line pt-2">
            {extras.map(([module, group]) => (
              <section key={module}>
                <h2 className="mt-8 mb-1 text-xs font-bold uppercase tracking-wider text-muted">
                  Material extra · {module}
                </h2>
                <p className="mb-4 max-w-xl text-[15px] text-ink-2">
                  Fuera del programa: cómo se comportan en producción los sistemas que el curso
                  enseña a diseñar.
                </p>
                <LessonList lessons={group} />
              </section>
            ))}
          </div>
        ) : null}

        <p className="mt-10 text-[15px] text-muted">
          En una clase: ← → cambia de paso · R repite la animación · 0 reencuadra · rueda y arrastre
          para acercar y mover.
        </p>
      </main>
    </>
  );
}
