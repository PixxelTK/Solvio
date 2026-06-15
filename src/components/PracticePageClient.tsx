'use client';

import { useRouter } from 'next/navigation';
import { Difficulty } from '@/lib/engine/types';
import type { PracticeModuleId } from '@/lib/practice/types';
import { getDifficultyDescriptions } from '@/lib/practice/registry';

const FALLBACK_DESCRIPTIONS: Record<Difficulty, string> = {
  random: 'Mixed difficulty problems',
  beginner: 'Fundamental problems to build confidence',
  easy: 'Slightly more challenging problems',
  intermediate: 'Problems requiring multiple steps',
  advanced: 'Complex problems for mastery',
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  random: 'Random',
  beginner: 'Beginner',
  easy: 'Easy',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

interface PracticePageClientProps {
  lessonTitle: string;
  lessonId: string;
  subject: string;
  practiceModule: PracticeModuleId;
}

export default function PracticePageClient({ lessonTitle, lessonId, subject, practiceModule }: PracticePageClientProps) {
  const router = useRouter();

  const descriptions = getDifficultyDescriptions(practiceModule) ?? FALLBACK_DESCRIPTIONS;

  const handleSelect = (difficulty: Difficulty) => {
    router.push(`/learn/${subject}/${lessonId}/practice/${difficulty}`);
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-1">{lessonTitle}</h1>
          <p className="text-slate-500 dark:text-slate-400">Select difficulty level</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => handleSelect(d)}
              className="p-6 rounded-2xl cursor-pointer bg-slate-100 dark:bg-slate-900 text-left transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-500/5 focus:outline-none group"
            >
              <div className="text-lg font-bold mb-1">{DIFFICULTY_LABELS[d]}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{descriptions[d]}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
