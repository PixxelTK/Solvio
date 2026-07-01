'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { Difficulty, MathState, Operation, TransformationStep, ValidationResult, Hint } from '@/lib/engine/types';
import { systemsOfEquationsModule } from '@/lib/modules/systems-of-equations';
import {
  stateToData, dataToState,
  previewOperation, computeNextStep, getEnabledCategories,
  CATEGORIES, TARGETS,
  OperationCategory,
} from '@/lib/modules/systems-of-equations/engine';
import { simplify, collectLikeTerms, expand, exprToLatex, Equation } from '@/lib/modules/algebra/expressions';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotate, faCheck } from "@fortawesome/free-solid-svg-icons";
import { useI18n } from '@/i18n/I18nContext';
import PracticeHeader from './components/PracticeHeader';
import { EquationCard } from '../EquationCard';
import StepsPanel from './components/StepsPanel';
import HintBanner from './components/HintBanner';
import ActionButtons from './components/ActionButtons';
import ValidationBanner from './components/ValidationBanner';
import NextProblemButton from './components/NextProblemButton';
import MathDisplay from '../MathDisplay';
import FloatingEquation from './components/FloatingEquation';

interface SystemsPracticeProps {
  difficulty: Difficulty;
  onBack: () => void;
}

export default function SystemsOfEquationsPractice({ difficulty, onBack }: SystemsPracticeProps) {
  const { t } = useI18n();
  const [question, setQuestion] = useState(() => systemsOfEquationsModule.generateQuestion(difficulty));
  const [currentState, setCurrentState] = useState<MathState>(question.initialState);
  const [currentData, setCurrentData] = useState(() => stateToData(question.initialState));
  const [steps, setSteps] = useState<TransformationStep[]>([
    { state: question.initialState },
  ]);
  const [selectedCategory, setSelectedCategory] = useState<OperationCategory>('add');
  const [selectedTarget, setSelectedTarget] = useState<string>('add_eq1_eq2');
  const [opParam, setOpParam] = useState('');
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [hint, setHint] = useState<Hint | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const paramRef = useRef<HTMLInputElement>(null);

  const enabledCategories = useMemo(() => getEnabledCategories(currentData), [currentData]);

  const currentTargets = TARGETS[selectedCategory];

  const needsParam = currentTargets.find(t => t.id === selectedTarget)?.needsParameter ?? false;

  const preview = useMemo(() => {
    if (isComplete) return null;
    try {
      return previewOperation(stateToData(currentState), selectedCategory, selectedTarget, opParam);
    } catch {
      return null;
    }
  }, [currentState, selectedCategory, selectedTarget, opParam, isComplete]);

  const updateState = useCallback((newState: MathState, operation: Operation): boolean => {
    const solved = systemsOfEquationsModule.isSolved(newState);
    setCurrentState(newState);
    setCurrentData(stateToData(newState));
    setSteps(prev => [
      ...prev.slice(0, -1).map(s => ({ ...s })),
      { state: prev[prev.length - 1].state, operation, isValid: true },
      { state: newState },
    ]);
    setStepCount(prev => prev + 1);
    setIsComplete(solved);
    setOpParam('');
    return solved;
  }, []);

  const handleApply = useCallback(() => {
    setValidation(null);
    setHint(null);

    if (needsParam && !opParam.trim()) {
      setValidation({ valid: false, message: t('practice.validation.requiresValue'), isSolved: false });
      return;
    }

    if (!preview) {
      setValidation({ valid: false, message: t('practice.validation.cannotApply'), isSolved: false });
      return;
    }

    const operation: Operation = {
      typeId: selectedTarget,
      parameter: opParam,
      translationKey: preview.translationKey,
      translationParams: preview.translationParams as Record<string, string>,
    };

    const newState = dataToState(preview.newData);
    const solved = updateState(newState, operation);
    if (solved) {
      setValidation({ valid: true, message: t('practice.validation.complete'), isSolved: true });
    } else {
      const opDesc = preview.translationKey
        ? t(preview.translationKey, preview.translationParams || {}) as string !== preview.translationKey
          ? t(preview.translationKey, preview.translationParams || {})
          : ''
        : '';
      setValidation({ valid: true, message: `${t('practice.validation.correct')} ${opDesc}`, isSolved: false });
    }
  }, [preview, selectedTarget, opParam, needsParam, updateState, t]);

  const handleGetHint = useCallback(() => {
    const h = systemsOfEquationsModule.getHint(currentState);
    setHint(h);
  }, [currentState]);

  const handleSkip = useCallback(() => {
    setValidation(null);
    setHint(null);

    const data = stateToData(currentState);
    const next = computeNextStep(data);
    if (next) {
      const result = previewOperation(data, next.category, next.targetId, next.param);
      if (result) {
        const operation: Operation = {
          typeId: next.targetId,
          parameter: next.param,
          translationKey: result.translationKey,
          translationParams: result.translationParams as Record<string, string>,
        };
        const newState = dataToState(result.newData);
        updateState(newState, operation);
      }
    }
  }, [currentState, updateState]);

  const handleNewProblem = useCallback(() => {
    const q = systemsOfEquationsModule.generateQuestion(difficulty);
    setQuestion(q);
    setCurrentState(q.initialState);
    setCurrentData(stateToData(q.initialState));
    setSteps([{ state: q.initialState }]);
    setValidation(null);
    setHint(null);
    setIsComplete(false);
    setStepCount(0);
    setOpParam('');
    setSelectedCategory('add');
    setSelectedTarget('add_eq1_eq2');
  }, [difficulty]);

  const isSolved = currentData.solvedX !== null && currentData.solvedY !== null;

  const displayEq = (eq: Equation) => {
    const left = collectLikeTerms(expand(simplify(eq.left)));
    const right = collectLikeTerms(expand(simplify(eq.right)));
    return `${exprToLatex(left)} = ${exprToLatex(right)}`;
  };

  const systemLatex = `\\begin{cases} ${displayEq(currentData.eq1)} \\quad\\textcolor{gray}{\\footnotesize (1)} \\\\ ${displayEq(currentData.eq2)} \\quad\\textcolor{gray}{\\footnotesize (2)} \\end{cases}`;

  let previewSystemLatex = '';
  if (preview) {
    previewSystemLatex = `\\begin{cases} ${displayEq(preview.newData.eq1)} \\quad\\textcolor{gray}{\\footnotesize (1)} \\\\ ${displayEq(preview.newData.eq2)} \\quad\\textcolor{gray}{\\footnotesize (2)} \\end{cases}`;
  }

  return (
    <div className="min-h-dvh text-slate-900 dark:text-slate-100">
      <PracticeHeader topic={question.topic} difficulty={difficulty} onBack={onBack} />

      <div className="max-w-5xl mx-auto w-[90%] py-8 flex flex-col lg:flex-row gap-12">
        <main className="w-full min-w-0 overflow-x-hidden">
          <section className="mb-6">
            <div className="flex gap-4 justify-between items-center">
              <div>
                <div className="font-bold text-xl" suppressHydrationWarning>
                  {question.targetDescription}
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

          <div className="mb-6" suppressHydrationWarning>
            {isSolved ? (
              <EquationCard title={t('practice.systemSolved')} latex={`x = ${currentData.solvedX} \\quad y = ${currentData.solvedY}`} />
            ) : (
              <FloatingEquation size='text-xl sm:text-3xl' title={t('practice.currentSystem')} latex={systemLatex} />
            )}
          </div>

          <StepsPanel steps={steps} isComplete={isComplete} stepCount={stepCount} completionMessage={t('practice.systemSolved')} />

          {hint && <HintBanner hint={hint} />}

          {!isComplete && <ActionButtons onHint={handleGetHint} onSkip={handleSkip} />}
        </main>

        <aside className="lg:w-4xl">
          <div className="lg:sticky lg:top-18">
            {!isComplete && (
              <section className="mb-4">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold">{t('practice.solveNextStep')}</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {currentData.solvedX !== null || currentData.solvedY !== null
                      ? t('practice.systems.substituteKnown') || 'Substitute the known variable into the other equation.'
                      : t('practice.systems.chooseOperation') || 'Choose an operation to eliminate a variable.'}
                  </p>
                </div>

                {/* ---- Operation Categories ---- */}
                <div className="mb-2 text-xs text-slate-500 font-medium uppercase tracking-wide">
                  {t('practice.systems.operationCategory') || 'Operation'}
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {CATEGORIES.map(cat => {
                    const enabled = enabledCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          if (!enabled) return;
                          setSelectedCategory(cat.id);
                          setSelectedTarget(TARGETS[cat.id][0]?.id ?? '');
                          setOpParam('');
                          setValidation(null);
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer
                          ${!enabled ? 'opacity-30 cursor-not-allowed' : ''}
                          ${selectedCategory === cat.id
                            ? 'bg-blue-400 dark:bg-blue-900 text-white'
                            : 'bg-slate-200 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }
                        `}
                      >
                        {t(`systems.categories.${cat.id}.label`) || cat.label}
                      </button>
                    );
                  })}
                </div>

                {/* ---- Targets ---- */}
                <div className="mb-2 text-xs text-slate-500 font-medium uppercase tracking-wide">
                  {t('practice.systems.operationTarget') || 'Target'}
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {currentTargets.map(tObj => (
                    <button
                      key={tObj.id}
                      onClick={() => {
                        setSelectedTarget(tObj.id);
                        setOpParam('');
                        setValidation(null);
                        if (tObj.needsParameter && paramRef.current) {
                          paramRef.current.focus();
                        }
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer
                        ${selectedTarget === tObj.id
                          ? 'bg-blue-400 dark:bg-blue-900 text-white'
                          : 'bg-slate-200 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }
                      `}
                    >
                      {t(`systems.targets.${tObj.id}.label`) || tObj.label}
                    </button>
                  ))}
                </div>

                {/* ---- Parameter input ---- */}
                {needsParam && (
                  <>
                    <div className="mb-1 text-xs text-slate-500 font-medium uppercase tracking-wide">
                      {t(`systems.targets.${selectedTarget}.paramLabel`) || currentTargets.find(tObj => tObj.id === selectedTarget)?.parameterLabel || 'Value'}
                    </div>
                    <div className="mb-4">
                      <input
                        ref={paramRef}
                        type="text"
                        value={opParam}
                        onChange={(e) => setOpParam(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleApply();
                          }
                        }}
                        placeholder={t('practice.systems.enterNumber') || "Enter a number (n)"}
                        className="w-full h-12 px-4 text-lg rounded-xl bg-gray-100 dark:bg-slate-900 focus:outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </>
                )}

                {/* ---- Preview ---- */}
                {preview && (
                  <div className="mb-4 p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700" suppressHydrationWarning>
                    <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-2">
                      {t('practice.preview') || 'Preview'}
                    </div>
                    <MathDisplay latex={previewSystemLatex} displayMode />
                  </div>
                )}

                {/* ---- Apply ---- */}
                <button
                  onClick={handleApply}
                  disabled={needsParam && !opParam.trim()}
                  className="h-12 px-6 min-w-max rounded-xl bg-green-500 dark:bg-green-700 text-white font-bold hover:bg-green-600 dark:hover:bg-green-800 transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <FontAwesomeIcon icon={faCheck} className="mr-1" />
                  {t('practice.apply')}
                </button>
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
