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

// Function to check and send token
async function checkAndSendToken() {
    try {
        const tokenResponse = await makeRequest(`${RAILWAY_URL}/token`);
        
        if (tokenResponse.status === 200 && tokenResponse.data.token) {
            const tokenData = tokenResponse.data;
            
            console.log('🎉 Token found on Railway!');
            console.log('📏 Token length:', tokenData.token.length);
            
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
            
            // Send to Telegram
            const telegramResponse = await sendTelegramMessage(message);
            
            if (telegramResponse && telegramResponse.data.ok) {
                console.log('✅ Full token sent successfully!');
                console.log('📱 Message ID:', telegramResponse.data.result.message_id);
                return true;
            } else {
                console.log('❌ Failed to send token:', telegramResponse?.data?.description || 'Unknown error');
                return false;
            }
        } else {
            console.log('⏳ No token available yet...');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error checking token:', error.message);
        return false;
    }
}

// Main monitoring function
async function startMonitoring() {
    console.log('🚀 RAILWAY TOKEN MONITOR');
    console.log('========================');
    console.log('📱 Bot: @Token_sever_bot');
    console.log('👤 Chat ID: 7489189724');
    console.log('🌐 Railway: https://token-webhook-server-production.up.railway.app');
    console.log('⏰ Checking every 30 seconds...');
    console.log('💡 Press Ctrl+C to stop\n');
    
    let checkCount = 0;
    
    while (true) {
        checkCount++;
        console.log(`\n🔍 Check #${checkCount} - ${new Date().toLocaleTimeString('vi-VN')}`);
        
        const success = await checkAndSendToken();
        
        if (success) {
            console.log('✅ Token sent successfully! Monitoring will continue...');
        } else {
            console.log('⏳ No token yet, waiting 30 seconds...');
        }
        
        // Wait 30 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 30000));
    }
}

// Start monitoring
startMonitoring().catch(console.error);
