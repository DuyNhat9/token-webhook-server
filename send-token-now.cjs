const https = require('https');

const RAILWAY_URL = 'https://token-webhook-server-production.up.railway.app';
const TELEGRAM_BOT_TOKEN = '8393051379:AAFjXE1Ww6iRjcldkkVfFzD6ySj36HlP7Zs';
const TELEGRAM_CHAT_ID = '7489189724';

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
        text: message,
        parse_mode: 'Markdown'
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
    console.log('🚀 SENDING TOKEN VIA TELEGRAM NOW...');
    console.log('=====================================');
    
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
        
        // 2. Create message with token info
        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN', { 
            timeZone: 'Asia/Ho_Chi_Minh',
            hour12: false 
        });
        const dateStr = now.toLocaleDateString('vi-VN');
        
        let message = `🎉 *TOKEN MỚI ĐƯỢC LẤY!*\n\n`;
        message += `📅 *Thời gian:* ${timeStr} ${dateStr}\n`;
        message += `🔑 *Token:* \`${tokenData.token}\`\n`;
        message += `👤 *Subject:* ${tokenData.info.subject}\n`;
        message += `⏰ *Expires:* ${tokenData.info.expires}\n`;
        message += `⏱️ *Time Left:* ${Math.floor(tokenData.info.timeLeft / 3600)}h ${Math.floor((tokenData.info.timeLeft % 3600) / 60)}m\n`;
        message += `🏷️ *Type:* ${tokenData.info.type || 'session'}\n`;
        message += `🏢 *Issuer:* ${tokenData.info.issuer || 'Unknown'}\n\n`;
        message += `🤖 *From:* Railway Token Server\n`;
        message += `🔗 *Server:* https://token-webhook-server-production.up.railway.app\n\n`;
        message += `⏰ *Thời gian còn lại để lấy token tiếp theo:* ${Math.floor(tokenData.info.timeLeft / 3600)}h ${Math.floor((tokenData.info.timeLeft % 3600) / 60)}m`;
        
        // 3. Send to Telegram
        console.log('📤 Sending token to Telegram...');
        const telegramResponse = await sendTelegramMessage(message);
        
        if (telegramResponse && telegramResponse.data.ok) {
            console.log('✅ Token sent to Telegram successfully!');
            console.log('📱 Message ID:', telegramResponse.data.result.message_id);
            console.log('📊 Token Info:');
            console.log('   Subject:', tokenData.info.subject);
            console.log('   Expires:', tokenData.info.expires);
            console.log('   Time Left:', Math.floor(tokenData.info.timeLeft / 3600) + 'h ' + Math.floor((tokenData.info.timeLeft % 3600) / 60) + 'm');
        } else {
            console.log('❌ Failed to send to Telegram:', telegramResponse?.data?.description || 'Unknown error');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    
    console.log('\n✅ Script completed');
}

main();
