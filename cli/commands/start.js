const { createServer } = require("vite");
const getViteConfig = require("../shared/vite-config");

module.exports = async function start() {
  const userRoot = process.cwd();
  const config = getViteConfig();

  const server = await createServer({
    root: userRoot,
    ...config,
    esbuild: {
      jsx: "automatic",
      jsxImportSource: "@vebeljs/vebel",
      loader: "jsx",
      include: /.*\.jsx?$/,
    },
    server: { port: 3030, fs: { allow: [userRoot] }, open: true },
  });

  await server.listen();
  server.printUrls();
};
