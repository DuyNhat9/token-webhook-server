# 🚀 Hướng dẫn Deploy lên Server Miễn phí

## 1. Railway (Khuyến nghị) ⭐⭐⭐⭐⭐

### Ưu điểm:
- ✅ Free tier: $5 credit/tháng
- ✅ Dễ deploy từ GitHub
- ✅ Hỗ trợ Node.js
- ✅ Cron jobs tự động
- ✅ Logs real-time

### Setup:
```bash
# 1. Push code lên GitHub
git init
git add .
git commit -m "Token automation"
git push origin main

# 2. Deploy trên Railway
# - Vào https://railway.app
# - Connect GitHub repo
# - Deploy tự động
```

### Cấu hình Railway:
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run auto-token",
    "healthcheckPath": "/health"
  }
}
```

---

## 2. Render ⭐⭐⭐⭐

### Ưu điểm:
- ✅ Free tier: 750 giờ/tháng
- ✅ Auto-deploy từ GitHub
- ✅ Cron jobs
- ✅ Web service

### Setup:
```bash
# 1. Tạo render.yaml
version: 0.6
services:
  - type: web
    name: token-monitor
    env: node
    buildCommand: npm install
    startCommand: npm run auto-token
    envVars:
      - key: KEY_ID
        value: F24AAF7D-8CE8-4425-99A2-1C89CD24D954
```

---

## 3. Heroku ⭐⭐⭐

### Ưu điểm:
- ✅ Free tier (có giới hạn)
- ✅ Dễ deploy
- ✅ Add-ons phong phú

### Setup:
```bash
# 1. Cài Heroku CLI
npm install -g heroku

# 2. Login và tạo app
heroku login
heroku create your-token-monitor

# 3. Deploy
git push heroku main

# 4. Set environment variables
heroku config:set KEY_ID=F24AAF7D-8CE8-4425-99A2-1C89CD24D954
```

---

## 4. Vercel ⭐⭐⭐⭐

### Ưu điểm:
- ✅ Free tier rộng rãi
- ✅ Serverless functions
- ✅ Cron jobs

### Setup:
```bash
# 1. Cài Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Tạo cron job
# Tạo file vercel.json:
{
  "crons": [
    {
      "path": "/api/token",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

---

## 5. GitHub Actions (Miễn phí 100%) ⭐⭐⭐⭐⭐

### Ưu điểm:
- ✅ Hoàn toàn miễn phí
- ✅ 2000 phút/tháng
- ✅ Tích hợp GitHub
- ✅ Cron scheduling

### Setup:
Tạo file `.github/workflows/token-monitor.yml`:

```yaml
name: Token Monitor
on:
  schedule:
    - cron: '*/30 * * * *'  # Chạy mỗi 30 phút
  workflow_dispatch:  # Chạy thủ công

jobs:
  get-token:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: |
          npm install
          npx playwright install chromium
          
      - name: Get Token
        run: npm run get-token
        env:
          KEY_ID: ${{ secrets.KEY_ID }}
          
      - name: Upload token
        uses: actions/upload-artifact@v3
        with:
          name: token
          path: token.txt
```

---

## 6. DigitalOcean App Platform ⭐⭐⭐

### Ưu điểm:
- ✅ Free tier: $5 credit/tháng
- ✅ Auto-scaling
- ✅ Managed database

---

## 7. Fly.io ⭐⭐⭐⭐

### Ưu điểm:
- ✅ Free tier: 3 apps
- ✅ Global deployment
- ✅ Docker support

### Setup:
```bash
# 1. Cài flyctl
curl -L https://fly.io/install.sh | sh

# 2. Tạo Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx playwright install chromium
CMD ["npm", "run", "auto-token"]

# 3. Deploy
fly launch
fly deploy
```

---

## 🎯 Khuyến nghị:

### Cho người mới:
1. **GitHub Actions** - Hoàn toàn miễn phí, dễ setup
2. **Railway** - UI đẹp, dễ sử dụng

### Cho production:
1. **Render** - Ổn định, có support
2. **Vercel** - Performance tốt

### Cho advanced:
1. **Fly.io** - Global, scalable
2. **DigitalOcean** - Full control

---

## 📝 Lưu ý quan trọng:

1. **Environment Variables**: Luôn set KEY_ID trong secrets
2. **Cron Jobs**: Chạy mỗi 30-60 phút để tránh spam
3. **Logs**: Monitor logs để đảm bảo script chạy đúng
4. **Backup**: Lưu token vào multiple locations
5. **Security**: Không commit KEY_ID vào code

---

## 🔧 Script tối ưu cho Server:

Tạo file `server-optimized.js`:

```javascript
#!/usr/bin/env node
import 'dotenv/config';
import { chromium } from 'playwright';
import fs from 'fs';

const KEY_ID = process.env.KEY_ID;
const WEBHOOK_URL = process.env.WEBHOOK_URL; // Discord/Slack notification

async function notify(message) {
    if (WEBHOOK_URL) {
        await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: message })
        });
    }
}

async function main() {
    try {
        // Your token logic here
        await notify('✅ Token retrieved successfully');
    } catch (error) {
        await notify(`❌ Error: ${error.message}`);
    }
}

main();
```
