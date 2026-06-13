'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Difficulty, MathState, Operation, TransformationStep, ValidationResult, Hint } from '@/lib/engine/types';
import { linearAlgebraModule, matrixToState, stateToData, deepCopy, AugmentedMatrix, applyRowOperation, computeHint } from '@/lib/modules/linear-algebra';
import TransformationHistory from '../TransformationHistory';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRotate,
  faLayerGroup,
  faLightbulb,
  faCircleCheck,
  faCircleXmark,
  faForward,
  faCheck,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import { EquationCard } from '../EquationCard';

interface GameScreenProps {
  difficulty: Difficulty;
  onBack: () => void;
}

const OPERATION_HELP: Record<string, { syntax: string; examples: string[]; explanation: string }> = {
  row_swap: {
    syntax: 'R1<->R2',
    examples: ['R1<->R2', 'R2<->R3'],
    explanation: 'Swap two rows to move a non-zero entry into the pivot position.',
  },
  row_scale: {
    syntax: 'k*R1',
    examples: ['2*R1', '-1*R2', '0.5*R3'],
    explanation: 'Multiply a row by a non-zero number to make the pivot equal to 1.',
  },
  row_add: {
    syntax: 'R2-k*R1',
    examples: ['R2-2*R1', 'R3+1*R2', 'R1-3*R3'],
    explanation: 'Add a multiple of one row to another to create zeros below or above a pivot.',
  },
};

export default function GameScreen({ difficulty, onBack }: GameScreenProps) {
  const [question] = useState(() => linearAlgebraModule.generateQuestion(difficulty));
  const [currentState, setCurrentState] = useState<MathState>(question.initialState);
  const [steps, setSteps] = useState<TransformationStep[]>([
    { state: question.initialState },
  ]);
  const [selectedOp, setSelectedOp] = useState<string>('row_add');
  const [opParam, setOpParam] = useState('');
  const [userMatrix, setUserMatrix] = useState<AugmentedMatrix>(() => stateToData(question.initialState).matrix);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [hint, setHint] = useState<Hint | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  const opInputRef = useRef<HTMLInputElement>(null);

  const operations = linearAlgebraModule.getAvailableOperations(currentState);
  const help = OPERATION_HELP[selectedOp];

  const equationRef = useRef<HTMLDivElement>(null);
  const [floatingEquation, setFloatingEquation] = useState(false);

  useEffect(() => {
    const el = equationRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setFloatingEquation(!entry.isIntersecting);
      },
      {
        threshold: 0,
      }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const handleApplyOperation = useCallback(() => {
    if (!opParam.trim()) return;
    setValidation(null);
    setHint(null);

    const opResult = applyRowOperation(stateToData(currentState).matrix, selectedOp, opParam);
    if (!opResult) {
      const h = OPERATION_HELP[selectedOp];
      setValidation({ valid: false, message: `Invalid format. Try: ${h.syntax} — Examples: ${h.examples.join(', ')}`, isSolved: false });
      return;
    }

    const newState = matrixToState(opResult.result);
    const operation: Operation = {
      typeId: selectedOp,
      parameter: opParam,
      description: opResult.description,
    };

    const result = linearAlgebraModule.validateStep(currentState, operation, newState);

    if (result.valid) {
      const solved = linearAlgebraModule.isSolved(newState);
      setCurrentState(newState);
      setUserMatrix(deepCopy(opResult.result));
      setSteps(prev => [
        ...prev.slice(0, -1).map(s => ({ ...s })),
        { state: prev[prev.length - 1].state, operation, isValid: true },
        { state: newState },
      ]);
      setStepCount(prev => prev + 1);
      setIsComplete(solved);
      setOpParam('');
      if (solved) {
        setValidation({ valid: true, message: 'Done! The matrix is now in RREF — you can read the solution from the rightmost column.', isSolved: true });
      } else {
        setValidation({ valid: true, message: 'Correct! Keep going — find the next pivot to eliminate.', isSolved: false });
      }
    } else {
      setValidation(result);
    }
  }, [currentState, selectedOp, opParam]);

  const handleGetHint = useCallback(() => {
    const h = linearAlgebraModule.getHint(currentState);
    setHint(h);
  }, [currentState]);

  const handleSkip = useCallback(() => {
    const h = linearAlgebraModule.getHint(currentState);
    if (!h) return;
    setHint(null);
    setValidation(null);

    const data = stateToData(currentState);
    const computed = computeHint(data.matrix);
    if (!computed.opType || !computed.param) return;

    const opResult = applyRowOperation(data.matrix, computed.opType, computed.param);
    if (!opResult) return;

    const newState = matrixToState(opResult.result);
    const operation: Operation = {
      typeId: computed.opType,
      parameter: computed.param,
      description: opResult.description,
    };

    const solved = linearAlgebraModule.isSolved(newState);
    setCurrentState(newState);
    setUserMatrix(deepCopy(opResult.result));
    setSteps(prev => [
      ...prev.slice(0, -1).map(s => ({ ...s })),
      { state: prev[prev.length - 1].state, operation, isValid: true },
      { state: newState },
    ]);
    setStepCount(prev => prev + 1);
    setIsComplete(solved);
    setOpParam('');
  }, [currentState]);

  const handleNewProblem = useCallback(() => {
    const q = linearAlgebraModule.generateQuestion(difficulty);
    setCurrentState(q.initialState);
    setSteps([{ state: q.initialState }]);
    setUserMatrix(stateToData(q.initialState).matrix);
    setValidation(null);
    setHint(null);
    setIsComplete(false);
    setStepCount(0);
    setOpParam('');
  }, [difficulty]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyOperation();
    }
  }, [handleApplyOperation]);

  return (
    <div className="min-h-dvh text-slate-900 dark:text-slate-100">

      <header className="sm:sticky top-0 z-50 bg-white/50 dark:bg-slate-950/50 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 py-2 flex-wrap sm:flex-row flex items-center justify-between gap-x-4">
          <h1 className="text-lg lg:text-xl py-2 font-bold"><span className='font-light'>{question.topic}</span> Practice</h1>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            <button
              onClick={onBack}
              className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-sm capitalize hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {difficulty}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 flex flex-col lg:flex-row gap-12">
        <main className="w-full">
          <section className="mb-6">
            <div className="flex gap-4 justify-between items-center">
              <div>
                <div className="font-bold text-xl">
                  {question.targetDescription}
                </div>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>Use row operations to simplify the matrix until each pivot is 1 and all other entries in pivot columns are 0.</p>
                </div>
              </div>
              <button
                onClick={handleNewProblem}
                className="flex items-center min-w-max gap-2 px-4 py-2 text-sm rounded-full bg-gray-200 cursor-pointer dark:bg-gray-800 text-slate-600 dark:text-gray-300 hover:opacity-90 transition-opacity"
              >
                <FontAwesomeIcon icon={faRotate} />
                New Problem
              </button>
            </div>

            <button
              onClick={() => setShowGuide(prev => !prev)}
              className="mt-3 text-sm text-blue-500 hover:text-blue-600 cursor-pointer flex items-center gap-1"
            >
              <FontAwesomeIcon icon={showGuide ? faChevronUp : faChevronDown} className="text-xs" />
              {showGuide ? 'Hide RREF Guide' : 'What is RREF?'}
            </button>

            {showGuide && (
              <div className="mt-2 rounded-2xl bg-blue-50 dark:bg-blue-950/20 px-5 py-4 text-sm text-slate-600 dark:text-slate-300 space-y-3">
                <p className="font-medium text-slate-800 dark:text-slate-100">Reduced Row Echelon Form (RREF) Rules:</p>
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>All zero rows are at the bottom.</li>
                  <li>The first non-zero number in each row (the <strong>pivot</strong>) is <strong>1</strong>.</li>
                  <li>Each pivot is to the right of the pivot in the row above.</li>
                  <li>All other entries in a pivot column are <strong>0</strong>.</li>
                </ol>
                <p className="text-xs text-slate-400 dark:text-slate-500 pt-1">
                  Tip: Work column by column from left to right. For each pivot, scale to make it 1, then eliminate all other entries in that column.
                </p>
              </div>
            )}
          </section>

          <section ref={equationRef} className="mb-6">
            <EquationCard title='Current Matrix' latex={currentState.latex} size='text-xl sm:text-3xl' />
          </section>

          <div
            className={`md:hidden fixed top-2 left-0 right-0 z-50 px-4 transition-all duration-300 ${floatingEquation
              ? "translate-y-0"
              : "-translate-y-80 pointer-events-none"
              }`}
          >
            <EquationCard title='Current Matrix' latex={currentState.latex} size='text-xl sm:text-3xl'/>
          </div>

          <div className="flex flex-col gap-6 items-start">
            <div className="w-full rounded-2xl bg-gray-100 dark:bg-slate-900 px-4 py-4">
              <div className="flex items-center justify-between gap-2 mb-5">
                <div className="flex gap-2 items-center">
                  <FontAwesomeIcon icon={faLightbulb} className="text-amber-500" />
                  <h2 className="font-medium">Steps</h2>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:text-slate-300 dark:bg-gray-800 text-sm">
                  <FontAwesomeIcon icon={faLayerGroup} />
                  Step {stepCount}
                </div>
              </div>
              <div className="pl-3">
                <TransformationHistory steps={steps} isComplete={isComplete} completionMessage="Matrix is in RREF" />
              </div>
            </div>
          </div>

          {hint && (
            <div className="mb-3 mt-4 rounded-2xl px-4 py-4 bg-amber-100 dark:bg-amber-950/20 text-amber-600 dark:text-amber-300">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faLightbulb} />
                <span className="font-medium">Hint</span>
              </div>
              <div>{hint.operationDescription}</div>
            </div>
          )}

          {!isComplete && (
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={handleGetHint}
                className="h-10 px-4 text-sm min-w-max rounded-full bg-blue-400 dark:bg-blue-900 text-white hover:bg-blue-500 dark:hover:bg-blue-800 cursor-pointer transition-colors font-medium"
              >
                <FontAwesomeIcon icon={faLightbulb} className="mr-2" />
                Show Hint
              </button>
              <button
                onClick={handleSkip}
                className="h-10 px-4 text-sm min-w-max rounded-full bg-blue-400 dark:bg-blue-900 text-white hover:bg-blue-500 dark:hover:bg-blue-800 cursor-pointer transition-colors font-medium"
              >
                <FontAwesomeIcon icon={faForward} className="mr-2" />
                Next Step
              </button>
            </div>
          )}
        </main>

        <aside className="lg:w-5xl">
          <div className='lg:sticky lg:top-18'>
            {!isComplete && (
              <section className="mb-4">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold">Apply Operation</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Select a row operation and enter the parameters.
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                  {operations.map((op) => (
                    <button
                      key={op.id}
                      onClick={() => { setSelectedOp(op.id); setOpParam(''); setValidation(null); if (opInputRef.current) opInputRef.current.focus(); }}
                      className={`p-4 rounded-lg text-left cursor-pointer transition-all
                        ${selectedOp === op.id
                          ? 'bg-blue-400 dark:bg-blue-900 text-white'
                          : 'bg-slate-200 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        {op.icon && (
                          <FontAwesomeIcon icon={op.icon} className="text-base" />
                        )}
                        <span className="font-medium text-sm">{op.label}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {help && (
                  <div className="mb-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 px-4 py-3 space-y-2">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {help.explanation}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-400 dark:text-slate-500">Format:</span>
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-200">{help.syntax}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-400 dark:text-slate-500">Examples:</span>
                      {help.examples.map(ex => (
                        <span key={ex} className="font-mono bg-white dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">{ex}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    ref={opInputRef}
                    type="text"
                    value={opParam}
                    onChange={(e) => setOpParam(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={help?.examples[0] || 'Enter operation'}
                    className="w-full h-12 px-4 text-lg rounded-xl bg-gray-100 dark:bg-slate-900 focus:outline-none placeholder:text-slate-400"
                    aria-label="Row operation"
                  />
                  <button
                    onClick={handleApplyOperation}
                    disabled={!opParam.trim()}
                    className="h-12 px-6 min-w-max rounded-xl bg-green-500 dark:bg-green-700 text-white font-bold hover:bg-green-600 dark:hover:bg-green-800 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faCheck} className="mr-1" />
                    Apply
                  </button>
                </div>
              </section>
            )}

            {validation && (
              <div className={`rounded-xl py-3 ${validation.valid
                ? 'text-emerald-700 dark:text-emerald-500'
                : 'text-red-500 dark:text-red-400'
                }`}>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={validation.valid ? faCircleCheck : faCircleXmark} />
                  <span>{validation.message}</span>
                </div>
              </div>
            )}

            {isComplete && (
              <button
                onClick={handleNewProblem}
                className="flex items-center gap-2 px-5 py-3 rounded-xl cursor-pointer bg-green-500 dark:bg-green-600 text-white hover:opacity-90 transition-opacity"
              >
                <FontAwesomeIcon icon={faForward} />
                Next Problem
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
