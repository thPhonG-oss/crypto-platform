import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

/**
 * OAuth2 Callback Handler
 * Handles the OAuth callback without requiring react-router
 */
const OAuth2CallbackHandler = () => {
  const { loginWithTokens } = useAuth();
  const [status, setStatus] = useState("processing");
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const accessToken = params.get("accessToken");
      const refreshToken = params.get("refreshToken");
      const errorParam = params.get("error");

      if (errorParam) {
        setStatus("error");
        setError(decodeURIComponent(errorParam));
        setTimeout(() => {
          window.location.href = "/";
        }, 3000);
        return;
      }

      if (accessToken && refreshToken) {
        try {
          await loginWithTokens(accessToken, refreshToken);
          setStatus("success");
          setTimeout(() => {
            window.location.href = "/";
          }, 1500);
        } catch (err) {
          setStatus("error");
          setError(err.message || "Failed to complete authentication");
          setTimeout(() => {
            window.location.href = "/";
          }, 3000);
        }
      } else {
        setStatus("error");
        setError("Missing authentication tokens");
        setTimeout(() => {
          window.location.href = "/";
        }, 3000);
      }
    };

    handleCallback();
  }, [loginWithTokens]);

  return (
    <div className="min-h-screen bg-deep-bg flex items-center justify-center">
      <div className="glass-panel rounded-2xl p-8 max-w-md w-full mx-4 text-center">
        {status === "processing" && (
          <>
            <Loader2 className="w-16 h-16 text-neon-blue animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Completing Sign In...
            </h2>
            <p className="text-gray-400">
              Please wait while we verify your credentials.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Welcome Back!
            </h2>
            <p className="text-gray-400">Sign in successful. Redirecting...</p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Authentication Failed
            </h2>
            <p className="text-red-400 mb-2">{error}</p>
            <p className="text-gray-400 text-sm">Redirecting to home page...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuth2CallbackHandler;
