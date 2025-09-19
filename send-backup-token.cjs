const fs = require('fs');
const https = require('https');

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
    console.log('🚀 SENDING BACKUP TOKEN VIA TELEGRAM...');
    console.log('========================================');
    
    try {
        // 1. Read backup tokens
        console.log('📖 Reading backup tokens...');
        let backupContent = '';
        try {
            backupContent = fs.readFileSync('tokens-backup.txt', 'utf8');
        } catch (error) {
            console.log('❌ No backup tokens file found');
            return;
        }
        
        // 2. Parse backup tokens
        const backupTokens = [];
        const sections = backupContent.split('=== TOKEN BACKUP');
        for (let i = 1; i < sections.length; i++) {
            const section = sections[i].trim();
            if (section) {
                const lines = section.split('\n');
                const token = lines[0].replace('Token: ', '').trim();
                const subject = lines[1].replace('Subject: ', '').trim();
                const expires = lines[2].replace('Expires: ', '').trim();
                const timeLeft = lines[3].replace('Time Left: ', '').replace(' seconds', '').trim();
                const timestamp = lines[4].replace('Timestamp: ', '').trim();
                
                backupTokens.push({
                    token,
                    subject,
                    expires,
                    timeLeft: parseInt(timeLeft),
                    timestamp
                });
            }
        }
        
        if (backupTokens.length === 0) {
            console.log('❌ No backup tokens found');
            return;
        }
        
        console.log(`✅ Found ${backupTokens.length} backup tokens`);
        
        // 3. Create message with all tokens
        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN', { 
            timeZone: 'Asia/Ho_Chi_Minh',
            hour12: false 
        });
        const dateStr = now.toLocaleDateString('vi-VN');
        
        let message = `🎉 DANH SÁCH TẤT CẢ TOKEN (Từ Cũ Đến Mới)\n\n`;
        message += `📅 Thời gian gửi: ${timeStr} ${dateStr}\n`;
        message += `📊 Tổng số token: ${backupTokens.length} tokens\n\n`;
        
        // Add all backup tokens
        backupTokens.forEach((backupToken, index) => {
            const timeLeftHours = Math.floor(backupToken.timeLeft / 3600);
            const timeLeftMinutes = Math.floor((backupToken.timeLeft % 3600) / 60);
            const isExpired = backupToken.timeLeft <= 0;
            const status = isExpired ? '❌ EXPIRED' : '✅ ACTIVE';
            
            message += `${index + 1}. ${status}\n`;
            message += `🔑 ${backupToken.token}\n`;
            message += `👤 Subject: ${backupToken.subject}\n`;
            message += `⏰ Expires: ${backupToken.expires}\n`;
            message += `⏱️ Time Left: ${isExpired ? 'EXPIRED' : `${timeLeftHours}h ${timeLeftMinutes}m`}\n`;
            message += `📅 Created: ${backupToken.timestamp}\n\n`;
        });
        
        message += `🤖 From: Railway Token Server\n`;
        message += `🔗 Server: https://token-webhook-server-production.up.railway.app\n\n`;
        message += `⏰ Lưu ý: Server đang trong quá trình lấy token mới. Token trên có thể đã hết hạn.`;
        
        // 4. Send to Telegram
        console.log('📤 Sending all backup tokens to Telegram...');
        const telegramResponse = await sendTelegramMessage(message);
        
        if (telegramResponse && telegramResponse.data.ok) {
            console.log('✅ All backup tokens sent to Telegram successfully!');
            console.log('📱 Message ID:', telegramResponse.data.result.message_id);
            console.log(`📊 Sent ${backupTokens.length} backup tokens`);
        } else {
            console.log('❌ Failed to send to Telegram:', telegramResponse?.data?.description || 'Unknown error');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    
    console.log('\n✅ Script completed');
}

main();
