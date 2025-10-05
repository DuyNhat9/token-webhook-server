# Railway Deployment Guide

## 🚀 Đã sửa lỗi Browser Launch

Server đã được cập nhật để hoạt động hoàn hảo trên Railway với các cải tiến sau:

### ✅ Các vấn đề đã được sửa:

1. **Browser Launch Error**: 
   - Sử dụng Puppeteer's bundled Chromium thay vì system browser
   - 7 strategies khác nhau để handle các môi trường Railway
   - Proper containerized browser arguments

2. **ES Module Compatibility**:
   - Chuyển đổi từ CommonJS sang ES Module syntax
   - Tương thích với `"type": "module"` trong package.json

3. **Enhanced Error Handling**:
   - Better logging với stderr output
   - Telegram notifications khi server restart
   - Improved consecutive error handling

### 🔧 Cấu hình Railway:

File `nixpacks.toml` đã được cập nhật:
```toml
[phases.setup]
nixPkgs = ["nodejs_18", "npm-9_x", "chromium"]

[phases.install]
cmds = ["npm install --omit=dev"]

[start]
cmd = "node railway-token-server-new.js"

[variables]
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = "false"
CONTAINERIZED = "1"
```

### 📡 Endpoints có sẵn:

- `GET /health` - Health check
- `GET /token` - Lấy token hiện tại
- `GET /status` - Trạng thái server
- `POST /refresh` - Force refresh token
- `POST /auto-refresh` - Auto refresh (cho cron)
- `POST /send-token` - Gửi token qua Telegram

### 🚀 Deploy lên Railway:

1. Push code lên GitHub
2. Connect repository với Railway
3. Set environment variables:
   - `KEY_ID`: Your key ID
   - `TELEGRAM_BOT_TOKEN`: Bot token (optional)
   - `TELEGRAM_CHAT_ID`: Chat ID (optional)
4. Deploy!

### 🎯 Kết quả mong đợi:

- ✅ Browser launch thành công
- ✅ Token fetch hoạt động
- ✅ Auto refresh mỗi 5 phút
- ✅ Health monitoring
- ✅ Telegram notifications (nếu có config)

Server sẽ tự động download Chromium và hoạt động ổn định trên Railway!
