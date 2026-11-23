import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { courseContainer } from "@/modules/course/infrastructure/container";
import { LessonPlayer } from "@/ui/components/LessonPlayer";
import { SiteHeader } from "@/ui/components/SiteHeader";

type Props = PageProps<"/leccion/[slug]">;

export async function generateStaticParams() {
  const lessons = await courseContainer.listLessons();
  return lessons.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  const view = await courseContainer.getLesson(slug);
  return view ? { title: view.lesson.title, description: view.lesson.summary } : {};
}

// El slug se lee dentro de <Suspense>: las lecciones conocidas se prerenderizan
// enteras y cualquier otra URL muestra el esqueleto mientras se resuelve.
export default function LessonPage(props: Props) {
  return (
    <div className="flex min-h-dvh flex-col lg:h-dvh">
      <Suspense fallback={<LessonSkeleton />}>
        <LessonContent params={props.params} />
      </Suspense>
    </div>
  );
}

async function LessonContent({ params }: { params: Props["params"] }) {
  const { slug } = await params;
  const view = await courseContainer.getLesson(slug);
  if (!view) notFound();
  const { lesson, lessons, next } = view;
  return (
    <>
      <SiteHeader crumb={lesson.title} />
      <h1 className="sr-only">{lesson.title}</h1>
      <LessonPlayer key={lesson.slug} lesson={lesson} lessons={lessons} next={next} />
    </>
  );
}

function LessonSkeleton() {
  return (
    <>
      <SiteHeader />
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[232px_minmax(0,1fr)_400px]">
        <div className="hidden border-r border-line bg-surface xl:block" />
        <div className="h-[52dvh] min-h-80 bg-stage lg:h-auto" />
        <div className="border-t border-line bg-surface lg:border-l lg:border-t-0" />
      </div>
    </>
  );
}
