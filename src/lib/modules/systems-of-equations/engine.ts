import {
  faPlus, faMinus, faXmark, faDivide, faEquals, faArrowRight, faRepeat,
} from '@fortawesome/free-solid-svg-icons';
import { Difficulty, MathState, OperationType, Hint, Question } from '../../engine/types';
import {
  Expr, Equation, num, variable, add, sub, mul, div, neg,
  simplify, collectLikeTerms, expand,
  equationToString, equationToLatex, parseEquation,
  exprEqual, exprToLatex, getVariables,
  extractTerms,
} from '../algebra/expressions';

/* ------------------------------------------------------------------ */
/*  Data model                                                        */
/* ------------------------------------------------------------------ */

export interface SystemStateData {
  eq1: Equation;
  eq2: Equation;
  answerX: number;
  answerY: number;
  solvedX: number | null;
  solvedY: number | null;
}

export type OperationCategory =
  | 'add'
  | 'subtract'
  | 'add_value'
  | 'sub_value'
  | 'multiply'
  | 'divide'
  | 'substitute';

export interface OperationTarget {
  id: string;
  label: string;
  needsParameter: boolean;
  parameterLabel?: string;
}

export const CATEGORIES: { id: OperationCategory; label: string; description: string }[] = [
  { id: 'add',        label: 'Add Equations',      description: 'Add two equations' },
  { id: 'subtract',   label: 'Subtract Equations',  description: 'Subtract one equation from another' },
  { id: 'add_value',  label: 'Add Value',           description: 'Add a value to both sides' },
  { id: 'sub_value',  label: 'Subtract Value',      description: 'Subtract a value from both sides' },
  { id: 'multiply',   label: 'Multiply Equation',   description: 'Multiply both sides by a value' },
  { id: 'divide',     label: 'Divide Equation',     description: 'Divide both sides by a value' },
  { id: 'substitute', label: 'Substitute Variable',  description: 'Replace a variable with its known value' },
];

export const TARGETS: Record<OperationCategory, OperationTarget[]> = {
  add: [
    { id: 'add_eq1_eq2', label: 'Eq1 ← Eq1 + Eq2', needsParameter: false },
    { id: 'add_eq2_eq1', label: 'Eq2 ← Eq2 + Eq1', needsParameter: false },
  ],
  subtract: [
    { id: 'sub_eq1_eq2', label: 'Eq1 ← Eq1 − Eq2', needsParameter: false },
    { id: 'sub_eq2_eq1', label: 'Eq2 ← Eq2 − Eq1', needsParameter: false },
  ],
  add_value: [
    { id: 'add_both_eq1', label: 'Eq1 + n', needsParameter: true, parameterLabel: 'Value to add' },
    { id: 'add_both_eq2', label: 'Eq2 + n', needsParameter: true, parameterLabel: 'Value to add' },
  ],
  sub_value: [
    { id: 'sub_both_eq1', label: 'Eq1 − n', needsParameter: true, parameterLabel: 'Value to subtract' },
    { id: 'sub_both_eq2', label: 'Eq2 − n', needsParameter: true, parameterLabel: 'Value to subtract' },
  ],
  multiply: [
    { id: 'mul_eq1', label: 'Eq1 × n', needsParameter: true, parameterLabel: 'Factor' },
    { id: 'mul_eq2', label: 'Eq2 × n', needsParameter: true, parameterLabel: 'Factor' },
  ],
  divide: [
    { id: 'div_eq1', label: 'Eq1 ÷ n', needsParameter: true, parameterLabel: 'Divisor' },
    { id: 'div_eq2', label: 'Eq2 ÷ n', needsParameter: true, parameterLabel: 'Divisor' },
  ],
  substitute: [
    { id: 'subs_into_eq1', label: 'Substitute into Eq1', needsParameter: false },
    { id: 'subs_into_eq2', label: 'Substitute into Eq2', needsParameter: false },
  ],
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randNonZero(min: number, max: number): number {
  let v;
  do { v = randInt(min, max); } while (v === 0);
  return v;
}

function makeTerm(coeff: number, varName: string): Expr {
  if (coeff === 1) return variable(varName);
  if (coeff === -1) return neg(variable(varName));
  return mul(num(coeff), variable(varName));
}

function equationToLaTeX(eq: Equation): string {
  return `${exprToLatex(eq.left)} = ${exprToLatex(eq.right)}`;
}

function equationsToDisplay(eq1: Equation, eq2: Equation): string {
  return `${equationToString(eq1)}\n${equationToString(eq2)}`;
}

function equationsToLaTeX(eq1: Equation, eq2: Equation): string {
  return `\\begin{cases} ${equationToLaTeX(eq1)} \\quad\\textcolor{gray}{\\footnotesize (1)} \\\\ ${equationToLaTeX(eq2)} \\quad\\textcolor{gray}{\\footnotesize (2)} \\end{cases}`;
}

function getVariableCoefficient(e: Expr, varName: string): number {
  const terms = extractTerms(e);
  let coeff = 0;
  for (const t of terms) {
    if (t.variable === varName) coeff += t.coefficient;
  }
  return coeff;
}

function getConstants(e: Expr): number {
  const terms = extractTerms(e);
  let constVal = 0;
  for (const t of terms) {
    if (t.variable === null) constVal += t.coefficient;
  }
  return constVal;
}

/* ------------------------------------------------------------------ */
/*  Equation transforms                                                */
/* ------------------------------------------------------------------ */

function isVarInEquation(eq: Equation, varName: string): boolean {
  return getVariables(eq.left).has(varName) || getVariables(eq.right).has(varName);
}

function cleanExpr(e: Expr): Expr {
  return collectLikeTerms(expand(simplify(e)));
}

function cleanEq(eq: Equation): Equation {
  return { left: cleanExpr(eq.left), right: cleanExpr(eq.right) };
}

function scaleEquation(eq: Equation, factor: number): Equation | null {
  if (factor === 0) return null;
  return cleanEq({
    left: mul(eq.left, num(factor)),
    right: mul(eq.right, num(factor)),
  });
}

function divideEquation(eq: Equation, factor: number): Equation | null {
  if (factor === 0) return null;
  if (factor === -1) {
    return cleanEq({ left: neg(eq.left), right: neg(eq.right) });
  }
  return cleanEq({
    left: div(eq.left, num(factor)),
    right: div(eq.right, num(factor)),
  });
}

function addToBothSides(eq: Equation, value: number): Equation {
  return cleanEq({
    left: add(eq.left, num(value)),
    right: add(eq.right, num(value)),
  });
}

function subFromBothSides(eq: Equation, value: number): Equation {
  return cleanEq({
    left: sub(eq.left, num(value)),
    right: sub(eq.right, num(value)),
  });
}

function combineEquations(eq1: Equation, eq2: Equation): Equation {
  return cleanEq({
    left: add(eq1.left, eq2.left),
    right: add(eq1.right, eq2.right),
  });
}

function subtractEquations(eq1: Equation, eq2: Equation): Equation {
  return cleanEq({
    left: sub(eq1.left, eq2.left),
    right: sub(eq1.right, eq2.right),
  });
}

function substituteVar(eq: Equation, varName: string, value: number): Equation {
  const recurse = (e: Expr): Expr => {
    switch (e.tag) {
      case 'num': return e;
      case 'var': return e.name === varName ? num(value) : e;
      case 'add': return add(recurse(e.left), recurse(e.right));
      case 'sub': return sub(recurse(e.left), recurse(e.right));
      case 'mul': return mul(recurse(e.left), recurse(e.right));
      case 'div': return div(recurse(e.left), recurse(e.right));
      case 'neg': return neg(recurse(e.arg));
      case 'pow': return { tag: 'pow', base: recurse(e.base), exp: recurse(e.exp) };
    }
  };
  return {
    left: simplify(recurse(eq.left)),
    right: simplify(recurse(eq.right)),
  };
}

/* ------------------------------------------------------------------ */
/*  Auto-detect solved variables                                       */
/* ------------------------------------------------------------------ */

function isSingleVarEquation(eq: Equation): { varName: string; coeff: number; constValue: number } | null {
  const left = collectLikeTerms(expand(simplify(eq.left)));
  const right = collectLikeTerms(expand(simplify(eq.right)));

  const leftVars = getVariables(left);
  const rightVars = getVariables(right);
  const uniqueVars = [...new Set([...leftVars, ...rightVars])];

  if (uniqueVars.length !== 1) return null;

  const varName = uniqueVars[0];
  const coeff = getVariableCoefficient(left, varName) - getVariableCoefficient(right, varName);

  if (coeff === 0) return null;

  const leftConst = getConstants(left);
  const rightConst = getConstants(right);
  const constValue = rightConst - leftConst;

  return { varName, coeff, constValue };
}

function isVarEqualsNum(eq: Equation): { varName: string; value: number } | null {
  const sl = collectLikeTerms(simplify(eq.left));
  const sr = collectLikeTerms(simplify(eq.right));

  if (sl.tag === 'var' && sr.tag === 'num') return { varName: sl.name, value: sr.value };
  if (sr.tag === 'var' && sl.tag === 'num') return { varName: sr.name, value: sl.value };

  return null;
}

function detectSolved(eq1: Equation, eq2: Equation, knownX: number | null, knownY: number | null): { solvedX: number | null; solvedY: number | null } {
  let sx = knownX;
  let sy = knownY;

  for (const eq of [eq1, eq2]) {
    const exact = isVarEqualsNum(eq);
    if (exact) {
      if (exact.varName === 'x') sx = exact.value;
      if (exact.varName === 'y') sy = exact.value;
      continue;
    }
    const single = isSingleVarEquation(eq);
    if (single && single.coeff === 1) {
      if (single.varName === 'x') sx = single.constValue;
      if (single.varName === 'y') sy = single.constValue;
    }
  }

  return { solvedX: sx, solvedY: sy };
}

/* ------------------------------------------------------------------ */
/*  Preview + Apply operations                                         */
/* ------------------------------------------------------------------ */

export function previewOperation(
  data: SystemStateData,
  category: OperationCategory,
  targetId: string,
  param: string,
): { newData: SystemStateData; description: string } | null {
  try {
    const p = parseFloat(param);
    let newEq1 = { ...data.eq1 };
    let newEq2 = { ...data.eq2 };
    let description = '';

    switch (targetId) {
      /* ---- add ---- */
      case 'add_eq1_eq2': {
        newEq1 = combineEquations(data.eq1, data.eq2);
        description = 'Eq1 ← Eq1 + Eq2';
        break;
      }
      case 'add_eq2_eq1': {
        newEq2 = combineEquations(data.eq2, data.eq1);
        description = 'Eq2 ← Eq2 + Eq1';
        break;
      }
      /* ---- subtract ---- */
      case 'sub_eq1_eq2': {
        newEq1 = subtractEquations(data.eq1, data.eq2);
        description = 'Eq1 ← Eq1 − Eq2';
        break;
      }
      case 'sub_eq2_eq1': {
        newEq2 = subtractEquations(data.eq2, data.eq1);
        description = 'Eq2 ← Eq2 − Eq1';
        break;
      }
      /* ---- add_value ---- */
      case 'add_both_eq1': {
        if (isNaN(p)) return null;
        newEq1 = addToBothSides(data.eq1, p);
        description = `Add ${p} to Eq1`;
        break;
      }
      case 'add_both_eq2': {
        if (isNaN(p)) return null;
        newEq2 = addToBothSides(data.eq2, p);
        description = `Add ${p} to Eq2`;
        break;
      }
      /* ---- sub_value ---- */
      case 'sub_both_eq1': {
        if (isNaN(p)) return null;
        newEq1 = subFromBothSides(data.eq1, p);
        description = `Subtract ${p} from Eq1`;
        break;
      }
      case 'sub_both_eq2': {
        if (isNaN(p)) return null;
        newEq2 = subFromBothSides(data.eq2, p);
        description = `Subtract ${p} from Eq2`;
        break;
      }
      /* ---- multiply ---- */
      case 'mul_eq1': {
        const scaled = scaleEquation(data.eq1, p);
        if (!scaled) return null;
        newEq1 = scaled;
        description = `Multiply Eq1 by ${p}`;
        break;
      }
      case 'mul_eq2': {
        const scaled = scaleEquation(data.eq2, p);
        if (!scaled) return null;
        newEq2 = scaled;
        description = `Multiply Eq2 by ${p}`;
        break;
      }
      /* ---- divide ---- */
      case 'div_eq1': {
        const divided = divideEquation(data.eq1, p);
        if (!divided) return null;
        newEq1 = divided;
        description = `Divide Eq1 by ${p}`;
        break;
      }
      case 'div_eq2': {
        const divided = divideEquation(data.eq2, p);
        if (!divided) return null;
        newEq2 = divided;
        description = `Divide Eq2 by ${p}`;
        break;
      }
      /* ---- substitute ---- */
      case 'subs_into_eq1': {
        if (data.solvedX !== null) {
          newEq1 = substituteVar(data.eq1, 'x', data.solvedX);
          description = `Substitute x = ${data.solvedX} into Eq1`;
        } else if (data.solvedY !== null) {
          newEq1 = substituteVar(data.eq1, 'y', data.solvedY);
          description = `Substitute y = ${data.solvedY} into Eq1`;
        } else {
          return null;
        }
        break;
      }
      case 'subs_into_eq2': {
        if (data.solvedX !== null) {
          newEq2 = substituteVar(data.eq2, 'x', data.solvedX);
          description = `Substitute x = ${data.solvedX} into Eq2`;
        } else if (data.solvedY !== null) {
          newEq2 = substituteVar(data.eq2, 'y', data.solvedY);
          description = `Substitute y = ${data.solvedY} into Eq2`;
        } else {
          return null;
        }
        break;
      }
      default:
        return null;
    }

    const { solvedX, solvedY } = detectSolved(newEq1, newEq2, data.solvedX, data.solvedY);

    return {
      newData: { eq1: newEq1, eq2: newEq2, answerX: data.answerX, answerY: data.answerY, solvedX, solvedY },
      description,
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Category availability                                              */
/* ------------------------------------------------------------------ */

export function getEnabledCategories(data: SystemStateData): OperationCategory[] {
  const solvedOne = (data.solvedX !== null) !== (data.solvedY !== null);
  return CATEGORIES.map(c => c.id).filter(cat => {
    if (cat === 'substitute' && !solvedOne) return false;
    return true;
  });
}

/* ------------------------------------------------------------------ */
/*  Question generation                                                */
/* ------------------------------------------------------------------ */

function pickDifficulty(d: Difficulty): 'beginner' | 'easy' | 'intermediate' | 'advanced' {
  if (d === 'random') {
    return (['beginner', 'easy', 'intermediate', 'advanced'] as const)[Math.floor(Math.random() * 4)];
  }
  return d;
}

function generateSystem(difficulty: Difficulty): { eq1: Equation; eq2: Equation; answer: { x: number; y: number } } {
  let x = 1, y = 1;
  let a = 1, b = 1, c = 1, d = 1;
  const level = pickDifficulty(difficulty);

  switch (level) {
    case 'beginner':
      x = randInt(1, 6);
      y = randInt(1, 6);
      a = 1;
      b = [1, -1][randInt(0, 1)];
      c = 1;
      d = -b;
      break;
    case 'easy':
      x = randInt(1, 8);
      y = randInt(1, 8);
      if (randInt(0, 1)) {
        a = randNonZero(1, 3);
        b = randNonZero(-2, 2);
        c = randNonZero(1, 3);
        d = -b;
        if (d === 0) d = randNonZero(-2, 2);
      } else {
        a = 1;
        b = randInt(1, 3);
        c = 1;
        d = -randInt(1, 3);
      }
      break;
    case 'intermediate':
      x = randInt(1, 6);
      y = randInt(1, 6);
      a = randNonZero(2, 5);
      b = randNonZero(-4, 4);
      c = randNonZero(2, 5);
      d = randNonZero(-4, 4);
      break;
    case 'advanced':
      x = randInt(-4, 8);
      y = randInt(-4, 8);
      if (x === 0) x = 1;
      if (y === 0) y = 1;
      a = randNonZero(2, 6);
      b = randNonZero(-5, 5);
      c = randNonZero(2, 6);
      d = randNonZero(-5, 5);
      break;
  }

  /* Ensure equations are not proportional — determinant must be non‑zero */
  if (a * d === b * c) {
    return generateSystem(difficulty);
  }

  const eq1: Equation = {
    left: simplify(add(makeTerm(a, 'x'), makeTerm(b, 'y'))),
    right: num(a * x + b * y),
  };
  const eq2: Equation = {
    left: simplify(add(makeTerm(c, 'x'), makeTerm(d, 'y'))),
    right: num(c * x + d * y),
  };

  return { eq1, eq2, answer: { x, y } };
}

export function generateQuestion(difficulty: Difficulty): Question {
  const { eq1, eq2, answer } = generateSystem(difficulty);
  const id = `sys-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const initialState: SystemStateData = {
    eq1, eq2,
    answerX: answer.x,
    answerY: answer.y,
    solvedX: null,
    solvedY: null,
  };

  return {
    id,
    initialState: dataToState(initialState),
    targetDescription: 'Solve the system for x and y',
    difficulty,
    topic: 'Systems of Equations',
  };
}

/* ------------------------------------------------------------------ */
/*  State serialisation                                                */
/* ------------------------------------------------------------------ */

export function dataToState(data: SystemStateData): MathState {
  const isComplete = data.solvedX !== null && data.solvedY !== null;
  let display: string;
  let latex: string;

  if (isComplete) {
    display = `x = ${data.solvedX}\ny = ${data.solvedY}`;
    latex = `x = ${data.solvedX} \\quad y = ${data.solvedY}`;
  } else {
    display = equationsToDisplay(data.eq1, data.eq2);
    latex = equationsToLaTeX(data.eq1, data.eq2);
  }

  return { display, latex, data: JSON.stringify(data) };
}

export function stateToData(state: MathState): SystemStateData {
  try {
    return JSON.parse(state.data);
  } catch {
    return { eq1: { left: num(0), right: num(0) }, eq2: { left: num(0), right: num(0) }, answerX: 0, answerY: 0, solvedX: null, solvedY: null };
  }
}

/* ------------------------------------------------------------------ */
/*  isSolved / getHint                                                 */
/* ------------------------------------------------------------------ */

export function validateStep(
  _currentState: MathState,
  _operation: import('../../engine/types').Operation,
  _nextState: MathState,
): import('../../engine/types').ValidationResult {
  return { valid: true, message: '', isSolved: isSolved(_nextState) };
}

export function isSolved(currentState: MathState): boolean {
  try {
    const data = stateToData(currentState);
    return data.solvedX !== null && data.solvedY !== null;
  } catch {
    return false;
  }
}

export function getHint(currentState: MathState): Hint {
  try {
    const d = stateToData(currentState);
    const solvedOne = d.solvedX !== null || d.solvedY !== null;

    if (d.solvedX !== null && d.solvedY !== null) {
      return { operationDescription: 'All variables solved!', level: 'specific' };
    }

    if (solvedOne) {
      const otherEq = d.solvedX !== null ? d.eq2 : d.eq1;
      const sv = isSingleVarEquation(otherEq);
      if (sv && sv.coeff !== 1) {
        const which = d.solvedX !== null ? 'Eq2' : 'Eq1';
        return { operationDescription: `Divide ${which} by ${sv.coeff} to isolate ${sv.varName}.`, level: 'specific' };
      }
      return {
        operationDescription: `Use Substitute to replace the known variable in the other equation.`,
        level: 'specific',
      };
    }

    const sv1 = isSingleVarEquation(d.eq1);
    const sv2 = isSingleVarEquation(d.eq2);
    if (sv1 && sv1.coeff !== 1) {
      return { operationDescription: `Divide Eq1 by ${sv1.coeff} to isolate ${sv1.varName}.`, level: 'specific' };
    }
    if (sv2 && sv2.coeff !== 1) {
      return { operationDescription: `Divide Eq2 by ${sv2.coeff} to isolate ${sv2.varName}.`, level: 'specific' };
    }

    const xc1 = getVariableCoefficient(d.eq1.left, 'x');
    const yc1 = getVariableCoefficient(d.eq1.left, 'y');
    const xc2 = getVariableCoefficient(d.eq2.left, 'x');
    const yc2 = getVariableCoefficient(d.eq2.left, 'y');

    if (xc1 + xc2 === 0) {
      return { operationDescription: 'The x coefficients cancel when added — try Add Equations.', level: 'specific' };
    }
    if (yc1 + yc2 === 0) {
      return { operationDescription: 'The y coefficients cancel when added — try Add Equations.', level: 'specific' };
    }
    if (xc1 === xc2 && xc1 !== 0) {
      return { operationDescription: 'Same x coefficients — scale one equation by −1 then add.', level: 'moderate' };
    }
    if (yc1 === yc2 && yc1 !== 0) {
      return { operationDescription: 'Same y coefficients — scale one equation by −1 then add.', level: 'moderate' };
    }

    return { operationDescription: 'Scale equations so a variable cancels, then add or subtract.', level: 'gentle' };
  } catch {
    return { operationDescription: 'Try adding or subtracting the equations.', level: 'gentle' };
  }
}

/* ------------------------------------------------------------------ */
/*  Auto-solver (for Skip)                                             */
/* ------------------------------------------------------------------ */

function tryScaleThenCombine(data: SystemStateData, which: 'mul_eq1' | 'mul_eq2', f: number): boolean {
  const cat: OperationCategory = 'multiply';
  const target = which;
  const scaleResult = previewOperation(data, cat, target, String(f));
  if (!scaleResult) return false;
  const addResult = previewOperation(scaleResult.newData, 'add', 'add_eq1_eq2', '');
  if (!addResult) return false;
  return addResult.newData.solvedX !== data.solvedX || addResult.newData.solvedY !== data.solvedY;
}

export function computeNextStep(data: SystemStateData): { category: OperationCategory; targetId: string; param: string; description: string } | null {
  const bothSolved = data.solvedX !== null && data.solvedY !== null;
  if (bothSolved) return null;

  const solvedX = data.solvedX !== null;
  const solvedY = data.solvedY !== null;
  const solvedOne = solvedX !== solvedY;

  /* If one variable is known, check if the unknown equation needs dividing */
  if (solvedOne) {
    for (const which of ['eq1', 'eq2'] as const) {
      const eq = which === 'eq1' ? data.eq1 : data.eq2;
      const info = isSingleVarEquation(eq);
      if (info && info.coeff !== 1) {
        return { category: 'divide', targetId: which === 'eq1' ? 'div_eq1' : 'div_eq2', param: String(info.coeff), description: `Divide ${which === 'eq1' ? 'Eq1' : 'Eq2'} by ${info.coeff}` };
      }
    }
    const solvedVar = solvedX ? 'x' : 'y';
    const solvedVal = data.solvedX ?? data.solvedY ?? 0;
    const solvedInEq1 = isVarInEquation(data.eq1, solvedVar);
    const substituteInto = solvedInEq1 ? 'subs_into_eq2' : 'subs_into_eq1';
    return { category: 'substitute', targetId: substituteInto, param: '', description: `Substitute ${solvedVar} = ${solvedVal} into ${solvedInEq1 ? 'Eq2' : 'Eq1'}` };
  }

  /* Check if any equation is ax=b and needs dividing (before elimination checks) */
  for (const which of ['eq1', 'eq2'] as const) {
    const eq = which === 'eq1' ? data.eq1 : data.eq2;
    const info = isSingleVarEquation(eq);
    if (info && info.coeff !== 1) {
      const targetId = which === 'eq1' ? 'div_eq1' : 'div_eq2';
      return { category: 'divide', targetId, param: String(info.coeff), description: `Divide ${which === 'eq1' ? 'Eq1' : 'Eq2'} by ${info.coeff}` };
    }
  }

  const yc1 = getVariableCoefficient(data.eq1.left, 'y');
  const yc2 = getVariableCoefficient(data.eq2.left, 'y');
  const xc1 = getVariableCoefficient(data.eq1.left, 'x');
  const xc2 = getVariableCoefficient(data.eq2.left, 'x');

  if (yc1 + yc2 === 0) {
    return { category: 'add', targetId: 'add_eq1_eq2', param: '', description: 'Add equations (y cancels)' };
  }
  if (xc1 + xc2 === 0) {
    return { category: 'add', targetId: 'add_eq1_eq2', param: '', description: 'Add equations (x cancels)' };
  }

  if (yc1 === yc2 && yc1 !== 0) {
    return { category: 'subtract', targetId: 'sub_eq1_eq2', param: '', description: 'Subtract equations (y cancels)' };
  }
  if (xc1 === xc2 && xc1 !== 0) {
    return { category: 'subtract', targetId: 'sub_eq1_eq2', param: '', description: 'Subtract equations (x cancels)' };
  }

  if (yc2 !== 0 && yc1 !== 0 && yc1 % yc2 === 0) {
    const f = -(yc1 / yc2);
    if (f !== 0 && f !== 1 && Number.isInteger(f)) {
      return { category: 'multiply', targetId: 'mul_eq2', param: String(f), description: `Multiply Eq2 by ${f}` };
    }
  }
  if (xc2 !== 0 && xc1 !== 0 && xc1 % xc2 === 0) {
    const f = -(xc1 / xc2);
    if (f !== 0 && f !== 1 && Number.isInteger(f)) {
      return { category: 'multiply', targetId: 'mul_eq2', param: String(f), description: `Multiply Eq2 by ${f}` };
    }
  }
  if (yc1 !== 0 && yc2 !== 0 && yc2 % yc1 === 0) {
    const f = -(yc2 / yc1);
    if (f !== 0 && f !== 1 && Number.isInteger(f)) {
      return { category: 'multiply', targetId: 'mul_eq1', param: String(f), description: `Multiply Eq1 by ${f}` };
    }
  }
  if (xc1 !== 0 && xc2 !== 0 && xc2 % xc1 === 0) {
    const f = -(xc2 / xc1);
    if (f !== 0 && f !== 1 && Number.isInteger(f)) {
      return { category: 'multiply', targetId: 'mul_eq1', param: String(f), description: `Multiply Eq1 by ${f}` };
    }
  }

  for (const which of ['mul_eq1', 'mul_eq2'] as const) {
    for (let f = -5; f <= 5; f++) {
      if (f === 0 || f === 1 || f === -1) continue;
      if (tryScaleThenCombine(data, which, f)) {
        return { category: 'multiply', targetId: which, param: String(f), description: `Multiply ${which === 'mul_eq1' ? 'Eq1' : 'Eq2'} by ${f}` };
      }
    }
  }

  return null;
}

export function getAvailableOperations(_state: MathState): OperationType[] {
  const all: OperationType[] = [];
  for (const cat of CATEGORIES) {
    for (const t of TARGETS[cat.id]) {
      all.push({
        id: t.id,
        label: t.label,
        description: `${cat.label}: ${t.label}`,
        icon: faPlus,
        needsParameter: t.needsParameter,
        parameterLabel: t.parameterLabel ?? '',
      });
    }
  }
  return all;
}

export const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  random: 'Systems of varying difficulty',
  beginner: 'Systems with ±1 coefficients and positive solutions',
  easy: 'Systems with opposite coefficients for easy elimination',
  intermediate: 'Systems requiring scaling before elimination',
  advanced: 'Systems with larger coefficients and negative solutions',
};
