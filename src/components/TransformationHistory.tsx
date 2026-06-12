'use client';

import { TransformationStep } from '@/lib/engine/types';
import MathDisplay from './MathDisplay';

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
                <span className={`text-xs px-2 py-1 my-2 rounded font-mono ${
                  step.isValid === true
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
              className="text-lg"
            />
          </div>
        </div>
      ))}
      {isComplete && (
        <div className="mt-4 p-3 bg-green-500 dark:bg-green-800 rounded-lg text-center">
          <div className="text-white font-bold text-lg">Exercise Complete</div>
          {completionMessage && (
            <div className="text-gray-100 dark:text-gray-300 text-sm">{completionMessage}</div>
          )}
        </div>
      )}
    </div>
  );
}
