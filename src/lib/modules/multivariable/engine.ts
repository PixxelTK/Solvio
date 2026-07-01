import { faPlus, faMinus, faXmark, faDivide, faArrowRight, faCrosshairs } from '@fortawesome/free-solid-svg-icons';
import { Difficulty, MathState, Operation, OperationType, ValidationResult, Hint, Question } from '../../engine/types';
import {
  Expr, Equation, num, variable, add, sub, mul, div,
  isNum, isVar, isAdd, isSub, isMul, isDiv, isNeg,
  simplify, expand, collectLikeTerms, equationsEquivalent,
  equationToString, equationToLatex, parseEquation, parseExpr,
  equationToJson, jsonToEquation,
  exprEqual, getVariables, evaluate,
  collectTerms, extractTerms, termsToExpr, Term,
} from '../algebra/expressions';
import { hasLikeTerms } from '../algebra/engine';

interface MultivariableProblem {
  equation: Equation;
  targetVariable: string;
  solutionPath: SolutionStep[];
  targetDescription: string;
}

interface SolutionStep {
  operationType: string;
  parameter?: string;
  description: string;
  resultEquation: Equation;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randNonZero(min: number, max: number): number {
  let v;
  do { v = randInt(min, max); } while (v === 0);
  return v;
}

export const OPERATION_TYPES: OperationType[] = [
  {
    id: "add_both",
    label: "Add",
    description: "Add the same value to both sides.",
    icon: faPlus,
    needsParameter: true,
    parameterLabel: "Example: 3",
    parameterType: "number",
  },
  {
    id: "sub_both",
    label: "Subtract",
    description: "Subtract the same value from both sides.",
    icon: faMinus,
    needsParameter: true,
    parameterLabel: "Example: 2",
    parameterType: "number",
  },
  {
    id: "mul_both",
    label: "Multiply",
    description: "Multiply both sides by the same value.",
    icon: faXmark,
    needsParameter: true,
    parameterLabel: "Example: 5",
    parameterType: "number",
  },
  {
    id: "div_both",
    label: "Divide",
    description: "Divide both sides by the same non-zero value.",
    icon: faDivide,
    needsParameter: true,
    parameterLabel: "Example: 4",
    parameterType: "number",
  },
  {
    id: "move_term",
    label: "Move Term",
    description: "Move a term from one side to the other.",
    icon: faArrowRight,
    needsParameter: true,
    parameterLabel: "Example: 3x",
    parameterType: "expression",
  },
  {
    id: "expand",
    label: "Expand",
    description: "Distribute multiplication and remove parentheses.",
    needsParameter: false,
  },
  {
    id: "collect",
    label: "Combine like terms",
    description: "Combine like terms into a simpler expression.",
    needsParameter: false,
  },
  {
    id: "isolate",
    label: "Isolate",
    description: "Collect all terms with the target variable on one side.",
    icon: faCrosshairs,
    needsParameter: false,
  },
];

function getVariableCoefficientInExpr(e: Expr, targetVar: string): number | null {
  const terms = extractTerms(e);
  const targetTerms = terms.filter(t => t.variable === targetVar);
  if (targetTerms.length === 0) return null;
  if (targetTerms.length === 1) return targetTerms[0].coefficient;
  return targetTerms.reduce((sum, t) => sum + t.coefficient, 0);
}

function isTargetVariableSolved(eq: Equation, targetVar: string): boolean {
  const left = collectLikeTerms(eq.left);
  const right = collectLikeTerms(eq.right);

  const leftVars = getVariables(left);
  const rightVars = getVariables(right);

  const leftHas = leftVars.has(targetVar);
  const rightHas = rightVars.has(targetVar);

  if (leftHas && rightHas) return false;
  if (!leftHas && !rightHas) return false;

  const targetSide = leftHas ? left : right;
  const otherSide = leftHas ? right : left;
  const otherVars = getVariables(otherSide);

  if (otherVars.has(targetVar)) return false;

  const coeff = getVariableCoefficientInExpr(targetSide, targetVar);
  if (coeff === null || coeff !== 1) return false;

  const targetTerms = extractTerms(targetSide).filter(t => t.variable === targetVar);
  if (targetTerms.length !== 1) return false;
  if (targetTerms[0].coefficient !== 1) return false;

  const nonTargetTerms = extractTerms(targetSide).filter(t => t.variable !== targetVar);
  if (nonTargetTerms.length > 0) return false;

  return true;
}

export function applyMultivariableOperation(
  eq: Equation,
  opType: string,
  param: string,
  targetVar?: string,
): { result: Equation; description?: string; translationKey?: string; translationParams?: Record<string, string> } | null {
  switch (opType) {
    case 'add_both': {
      const p = parseFloat(param);
      if (isNaN(p)) return null;
      const newLeft = collectLikeTerms(simplify(add(eq.left, num(p))));
      const newRight = collectLikeTerms(simplify(add(eq.right, num(p))));
      return { result: { left: newLeft, right: newRight }, translationKey: 'operations.add_both.history', translationParams: { param: String(p) } };
    }
    case 'sub_both': {
      const p = parseFloat(param);
      if (isNaN(p)) return null;
      const newLeft = collectLikeTerms(simplify(sub(eq.left, num(p))));
      const newRight = collectLikeTerms(simplify(sub(eq.right, num(p))));
      return { result: { left: newLeft, right: newRight }, translationKey: 'operations.sub_both.history', translationParams: { param: String(p) } };
    }
    case 'mul_both': {
      const p = parseFloat(param);
      if (isNaN(p) || p === 0) return null;
      const newEq: Equation = { left: simplify(mul(eq.left, num(p))), right: simplify(mul(eq.right, num(p))) };
      return { result: newEq, translationKey: 'operations.mul_both.history', translationParams: { param: String(p) } };
    }
    case 'div_both': {
      const p = parseFloat(param);
      if (isNaN(p) || p === 0) return null;
      const newEq: Equation = { left: simplify(div(eq.left, num(p))), right: simplify(div(eq.right, num(p))) };
      return { result: newEq, translationKey: 'operations.div_both.history', translationParams: { param: String(p) } };
    }
    case 'move_term': {
      try {
        const termExpr = parseExpr(param);
        const newLeft = collectLikeTerms(simplify(sub(eq.left, termExpr)));
        const newRight = collectLikeTerms(simplify(sub(eq.right, termExpr)));
        const eqS = { left: simplify(eq.left), right: simplify(eq.right) };
        const resS = { left: simplify(newLeft), right: simplify(newRight) };
        if (exprEqual(resS.left, eqS.left) && exprEqual(resS.right, eqS.right)) return null;
        return { result: { left: newLeft, right: newRight }, translationKey: 'operations.move_term.history', translationParams: { param } };
      } catch {
        return null;
      }
    }
    case 'expand': {
      const newLeft = simplify(expand(eq.left));
      const newRight = simplify(expand(eq.right));
      if (exprEqual(newLeft, simplify(eq.left)) && exprEqual(newRight, simplify(eq.right))) return null;
      return { result: { left: newLeft, right: newRight }, translationKey: 'operations.expand.history' };
    }
    case 'collect': {
      const newLeft = collectLikeTerms(eq.left);
      const newRight = collectLikeTerms(eq.right);
      const sl = simplify(eq.left);
      const sr = simplify(eq.right);
      if (exprEqual(newLeft, sl) && exprEqual(newRight, sr)) return null;
      if (!hasLikeTerms(sl) && !hasLikeTerms(sr)) return null;
      return { result: { left: newLeft, right: newRight }, translationKey: 'operations.collect.history' };
    }
    case 'isolate': {
      if (!targetVar) return null;
      const leftCollected = collectLikeTerms(eq.left);
      const rightCollected = collectLikeTerms(eq.right);
      const allLeftTerms = extractTerms(leftCollected);
      const allRightTerms = extractTerms(rightCollected);
      const varTerms: Term[] = [];
      const constTerms: Term[] = [];

      for (const t of allLeftTerms) {
        if (t.variable === targetVar) {
          varTerms.push(t);
        } else {
          constTerms.push({ coefficient: -t.coefficient, variable: t.variable });
        }
      }
      for (const t of allRightTerms) {
        if (t.variable === targetVar) {
          varTerms.push({ coefficient: -t.coefficient, variable: t.variable });
        } else {
          constTerms.push(t);
        }
      }

      if (varTerms.length === 0) return null;

      const newLeft = collectLikeTerms(termsToExpr(varTerms));
      const newRight = collectLikeTerms(termsToExpr(constTerms));

      const eqS = { left: simplify(eq.left), right: simplify(eq.right) };
      const newS = { left: simplify(newLeft), right: simplify(newRight) };
      if (exprEqual(newS.left, eqS.left) && exprEqual(newS.right, eqS.right)) return null;

      return { result: { left: newLeft, right: newRight }, translationKey: 'operations.isolate.history', translationParams: { param: targetVar } };
    }
    default:
      return null;
  }
}

function generateBeginnerProblem(): MultivariableProblem {
  const vars = ['x', 'y'];
  const targetVar = vars[randInt(0, 1)];
  const otherVar = vars.find(v => v !== targetVar)!;
  const a = randInt(2, 10);
  const b = randInt(2, 10);
  const equation: Equation = { left: add(variable(targetVar), variable(otherVar)), right: num(a + b) };
  const solutionPath: SolutionStep[] = [
    {
      operationType: 'move_term',
        parameter: otherVar,
      description: `Move ${otherVar} to the other side`,
      resultEquation: { left: variable(targetVar), right: sub(num(a + b), variable(otherVar)) },
    },
  ];
  return { equation, targetVariable: targetVar, solutionPath, targetDescription: `Solve for ${targetVar}` };
}

function generateEasyProblem(): MultivariableProblem {
  const vars = ['x', 'y'];
  const targetVar = vars[randInt(0, 1)];
  const otherVar = vars.find(v => v !== targetVar)!;
  const type = randInt(0, 1);

  if (type === 0) {
    const a = randNonZero(2, 6);
    const b = randInt(2, 10);
    const coeff = randNonZero(2, 5);
    const equation: Equation = {
      left: add(mul(num(coeff), variable(targetVar)), variable(otherVar)),
      right: num(b),
    };
    const solutionPath: SolutionStep[] = [
      {
        operationType: 'move_term',
        parameter: otherVar,
        description: `Move ${otherVar} to the other side`,
        resultEquation: { left: mul(num(coeff), variable(targetVar)), right: sub(num(b), variable(otherVar)) },
      },
      {
        operationType: 'div_both',
        parameter: String(coeff),
        description: `Divide both sides by ${coeff}`,
        resultEquation: { left: variable(targetVar), right: div(sub(num(b), variable(otherVar)), num(coeff)) },
      },
    ];
    return { equation, targetVariable: targetVar, solutionPath, targetDescription: `Solve for ${targetVar}` };
  } else {
    const a = randInt(2, 8);
    const b = randInt(1, 5);
    const coeff = randNonZero(2, 4);
    const equation: Equation = {
      left: variable(targetVar),
      right: sub(mul(num(coeff), variable(otherVar)), num(b)),
    };
    const solutionPath: SolutionStep[] = [];
    return { equation, targetVariable: targetVar, solutionPath, targetDescription: `Solve for ${targetVar}` };
  }
}

function generateIntermediateProblem(): MultivariableProblem {
  const vars = ['x', 'y'];
  const targetVar = vars[randInt(0, 1)];
  const otherVar = vars.find(v => v !== targetVar)!;
  const type = randInt(0, 1);

  if (type === 0) {
    const a = randNonZero(2, 5);
    const b = randInt(1, 8);
    const c = randInt(1, 5);
    const rhs = a * b + c;
    const equation: Equation = {
      left: add(mul(num(a), add(variable(targetVar), num(b))), mul(num(c), variable(otherVar))),
      right: num(rhs),
    };
    const expandedCoeff = a;
    const solutionPath: SolutionStep[] = [
      {
        operationType: 'expand',
        description: 'Expand parentheses',
        resultEquation: {
          left: add(add(mul(num(a), variable(targetVar)), num(a * b)), mul(num(c), variable(otherVar))),
          right: num(rhs),
        },
      },
      {
        operationType: 'collect',
        description: 'Combine like terms',
        resultEquation: {
          left: add(mul(num(expandedCoeff), variable(targetVar)), add(num(a * b), mul(num(c), variable(otherVar)))),
          right: num(rhs),
        },
      },
    ];
    return { equation, targetVariable: targetVar, solutionPath, targetDescription: `Solve for ${targetVar}` };
  } else {
    const coeff1 = randNonZero(2, 5);
    const coeff2 = randNonZero(1, 4);
    const rhs = randInt(5, 15);
    const equation: Equation = {
      left: add(mul(num(coeff1), variable(targetVar)), mul(num(coeff2), variable(otherVar))),
      right: num(rhs),
    };
    const solutionPath: SolutionStep[] = [
      {
        operationType: 'move_term',
        parameter: `${coeff2}${otherVar}`,
        description: `Move ${coeff2}${otherVar} to the other side`,
        resultEquation: { left: mul(num(coeff1), variable(targetVar)), right: sub(num(rhs), mul(num(coeff2), variable(otherVar))) },
      },
      {
        operationType: 'div_both',
        parameter: String(coeff1),
        description: `Divide both sides by ${coeff1}`,
        resultEquation: { left: variable(targetVar), right: div(sub(num(rhs), mul(num(coeff2), variable(otherVar))), num(coeff1)) },
      },
    ];
    return { equation, targetVariable: targetVar, solutionPath, targetDescription: `Solve for ${targetVar}` };
  }
}

function generateAdvancedProblem(): MultivariableProblem {
  const vars = ['x', 'y', 'z'];
  const targetVar = vars[randInt(0, 2)];
  const otherVars = vars.filter(v => v !== targetVar);
  const type = randInt(0, 1);

  if (type === 0) {
    const a = randNonZero(2, 4);
    const b = randNonZero(2, 4);
    const c = randNonZero(1, 3);
    const rhs = randInt(5, 15);
    const equation: Equation = {
      left: add(add(mul(num(a), variable(targetVar)), mul(num(b), variable(otherVars[0]))), mul(num(c), variable(otherVars[1]))),
      right: num(rhs),
    };
    const solutionPath: SolutionStep[] = [
      {
        operationType: 'move_term',
        parameter: `${b}${otherVars[0]} + ${c}${otherVars[1]}`,
        description: `Move variable terms to the other side`,
        resultEquation: {
          left: mul(num(a), variable(targetVar)),
          right: sub(num(rhs), add(mul(num(b), variable(otherVars[0])), mul(num(c), variable(otherVars[1])))),
        },
      },
      {
        operationType: 'div_both',
        parameter: String(a),
        description: `Divide both sides by ${a}`,
        resultEquation: {
          left: variable(targetVar),
          right: div(sub(num(rhs), add(mul(num(b), variable(otherVars[0])), mul(num(c), variable(otherVars[1])))), num(a)),
        },
      },
    ];
    return { equation, targetVariable: targetVar, solutionPath, targetDescription: `Solve for ${targetVar}` };
  } else {
    const a = randNonZero(2, 4);
    const b = randInt(1, 6);
    const c = randInt(1, 4);
    const rhs = a * b + c;
    const equation: Equation = {
      left: add(mul(num(a), add(variable(targetVar), num(b))), mul(num(c), variable(otherVars[0]))),
      right: num(rhs),
    };
    const solutionPath: SolutionStep[] = [
      {
        operationType: 'expand',
        description: 'Expand parentheses',
        resultEquation: {
          left: add(add(mul(num(a), variable(targetVar)), num(a * b)), mul(num(c), variable(otherVars[0]))),
          right: num(rhs),
        },
      },
    ];
    return { equation, targetVariable: targetVar, solutionPath, targetDescription: `Solve for ${targetVar}` };
  }
}

function generateProblem(difficulty: Difficulty): MultivariableProblem {
  const d = difficulty === 'random'
    ? (['beginner', 'easy', 'intermediate', 'advanced'] as const)[Math.floor(Math.random() * 4)]
    : difficulty;
  switch (d) {
    case 'beginner': return generateBeginnerProblem();
    case 'easy': return generateEasyProblem();
    case 'intermediate': return generateIntermediateProblem();
    case 'advanced': return generateAdvancedProblem();
  }
}

export function equationToState(eq: Equation): MathState {
  return {
    display: equationToString(eq),
    latex: equationToLatex(eq),
    data: equationToJson(eq),
  };
}

export function stateToEquation(state: MathState): Equation {
  return jsonToEquation(state.data);
}

export function generateQuestion(difficulty: Difficulty): Question {
  const problem = generateProblem(difficulty);
  const id = `mv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const state = equationToState(problem.equation);
  return {
    id,
    initialState: {
      ...state,
      data: JSON.stringify({
        equation: problem.equation,
        targetVariable: problem.targetVariable,
      }),
    },
    targetDescription: problem.targetDescription,
    difficulty,
    topic: 'Rearranging Equations',
  };
}

export function getTargetVariable(state: MathState): string {
  try {
    const data = JSON.parse(state.data);
    return data.targetVariable || 'x';
  } catch {
    return 'x';
  }
}

export function getEquationFromState(state: MathState): Equation {
  try {
    const data = JSON.parse(state.data);
    return data.equation || jsonToEquation(state.data);
  } catch {
    return jsonToEquation(state.data);
  }
}

export function validateStep(
  currentState: MathState,
  operation: Operation,
  nextState: MathState,
  targetVar: string,
): ValidationResult {
  try {
    const currentEq = getEquationFromState(currentState);
    let userEq: Equation;

    try {
      userEq = parseEquation(nextState.display);
    } catch {
      return { valid: false, message: 'Could not parse the equation. Use format: expression = expression', isSolved: false };
    }

    const opResult = applyMultivariableOperation(currentEq, operation.typeId, operation.parameter ?? '', targetVar);
    if (!opResult) {
      return { valid: false, message: 'This operation cannot be applied here. The expression may not change.', isSolved: false };
    }

    const expectedSimplified = { left: simplify(opResult.result.left), right: simplify(opResult.result.right) };
    const userSimplified = { left: simplify(userEq.left), right: simplify(userEq.right) };

    const equivalent = equationsEquivalent(expectedSimplified, userSimplified);
    if (!equivalent) {
      return { valid: false, message: 'The result is not correct for the given operation. Check your calculation.', isSolved: false };
    }

    const solved = isTargetVariableSolved(userSimplified, targetVar);
    return { valid: true, message: 'Correct!', isSolved: solved };
  } catch {
    return { valid: false, message: 'Error validating step. Please check your input.', isSolved: false };
  }
}

function needsExpansion(e: Expr): boolean {
  switch (e.tag) {
    case 'num': case 'var': return false;
    case 'add': return needsExpansion(e.left) || needsExpansion(e.right);
    case 'sub': return needsExpansion(e.left) || needsExpansion(e.right);
    case 'mul': {
      if ((isAdd(e.left) || isSub(e.left) || isNeg(e.left)) && !isNum(e.right) && !isNum(e.left)) return true;
      if ((isAdd(e.right) || isSub(e.right) || isNeg(e.right)) && !isNum(e.left) && !isNum(e.right)) return true;
      if (isNum(e.left) && (isAdd(e.right) || isSub(e.right) || isNeg(e.right))) return true;
      if (isNum(e.right) && (isAdd(e.left) || isSub(e.left) || isNeg(e.left))) return true;
      return needsExpansion(e.left) || needsExpansion(e.right);
    }
    case 'div': return needsExpansion(e.left) || needsExpansion(e.right);
    case 'neg': return needsExpansion(e.arg);
    case 'pow': return false;
  }
}

function hasLikeTermsInExpr(e: Expr): boolean {
  const terms = collectTerms(e);
  const varCounts = new Map<string, number>();
  for (const t of terms) {
    if (t.variable === null) continue;
    varCounts.set(t.variable, (varCounts.get(t.variable) ?? 0) + 1);
  }
  for (const [, count] of varCounts) {
    if (count > 1) return true;
  }
  return false;
}

export function computeHint(eq: Equation, targetVar: string): { operationDescription?: string; level: 'gentle' | 'moderate' | 'specific'; opType: string; parameter: string; translationKey?: string; translationParams?: Record<string, string> } {
  const sl = simplify(eq.left);
  const sr = simplify(eq.right);

  if (isTargetVariableSolved(eq, targetVar)) {
    return { level: 'specific', opType: '', parameter: '', translationKey: 'practice.validation.complete' };
  }

  if (needsExpansion(sl) || needsExpansion(sr)) {
    return {
      level: 'moderate',
      opType: 'expand',
      parameter: '',
      translationKey: 'operations.expand.hint',
    };
  }

  if (hasLikeTermsInExpr(sl) || hasLikeTermsInExpr(sr)) {
    return {
      level: 'moderate',
      opType: 'collect',
      parameter: '',
      translationKey: 'operations.collect.hint',
    };
  }

  const leftVars = getVariables(sl);
  const rightVars = getVariables(sr);
  const leftHasTarget = leftVars.has(targetVar);
  const rightHasTarget = rightVars.has(targetVar);

  if (leftHasTarget && rightHasTarget) {
    return {
      level: 'moderate',
      opType: 'isolate',
      parameter: '',
      translationKey: 'operations.isolate.hint_gather',
      translationParams: { param: targetVar },
    };
  }

  if (leftHasTarget && !rightHasTarget) {
    const leftTerms = extractTerms(sl);
    const nonTargetTerms = leftTerms.filter(t => t.variable !== targetVar);
    if (nonTargetTerms.length > 0) {
      const termToMove = nonTargetTerms[0];
      const termStr = termToMove.variable
        ? `${termToMove.coefficient}${termToMove.variable}`
        : String(termToMove.coefficient);
      return {
        level: 'specific',
        opType: 'move_term',
        parameter: termStr,
        translationKey: 'operations.move_term.hint_right',
        translationParams: { param: termStr },
      };
    }
    const targetCoeff = getVariableCoefficientInExpr(sl, targetVar);
    if (targetCoeff !== null && targetCoeff !== 1) {
      return {
        level: 'specific',
        opType: 'div_both',
        parameter: String(targetCoeff),
        translationKey: 'operations.div_both.hint',
        translationParams: { param: String(targetCoeff) },
      };
    }
  }

  if (rightHasTarget && !leftHasTarget) {
    const rightTerms = extractTerms(sr);
    const nonTargetTerms = rightTerms.filter(t => t.variable !== targetVar);
    if (nonTargetTerms.length > 0) {
      const termToMove = nonTargetTerms[0];
      const termStr = termToMove.variable
        ? `${termToMove.coefficient}${termToMove.variable}`
        : String(termToMove.coefficient);
      return {
        level: 'specific',
        opType: 'move_term',
        parameter: termStr,
        translationKey: 'operations.move_term.hint_left',
        translationParams: { param: termStr },
      };
    }
    const targetCoeff = getVariableCoefficientInExpr(sr, targetVar);
    if (targetCoeff !== null && targetCoeff !== 1) {
      return {
        level: 'specific',
        opType: 'div_both',
        parameter: String(targetCoeff),
        translationKey: 'operations.div_both.hint',
        translationParams: { param: String(targetCoeff) },
      };
    }
  }

  return {
    level: 'gentle',
    opType: '',
    parameter: '',
    translationKey: 'operations.isolate.hint_gentle',
    translationParams: { param: targetVar },
  };
}

export function getHint(currentState: MathState): Hint {
  try {
    const eq = getEquationFromState(currentState);
    const targetVar = getTargetVariable(currentState);
    const h = computeHint(eq, targetVar);
    return { 
      operationDescription: h.operationDescription, 
      level: h.level, 
      opType: h.opType, 
      parameter: h.parameter,
      translationKey: h.translationKey,
      translationParams: h.translationParams,
    };
  } catch {
    return { level: 'gentle', translationKey: 'practice.hint_simplify' };
  }
}

export function isSolved(currentState: MathState): boolean {
  try {
    const eq = getEquationFromState(currentState);
    const targetVar = getTargetVariable(currentState);
    return isTargetVariableSolved(eq, targetVar);
  } catch {
    return false;
  }
}

export function getAvailableOperations(): OperationType[] {
  return OPERATION_TYPES;
}

export const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  random: 'Formulas of varying complexity',
  beginner: 'Simple formulas with one variable to isolate',
  easy: 'Formulas with a coefficient on the target variable',
  intermediate: 'Formulas requiring parentheses expansion',
  advanced: 'Formulas with three or more variables',
};
