/**
 * Payment Service
 * Handles VIP payment operations with VNPAY
 */

import apiClient from "./apiClient";
import { CONFIG } from "../config";

const paymentService = {
  /**
   * Available VIP packages
   */
  packages: [
    {
      id: "VIP_1_MONTH",
      name: "1 Tháng",
      duration: "1 tháng",
      price: 99000,
      originalPrice: 149000,
      savings: "34%",
      features: [
        "Phân tích cảm xúc AI",
        "Tương quan thị trường",
        "Tín hiệu giao dịch",
        "Tin tức ưu tiên",
      ],
    },
    {
      id: "VIP_3_MONTHS",
      name: "3 Tháng",
      duration: "3 tháng",
      price: 269000,
      originalPrice: 447000,
      savings: "40%",
      popular: true,
      features: [
        "Tất cả tính năng 1 tháng",
        "Cảnh báo giá tùy chỉnh",
        "Báo cáo tuần",
        "Hỗ trợ ưu tiên",
      ],
    },
    {
      id: "VIP_1_YEAR",
      name: "1 Năm",
      duration: "12 tháng",
      price: 999000,
      originalPrice: 1788000,
      savings: "44%",
      features: [
        "Tất cả tính năng 3 tháng",
        "API truy cập",
        "Phân tích chuyên sâu",
        "Cố vấn 1-1",
      ],
    },
  ],

  /**
   * Create a payment and get VNPAY redirect URL
   */
  async createPayment(packageType) {
    try {
      // Debug: log token status
      const token = localStorage.getItem("crypto_access_token");
      console.log("[Payment] Token exists:", !!token);
      console.log(
        "[Payment] Token preview:",
        token ? token.substring(0, 50) + "..." : "none",
      );

      const response = await apiClient.post(
        "/identity-service/api/v1/payments/create",
        {
          packageType,
        },
      );

      if (response.data?.success && response.data?.data?.paymentUrl) {
        return {
          success: true,
          paymentUrl: response.data.data.paymentUrl,
          orderId: response.data.data.orderId,
          amount: response.data.data.amount,
        };
      }

      throw new Error(response.data?.message || "Failed to create payment");
    } catch (error) {
      console.error("Payment creation error:", error);
      throw error;
    }
  },

  /**
   * Get payment history
   */
  async getPaymentHistory() {
    try {
      const response = await apiClient.get(
        "/identity-service/api/v1/payments/history",
      );
      return response.data?.data || { payments: [] };
    } catch (error) {
      console.error("Error fetching payment history:", error);
      return { payments: [] };
    }
  },

  /**
   * Format price in VND
   */
  formatPrice(amount) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  },

  /**
   * Get package by ID
   */
  getPackageById(packageId) {
    return this.packages.find((pkg) => pkg.id === packageId);
  },
};

export default paymentService;
