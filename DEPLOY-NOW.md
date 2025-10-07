# 🚀 Deploy Ngay Bây Giờ!

## 🎯 Mục tiêu: Deploy lên Railway trong 5 phút

### Bước 1: Push code lên GitHub (2 phút)

```bash
# Khởi tạo git repository
git init
git add .
git commit -m "Token webhook server"

# Tạo repository trên GitHub (vào github.com)
# Sau đó push code
git remote add origin https://github.com/username/token-webhook.git
git branch -M main
git push -u origin main
```

### Bước 2: Deploy trên Railway (2 phút)

1. **Vào https://railway.app**
2. **Login với GitHub**
3. **New Project → Deploy from GitHub repo**
4. **Chọn repository vừa tạo**
5. **Railway tự động deploy**

### Bước 3: Set Environment Variables (1 phút)

Trong Railway dashboard → Variables tab:

```
KEY_ID = F24AAF7D-8CE8-4425-99A2-1C89CD24D954
API_KEY = your-secret-api-key-123
WEBHOOK_URL = https://discord.com/api/webhooks/your-webhook
CRON_SECRET = your-cron-secret-456
```

### Bước 4: Lấy URL và Test

Railway cung cấp URL: `https://your-app.railway.app`

**Test ngay:**
```bash
# Health check
curl https://your-app.railway.app/health

# Lấy token
curl https://your-app.railway.app/token

# Kiểm tra status
curl https://your-app.railway.app/status
```

---

## 🎉 Xong! Bây giờ bạn có:

- ✅ **Server chạy 24/7** trên Railway
- ✅ **API sẵn sàng** để lấy token
- ✅ **Tự động refresh** mỗi 2 giờ
- ✅ **Discord notifications** (nếu set webhook)

---

## 📱 Sử dụng từ máy của bạn:

```bash
# Download client-request.js
# Set environment variables
export SERVER_URL="https://your-app.railway.app"
export API_KEY="your-secret-api-key-123"

# Lấy token
node client-request.js get
```

---

## 🔔 Setup Discord Notifications:

1. **Discord Server → Server Settings → Integrations → Webhooks**
2. **Create Webhook → Copy URL**
3. **Set trong Railway: `WEBHOOK_URL`**

---

## ⏰ Setup Auto-refresh:

1. **GitHub repo → Settings → Secrets and variables → Actions**
2. **Add secrets:**
   - `SERVER_URL`: URL Railway app
   - `CRON_SECRET`: Secret từ Railway

---

## 🎯 Kết quả cuối cùng:

**Bạn chỉ cần:**
- Gọi API khi cần token
- Không cần chạy gì trên máy

**Server sẽ:**
- Chạy 24/7 tự động
- Lấy token và gửi về
- Thông báo qua Discord

**Hoàn toàn tự động! 🚀**
