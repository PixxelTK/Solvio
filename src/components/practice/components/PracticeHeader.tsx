'use client';

import type { Difficulty } from '@/lib/engine/types';
import { useI18n } from '@/i18n/I18nContext';

interface PracticeHeaderProps {
  topic: string;
  difficulty: Difficulty;
  onBack: () => void;
}

export default function PracticeHeader({ topic, difficulty, onBack }: PracticeHeaderProps) {
  const { t } = useI18n();

  return (
    <header className="sm:sticky top-0 z-20 bg-white/50 dark:bg-slate-950/50 backdrop-blur-2xl">
      <div className="max-w-5xl mx-auto w-[90%] py-2 flex-wrap sm:flex-row flex items-center justify-between gap-x-4">
        <h1 className="lg:text-lg py-2 font-bold"><span className="font-light">{topic}</span> {t('practice.topicPractice')}</h1>
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <button
            onClick={onBack}
            className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-sm capitalize hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {difficulty}
          </button>
        </div>
      </div>
    </header>
  );
}
