const { transformWithEsbuild } = require("vite");
const path = require("path");
const babel = require("vite-plugin-babel").default;

module.exports = function getViteConfig() {
  const vebelPath = path.dirname(
    require.resolve("@vebeljs/vebel/package.json"),
  );

  return {
    plugins: [
      babel({
        filter: /\.(js|jsx)$/,
        babelConfig: {
          presets: [],
          plugins: [
            require.resolve("@babel/plugin-syntax-jsx"),
            path.join(vebelPath, "plugins/babel-plugin-state-detection.js"),
          ],
        },
      }),
      {
        name: "treat-js-as-jsx",
        enforce: "pre",
        async transform(code, id) {
          if (!id.match(/\.(js)$/)) return;
          return transformWithEsbuild(code, id, {
            loader: "jsx",
            jsx: "automatic",
            jsxImportSource: "@vebeljs/vebel",
          });
        },
      },
      {
        name: "html-transform",
        transformIndexHtml(html) {
          return html.replace(
            "</body>",
            `<script type="module" src="/App.js"></script></body>`,
          );
        },
      },
    ],
    optimizeDeps: {
      exclude: ["react", "react-dom", "@vebeljs/vebel"],
      esbuildOptions: {
        jsx: "automatic",
        jsxImportSource: "@vebeljs/vebel",
        loader: { ".js": "jsx" },
      },
    },
    resolve: {
      symlinks: false,
      conditions: ["import", "module", "browser", "default"],
      alias: [{ find: "@vebeljs/vebel", replacement: vebelPath }],
    },
  };
};
