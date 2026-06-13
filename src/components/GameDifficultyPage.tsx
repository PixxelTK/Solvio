'use client';

import { createElement } from 'react';
import { Difficulty } from '@/lib/engine/types';
import { getPracticeComponent } from '@/lib/practice/registry';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleLeft } from '@fortawesome/free-solid-svg-icons';

interface GameDifficultyPageProps {
  lessonId: string;
  practiceModuleId: string;
  subject: string;
  difficulty: string;
}

export default function GameDifficultyPage({ lessonId, practiceModuleId, subject, difficulty }: GameDifficultyPageProps) {
  const Component = getPracticeComponent(practiceModuleId);

  if (!Component) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-slate-500 dark:text-slate-400">Practice module not available.</p>
        <Link href={`/learn/${subject}/${lessonId}`} className="mt-4 inline-flex items-center gap-1 text-sm text-blue-500">
          <FontAwesomeIcon icon={faAngleLeft} className="h-3 w-3" />
          Back to lesson
        </Link>
      </div>
    );
  }

  return createElement(Component, {
    difficulty: difficulty as Difficulty,
    onBack: () => window.history.back(),
  });
}
