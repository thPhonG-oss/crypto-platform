import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext";
import { WebSocketProvider } from "./context/WebSocketContext.jsx";
import OAuth2CallbackHandler from "./components/auth/OAuth2CallbackHandler";
import PaymentCallback from "./components/auth/PaymentCallback";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        {/* ✅ Wrap App with WebSocketProvider for shared connection */}
        <WebSocketProvider>
          <Routes>
            <Route path="/auth/callback" element={<OAuth2CallbackHandler />} />
            <Route path="/payment/callback" element={<PaymentCallback />} />
            <Route path="/*" element={<App />} />
          </Routes>
        </WebSocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
