'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { Difficulty, MathState, Operation, TransformationStep, ValidationResult, Hint, OperationType } from '@/lib/engine/types';
import { equationTransformationModule } from '@/lib/modules/algebra';
import { applyAlgebraOperation, stateToEquation, computeHint, equationToState } from '@/lib/modules/algebra/engine';
import { equationToString, parseEquation, simplify, exprToLatex, collectLikeTerms, exprEqual, Equation } from '@/lib/modules/algebra/expressions';
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


interface EquationGameScreenProps {
  difficulty: Difficulty;
  onBack: () => void;
}

type SolveMode = 'equation' | 'operation';

function normaliseEquation(eq: Equation): Equation {
  return { left: collectLikeTerms(eq.left), right: collectLikeTerms(eq.right) };
}

function eqStructEqual(a: Equation, b: Equation): boolean {
  return exprEqual(a.left, b.left) && exprEqual(a.right, b.right);
}

function normaliseOp(
  typeId: string,
  parameter: string,
  description: string,
  translationKey?: string,
  translationParams?: Record<string, string>
): { typeId: string; parameter: string; description: string; translationKey?: string; translationParams?: Record<string, string> } {
  const p = parseFloat(parameter);
  if (!isNaN(p) && p < 0 && !parameter.match(/[a-zA-Z]/)) {
    if (typeId === 'add_both') {
      const pos = String(-p);
      return { typeId: 'sub_both', parameter: pos, description: `Subtract ${pos} from both sides`, translationKey: 'operations.sub.history', translationParams: { param: pos } };
    }
    if (typeId === 'sub_both') {
      const pos = String(-p);
      return { typeId: 'add_both', parameter: pos, description: `Add ${pos} to both sides`, translationKey: 'operations.add.history', translationParams: { param: pos } };
    }
  }
  return { typeId, parameter, description, translationKey, translationParams };
}

function inferOperation(
  currentEq: ReturnType<typeof stateToEquation>,
  userEq: ReturnType<typeof parseEquation>,
): { typeId: string; parameter: string; description: string; translationKey?: string; translationParams?: Record<string, string> } | null {
  const userNorm = normaliseEquation(userEq);

  for (const opType of ['expand', 'collect'] as const) {
    const result = applyAlgebraOperation(currentEq, opType, '');
    if (result) {
      const rsNorm = normaliseEquation(result.result);
      if (eqStructEqual(rsNorm, userNorm) || (eqStructEqual({ left: rsNorm.right, right: rsNorm.left }, userNorm))) {
        return normaliseOp(opType, '', result.description, result.translationKey, result.translationParams as Record<string, string>);
      }
    }
  }

  const guessParams: string[] = [];
  for (let p = -20; p <= 20; p++) {
    if (p !== 0) guessParams.push(String(p));
  }
  ['x', 'y', 'z', 'a', 'b', 'c', 'v'].forEach(v => {
    for (let p = -10; p <= 10; p++) {
      if (p === 0) guessParams.push(v);
      else if (p === 1) guessParams.push(v);
      else if (p === -1) guessParams.push(`-${v}`);
      else guessParams.push(`${p}${v}`);
    }
  });

  for (const pStr of guessParams) {
    for (const opType of ['add_both', 'sub_both', 'mul_both', 'div_both'] as const) {
      const result = applyAlgebraOperation(currentEq, opType, pStr);
      if (result) {
        const rsNorm = normaliseEquation(result.result);
        if (eqStructEqual(rsNorm, userNorm) || (eqStructEqual({ left: rsNorm.right, right: rsNorm.left }, userNorm))) {
          return normaliseOp(opType, pStr, result.description, result.translationKey, result.translationParams as Record<string, string>);
        }
      }
    }
  }

  return null;
}

export default function EquationGameScreen({ difficulty, onBack }: EquationGameScreenProps) {
  const { t } = useI18n();
  const getTargetDescription = (desc: string) => {
    if (desc === 'Solve for x') return t('practice.solveForX');
    if (desc === 'Solve for the variable') return t('practice.solveForVariable');
    return desc;
  };

  const getOpLabel = (op: OperationType) => {
    switch (op.id) {
      case 'add_both': return t('operations.add.label');
      case 'sub_both': return t('operations.sub.label');
      case 'mul_both': return t('operations.mul.label');
      case 'div_both': return t('operations.div.label');
      case 'expand': return t('operations.expand.label');
      case 'collect': return t('operations.collect.label');
      default: return op.label;
    }
  };

  const getOpDesc = (op: OperationType) => {
    switch (op.id) {
      case 'add_both': return t('operations.add.desc');
      case 'sub_both': return t('operations.sub.desc');
      case 'mul_both': return t('operations.mul.desc');
      case 'div_both': return t('operations.div.desc');
      case 'expand': return t('operations.expand.desc');
      case 'collect': return t('operations.collect.desc');
      default: return op.description || '';
    }
  };

  const getOpParamLabel = (op: OperationType) => {
    switch (op.id) {
      case 'add_both': return t('operations.add.paramLabel');
      case 'sub_both': return t('operations.sub.paramLabel');
      case 'mul_both': return t('operations.mul.paramLabel');
      case 'div_both': return t('operations.div.paramLabel');
      default: return op.parameterLabel || '';
    }
  };

  const [question, setQuestion] = useState(() => equationTransformationModule.generateQuestion(difficulty));



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

  const insertSymbol = (value: string) => {
    setUserEquation(prev => prev + value);
  };

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
        data: JSON.stringify(userEq),
      };

      const operation: Operation = {
        typeId: inferred.typeId,
        parameter: inferred.parameter,
        description: inferred.description,
        translationKey: inferred.translationKey,
        translationParams: inferred.translationParams,
      };

      const solved = commitStep(nextStateFull, operation);
      if (solved) {
        setValidation({ valid: true, message: t('practice.validation.complete'), isSolved: true });
      } else {
        const opDesc = inferred.translationKey
          ? t(inferred.translationKey, inferred.translationParams || {}) as string !== inferred.translationKey
            ? t(inferred.translationKey, inferred.translationParams || {})
            : inferred.description
          : inferred.description;
        setValidation({ valid: true, message: `${t('practice.validation.correct')} ${opDesc}`, isSolved: false });
      }
    } catch {
      setValidation({ valid: false, message: t('practice.validation.cannotParse'), isSolved: false });
    }
  }, [currentState, userEquation, commitStep, t]);

  const handleOperationModeSubmit = useCallback(() => {
    setValidation(null);
    setHint(null);

    if (currentOp?.needsParameter && !opParam.trim()) {
      setValidation({ valid: false, message: t('practice.validation.requiresValue'), isSolved: false });
      return;
    }

    try {
      const eq = stateToEquation(currentState);
      const opResult = applyAlgebraOperation(eq, selectedOp, opParam || '');

      if (!opResult) {
        setValidation({ valid: false, message: t('practice.validation.cannotApply'), isSolved: false });
        return;
      }

      const newState = equationToState(opResult.result);
      const operation: Operation = {
        typeId: selectedOp,
        parameter: opParam,
        description: opResult.description,
        translationKey: opResult.translationKey,
        translationParams: opResult.translationParams as Record<string, string>,
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
  }, [currentState, selectedOp, opParam, currentOp, commitStep, t]);

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
      translationKey: opResult.translationKey,
      translationParams: opResult.translationParams as Record<string, string>,
    };

    commitStep(newState, operation);
  }, [currentState, commitStep]);

  const handleNewProblem = useCallback(() => {
    const q = equationTransformationModule.generateQuestion(difficulty);
    setQuestion(q);
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
                  {getTargetDescription(question.targetDescription)}
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

          <StepsPanel steps={steps} isComplete={isComplete} stepCount={stepCount} completionMessage={t('practice.equationSolved')} />

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
                              {getOpLabel(op)}
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
                          {getOpDesc(currentOp)}
                        </div>
                      </div>
                    )}

                    {currentOp?.needsParameter && (
                      <>
                        <div className="mb-3 font-medium">
                          {t('practice.enterValue')}
                        </div>

                        <div className="mb-3">
                          <input
                            ref={paramRef}
                            type="text"
                            value={opParam}
                            onChange={(e) => setOpParam(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleOperationModeSubmit(); } }}
                            placeholder={getOpParamLabel(currentOp) || t('practice.enterValuePlaceholder')}
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
