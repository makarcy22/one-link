import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Lets browsers offer "Install app". Skipped in development so it never gets in the way.
if (import.meta.env.PROD && "serviceWorker" in navigator && import.meta.env.VITE_MOCK_API !== "true") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
