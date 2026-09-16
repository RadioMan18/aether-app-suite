import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const root = document.getElementById("root");

window.addEventListener("error", (event) => {
  window.parent.postMessage(
    { type: "nidus:plugin-error", error: event.error?.stack ?? event.message },
    "*",
  );
});

window.addEventListener("unhandledrejection", (event) => {
  window.parent.postMessage(
    { type: "nidus:plugin-error", error: String(event.reason) },
    "*",
  );
});

if (!root) {
  throw new Error("Root element not found");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    window.parent.postMessage({
      type: "nidus:plugin-mounted",
      plugin: "notes",
      details: {
        root: root.getBoundingClientRect().toJSON(),
        body: document.body.getBoundingClientRect().toJSON(),
        text: document.body.innerText,
      },
    }, "*");
  });
});
