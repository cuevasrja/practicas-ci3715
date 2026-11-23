import { courseContainer } from "@/modules/course/infrastructure/container";
import { LessonList } from "@/ui/components/LessonList";
import { SiteHeader } from "@/ui/components/SiteHeader";

export default async function Home() {
  const lessons = await courseContainer.listLessons();
  const modules = [...new Set(lessons.map((l) => l.module))];
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12 sm:py-16">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Diseño de sistemas, paso a paso
        </p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl">
          Mira cómo se mueven las peticiones por un sistema.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-2">
          Cada lección es un diagrama que cambia delante de ti: aparecen servidores, se trazan
          conexiones y el tráfico empieza a circular mientras lees qué está pasando.
        </p>

        {modules.map((name, i) => (
          <section key={name}>
            <h2 className="mt-12 mb-4 text-[11px] font-semibold uppercase tracking-wider text-muted">
              Módulo {i + 1} · {name}
            </h2>
            <LessonList lessons={lessons.filter((l) => l.module === name)} />
          </section>
        ))}

        <p className="mt-10 text-sm text-muted">
          En una lección: ← → cambia de paso · R repite la animación · Espacio pausa el tráfico · 0
          reencuadra.
        </p>
      </main>
    </>
  );
}
