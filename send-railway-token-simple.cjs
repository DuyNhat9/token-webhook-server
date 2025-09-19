const https = require('https');

const TELEGRAM_BOT_TOKEN = '8393051379:AAFjXE1Ww6iRjcldkkVfFzD6ySj36HlP7Zs';
const TELEGRAM_CHAT_ID = '7489189724';
const RAILWAY_URL = 'https://token-webhook-server-production.up.railway.app';

// Function to make HTTPS request
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });
        
        req.on('error', reject);
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

// Function to send Telegram message
async function sendTelegramMessage(message) {
    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const telegramData = {
        chat_id: TELEGRAM_CHAT_ID,
        text: message
    };
    
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(telegramData)
    };
    
    try {
        const response = await makeRequest(telegramUrl, options);
        return response;
    } catch (error) {
        console.error('❌ Telegram error:', error.message);
        return null;
    }
}

// Main function
async function main() {
    console.log('🚀 SENDING RAILWAY TOKEN (SIMPLE FORMAT)...');
    console.log('============================================');
    
    try {
        // 1. Get current token from Railway
        console.log('📡 Getting current token from Railway...');
        const tokenResponse = await makeRequest(`${RAILWAY_URL}/token`);
        
        if (tokenResponse.status !== 200) {
            console.log('❌ Failed to get token from Railway');
            return;
        }
        
        const tokenData = tokenResponse.data;
        console.log('✅ Token retrieved:', tokenData.token ? 'Yes' : 'No');
        
        if (!tokenData.token) {
            console.log('❌ No token available on Railway server');
            return;
        }
        
        // 2. Create simple message
        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN', { 
            timeZone: 'Asia/Ho_Chi_Minh',
            hour12: false 
        });
        const dateStr = now.toLocaleDateString('vi-VN');
        
        // Simple message format
        let message = `🎉 TOKEN MỚI TỪ RAILWAY\n\n`;
        message += `📅 Thời gian: ${timeStr} ${dateStr}\n`;
        message += `🔑 Token: ${tokenData.token}\n`;
        message += `👤 Subject: ${tokenData.info.subject}\n`;
        message += `⏰ Expires: ${tokenData.info.expires}\n`;
        message += `⏱️ Time Left: ${Math.floor(tokenData.info.timeLeft / 3600)}h ${Math.floor((tokenData.info.timeLeft % 3600) / 60)}m\n`;
        message += `🤖 From: Railway Token Server`;
        
        console.log('📝 Message length:', message.length);
        console.log('📝 Message preview:', message.substring(0, 200) + '...');
        
        // 3. Send to Telegram
        console.log('📤 Sending simple token message to Telegram...');
        const telegramResponse = await sendTelegramMessage(message);
        
        if (telegramResponse && telegramResponse.data.ok) {
            console.log('✅ Simple token message sent successfully!');
            console.log('📱 Message ID:', telegramResponse.data.result.message_id);
        } else {
            console.log('❌ Failed to send simple message:', telegramResponse?.data?.description || 'Unknown error');
            console.log('❌ Response:', JSON.stringify(telegramResponse?.data, null, 2));
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    
    console.log('\n✅ Script completed');
}

main();
