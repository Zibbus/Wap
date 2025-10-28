import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./hooks/useAuth";
import { LoginModalProvider } from "./hooks/useLoginModal";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <LoginModalProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </LoginModalProvider>
    </AuthProvider>
  </StrictMode>
);