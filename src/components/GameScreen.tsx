'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Difficulty, MathState, Operation, TransformationStep, ValidationResult, Hint } from '@/lib/engine/types';
import { linearAlgebraModule, matrixToState, stateToData, deepCopy, AugmentedMatrix, applyRowOperation, computeHint } from '@/lib/modules/linear-algebra';
import MathDisplay from './MathDisplay';
import MatrixEditor from './MatrixEditor';
import TransformationHistory from './TransformationHistory';

interface GameScreenProps {
  difficulty: Difficulty;
  onBack: () => void;
}

const OPERATION_SYNTAX_HELP: Record<string, string> = {
  row_swap: 'Format: R1<->R2',
  row_scale: 'Format: 2*R1  or  -1*R3',
  row_add: 'Format: R2-2*R1  or  R3+1*R2',
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
  const opInputRef = useRef<HTMLInputElement>(null);

  const operations = linearAlgebraModule.getAvailableOperations(currentState);
  const currentOp = operations.find(o => o.id === selectedOp);

  const handleApplyOperation = useCallback(() => {
    if (!opParam.trim()) return;
    setValidation(null);
    setHint(null);

    const opResult = applyRowOperation(stateToData(currentState).matrix, selectedOp, opParam);
    if (!opResult) {
      setValidation({ valid: false, message: `Invalid operation. ${OPERATION_SYNTAX_HELP[selectedOp] || ''}`, isSolved: false });
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
        setValidation({ valid: true, message: 'Exercise Complete! Matrix is in RREF.', isSolved: true });
      } else {
        setValidation({ valid: true, message: 'Correct! Apply the next operation.', isSolved: false });
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
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
        >
          ← Back
        </button>
        <div className="text-center">
          <span className="text-gray-400 text-sm">{question.topic}</span>
          <span className="mx-2 text-gray-600">·</span>
          <span className="text-gray-400 text-sm capitalize">{difficulty}</span>
          <span className="mx-2 text-gray-600">·</span>
          <span className="text-gray-400 text-sm">Step {stepCount}</span>
        </div>
        <button
          onClick={handleNewProblem}
          className="text-blue-400 hover:text-blue-300 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
        >
          New Problem
        </button>
      </header>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-53px)]">
        <aside className="lg:w-64 xl:w-72 border-b lg:border-b-0 lg:border-r border-gray-800 p-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Problem</h2>
          <div className="mb-4">
            <div className="text-sm text-gray-300 mb-1">Goal:</div>
            <div className="text-sm text-blue-300">{question.targetDescription}</div>
          </div>
          <div className="mb-4">
            <div className="text-sm text-gray-300 mb-1">Instructions:</div>
            <div className="text-xs text-gray-500 space-y-1">
              <p>Apply row operations to reduce the augmented matrix to RREF.</p>
              <p className="mt-2 font-semibold text-gray-400">Row operation formats:</p>
              <p className="font-mono text-xs text-gray-500">R1&lt;-&gt;R2 &nbsp; (swap)</p>
              <p className="font-mono text-xs text-gray-500">3*R1 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; (scale)</p>
              <p className="font-mono text-xs text-gray-500">R2-2*R1 &nbsp;&nbsp; (replace)</p>
            </div>
          </div>
          <div className="text-xs text-gray-600">
            Problem #{question.id.slice(-6)}
          </div>
        </aside>

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <section className="mb-8">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Current State</h2>
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                <MathDisplay latex={currentState.latex} className="text-lg" />
              </div>
            </section>

            {!isComplete && (
              <section className="mb-8">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Apply Operation</h2>
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-4">
                  <div>
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {operations.map((op) => (
                        <button
                          key={op.id}
                          onClick={() => { setSelectedOp(op.id); setOpParam(''); setValidation(null); }}
                          className={`
                            px-3 py-2 rounded-lg text-sm font-medium transition-all
                            focus:outline-none focus:ring-2 focus:ring-blue-500
                            ${selectedOp === op.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                            }
                          `}
                        >
                          {op.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1">
                        <input
                          ref={opInputRef}
                          type="text"
                          value={opParam}
                          onChange={(e) => setOpParam(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={currentOp?.parameterLabel || 'Enter operation'}
                          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          aria-label="Row operation"
                        />
                      </div>
                      <button
                        onClick={handleApplyOperation}
                        disabled={!opParam.trim()}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Apply
                      </button>
                    </div>

                    <div className="mt-2 text-xs text-gray-600 font-mono">
                      {OPERATION_SYNTAX_HELP[selectedOp]}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {validation && (
              <div className={`mb-6 p-4 rounded-xl border ${
                validation.valid
                  ? 'bg-green-900/20 border-green-800 text-green-300'
                  : 'bg-red-900/20 border-red-800 text-red-300'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{validation.valid ? '✓' : '✗'}</span>
                  <span className="font-medium">{validation.message}</span>
                </div>
              </div>
            )}

            {hint && (
              <div className="mb-6 p-4 rounded-xl border border-yellow-800 bg-yellow-900/20 text-yellow-300">
                <div className="text-xs uppercase tracking-wider text-yellow-500 mb-1">Hint</div>
                <div className="font-medium">{hint.operationDescription}</div>
              </div>
            )}

            {!isComplete && (
              <div className="flex gap-3 mb-8">
                <button
                  onClick={handleGetHint}
                  className="px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded-lg text-sm font-medium transition-colors border border-yellow-800 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  Show Hint
                </button>
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg text-sm font-medium transition-colors border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Skip Step
                </button>
              </div>
            )}

            {isComplete && (
              <div className="flex gap-3">
                <button
                  onClick={handleNewProblem}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  New Problem
                </button>
              </div>
            )}
          </div>
        </main>

        <aside className="lg:w-72 xl:w-80 border-t lg:border-t-0 lg:border-l border-gray-800 p-6 overflow-y-auto">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">History</h2>
          <TransformationHistory steps={steps} isComplete={isComplete} completionMessage="Matrix is in RREF" />
        </aside>
      </div>
    </div>
  );
}
