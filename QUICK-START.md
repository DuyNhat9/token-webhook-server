# 🚀 Quick Start - Deploy Token Server

## 🎯 Mục tiêu: Deploy trong 5 phút

### 1. Push code lên GitHub
```bash
git init
git add .
git commit -m "Token webhook server"
git remote add origin https://github.com/username/token-webhook.git
git push -u origin main
```

### 2. Deploy trên Railway
1. Vào https://railway.app
2. Login với GitHub
3. New Project → Deploy from GitHub repo
4. Chọn repository
5. Railway tự động deploy

### 3. Set Environment Variables
Trong Railway dashboard → Variables:
```
KEY_ID = F24AAF7D-8CE8-4425-99A2-1C89CD24D954
API_KEY = your-secret-api-key-123
WEBHOOK_URL = https://discord.com/api/webhooks/your-webhook
CRON_SECRET = your-cron-secret-456
```

### 4. Test API
```bash
# Health check
curl https://your-app.railway.app/health

# Lấy token
curl https://your-app.railway.app/token
```

## 🎉 Xong! Bây giờ bạn có:

- ✅ Server chạy 24/7 trên Railway
- ✅ API sẵn sàng để lấy token
- ✅ Tự động refresh mỗi 2 giờ
- ✅ Discord notifications

## 📱 Sử dụng từ máy:

```bash
# Set environment variables
export SERVER_URL="https://your-app.railway.app"
export API_KEY="your-secret-api-key-123"

# Lấy token
node client-request.js get
```

**Hoàn toàn tự động! 🚀**
