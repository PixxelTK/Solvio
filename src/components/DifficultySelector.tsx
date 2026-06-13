'use client';

import { useRouter } from 'next/navigation';
import { Difficulty } from '@/lib/engine/types';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft, faEquals, faTableCells } from "@fortawesome/free-solid-svg-icons";

type Mode = 'equation-transformation' | 'gaussian-elimination';

interface DifficultySelectorProps {
  mode: Mode;
}

const validModes: Mode[] = ['equation-transformation', 'gaussian-elimination'];

const modeInfo = {
  'equation-transformation': {
    title: 'Equation Transformation',
    icon: faEquals,
  },
  'gaussian-elimination': {
    title: 'Gaussian Elimination',
    icon: faTableCells,
  },
};

const difficulties: { value: Difficulty; label: string; eqDescription: string; laDescription: string }[] = [
  { value: 'random', label: 'Random', eqDescription: 'Mixed difficulty problems', laDescription: 'Mixed difficulty systems' },
  { value: 'beginner', label: 'Beginner', eqDescription: 'x + a = b, x - a = b', laDescription: '2×2 systems, simple operations' },
  { value: 'easy', label: 'Easy', eqDescription: 'ax = b, ax + b = c', laDescription: '2×2 systems, more steps' },
  { value: 'intermediate', label: 'Intermediate', eqDescription: 'a(x+b) = c, like terms, fractions', laDescription: '3×3 systems, Gaussian elimination' },
  { value: 'advanced', label: 'Advanced', eqDescription: 'a(x+b) + cx = d, nested operations', laDescription: '3×3 systems, complex elimination' },
];

export default function DifficultySelector({ mode }: DifficultySelectorProps) {
  const router = useRouter();
  const info = modeInfo[mode];

  const handleSelect = (difficulty: Difficulty) => {
    router.push(`/${mode}/${difficulty}`);
  };

  const handleBack = () => {
    router.push('/');
  };

  if (!validModes.includes(mode)) {
    return null;
  }

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <div className="text-5xl mb-3"><FontAwesomeIcon icon={info.icon}/></div>
          <h1 className="text-3xl font-bold mb-1">{info.title}</h1>
          <p className="text-slate-500 dark:text-slate-400">Select difficulty level</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {difficulties.map((d) => (
            <button
              key={d.value}
              onClick={() => handleSelect(d.value)}
              className="p-6 rounded-2xl cursor-pointer bg-slate-100 dark:bg-slate-900 text-left transition-all duration-200 hover:scale-105 hover:bg-blue-50 dark:hover:bg-blue-500/5 focus:outline-none group"
            >
              <div className="text-lg font-bold mb-1">{d.label}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {mode === 'equation-transformation' ? d.eqDescription : d.laDescription}
              </div>
            </button>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={handleBack}
            className="inline-flex cursor-pointer items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors text-sm focus:outline-none rounded-xl px-3 py-2"
          >
            <FontAwesomeIcon icon={faAngleLeft} />
            Back to mode selection
          </button>
        </div>
      </div>
    </div>
  );
}
