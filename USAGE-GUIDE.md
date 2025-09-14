# 🎯 Token Webhook Server - Hướng dẫn sử dụng

## 🚀 **Cách hoạt động:**

### **1. Server chạy trên Railway:**
- ✅ **API sẵn sàng** để lấy token
- ✅ **Không cần browser automation** (đơn giản hơn)
- ✅ **Sử dụng token có sẵn** từ file

### **2. Bạn lấy token từ máy:**
- ✅ **Chạy script local** để lấy token mới
- ✅ **Upload token lên server** qua API
- ✅ **Server lưu token** và cung cấp API

## 📱 **Cách sử dụng:**

### **Bước 1: Lấy token từ máy của bạn**
```bash
# Chạy script local để lấy token
npm run get-token

# Hoặc
npm run auto-token
```

### **Bước 2: Upload token lên server**
```bash
# Set environment variables
export SERVER_URL="https://your-app.railway.app"
export API_KEY="your-secret-api-key-123"

# Upload token lên server
curl -X POST https://your-app.railway.app/upload-token \
     -H "Content-Type: application/json" \
     -d '{"token": "your-token-here", "apiKey": "your-secret-api-key-123"}'
```

### **Bước 3: Lấy token từ server**
```bash
# Lấy token từ server
curl https://your-app.railway.app/token

# Hoặc sử dụng client
node client-request.js get
```

## 🔧 **API Endpoints:**

- `GET /health` - Health check
- `GET /token` - Lấy token hiện tại
- `GET /status` - Trạng thái server
- `POST /upload-token` - Upload token lên server
- `POST /refresh` - Force refresh token
- `POST /auto-refresh` - Auto refresh (for cron)

## 🎯 **Workflow:**

1. **Máy của bạn:** Chạy script để lấy token
2. **Upload:** Gửi token lên server qua API
3. **Server:** Lưu token và cung cấp API
4. **Sử dụng:** Lấy token từ server khi cần

## 🚀 **Ưu điểm:**

- ✅ **Không cần browser** trên server
- ✅ **Build nhanh** và ổn định
- ✅ **Dễ deploy** trên Railway
- ✅ **API sẵn sàng** để sử dụng

## 📝 **Lưu ý:**

- Server chỉ lưu token, không tự động lấy token mới
- Bạn cần chạy script local để lấy token mới
- Upload token lên server khi cần
