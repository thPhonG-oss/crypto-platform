/**
 * Auth Buttons Component
 * Login/Register buttons for unauthenticated users
 */

import React from "react";
import { LogIn, UserPlus } from "lucide-react";

export default function AuthButtons({ onLoginClick, onRegisterClick }) {
  return (
    <div className="flex items-center gap-2">
      {/* Login button */}
      <button
        onClick={onLoginClick}
        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-gray-300 hover:text-white transition-all"
      >
        <LogIn className="w-4 h-4" />
        <span className="hidden sm:inline">Sign In</span>
      </button>

      {/* Register button */}
      <button
        onClick={onRegisterClick}
        className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white bg-accent-primary hover:bg-accent-primary/90 transition-all"
      >
        <UserPlus className="w-4 h-4" />
        <span className="hidden sm:inline">Sign Up</span>
      </button>
    </div>
  );
}
