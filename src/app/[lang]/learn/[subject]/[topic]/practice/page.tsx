import { notFound } from 'next/navigation';
import { getLesson, getAllLessons } from '@/lib/content/catalog';
import PracticePageClient from '@/components/PracticePageClient';

export async function generateStaticParams() {
  return getAllLessons()
    .filter(l => !l.comingSoon && l.practiceModule)
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
  if (!lesson || !lesson.practiceModule) return { title: 'Not Found — Solvio' };
  return {
    title: `Practice: ${lesson.title} — Solvio`,
    description: `Interactive practice problems for ${lesson.title}`,
  };
}

export default async function PracticePage({
  params,
}: {
  params: Promise<{ subject: string; topic: string }>;
}) {
  const { subject, topic } = await params;
  const lesson = getLesson(subject, topic);

  if (!lesson || lesson.comingSoon || !lesson.practiceModule) {
    notFound();
  }

  return (
    <PracticePageClient
      lessonTitle={lesson.title}
      lessonId={lesson.id}
      subject={subject}
      practiceModule={lesson.practiceModule!}
    />
  );
}
