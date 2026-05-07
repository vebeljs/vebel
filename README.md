# Vebel

A lightweight JavaScript UI framework with fine-grained reactivity without virtual DOM overhead.
Unlike **re-rendering the whole component**, Vebel only updates the exact DOM node where state is used.

## Why Vebel?

It became hectic to manage code when the entire component tree re-renders on every state change.  
Vebel tracks exactly where each state value is used in the DOM and **updates only that part — no virtual DOM, no diffing, no unnecessary work.**

```jsx
function App() {
  const count = state(0);

  return (
    <button onClick={() => count.set((c) => c + 1)}>
      Clicks: {count()} {/* only this text node updates */}
    </button>
  );
}
```

## Installation

```bash
npx @vebeljs/vebel create my-app
cd my-app
npm start
```

## Manual Setup

```bash
npm install @vebeljs/vebel
```

```jsx
import { renderApp, defineRoutes, state } from "@vebeljs/vebel";

function App() {
  const count = state(0);

  return (
    <button onClick={() => count.set((c) => c + 1)}>Counter: {count()}</button>
  );
}

defineRoutes({
  "/": App,
});

renderApp();
```

## Core Concepts

- **Reactivity** — Fine-grained signal-based state — no diffing needed.
- **Components** — Pure functions that return templates. Simple and composable.
- **Routing** — Programmatic nested routes supported with layouts.
- **Stores** — Global reactive state and Preserved states with zero boilerplate.
- **Hooks** - setEffect, useElementRef, useGlobal, fromParent — familiar and predictable.

## Documentation

Full docs, guides and API reference → **...**

## License

MIT
