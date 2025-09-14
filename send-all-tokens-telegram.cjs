const https = require('https');
const fs = require('fs');

const RAILWAY_URL = 'https://token-webhook-server-production.up.railway.app';
const TELEGRAM_BOT_TOKEN = '8393051379:AAFjXE1Ww6iRjcldkkVfFzD6ySj36HlP7Zs';
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

// Function to parse backup tokens
function parseBackupTokens(backupContent) {
    const tokens = [];
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
            
            tokens.push({
                token,
                subject,
                expires,
                timeLeft: parseInt(timeLeft),
                timestamp
            });
        }
    }
    
    return tokens;
}

// Function to send all tokens to Telegram
async function sendAllTokensToTelegram() {
    try {
        // Kiểm tra cấu hình
        if (TELEGRAM_CHAT_ID === 'YOUR_CHAT_ID') {
            console.log('❌ Vui lòng cấu hình Chat ID trước!');
            console.log('📝 Cách lấy Chat ID:');
            console.log('1. Gửi tin nhắn cho @Token_sever_bot');
            console.log('2. Chạy: node test-telegram-bot.cjs');
            console.log('3. Copy Chat ID và thay vào script này');
            return;
        }

        console.log('🚀 Getting current token from Railway server...');
        
        // Get current token from Railway
        const tokenResponse = await makeRequest(`${RAILWAY_URL}/token`);
        
        if (tokenResponse.status !== 200) {
            console.log('❌ Failed to get current token:', tokenResponse.data);
            return;
        }
        
        const currentTokenData = tokenResponse.data;
        console.log('✅ Current token retrieved successfully!');
        
        // Read backup tokens
        console.log('📖 Reading backup tokens...');
        let backupContent = '';
        try {
            backupContent = fs.readFileSync('tokens-backup.txt', 'utf8');
        } catch (error) {
            console.log('⚠️ No backup tokens file found');
        }

        // Parse backup tokens
        const backupTokens = parseBackupTokens(backupContent);
        
        // Get current time
        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN', { hour12: false });
        const dateStr = now.toLocaleDateString('vi-VN');

        // Create Telegram message
        let message = `🎉 *DANH SÁCH TẤT CẢ TOKEN* (Từ Cũ Đến Mới)\n\n`;
        message += `📅 *Thời gian gửi:* ${timeStr} ${dateStr}\n`;
        message += `📊 *Tổng số token:* ${backupTokens.length + 1} tokens\n\n`;
        
        // Add current token first
        const currentToken = currentTokenData.token;
        const currentInfo = currentTokenData.info || {};
        const currentTimeLeft = currentInfo.timeLeft || 0;
        const currentExpires = currentInfo.expires || 'Unknown';
        const currentSubject = currentInfo.subject || 'Unknown';
        
        message += `🆕 *TOKEN MỚI NHẤT:*\n`;
        message += `🔑 \`${currentToken}\`\n`;
        message += `👤 *Subject:* ${currentSubject}\n`;
        message += `⏰ *Expires:* ${currentExpires}\n`;
        message += `⏱️ *Time Left:* ${Math.floor(currentTimeLeft / 3600)}h ${Math.floor((currentTimeLeft % 3600) / 60)}m\n`;
        message += `🏷️ *Type:* ${currentInfo.type || 'session'}\n`;
        message += `🏢 *Issuer:* ${currentInfo.issuer || 'Unknown'}\n\n`;
        
        // Add backup tokens
        if (backupTokens.length > 0) {
            message += `📋 *TOKEN CŨ (Backup):*\n`;
            backupTokens.forEach((token, index) => {
                const timeLeftHours = Math.floor(token.timeLeft / 3600);
                const timeLeftMinutes = Math.floor((token.timeLeft % 3600) / 60);
                const isExpired = token.timeLeft <= 0;
                const status = isExpired ? '❌ EXPIRED' : '✅ ACTIVE';
                
                message += `\n*${index + 1}.* ${status}\n`;
                message += `🔑 \`${token.token}\`\n`;
                message += `👤 *Subject:* ${token.subject}\n`;
                message += `⏰ *Expires:* ${token.expires}\n`;
                message += `⏱️ *Time Left:* ${isExpired ? 'EXPIRED' : `${timeLeftHours}h ${timeLeftMinutes}m`}\n`;
                message += `📅 *Created:* ${token.timestamp}\n`;
            });
        }
        
        message += `\n🤖 *From:* Railway Token Server\n`;
        message += `🔗 *Server:* ${RAILWAY_URL}`;

        // Send to Telegram
        console.log('📤 Sending all tokens to Telegram...');
        const telegramMessage = {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        };
        
        const telegramResponse = await makeRequest(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(telegramMessage)
        });
        
        if (telegramResponse.data.ok) {
            console.log('✅ All tokens sent to Telegram successfully!');
            console.log('📱 Check your Telegram for the complete token list!');
        } else {
            console.log('❌ Failed to send to Telegram:', telegramResponse.data);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the script
console.log('🚀 Starting Telegram all tokens sender...');
sendAllTokensToTelegram().then(() => {
    console.log('✅ Script completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});
