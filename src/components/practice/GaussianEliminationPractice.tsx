'use client';

import { useState, useCallback, useRef } from 'react';
import { Difficulty, MathState, Operation, TransformationStep, ValidationResult, Hint } from '@/lib/engine/types';
import { linearAlgebraModule, matrixToState, stateToData, deepCopy, AugmentedMatrix, applyRowOperation, computeHint } from '@/lib/modules/linear-algebra';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRotate,
  faCheck,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import { useI18n } from '@/i18n/I18nContext';
import PracticeHeader from './components/PracticeHeader';
import FloatingEquation from './components/FloatingEquation';
import StepsPanel from './components/StepsPanel';
import HintBanner from './components/HintBanner';
import ActionButtons from './components/ActionButtons';
import ValidationBanner from './components/ValidationBanner';
import NextProblemButton from './components/NextProblemButton';

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
  const { t } = useI18n();
  const [question] = useState(() => linearAlgebraModule.generateQuestion(difficulty));
  const [currentState, setCurrentState] = useState<MathState>(question.initialState);
  const [steps, setSteps] = useState<TransformationStep[]>([
    { state: question.initialState },
  ]);
  const [selectedOp, setSelectedOp] = useState<string>('row_add');
  const [opParam, setOpParam] = useState('');
  const [, setUserMatrix] = useState<AugmentedMatrix>(() => stateToData(question.initialState).matrix);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [hint, setHint] = useState<Hint | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [stepCount, setStepCount] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  const opInputRef = useRef<HTMLInputElement>(null);

  const operations = linearAlgebraModule.getAvailableOperations(currentState);
  const help = OPERATION_HELP[selectedOp];

  const handleApplyOperation = useCallback(() => {
    if (!opParam.trim()) return;
    setValidation(null);
    setHint(null);

    const opResult = applyRowOperation(stateToData(currentState).matrix, selectedOp, opParam);
    if (!opResult) {
      const h = OPERATION_HELP[selectedOp];
      setValidation({ valid: false, message: `${t('practice.validation.invalidFormat').replace('{syntax}', h.syntax).replace('{examples}', h.examples.join(', '))}`, isSolved: false });
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
        setValidation({ valid: true, message: t('practice.validation.done'), isSolved: true });
      } else {
        setValidation({ valid: true, message: t('practice.validation.correct'), isSolved: false });
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

      <PracticeHeader topic={question.topic} difficulty={difficulty} onBack={onBack} />

      <div className="max-w-5xl mx-auto w-[90%] py-8 flex flex-col lg:flex-row gap-12">
        <main className="w-full">
          <section className="mb-6">
            <div className="flex gap-4 justify-between items-center">
              <div>
                <div className="font-bold text-xl">
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

            <button
              onClick={() => setShowGuide(prev => !prev)}
              className="mt-3 text-sm text-blue-500 hover:text-blue-600 cursor-pointer flex items-center gap-1"
            >
              <FontAwesomeIcon icon={showGuide ? faChevronUp : faChevronDown} className="text-xs" />
              {showGuide ? t('practice.rrefGuide.hide') : t('practice.rrefGuide.whatIs')}
            </button>

            {showGuide && (
              <div className="mt-2 rounded-2xl bg-blue-50 dark:bg-blue-950/20 px-5 py-4 text-sm text-slate-600 dark:text-slate-300 space-y-3">
                <p className="font-medium text-slate-800 dark:text-slate-100">{t('practice.rrefGuide.rules')}</p>
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>{t('practice.rrefGuide.rule1')}</li>
                  <li>The first non-zero number in each row (the <strong>pivot</strong>) is <strong>1</strong>.</li>
                  <li>{t('practice.rrefGuide.rule3')}</li>
                  <li>All other entries in a pivot column are <strong>0</strong>.</li>
                </ol>
                <p className="text-xs text-slate-400 dark:text-slate-500 pt-1">
                  {t('practice.rrefGuide.tip')}
                </p>
              </div>
            )}
          </section>

          <FloatingEquation title={t('practice.currentMatrix')} latex={currentState.latex} size="text-xl sm:text-3xl" />

          <StepsPanel steps={steps} isComplete={isComplete} stepCount={stepCount} completionMessage={t('practice.matrixInRref')} />

          {hint && <HintBanner hint={hint} />}

          {!isComplete && <ActionButtons onHint={handleGetHint} onSkip={handleSkip} />}
        </main>

        <aside className="lg:w-5xl">
          <div className='lg:sticky lg:top-18'>
            {!isComplete && (
              <section className="mb-4">
                <div className="mb-6">
                  <h2 className="text-xl font-semibold">{t('practice.applyOperation')}</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {t('practice.selectRowOp')}
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
                        <span className="font-medium text-sm">{t(`operations.${op.id}.label`)}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {help && (
                  <div className="mb-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 px-4 py-3 space-y-2">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {t(`operations.${selectedOp}.explanation`)}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-400 dark:text-slate-500">{t('practice.format')}</span>
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-200">{help.syntax}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-400 dark:text-slate-500">{t('practice.examples')}</span>
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
                    placeholder={help?.examples[0] || t('practice.enterOperation')}
                    className="w-full h-12 px-4 text-lg rounded-xl bg-gray-100 dark:bg-slate-900 focus:outline-none placeholder:text-slate-400"
                    aria-label="Row operation"
                  />
                  <button
                    onClick={handleApplyOperation}
                    disabled={!opParam.trim()}
                    className="h-12 px-6 min-w-max rounded-xl bg-green-500 dark:bg-green-700 text-white font-bold hover:bg-green-600 dark:hover:bg-green-800 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faCheck} className="mr-1" />
                    {t('practice.apply')}
                  </button>
                </div>
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
