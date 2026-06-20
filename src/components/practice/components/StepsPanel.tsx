'use client';

import type { TransformationStep } from '@/lib/engine/types';
import TransformationHistory from '../../TransformationHistory';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { useI18n } from '@/i18n/I18nContext';

interface StepsPanelProps {
  steps: TransformationStep[];
  isComplete: boolean;
  stepCount: number;
  completionMessage: string;
}

export default function StepsPanel({ steps, isComplete, stepCount, completionMessage }: StepsPanelProps) {
  const { t } = useI18n();

  return (
    <div className="w-full rounded-2xl bg-gray-100 dark:bg-slate-900 px-4 py-4">
      <div className="flex items-center justify-between gap-2 mb-5">
        <div className="flex gap-2 items-center">
          <FontAwesomeIcon icon={faLightbulb} className="text-blue-500 dark:text-blue-400" />
          <h2 className="font-medium">{t('practice.steps')}</h2>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:text-slate-300 dark:bg-gray-800 text-sm">
          <FontAwesomeIcon icon={faLayerGroup} />
          {stepCount === 0 ? t('practice.begin') : `${stepCount} ${stepCount === 1 ? t('practice.step') : t('practice.stepsCount')}`}
        </div>
      </div>
      <div>
        <TransformationHistory
          steps={steps}
          isComplete={isComplete}
          completionMessage={completionMessage}
        />
      </div>
    </div>
  );
}
