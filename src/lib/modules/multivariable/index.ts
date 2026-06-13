import { MathModule, Difficulty, Question, MathState, Operation, ValidationResult, Hint, OperationType } from '../../engine/types';
import { generateQuestion, getHint, isSolved, getAvailableOperations, getTargetVariable, validateStep as engineValidateStep } from './engine';

export const multivariableModule: MathModule = {
  id: 'multivariable-equation-system',
  title: 'Rearranging Equations',
  description: 'Solve equations with multiple variables step by step',
  icon: '𝓍',
  generateQuestion(difficulty: Difficulty): Question {
    return generateQuestion(difficulty);
  },
  validateStep(currentState: MathState, operation: Operation, nextState: MathState): ValidationResult {
    const targetVar = getTargetVariable(currentState);
    return engineValidateStep(currentState, operation, nextState, targetVar);
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
