import { notFound } from 'next/navigation';
import { getLesson, getAllLessons } from '@/lib/content/catalog';
import GameDifficultyPage from '@/components/GameDifficultyPage';
import { getModuleDictionary } from '@/i18n/get-dictionary';
import { I18nProvider } from '@/i18n/I18nContext';

const validDifficulties = ['beginner', 'easy', 'intermediate', 'advanced', 'random'] as const;

export async function generateStaticParams() {
  const lessons = getAllLessons().filter(l => !l.comingSoon && l.practiceModule);
  const uniqueLessons = new Map();
  for (const l of lessons) {
    uniqueLessons.set(`${l.subject}/${l.id}`, l);
  }
  const params: { lang: string; subject: string; topic: string; difficulty: string }[] = [];
  for (const lang of ['en', 'th']) {
    for (const lesson of uniqueLessons.values()) {
      for (const difficulty of validDifficulties) {
        params.push({ lang, subject: lesson.subject, topic: lesson.id, difficulty });
      }
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; subject: string; topic: string; difficulty: string }>;
}) {
  const { lang, subject, topic, difficulty } = await params;
  const lesson = getLesson(subject, topic, lang);
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
  params: Promise<{ lang: string; subject: string; topic: string; difficulty: string }>;
}) {
  const { lang, subject, topic, difficulty } = await params;
  const lesson = getLesson(subject, topic, lang);

  if (!lesson || lesson.comingSoon || !lesson.practiceModule || !validDifficulties.includes(difficulty as typeof validDifficulties[number])) {
    notFound();
  }

  const moduleDict = await getModuleDictionary(lang, lesson.practiceModule);

  return (
    <I18nProvider locale={lang} messages={moduleDict}>
      <GameDifficultyPage
        lessonId={lesson.id}
        practiceModuleId={lesson.practiceModule}
        subject={subject}
        difficulty={difficulty}
      />
    </I18nProvider>
  );
}


