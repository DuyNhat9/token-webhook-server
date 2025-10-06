## Hướng dẫn chuyển repo sang tài khoản GitHub mới và liên kết lại với Railway

### 1) Chuẩn bị
- Repo hiện tại đã chạy tốt trên Railway (đã có `Dockerfile`, `railway.json`).
- Bạn có quyền trên tài khoản GitHub mới.

### 2) Tạo repo ở tài khoản GitHub mới
- Cách A: Fork repo hiện tại sang account mới (nhanh, giữ lịch sử commit).
- Cách B: Tạo repo trống ở account mới rồi push code:
  ```bash
  # Tại máy local trong thư mục dự án hiện tại
  git remote remove origin
  git remote add origin https://github.com/<NEW_GH_USERNAME>/<NEW_REPO>.git
  git push -u origin main
  ```

### 3) Liên kết lại Railway với repo mới
1. Mở Railway → Project → Service đang chạy (ví dụ: token-webhook-server).
2. Tab Settings → Repository.
3. Disconnect repository cũ.
4. Connect Repository → Chọn account GitHub mới và repo mới.
   - Nếu được yêu cầu, Authorize Railway với tài khoản GitHub mới.

### 4) Kiểm tra Environment Variables trên Railway
Các biến sau KHÔNG nằm trong repo, cần giữ nguyên trong Railway (Tab Variables):
- `KEY_ID`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `AUTO_REFRESH` = `true`
- `AUTO_REFRESH_INTERVAL` = `300` (hoặc theo ý bạn)

Không cần đổi gì trong `Dockerfile` và `railway.json`.

### 5) Trigger deploy và xác nhận hoạt động
- Push bất kỳ commit nào lên repo mới để Railway tự deploy.
- Sau khi deploy:
  - Kiểm tra health: `GET /health`
  - Kiểm tra status: `GET /status`
  - Auto-refresh status: `GET /auto-refresh/status` (mong đợi: `auto_refresh=true`)
  - Test Telegram: `POST /telegram/test`

### 6) Tùy chọn: cấu hình auto-refresh bằng env
- AUTO_REFRESH=true → tự chạy vòng lặp trong container (không cần cron).
- AUTO_REFRESH_INTERVAL=300 → chu kỳ (giây) giữa các lần thử.

### 7) Ghi chú & Troubleshooting
- Railway restart container: app tự bật lại auto-refresh (dựa vào env).
- Plan có sleep/idle: bật "Always On" nếu cần chạy 24/7.
- Nếu thấy `Key is on cooldown`: đây là giới hạn từ website; server sẽ tự đợi theo interval rồi thử lại.
- Nếu `POST /auto-refresh` trả 400: auto-refresh đang chạy; dùng `DELETE /auto-refresh` để dừng trước khi bật lại.

### 8) Xác nhận nhanh (lệnh mẫu)
```bash
# Kiểm tra auto-refresh
curl -s https://<YOUR_RAILWAY_DOMAIN>/auto-refresh/status

# Test gửi Telegram
curl -X POST https://<YOUR_RAILWAY_DOMAIN>/telegram/test
```


