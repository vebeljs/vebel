import { renderApp, defineRoutes, state } from "@vebeljs/vebel";
import "./index.css";

function App() {
  const count = state(0);
  const name = state("World");

  return (
    <div style={{ background: "#0d1117", height: "100vh", width: "100%" }}>
      <div
        style={{
          fontFamily: "sans-serif",
          maxWidth: 600,
          margin: "0 auto",
          padding: "40px 20px",
          textAlign: "center",
          background: "#0d1117",
        }}
      >
        <div style={{ marginBottom: "40px" }}>
          <div style={{ marginBottom: "40px" }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={60}
              height={60}
              viewBox="-20 -25 40 40"
              role="img"
            >
              <g>
                <polygon points="-16,-22 -8,-22 0,10 -8,10" fill="#a8b1ff" />
                <polygon points="8,-22 16,-22 8,10 0,10" fill="#6675ee" />
              </g>
            </svg>

            <h1
              style={{
                fontSize: "2.5rem",
                color: "#a8b1ff",
                margin: "8px 0 8px 0",
              }}
            >
              Vebel App
            </h1>
            <p style={{ color: "#888", fontSize: "1rem", margin: "0" }}>
              Fast, simple, and reactive.
            </p>
          </div>
        </div>

        <div
          style={{
            background: "#161b22",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <p
            style={{
              color: "#e6edf3",
              marginBottom: "12px",
              fontSize: "1.1rem",
            }}
          >
            Hello, <strong style={{ color: "#6675ee" }}>{name()}</strong> 👋
          </p>
          <input
            placeholder="Enter your name"
            onInput={(e) => name.set(e.target.value)}
            className="input-box"
          />
        </div>

        <div
          style={{
            background: "#1c2128",
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <p
            style={{
              color: "#8b949e",
              marginBottom: "16px",
              fontSize: "0.95rem",
            }}
          >
            COUNTER
          </p>
          <p
            style={{
              fontSize: "3rem",
              fontWeight: "bold",
              color: "#6675ee",
              margin: "0 0 16px 0",
            }}
          >
            {count()}
          </p>
          <div
            style={{ display: "flex", gap: "12px", justifyContent: "center" }}
          >
            <button
              onClick={() => count.set((c) => c - 1)}
              className="button orange"
            >
              −
            </button>
            <button onClick={() => count.set(0)} className="button reset">
              Reset
            </button>
            <button
              onClick={() => count.set((c) => c + 1)}
              className="button purple"
            >
              +
            </button>
          </div>
        </div>

        <p
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            color: "#8b949e",
            fontSize: "0.85rem",
          }}
        >
          Built with ⚡{" "}
          <a
            href="https://vebeljs.github.io/docs/"
            target="_blank"
            style={{ textDecoration: "none" }}
          >
            <strong style={{ color: "#6675ee" }}>Vebel</strong>
          </a>
        </p>
      </div>
    </div>
  );
}

defineRoutes({
  "/": App,
});

renderApp();
