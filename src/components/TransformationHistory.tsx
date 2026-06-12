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
                <span className="text-blue-400 text-xs font-mono shrink-0 mt-1">
                  ↓
                </span>
                <span className={`text-xs px-2 py-1 rounded font-mono ${
                  step.isValid === true
                    ? 'bg-green-900/40 text-green-300'
                    : step.isValid === false
                    ? 'bg-red-900/40 text-red-300'
                    : 'bg-gray-800 text-gray-400'
                }`}>
                  {step.operation.description}
                </span>
              </div>
            )}
          </div>
          <div className="pl-4 border-l-2 border-gray-700 ml-1 py-2">
            <MathDisplay
              latex={step.state.latex}
              className="text-sm"
            />
          </div>
        </div>
      ))}
      {isComplete && (
        <div className="mt-4 p-3 bg-green-900/30 border border-green-700 rounded-lg text-center">
          <div className="text-green-400 font-bold text-lg">Exercise Complete</div>
          {completionMessage && (
            <div className="text-green-500 text-sm">{completionMessage}</div>
          )}
        </div>
      )}
    </div>
  );
}
