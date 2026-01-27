/**
 * VIP Upgrade Modal Component
 * Shows VIP packages and handles VNPAY payment
 */

import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Crown,
  Check,
  Sparkles,
  Shield,
  Zap,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import paymentService from "../../services/paymentService";

export default function VipUpgradeModal({ isOpen, onClose }) {
  const { user, isAuthenticated } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState("VIP_3_MONTHS");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      setError("Vui lòng đăng nhập để nâng cấp VIP");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await paymentService.createPayment(selectedPackage);

      if (result.success && result.paymentUrl) {
        // Store order info for callback
        localStorage.setItem(
          "pending_payment",
          JSON.stringify({
            orderId: result.orderId,
            packageType: selectedPackage,
            amount: result.amount,
            createdAt: new Date().toISOString(),
          }),
        );

        // Redirect to VNPAY
        window.location.href = result.paymentUrl;
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(
        err.response?.data?.message ||
          "Không thể tạo thanh toán. Vui lòng thử lại.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-b border-gray-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Nâng cấp VIP</h2>
              <p className="text-gray-400">Mở khóa tất cả tính năng cao cấp</p>
            </div>
          </div>
        </div>

        {/* VIP Benefits */}
        <div className="p-6 border-b border-gray-800 bg-gray-900/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: Sparkles,
                label: "Phân tích AI",
                desc: "Cảm xúc thị trường",
              },
              {
                icon: Zap,
                label: "Tín hiệu giao dịch",
                desc: "Realtime alerts",
              },
              {
                icon: Shield,
                label: "Dự đoán xu hướng",
                desc: "Machine Learning",
              },
              { icon: Crown, label: "Ưu tiên hỗ trợ", desc: "24/7 support" },
            ].map((benefit, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-gray-800/50"
              >
                <benefit.icon className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white">
                    {benefit.label}
                  </p>
                  <p className="text-xs text-gray-500">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            {paymentService.packages.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg.id)}
                className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedPackage === pkg.id
                    ? "border-amber-500 bg-amber-500/10 shadow-[0_0_30px_-10px_#f59e0b]"
                    : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                }`}
              >
                {/* Popular Badge */}
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full">
                    Phổ biến nhất
                  </div>
                )}

                {/* Selection Indicator */}
                <div
                  className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPackage === pkg.id
                      ? "border-amber-500 bg-amber-500"
                      : "border-gray-600"
                  }`}
                >
                  {selectedPackage === pkg.id && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>

                <h3 className="text-lg font-bold text-white mb-1">
                  {pkg.name}
                </h3>
                <p className="text-sm text-gray-400 mb-4">{pkg.duration}</p>

                <div className="mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">
                      {paymentService.formatPrice(pkg.price)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-500 line-through">
                      {paymentService.formatPrice(pkg.originalPrice)}
                    </span>
                    <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded">
                      -{pkg.savings}
                    </span>
                  </div>
                </div>

                <ul className="space-y-2">
                  {pkg.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm text-gray-300"
                    >
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* CTA Button */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Shield className="w-4 h-4" />
              <span>Thanh toán an toàn qua VNPAY</span>
            </div>

            <button
              onClick={handleUpgrade}
              disabled={isLoading}
              className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 transition-all shadow-[0_0_30px_-5px_#f59e0b] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  Thanh toán ngay
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          {/* Footer Note */}
          <p className="mt-4 text-center text-xs text-gray-500">
            Bằng việc tiếp tục, bạn đồng ý với Điều khoản sử dụng và Chính sách
            bảo mật của chúng tôi.
          </p>
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at document body level
  return createPortal(modalContent, document.body);
}
