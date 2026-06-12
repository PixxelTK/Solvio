'use client';

import { Difficulty } from '@/lib/engine/types';

interface DifficultySelectorProps {
  mode: 'equation-transformation' | 'gaussian-elimination';
  onSelect: (difficulty: Difficulty) => void;
  onBack: () => void;
}

const modeInfo = {
  'equation-transformation': {
    title: 'Equation Transformation',
    icon: 'ƒ',
  },
  'gaussian-elimination': {
    title: 'Gaussian Elimination',
    icon: '⊞',
  },
};

const difficulties: { value: Difficulty; label: string; eqDescription: string; laDescription: string }[] = [
  { value: 'beginner', label: 'Beginner', eqDescription: 'x + a = b, x - a = b', laDescription: '2×2 systems, simple operations' },
  { value: 'easy', label: 'Easy', eqDescription: 'ax = b, ax + b = c', laDescription: '2×2 systems, more steps' },
  { value: 'intermediate', label: 'Intermediate', eqDescription: 'a(x+b) = c, like terms, fractions', laDescription: '3×3 systems, Gaussian elimination' },
  { value: 'advanced', label: 'Advanced', eqDescription: 'a(x+b) + cx = d, nested operations', laDescription: '3×3 systems, complex elimination' },
];

export default function DifficultySelector({ mode, onSelect, onBack }: DifficultySelectorProps) {
  const info = modeInfo[mode];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">{info.icon}</div>
          <h1 className="text-3xl font-bold mb-1">{info.title}</h1>
          <p className="text-gray-400">Select difficulty level</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {difficulties.map((d) => (
            <button
              key={d.value}
              onClick={() => onSelect(d.value)}
              className="p-5 rounded-xl border-2 border-gray-700 bg-gray-900 text-left transition-all duration-200 hover:border-blue-500 hover:bg-blue-500/5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="text-lg font-bold mb-1">{d.label}</div>
              <div className="text-sm text-gray-500">
                {mode === 'equation-transformation' ? d.eqDescription : d.laDescription}
              </div>
            </button>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-300 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-3 py-1"
          >
            ← Back to mode selection
          </button>
        </div>
      </div>
    </div>
  );
}
