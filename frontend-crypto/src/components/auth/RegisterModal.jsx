/**
 * Register Modal Component
 * Modern glassmorphism design with neon accents
 */

import React, { useState } from "react";
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  UserPlus,
  AlertCircle,
  Check,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function RegisterModal({ isOpen, onClose, onSwitchToLogin }) {
  const { register, loading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setLocalError("");
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    // Validation
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setLocalError("Please fill in all fields");
      return;
    }

    if (formData.password.length < 8) {
      setLocalError("Password must be at least 8 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    try {
      await register(formData.email, formData.password, formData.fullName);
      onClose();
    } catch (err) {
      setLocalError(err.message);
    }
  };

  if (!isOpen) return null;

  const displayError = localError || error;

  // Password strength indicator
  const passwordStrength = () => {
    const pass = formData.password;
    if (!pass) return { level: 0, text: "", color: "" };
    if (pass.length < 6) return { level: 1, text: "Weak", color: "bg-red-500" };
    if (pass.length < 8)
      return { level: 2, text: "Fair", color: "bg-yellow-500" };
    if (pass.length >= 8 && /[A-Z]/.test(pass) && /[0-9]/.test(pass)) {
      return { level: 4, text: "Strong", color: "bg-green-500" };
    }
    return { level: 3, text: "Good", color: "bg-accent-info" };
  };

  const strength = passwordStrength();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-bg-secondary rounded-2xl p-8 border border-border-secondary shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-bg-tertiary transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-gray-400">Join Crypto Nexus today</p>
        </div>

        {/* Error display */}
        {displayError && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm">{displayError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Full name"
              className="w-full pl-12 pr-4 py-4 bg-gray-900/80 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:border-neon-purple/50 focus:ring-0 focus:shadow-[0_0_15px_-5px_var(--color-neon-purple)] transition-all outline-none"
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email address"
              className="w-full pl-12 pr-4 py-3.5 bg-bg-tertiary border border-border-primary rounded-lg text-white placeholder-gray-500 focus:border-accent-secondary focus:outline-none transition-all"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password (min 8 characters)"
                className="w-full pl-12 pr-12 py-3.5 bg-bg-tertiary border border-border-primary rounded-lg text-white placeholder-gray-500 focus:border-accent-secondary focus:outline-none transition-all"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Password strength */}
            {formData.password && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${strength.color}`}
                    style={{ width: `${strength.level * 25}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">{strength.text}</span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              className="w-full pl-12 pr-12 py-3.5 bg-bg-tertiary border border-border-primary rounded-lg text-white placeholder-gray-500 focus:border-accent-secondary focus:outline-none transition-all"
              disabled={loading}
            />
            {formData.confirmPassword &&
              formData.password === formData.confirmPassword && (
                <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
              )}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-lg font-semibold text-white bg-accent-secondary hover:bg-accent-secondary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Create Account
              </>
            )}
          </button>
        </form>

        {/* Features */}
        <div className="mt-8 space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
            What you'll get:
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              "Real-time charts",
              "News feed",
              "Price alerts",
              "VIP upgrades",
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 text-sm text-gray-400"
              >
                <Check className="w-4 h-4 text-accent-primary" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Switch to login */}
        <p className="mt-8 text-center text-gray-400">
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            className="text-accent-secondary hover:text-accent-primary transition-colors font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
