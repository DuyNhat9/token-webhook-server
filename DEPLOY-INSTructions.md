# 🚀 DEPLOY INSTRUCTIONS - Tự động deploy

## ✅ **Code đã được push lên GitHub thành công!**

Repository: **https://github.com/DuyNhat9/token-webhook-server**

---

## 🚀 **Bước 1: Deploy trên Railway (Khuyến nghị)**

### Cách 1: Tự động (nếu có Railway CLI)
```bash
# Cài đặt Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway up
```

### Cách 2: Thủ công (Khuyến nghị)
1. **Vào https://railway.app**
2. **Login với GitHub**
3. **New Project → Deploy from GitHub repo**
4. **Chọn repository: `DuyNhat9/token-webhook-server`**
5. **Railway tự động deploy**

---

## ⚙️ **Bước 2: Set Environment Variables**

Trong Railway dashboard → Variables tab:

```
KEY_ID = F24AAF7D-8CE8-4425-99A2-1C89CD24D954
API_KEY = your-secret-api-key-123
WEBHOOK_URL = https://discord.com/api/webhooks/your-webhook
CRON_SECRET = your-cron-secret-456
```

---

## 🚀 **Bước 3: Lấy URL và Test**

Railway cung cấp URL: `https://your-app.railway.app`

**Test ngay:**
```bash
# Health check
curl https://your-app.railway.app/health

# Lấy token
curl https://your-app.railway.app/token
```

---

## 🔔 **Bước 4: Setup Discord Notifications**

1. **Discord Server → Server Settings → Integrations → Webhooks**
2. **Create Webhook → Copy URL**
3. **Set trong Railway: `WEBHOOK_URL`**

---

## ⏰ **Bước 5: Setup Auto-refresh**

1. **GitHub repo → Settings → Secrets and variables → Actions**
2. **Add secrets:**
   - `SERVER_URL`: URL Railway app
   - `CRON_SECRET`: Secret từ Railway

---

## 🎉 **Kết quả cuối cùng:**

- ✅ **Server chạy 24/7** trên Railway
- ✅ **API sẵn sàng** để lấy token
- ✅ **Tự động refresh** mỗi 2 giờ
- ✅ **Discord notifications** khi có token mới

---

## 📱 **Sử dụng từ máy của bạn:**

```bash
# Set environment variables
export SERVER_URL="https://your-app.railway.app"
export API_KEY="your-secret-api-key-123"

# Lấy token
node client-request.js get
```

---

## 🆘 **Nếu Railway không hoạt động:**

### Alternative: Deploy lên Render
1. **Vào https://render.com**
2. **Login với GitHub**
3. **New Web Service**
4. **Connect GitHub repository: `DuyNhat9/token-webhook-server`**
5. **Set environment variables tương tự**

---

## 🎯 **Tóm tắt:**

**Bạn chỉ cần:**
1. Deploy lên Railway (1 lần)
2. Set environment variables
3. Gọi API khi cần token

**Server sẽ:**
- Chạy 24/7 hoàn toàn tự động
- Lấy token và gửi về cho bạn
- Thông báo qua Discord

**Hoàn toàn không cần chạy gì trên máy của bạn! 🚀**
