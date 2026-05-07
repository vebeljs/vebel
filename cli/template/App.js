import { renderApp, defineRoutes, state } from "@vebeljs/vebel";

function App() {
  const count = state(0);

  return (
    <button onClick={() => count.set((c) => c + 1)}>Counter : {count()}</button>
  );
}

defineRoutes({
  "/": App,
});

renderApp();
