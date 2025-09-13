# 🎉 HOÀN THÀNH! Token Webhook Server

## ✅ **Code đã sẵn sàng deploy!**

Repository: **https://github.com/DuyNhat9/token-webhook-server**

---

## 🚀 **DEPLOY NGAY BÂY GIỜ:**

### **Bước 1: Vào Railway**
1. **Mở https://railway.app**
2. **Login với GitHub**
3. **Click "New Project"**
4. **Chọn "Deploy from GitHub repo"**
5. **Chọn repository: `DuyNhat9/token-webhook-server`**

### **Bước 2: Set Environment Variables**
Trong Railway dashboard → Variables:
```
KEY_ID = F24AAF7D-8CE8-4425-99A2-1C89CD24D954
API_KEY = your-secret-api-key-123
WEBHOOK_URL = https://discord.com/api/webhooks/your-webhook
CRON_SECRET = your-cron-secret-456
```

### **Bước 3: Lấy URL**
Railway cung cấp URL: `https://your-app.railway.app`

---

## 🎯 **KẾT QUẢ:**

Sau khi deploy:
- ✅ **Server chạy 24/7** trên Railway
- ✅ **API sẵn sàng** để lấy token
- ✅ **Tự động refresh** mỗi 2 giờ
- ✅ **Discord notifications** khi có token mới

---

## 📱 **SỬ DỤNG:**

```bash
# Set environment variables
export SERVER_URL="https://your-app.railway.app"
export API_KEY="your-secret-api-key-123"

# Lấy token
node client-request.js get
```

---

## 🔔 **DISCORD NOTIFICATIONS:**

1. **Discord Server → Server Settings → Integrations → Webhooks**
2. **Create Webhook → Copy URL**
3. **Set trong Railway: `WEBHOOK_URL`**

---

## ⏰ **AUTO-REFRESH:**

1. **GitHub repo → Settings → Secrets and variables → Actions**
2. **Add secrets:**
   - `SERVER_URL`: URL Railway app
   - `CRON_SECRET`: Secret từ Railway

---

## 🎉 **TÓM TẮT:**

**Bạn chỉ cần:**
1. Deploy lên Railway (1 lần)
2. Set environment variables
3. Gọi API khi cần token

**Server sẽ:**
- Chạy 24/7 hoàn toàn tự động
- Lấy token và gửi về cho bạn
- Thông báo qua Discord

**Hoàn toàn không cần chạy gì trên máy của bạn! 🚀**

---

## 🆘 **NẾU RAILWAY KHÔNG HOẠT ĐỘNG:**

### Alternative: Deploy lên Render
1. **Vào https://render.com**
2. **Login với GitHub**
3. **New Web Service**
4. **Connect GitHub repository: `DuyNhat9/token-webhook-server`**
5. **Set environment variables tương tự**

---

## 🎯 **FILES QUAN TRỌNG:**

- `webhook-server.js` - Server chính
- `client-request.js` - Client để lấy token
- `railway.json` - Config cho Railway
- `.github/workflows/auto-refresh.yml` - Auto refresh

---

## 🚀 **BẮT ĐẦU DEPLOY NGAY!**

**Vào https://railway.app và deploy repository `DuyNhat9/token-webhook-server`**
