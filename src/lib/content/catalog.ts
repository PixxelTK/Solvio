import { loadAllLessons } from './loader';
import { Lesson } from './types';
import { subjectsRegistry } from './registry';

export type { Lesson, Concept, Example, Subject } from './types';

export function getLesson(subject: string, id: string, lang: string = 'en'): Lesson | undefined {
  const lessons = loadAllLessons();
  const lesson = lessons.find(l => l.subject === subject && l.id === id && l.lang === lang);
  if (lesson) return lesson;
  return lessons.find(l => l.subject === subject && l.id === id && l.lang === 'en');
}

export function getLessonsBySubject(subject: string, lang: string = 'en'): Lesson[] {
  const lessons = loadAllLessons().filter(l => l.subject === subject);
  const result = new Map<string, Lesson>();
  
  // First load 'en' lessons
  lessons.filter(l => l.lang === 'en').forEach(l => result.set(l.id, l));
  
  // Then overwrite with requested lang if available
  if (lang !== 'en') {
    lessons.filter(l => l.lang === lang).forEach(l => result.set(l.id, l));
  }
  
  return Array.from(result.values()).sort((a, b) => a.order - b.order);
}

export function getAllSubjects(lang: string = 'en'): { id: string; title: string; order: number }[] {
  return subjectsRegistry.map(subject => ({
    id: subject.id,
    order: subject.order,
    title: subject.title[lang] || subject.title['en'] || subject.id,
  })).sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return a.id.localeCompare(b.id);
  });
}

export function getAllLessons(): Lesson[] {
  return loadAllLessons();
}

export function getAllLessonsWithFallback(lang: string = 'en'): Lesson[] {
  const lessons = loadAllLessons();
  const result = new Map<string, Lesson>();
  
  lessons.filter(l => l.lang === 'en').forEach(l => result.set(`${l.subject}/${l.id}`, l));
  if (lang !== 'en') {
    lessons.filter(l => l.lang === lang).forEach(l => result.set(`${l.subject}/${l.id}`, l));
  }
  
  return Array.from(result.values());
}
