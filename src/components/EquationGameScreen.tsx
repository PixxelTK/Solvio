'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { Difficulty, MathState, Operation, TransformationStep, ValidationResult, Hint } from '@/lib/engine/types';
import { equationTransformationModule } from '@/lib/modules/algebra';
import { applyAlgebraOperation, stateToEquation, computeHint, equationToState } from '@/lib/modules/algebra/engine';
import { equationToString, parseEquation, simplify, exprToLatex, equationsEquivalent } from '@/lib/modules/algebra/expressions';
import MathDisplay from './MathDisplay';
import TransformationHistory from './TransformationHistory';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRotate,
  faBullseye,
  faLayerGroup,
  faLightbulb,
  faCircleCheck,
  faCircleXmark,
  faForward,
  faCheck,
  faAngleLeft,
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from 'next/navigation';

interface EquationGameScreenProps {
  difficulty: Difficulty;
  onBack: () => void;
}

type SolveMode = 'equation' | 'operation';

function inferOperation(
  currentEq: ReturnType<typeof stateToEquation>,
  userEq: ReturnType<typeof parseEquation>,
): { typeId: string; parameter: string; description: string } | null {
  const userSimplified = { left: simplify(userEq.left), right: simplify(userEq.right) };

  for (const opType of ['expand', 'collect'] as const) {
    const result = applyAlgebraOperation(currentEq, opType, '');
    if (result) {
      const rs = { left: simplify(result.result.left), right: simplify(result.result.right) };
      if (equationsEquivalent(rs, userSimplified)) {
        return { typeId: opType, parameter: '', description: result.description };
      }
    }
  }

  for (let p = -20; p <= 20; p++) {
    if (p === 0) continue;
    for (const opType of ['add_both', 'sub_both', 'mul_both', 'div_both'] as const) {
      const result = applyAlgebraOperation(currentEq, opType, String(p));
      if (result) {
        const rs = { left: simplify(result.result.left), right: simplify(result.result.right) };
        if (equationsEquivalent(rs, userSimplified)) {
          return { typeId: opType, parameter: String(p), description: result.description };
        }
      }
    }
  }

  return null;
}

export default function EquationGameScreen({ difficulty, onBack }: EquationGameScreenProps) {
  const router = useRouter();
  const [question] = useState(() => equationTransformationModule.generateQuestion(difficulty));
  const [currentState, setCurrentState] = useState<MathState>(question.initialState);
  const [steps, setSteps] = useState<TransformationStep[]>([
    { state: question.initialState },
  ]);
  const [solveMode, setSolveMode] = useState<SolveMode>('equation');
  const [selectedOp, setSelectedOp] = useState<string>('sub_both');
  const [opParam, setOpParam] = useState('');
  const [userEquation, setUserEquation] = useState('');
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [hint, setHint] = useState<Hint | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const paramRef = useRef<HTMLInputElement>(null);
  const eqRef = useRef<HTMLInputElement>(null);

  const operations = useMemo(
    () => equationTransformationModule.getAvailableOperations(currentState),
    [currentState]
  );

  const currentOp = useMemo(
    () => operations.find(o => o.id === selectedOp),
    [operations, selectedOp]
  );

  const commitStep = useCallback(
    (nextStateFull: MathState, operation: Operation): boolean => {
      const solved = equationTransformationModule.isSolved(nextStateFull);
      setCurrentState(nextStateFull);
      setSteps(prev => [
        ...prev.slice(0, -1).map(s => ({ ...s })),
        { state: prev[prev.length - 1].state, operation, isValid: true },
        { state: nextStateFull },
      ]);
      setStepCount(prev => prev + 1);
      setIsComplete(solved);
      setUserEquation('');
      setOpParam('');
      return solved;
    },
    []
  );

  const handleEquationModeSubmit = useCallback(() => {
    if (!userEquation.trim()) return;
    setValidation(null);
    setHint(null);

    try {
      const userEq = parseEquation(userEquation);
      const currentEq = stateToEquation(currentState);
      const inferred = inferOperation(currentEq, userEq);

      if (!inferred) {
        setValidation({
          valid: false,
          message: 'No valid transformation found for this equation. Check your calculation.',
          isSolved: false,
        });
        return;
      }

      const lhs = simplify(userEq.left);
      const rhs = simplify(userEq.right);
      const nextStateFull: MathState = {
        display: equationToString({ left: lhs, right: rhs }),
        latex: `${exprToLatex(lhs)} = ${exprToLatex(rhs)}`,
        data: JSON.stringify(userEq),
      };

      const operation: Operation = {
        typeId: inferred.typeId,
        parameter: inferred.parameter,
        description: inferred.description,
      };

      const solved = commitStep(nextStateFull, operation);
      if (solved) {
        setValidation({ valid: true, message: 'Exercise Complete! Equation solved.', isSolved: true });
      } else {
        setValidation({ valid: true, message: `Correct! ${inferred.description}`, isSolved: false });
      }
    } catch {
      setValidation({ valid: false, message: 'Could not parse equation. Use format: expression = expression', isSolved: false });
    }
  }, [currentState, userEquation, commitStep]);

  const handleOperationModeSubmit = useCallback(() => {
    setValidation(null);
    setHint(null);

    if (currentOp?.needsParameter && !opParam.trim()) {
      setValidation({ valid: false, message: 'This operation requires a value.', isSolved: false });
      return;
    }

    try {
      const eq = stateToEquation(currentState);
      const opResult = applyAlgebraOperation(eq, selectedOp, opParam || '');

      if (!opResult) {
        setValidation({ valid: false, message: 'This operation cannot be applied here. The expression may not change.', isSolved: false });
        return;
      }

      const newState = equationToState(opResult.result);
      const operation: Operation = {
        typeId: selectedOp,
        parameter: opParam || '',
        description: opResult.description,
      };

      const solved = commitStep(newState, operation);
      if (solved) {
        setValidation({ valid: true, message: 'Exercise Complete! Equation solved.', isSolved: true });
      } else {
        setValidation({ valid: true, message: 'Operation applied successfully.', isSolved: false });
      }
    } catch {
      setValidation({ valid: false, message: 'Error applying operation.', isSolved: false });
    }
  }, [currentState, selectedOp, opParam, currentOp, commitStep]);

  const handleGetHint = useCallback(() => {
    const h = equationTransformationModule.getHint(currentState);
    setHint(h);
  }, [currentState]);

  const handleSkip = useCallback(() => {
    setHint(null);
    setValidation(null);

    const eq = stateToEquation(currentState);
    const computed = computeHint(eq);
    if (!computed.opType) return;

    const param = computed.parameter;
    if (!computed.parameter && (computed.opType === 'add_both' || computed.opType === 'sub_both' || computed.opType === 'mul_both' || computed.opType === 'div_both')) return;

    const opResult = applyAlgebraOperation(eq, computed.opType, param || '');
    if (!opResult) return;

    const newState = equationToState(opResult.result);
    const operation: Operation = {
      typeId: computed.opType,
      parameter: param,
      description: opResult.description,
    };

    commitStep(newState, operation);
  }, [currentState, commitStep]);

  const handleNewProblem = useCallback(() => {
    const q = equationTransformationModule.generateQuestion(difficulty);
    setCurrentState(q.initialState);
    setSteps([{ state: q.initialState }]);
    setValidation(null);
    setHint(null);
    setIsComplete(false);
    setStepCount(0);
    setUserEquation('');
    setOpParam('');
  }, [difficulty]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">

      {/* ========================= HEADER ========================= */}
      <header className="sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">

          <button
            onClick={() => router.push("/")}
            className="cursor-pointer py-2 rounded-xl transition-colors hover:opacity-80"
          >
            <h1 className="text-lg lg:text-xl font-bold"><span className='font-light'>Solvio</span> Math</h1>
          </button>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-sm">
              <FontAwesomeIcon icon={faBullseye} />
              {question.topic}
            </div>

            <button
              onClick={onBack}
              className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-sm capitalize hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {difficulty}
            </button>
          </div>
        </div>
      </header>

      {/* ========================= BODY ========================= */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 flex flex-col lg:flex-row gap-12">
        <main className="w-full lg:sticky lg:top-16">
          {/* Goal */}
          <section className="mb-6">
            <div className='flex gap-4 justify-between items-center'>
              <div>
                <div className="font-bold text-xl">
                  {question.targetDescription}
                </div>

                <div className="text-sm text-gray-500 space-y-1">
                  <p>Apply transformations step by step to solve the equation.</p>
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
          </section>

          {/* Equation */}
          <section className="mb-6">
            <div className="rounded-2xl bg-gray-100 dark:bg-slate-900 px-8 py-1">
              <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400 text-center mt-6">
                Current Equation
              </div>

              <MathDisplay
                latex={currentState.latex}
                className="text-5xl"
              />

            </div>
          </section>

          <div className='flex flex-col gap-6 items-start'>
            <div className="w-full rounded-2xl bg-gray-100 dark:bg-slate-900 px-4 py-4">
              <div className="flex items-center justify-between gap-2 mb-5">
                <div className='flex gap-2 items-center'>
                  <FontAwesomeIcon icon={faLightbulb} className='text-amber-500' />

                  <h2 className="font-medium">
                    Steps
                  </h2>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:text-slate-300 dark:bg-gray-800 text-sm">
                  <FontAwesomeIcon icon={faLayerGroup} />
                  Step {stepCount}
                </div>
              </div>

              <div className="pl-3">
                <TransformationHistory
                  steps={steps}
                  isComplete={isComplete}
                  completionMessage="Equation solved"
                />
              </div>
            </div>
          </div>

          {hint && (
            <div className="mb-3 mt-4 rounded-2xl px-4 py-4 bg-amber-100 dark:bg-amber-950/20 text-amber-600 dark:text-amber-300">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faLightbulb} />
                <span className="font-medium">
                  Hint
                </span>
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
                <FontAwesomeIcon icon={faLightbulb} className='mr-2' />
                Show Hint
              </button>

              <button
                onClick={handleSkip}
                className="h-10 px-4 text-sm min-w-max rounded-full bg-blue-400 dark:bg-blue-900 text-white hover:bg-blue-500 dark:hover:bg-blue-800 cursor-pointer transition-colors font-medium"
              >
                <FontAwesomeIcon icon={faForward} className='mr-2' />
                Skip Step
              </button>

            </div>
          )}
        </main>

        {/* ========================= SOLVE PANEL ========================= */}
        <aside className='lg:w-3xl'>
          <div>
            {!isComplete && (
              <section className="mb-4">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold">
                    Solve the next step
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    Choose a mode and apply a transformation.
                  </p>
                </div>

                {/* Tab bar */}
                <div className="flex gap-1 mb-6 p-1 rounded-xl bg-gray-100 dark:bg-slate-900">
                  <button
                    onClick={() => { setSolveMode('equation'); setValidation(null); }}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer
                      ${solveMode === 'equation'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                  >
                    Equation
                  </button>
                  <button
                    onClick={() => { setSolveMode('operation'); setValidation(null); }}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer
                      ${solveMode === 'operation'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                  >
                    Operation
                  </button>
                </div>

                {/* ========== EQUATION MODE ========== */}
                {solveMode === 'equation' && (
                  <>
                    <div className="mb-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 px-4 py-3">
                      <p className="text-sm text-slate-500 dark:text-slate-300">
                        Enter the resulting equation after your transformation. The system will automatically detect which operation you applied.
                      </p>
                    </div>

                    <div className="mb-3 font-medium">
                      Enter the resulting equation
                    </div>

                    <div className="flex flex-col md:flex-row gap-3">
                      <input
                        ref={eqRef}
                        type="text"
                        value={userEquation}
                        onChange={(e) => setUserEquation(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleEquationModeSubmit(); } }}
                        placeholder="Example: 2x = 8"
                        className="w-full h-12 px-4 text-lg rounded-xl bg-transparent border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500"
                      />

                      <button
                        onClick={handleEquationModeSubmit}
                        disabled={!userEquation.trim()}
                        className="h-12 px-4 min-w-max rounded-xl bg-green-500 dark:bg-green-700 text-white font-bold hover:bg-green-600 dark:hover:bg-green-800 transition-colors disabled:opacity-40 cursor-pointer"
                      >
                        <FontAwesomeIcon icon={faCheck} className='mr-1' />
                        Check
                      </button>
                    </div>
                  </>
                )}

                {/* ========== OPERATION MODE ========== */}
                {solveMode === 'operation' && (
                  <>
                    <div className="mb-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 px-4 py-3">
                      <p className="text-sm text-slate-500 dark:text-slate-300">
                        Select an operation and provide a value if needed. The system will apply it directly.
                      </p>
                    </div>

                    <div className="mb-3 font-medium">
                      Choose an operation
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                      {operations.map((op) => (
                        <button
                          key={op.id}
                          onClick={() => {
                            setSelectedOp(op.id);
                            setOpParam("");
                            setValidation(null);

                            if (op.needsParameter && paramRef.current) {
                              paramRef.current.focus();
                            }
                          }}
                          className={`p-4 rounded-lg text-left cursor-pointer transition-all
                            ${selectedOp === op.id
                              ? `
                                  bg-blue-400
                                  dark:bg-blue-900
                                  text-white
                                `
                              : `
                                  bg-slate-200
                                  dark:bg-slate-900
                                  hover:bg-slate-100
                                  dark:hover:bg-slate-800
                                `
                            }
                          `}
                        >
                          <div className="flex items-center gap-3">
                            {op.icon && (
                              <FontAwesomeIcon
                                icon={op.icon}
                                className="text-base"
                              />
                            )}

                            <span className="font-medium text-sm">
                              {op.label}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {currentOp && (
                      <div className="mb-6 rounded-2xl">
                        <div className="text-xs text-slate-600 dark:text-slate-200 mb-1">
                          Selected Operation
                        </div>

                        <div className="font-medium text-slate-500 dark:text-slate-300">
                          {currentOp.description}
                        </div>
                      </div>
                    )}

                    {currentOp?.needsParameter && (
                      <>
                        <div className="mb-3 font-medium">
                          Enter a value
                        </div>

                        <div className="mb-3">
                          <input
                            ref={paramRef}
                            type="text"
                            value={opParam}
                            onChange={(e) => setOpParam(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleOperationModeSubmit(); } }}
                            placeholder={currentOp.parameterLabel || "Enter value"}
                            className="w-full h-12 px-4 text-lg rounded-xl bg-transparent border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </>
                    )}

                    <button
                      onClick={handleOperationModeSubmit}
                      disabled={currentOp?.needsParameter && !opParam.trim()}
                      className="h-12 px-6 min-w-max rounded-xl bg-green-500 dark:bg-green-700 text-white font-bold hover:bg-green-600 dark:hover:bg-green-800 transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faCheck} className='mr-1' />
                      Apply
                    </button>
                  </>
                )}
              </section>
            )}

            {validation && (
              <div
                className={`rounded-xl py-3
                    ${validation.valid
                    ? "text-emerald-700 dark:text-emerald-500"
                    : "text-red-500 dark:text-red-400"
                  }
                  `}
              >
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon
                    icon={validation.valid ? faCircleCheck : faCircleXmark}
                  />

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
