'use client';

import { useRouter } from 'next/navigation';
import { Difficulty } from '@/lib/engine/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleLeft } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';

const difficulties: { value: Difficulty; label: string; description: string }[] = [
  { value: 'random', label: 'Random', description: 'Mixed difficulty problems' },
  { value: 'beginner', label: 'Beginner', description: 'Fundamental problems to build confidence' },
  { value: 'easy', label: 'Easy', description: 'Slightly more challenging problems' },
  { value: 'intermediate', label: 'Intermediate', description: 'Problems requiring multiple steps' },
  { value: 'advanced', label: 'Advanced', description: 'Complex problems for mastery' },
];

interface PracticePageClientProps {
  lessonTitle: string;
  lessonId: string;
  subject: string;
}

export default function PracticePageClient({ lessonTitle, lessonId, subject }: PracticePageClientProps) {
  const router = useRouter();

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
          {difficulties.map((d) => (
            <button
              key={d.value}
              onClick={() => handleSelect(d.value)}
              className="p-6 rounded-2xl cursor-pointer bg-slate-100 dark:bg-slate-900 text-left transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-500/5 focus:outline-none group"
            >
              <div className="text-lg font-bold mb-1">{d.label}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{d.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
