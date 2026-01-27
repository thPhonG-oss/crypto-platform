package com.crypto.identity_service.util;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class VnpayUtil {

  public static String buildPaymentUrl(
      String baseUrl, Map<String, String> params, String secretKey) {
    // Sort params by key
    List<String> fieldNames = new ArrayList<>(params.keySet());
    Collections.sort(fieldNames);

    // Build query string
    StringBuilder hashData = new StringBuilder();
    StringBuilder query = new StringBuilder();

    for (String fieldName : fieldNames) {
      String fieldValue = params.get(fieldName);
      if (fieldValue != null && !fieldValue.isEmpty()) {
        // Build hash data
        hashData.append(fieldName);
        hashData.append('=');
        hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));

        // Build query
        query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII));
        query.append('=');
        query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));

        if (fieldNames.indexOf(fieldName) < fieldNames.size() - 1) {
          query.append('&');
          hashData.append('&');
        }
      }
    }

    String vnpSecureHash = hmacSHA512(secretKey, hashData.toString());
    query.append("&vnp_SecureHash=").append(vnpSecureHash);

    return baseUrl + "?" + query;
  }

  public static boolean verifySignature(Map<String, String> params, String secretKey) {
    String vnpSecureHash = params.get("vnp_SecureHash");

    // Remove hash fields before validation
    Map<String, String> paramsToVerify = new HashMap<>(params);
    paramsToVerify.remove("vnp_SecureHash");
    paramsToVerify.remove("vnp_SecureHashType");

    // Sort and build hash data
    List<String> fieldNames = new ArrayList<>(paramsToVerify.keySet());
    Collections.sort(fieldNames);

    StringBuilder hashData = new StringBuilder();
    for (String fieldName : fieldNames) {
      String fieldValue = paramsToVerify.get(fieldName);
      if (fieldValue != null && !fieldValue.isEmpty()) {
        hashData.append(fieldName);
        hashData.append('=');
        hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));

        if (fieldNames.indexOf(fieldName) < fieldNames.size() - 1) {
          hashData.append('&');
        }
      }
    }

    String calculatedHash = hmacSHA512(secretKey, hashData.toString());

    return calculatedHash.equalsIgnoreCase(vnpSecureHash);
  }

  public static String hmacSHA512(String key, String data) {
    try {
      Mac hmac512 = Mac.getInstance("HmacSHA512");
      SecretKeySpec secretKey =
          new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
      hmac512.init(secretKey);

      byte[] hashBytes = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));

      StringBuilder result = new StringBuilder();
      for (byte b : hashBytes) {
        result.append(String.format("%02x", b));
      }

      return result.toString();
    } catch (Exception e) {
      log.error("Error creating HMAC SHA512", e);
      return "";
    }
  }

  public static String getCurrentDateTime() {
    SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
    Calendar calendar = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
    return formatter.format(calendar.getTime());
  }
}
