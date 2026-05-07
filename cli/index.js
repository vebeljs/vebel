#!/usr/bin/env node

const { program } = require("commander");
process.env.VITE_CJS_IGNORE_WARNING = "true";
program.name("vebel").version("1.0.0");

program
  .command("create <app-name>")
  .description("Create a new vebel app")
  .action((appName) => {
    require("./commands/create")(appName);
  });

program
  .command("start")
  .description("Start dev server")
  .action(() => {
    require("./commands/start")();
  });

program
  .command("build")
  .description("Build for production")
  .action(() => {
    require("./commands/build")();
  });

program.parse(process.argv);
