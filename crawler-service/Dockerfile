# SỬ DỤNG IMAGE CHÍNH HÃNG CỦA PLAYWRIGHT (Đã bao gồm Python + Browsers + Dependencies)
# Chọn tag 'jammy' (Ubuntu 22.04) để tương thích tốt nhất
FROM mcr.microsoft.com/playwright/python:v1.41.0-jammy

WORKDIR /app

# Copy và cài đặt thư viện Python (Scrapy, v.v...)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Cài đặt trình duyệt (Chỉ cần Chromium cho nhẹ, vì Image gốc đã có môi trường rồi)
RUN playwright install chromium

# Copy code
COPY ./app /app/app

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Run FastAPI
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]