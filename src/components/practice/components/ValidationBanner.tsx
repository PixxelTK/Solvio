'use client';

import type { ValidationResult } from '@/lib/engine/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';

interface ValidationBannerProps {
  validation: ValidationResult;
}

export default function ValidationBanner({ validation }: ValidationBannerProps) {
  return (
    <div
      className={`rounded-xl py-3 ${
        validation.valid
          ? 'text-emerald-500 dark:text-emerald-500'
          : 'text-red-500 dark:text-red-400'
      }`}
    >
      <div className="flex items-center gap-2">
        <FontAwesomeIcon icon={validation.valid ? faCircleCheck : faCircleXmark} />
        <span>{validation.message}</span>
      </div>
    </div>
  );
}
