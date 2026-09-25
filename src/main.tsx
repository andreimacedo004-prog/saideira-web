import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ProvedorDeAutenticacao } from "./auth/AuthContext";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ProvedorDeAutenticacao>
      <App />
    </ProvedorDeAutenticacao>
  </StrictMode>,
);

// Service worker so no build de producao: em dev ele guardaria arquivos
// velhos em cache e voce passaria a tarde sem ver suas mudancas.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Sem service worker o app funciona igual, so nao abre offline.
    });
  });
}
