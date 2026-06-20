'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb, faForward } from '@fortawesome/free-solid-svg-icons';
import { useI18n } from '@/i18n/I18nContext';

interface ActionButtonsProps {
  onHint: () => void;
  onSkip: () => void;
  skipLabel?: string;
}

export default function ActionButtons({ onHint, onSkip, skipLabel }: ActionButtonsProps) {
  const { t } = useI18n();
  const label = skipLabel || t('practice.skipStep');

  return (
    <div className="flex flex-wrap gap-3 mt-4">
      <button
        onClick={onHint}
        className="h-10 px-4 text-sm min-w-max rounded-full bg-blue-400 dark:bg-blue-900 text-white hover:bg-blue-500 dark:hover:bg-blue-800 cursor-pointer transition-colors font-medium"
      >
        <FontAwesomeIcon icon={faLightbulb} className="mr-2" />
        {t('practice.showHint')}
      </button>
      <button
        onClick={onSkip}
        className="h-10 px-4 text-sm min-w-max rounded-full bg-blue-400 dark:bg-blue-900 text-white hover:bg-blue-500 dark:hover:bg-blue-800 cursor-pointer transition-colors font-medium"
      >
        <FontAwesomeIcon icon={faForward} className="mr-2" />
        {label}
      </button>
    </div>
  );
}
