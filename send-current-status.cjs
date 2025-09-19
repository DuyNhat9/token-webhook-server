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
    console.log('🚀 SENDING CURRENT STATUS...');
    console.log('============================');
    
    try {
        // 1. Get current token status from Railway
        console.log('📡 Getting current token status from Railway...');
        const statusResponse = await makeRequest(`${RAILWAY_URL}/status`);
        
        if (statusResponse.status !== 200) {
            console.log('❌ Failed to get status from Railway');
            return;
        }
        
        const statusData = statusResponse.data;
        console.log('✅ Status retrieved:', statusData.hasToken ? 'Has Token' : 'No Token');
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN', { 
            timeZone: 'Asia/Ho_Chi_Minh',
            hour12: false 
        });
        const dateStr = now.toLocaleDateString('vi-VN');
        
        if (!statusData.hasToken || !statusData.tokenInfo) {
            console.log('❌ No token available on Railway server');
            
            // Send notification that server is getting new token
            let message = `🔄 THÔNG BÁO TRẠNG THÁI SERVER\n\n`;
            message += `📅 Thời gian: ${timeStr} ${dateStr}\n`;
            message += `🔄 Trạng thái: Server đang lấy token mới\n`;
            message += `⏳ Thời gian ước tính: 5-10 phút\n`;
            message += `🤖 From: Railway Token Server\n`;
            message += `🔗 Server: ${RAILWAY_URL}`;
            
            console.log('📤 Sending status notification...');
            const telegramResponse = await sendTelegramMessage(message);
            
            if (telegramResponse && telegramResponse.data.ok) {
                console.log('✅ Status notification sent successfully!');
                console.log('📱 Message ID:', telegramResponse.data.result.message_id);
            } else {
                console.log('❌ Failed to send notification:', telegramResponse?.data?.description || 'Unknown error');
            }
            
            return;
        }
        
        // 2. Calculate time left and next cooldown
        const timeLeftHours = Math.floor(statusData.tokenInfo.timeLeft / 3600);
        const timeLeftMinutes = Math.floor((statusData.tokenInfo.timeLeft % 3600) / 60);
        const timeLeftSeconds = statusData.tokenInfo.timeLeft % 60;
        
        // Calculate next cooldown (assuming 20 minutes cooldown after token expires)
        const nextCooldownTime = new Date(now.getTime() + (statusData.tokenInfo.timeLeft * 1000) + (20 * 60 * 1000));
        const nextCooldownStr = nextCooldownTime.toLocaleTimeString('vi-VN', { 
            timeZone: 'Asia/Ho_Chi_Minh',
            hour12: false 
        });
        
        // 3. Create message with current status
        let message = `📊 TRẠNG THÁI HIỆN TẠI\n\n`;
        message += `📅 Thời gian: ${timeStr} ${dateStr}\n`;
        message += `🔑 Token hiện tại: ${statusData.tokenInfo.subject}\n`;
        message += `⏰ Expires: ${statusData.tokenInfo.expires}\n`;
        message += `⏱️ Time Left: ${timeLeftHours}h ${timeLeftMinutes}m ${timeLeftSeconds}s\n`;
        message += `🔄 Thời gian còn lại để lấy token tiếp theo: ${timeLeftHours}h ${timeLeftMinutes}m\n\n`;
        
        // Add status information
        if (timeLeftHours < 1) {
            message += `🚨 CẢNH BÁO: Token sắp hết hạn!\n`;
            message += `⏳ Thời gian còn lại: ${timeLeftMinutes}m ${timeLeftSeconds}s\n`;
            message += `🔄 Server sẽ tự động lấy token mới khi hết hạn\n`;
        } else if (timeLeftHours < 2) {
            message += `⚠️ LƯU Ý: Token sẽ hết hạn trong 2 giờ tới\n`;
            message += `⏳ Thời gian còn lại: ${timeLeftHours}h ${timeLeftMinutes}m\n`;
            message += `🔄 Server sẽ tự động lấy token mới khi hết hạn\n`;
        } else {
            message += `✅ Token còn thời gian sử dụng\n`;
            message += `⏳ Thời gian còn lại: ${timeLeftHours}h ${timeLeftMinutes}m\n`;
            message += `🔄 Server sẽ tự động lấy token mới khi hết hạn\n`;
        }
        
        message += `\n🤖 From: Railway Token Server\n`;
        message += `🔗 Server: ${RAILWAY_URL}`;
        
        // 4. Send to Telegram
        console.log('📤 Sending current status...');
        const telegramResponse = await sendTelegramMessage(message);
        
        if (telegramResponse && telegramResponse.data.ok) {
            console.log('✅ Current status sent successfully!');
            console.log('📱 Message ID:', telegramResponse.data.result.message_id);
            console.log('📊 Token Info:');
            console.log('   Subject:', statusData.tokenInfo.subject);
            console.log('   Expires:', statusData.tokenInfo.expires);
            console.log('   Time Left:', `${timeLeftHours}h ${timeLeftMinutes}m ${timeLeftSeconds}s`);
        } else {
            console.log('❌ Failed to send notification:', telegramResponse?.data?.description || 'Unknown error');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    
    console.log('\n✅ Script completed');
}

main();
