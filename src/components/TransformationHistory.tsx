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
          <div className="flex items-start gap-2">
            {step.operation && (
              <div className="flex items-center gap-2 w-full">
                <span className={`text-xs px-2 py-1 my-2 rounded font-mono ${step.isValid === true
                  ? 'bg-green-500 text-white dark:bg-green-800 dark:text-green-300'
                  : step.isValid === false
                    ? 'bg-red-500 text-white dark:bg-red-800 dark:text-red-300'
                    : 'bg-gray-300 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                  {step.operation.description}
                </span>
              </div>
            )}
          </div>
          <div className="border-l-2 border-gray-300 dark:border-gray-800 py-2">
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
