import { JSXExpressionObj, JSXConditionObj, Vebeljs } from "./types";

const reservedJSKeys = new Set([
  "true",
  "false",
  "null",
  "undefined",
  "if",
  "else",
  "return",
  "for",
  "while",
  "do",
  "break",
  "continue",
  "function",
  "let",
  "const",
  "var",
  "new",
  "typeof",
  "instanceof",
  "switch",
  "case",
  "default",
  "try",
  "catch",
  "finally",
  "throw",
  "this",
  "with",
  "Math",
  "Date",
  "Array",
  "Object",
  "JSON",
  "console",
  "Number",
  "String",
  "Boolean",
  "window",
  "document",
  "Function",
  "constructor",
  "alert",
  "eval",
]);

const selfClosingTags = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
]);

const isEqual = (a, b) => {
  const seen = new WeakMap();

  function deepEqual(x, y) {
    // Fast path for strict equality
    if (x === y) return true;

    // Handle null & undefined
    if (x == null || y == null) return x === y;

    // Handle Date
    if (x instanceof Date && y instanceof Date)
      return x.getTime() === y.getTime();

    // Handle primitive types and functions
    if (typeof x !== "object" || typeof y !== "object") return x === y;

    // Avoid circular reference infinite loops
    if (seen.has(x)) return seen.get(x) === y;
    seen.set(x, y);

    // Compare array length and object keys
    const xKeys = Object.keys(x);
    const yKeys = Object.keys(y);
    if (xKeys.length !== yKeys.length) return false;

    // Deep compare all keys
    for (const key of xKeys) {
      if (!yKeys.includes(key) || !deepEqual(x[key], y[key])) {
        return false;
      }
    }

    return true;
  }

  return deepEqual(a, b);
};

function isComponentFunction(
  fn: Function,
  callback: (error: string) => void,
): string | false {
  const fnSource = fn?.toString();
  const fnName = fn?.name;

  if (
    fnSource.trim() === "attributes => this.createElement(tag, attributes)" &&
    !fnName
  ) {
    return false;
  }

  return fnName;
}

function isPlainObject(obj: any): boolean {
  return typeof obj === "object" && obj !== null && obj.constructor === Object;
}

function isJSXExpressionObj(x: any): x is JSXExpressionObj {
  return x != null && typeof x === "object" && "eval" in x && "states" in x;
}

function isJSXConditionObj(x: any): x is JSXConditionObj {
  return (
    x != null &&
    typeof x === "object" &&
    "eval" in x &&
    "states" in x &&
    "then" in x &&
    "else" in x
  );
}

function isCamelCase(str: string) {
  return str[0] === str[0].toUpperCase();
}

const unitLessProps = new Set([
  "opacity",
  "z-index",
  "font-weight",
  "line-height",
  "zoom",
  "flex",
  "order",
]);

function styleObjectToCss(obj: { [key: string]: string | number }) {
  return (
    Object.entries(obj)
      .map(([key, value]) => {
        // convert camelCase to kebab-case
        const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();

        const cssValue =
          typeof value === "number" && !unitLessProps.has(cssKey)
            ? value + "px"
            : value;

        return `${cssKey}:${cssValue}`;
      })
      .join(";") + ";"
  );
}

const SVG_TAGS = new Set([
  "svg",
  "g",
  "path",
  "circle",
  "rect",
  "line",
  "polygon",
  "polyline",
  "ellipse",
  "text",
  "tspan",
  "defs",
  "clipPath",
  "mask",
  "linearGradient",
  "radialGradient",
  "stop",
  "use",
  "symbol",
  "pattern",
  "foreignObject",
]);

function isLazyChildren(value: any): value is Vebeljs.AsyncComponent {
  return (
    value !== null &&
    typeof value === "object" &&
    "importFn" in value &&
    "props" in value
  );
}

export {
  isEqual,
  reservedJSKeys,
  selfClosingTags,
  isComponentFunction,
  isPlainObject,
  isCamelCase,
  styleObjectToCss,
  isJSXExpressionObj,
  isJSXConditionObj,
  isLazyChildren,
  SVG_TAGS,
};
