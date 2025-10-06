# 🔑 Hướng dẫn tạo App Password cho Gmail

## **Bước 1: Bật 2-Step Verification**
1. Vào: https://myaccount.google.com/security
2. **2-Step Verification** → Bật nếu chưa có
3. Xác thực bằng số điện thoại

## **Bước 2: Tạo App Password**
1. Vào: https://myaccount.google.com/apppasswords
2. **Select app**: Mail
3. **Select device**: Other (custom name) → "Railway Server"
4. **Generate** → Copy password 16 ký tự

## **Bước 3: App Password sẽ trông như thế này:**
```
abcd efgh ijkl mnop
```

## **Bước 4: Loại bỏ khoảng trống:**
```
abcdefghijklmnop
```

## **Bước 5: Test với script:**
```bash
node test-email-auto.js
```

## **Bước 6: Cập nhật Railway:**
Khi test thành công, cập nhật Railway environment variables:
- `GMAIL_PASS` = App Password 16 ký tự (không có khoảng trống)

## **Lưu ý:**
- App Password phải có đúng 16 ký tự
- Không được có khoảng trống
- Mỗi App Password chỉ dùng được 1 lần
- Có thể tạo nhiều App Password khác nhau
