import { notFound } from 'next/navigation';
import { getLesson, getAllLessons } from '@/lib/content/catalog';
import LessonContent from '@/components/LessonContent';

export async function generateStaticParams() {
  const paths: { lang: string; subject: string; topic: string }[] = [];
  const lessons = getAllLessons().filter(l => !l.comingSoon);
  const uniqueLessons = new Map();
  for (const l of lessons) {
    uniqueLessons.set(`${l.subject}/${l.id}`, l);
  }
  for (const lang of ['en', 'th']) {
    for (const l of uniqueLessons.values()) {
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
  const { lang, subject, topic } = await params;
  const lesson = getLesson(subject, topic, lang);
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
  const { lang, subject, topic } = await params;
  const lesson = getLesson(subject, topic, lang);

  if (!lesson || lesson.comingSoon) {
    notFound();
  }

  return <LessonContent lesson={lesson} />;
}

