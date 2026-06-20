'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faForward } from '@fortawesome/free-solid-svg-icons';
import { useI18n } from '@/i18n/I18nContext';

interface NextProblemButtonProps {
  onClick: () => void;
}

export default function NextProblemButton({ onClick }: NextProblemButtonProps) {
  const { t } = useI18n();

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-5 py-3 rounded-xl cursor-pointer bg-green-500 dark:bg-green-600 text-white hover:opacity-90 transition-opacity"
    >
      <FontAwesomeIcon icon={faForward} />
      {t('practice.nextProblem')}
    </button>
  );
}
