import { MathModule, Difficulty, Question, MathState, Operation, ValidationResult, Hint, OperationType } from '../../engine/types';

export interface MatrixRow {
  values: number[];
}

export interface AugmentedMatrix {
  rows: MatrixRow[];
  numVars: number;
}

export interface LinearStateData {
  matrix: AugmentedMatrix;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randNonZero(min: number, max: number): number {
  let v;
  do { v = randInt(min, max); } while (v === 0);
  return v;
}

const OPERATION_TYPES: OperationType[] = [
  {
    id: 'row_swap',
    label: 'Swap rows',
    description: 'Interchange two rows in the matrix.',
    needsParameter: true,
    parameterLabel: 'Example: R1<->R2',
    parameterType: 'expression',
  },
  {
    id: 'row_scale',
    label: 'Scale a row',
    description: 'Multiply a row by a non-zero constant.',
    needsParameter: true,
    parameterLabel: 'Example: 2*R1',
    parameterType: 'expression',
  },
  {
    id: 'row_add',
    label: 'Row replacement',
    description: 'Replace a row with a linear combination of rows.',
    needsParameter: true,
    parameterLabel: 'Example: R2-2*R1',
    parameterType: 'expression',
  },
];

export function matrixToState(matrix: AugmentedMatrix): MathState {
  const data: LinearStateData = { matrix };
  return {
    display: matrixToDisplayString(matrix),
    latex: matrixToLatex(matrix),
    data: JSON.stringify(data),
  };
}

export function stateToData(state: MathState): LinearStateData {
  return JSON.parse(state.data);
}

export function matrixToDisplayString(matrix: AugmentedMatrix): string {
  const colWidths: number[] = [];
  for (let j = 0; j <= matrix.numVars; j++) {
    let maxLen = 0;
    for (const row of matrix.rows) {
      const s = formatNum(row.values[j]);
      if (s.length > maxLen) maxLen = s.length;
    }
    colWidths.push(maxLen);
  }

  return matrix.rows.map(row => {
    const parts: string[] = [];
    for (let j = 0; j < matrix.numVars; j++) {
      parts.push(formatNum(row.values[j]).padStart(colWidths[j]));
    }
    const aug = formatNum(row.values[matrix.numVars]).padStart(colWidths[matrix.numVars]);
    return `[ ${parts.join('  ')} | ${aug} ]`;
  }).join('\n');
}

function formatNum(n: number): string {
  const rounded = Math.round(n * 10000) / 10000;
  if (Number.isInteger(rounded)) return String(rounded);
  return String(rounded);
}

export function matrixToLatex(matrix: AugmentedMatrix): string {
  const lines = matrix.rows.map(row => {
    const parts: string[] = [];
    for (let j = 0; j < matrix.numVars; j++) {
      parts.push(formatNum(row.values[j]));
    }
    parts.push('\\mid');
    parts.push(formatNum(row.values[matrix.numVars]));
    return parts.join(' & ');
  });
  return `\\begin{bmatrix} ${lines.join(' \\\\ ')} \\end{bmatrix}`;
}

export function deepCopy(matrix: AugmentedMatrix): AugmentedMatrix {
  return {
    rows: matrix.rows.map(r => ({ values: [...r.values] })),
    numVars: matrix.numVars,
  };
}

function isRowEchelon(matrix: AugmentedMatrix): boolean {
  let prevLeadingCol = -1;
  for (let i = 0; i < matrix.rows.length; i++) {
    let leadingCol = -1;
    for (let j = 0; j < matrix.numVars; j++) {
      if (Math.abs(matrix.rows[i].values[j]) > 1e-9) {
        leadingCol = j;
        break;
      }
    }
    if (leadingCol === -1) continue;
    if (leadingCol <= prevLeadingCol) return false;
    prevLeadingCol = leadingCol;
  }
  return true;
}

function isRREF(matrix: AugmentedMatrix): boolean {
  if (!isRowEchelon(matrix)) return false;
  for (let i = 0; i < matrix.rows.length; i++) {
    let leadingCol = -1;
    for (let j = 0; j < matrix.numVars; j++) {
      if (Math.abs(matrix.rows[i].values[j]) > 1e-9) {
        if (Math.abs(matrix.rows[i].values[j] - 1) > 1e-9) return false;
        leadingCol = j;
        break;
      }
    }
    if (leadingCol === -1) continue;
    for (let k = 0; k < matrix.rows.length; k++) {
      if (k === i) continue;
      if (Math.abs(matrix.rows[k].values[leadingCol]) > 1e-9) return false;
    }
  }
  return true;
}

export function matricesEqual(a: AugmentedMatrix, b: AugmentedMatrix): boolean {
  if (a.rows.length !== b.rows.length || a.numVars !== b.numVars) return false;
  for (let i = 0; i < a.rows.length; i++) {
    for (let j = 0; j <= a.numVars; j++) {
      if (Math.abs(a.rows[i].values[j] - b.rows[i].values[j]) > 1e-4) return false;
    }
  }
  return true;
}

function gaussEliminate(matrix: AugmentedMatrix): AugmentedMatrix {
  const m = deepCopy(matrix);
  const numRows = m.rows.length;
  const numCols = m.numVars;
  let pivotRow = 0;

  for (let col = 0; col < numCols && pivotRow < numRows; col++) {
    let maxRow = pivotRow;
    for (let row = pivotRow + 1; row < numRows; row++) {
      if (Math.abs(m.rows[row].values[col]) > Math.abs(m.rows[maxRow].values[col])) {
        maxRow = row;
      }
    }
    if (Math.abs(m.rows[maxRow].values[col]) < 1e-10) continue;
    [m.rows[pivotRow], m.rows[maxRow]] = [m.rows[maxRow], m.rows[pivotRow]];

    const pivot = m.rows[pivotRow].values[col];
    for (let j = 0; j <= numCols; j++) {
      m.rows[pivotRow].values[j] /= pivot;
    }

    for (let row = 0; row < numRows; row++) {
      if (row === pivotRow) continue;
      const factor = m.rows[row].values[col];
      for (let j = 0; j <= numCols; j++) {
        m.rows[row].values[j] -= factor * m.rows[pivotRow].values[j];
      }
    }
    pivotRow++;
  }

  return m;
}

function roundMatrix(matrix: AugmentedMatrix): AugmentedMatrix {
  const m = deepCopy(matrix);
  for (const row of m.rows) {
    for (let j = 0; j <= m.numVars; j++) {
      row.values[j] = Math.round(row.values[j] * 1000) / 1000;
    }
  }
  return m;
}

function generate2x2Matrix(): AugmentedMatrix {
  const x1 = randInt(-5, 5);
  const x2 = randInt(-5, 5);
  const a = randNonZero(-4, 4);
  const b = randNonZero(-4, 4);
  const d = randNonZero(-4, 4);
  const e = randNonZero(-4, 4);
  const c = a * x1 + b * x2;
  const f = d * x1 + e * x2;
  return {
    rows: [
      { values: [a, b, c] },
      { values: [d, e, f] },
    ],
    numVars: 2,
  };
}

function generate3x3Matrix(): AugmentedMatrix {
  const x1 = randInt(-3, 3);
  const x2 = randInt(-3, 3);
  const x3 = randInt(-3, 3);
  const row1 = [randNonZero(-3, 3), randNonZero(-3, 3), randNonZero(-3, 3)];
  const row2 = [randNonZero(-3, 3), randNonZero(-3, 3), randNonZero(-3, 3)];
  const row3 = [randNonZero(-3, 3), randNonZero(-3, 3), randNonZero(-3, 3)];
  return {
    rows: [
      { values: [...row1, row1[0] * x1 + row1[1] * x2 + row1[2] * x3] },
      { values: [...row2, row2[0] * x1 + row2[1] * x2 + row2[2] * x3] },
      { values: [...row3, row3[0] * x1 + row3[1] * x2 + row3[2] * x3] },
    ],
    numVars: 3,
  };
}

function findPivotCol(matrix: AugmentedMatrix): number {
  for (let col = 0; col < matrix.numVars; col++) {
    for (let row = 0; row < matrix.rows.length; row++) {
      if (Math.abs(matrix.rows[row].values[col]) > 1e-9) {
        let allZeroAbove = true;
        for (let r = 0; r < row; r++) {
          if (Math.abs(matrix.rows[r].values[col]) > 1e-9) {
            allZeroAbove = false;
            break;
          }
        }
        if (allZeroAbove) {
          return col;
        }
      }
    }
  }
  return -1;
}

export function applyRowOperation(
  matrix: AugmentedMatrix,
  opType: string,
  param: string
): { result: AugmentedMatrix; translationKey?: string; translationParams?: Record<string, string> } | null {
  const m = deepCopy(matrix);

  if (opType === 'row_swap') {
    const match = param.match(/R(\d+)\s*(?:<->|↔)\s*R(\d+)/i);
    if (!match) return null;
    const i = parseInt(match[1]) - 1;
    const j = parseInt(match[2]) - 1;
    if (i < 0 || i >= m.rows.length || j < 0 || j >= m.rows.length || i === j) return null;
    [m.rows[i], m.rows[j]] = [m.rows[j], m.rows[i]];
    return { result: roundMatrix(m), translationKey: 'operations.row_swap.history', translationParams: { i: String(i + 1), j: String(j + 1) } };
  }

  if (opType === 'row_scale') {
    const match = param.match(/(-?\d*\.?\d+)\s*\*?\s*R(\d+)/i);
    if (!match) return null;
    const k = parseFloat(match[1]);
    const i = parseInt(match[2]) - 1;
    if (isNaN(k) || k === 0 || i < 0 || i >= m.rows.length) return null;
    for (let j = 0; j <= m.numVars; j++) {
      m.rows[i].values[j] *= k;
    }
    return { result: roundMatrix(m), translationKey: 'operations.row_scale.history', translationParams: { k: String(k), i: String(i + 1) } };
  }

  if (opType === 'row_add') {
    const match = param.match(/R(\d+)\s*([+-])\s*(\d*\.?\d+)\s*\*?\s*R(\d+)/i);
    if (!match) return null;
    const targetRow = parseInt(match[1]) - 1;
    const sign = match[2] === '-' ? -1 : 1;
    const k = parseFloat(match[3]);
    const sourceRow = parseInt(match[4]) - 1;
    if (targetRow < 0 || targetRow >= m.rows.length || sourceRow < 0 || sourceRow >= m.rows.length || targetRow === sourceRow) return null;
    if (isNaN(k)) return null;
    for (let j = 0; j <= m.numVars; j++) {
      m.rows[targetRow].values[j] += sign * k * m.rows[sourceRow].values[j];
    }
    const signStr = match[2];
    return { result: roundMatrix(m), translationKey: 'operations.row_add.history', translationParams: { i: String(targetRow + 1), signStr, k: String(k), j: String(sourceRow + 1) } };
  }

  return null;
}

export function computeHint(matrix: AugmentedMatrix): { operationDescription?: string; level: 'gentle' | 'moderate' | 'specific'; opType: string; param: string; translationKey?: string; translationParams?: Record<string, string> } {
  if (isRREF(matrix)) {
    return { level: 'specific', opType: '', param: '', translationKey: 'practice.validation.complete' };
  }

  const usedPivotRows = new Set<number>();

  for (let col = 0; col < matrix.numVars; col++) {
    let pivotRow = -1;
    for (let row = 0; row < matrix.rows.length; row++) {
      if (usedPivotRows.has(row)) continue;
      if (Math.abs(matrix.rows[row].values[col]) > 1e-9) {
        pivotRow = row;
        break;
      }
    }

    if (pivotRow === -1) continue;

    if (Math.abs(matrix.rows[pivotRow].values[col] - 1) > 1e-9) {
      const val = matrix.rows[pivotRow].values[col];
      const k = Math.round((1 / val) * 1000) / 1000;
      return {
        level: 'moderate',
        opType: 'row_scale',
        param: `${k}*R${pivotRow + 1}`,
        translationKey: 'operations.row_scale.hint',
        translationParams: { pivotRow: String(pivotRow + 1), k: String(k), col: String(col + 1) },
      };
    }

    usedPivotRows.add(pivotRow);

    for (let row = 0; row < matrix.rows.length; row++) {
      if (row === pivotRow) continue;
      if (Math.abs(matrix.rows[row].values[col]) > 1e-9) {
        const val = matrix.rows[row].values[col];
        const k = Math.round(Math.abs(val) * 1000) / 1000;
        const sign = val > 0 ? '-' : '+';
        return {
          level: 'specific',
          opType: 'row_add',
          param: `R${row + 1}${sign}${k}*R${pivotRow + 1}`,
          translationKey: 'operations.row_add.hint',
          translationParams: { pivotRow: String(pivotRow + 1), val: formatNum(val), row: String(row + 1), col: String(col + 1), sign, k: String(k) },
        };
      }
    }
  }

  return { level: 'gentle', opType: '', param: '', translationKey: 'operations.linear_algebra.hint_gentle' };
}

export const linearAlgebraModule: MathModule = {
  id: 'linear-algebra',
  title: 'Linear Algebra',
  description: 'Solve systems of equations using row operations (Gaussian Elimination)',
  icon: '⊞',

  generateQuestion(difficulty: Difficulty): Question {
    let matrix: AugmentedMatrix;
    const d = difficulty === 'random'
      ? (['beginner', 'easy', 'intermediate', 'advanced'] as const)[Math.floor(Math.random() * 4)]
      : difficulty;
    switch (d) {
      case 'beginner':
      case 'easy':
        matrix = generate2x2Matrix();
        break;
      case 'intermediate':
      case 'advanced':
        matrix = generate3x3Matrix();
        break;
    }

    const id = `la-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return {
      id,
      initialState: matrixToState(matrix),
      targetDescription: 'Reduce to Reduced Row Echelon Form (RREF)',
      difficulty,
      topic: 'Gaussian Elimination',
    };
  },

  validateStep(currentState: MathState, operation: Operation, nextState: MathState): ValidationResult {
    try {
      const currentData = stateToData(currentState);
      const currentMatrix = currentData.matrix;
      let userMatrix: AugmentedMatrix;

      try {
        const userData = JSON.parse(nextState.data);
        userMatrix = userData.matrix;
      } catch {
        return { valid: false, message: 'Could not parse the matrix.', isSolved: false };
      }

      if (userMatrix.rows.length !== currentMatrix.rows.length) {
        return { valid: false, message: 'Matrix row count does not match.', isSolved: false };
      }

      const opResult = applyRowOperation(currentMatrix, operation.typeId, operation.parameter || '');
      if (!opResult) {
        return { valid: false, message: 'Invalid operation format. Check your input.', isSolved: false };
      }

      const roundedExpected = roundMatrix(opResult.result);
      const roundedUser = roundMatrix(userMatrix);

      if (!matricesEqual(roundedExpected, roundedUser)) {
        return { valid: false, message: 'The result does not match the operation. Check your arithmetic.', isSolved: false };
      }

      const solved = isRREF(userMatrix);
      return { valid: true, message: 'Correct!', isSolved: solved };
    } catch {
      return { valid: false, message: 'Error validating step.', isSolved: false };
    }
  },

  getHint(currentState: MathState): Hint {
    try {
      const data = stateToData(currentState);
      const hint = computeHint(data.matrix);
      return { 
        operationDescription: hint.operationDescription, 
        level: hint.level,
        translationKey: hint.translationKey,
        translationParams: hint.translationParams,
      };
    } catch {
      return { level: 'gentle', translationKey: 'operations.linear_algebra.hint_error' };
    }
  },

  isSolved(currentState: MathState): boolean {
    try {
      const data = stateToData(currentState);
      return isRREF(data.matrix);
    } catch {
      return false;
    }
  },

  getAvailableOperations(): OperationType[] {
    return OPERATION_TYPES;
  },
};

export const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  random: 'Matrices of varying size and complexity',
  beginner: '2×2 matrices with integer entries',
  easy: '2×2 matrices with integer entries',
  intermediate: '3×3 matrices with integer entries',
  advanced: '3×3 matrices with integer entries',
};
