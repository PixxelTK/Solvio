import { getAllSubjects, getLessonsBySubject } from '@/lib/content/catalog';
import TOCClient from '@/components/TOCClient';

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const subjects = getAllSubjects(lang);
  const lessonsBySubject: Record<string, import('@/lib/content').Lesson[]> = {};

  for (const subject of subjects) {
    lessonsBySubject[subject.id] = getLessonsBySubject(subject.id, lang);
  }

  return <TOCClient subjects={subjects} lessonsBySubject={lessonsBySubject} />;
}
