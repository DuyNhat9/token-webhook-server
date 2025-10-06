# 🚀 Quick Setup Guide - Server Miễn phí

## 🎯 Khuyến nghị: GitHub Actions (100% miễn phí)

### Bước 1: Push code lên GitHub
```bash
git init
git add .
git commit -m "Token automation"
git remote add origin https://github.com/username/token-monitor.git
git push -u origin main
```

### Bước 2: Setup Secrets
Vào GitHub repo → Settings → Secrets and variables → Actions:

- `KEY_ID`: `F24AAF7D-8CE8-4425-99A2-1C89CD24D954`
- `DISCORD_WEBHOOK`: (optional) Discord webhook URL

### Bước 3: Chạy thủ công
Vào Actions tab → Token Monitor → Run workflow

**✅ Xong! Script sẽ chạy mỗi 30 phút tự động**

---

## 🚀 Railway (UI đẹp, dễ dùng)

### Bước 1: Deploy
1. Vào https://railway.app
2. Login với GitHub
3. New Project → Deploy from GitHub repo
4. Chọn repo của bạn

### Bước 2: Set Environment Variables
- `KEY_ID`: `F24AAF7D-8CE8-4425-99A2-1C89CD24D954`
- `WEBHOOK_URL`: (optional) Discord/Slack webhook

### Bước 3: Deploy
Click Deploy → Script sẽ chạy liên tục

---

## 🚀 Render (Ổn định)

### Bước 1: Deploy
1. Vào https://render.com
2. New → Web Service
3. Connect GitHub repo
4. Build Command: `npm install && npx playwright install chromium`
5. Start Command: `npm run server-token`

### Bước 2: Environment Variables
- `KEY_ID`: `F24AAF7D-8CE8-4425-99A2-1C89CD24D954`
- `WEBHOOK_URL`: (optional)

---

## 🔔 Setup Discord Notifications

### Tạo Discord Webhook:
1. Vào Discord server
2. Server Settings → Integrations → Webhooks
3. Create Webhook
4. Copy URL

### Thêm vào Secrets:
- GitHub: `DISCORD_WEBHOOK`
- Railway/Render: `WEBHOOK_URL`

---

## 📊 Monitor & Logs

### GitHub Actions:
- Vào Actions tab để xem logs
- Download artifacts để lấy token

### Railway:
- Vào Deployments → View logs
- Real-time monitoring

### Render:
- Vào Dashboard → View logs
- Health checks

---

## 🛠️ Troubleshooting

### Lỗi thường gặp:

1. **Playwright timeout**:
   ```bash
   # Thêm vào environment
   PLAYWRIGHT_TIMEOUT=60000
   ```

2. **Memory issues**:
   ```bash
   # Thêm vào start command
   NODE_OPTIONS="--max-old-space-size=512"
   ```

3. **Network issues**:
   - Tăng timeout trong script
   - Retry logic đã có sẵn

---

## 📈 Performance Tips

1. **Chạy ít hơn**: Thay đổi cron từ `*/30` thành `0 */2` (mỗi 2 giờ)
2. **Memory optimization**: Sử dụng `server-token.js` thay vì `auto-token.js`
3. **Notifications**: Chỉ notify khi có lỗi hoặc token mới

---

## 🎉 Kết quả

Sau khi setup, bạn sẽ có:
- ✅ Token tự động lấy mỗi 30 phút
- ✅ Notifications qua Discord
- ✅ Logs chi tiết
- ✅ Backup token trong artifacts
- ✅ 100% miễn phí với GitHub Actions

**Token sẽ được lưu trong:**
- GitHub Actions: Artifacts
- Railway/Render: File system + logs
- Local: `token.txt`
