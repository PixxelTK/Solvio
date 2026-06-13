import { notFound } from 'next/navigation';
import { getLesson, getAllLessons } from '@/lib/content/catalog';
import GameDifficultyPage from '@/components/GameDifficultyPage';

const validDifficulties = ['beginner', 'easy', 'intermediate', 'advanced', 'random'] as const;

export async function generateStaticParams() {
  const lessons = getAllLessons().filter(l => !l.comingSoon && l.practiceModule);
  const params: { subject: string; topic: string; difficulty: string }[] = [];
  for (const lesson of lessons) {
    for (const difficulty of validDifficulties) {
      params.push({ subject: lesson.subject, topic: lesson.id, difficulty });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subject: string; topic: string; difficulty: string }>;
}) {
  const { subject, topic, difficulty } = await params;
  const lesson = getLesson(subject, topic);
  if (!lesson || !lesson.practiceModule) return { title: 'Not Found — Solvio' };
  const label = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  return {
    title: `Practice: ${lesson.title} (${label}) — Solvio`,
    description: `Interactive ${difficulty} practice problems for ${lesson.title}`,
  };
}

export default async function DifficultyPage({
  params,
}: {
  params: Promise<{ subject: string; topic: string; difficulty: string }>;
}) {
  const { subject, topic, difficulty } = await params;
  const lesson = getLesson(subject, topic);

  if (!lesson || lesson.comingSoon || !lesson.practiceModule || !validDifficulties.includes(difficulty as typeof validDifficulties[number])) {
    notFound();
  }

  return (
    <GameDifficultyPage
      lessonId={lesson.id}
      practiceModuleId={lesson.practiceModule}
      subject={subject}
      difficulty={difficulty}
    />
  );
}
