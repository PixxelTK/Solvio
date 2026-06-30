'use client';

import type { Hint } from '@/lib/engine/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { useI18n } from '@/i18n/I18nContext';

interface HintBannerProps {
  hint: Hint;
}

export default function HintBanner({ hint }: HintBannerProps) {
  const { t } = useI18n();

  return (
    <div className="mb-3 mt-4 rounded-2xl px-4 py-4 bg-amber-100 dark:bg-amber-950/20 text-amber-600 dark:text-amber-300">
      <div className="flex items-center gap-2">
        <FontAwesomeIcon icon={faLightbulb} />
        <span className="font-medium">{t('practice.hint')}</span>
      </div>
      <div>
        {hint.translationKey
          ? (t(hint.translationKey, hint.translationParams || {}) as string !== hint.translationKey
              ? t(hint.translationKey, hint.translationParams || {})
              : hint.operationDescription)
          : hint.operationDescription}
      </div>
    </div>
  );
}
