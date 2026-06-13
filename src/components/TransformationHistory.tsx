'use client';

import { TransformationStep } from '@/lib/engine/types';
import MathDisplay from './MathDisplay';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface TransformationHistoryProps {
  steps: TransformationStep[];
  isComplete: boolean;
  completionMessage?: string;
}

export default function TransformationHistory({ steps, isComplete, completionMessage }: TransformationHistoryProps) {
  if (steps.length === 0) return null;

  return (
    <div className="space-y-0">
      {steps.map((step, idx) => (
        <div key={idx}>
          {(() => {
            const prev = idx > 0 ? steps[idx - 1] : undefined;
            if (!prev?.operation) return null;
            return (
              <div className="flex items-center gap-3 py-3">
                <div className="h-px flex-1 bg-slate-300/50 dark:bg-slate-700/50" />
                <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${prev.isValid === true
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                  : prev.isValid === false
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
                    : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                  {prev.operation.description}
                </span>
                <div className="h-px flex-1 bg-slate-300/50 dark:bg-slate-700/50" />
              </div>
            );
          })()}
          <MathDisplay
            latex={step.state.latex}
            className={
              isComplete && idx === steps.length - 1
                ? 'text-2xl sm:text-3xl text-green-600 dark:text-green-400'
                : idx === 0
                  ? 'text-2xl sm:text-3xl'
                  : 'text-base sm:text-lg'
            }
          />
        </div>
      ))}
      {isComplete && (
        <div className="mt-4 p-2 bg-white dark:bg-slate-800 rounded-lg flex items-center justify-center gap-2">
          <FontAwesomeIcon
            icon={faCircleCheck}
            className="text-emerald-500 text-2xl"
          />
          <div className="flex flex-col">
            <div className="text-emerald-500 font-bold text-lg">
              Completed
            </div>
            {completionMessage && (
              <div className="text-emerald-400 text-sm">
                {completionMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
