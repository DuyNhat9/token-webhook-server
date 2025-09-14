const https = require('https');

const RAILWAY_URL = 'https://token-webhook-server-production.up.railway.app';

// CẤU HÌNH TELEGRAM - THAY ĐỔI CÁC GIÁ TRỊ NÀY
const TELEGRAM_BOT_TOKEN = 'YOUR_TELEGRAM_BOT_TOKEN'; // Thay bằng bot token của bạn
const TELEGRAM_CHAT_ID = 'YOUR_CHAT_ID'; // Thay bằng chat ID của bạn

// Function to make HTTPS request
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (error) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

// Function to send token to Telegram
async function sendTokenToTelegram() {
    try {
        // Kiểm tra cấu hình
        if (TELEGRAM_BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN' || TELEGRAM_CHAT_ID === 'YOUR_CHAT_ID') {
            console.log('❌ Vui lòng cấu hình Telegram Bot Token và Chat ID trước!');
            console.log('📝 Hướng dẫn:');
            console.log('1. Tạo bot mới với @BotFather trên Telegram');
            console.log('2. Lấy Bot Token từ @BotFather');
            console.log('3. Gửi tin nhắn cho bot và lấy Chat ID từ:');
            console.log(`   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`);
            console.log('4. Thay đổi TELEGRAM_BOT_TOKEN và TELEGRAM_CHAT_ID trong file này');
            return;
        }

        console.log('🚀 Getting token from Railway server...');
        
        // Get current token
        const tokenResponse = await makeRequest(`${RAILWAY_URL}/token`);
        
        if (tokenResponse.status !== 200) {
            console.log('❌ Failed to get token:', tokenResponse.data);
            return;
        }
        
        const tokenData = tokenResponse.data;
        console.log('✅ Token retrieved successfully!');
        
        // Create Telegram message
        const message = `🎉 *TOKEN MỚI ĐƯỢC LẤY!*

🔑 *Token:*
\`\`\`${tokenData.token}\`\`\`

👤 *Subject:* ${tokenData.info.subject}
⏰ *Expires:* ${tokenData.info.expires}
⏱️ *Time Left:* ${Math.floor(tokenData.info.timeLeft / 3600)}h ${Math.floor((tokenData.info.timeLeft % 3600) / 60)}m
🏷️ *Type:* ${tokenData.info.type}
🏢 *Issuer:* ${tokenData.info.issuer}

📅 *Time:* ${new Date().toLocaleString('vi-VN')}
🤖 *From:* Railway Token Server`;

        const telegramMessage = {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        };
        
        // Send to Telegram
        console.log('📤 Sending token to Telegram...');
        const telegramResponse = await makeRequest(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(telegramMessage)
        });
        
        if (telegramResponse.data.ok) {
            console.log('✅ Token sent to Telegram successfully!');
            console.log('📱 Check your Telegram for the token!');
        } else {
            console.log('❌ Failed to send to Telegram:', telegramResponse.data);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the script
console.log('🚀 Starting Telegram token sender...');
sendTokenToTelegram().then(() => {
    console.log('✅ Script completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});
