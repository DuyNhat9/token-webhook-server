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

// Function to check Railway token and send if available
async function checkAndSendRailwayToken() {
    try {
        console.log('📡 Checking Railway server for token...');
        const tokenResponse = await makeRequest(`${RAILWAY_URL}/token`);
        
        if (tokenResponse.status !== 200) {
            console.log('❌ Failed to get token from Railway');
            return false;
        }
        
        const tokenData = tokenResponse.data;
        
        if (!tokenData.token) {
            console.log('❌ No token available on Railway server');
            return false;
        }
        
        console.log('✅ Token found on Railway server');
        console.log('📏 Token length:', tokenData.token.length);
        console.log('📝 Token preview:', tokenData.token.substring(0, 100) + '...');
        
        // Create message with full token
        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN', { 
            timeZone: 'Asia/Ho_Chi_Minh',
            hour12: false 
        });
        const dateStr = now.toLocaleDateString('vi-VN');
        
        let message = `🎉 TOKEN ĐẦY ĐỦ TỪ RAILWAY\n\n`;
        message += `📅 Thời gian: ${timeStr} ${dateStr}\n`;
        message += `🔑 Token: ${tokenData.token}\n`;
        message += `📏 Length: ${tokenData.token.length} characters\n`;
        message += `👤 Subject: ${tokenData.info.subject}\n`;
        message += `⏰ Expires: ${tokenData.info.expires}\n`;
        message += `⏱️ Time Left: ${Math.floor(tokenData.info.timeLeft / 3600)}h ${Math.floor((tokenData.info.timeLeft % 3600) / 60)}m\n`;
        message += `🤖 From: Railway Token Server (Full)`;
        
        console.log('📝 Message length:', message.length);
        console.log('📝 Message preview:', message.substring(0, 200) + '...');
        
        // Send to Telegram
        console.log('📤 Sending full token to Telegram...');
        const telegramResponse = await sendTelegramMessage(message);
        
        if (telegramResponse && telegramResponse.data.ok) {
            console.log('✅ Full token sent successfully!');
            console.log('📱 Message ID:', telegramResponse.data.result.message_id);
            return true;
        } else {
            console.log('❌ Failed to send full token:', telegramResponse?.data?.description || 'Unknown error');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return false;
    }
}

// Main function
async function main() {
    console.log('🚀 ENSURING FULL TOKEN FROM RAILWAY...');
    console.log('======================================');
    
    // Check Railway server status first
    console.log('📊 Checking Railway server status...');
    const statusResponse = await makeRequest(`${RAILWAY_URL}/status`);
    
    if (statusResponse.status === 200) {
        const status = statusResponse.data;
        console.log('📊 Server status:', status);
        
        if (status.hasToken) {
            console.log('✅ Railway has token, sending...');
            await checkAndSendRailwayToken();
        } else {
            console.log('⏳ Railway server has no token yet');
            console.log('🔄 Waiting for Railway to get token...');
            
            // Wait and retry
            for (let i = 0; i < 5; i++) {
                console.log(`⏳ Waiting 30 seconds... (${i + 1}/5)`);
                await new Promise(resolve => setTimeout(resolve, 30000));
                
                const retryResponse = await makeRequest(`${RAILWAY_URL}/token`);
                if (retryResponse.status === 200 && retryResponse.data.token) {
                    console.log('✅ Token found, sending...');
                    await checkAndSendRailwayToken();
                    break;
                }
            }
        }
    } else {
        console.log('❌ Railway server not responding');
    }
    
    console.log('\n✅ Script completed');
}

main();
