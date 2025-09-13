# 🚀 Webhook Server Setup - Token từ xa

## 🎯 Mục tiêu
- Script chạy hoàn toàn trên server
- Bạn không cần chạy gì trên máy
- Chỉ cần gọi API để lấy token khi cần

## 📋 Cách hoạt động

1. **Server**: Chạy webhook server, tự động lấy token
2. **Client**: Bạn gọi API để lấy token về
3. **Auto-refresh**: Server tự động refresh token định kỳ

---

## 🚀 Deploy lên Railway (Khuyến nghị)

### Bước 1: Push code lên GitHub
```bash
git init
git add .
git commit -m "Webhook token server"
git remote add origin https://github.com/username/token-webhook.git
git push -u origin main
```

### Bước 2: Deploy trên Railway
1. Vào https://railway.app
2. Login với GitHub
3. New Project → Deploy from GitHub repo
4. Chọn repo của bạn
5. Railway sẽ tự động detect và deploy

### Bước 3: Set Environment Variables
Trong Railway dashboard:
```
KEY_ID = F24AAF7D-8CE8-4425-99A2-1C89CD24D954
API_KEY = your-secret-api-key-123
WEBHOOK_URL = https://discord.com/api/webhooks/your-webhook
CRON_SECRET = your-cron-secret-456
```

### Bước 4: Lấy URL
Railway sẽ cung cấp URL như: `https://your-app.railway.app`

---

## 🔧 Setup Auto-refresh với GitHub Actions

Tạo file `.github/workflows/auto-refresh.yml`:

```yaml
name: Auto Refresh Token

on:
  schedule:
    - cron: '0 */2 * * *'  # Mỗi 2 giờ
  workflow_dispatch:

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - name: Refresh Token
        run: |
          curl -X POST "${{ secrets.SERVER_URL }}/auto-refresh" \
               -H "Content-Type: application/json" \
               -d '{"secret": "${{ secrets.CRON_SECRET }}"}'
```

**Secrets cần set:**
- `SERVER_URL`: URL của Railway app
- `CRON_SECRET`: Secret để bảo mật

---

## 📱 Sử dụng từ máy của bạn

### Cài đặt client:
```bash
# Clone repo hoặc download client-request.js
npm install

# Set environment variables
export SERVER_URL="https://your-app.railway.app"
export API_KEY="your-secret-api-key-123"
```

### Lấy token:
```bash
# Lấy token hiện tại
npm run request-token get

# Kiểm tra trạng thái server
npm run request-token status

# Force refresh token
npm run request-token refresh
```

---

## 🌐 API Endpoints

### Public Endpoints:
- `GET /health` - Health check
- `GET /token` - Lấy token hiện tại
- `GET /status` - Trạng thái server

### Protected Endpoints (cần API_KEY):
- `POST /refresh` - Force refresh token
- `POST /auto-refresh` - Auto refresh (cho cron)

---

## 📊 Ví dụ sử dụng

### 1. Lấy token từ browser:
```
https://your-app.railway.app/token
```

### 2. Lấy token từ curl:
```bash
curl https://your-app.railway.app/token
```

### 3. Force refresh:
```bash
curl -X POST https://your-app.railway.app/refresh \
     -H "Content-Type: application/json" \
     -d '{"apiKey": "your-secret-api-key-123"}'
```

### 4. Kiểm tra status:
```bash
curl https://your-app.railway.app/status
```

---

## 🔔 Discord Notifications

### Tạo Discord Webhook:
1. Discord Server → Server Settings → Integrations → Webhooks
2. Create Webhook
3. Copy URL

### Set trong Railway:
```
WEBHOOK_URL = https://discord.com/api/webhooks/your-webhook-url
```

**Bạn sẽ nhận thông báo khi:**
- ✅ Token được lấy thành công
- ❌ Có lỗi xảy ra
- 🔄 Server khởi động/dừng

---

## 🛡️ Bảo mật

### API Key:
- Dùng để bảo vệ endpoint `/refresh`
- Set trong environment variables
- Không commit vào code

### CORS:
- Đã enable CORS cho tất cả origins
- Có thể restrict nếu cần

---

## 📈 Monitoring

### Railway Dashboard:
- Xem logs real-time
- Monitor resource usage
- Health checks

### Discord Notifications:
- Thông báo khi có token mới
- Cảnh báo khi có lỗi

### API Status:
- `GET /health` - Health check
- `GET /status` - Detailed status

---

## 🎉 Kết quả

Sau khi setup:
- ✅ **Server chạy 24/7** trên Railway
- ✅ **Token tự động refresh** mỗi 2 giờ
- ✅ **API sẵn sàng** để lấy token
- ✅ **Discord notifications** khi có token mới
- ✅ **Bạn không cần chạy gì** trên máy

**Chỉ cần gọi API khi cần token!**

---

## 🔧 Troubleshooting

### Server không start:
- Kiểm tra environment variables
- Xem logs trong Railway dashboard

### Token không lấy được:
- Kiểm tra KEY_ID
- Xem logs để debug

### API không hoạt động:
- Kiểm tra URL
- Kiểm tra API_KEY

### Discord không nhận thông báo:
- Kiểm tra WEBHOOK_URL
- Test webhook trong Discord
