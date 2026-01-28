/**
 * VIP Badge Component
 * Shows VIP-only content indicator
 */

import React from "react";
import { Crown, Lock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

/**
 * VIP Badge - displays a VIP indicator
 */
export function VipBadge({ className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full ${className}`}
    >
      <Crown className="w-3 h-3" />
      VIP
    </span>
  );
}

/**
 * VIP Gate - wraps content that requires VIP access
 */
export function VipGate({ children, fallback = null }) {
  const { isVip } = useAuth();

  if (isVip) {
    return children;
  }

  return fallback || <VipLockedContent />;
}

/**
 * VIP Locked Content placeholder
 */
export function VipLockedContent({ message = "VIP content", onUpgrade }) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-gray-900/50 border border-amber-500/20 text-center">
      <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-amber-400" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">VIP Only</h3>
      <p className="text-gray-400 text-sm mb-4 max-w-xs">{message}</p>

      {isAuthenticated ? (
        <button
          onClick={onUpgrade}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-linear-to-r from-amber-500 to-orange-500 hover:opacity-90 transition-all shadow-[0_0_20px_-5px_#f59e0b]"
        >
          <Crown className="w-5 h-5" />
          Upgrade to VIP
        </button>
      ) : (
        <p className="text-xs text-gray-500">
          Sign in and upgrade to access this feature
        </p>
      )}
    </div>
  );
}

/**
 * VIP Feature Tag - small tag to indicate VIP feature
 */
export function VipTag({ className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 rounded ${className}`}
    >
      <Crown className="w-2.5 h-2.5" />
      VIP
    </span>
  );
}

export default VipBadge;
