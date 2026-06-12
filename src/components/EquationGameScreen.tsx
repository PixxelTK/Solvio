'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { Difficulty, MathState, Operation, TransformationStep, ValidationResult, Hint } from '@/lib/engine/types';
import { equationTransformationModule } from '@/lib/modules/algebra';
import { applyAlgebraOperation, stateToEquation, computeHint, equationToState } from '@/lib/modules/algebra/engine';
import { equationToString, parseEquation, simplify, exprToLatex } from '@/lib/modules/algebra/expressions';
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

interface EquationGameScreenProps {
  difficulty: Difficulty;
  onBack: () => void;
}

export default function EquationGameScreen({ difficulty, onBack }: EquationGameScreenProps) {
  const [question] = useState(() => equationTransformationModule.generateQuestion(difficulty));
  const [currentState, setCurrentState] = useState<MathState>(question.initialState);
  const [steps, setSteps] = useState<TransformationStep[]>([
    { state: question.initialState },
  ]);
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

  const handleApplyOperation = useCallback(() => {
    if (!userEquation.trim()) return;
    setValidation(null);
    setHint(null);

    const operation: Operation = {
      typeId: selectedOp,
      parameter: opParam,
      description: currentOp
        ? (currentOp.needsParameter && opParam
          ? `${currentOp.label.replace(/by$/, '').replace(/both sides$/, 'both sides by')} ${opParam}`.replace(/\s+/g, ' ').trim()
          : currentOp.label)
        : selectedOp,
    };

    if (currentOp?.needsParameter && !opParam.trim()) {
      setValidation({ valid: false, message: 'This operation requires a value.', isSolved: false });
      return;
    }

    const parsedEq = parseEquation(userEquation);
    const simplifiedDisplay = `${equationToString({ left: simplify(parsedEq.left), right: simplify(parsedEq.right) })}`;

    try {
      const userEq = parseEquation(userEquation);
      const lhs = simplify(userEq.left);
      const rhs = simplify(userEq.right);
      const nextStateFull: MathState = {
        display: simplifiedDisplay,
        latex: `${exprToLatex(lhs)} = ${exprToLatex(rhs)}`,
        data: JSON.stringify(userEq),
      };

      const result = equationTransformationModule.validateStep(currentState, operation, nextStateFull);

      if (result.valid) {
        const opResult = applyAlgebraOperation(
          stateToEquation(currentState),
          selectedOp,
          opParam || ''
        );
        const desc = opResult?.description || operation.description;

        const solved = equationTransformationModule.isSolved(nextStateFull);
        setCurrentState(nextStateFull);
        setSteps(prev => [
          ...prev.slice(0, -1).map(s => ({ ...s })),
          { state: prev[prev.length - 1].state, operation: { ...operation, description: desc }, isValid: true },
          { state: nextStateFull },
        ]);
        setStepCount(prev => prev + 1);
        setIsComplete(solved);
        setUserEquation('');
        setOpParam('');
        if (solved) {
          setValidation({ valid: true, message: 'Exercise Complete! Equation solved.', isSolved: true });
        } else {
          setValidation({ valid: true, message: 'Correct! Apply the next operation.', isSolved: false });
        }
      } else {
        setValidation(result);
      }
    } catch {
      setValidation({ valid: false, message: 'Could not parse equation. Use format: expression = expression', isSolved: false });
    }
  }, [currentState, selectedOp, opParam, userEquation, currentOp]);

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

    const solved = equationTransformationModule.isSolved(newState);
    setCurrentState(newState);
    setSteps(prev => [
      ...prev.slice(0, -1).map(s => ({ ...s })),
      { state: prev[prev.length - 1].state, operation, isValid: true },
      { state: newState },
    ]);
    setStepCount(prev => prev + 1);
    setIsComplete(solved);
    setUserEquation('');
    setOpParam('');
  }, [currentState]);

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

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyOperation();
    }
  }, [handleApplyOperation]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">

      {/* ========================= HEADER ========================= */}
      <header className="sticky top-0 z-50 bg-slate-100 dark:bg-slate-900 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">

          <button
            onClick={onBack}
            className="flex items-center gap-1 px-2 cursor-pointer py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <FontAwesomeIcon icon={faAngleLeft} />
            Back
          </button>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-sm">
              <FontAwesomeIcon icon={faBullseye} />
              {question.topic}
            </div>

            <div className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-sm capitalize">
              {difficulty}
            </div>
          </div>
        </div>
      </header>

      {/* ========================= BODY ========================= */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 flex flex-col lg:flex-row gap-12">
        <main className="w-full lg:w-2xl lg:sticky lg:top-16">
          {/* Goal */}
          <section className="mb-6">
            <div className='flex gap-4 justify-between items-center'>
              <div>
                <div className="font-medium text-lg text-blue-500 dark:text-blue-300">
                  {question.targetDescription}
                </div>

                <div className="text-sm text-gray-500 space-y-1">
                  <p>Select an operation, enter a value if needed, then type the resulting equation.</p>
                </div>
              </div>
              <button
                onClick={handleNewProblem}
                className="flex items-center min-w-max gap-2 px-4 py-2 text-sm rounded-full bg-gray-400 cursor-pointer dark:bg-gray-500 text-white dark:text-gray-200 hover:opacity-90 transition-opacity"
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

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-200 dark:bg-blue-800/50 text-blue-600 dark:text-blue-300 text-sm">
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

        {/* ========================= HISTORY ========================= */}
        <aside>
          <div>
            {!isComplete && (
              <section className="mb-4">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold">
                    Solve the next step
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    Choose an operation and enter the resulting equation.
                  </p>
                </div>

                {/* Step 1 */}
                <div className="mb-3 font-medium">
                  1. Choose an operation
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
                  <div className="mb-6 rounded-2xl bg-blue-100 dark:bg-blue-950/20 px-4 py-3">
                    <div className="text-xs text-blue-500 mb-1">
                      Selected Operation
                    </div>

                    <div className="font-medium">
                      {currentOp.description}
                    </div>
                  </div>
                )}

                {currentOp?.needsParameter && (
                  <>
                    <div className="mb-3 font-medium">
                      2. Enter a value
                    </div>

                    <div className="mb-6">
                      <input
                        ref={paramRef}
                        type="text"
                        value={opParam}
                        onChange={(e) => setOpParam(e.target.value)}
                        placeholder={currentOp.parameterLabel || "Enter value"}
                        className="w-full h-12 px-4 text-lg rounded-xl bg-transparent border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </>
                )}

                <div className="mb-3 font-medium">
                  {currentOp?.needsParameter
                    ? "3. Enter the resulting equation"
                    : "2. Enter the resulting equation"}
                </div>

                <div className="flex flex-col md:flex-row gap-3">

                  <input
                    ref={eqRef}
                    type="text"
                    value={userEquation}
                    onChange={(e) => setUserEquation(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Example: 2x = 8"
                    className="w-full h-12 px-4 text-lg rounded-xl bg-transparent border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500"
                  />

                  <button
                    onClick={handleApplyOperation}
                    disabled={!userEquation.trim()}
                    className="h-12 px-4 min-w-max rounded-xl bg-green-500 dark:bg-green-700 text-white font-bold hover:bg-green-600 dark:hover:bg-green-800 transition-colors disabled:opacity-40"
                  >
                    <FontAwesomeIcon icon={faCheck} className='mr-1' />
                    Check
                  </button>
                </div>

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