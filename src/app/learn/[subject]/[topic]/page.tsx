import { notFound } from 'next/navigation';
import { getLesson, getAllLessons } from '@/lib/content/catalog';
import LessonContent from '@/components/LessonContent';

export async function generateStaticParams() {
  return getAllLessons()
    .filter(l => !l.comingSoon)
    .map(l => ({
      subject: l.subject,
      topic: l.id,
    }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subject: string; topic: string }>;
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
  params: Promise<{ subject: string; topic: string }>;
}) {
  const { subject, topic } = await params;
  const lesson = getLesson(subject, topic);

  if (!lesson || lesson.comingSoon) {
    notFound();
  }

  return <LessonContent lesson={lesson} />;
}
