import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { Lesson, Topic } from './types';
import { isValidPracticeModuleId } from '@/lib/practice/types';

const CONTENT_ROOT = path.join(process.cwd(), 'content');

interface RawLesson {
  title?: string;
  subject?: string;
  subjectTitle?: string;
  description?: string;
  order?: number;
  topics?: Topic[];
  practiceModule?: string | null;
  comingSoon?: boolean;
  relatedTopics?: { title: string; path: string }[];
  concepts?: { title: string; body: string }[];
  examples?: {
    title: string;
    problem: string;
    solution: string;
    steps: string[];
  }[];
}

let cached: Lesson[] | null = null;

export function loadAllLessons(): Lesson[] {
  if (cached) return cached;

  const lessons: Lesson[] = [];

  if (!fs.existsSync(CONTENT_ROOT)) {
    cached = [];
    return cached;
  }

  const subjects = fs.readdirSync(CONTENT_ROOT);

  for (const subject of subjects) {
    const subjectDir = path.join(CONTENT_ROOT, subject);
    if (!fs.statSync(subjectDir).isDirectory()) continue;

    const locales = fs.readdirSync(subjectDir);
    for (const locale of locales) {
      const localeDir = path.join(subjectDir, locale);
      if (!fs.statSync(localeDir).isDirectory()) continue;

      const lessonDirs = fs.readdirSync(localeDir);
      for (const lessonDir of lessonDirs) {
        const lessonPath = path.join(localeDir, lessonDir, 'lesson.yaml');
        if (!fs.existsSync(lessonPath)) continue;

        try {
          const raw = fs.readFileSync(lessonPath, 'utf-8');
          const fm = yaml.load(raw) as RawLesson;

          if (!fm.title || !fm.subject) continue;

          const practiceModule = fm.practiceModule
            ? (isValidPracticeModuleId(fm.practiceModule) ? fm.practiceModule : undefined)
            : undefined;

          if (fm.practiceModule && !practiceModule) {
            console.warn(`[content] Unknown practiceModule "${fm.practiceModule}" in ${lessonPath.replace('/lesson.yaml', '')}`);
          }

          const lesson: Lesson = {
            id: lessonDir,
            title: fm.title,
            subject: fm.subject,
            subjectTitle: fm.subjectTitle || fm.subject,
            description: fm.description || '',
            order: fm.order ?? 99,
            topics: (fm.topics || []).map(t => ({ title: t.title, description: t.description, body: t.body })),
            concepts: (fm.concepts || []).map(c => ({ title: c.title, body: c.body })),
            examples: (fm.examples || []).map(e => ({
              title: e.title,
              problem: e.problem,
              solution: e.solution,
              steps: e.steps,
            })),
            practiceModule,
            relatedTopics: fm.relatedTopics || [],
            comingSoon: fm.comingSoon || false,
          };

          lessons.push(lesson);
        } catch (err) {
          console.error(`Error loading lesson ${lessonPath}:`, err);
        }
      }
    }
  }

  lessons.sort((a, b) => a.order - b.order);
  cached = lessons;
  return lessons;
}

export function clearCache(): void {
  cached = null;
}
