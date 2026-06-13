import { getAllSubjects, getLessonsBySubject } from '@/lib/content/catalog';
import TOCClient from '@/components/TOCClient';

export default function Home() {
  const subjects = getAllSubjects();
  const lessonsBySubject: Record<string, import('@/lib/content').Lesson[]> = {};

  for (const subject of subjects) {
    lessonsBySubject[subject.id] = getLessonsBySubject(subject.id);
  }

  return <TOCClient subjects={subjects} lessonsBySubject={lessonsBySubject} />;
}
