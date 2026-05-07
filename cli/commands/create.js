const fs = require("fs-extra");
const path = require("path");
const { execSync } = require("child_process");

module.exports = async function create(appName) {
  const targetDir = path.resolve(process.cwd(), appName);
  const templateDir = path.resolve(__dirname, "../template");

  console.log(`Creating ${appName}...`);

  // 1. Copy template folder into user's directory
  await fs.copy(templateDir, targetDir);

  // 2. Write their package.json
  const pkg = {
    name: appName,
    version: "1.0.0",
    scripts: {
      start: "vebel start",
      build: "vebel build",
    },
    dependencies: {
      "@vebeljs/vebel": "latest",
    },
  };

  await fs.writeJson(path.join(targetDir, "package.json"), pkg, { spaces: 2 });

  console.log(`📦 Installing dependencies...`);
  execSync("npm install", {
    cwd: targetDir, // ← runs npm install INSIDE my-app
    stdio: "inherit", // ← shows install progress to user
  });

  console.log(`
✅ Done! Now run:

   cd ${appName}
   npm start
  `);
};
