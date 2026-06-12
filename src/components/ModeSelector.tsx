'use client';

interface ModeSelectorProps {
  onSelect: (mode: 'equation-transformation' | 'gaussian-elimination') => void;
}

const modes = [
  {
    id: 'equation-transformation' as const,
    icon: 'ƒ',
    title: 'Equation Transformation',
    description: 'Solve algebra equations step by step',
    examples: ['x + 5 = 12', '3(2y + 1) = 15', '2(y + 1) + 3y = 7'],
    topics: ['Linear equations', 'Parentheses', 'Fractions', 'Like terms'],
  },
  {
    id: 'gaussian-elimination' as const,
    icon: '⊞',
    title: 'Gaussian Elimination',
    description: 'Reduce matrices to row echelon form',
    examples: ['2×2 systems', '3×3 systems', 'Row operations'],
    topics: ['Row swap', 'Row scale', 'Row replacement', 'RREF'],
  },
];

export default function ModeSelector({ onSelect }: ModeSelectorProps) {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">Math Transformations</h1>
          <p className="text-gray-400 text-lg">
            Learn mathematics through step-by-step transformations
          </p>
          <p className="text-gray-600 text-sm mt-2">
            Current State → Operation → New State
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => onSelect(mode.id)}
              className="p-6 rounded-xl border-2 border-gray-700 bg-gray-900 text-left transition-all duration-200 hover:border-blue-500 hover:bg-blue-500/5 focus:outline-none focus:ring-2 focus:ring-blue-500 group"
            >
              <div className="text-4xl mb-3">{mode.icon}</div>
              <h2 className="text-xl font-bold mb-2 group-hover:text-blue-300 transition-colors">{mode.title}</h2>
              <p className="text-sm text-gray-400 mb-4">{mode.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {mode.topics.map((topic) => (
                  <span key={topic} className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-500">
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
