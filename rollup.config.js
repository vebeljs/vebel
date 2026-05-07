import typescript from "@rollup/plugin-typescript";
import babel from "@rollup/plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
import dts from "rollup-plugin-dts";
import { writeFileSync } from "fs";

const generateJsxRuntime = {
  name: "generate-jsx-runtime",
  writeBundle() {
    // ESM
    writeFileSync(
      "dist/jsx-runtime.esm.js",
      `export { jsx, jsxs, jsxDEV, Fragment } from "./index.esm.js";`,
    );
    // CJS
    writeFileSync(
      "dist/jsx-runtime.cjs.js",
      `const i = require("./index.cjs.js");\nmodule.exports = { jsx: i.jsx, jsxs: i.jsxs, jsxDEV: i.jsxDEV, Fragment: i.Fragment };`,
    );
    // types
    writeFileSync(
      "dist/jsx-runtime.d.ts",
      `export { jsx, jsxs, jsxDEV, Fragment } from "./index";`,
    );
    console.log("✅ jsx-runtime files generated");
  },
};

const plugins = [
  resolve(),
  typescript({ tsconfig: "./tsconfig.json" }),
  babel({
    babelHelpers: "bundled",
    extensions: [".js", ".ts", ".jsx", ".tsx"],
  }),
];

export default [
  // 1. CJS build
  {
    input: "src/index.ts",
    output: [
      { file: "dist/index.cjs.js", format: "cjs" },
      { file: "dist/index.esm.js", format: "esm" },
    ],
    plugins: [...plugins, generateJsxRuntime],
  },
  // 3. Type declarations
  {
    input: "src/index.ts",
    output: { file: "dist/index.d.ts", format: "esm" },
    plugins: [dts()],
  },
];
