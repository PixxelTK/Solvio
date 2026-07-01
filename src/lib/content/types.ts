import type { PracticeModuleId } from '@/lib/practice/types';

export interface Topic {
  title: string;
  description: string;
  body?: string;
}

export interface Concept {
  title: string;
  body: string;
}

export interface Example {
  title: string;
  problem: string;
  solution: string;
  steps: string[];
}

export interface Lesson {
  id: string;
  lang: string;
  title: string;
  subject: string;
  subjectTitle: string;
  description: string;
  order: number;
  topics: Topic[];
  concepts: Concept[];
  examples: Example[];
  practiceModule?: PracticeModuleId;
  relatedTopics: { title: string; path: string }[];
  comingSoon: boolean;
}
export interface Subject {
  id: string;
  order: number;
  title: Record<string, string>;
}
