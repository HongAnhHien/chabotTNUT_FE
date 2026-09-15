// Trình phân tích & tính biểu thức toán an toàn (KHÔNG dùng eval).
// Hỗ trợ: + - * / ^, ngoặc, đơn nguyên -, biến x, hằng pi/e,
// hàm: sin cos tan asin acos atan sinh cosh tanh sqrt exp ln log log10 abs sign floor ceil round.
// Có nhân ngầm: 2x, 2(x+1), (x+1)(x-1), 3sin(x).

type Node =
  | { k: "num"; v: number }
  | { k: "var" }
  | { k: "neg"; a: Node }
  | { k: "bin"; op: string; a: Node; b: Node }
  | { k: "call"; fn: string; a: Node };

const FUNCS: Record<string, (x: number) => number> = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  asin: Math.asin, acos: Math.acos, atan: Math.atan,
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
  sqrt: Math.sqrt, exp: Math.exp,
  ln: Math.log, log: Math.log, log10: Math.log10,
  abs: Math.abs, sign: Math.sign, floor: Math.floor, ceil: Math.ceil, round: Math.round,
};

const CONSTS: Record<string, number> = { pi: Math.PI, e: Math.E };

type Tok = { t: "num" | "id" | "op" | "lp" | "rp"; v: string };

function tokenize(src: string): Tok[] {
  const s = src.replace(/\s+/g, "");
  const toks: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/[0-9.]/.test(c)) {
      let j = i + 1;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      toks.push({ t: "num", v: s.slice(i, j) });
      i = j;
    } else if (/[a-zA-Z]/.test(c)) {
      let j = i + 1;
      while (j < s.length && /[a-zA-Z0-9]/.test(s[j])) j++;
      toks.push({ t: "id", v: s.slice(i, j) });
      i = j;
    } else if ("+-*/^".includes(c)) {
      toks.push({ t: "op", v: c });
      i++;
    } else if (c === "(") { toks.push({ t: "lp", v: c }); i++; }
    else if (c === ")") { toks.push({ t: "rp", v: c }); i++; }
    else throw new Error(`Ký tự không hợp lệ: "${c}"`);
  }
  return toks;
}

// Recursive descent với nhân ngầm.
function parse(toks: Tok[]): Node {
  let pos = 0;
  const peek = () => toks[pos];
  const eat = () => toks[pos++];

  function parseExpr(): Node { // + -
    let node = parseTerm();
    while (peek() && peek().t === "op" && (peek().v === "+" || peek().v === "-")) {
      const op = eat().v;
      node = { k: "bin", op, a: node, b: parseTerm() };
    }
    return node;
  }

  function parseTerm(): Node { // * / và nhân ngầm
    let node = parseUnary();
    for (;;) {
      const p = peek();
      if (p && p.t === "op" && (p.v === "*" || p.v === "/")) {
        const op = eat().v;
        node = { k: "bin", op, a: node, b: parseUnary() };
      } else if (p && (p.t === "num" || p.t === "id" || p.t === "lp")) {
        // nhân ngầm: 2x, 2(..), (..)(..)
        node = { k: "bin", op: "*", a: node, b: parseUnary() };
      } else break;
    }
    return node;
  }

  function parseUnary(): Node {
    const p = peek();
    if (p && p.t === "op" && (p.v === "+" || p.v === "-")) {
      const op = eat().v;
      const a = parseUnary();
      return op === "-" ? { k: "neg", a } : a;
    }
    return parsePow();
  }

  function parsePow(): Node { // ^ (phải kết hợp)
    const base = parseAtom();
    const p = peek();
    if (p && p.t === "op" && p.v === "^") {
      eat();
      return { k: "bin", op: "^", a: base, b: parseUnary() };
    }
    return base;
  }

  function parseAtom(): Node {
    const p = eat();
    if (!p) throw new Error("Biểu thức chưa hoàn chỉnh.");
    if (p.t === "num") {
      const v = Number(p.v);
      if (Number.isNaN(v)) throw new Error(`Số không hợp lệ: "${p.v}"`);
      return { k: "num", v };
    }
    if (p.t === "lp") {
      const node = parseExpr();
      if (!peek() || peek().t !== "rp") throw new Error("Thiếu dấu ')'.");
      eat();
      return node;
    }
    if (p.t === "id") {
      const name = p.v.toLowerCase();
      if (name === "x") return { k: "var" };
      if (name in CONSTS) return { k: "num", v: CONSTS[name] };
      if (name in FUNCS) {
        if (!peek() || peek().t !== "lp") throw new Error(`Hàm ${name} cần dấu '('.`);
        eat();
        const arg = parseExpr();
        if (!peek() || peek().t !== "rp") throw new Error("Thiếu dấu ')'.");
        eat();
        return { k: "call", fn: name, a: arg };
      }
      throw new Error(`Không nhận ra "${p.v}".`);
    }
    throw new Error("Cú pháp không hợp lệ.");
  }

  const node = parseExpr();
  if (pos < toks.length) throw new Error("Dư ký tự ở cuối biểu thức.");
  return node;
}

function evalNode(n: Node, x: number): number {
  switch (n.k) {
    case "num": return n.v;
    case "var": return x;
    case "neg": return -evalNode(n.a, x);
    case "call": return FUNCS[n.fn](evalNode(n.a, x));
    case "bin": {
      const a = evalNode(n.a, x);
      const b = evalNode(n.b, x);
      switch (n.op) {
        case "+": return a + b;
        case "-": return a - b;
        case "*": return a * b;
        case "/": return a / b;
        case "^": return Math.pow(a, b);
        default: return NaN;
      }
    }
  }
}

export type MathFn = (x: number) => number;

/** Biên dịch biểu thức (theo biến x) thành hàm số. Ném lỗi nếu cú pháp sai. */
export function compile(expr: string): MathFn {
  const ast = parse(tokenize(expr));
  return (x: number) => evalNode(ast, x);
}
