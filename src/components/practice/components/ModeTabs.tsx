'use client';

import { useI18n } from '@/i18n/I18nContext';

interface ModeTabsProps {
  mode: 'equation' | 'operation';
  onChange: (mode: 'equation' | 'operation') => void;
  onClearValidation?: () => void;
}

export default function ModeTabs({ mode, onChange, onClearValidation }: ModeTabsProps) {
  const { t } = useI18n();

  return (
    <div className="flex gap-2 mb-3 p-1 rounded-xl bg-gray-100 dark:bg-slate-900">
      {(['equation', 'operation'] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => { onChange(tab); onClearValidation?.(); }}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer capitalize ${
            mode === tab
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-2xl'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {tab === 'equation' ? t('practice.mode.equation') : t('practice.mode.operation')}
        </button>
      ))}
    </div>
  );
}
