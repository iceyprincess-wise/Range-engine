import { Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// D-2026-11-18-84: a render throw used to unmount the whole root
// with no fallback — blank page, reload the only recovery.
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: unknown }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, error };
  }
  componentDidCatch(error: unknown) {
    console.error("Range Engine crashed:", error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#000", color: "#fff", fontFamily: "sans-serif", padding: "2rem", textAlign: "center" }}>
          <div>
            <p style={{ fontWeight: 700 }}>Something went wrong — reload the page</p>
            <p style={{ opacity: 0.6, fontSize: "0.85rem" }}>The analyzer hit an unexpected error. Your saved history is untouched.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Range Engine: #root element not found — cannot mount");
createRoot(rootEl).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
