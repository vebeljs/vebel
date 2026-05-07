const { build } = require("vite");
const path = require("path");
const getViteConfig = require("../shared/vite-config");

module.exports = async function buildApp() {
  const userRoot = process.cwd();
  const config = getViteConfig();

  await build({
    root: userRoot,
    ...config,
    build: { outDir: path.join(userRoot, "dist") },
  });

  console.log("✅ Build complete → dist/");
};
