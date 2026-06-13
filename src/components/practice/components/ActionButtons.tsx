'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb, faForward } from '@fortawesome/free-solid-svg-icons';

interface ActionButtonsProps {
  onHint: () => void;
  onSkip: () => void;
  skipLabel?: string;
}

export default function ActionButtons({ onHint, onSkip, skipLabel = 'Skip Step' }: ActionButtonsProps) {
  return (
    <div className="flex flex-wrap gap-3 mt-4">
      <button
        onClick={onHint}
        className="h-10 px-4 text-sm min-w-max rounded-full bg-blue-400 dark:bg-blue-900 text-white hover:bg-blue-500 dark:hover:bg-blue-800 cursor-pointer transition-colors font-medium"
      >
        <FontAwesomeIcon icon={faLightbulb} className="mr-2" />
        Show Hint
      </button>
      <button
        onClick={onSkip}
        className="h-10 px-4 text-sm min-w-max rounded-full bg-blue-400 dark:bg-blue-900 text-white hover:bg-blue-500 dark:hover:bg-blue-800 cursor-pointer transition-colors font-medium"
      >
        <FontAwesomeIcon icon={faForward} className="mr-2" />
        {skipLabel}
      </button>
    </div>
  );
}
