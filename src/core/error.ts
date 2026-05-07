class VebelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VebelError";

    if (this.stack) {
      const lines = this.stack.split("\n");
      this.stack = [
        lines[0],
        ...lines.filter(
          (line) =>
            !line.includes("VebelJS") && !line.includes("VebelNavigation"),
        ),
      ].join("\n");
    }
  }
}

export { VebelError };
