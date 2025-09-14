const https = require('https');

const RAILWAY_URL = 'https://token-webhook-server-production.up.railway.app';

// Lấy từ environment variables hoặc sử dụng giá trị mặc định
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || 'YOUR_CHAT_ID';

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
            console.log('❌ Vui lòng cấu hình Telegram Bot Token và Chat ID!');
            console.log('📝 Cách 1: Sử dụng environment variables');
            console.log('   $env:TELEGRAM_BOT_TOKEN = "your_bot_token"');
            console.log('   $env:TELEGRAM_CHAT_ID = "your_chat_id"');
            console.log('   node send-token-telegram-env.cjs');
            console.log('');
            console.log('📝 Cách 2: Sửa trực tiếp trong file send-token-telegram-config.cjs');
            console.log('   Thay YOUR_TELEGRAM_BOT_TOKEN và YOUR_CHAT_ID');
            console.log('   node send-token-telegram-config.cjs');
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
