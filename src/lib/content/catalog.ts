import { loadAllLessons } from './loader';
import { Lesson } from './types';

export type { Lesson, Concept, Example } from './types';

export function getLesson(subject: string, id: string): Lesson | undefined {
  return loadAllLessons().find(l => l.subject === subject && l.id === id);
}

export function getLessonsBySubject(subject: string): Lesson[] {
  return loadAllLessons().filter(l => l.subject === subject);
}

export function getAllSubjects(): { id: string; title: string; order: number }[] {
  const subjects = new Map<string, { id: string; title: string; order: number }>();
  for (const lesson of loadAllLessons()) {
    if (!subjects.has(lesson.subject)) {
      subjects.set(lesson.subject, {
        id: lesson.subject,
        title: lesson.subjectTitle,
        order: lesson.order,
      });
    }
  }
  return Array.from(subjects.values()).sort((a, b) => a.order - b.order);
}

export function getAllLessons(): Lesson[] {
  return loadAllLessons();
}
