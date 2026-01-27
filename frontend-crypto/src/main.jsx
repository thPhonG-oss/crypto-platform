import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import OAuth2CallbackHandler from "./components/auth/OAuth2CallbackHandler";

// Check if this is an OAuth callback
const isOAuthCallback = window.location.pathname === "/auth/callback";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      {isOAuthCallback ? <OAuth2CallbackHandler /> : <App />}
    </AuthProvider>
  </StrictMode>,
);
