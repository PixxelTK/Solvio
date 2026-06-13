import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export type Difficulty = 'beginner' | 'easy' | 'intermediate' | 'advanced' | 'random';

export interface OperationType {
  id: string;
  label: string;
  description?: string;
  needsParameter: boolean;
  icon?: IconDefinition;
  parameterLabel?: string;
  parameterType?: "number" | "expression";
}

export interface MathModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  generateQuestion(difficulty: Difficulty): Question;
  validateStep(
    currentState: MathState,
    operation: Operation,
    nextState: MathState
  ): ValidationResult;
  getHint(currentState: MathState): Hint;
  isSolved(currentState: MathState): boolean;
  getAvailableOperations(state: MathState): OperationType[];
}

export interface Question {
  id: string;
  initialState: MathState;
  targetDescription: string;
  difficulty: Difficulty;
  topic: string;
}

export interface MathState {
  display: string;
  latex: string;
  data: string;
}

export interface Operation {
  typeId: string;
  parameter?: string;
  description: string;
}

export interface ValidationResult {
  valid: boolean;
  message: string;
  isSolved: boolean;
}

export interface Hint {
  operationDescription: string;
  level: 'gentle' | 'moderate' | 'specific';
}

export interface TransformationStep {
  state: MathState;
  operation?: Operation;
  isValid?: boolean;
}
