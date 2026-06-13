import { MathModule, Difficulty, Question, MathState, Operation, ValidationResult, Hint, OperationType } from '../../engine/types';
import { generateQuestion, validateStep, getHint, isSolved, getAvailableOperations } from './engine';

export const equationTransformationModule: MathModule = {
  id: 'equation-transformation',
  title: 'Algebra: Single Variable',
  description: 'Solve equations through step-by-step transformations',
  icon: 'ƒ',
  generateQuestion(difficulty: Difficulty): Question {
    return generateQuestion(difficulty);
  },
  validateStep(currentState: MathState, operation: Operation, nextState: MathState): ValidationResult {
    return validateStep(currentState, operation, nextState);
  },
  getHint(currentState: MathState): Hint {
    return getHint(currentState);
  },
  isSolved(currentState: MathState): boolean {
    return isSolved(currentState);
  },
  getAvailableOperations(): OperationType[] {
    return getAvailableOperations();
  },
};
