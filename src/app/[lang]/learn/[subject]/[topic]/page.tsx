import { notFound } from 'next/navigation';
import { getLesson, getAllLessons } from '@/lib/content/catalog';
import LessonContent from '@/components/LessonContent';

export async function generateStaticParams() {
  const paths: { lang: string; subject: string; topic: string }[] = [];
  const lessons = getAllLessons().filter(l => !l.comingSoon);
  for (const lang of ['en', 'th']) {
    for (const l of lessons) {
      paths.push({
        lang,
        subject: l.subject,
        topic: l.id,
      });
    }
  }
  return paths;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; subject: string; topic: string }>;
}) {
  const { subject, topic } = await params;
  const lesson = getLesson(subject, topic);
  if (!lesson) return { title: 'Not Found — Solvio' };
  return {
    title: `${lesson.title} — Solvio`,
    description: lesson.description,
  };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ lang: string; subject: string; topic: string }>;
}) {
  const { subject, topic } = await params;
  const lesson = getLesson(subject, topic);

  if (!lesson || lesson.comingSoon) {
    notFound();
  }

  return <LessonContent lesson={lesson} />;
}

