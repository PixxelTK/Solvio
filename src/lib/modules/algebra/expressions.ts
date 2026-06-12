export type Expr =
  | { tag: 'num'; value: number }
  | { tag: 'var'; name: string }
  | { tag: 'add'; left: Expr; right: Expr }
  | { tag: 'sub'; left: Expr; right: Expr }
  | { tag: 'mul'; left: Expr; right: Expr }
  | { tag: 'div'; left: Expr; right: Expr }
  | { tag: 'neg'; arg: Expr }
  | { tag: 'pow'; base: Expr; exp: Expr };

export interface Equation {
  left: Expr;
  right: Expr;
}

export function num(value: number): Expr {
  return { tag: 'num', value };
}

export function variable(name: string): Expr {
  return { tag: 'var', name };
}

export function add(left: Expr, right: Expr): Expr {
  return { tag: 'add', left, right };
}

export function sub(left: Expr, right: Expr): Expr {
  return { tag: 'sub', left, right };
}

export function mul(left: Expr, right: Expr): Expr {
  return { tag: 'mul', left, right };
}

export function div(left: Expr, right: Expr): Expr {
  return { tag: 'div', left, right };
}

export function neg(arg: Expr): Expr {
  return { tag: 'neg', arg };
}

export function pow(base: Expr, exp: Expr): Expr {
  return { tag: 'pow', base, exp };
}

export function isNum(e: Expr): e is { tag: 'num'; value: number } {
  return e.tag === 'num';
}

export function isVar(e: Expr): e is { tag: 'var'; name: string } {
  return e.tag === 'var';
}

export function isAdd(e: Expr): e is { tag: 'add'; left: Expr; right: Expr } {
  return e.tag === 'add';
}

export function isSub(e: Expr): e is { tag: 'sub'; left: Expr; right: Expr } {
  return e.tag === 'sub';
}

export function isMul(e: Expr): e is { tag: 'mul'; left: Expr; right: Expr } {
  return e.tag === 'mul';
}

export function isDiv(e: Expr): e is { tag: 'div'; left: Expr; right: Expr } {
  return e.tag === 'div';
}

export function isNeg(e: Expr): e is { tag: 'neg'; arg: Expr } {
  return e.tag === 'neg';
}

export function exprToString(e: Expr, parentOp?: string): string {
  switch (e.tag) {
    case 'num':
      if (e.value < 0 && parentOp) return `(${e.value})`;
      return String(e.value);
    case 'var':
      return e.name;
    case 'add':
      return `${exprToString(e.left, 'add')} + ${exprToString(e.right, 'add')}`;
    case 'sub':
      return `${exprToString(e.left, 'sub')} - ${exprToString(e.right, 'sub')}`;
    case 'mul': {
      const l = needsParens(e.left, 'mul', 'left') ? `(${exprToString(e.left)})` : exprToString(e.left, 'mul');
      const r = needsParens(e.right, 'mul', 'right') ? `(${exprToString(e.right)})` : exprToString(e.right, 'mul');
      if (isNum(e.left) && isVar(e.right)) return `${exprToString(e.left)}${exprToString(e.right)}`;
      if (isNum(e.left) && isAddOrSub(e.right)) return `${exprToString(e.left)}(${exprToString(e.right)})`;
      if (isNum(e.left) && isMul(e.right)) return `${exprToString(e.left)}(${exprToString(e.right)})`;
      if (isVar(e.left) && isAddOrSub(e.right)) return `${exprToString(e.left)}(${exprToString(e.right)})`;
      return `${l} * ${r}`;
    }
    case 'div':
      return `${needsParens(e.left, 'div', 'left') ? `(${exprToString(e.left)})` : exprToString(e.left)} / ${needsParens(e.right, 'div', 'right') ? `(${exprToString(e.right)})` : exprToString(e.right)}`;
    case 'neg': {
      const inner = exprToString(e.arg, 'neg');
      if (isAdd(e.arg) || isSub(e.arg)) return `-(${inner})`;
      return `-${inner}`;
    }
    case 'pow': {
      const baseStr = needsParensForPow(e.base) ? `(${exprToString(e.base)})` : exprToString(e.base);
      return `${baseStr}^${exprToString(e.exp)}`;
    }
  }
}

function isAddOrSub(e: Expr): boolean {
  return e.tag === 'add' || e.tag === 'sub';
}

function needsParens(e: Expr, op: string, side: 'left' | 'right'): boolean {
  if (e.tag === 'add' || e.tag === 'sub') {
    return op === 'mul' || op === 'div';
  }
  if (e.tag === 'neg') {
    return op === 'mul' || op === 'div' || op === 'pow';
  }
  return false;
}

function needsParensForPow(e: Expr): boolean {
  return e.tag === 'add' || e.tag === 'sub' || e.tag === 'mul' || e.tag === 'div' || e.tag === 'neg';
}

export function exprToLatex(e: Expr, parentOp?: string): string {
  switch (e.tag) {
    case 'num':
      if (e.value < 0 && parentOp) return `(${e.value})`;
      return String(e.value);
    case 'var':
      return e.name;
    case 'add':
      return `${exprToLatex(e.left, 'add')} + ${exprToLatex(e.right, 'add')}`;
    case 'sub':
      return `${exprToLatex(e.left, 'sub')} - ${exprToLatex(e.right, 'sub')}`;
    case 'mul': {
      if (isNum(e.left) && isVar(e.right)) return `${exprToLatex(e.left)}${exprToLatex(e.right)}`;
      if (isNum(e.left) && (isAddOrSub(e.right) || isMul(e.right))) return `${exprToLatex(e.left)}(${exprToLatex(e.right)})`;
      if (isVar(e.left) && isAddOrSub(e.right)) return `${exprToLatex(e.left)}(${exprToLatex(e.right)})`;
      return `${exprToLatex(e.left, 'mul')} \\cdot ${exprToLatex(e.right, 'mul')}`;
    }
    case 'div':
      return `\\frac{${exprToLatex(e.left)}}{${exprToLatex(e.right)}}`;
    case 'neg': {
      const inner = exprToLatex(e.arg, 'neg');
      if (isAdd(e.arg) || isSub(e.arg)) return `-(${inner})`;
      return `-${inner}`;
    }
    case 'pow':
      return `${needsParensForPow(e.base) ? `(${exprToLatex(e.base)})` : exprToLatex(e.base)}^{${exprToLatex(e.exp)}}`;
  }
}

export function equationToString(eq: Equation): string {
  return `${exprToString(eq.left)} = ${exprToString(eq.right)}`;
}

export function equationToLatex(eq: Equation): string {
  return `${exprToLatex(eq.left)} = ${exprToLatex(eq.right)}`;
}

export function evaluate(e: Expr, env: Record<string, number>): number {
  switch (e.tag) {
    case 'num': return e.value;
    case 'var': return env[e.name] ?? 0;
    case 'add': return evaluate(e.left, env) + evaluate(e.right, env);
    case 'sub': return evaluate(e.left, env) - evaluate(e.right, env);
    case 'mul': return evaluate(e.left, env) * evaluate(e.right, env);
    case 'div': {
      const d = evaluate(e.right, env);
      if (d === 0) return Infinity;
      return evaluate(e.left, env) / d;
    }
    case 'neg': return -evaluate(e.arg, env);
    case 'pow': return Math.pow(evaluate(e.base, env), evaluate(e.exp, env));
  }
}

export function getVariables(e: Expr): Set<string> {
  switch (e.tag) {
    case 'num': return new Set();
    case 'var': return new Set([e.name]);
    case 'add': case 'sub': case 'mul': case 'div': {
      const l = getVariables(e.left);
      const r = getVariables(e.right);
      for (const v of r) l.add(v);
      return l;
    }
    case 'neg': return getVariables(e.arg);
    case 'pow': {
      const b = getVariables(e.base);
      const exp = getVariables(e.exp);
      for (const v of exp) b.add(v);
      return b;
    }
  }
}

export function equationVariables(eq: Equation): Set<string> {
  const l = getVariables(eq.left);
  const r = getVariables(eq.right);
  for (const v of r) l.add(v);
  return l;
}

export function simplify(e: Expr): Expr {
  const s = simplifyOnce(e);
  return exprEqual(e, s) ? s : simplify(s);
}

function simplifyOnce(e: Expr): Expr {
  switch (e.tag) {
    case 'num': case 'var':
      return e;
    case 'add': {
      const l = simplify(e.left);
      const r = simplify(e.right);
      if (isNum(l) && isNum(r)) return num(l.value + r.value);
      if (isNum(l) && l.value === 0) return r;
      if (isNum(r) && r.value === 0) return l;
      if (isNeg(r)) return simplify(sub(l, r.arg));
      if (isSub(l) && isNum(r)) return simplify(add(l.left, simplify(sub(l.right, r))));
      if (isAdd(l) && isNum(r)) return add(l.left, simplify(add(l.right, r)));
      return add(l, r);
    }
    case 'sub': {
      const l = simplify(e.left);
      const r = simplify(e.right);
      if (isNum(l) && isNum(r)) return num(l.value - r.value);
      if (isNum(r) && r.value === 0) return l;
      if (isNum(l) && l.value === 0) return simplify(neg(r));
      if (exprEqual(l, r)) return num(0);
      if (isAdd(l)) return simplify(add(l.left, simplify(sub(l.right, r))));
      if (isSub(l)) return simplify(sub(l.left, simplify(add(l.right, r))));
      return sub(l, r);
    }
    case 'mul': {
      const l = simplify(e.left);
      const r = simplify(e.right);
      if (isNum(l) && isNum(r)) return num(l.value * r.value);
      if (isNum(l) && l.value === 0) return num(0);
      if (isNum(r) && r.value === 0) return num(0);
      if (isNum(l) && l.value === 1) return r;
      if (isNum(r) && r.value === 1) return l;
      if (isDiv(l) && exprEqual(l.right, r)) return simplify(l.left);
      if (isDiv(r) && exprEqual(r.right, l)) return simplify(r.left);
      if (isNum(l) && isDiv(r) && isNum(r.right)) {
        const g = gcd(Math.abs(l.value), Math.abs(r.right.value));
        const newNum = l.value / g;
        const newDen = r.right.value / g;
        if (newDen === 1) return simplify(mul(num(newNum), r.left));
        return simplify(div(simplify(mul(num(newNum), r.left)), num(newDen)));
      }
      if (isNum(r) && isDiv(l) && isNum(l.right)) {
        const g = gcd(Math.abs(r.value), Math.abs(l.right.value));
        const newNum = r.value / g;
        const newDen = l.right.value / g;
        if (newDen === 1) return simplify(mul(num(newNum), l.left));
        return simplify(div(simplify(mul(num(newNum), l.left)), num(newDen)));
      }
      if (isNum(l) && isMul(r) && isNum(r.left)) return simplify(mul(num(l.value * r.left.value), r.right));
      if (isNum(r) && isMul(l) && isNum(l.left)) return simplify(mul(num(l.left.value * r.value), l.right));
      if (isNeg(l) && isNeg(r)) return mul(l.arg, r.arg);
      if (isNeg(l)) return neg(mul(l.arg, r));
      if (isNeg(r)) return neg(mul(l, r.arg));
      return mul(l, r);
    }
    case 'div': {
      const l = simplify(e.left);
      const r = simplify(e.right);
      if (isNum(l) && isNum(r)) {
        if (r.value === 0) return num(Infinity);
        const g = gcd(Math.abs(l.value), Math.abs(r.value));
        const nl = l.value / g;
        const nr = r.value / g;
        if (nr === 1) return num(nl);
        if (nr === -1) return num(-nl);
        return div(num(nl), num(nr));
      }
      if (isNum(r) && r.value === 1) return l;
      if (isNum(l) && l.value === 0) return num(0);
      if (exprEqual(l, r)) return num(1);
      if (isNum(r) && isMul(l)) {
        if (isNum(l.left)) {
          const newCoeff = l.left.value / r.value;
          if (newCoeff === 1) return l.right;
          if (newCoeff === -1) return neg(l.right);
          if (Number.isInteger(newCoeff)) return mul(num(newCoeff), l.right);
        }
        if (exprEqual(l.right, r)) return l.left;
        if (exprEqual(l.left, r)) return l.right;
      }
      if (isNeg(l) && isNeg(r)) return simplify(div(l.arg, r.arg));
      if (isNeg(l)) return neg(simplify(div(l.arg, r)));
      if (isNeg(r)) return neg(simplify(div(l, r.arg)));
      return div(l, r);
    }
    case 'neg': {
      const a = simplify(e.arg);
      if (isNum(a)) return num(-a.value);
      if (isNeg(a)) return a.arg;
      return neg(a);
    }
    case 'pow': {
      const b = simplify(e.base);
      const exp = simplify(e.exp);
      if (isNum(b) && isNum(exp)) return num(Math.pow(b.value, exp.value));
      if (isNum(exp) && exp.value === 0) return num(1);
      if (isNum(exp) && exp.value === 1) return b;
      return pow(b, exp);
    }
  }
}

export function expand(e: Expr): Expr {
  const s = simplify(e);
  switch (s.tag) {
    case 'num': case 'var':
      return s;
    case 'add': return add(expand(s.left), expand(s.right));
    case 'sub': return sub(expand(s.left), expand(s.right));
    case 'mul': {
      const l = expand(s.left);
      const r = expand(s.right);
      if (isAdd(r)) return add(expand(mul(l, r.left)), expand(mul(l, r.right)));
      if (isSub(r)) return sub(expand(mul(l, r.left)), expand(mul(l, r.right)));
      if (isAdd(l)) return add(expand(mul(l.left, r)), expand(mul(l.right, r)));
      if (isSub(l)) return sub(expand(mul(l.left, r)), expand(mul(l.right, r)));
      if (isNeg(r)) return neg(mul(l, r.arg));
      if (isNeg(l)) return neg(mul(l.arg, r));
      return mul(l, r);
    }
    case 'div': return div(expand(s.left), expand(s.right));
    case 'neg': return neg(expand(s.arg));
    case 'pow': return pow(expand(s.base), expand(s.exp));
  }
}

export function collectLikeTerms(e: Expr): Expr {
  const expanded = expand(e);
  const simplified = simplify(expanded);
  const terms = collectTerms(simplified);
  return termsToExpr(terms);
}

interface Term {
  coefficient: number;
  variable: string | null;
}

function collectTerms(e: Expr): Term[] {
  const expanded = expand(e);
  const rawTerms = extractTerms(expanded);
  const map = new Map<string, number>();
  for (const t of rawTerms) {
    const key = t.variable ?? '';
    map.set(key, (map.get(key) ?? 0) + t.coefficient);
  }
  const result: Term[] = [];
  for (const [variable, coefficient] of map) {
    if (coefficient !== 0) {
      result.push({ coefficient, variable: variable || null });
    }
  }
  if (result.length === 0) return [{ coefficient: 0, variable: null }];
  return result.sort((a, b) => {
    if (a.variable === null) return 1;
    if (b.variable === null) return -1;
    return a.variable.localeCompare(b.variable);
  });
}

function extractTerms(e: Expr): Term[] {
  switch (e.tag) {
    case 'num':
      return [{ coefficient: e.value, variable: null }];
    case 'var':
      return [{ coefficient: 1, variable: e.name }];
    case 'add':
      return [...extractTerms(e.left), ...extractTerms(e.right)];
    case 'sub':
      return [...extractTerms(e.left), ...extractTerms(e.right).map(t => ({ ...t, coefficient: -t.coefficient }))];
    case 'mul': {
      const lTerms = extractTerms(e.left);
      const rTerms = extractTerms(e.right);
      if (lTerms.length === 1 && rTerms.length === 1) {
        const l = lTerms[0];
        const r = rTerms[0];
        if (l.variable === null) return [{ coefficient: l.coefficient * r.coefficient, variable: r.variable }];
        if (r.variable === null) return [{ coefficient: l.coefficient * r.coefficient, variable: l.variable }];
        if (l.variable === r.variable) return [{ coefficient: l.coefficient * r.coefficient, variable: l.variable }];
      }
      return [{ coefficient: evaluate(e, {}), variable: null }];
    }
    case 'neg':
      return extractTerms(e.arg).map(t => ({ ...t, coefficient: -t.coefficient }));
    case 'div': {
      const r = e.right;
      if (isNum(r)) {
        return extractTerms(e.left).map(t => ({ ...t, coefficient: t.coefficient / r.value }));
      }
      return [{ coefficient: evaluate(e, {}), variable: null }];
    }
    case 'pow':
      return [{ coefficient: evaluate(e, {}), variable: null }];
  }
}

function termsToExpr(terms: Term[]): Expr {
  let result: Expr | null = null;
  for (const t of terms) {
    const termExpr = t.variable
      ? (t.coefficient === 1 ? variable(t.variable) : t.coefficient === -1 ? neg(variable(t.variable)) : mul(num(t.coefficient), variable(t.variable)))
      : num(t.coefficient);
    result = result ? add(result, termExpr) : termExpr;
  }
  return result ?? num(0);
}

export function exprEqual(a: Expr, b: Expr): boolean {
  if (a.tag !== b.tag) return false;
  switch (a.tag) {
    case 'num': return a.value === (b as typeof a).value;
    case 'var': return a.name === (b as typeof a).name;
    case 'add': case 'sub': case 'mul': case 'div': {
      const bb = b as typeof a;
      return exprEqual(a.left, bb.left) && exprEqual(a.right, bb.right);
    }
    case 'neg': return exprEqual(a.arg, (b as typeof a).arg);
    case 'pow': return exprEqual(a.base, (b as typeof a).base) && exprEqual(a.exp, (b as typeof a).exp);
  }
}

export function equationsEquivalent(a: Equation, b: Equation, trials = 20): boolean {
  const vars = new Set<string>();
  for (const v of equationVariables(a)) vars.add(v);
  for (const v of equationVariables(b)) vars.add(v);

  for (let i = 0; i < trials; i++) {
    const env: Record<string, number> = {};
    for (const v of vars) env[v] = Math.random() * 10 - 5;
    const aDiff = evaluate(a.left, env) - evaluate(a.right, env);
    const bDiff = evaluate(b.left, env) - evaluate(b.right, env);
    if (Math.abs(aDiff - bDiff) > 1e-9) return false;
  }
  return true;
}

export function parseExpr(input: string): Expr {
  const tokens = tokenize(input);
  const parser = new ExprParser(tokens);
  const result = parser.parseExpr();
  if (parser.pos < tokens.length) {
    throw new Error(`Unexpected token: ${tokens[parser.pos]}`);
  }
  return result;
}

export function parseEquation(input: string): Equation {
  const idx = input.indexOf('=');
  if (idx === -1) throw new Error('No equals sign found');
  const left = parseExpr(input.substring(0, idx).trim());
  const right = parseExpr(input.substring(idx + 1).trim());
  return { left, right };
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (ch === ' ' || ch === '\t') { i++; continue; }
    if ('0123456789'.includes(ch)) {
      let num = '';
      while (i < input.length && '0123456789.'.includes(input[i])) {
        num += input[i++];
      }
      tokens.push(num);
      continue;
    }
    if ('abcdefghijklmnopqrstuvwxyz'.includes(ch)) {
      tokens.push(ch);
      i++;
      continue;
    }
    if ('+-*/^()='.includes(ch)) {
      tokens.push(ch);
      i++;
      continue;
    }
    i++;
  }
  return tokens;
}

class ExprParser {
  constructor(public tokens: string[], public pos = 0) {}

  parseExpr(): Expr {
    return this.parseAddSub();
  }

  parseAddSub(): Expr {
    let left = this.parseMulDiv();
    while (this.pos < this.tokens.length && (this.peek() === '+' || this.peek() === '-')) {
      const op = this.advance();
      const right = this.parseMulDiv();
      left = op === '+' ? add(left, right) : sub(left, right);
    }
    return left;
  }

  parseMulDiv(): Expr {
    let left = this.parseUnary();
    while (this.pos < this.tokens.length && (this.peek() === '*' || this.peek() === '/')) {
      const op = this.advance();
      const right = this.parseUnary();
      left = op === '*' ? mul(left, right) : div(left, right);
    }
    const pk = this.peek();
    if (pk && this.pos < this.tokens.length && (isAlphaToken(pk) || isNumberToken(pk) || pk === '(')) {
      const right = this.parseUnary();
      left = mul(left, right);
    }
    return left;
  }

  parseUnary(): Expr {
    if (this.peek() === '-') {
      this.advance();
      const e = this.parsePow();
      if (isNum(e)) return num(-e.value);
      return neg(e);
    }
    if (this.peek() === '+') {
      this.advance();
    }
    return this.parsePow();
  }

  parsePow(): Expr {
    let base = this.parseAtom();
    if (this.peek() === '^') {
      this.advance();
      const exp = this.parseUnary();
      base = pow(base, exp);
    }
    return base;
  }

  parseAtom(): Expr {
    const tok = this.peek();
    if (tok === '(') {
      this.advance();
      const e = this.parseExpr();
      if (this.peek() === ')') this.advance();
      return e;
    }
    if (tok && isNumberToken(tok)) {
      this.advance();
      const n = parseFloat(tok);
      const pk2 = this.peek();
      if (pk2 && this.pos < this.tokens.length && isAlphaToken(pk2)) {
        const v = this.advance();
        return mul(num(n), variable(v));
      }
      return num(n);
    }
    if (tok && isAlphaToken(tok)) {
      this.advance();
      return variable(tok);
    }
    throw new Error(`Unexpected token: ${tok}`);
  }

  peek(): string | undefined {
    return this.tokens[this.pos];
  }

  advance(): string {
    return this.tokens[this.pos++];
  }
}

function isNumberToken(s: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(s);
}

function isAlphaToken(s: string): boolean {
  return /^[a-z]$/.test(s);
}

function isOperator(s: string | undefined): boolean {
  return s === '+' || s === '-' || s === '*' || s === '/' || s === '^' || s === '(' || s === ')' || s === '=';
}

function gcd(a: number, b: number): number {
  a = Math.round(a);
  b = Math.round(b);
  while (b) { [a, b] = [b, a % b]; }
  return Math.abs(a);
}

export function exprToJson(e: Expr): string {
  return JSON.stringify(e);
}

export function jsonToExpr(json: string): Expr {
  return JSON.parse(json);
}

export function equationToJson(eq: Equation): string {
  return JSON.stringify(eq);
}

export function jsonToEquation(json: string): Equation {
  return JSON.parse(json);
}
