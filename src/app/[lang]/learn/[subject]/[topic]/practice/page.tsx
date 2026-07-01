import { notFound } from 'next/navigation';
import { getLesson, getAllLessons } from '@/lib/content/catalog';
import PracticePageClient from '@/components/PracticePageClient';
import { getModuleDictionary } from '@/i18n/get-dictionary';
import { I18nProvider } from '@/i18n/I18nContext';

export async function generateStaticParams() {
  const paths: { lang: string; subject: string; topic: string }[] = [];
  const lessons = getAllLessons().filter(l => !l.comingSoon && l.practiceModule);
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
  if (!lesson || !lesson.practiceModule) return { title: 'Not Found — Solvio' };
  return {
    title: `Practice: ${lesson.title} — Solvio`,
    description: `Interactive practice problems for ${lesson.title}`,
  };
}

export default async function PracticePage({
  params,
}: {
  params: Promise<{ lang: string; subject: string; topic: string }>;
}) {
  const { lang, subject, topic } = await params;
  const lesson = getLesson(subject, topic, lang);

  if (!lesson || lesson.comingSoon || !lesson.practiceModule) {
    notFound();
  }

  const moduleDict = await getModuleDictionary(lang, lesson.practiceModule);

  return (
    <I18nProvider locale={lang} messages={moduleDict}>
      <PracticePageClient
        lessonTitle={lesson.title}
        lessonId={lesson.id}
        subject={subject}
        practiceModule={lesson.practiceModule!}
      />
    </I18nProvider>
  );
}


