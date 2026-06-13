'use client';

import type { Hint } from '@/lib/engine/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb } from '@fortawesome/free-solid-svg-icons';

interface HintBannerProps {
  hint: Hint;
}

export default function HintBanner({ hint }: HintBannerProps) {
  return (
    <div className="mb-3 mt-4 rounded-2xl px-4 py-4 bg-amber-100 dark:bg-amber-950/20 text-amber-600 dark:text-amber-300">
      <div className="flex items-center gap-2">
        <FontAwesomeIcon icon={faLightbulb} />
        <span className="font-medium">Hint</span>
      </div>
      <div>{hint.operationDescription}</div>
    </div>
  );
}
