# 🎉 Hoàn thành! Hệ thống Token Webhook

## 🎯 Mục tiêu đã đạt được:
- ✅ **Script chạy hoàn toàn trên server**
- ✅ **Bạn không cần chạy gì trên máy**
- ✅ **Chỉ cần gọi API để lấy token**
- ✅ **Tự động refresh token định kỳ**

---

## 🚀 Cách Deploy (Railway - Khuyến nghị)

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
5. Railway tự động deploy

### Bước 3: Set Environment Variables
Trong Railway dashboard:
```
KEY_ID = F24AAF7D-8CE8-4425-99A2-1C89CD24D954
API_KEY = your-secret-api-key-123
WEBHOOK_URL = https://discord.com/api/webhooks/your-webhook
CRON_SECRET = your-cron-secret-456
```

### Bước 4: Lấy URL
Railway cung cấp URL: `https://your-app.railway.app`

---

## 📱 Sử dụng từ máy của bạn

### Cài đặt:
```bash
# Download client-request.js
# Set environment variables
export SERVER_URL="https://your-app.railway.app"
export API_KEY="your-secret-api-key-123"
```

### Lấy token:
```bash
# Lấy token hiện tại
node client-request.js get

# Kiểm tra trạng thái
node client-request.js status

# Force refresh
node client-request.js refresh
```

---

## 🌐 API Endpoints

### Public (không cần API key):
- `GET /health` - Health check
- `GET /token` - Lấy token hiện tại
- `GET /status` - Trạng thái server

### Protected (cần API key):
- `POST /refresh` - Force refresh token

---

## 🔔 Discord Notifications

### Setup Discord Webhook:
1. Discord Server → Server Settings → Integrations → Webhooks
2. Create Webhook → Copy URL
3. Set trong Railway: `WEBHOOK_URL`

**Bạn sẽ nhận thông báo:**
- ✅ Token được lấy thành công
- ❌ Có lỗi xảy ra
- 🔄 Server khởi động/dừng

---

## ⏰ Auto-refresh với GitHub Actions

Tạo `.github/workflows/auto-refresh.yml`:

```yaml
name: Auto Refresh Token
on:
  schedule:
    - cron: '0 */2 * * *'  # Mỗi 2 giờ
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
- `SERVER_URL`: URL Railway app
- `CRON_SECRET`: Secret bảo mật

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

## 🎉 Kết quả cuối cùng

Sau khi setup:
- ✅ **Server chạy 24/7** trên Railway
- ✅ **Token tự động refresh** mỗi 2 giờ
- ✅ **API sẵn sàng** để lấy token
- ✅ **Discord notifications** khi có token mới
- ✅ **Bạn không cần chạy gì** trên máy

**Chỉ cần gọi API khi cần token!**

---

## 📁 Files quan trọng:

1. **`webhook-server.js`** - Server chính
2. **`client-request.js`** - Client để lấy token
3. **`WEBHOOK-SETUP.md`** - Hướng dẫn chi tiết
4. **`.github/workflows/auto-refresh.yml`** - Auto refresh

---

## 🛡️ Bảo mật:

- API_KEY bảo vệ endpoint refresh
- CORS enabled
- Environment variables không commit

---

## 🔧 Troubleshooting:

### Server không start:
- Kiểm tra environment variables
- Xem logs Railway

### Token không lấy được:
- Kiểm tra KEY_ID
- Xem logs debug

### API không hoạt động:
- Kiểm tra URL
- Kiểm tra API_KEY

---

## 🎯 Tóm tắt:

**Bạn chỉ cần:**
1. Deploy lên Railway
2. Set environment variables
3. Gọi API khi cần token

**Server sẽ:**
- Chạy 24/7
- Tự động lấy token
- Gửi thông báo Discord
- Cung cấp API để lấy token

**Hoàn toàn tự động! 🚀**
