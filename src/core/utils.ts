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

function estimateObjectSize(...args): string {
  let totalSize = 0;
  args.forEach((obj) => {
    const seen = new WeakSet();

    function sizeOf(value: any): number {
      if (value === null || value === undefined) return 0;

      const type = typeof value;

      // Primitives
      if (type === "boolean") return 4;
      if (type === "number") return 8;
      if (type === "string") return value.length * 2;
      if (type === "symbol") return 0;
      if (type === "function") return 0;

      // If already seen, skip (avoid circular references)
      if (seen.has(value)) return 0;
      seen.add(value);

      // Arrays
      if (Array.isArray(value)) {
        return value.map(sizeOf).reduce((acc, cur) => acc + cur, 0);
      }

      // Objects
      if (type === "object") {
        let size = 0;
        for (let key in value) {
          if (value.hasOwnProperty(key)) {
            size += key.length * 2; // key size (as string)
            size += sizeOf(value[key]);
          }
        }
        return size;
      }

      return 0;
    }

    totalSize += sizeOf(obj);
  });

  return `${(totalSize / 1024).toFixed(3)} KB`;
}

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

function removeValueFromObject(o: any, target: string) {
  if (Array.isArray(o)) {
    // remove the target value
    return o.filter((item) => item !== target);
  } else if (o && typeof o === "object") {
    for (const key in o) {
      o[key] = removeValueFromObject(o[key], target);

      // OPTIONAL: delete key if its array became empty
      if (Array.isArray(o[key]) && o[key].length === 0) {
        delete o[key];
      }
    }
  }
  return o;
}

function isDOMStructure(value: any) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.nodeType === "number" &&
    [1, 3, 8, 11].includes(value.nodeType)
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

const delay = (time: number) =>
  new Promise((res) => {
    setTimeout(() => res(1), time);
  });

export {
  isEqual,
  reservedJSKeys,
  selfClosingTags,
  estimateObjectSize,
  isComponentFunction,
  isPlainObject,
  isCamelCase,
  styleObjectToCss,
  removeValueFromObject,
  isJSXExpressionObj,
  isJSXConditionObj,
  isDOMStructure,
  isLazyChildren,
  delay,
  SVG_TAGS,
};
