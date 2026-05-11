class VebelError extends Error {
  constructor(module: string, message: string) {
    super(message);

    this.name = `VebelError [${module}]`;

    if (this.stack) {
      const lines = this.stack.split("\n");

      this.stack = [
        lines[0],
        ...lines.filter(
          (line) =>
            !line.includes("node_modules/vebel") &&
            !line.includes("VebelJS") &&
            !line.includes("internal"),
        ),
      ].join("\n");
    }
  }
}

export { VebelError };
