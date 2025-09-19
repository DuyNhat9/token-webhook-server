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

// Function to check and send notifications
async function checkAndNotify() {
    try {
        console.log('🔍 Checking token status...');
        
        // 1. Get current token status
        const statusResponse = await makeRequest(`${RAILWAY_URL}/status`);
        
        if (statusResponse.status !== 200) {
            console.log('❌ Failed to get status from Railway');
            return;
        }
        
        const statusData = statusResponse.data;
        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN', { 
            timeZone: 'Asia/Ho_Chi_Minh',
            hour12: false 
        });
        const dateStr = now.toLocaleDateString('vi-VN');
        
        if (!statusData.hasToken || !statusData.tokenInfo) {
            console.log('⚠️ No token available - server may be getting new token');
            
            // Send notification that server is getting new token
            let message = `🔄 THÔNG BÁO TRẠNG THÁI SERVER\n\n`;
            message += `📅 Thời gian: ${timeStr} ${dateStr}\n`;
            message += `🔄 Trạng thái: Server đang lấy token mới\n`;
            message += `⏳ Thời gian ước tính: 5-10 phút\n`;
            message += `🤖 From: Railway Token Server\n`;
            message += `🔗 Server: ${RAILWAY_URL}`;
            
            const telegramResponse = await sendTelegramMessage(message);
            if (telegramResponse && telegramResponse.data.ok) {
                console.log('✅ Status notification sent successfully!');
            }
            return;
        }
        
        // 2. Check token time left
        const timeLeftHours = Math.floor(statusData.tokenInfo.timeLeft / 3600);
        const timeLeftMinutes = Math.floor((statusData.tokenInfo.timeLeft % 3600) / 60);
        const timeLeftSeconds = statusData.tokenInfo.timeLeft % 60;
        
        console.log(`⏰ Token time left: ${timeLeftHours}h ${timeLeftMinutes}m ${timeLeftSeconds}s`);
        
        // 3. Send notifications based on time left
        let message = '';
        let shouldSend = false;
        
        if (timeLeftHours < 1 && timeLeftMinutes < 30) {
            // Less than 30 minutes left
            message = `🚨 CẢNH BÁO: TOKEN SẮP HẾT HẠN!\n\n`;
            message += `📅 Thời gian: ${timeStr} ${dateStr}\n`;
            message += `🔑 Token: ${statusData.tokenInfo.subject}\n`;
            message += `⏰ Expires: ${statusData.tokenInfo.expires}\n`;
            message += `⏱️ Time Left: ${timeLeftHours}h ${timeLeftMinutes}m ${timeLeftSeconds}s\n`;
            message += `🚨 CẢNH BÁO: Token sẽ hết hạn trong ${timeLeftMinutes} phút!\n`;
            message += `🔄 Server sẽ tự động lấy token mới khi hết hạn\n\n`;
            message += `🤖 From: Railway Token Server\n`;
            message += `🔗 Server: ${RAILWAY_URL}`;
            shouldSend = true;
        } else if (timeLeftHours < 2 && timeLeftMinutes < 30) {
            // Less than 2 hours left
            message = `⚠️ LƯU Ý: TOKEN SẮP HẾT HẠN\n\n`;
            message += `📅 Thời gian: ${timeStr} ${dateStr}\n`;
            message += `🔑 Token: ${statusData.tokenInfo.subject}\n`;
            message += `⏰ Expires: ${statusData.tokenInfo.expires}\n`;
            message += `⏱️ Time Left: ${timeLeftHours}h ${timeLeftMinutes}m ${timeLeftSeconds}s\n`;
            message += `⚠️ Lưu ý: Token sẽ hết hạn trong ${timeLeftHours}h ${timeLeftMinutes}m\n`;
            message += `🔄 Server sẽ tự động lấy token mới khi hết hạn\n\n`;
            message += `🤖 From: Railway Token Server\n`;
            message += `🔗 Server: ${RAILWAY_URL}`;
            shouldSend = true;
        } else if (timeLeftHours < 6 && timeLeftMinutes < 30) {
            // Less than 6 hours left
            message = `⏰ THÔNG BÁO THỜI GIAN CÒN LẠI\n\n`;
            message += `📅 Thời gian: ${timeStr} ${dateStr}\n`;
            message += `🔑 Token: ${statusData.tokenInfo.subject}\n`;
            message += `⏰ Expires: ${statusData.tokenInfo.expires}\n`;
            message += `⏱️ Time Left: ${timeLeftHours}h ${timeLeftMinutes}m ${timeLeftSeconds}s\n`;
            message += `🔄 Thời gian còn lại để lấy token tiếp theo: ${timeLeftHours}h ${timeLeftMinutes}m\n\n`;
            message += `🤖 From: Railway Token Server\n`;
            message += `🔗 Server: ${RAILWAY_URL}`;
            shouldSend = true;
        }
        
        if (shouldSend) {
            console.log('📤 Sending notification...');
            const telegramResponse = await sendTelegramMessage(message);
            
            if (telegramResponse && telegramResponse.data.ok) {
                console.log('✅ Notification sent successfully!');
                console.log('📱 Message ID:', telegramResponse.data.result.message_id);
            } else {
                console.log('❌ Failed to send notification:', telegramResponse?.data?.description || 'Unknown error');
            }
        } else {
            console.log('✅ Token has sufficient time left, no notification needed');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Main function
async function main() {
    console.log('🚀 AUTO TELEGRAM NOTIFICATIONS');
    console.log('===============================');
    console.log('📱 Bot: @Token_sever_bot');
    console.log('👤 Chat ID:', TELEGRAM_CHAT_ID);
    console.log('🔗 Server:', RAILWAY_URL);
    console.log('');
    
    // Run once immediately
    await checkAndNotify();
    
    // Set up interval to check every 30 minutes
    console.log('⏰ Setting up automatic notifications every 30 minutes...');
    setInterval(checkAndNotify, 30 * 60 * 1000); // 30 minutes
    
    console.log('✅ Auto notifications started!');
    console.log('💡 Press Ctrl+C to stop');
}

main();
