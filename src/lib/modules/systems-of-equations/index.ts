import { MathModule, Difficulty, Question, MathState, Operation, ValidationResult, Hint, OperationType } from '../../engine/types';
import { generateQuestion, getHint, isSolved, getAvailableOperations, validateStep as engineValidateStep } from './engine';

export const systemsOfEquationsModule: MathModule = {
  id: 'system-of-equations',
  title: 'Systems of Equations',
  description: 'Solve systems of equations using elimination and substitution',
  icon: '𝕊',
  generateQuestion(difficulty: Difficulty): Question {
    return generateQuestion(difficulty);
  },
  validateStep(currentState: MathState, operation: Operation, nextState: MathState): ValidationResult {
    return engineValidateStep(currentState, operation, nextState);
  },
  getHint(currentState: MathState): Hint {
    return getHint(currentState);
  },
  isSolved(currentState: MathState): boolean {
    return isSolved(currentState);
  },
  getAvailableOperations(state: MathState): OperationType[] {
    return getAvailableOperations(state);
  },
};
