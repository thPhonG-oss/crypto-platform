/**
 * Payment Callback Page
 * Handles VNPAY return after payment
 */

import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Crown,
  Home,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import paymentService from "../../services/paymentService";

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [status, setStatus] = useState("loading"); // loading, success, failed
  const [paymentInfo, setPaymentInfo] = useState(null);

  useEffect(() => {
    handlePaymentCallback();
  }, []);

  const handlePaymentCallback = async () => {
    try {
      const responseCode = searchParams.get("vnp_ResponseCode");
      const orderId = searchParams.get("vnp_TxnRef");
      const amount = searchParams.get("vnp_Amount");
      const bankCode = searchParams.get("vnp_BankCode");
      const transactionNo = searchParams.get("vnp_TransactionNo");

      // Get stored payment info
      const pendingPayment = JSON.parse(
        localStorage.getItem("pending_payment") || "{}",
      );

      if (responseCode === "00") {
        // Payment successful
        setStatus("success");
        setPaymentInfo({
          orderId,
          amount: parseInt(amount) / 100, // VNPAY returns amount * 100
          bankCode,
          transactionNo,
          packageType: pendingPayment.packageType || "VIP",
        });

        // Refresh user data to get new VIP status
        if (refreshUser) {
          await refreshUser();
        }

        // Clear pending payment
        localStorage.removeItem("pending_payment");
      } else {
        // Payment failed
        setStatus("failed");
        setPaymentInfo({
          orderId,
          responseCode,
          message: getErrorMessage(responseCode),
        });
      }
    } catch (error) {
      console.error("Payment callback error:", error);
      setStatus("failed");
      setPaymentInfo({
        message: "Có lỗi xảy ra khi xử lý thanh toán",
      });
    }
  };

  const getErrorMessage = (code) => {
    const messages = {
      "07": "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).",
      "09": "Giao dịch không thành công do: Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking.",
      10: "Giao dịch không thành công do: Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.",
      11: "Giao dịch không thành công do: Đã hết hạn chờ thanh toán.",
      12: "Giao dịch không thành công do: Thẻ/Tài khoản bị khóa.",
      13: "Giao dịch không thành công do: Sai mật khẩu xác thực giao dịch (OTP).",
      24: "Giao dịch không thành công do: Khách hàng hủy giao dịch.",
      51: "Giao dịch không thành công do: Tài khoản không đủ số dư.",
      65: "Giao dịch không thành công do: Tài khoản đã vượt quá hạn mức giao dịch trong ngày.",
      75: "Ngân hàng thanh toán đang bảo trì.",
      79: "Giao dịch không thành công do: Sai mật khẩu thanh toán quá số lần quy định.",
      99: "Lỗi không xác định.",
    };
    return messages[code] || "Giao dịch không thành công. Vui lòng thử lại.";
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-amber-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            Đang xử lý thanh toán...
          </h2>
          <p className="text-gray-400">Vui lòng không đóng trang này</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Success Card */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            {/* Success Header */}
            <div className="p-8 bg-gradient-to-br from-green-500/20 to-emerald-500/20 text-center border-b border-gray-800">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Thanh toán thành công!
              </h1>
              <p className="text-gray-400">
                Chúc mừng bạn đã trở thành thành viên VIP
              </p>
            </div>

            {/* Payment Details */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-800">
                <span className="text-gray-400">Mã đơn hàng</span>
                <span className="text-white font-mono text-sm">
                  {paymentInfo?.orderId}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-800">
                <span className="text-gray-400">Số tiền</span>
                <span className="text-white font-bold">
                  {paymentService.formatPrice(paymentInfo?.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-800">
                <span className="text-gray-400">Ngân hàng</span>
                <span className="text-white">{paymentInfo?.bankCode}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-800">
                <span className="text-gray-400">Mã giao dịch</span>
                <span className="text-white font-mono text-sm">
                  {paymentInfo?.transactionNo}
                </span>
              </div>

              {/* VIP Badge */}
              <div className="mt-6 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Crown className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">
                      Trạng thái tài khoản
                    </p>
                    <p className="text-lg font-bold text-amber-400">
                      VIP Member
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-gray-900/50 border-t border-gray-800">
              <button
                onClick={() => navigate("/")}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 transition-all"
              >
                <Home className="w-5 h-5" />
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Failed state
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          {/* Failed Header */}
          <div className="p-8 bg-gradient-to-br from-red-500/20 to-rose-500/20 text-center border-b border-gray-800">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Thanh toán thất bại
            </h1>
            <p className="text-gray-400">{paymentInfo?.message}</p>
          </div>

          {/* Details */}
          <div className="p-6">
            {paymentInfo?.orderId && (
              <div className="flex items-center justify-between py-3 border-b border-gray-800">
                <span className="text-gray-400">Mã đơn hàng</span>
                <span className="text-white font-mono text-sm">
                  {paymentInfo.orderId}
                </span>
              </div>
            )}
            {paymentInfo?.responseCode && (
              <div className="flex items-center justify-between py-3 border-b border-gray-800">
                <span className="text-gray-400">Mã lỗi</span>
                <span className="text-red-400">{paymentInfo.responseCode}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 bg-gray-900/50 border-t border-gray-800 space-y-3">
            <button
              onClick={() => navigate("/")}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 transition-all"
            >
              <RefreshCw className="w-5 h-5" />
              Thử lại
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-gray-400 bg-gray-800 hover:bg-gray-700 transition-all"
            >
              <Home className="w-5 h-5" />
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
