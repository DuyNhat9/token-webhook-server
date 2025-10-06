# 🔄 Modal Update Guide - Xử lý Modal Thông báo Mới

## 📋 Tổng quan

Website `https://tokencursor.io.vn/app` đã cập nhật và thêm một modal thông báo mới. Modal này cần phải được đóng trước khi có thể thực hiện flow lấy token bình thường.

## 🎯 Modal Details

**Modal thông báo bao gồm:**
- **Title:** "Thông báo" (Notification)
- **Nút đóng:** "X" ở góc phải trên
- **Nút chính:** "Đã hiểu" (Understood) ở dưới cùng
- **Nội dung:** Thông báo về việc chia sẻ key và giới hạn kích hoạt

## 🔧 Files Đã Cập Nhật

### 1. **get-token-smart.js** ✅
- Thêm logic xử lý modal sau khi submit form
- Sử dụng multiple strategies để tìm và đóng modal
- Fallback selectors cho các trường hợp khác nhau

### 2. **railway-token-server.js** ✅
- Cập nhật server chính cho Railway deployment
- Thêm robust modal handling với 4 strategies khác nhau
- Error handling và logging chi tiết

### 3. **webhook-server.js** ✅
- Cập nhật webhook server
- Modal handling tương tự như các script khác
- Tương thích với Playwright

### 4. **auto-token.js** ✅
- Cập nhật auto monitor script
- Modal handling cho continuous monitoring

## 🧪 Test Scripts

### 1. **test-modal-handling.js**
```bash
npm run test-modal
```
- Test đầy đủ với screenshots
- Hiển thị browser để debug
- Kiểm tra từng bước của quá trình

### 2. **quick-modal-test.js**
```bash
node quick-modal-test.js
```
- Test nhanh modal handling
- Headless mode
- Kết quả ngắn gọn

## 🎯 Modal Handling Strategies

### Strategy 1: Tìm nút "Đã hiểu"
```javascript
const modalUnderstandButton = await page.$('button:has-text("Đã hiểu"), button:has-text("Understood")');
```

### Strategy 2: Tìm nút đóng "X"
```javascript
const modalCloseButton = await page.$('button[aria-label="Close"], .modal button:has-text("X"), .modal .close');
```

### Strategy 3: Alternative Selectors
```javascript
const modalSelectors = [
    '.modal button[type="button"]',
    '.notification-modal button',
    '[role="dialog"] button',
    '.popup button',
    'button:has-text("×")',
    'button:has-text("✕")'
];
```

### Strategy 4: Fallback - Click bất kỳ button nào trong modal
```javascript
const modalButtons = await page.$$('.modal button, [role="dialog"] button, .popup button');
```

## 🚀 Cách Sử Dụng

### 1. **Test Local**
```bash
# Test modal handling
npm run test-modal

# Test nhanh
node quick-modal-test.js

# Test script chính
npm run get-token
```

### 2. **Deploy Updated Code**
```bash
# Push code lên GitHub
git add .
git commit -m "Update modal handling for new notification"
git push

# Railway sẽ tự động deploy
```

### 3. **Verify Deployment**
```bash
# Test server endpoints
curl https://your-app.railway.app/health
curl https://your-app.railway.app/token
```

## 🔍 Debugging

### 1. **Check Logs**
- Railway logs sẽ hiển thị modal handling process
- Look for: "🔍 Checking for notification modal..."
- Look for: "✅ Modal closed using strategy X"

### 2. **Screenshots**
- `test-modal-handling.js` tạo screenshots:
  - `before-modal-handling.png`
  - `after-modal-handling.png`
  - `after-token-click.png`

### 3. **Common Issues**
- **Modal không xuất hiện:** Có thể website đã thay đổi
- **Button không tìm thấy:** Selector có thể đã thay đổi
- **Timeout:** Cần tăng wait time

## 📊 Expected Flow

```
1. Navigate to website ✅
2. Fill key and submit ✅
3. Wait for redirect ✅
4. Check for modal 🔍
5. Close modal (if present) ✅
6. Check for "Lấy Token" button 🎯
7. Click "Lấy Token" button ✅
8. Extract token 🎫
```

## 🎉 Kết Quả

Sau khi cập nhật:
- ✅ Tất cả scripts đều xử lý modal tự động
- ✅ Flow lấy token hoạt động bình thường
- ✅ Server chạy 24/7 không bị gián đoạn
- ✅ API endpoints hoạt động như cũ
- ✅ Notifications vẫn gửi đúng

## 🔄 Rollback Plan

Nếu có vấn đề, có thể rollback bằng cách:
1. Revert các files đã thay đổi
2. Hoặc comment out modal handling code
3. Deploy lại

---

**Tất cả scripts đã được cập nhật và sẵn sàng sử dụng! 🚀**
