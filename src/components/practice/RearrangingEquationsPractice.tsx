'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { Difficulty, MathState, Operation, TransformationStep, ValidationResult, Hint } from '@/lib/engine/types';
import { multivariableModule } from '@/lib/modules/multivariable';
import {
  applyMultivariableOperation,
  stateToEquation,
  getTargetVariable,
  getEquationFromState,
  computeHint,
} from '@/lib/modules/multivariable/engine';
import { equationToString, parseEquation, parseExpr, simplify, exprToLatex, collectLikeTerms, exprEqual, Equation, Expr } from '@/lib/modules/algebra/expressions';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotate, faCheck } from "@fortawesome/free-solid-svg-icons";
import { useI18n } from '@/i18n/I18nContext';
import PracticeHeader from './components/PracticeHeader';
import FloatingEquation from './components/FloatingEquation';
import StepsPanel from './components/StepsPanel';
import HintBanner from './components/HintBanner';
import ActionButtons from './components/ActionButtons';
import ValidationBanner from './components/ValidationBanner';
import NextProblemButton from './components/NextProblemButton';
import EquationKeyboard from './components/EquationKeyboard';
import ModeTabs from './components/ModeTabs';

interface MultivariableEquationScreenProps {
  difficulty: Difficulty;
  onBack: () => void;
}

type SolveMode = 'equation' | 'operation';

function toEq(left: Expr, right: Expr): Equation {
  return { left, right };
}

function normaliseOp(typeId: string, parameter: string, description: string): { typeId: string; parameter: string; description: string } {
  const p = parseFloat(parameter);
  if (!isNaN(p) && p < 0) {
    if (typeId === 'add_both') {
      const pos = String(-p);
      return { typeId: 'sub_both', parameter: pos, description: `Subtract ${pos} from both sides` };
    }
    if (typeId === 'sub_both') {
      const pos = String(-p);
      return { typeId: 'add_both', parameter: pos, description: `Add ${pos} to both sides` };
    }
  }
  return { typeId, parameter, description };
}

function inferOperation(
  currentEq: ReturnType<typeof stateToEquation>,
  userEq: ReturnType<typeof parseEquation>,
  targetVar: string,
): { typeId: string; parameter: string; description: string } | null {
  const userNorm = toEq(collectLikeTerms(userEq.left), collectLikeTerms(userEq.right));

  function match(result: { result: Equation } | null): boolean {
    if (!result) return false;
    const rsNorm = toEq(collectLikeTerms(result.result.left), collectLikeTerms(result.result.right));
    return (exprEqual(rsNorm.left, userNorm.left) && exprEqual(rsNorm.right, userNorm.right))
      || (exprEqual(rsNorm.left, userNorm.right) && exprEqual(rsNorm.right, userNorm.left));
  }

  for (const opType of ['expand', 'collect', 'isolate'] as const) {
    const result = applyMultivariableOperation(currentEq, opType, '', targetVar);
    if (match(result)) {
      return { typeId: opType, parameter: '', description: result!.description };
    }
  }

  for (let p = -20; p <= 20; p++) {
    if (p === 0) continue;
    for (const opType of ['add_both', 'sub_both', 'mul_both', 'div_both'] as const) {
      const result = applyMultivariableOperation(currentEq, opType, String(p), targetVar);
      if (match(result)) {
        return normaliseOp(opType, String(p), result!.description);
      }
    }
  }

  const currentStr = equationToString(currentEq);
  const eqParts = currentStr.split(' = ');
  if (eqParts.length === 2) {
    const allTerms = [...eqParts[0].split(/(?=[+-])/), ...eqParts[1].split(/(?=[+-])/)].map(t => t.trim());
    for (const term of allTerms) {
      if (term === '0' || term === '') continue;
      try {
        const cleanedTerm = term.replace(/^\+/, '').trim();
        if (!cleanedTerm) continue;
        const result = applyMultivariableOperation(currentEq, 'move_term', cleanedTerm, targetVar);
        if (match(result)) {
          return { typeId: 'move_term', parameter: cleanedTerm, description: result!.description };
        }
      } catch {
        continue;
      }
    }
  }

  return null;
}

export default function MultivariableEquationScreen({ difficulty, onBack }: MultivariableEquationScreenProps) {
  const { t } = useI18n();
  const [question, setQuestion] = useState(() => multivariableModule.generateQuestion(difficulty));
  const [currentState, setCurrentState] = useState<MathState>(question.initialState);
  const [targetVar, setTargetVar] = useState(() => getTargetVariable(question.initialState));
  const [steps, setSteps] = useState<TransformationStep[]>([
    { state: question.initialState },
  ]);
  const [solveMode, setSolveMode] = useState<SolveMode>('equation');
  const [selectedOp, setSelectedOp] = useState<string>('move_term');
  const [opParam, setOpParam] = useState('');
  const [userEquation, setUserEquation] = useState('');
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [hint, setHint] = useState<Hint | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const paramRef = useRef<HTMLInputElement>(null);
  const eqRef = useRef<HTMLInputElement>(null);

  const operations = useMemo(
    () => multivariableModule.getAvailableOperations(currentState),
    [currentState]
  );

  const currentOp = useMemo(
    () => operations.find(o => o.id === selectedOp),
    [operations, selectedOp]
  );

  const insertSymbol = (value: string) => {
    setUserEquation(prev => prev + value);
  };

  const commitStep = useCallback(
    (nextStateFull: MathState, operation: Operation): boolean => {
      const solved = multivariableModule.isSolved(nextStateFull);
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
      const currentEq = getEquationFromState(currentState);
      const inferred = inferOperation(currentEq, userEq, targetVar);

      if (!inferred) {
        setValidation({
          valid: false,
          message: t('practice.validation.noValidTransformation'),
          isSolved: false,
        });
        return;
      }

      const lhs = simplify(userEq.left);
      const rhs = simplify(userEq.right);
      const nextStateFull: MathState = {
        display: equationToString({ left: lhs, right: rhs }),
        latex: `${exprToLatex(lhs)} = ${exprToLatex(rhs)}`,
        data: JSON.stringify({
          equation: { left: lhs, right: rhs },
          targetVariable: targetVar,
        }),
      };

      const operation: Operation = {
        typeId: inferred.typeId,
        parameter: inferred.parameter,
        description: inferred.description,
      };

      const solved = commitStep(nextStateFull, operation);
      if (solved) {
        setValidation({ valid: true, message: t('practice.validation.complete'), isSolved: true });
      } else {
        setValidation({ valid: true, message: t('practice.validation.correct').replace('{description}', inferred.description), isSolved: false });
      }
    } catch {
      setValidation({ valid: false, message: t('practice.validation.cannotParse'), isSolved: false });
    }
  }, [currentState, userEquation, commitStep, targetVar, t]);

  const handleOperationModeSubmit = useCallback(() => {
    setValidation(null);
    setHint(null);

    if (currentOp?.needsParameter && !opParam.trim()) {
      setValidation({ valid: false, message: t('practice.validation.requiresValue'), isSolved: false });
      return;
    }

    try {
      const eq = getEquationFromState(currentState);

      const param = opParam || '';
      if (currentOp?.id === 'move_term') {
        try {
          parseExpr(param);
        } catch {
          setValidation({ valid: false, message: t('practice.validation.cannotParseTerm'), isSolved: false });
          return;
        }
      }

      const opResult = applyMultivariableOperation(eq, selectedOp, param, targetVar);

      if (!opResult) {
        setValidation({ valid: false, message: t('practice.validation.cannotApply'), isSolved: false });
        return;
      }

      const newState: MathState = {
        display: equationToString(opResult.result),
        latex: equationToString(opResult.result),
        data: JSON.stringify({
          equation: opResult.result,
          targetVariable: targetVar,
        }),
      };
      newState.latex = `${exprToLatex(opResult.result.left)} = ${exprToLatex(opResult.result.right)}`;

      const operation: Operation = {
        typeId: selectedOp,
        parameter: param,
        description: opResult.description,
      };

      const solved = commitStep(newState, operation);
      if (solved) {
        setValidation({ valid: true, message: t('practice.validation.complete'), isSolved: true });
      } else {
        setValidation({ valid: true, message: t('practice.validation.appliedSuccessfully'), isSolved: false });
      }
    } catch {
      setValidation({ valid: false, message: t('practice.validation.errorApplying'), isSolved: false });
    }
  }, [currentState, selectedOp, opParam, currentOp, commitStep, targetVar, t]);

  const handleGetHint = useCallback(() => {
    const h = multivariableModule.getHint(currentState);
    setHint(h);
  }, [currentState]);

  const handleSkip = useCallback(() => {
    setHint(null);
    setValidation(null);

    const eq = getEquationFromState(currentState);
    const computed = computeHint(eq, targetVar);
    if (!computed.opType) return;

    const param = computed.parameter;
    if (!computed.parameter && (computed.opType === 'add_both' || computed.opType === 'sub_both' || computed.opType === 'mul_both' || computed.opType === 'div_both')) return;

    const opResult = applyMultivariableOperation(eq, computed.opType, param || '', targetVar);
    if (!opResult) return;

    const newState: MathState = {
      display: equationToString(opResult.result),
      latex: `${exprToLatex(opResult.result.left)} = ${exprToLatex(opResult.result.right)}`,
      data: JSON.stringify({
        equation: opResult.result,
        targetVariable: targetVar,
      }),
    };
    const operation: Operation = {
      typeId: computed.opType,
      parameter: param,
      description: opResult.description,
    };

    commitStep(newState, operation);
  }, [currentState, commitStep, targetVar]);

  const handleNewProblem = useCallback(() => {
    const q = multivariableModule.generateQuestion(difficulty);
    setQuestion(q);
    setCurrentState(q.initialState);
    setTargetVar(getTargetVariable(q.initialState));
    setSteps([{ state: q.initialState }]);
    setValidation(null);
    setHint(null);
    setIsComplete(false);
    setStepCount(0);
    setUserEquation('');
    setOpParam('');
  }, [difficulty]);

  return (
    <div className="min-h-dvh text-slate-900 dark:text-slate-100">

      <PracticeHeader topic={question.topic} difficulty={difficulty} onBack={onBack} />

      {/* ========================= BODY ========================= */}
      <div className="max-w-5xl mx-auto w-[90%] py-8 flex flex-col lg:flex-row gap-12">
        <main className="w-full">
          {/* Goal */}
          <section className="mb-6">
            <div className='flex gap-4 justify-between items-center'>
              <div>
                <div className="font-bold text-xl" suppressHydrationWarning>
                  {t('practice.solveForX').replace('{targetVar}', '')} <span className="font-bold text-2xl font-serif text-blue-500 dark:text-blue-300" suppressHydrationWarning>{targetVar}</span>
                </div>

                <div className="text-sm text-gray-500 space-y-1">
                  <p>{t('practice.instruction')}</p>
                </div>
              </div>
              <button
                onClick={handleNewProblem}
                className="flex items-center min-w-max gap-2 px-4 py-2 text-sm rounded-full bg-gray-200 cursor-pointer dark:bg-gray-800 text-slate-600 dark:text-gray-300 hover:opacity-90 transition-opacity"
              >
                <FontAwesomeIcon icon={faRotate} />
                {t('practice.newProblem')}
              </button>
            </div>
          </section>

          <FloatingEquation title={t('practice.currentEquation')} latex={currentState.latex} />

          <StepsPanel steps={steps} isComplete={isComplete} stepCount={stepCount} completionMessage={t('practice.variableIsolated')} />

          {hint && <HintBanner hint={hint} />}

          {!isComplete && <ActionButtons onHint={handleGetHint} onSkip={handleSkip} />}
        </main>

        {/* ========================= SOLVE PANEL ========================= */}
        <aside className='lg:w-4xl'>
          <div className='lg:sticky lg:top-18'>
            {!isComplete && (
              <section className="mb-4">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold">
                    {t('practice.solveNextStep')}
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    {t('practice.chooseMode')}
                  </p>
                </div>

                <ModeTabs mode={solveMode} onChange={setSolveMode} onClearValidation={() => setValidation(null)} />

                {/* ========== EQUATION MODE ========== */}
                {solveMode === 'equation' && (
                  <>
                    <div className="mb-3 font-medium">
                      {t('practice.enterResult')}
                    </div>

                    <div className="flex flex-row gap-3">
                      <input
                        ref={eqRef}
                        type="text"
                        value={userEquation}
                        onChange={(e) => setUserEquation(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleEquationModeSubmit(); } }}
                        placeholder={t('practice.examplePlaceholder')}
                        className="w-full h-12 px-4 text-lg rounded-xl bg-gray-100 dark:bg-slate-900 focus:outline-none placeholder:text-slate-400"
                      />

                      <button
                        onClick={handleEquationModeSubmit}
                        disabled={!userEquation.trim()}
                        className="h-12 px-4 min-w-max rounded-xl bg-green-500 dark:bg-green-700 text-white font-bold hover:bg-green-600 dark:hover:bg-green-800 transition-colors disabled:opacity-40 cursor-pointer"
                      >
                        <FontAwesomeIcon icon={faCheck} className='mr-1' />
                        {t('practice.check')}
                      </button>
                    </div>

                    <EquationKeyboard onInsert={insertSymbol} onClear={() => setUserEquation('')} onDelete={() => setUserEquation(prev => prev.slice(0, -1))} />
                  </>
                )}

                {/* ========== OPERATION MODE ========== */}
                {solveMode === 'operation' && (
                  <>
                    <div className="mb-3 font-medium">
                      {t('practice.chooseOperation')}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
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
                              {t(`operations.${op.id}.label`)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {currentOp && (
                      <div className="mb-6 rounded-2xl">
                        <div className="text-xs text-slate-600 dark:text-slate-200 mb-1">
                          {t('practice.selectedOperation')}
                        </div>

                        <div className="font-medium text-slate-500 dark:text-slate-300">
                          {currentOp.description}
                        </div>
                      </div>
                    )}

                    {currentOp?.needsParameter && (
                      <>
                        <div className="mb-3 font-medium">
                          {currentOp.id === 'move_term' ? t('practice.enterTermToMove') : t('practice.enterValue')}
                        </div>

                        <div className="mb-3">
                          <input
                            ref={paramRef}
                            type="text"
                            value={opParam}
                            onChange={(e) => setOpParam(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleOperationModeSubmit(); } }}
                            placeholder={t(`operations.${currentOp.id}.paramLabel`) || t('practice.enterValuePlaceholder')}
                            className="w-full h-12 px-4 text-lg rounded-xl bg-gray-100 dark:bg-slate-900 focus:outline-none placeholder:text-slate-400"
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
                      {t('practice.apply')}
                    </button>
                  </>
                )}
              </section>
            )}

            {validation && <ValidationBanner validation={validation} />}
            {isComplete && <NextProblemButton onClick={handleNewProblem} />}
          </div>
        </aside>

      </div>

    </div>
  );
}
