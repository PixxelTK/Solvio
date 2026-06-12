import { Difficulty, MathState, Operation, OperationType, ValidationResult, Hint, Question } from '../../engine/types';
import {
  Expr, Equation, num, variable, add, sub, mul, div, neg,
  isNum, isVar, isAdd, isSub, isMul, isDiv, isNeg,
  simplify, expand, collectLikeTerms, equationsEquivalent,
  equationToString, equationToLatex, parseEquation,
  equationToJson, jsonToEquation, equationVariables,
  evaluate, getVariables, exprEqual, exprToString,
} from './expressions';

interface AlgebraProblem {
  equation: Equation;
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
  { id: 'add_both', label: 'Add to both sides', needsParameter: true, parameterLabel: 'e.g. 3', parameterType: 'number' },
  { id: 'sub_both', label: 'Subtract from both sides', needsParameter: true, parameterLabel: 'e.g. 2', parameterType: 'number' },
  { id: 'mul_both', label: 'Multiply both sides by', needsParameter: true, parameterLabel: 'e.g. 5', parameterType: 'number' },
  { id: 'div_both', label: 'Divide both sides by', needsParameter: true, parameterLabel: 'e.g. 4', parameterType: 'number' },
  { id: 'expand', label: 'Expand parentheses', needsParameter: false },
  { id: 'collect', label: 'Combine like terms', needsParameter: false },
];

export function applyAlgebraOperation(eq: Equation, opType: string, param: string): { result: Equation; description: string } | null {
  const p = parseFloat(param);
  switch (opType) {
    case 'add_both': {
      if (isNaN(p)) return null;
      const newLeft = collectLikeTerms(simplify(add(eq.left, num(p))));
      const newRight = collectLikeTerms(simplify(add(eq.right, num(p))));
      return { result: { left: newLeft, right: newRight }, description: `Add ${p} to both sides` };
    }
    case 'sub_both': {
      if (isNaN(p)) return null;
      const newLeft = collectLikeTerms(simplify(sub(eq.left, num(p))));
      const newRight = collectLikeTerms(simplify(sub(eq.right, num(p))));
      return { result: { left: newLeft, right: newRight }, description: `Subtract ${p} from both sides` };
    }
    case 'mul_both': {
      if (isNaN(p) || p === 0) return null;
      const newEq: Equation = { left: simplify(mul(eq.left, num(p))), right: simplify(mul(eq.right, num(p))) };
      return { result: newEq, description: `Multiply both sides by ${p}` };
    }
    case 'div_both': {
      if (isNaN(p) || p === 0) return null;
      const newEq: Equation = { left: simplify(div(eq.left, num(p))), right: simplify(div(eq.right, num(p))) };
      return { result: newEq, description: `Divide both sides by ${p}` };
    }
    case 'expand': {
      const newLeft = simplify(expand(eq.left));
      const newRight = simplify(expand(eq.right));
      if (exprEqual(newLeft, simplify(eq.left)) && exprEqual(newRight, simplify(eq.right))) return null;
      return { result: { left: newLeft, right: newRight }, description: 'Expand parentheses' };
    }
    case 'collect': {
      const newLeft = collectLikeTerms(eq.left);
      const newRight = collectLikeTerms(eq.right);
      const sl = simplify(eq.left);
      const sr = simplify(eq.right);
      if (exprEqual(newLeft, sl) && exprEqual(newRight, sr)) return null;
      return { result: { left: newLeft, right: newRight }, description: 'Combine like terms' };
    }
    default:
      return null;
  }
}

function isSolvedEquation(eq: Equation): boolean {
  const sl = simplify(eq.left);
  const sr = simplify(eq.right);
  if (isVar(sl) && isNum(sr)) return true;
  if (isVar(sr) && isNum(sl)) return true;
  return false;
}

function generateBeginnerProblem(): AlgebraProblem {
  const x = variable('x');
  const type = randInt(0, 2);
  let equation: Equation;
  let solutionPath: SolutionStep[];

  if (type === 0) {
    const a = randInt(1, 10);
    const xVal = randInt(1, 15);
    const b = xVal + a;
    equation = { left: add(x, num(a)), right: num(b) };
    solutionPath = [{
      operationType: 'sub_both',
      parameter: String(a),
      description: `Subtract ${a} from both sides`,
      resultEquation: { left: x, right: num(xVal) },
    }];
  } else if (type === 1) {
    const a = randInt(1, 10);
    const xVal = randInt(a + 1, 20);
    const b = xVal - a;
    equation = { left: sub(x, num(a)), right: num(b) };
    solutionPath = [{
      operationType: 'add_both',
      parameter: String(a),
      description: `Add ${a} to both sides`,
      resultEquation: { left: x, right: num(b + a) },
    }];
  } else {
    const a = randInt(1, 10);
    const xVal = randInt(1, 15);
    const b = xVal + a;
    equation = { left: add(num(a), x), right: num(b) };
    solutionPath = [{
      operationType: 'sub_both',
      parameter: String(a),
      description: `Subtract ${a} from both sides`,
      resultEquation: { left: x, right: num(xVal) },
    }];
  }

  return { equation, solutionPath, targetDescription: 'Solve for x' };
}

function generateEasyProblem(): AlgebraProblem {
  const x = variable('x');
  const type = randInt(0, 2);
  let equation: Equation;
  let solutionPath: SolutionStep[];

  if (type === 0) {
    const a = randNonZero(2, 9);
    const xVal = randInt(1, 12);
    const b = a * xVal;
    equation = { left: mul(num(a), x), right: num(b) };
    solutionPath = [{
      operationType: 'div_both',
      parameter: String(a),
      description: `Divide both sides by ${a}`,
      resultEquation: { left: x, right: num(xVal) },
    }];
  } else if (type === 1) {
    const a = randNonZero(2, 6);
    const b = randInt(1, 8);
    const xVal = randInt(1, 8);
    const c = a * xVal + b;
    equation = { left: add(mul(num(a), x), num(b)), right: num(c) };
    solutionPath = [
      {
        operationType: 'sub_both',
        parameter: String(b),
        description: `Subtract ${b} from both sides`,
        resultEquation: { left: mul(num(a), x), right: num(c - b) },
      },
      {
        operationType: 'div_both',
        parameter: String(a),
        description: `Divide both sides by ${a}`,
        resultEquation: { left: x, right: num(xVal) },
      },
    ];
  } else {
    const denom = randNonZero(2, 5);
    const xVal = randInt(1, 8);
    const b = randInt(1, 5);
    const rhs = xVal + b;
    equation = { left: div(add(x, num(b)), num(denom)), right: num(rhs) };
    if (rhs * denom !== rhs * denom) return generateEasyProblem();
    const expected = (xVal + b);
    solutionPath = [
      {
        operationType: 'mul_both',
        parameter: String(denom),
        description: `Multiply both sides by ${denom}`,
        resultEquation: { left: add(x, num(b)), right: num(expected) },
      },
      {
        operationType: 'sub_both',
        parameter: String(b),
        description: `Subtract ${b} from both sides`,
        resultEquation: { left: x, right: num(xVal) },
      },
    ];
  }

  return { equation, solutionPath, targetDescription: 'Solve for x' };
}

function generateIntermediateProblem(): AlgebraProblem {
  const x = variable('x');
  const y = variable('y');
  const type = randInt(0, 3);
  let equation: Equation;
  let solutionPath: SolutionStep[];

  if (type === 0) {
    const a = randNonZero(2, 5);
    const b = randInt(1, 8);
    const xVal = randInt(1, 6);
    const c = a * (xVal + b);
    equation = { left: mul(num(a), add(x, num(b))), right: num(c) };
    solutionPath = [
      {
        operationType: 'div_both',
        parameter: String(a),
        description: `Divide both sides by ${a}`,
        resultEquation: { left: add(x, num(b)), right: num(xVal + b) },
      },
      {
        operationType: 'sub_both',
        parameter: String(b),
        description: `Subtract ${b} from both sides`,
        resultEquation: { left: x, right: num(xVal) },
      },
    ];
  } else if (type === 1) {
    const a = randNonZero(2, 6);
    const b = randNonZero(2, 6);
    const xVal = randInt(1, 5);
    const c = (a + b) * xVal;
    equation = { left: add(mul(num(a), x), mul(num(b), x)), right: num(c) };
    solutionPath = [
      {
        operationType: 'collect',
        description: 'Combine like terms',
        resultEquation: { left: mul(num(a + b), x), right: num(c) },
      },
      {
        operationType: 'div_both',
        parameter: String(a + b),
        description: `Divide both sides by ${a + b}`,
        resultEquation: { left: x, right: num(xVal) },
      },
    ];
  } else if (type === 2) {
    const a = randNonZero(2, 4);
    const b = randInt(1, 5);
    const c = randNonZero(1, 3);
    const yVal = randInt(1, 6);
    const rhs = a * (yVal + b) + c * yVal;
    equation = { left: add(mul(num(a), add(y, num(b))), mul(num(c), y)), right: num(rhs) };
    const expandedCoeff = a + c;
    solutionPath = [
      {
        operationType: 'expand',
        description: 'Expand parentheses',
        resultEquation: { left: add(add(mul(num(a), y), num(a * b)), mul(num(c), y)), right: num(rhs) },
      },
      {
        operationType: 'collect',
        description: 'Combine like terms',
        resultEquation: { left: add(mul(num(expandedCoeff), y), num(a * b)), right: num(rhs) },
      },
      {
        operationType: 'sub_both',
        parameter: String(a * b),
        description: `Subtract ${a * b} from both sides`,
        resultEquation: { left: mul(num(expandedCoeff), y), right: num(rhs - a * b) },
      },
      {
        operationType: 'div_both',
        parameter: String(expandedCoeff),
        description: `Divide both sides by ${expandedCoeff}`,
        resultEquation: { left: y, right: num(yVal) },
      },
    ];
  } else {
    const a = randNonZero(2, 6);
    const b = randInt(1, 10);
    const xVal = randInt(1, 8);
    const c = a * xVal + b;
    equation = { left: add(mul(num(a), x), num(b)), right: num(c) };
    solutionPath = [
      {
        operationType: 'sub_both',
        parameter: String(b),
        description: `Subtract ${b} from both sides`,
        resultEquation: { left: mul(num(a), x), right: num(c - b) },
      },
      {
        operationType: 'div_both',
        parameter: String(a),
        description: `Divide both sides by ${a}`,
        resultEquation: { left: x, right: num(xVal) },
      },
    ];
  }

  return { equation, solutionPath, targetDescription: 'Solve for the variable' };
}

function generateAdvancedProblem(): AlgebraProblem {
  const vars = [variable('x'), variable('y'), variable('z')];
  const v = vars[randInt(0, 2)];
  const type = randInt(0, 2);
  let equation: Equation;
  let solutionPath: SolutionStep[];

  if (type === 0) {
    const a = randNonZero(2, 4);
    const b = randNonZero(1, 3);
    const c = randNonZero(2, 4);
    const xVal = randInt(1, 5);
    const rhs = a * (xVal + b) + c * xVal;
    equation = { left: add(mul(num(a), add(v, num(b))), mul(num(c), v)), right: num(rhs) };
    const totalCoeff = a + c;
    solutionPath = [
      {
        operationType: 'expand',
        description: 'Expand parentheses',
        resultEquation: { left: add(add(mul(num(a), v), num(a * b)), mul(num(c), v)), right: num(rhs) },
      },
      {
        operationType: 'collect',
        description: 'Combine like terms',
        resultEquation: { left: add(mul(num(totalCoeff), v), num(a * b)), right: num(rhs) },
      },
      {
        operationType: 'sub_both',
        parameter: String(a * b),
        description: `Subtract ${a * b} from both sides`,
        resultEquation: { left: mul(num(totalCoeff), v), right: num(rhs - a * b) },
      },
      {
        operationType: 'div_both',
        parameter: String(totalCoeff),
        description: `Divide both sides by ${totalCoeff}`,
        resultEquation: { left: v, right: num(xVal) },
      },
    ];
  } else if (type === 1) {
    const a = randNonZero(2, 5);
    const b = randInt(1, 5);
    const c = randInt(1, 8);
    const xVal = randInt(1, 6);
    const rhs = (a * xVal + b) * c;
    equation = { left: mul(num(c), add(mul(num(a), v), num(b))), right: num(rhs) };
    solutionPath = [
      {
        operationType: 'div_both',
        parameter: String(c),
        description: `Divide both sides by ${c}`,
        resultEquation: { left: add(mul(num(a), v), num(b)), right: num(a * xVal + b) },
      },
      {
        operationType: 'sub_both',
        parameter: String(b),
        description: `Subtract ${b} from both sides`,
        resultEquation: { left: mul(num(a), v), right: num(a * xVal) },
      },
      {
        operationType: 'div_both',
        parameter: String(a),
        description: `Divide both sides by ${a}`,
        resultEquation: { left: v, right: num(xVal) },
      },
    ];
  } else {
    const a = randNonZero(2, 5);
    const b = randNonZero(1, 4);
    const c = randNonZero(2, 5);
    const xVal = randInt(1, 5);
    const rhs = (a * xVal + b) / c;
    if (rhs !== Math.round(rhs)) return generateAdvancedProblem();
    equation = { left: div(add(mul(num(a), v), num(b)), num(c)), right: num(rhs) };
    solutionPath = [
      {
        operationType: 'mul_both',
        parameter: String(c),
        description: `Multiply both sides by ${c}`,
        resultEquation: { left: add(mul(num(a), v), num(b)), right: num(rhs * c) },
      },
      {
        operationType: 'sub_both',
        parameter: String(b),
        description: `Subtract ${b} from both sides`,
        resultEquation: { left: mul(num(a), v), right: num(rhs * c - b) },
      },
      {
        operationType: 'div_both',
        parameter: String(a),
        description: `Divide both sides by ${a}`,
        resultEquation: { left: v, right: num(xVal) },
      },
    ];
  }

  return { equation, solutionPath, targetDescription: 'Solve for the variable' };
}

function generateProblem(difficulty: Difficulty): AlgebraProblem {
  switch (difficulty) {
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
  const id = `eq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    initialState: equationToState(problem.equation),
    targetDescription: problem.targetDescription,
    difficulty,
    topic: 'Equation Transformation',
  };
}

export function validateStep(
  currentState: MathState,
  operation: Operation,
  nextState: MathState
): ValidationResult {
  try {
    const currentEq = stateToEquation(currentState);
    let userEq: Equation;

    try {
      userEq = parseEquation(nextState.display);
    } catch {
      return { valid: false, message: 'Could not parse the equation. Use format: expression = expression', isSolved: false };
    }

    const opResult = applyAlgebraOperation(currentEq, operation.typeId, operation.parameter ?? '');
    if (!opResult) {
      return { valid: false, message: 'This operation cannot be applied here. The expression may not change.', isSolved: false };
    }

    const expectedSimplified = { left: simplify(opResult.result.left), right: simplify(opResult.result.right) };
    const userSimplified = { left: simplify(userEq.left), right: simplify(userEq.right) };

    const equivalent = equationsEquivalent(expectedSimplified, userSimplified);
    if (!equivalent) {
      return { valid: false, message: 'The result is not correct for the given operation. Check your calculation.', isSolved: false };
    }

    const solved = isSolvedEquation(userSimplified);
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

function countLikeTerms(e: Expr): Map<string, number> {
  const terms = new Map<string, number>();
  collectTermInfo(e, terms);
  return terms;
}

function collectTermInfo(e: Expr, terms: Map<string, number>): void {
  switch (e.tag) {
    case 'num':
      return;
    case 'var':
      terms.set(e.name, (terms.get(e.name) ?? 0) + 1);
      return;
    case 'add':
      collectTermInfo(e.left, terms);
      collectTermInfo(e.right, terms);
      return;
    case 'sub':
      collectTermInfo(e.left, terms);
      collectTermInfo(e.right, terms);
      return;
    case 'mul': {
      if (isNum(e.left) && isVar(e.right)) {
        terms.set(e.right.name, (terms.get(e.right.name) ?? 0) + 1);
        return;
      }
      if (isVar(e.left) && isNum(e.right)) {
        terms.set(e.left.name, (terms.get(e.left.name) ?? 0) + 1);
        return;
      }
      return;
    }
    case 'div': return;
    case 'neg': {
      collectTermInfo(e.arg, terms);
      return;
    }
    case 'pow': return;
  }
}

function hasLikeTerms(e: Expr): boolean {
  const counts = countLikeTerms(e);
  for (const [, count] of counts) {
    if (count > 1) return true;
  }
  return false;
}

function getConstantOnVarSide(e: Expr): number | null {
  if (isAdd(e)) {
    if (isNum(e.right)) return e.right.value;
    if (isNum(e.left)) return e.left.value;
  }
  if (isSub(e)) {
    if (isNum(e.right)) return -e.right.value;
    if (isNum(e.left)) return e.left.value;
  }
  return null;
}

function getVariableCoeff(e: Expr): number | null {
  if (isVar(e)) return 1;
  if (isMul(e)) {
    if (isNum(e.left) && isVar(e.right)) return e.left.value;
    if (isVar(e.left) && isNum(e.right)) return e.right.value;
  }
  if (isNeg(e)) {
    const inner = getVariableCoeff(e.arg);
    return inner !== null ? -inner : null;
  }
  if (isDiv(e) && isNum(e.right)) {
    const numCoeff = getVariableCoeff(e.left);
    return numCoeff !== null ? numCoeff / e.right.value : null;
  }
  return null;
}

export function computeHint(eq: Equation): { operationDescription: string; level: 'gentle' | 'moderate' | 'specific'; opType: string; parameter: string } {
  const sl = simplify(eq.left);
  const sr = simplify(eq.right);

  if (isSolvedEquation(eq)) {
    return { operationDescription: 'The equation is already solved!', level: 'specific', opType: '', parameter: '' };
  }

  if (needsExpansion(sl) || needsExpansion(sr)) {
    return {
      operationDescription: 'Expand the parentheses first',
      level: 'moderate',
      opType: 'expand',
      parameter: '',
    };
  }

  if (hasLikeTerms(sl) || hasLikeTerms(sr)) {
    return {
      operationDescription: 'Combine like terms',
      level: 'moderate',
      opType: 'collect',
      parameter: '',
    };
  }

  if (isDiv(sl) && isNum(sr)) {
    const denomExpr = sl.right;
    if (isNum(denomExpr)) {
      return {
        operationDescription: `Multiply both sides by ${denomExpr.value}`,
        level: 'specific',
        opType: 'mul_both',
        parameter: String(denomExpr.value),
      };
    }
  }

  if (isAdd(sl) || isSub(sl)) {
    const constVal = getConstantOnVarSide(sl);
    if (constVal !== null && constVal !== 0) {
      if (constVal > 0) {
        return {
          operationDescription: `Subtract ${constVal} from both sides`,
          level: 'specific',
          opType: 'sub_both',
          parameter: String(constVal),
        };
      } else {
        return {
          operationDescription: `Add ${Math.abs(constVal)} to both sides`,
          level: 'specific',
          opType: 'add_both',
          parameter: String(Math.abs(constVal)),
        };
      }
    }
  }

  if (isAdd(sr) || isSub(sr)) {
    const constVal = getConstantOnVarSide(sr);
    if (constVal !== null && constVal !== 0) {
      if (constVal > 0) {
        return {
          operationDescription: `Subtract ${constVal} from both sides`,
          level: 'moderate',
          opType: 'sub_both',
          parameter: String(constVal),
        };
      } else {
        return {
          operationDescription: `Add ${Math.abs(constVal)} to both sides`,
          level: 'moderate',
          opType: 'add_both',
          parameter: String(Math.abs(constVal)),
        };
      }
    }
  }

  const leftCoeff = getVariableCoeff(sl);
  if (leftCoeff !== null && leftCoeff !== 1 && isNum(sr)) {
    return {
      operationDescription: `Divide both sides by ${leftCoeff}`,
      level: 'specific',
      opType: 'div_both',
      parameter: String(leftCoeff),
    };
  }

  const rightCoeff = getVariableCoeff(sr);
  if (rightCoeff !== null && isNum(sl)) {
    return {
      operationDescription: `Divide or rearrange to isolate the variable`,
      level: 'gentle',
      opType: '',
      parameter: '',
    };
  }

  return {
    operationDescription: 'Look for a way to isolate the variable',
    level: 'gentle',
    opType: '',
    parameter: '',
  };
}

export function getHint(currentState: MathState): Hint {
  try {
    const eq = stateToEquation(currentState);
    const h = computeHint(eq);
    return { operationDescription: h.operationDescription, level: h.level };
  } catch {
    return { operationDescription: 'Try simplifying one side of the equation', level: 'gentle' };
  }
}

export function isSolved(currentState: MathState): boolean {
  try {
    const eq = stateToEquation(currentState);
    return isSolvedEquation(eq);
  } catch {
    return false;
  }
}

export function getAvailableOperations(): OperationType[] {
  return OPERATION_TYPES;
}
