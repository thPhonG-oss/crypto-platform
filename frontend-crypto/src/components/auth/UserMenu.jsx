/**
 * User Menu Component
 * Dropdown menu for authenticated users
 */

import React, { useState, useRef, useEffect } from "react";
import {
  User,
  LogOut,
  Crown,
  Settings,
  ChevronDown,
  Sparkles,
  CreditCard,
  History,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { CONFIG } from "../../config";
import VipUpgradeModal from "./VipUpgradeModal";

export default function UserMenu() {
  const { user, isVip, isAdmin, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  const getRoleBadge = () => {
    if (isAdmin) {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 rounded-full">
          Admin
        </span>
      );
    }
    if (isVip) {
      return (
        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full flex items-center gap-1">
          <Crown className="w-3 h-3" />
          VIP
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded-full">
        Free
      </span>
    );
  };

  return (
    <div ref={menuRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-bg-tertiary border border-border-primary hover:border-border-secondary transition-all"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white font-bold text-sm">
          {user?.fullName?.charAt(0)?.toUpperCase() ||
            user?.email?.charAt(0)?.toUpperCase() ||
            "U"}
        </div>

        {/* User info */}
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-white truncate max-w-[120px]">
            {user?.fullName || user?.email?.split("@")[0] || "User"}
          </p>
          <p className="text-[10px] text-gray-500 truncate max-w-[120px]">
            {user?.email}
          </p>
        </div>

        {/* Chevron */}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-bg-secondary rounded-xl border border-border-secondary shadow-xl overflow-hidden z-[9999] max-h-[80vh] overflow-y-auto">
          {/* User header */}
          <div className="p-4 border-b border-border-primary">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center text-white font-bold text-lg">
                {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">
                  {user?.fullName || "User"}
                </p>
                <p className="text-sm text-gray-400 truncate">{user?.email}</p>
                <div className="mt-1">{getRoleBadge()}</div>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-2">
            {/* VIP upgrade (only for non-VIP users) */}
            {!isVip && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowUpgradeModal(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left bg-accent-warning/10 border border-accent-warning/20 hover:border-accent-warning/40 transition-all mb-2"
              >
                <div className="p-2 rounded-lg bg-accent-warning/20">
                  <Crown className="w-4 h-4 text-accent-warning" />
                </div>
                <div>
                  <p className="font-medium text-accent-warning">
                    Upgrade to VIP
                  </p>
                  <p className="text-xs text-gray-500">Unlock AI analysis</p>
                </div>
                <Sparkles className="w-4 h-4 text-accent-warning ml-auto animate-pulse" />
              </button>
            )}

            {/* Payment History */}
            <button
              onClick={() => {
                setIsOpen(false);
                // TODO: Navigate to payment history
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-bg-tertiary transition-all"
            >
              <History className="w-4 h-4" />
              <span>Lịch sử thanh toán</span>
            </button>

            {/* Profile */}
            <button
              onClick={() => {
                setIsOpen(false);
                // Navigate to profile
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-bg-tertiary transition-all"
            >
              <User className="w-4 h-4" />
              <span>Profile</span>
            </button>

            {/* Billing (for VIP) */}
            {isVip && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to billing
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-bg-tertiary transition-all"
              >
                <CreditCard className="w-4 h-4" />
                <span>Billing</span>
              </button>
            )}

            {/* Settings */}
            <button
              onClick={() => {
                setIsOpen(false);
                // Navigate to settings
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-bg-tertiary transition-all"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>

            {/* Divider */}
            <div className="my-2 border-t border-border-primary" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-accent-danger hover:bg-accent-danger/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}

      {/* VIP Upgrade Modal */}
      <VipUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
}
