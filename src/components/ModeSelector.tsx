'use client';

import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEquals,
  faTableCells,
} from '@fortawesome/free-solid-svg-icons';

type Mode = 'equation-transformation' | 'gaussian-elimination';

const modes = [
  {
    id: 'equation-transformation' as const,
    icon: faEquals,
    title: 'Equation Transformation',
    description: 'Solve algebra equations step by step',
    examples: ['x + 5 = 12', '3(2y + 1) = 15', '2(y + 1) + 3y = 7'],
    topics: ['Linear equations', 'Parentheses', 'Fractions', 'Like terms'],
  },
  {
    id: 'gaussian-elimination' as const,
    icon: faTableCells,
    title: 'Gaussian Elimination',
    description: 'Reduce matrices to row echelon form',
    examples: ['2×2 systems', '3×3 systems', 'Row operations'],
    topics: ['Row swap', 'Row scale', 'Row replacement', 'RREF'],
  },
];

const validModes: Mode[] = ['equation-transformation', 'gaussian-elimination'];

export default function ModeSelector() {
  const router = useRouter();

  const handleSelect = (mode: string) => {
    if (validModes.includes(mode as Mode)) {
      router.push(`/${mode}`);
    }
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">
            <span className="font-light">Solvio</span> Math
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            Learn mathematics through step-by-step transformations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleSelect(mode.id)}
              className="p-6 rounded-2xl cursor-pointer bg-slate-100 dark:bg-slate-900 text-left transition-all duration-200 hover:scale-105 hover:bg-blue-50 dark:hover:bg-blue-500/5 focus:outline-none group"
            >
              <div className="text-4xl mb-3">
                <FontAwesomeIcon icon={mode.icon} />
              </div>

              <h2 className="text-xl font-bold mb-2 transition-colors">
                {mode.title}
              </h2>

              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {mode.description}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {mode.topics.map((topic) => (
                  <span
                    key={topic}
                    className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}