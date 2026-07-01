'use client';

import { useRouter } from 'next/navigation';
import { Difficulty } from '@/lib/engine/types';
import type { PracticeModuleId } from '@/lib/practice/types';
import { useI18n } from '@/i18n/I18nContext';

const DIFFICULTIES: Difficulty[] = ['random', 'beginner', 'easy', 'intermediate', 'advanced'];

interface PracticePageClientProps {
  lessonTitle: string;
  lessonId: string;
  subject: string;
  practiceModule: PracticeModuleId;
}

export default function PracticePageClient({ lessonTitle, lessonId, subject }: PracticePageClientProps) {
  const router = useRouter();
  const { t } = useI18n();

  const handleSelect = (difficulty: Difficulty) => {
    router.push(`/learn/${subject}/${lessonId}/practice/${difficulty}`);
  };

  const getLabel = (d: Difficulty) => t(`practice.difficulty.${d}`);

  const getDescription = (d: Difficulty) => {
    const key = `practice.moduleDescriptions.${d}`;
    const desc = t(key);
    if (desc !== key) return desc;
    return t(`practice.fallbackDescriptions.${d}`);
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-1">{lessonTitle}</h1>
          <p className="text-slate-500 dark:text-slate-400">{t('practice.selectDifficulty')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => handleSelect(d)}
              className="p-6 rounded-2xl cursor-pointer bg-slate-100 dark:bg-slate-900 text-left transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-500/5 focus:outline-none group"
            >
              <div className="text-lg font-bold mb-1">{getLabel(d)}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">{getDescription(d)}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
