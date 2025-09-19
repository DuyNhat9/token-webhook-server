const puppeteer = require('puppeteer');
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

// Function to get exact cooldown from website
async function getExactCooldown() {
    let browser;
    try {
        console.log('🌐 Checking website for cooldown...');
        
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        
        // Navigate to the website
        await page.goto('https://tokencursor.io.vn/app', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // Wait for page to load
        await page.waitForTimeout(3000);
        
        // Get page content
        const pageContent = await page.content();
        
        // Look for cooldown patterns
        const cooldownPatterns = [
            /Chờ\s+(\d+):(\d+)\s+nữa/,
            /(\d+):(\d+)\s+nữa/,
            /(\d+)\s+phút\s+nữa/,
            /(\d+)\s+giây\s+nữa/
        ];
        
        let cooldownText = '';
        let cooldownFound = false;
        let cooldownMinutes = 0;
        let cooldownSeconds = 0;
        
        for (const pattern of cooldownPatterns) {
            const match = pageContent.match(pattern);
            if (match) {
                cooldownText = match[0];
                cooldownFound = true;
                
                if (match[1] && match[2]) {
                    // Format: "3:38 nữa" or "Chờ 3:38 nữa"
                    cooldownMinutes = parseInt(match[1]);
                    cooldownSeconds = parseInt(match[2]);
                } else if (match[1]) {
                    // Format: "5 phút nữa" or "30 giây nữa"
                    if (cooldownText.includes('phút')) {
                        cooldownMinutes = parseInt(match[1]);
                    } else if (cooldownText.includes('giây')) {
                        cooldownSeconds = parseInt(match[1]);
                    }
                }
                break;
            }
        }
        
        // Get token count
        let tokenCount = '';
        const tokenCountPattern = /Số token đã nhận.*?(\d+)/;
        const tokenMatch = pageContent.match(tokenCountPattern);
        if (tokenMatch) {
            tokenCount = tokenMatch[1];
        }
        
        // Get key expiry
        let keyExpiry = '';
        const keyExpiryPattern = /Key còn hạn đến\s+([^<]+)/;
        const keyMatch = pageContent.match(keyExpiryPattern);
        if (keyMatch) {
            keyExpiry = keyMatch[1].trim();
        }
        
        return {
            cooldownText,
            cooldownFound,
            cooldownMinutes,
            cooldownSeconds,
            tokenCount,
            keyExpiry
        };
        
    } catch (error) {
        console.error('❌ Error getting cooldown:', error.message);
        return null;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Function to check and send notifications
async function checkAndNotify() {
    try {
        const cooldownInfo = await getExactCooldown();
        
        if (!cooldownInfo) {
            console.log('❌ Failed to get cooldown information');
            return;
        }
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN', { 
            timeZone: 'Asia/Ho_Chi_Minh',
            hour12: false 
        });
        const dateStr = now.toLocaleDateString('vi-VN');
        
        // Check if we should send notification
        let shouldSend = false;
        let message = '';
        
        if (cooldownInfo.cooldownFound) {
            const totalSeconds = cooldownInfo.cooldownMinutes * 60 + cooldownInfo.cooldownSeconds;
            
            if (totalSeconds > 0) {
                shouldSend = true;
                
                if (totalSeconds <= 60) {
                    // Less than 1 minute
                    message = `🚨 CẢNH BÁO: TOKEN SẮP SẴN SÀNG!\n\n`;
                    message += `📅 Thời gian: ${timeStr} ${dateStr}\n`;
                    message += `⏳ Thời gian chờ: ${cooldownInfo.cooldownText}\n`;
                    message += `🚨 Cảnh báo: Token sẽ sẵn sàng trong ${totalSeconds} giây!\n`;
                } else if (totalSeconds <= 300) {
                    // Less than 5 minutes
                    message = `⚠️ LƯU Ý: TOKEN SẮP SẴN SÀNG\n\n`;
                    message += `📅 Thời gian: ${timeStr} ${dateStr}\n`;
                    message += `⏳ Thời gian chờ: ${cooldownInfo.cooldownText}\n`;
                    message += `⚠️ Lưu ý: Token sẽ sẵn sàng trong ${cooldownInfo.cooldownMinutes}m ${cooldownInfo.cooldownSeconds}s\n`;
                } else {
                    // More than 5 minutes
                    message = `⏰ THÔNG BÁO THỜI GIAN CHỜ\n\n`;
                    message += `📅 Thời gian: ${timeStr} ${dateStr}\n`;
                    message += `⏳ Thời gian chờ: ${cooldownInfo.cooldownText}\n`;
                    message += `🔄 Thời gian còn lại: ${cooldownInfo.cooldownMinutes}m ${cooldownInfo.cooldownSeconds}s\n`;
                }
                
                if (cooldownInfo.tokenCount) {
                    message += `📊 Số token đã nhận: ${cooldownInfo.tokenCount}\n`;
                }
                
                if (cooldownInfo.keyExpiry) {
                    message += `🔑 Key còn hạn đến: ${cooldownInfo.keyExpiry}\n`;
                }
                
                message += `\n🤖 From: Railway Token Server\n`;
                message += `🔗 Server: https://token-webhook-server-production.up.railway.app`;
            }
        } else {
            // No cooldown - token is ready
            shouldSend = true;
            message = `✅ TOKEN SẴN SÀNG!\n\n`;
            message += `📅 Thời gian: ${timeStr} ${dateStr}\n`;
            message += `✅ Trạng thái: Có thể lấy token ngay\n`;
            
            if (cooldownInfo.tokenCount) {
                message += `📊 Số token đã nhận: ${cooldownInfo.tokenCount}\n`;
            }
            
            if (cooldownInfo.keyExpiry) {
                message += `🔑 Key còn hạn đến: ${cooldownInfo.keyExpiry}\n`;
            }
            
            message += `\n🤖 From: Railway Token Server\n`;
            message += `🔗 Server: https://token-webhook-server-production.up.railway.app`;
        }
        
        if (shouldSend) {
            console.log('📤 Sending cooldown notification...');
            const telegramResponse = await sendTelegramMessage(message);
            
            if (telegramResponse && telegramResponse.data.ok) {
                console.log('✅ Cooldown notification sent successfully!');
                console.log('📱 Message ID:', telegramResponse.data.result.message_id);
                console.log('⏳ Cooldown:', cooldownInfo.cooldownText || 'Token sẵn sàng');
            } else {
                console.log('❌ Failed to send notification:', telegramResponse?.data?.description || 'Unknown error');
            }
        } else {
            console.log('✅ No notification needed');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Main function
async function main() {
    console.log('🚀 COOLDOWN MONITOR');
    console.log('===================');
    console.log('📱 Bot: @Token_sever_bot');
    console.log('👤 Chat ID:', TELEGRAM_CHAT_ID);
    console.log('🌐 Website: https://tokencursor.io.vn/app');
    console.log('');
    
    // Run once immediately
    await checkAndNotify();
    
    // Set up interval to check every 2 minutes
    console.log('⏰ Setting up automatic monitoring every 2 minutes...');
    setInterval(checkAndNotify, 2 * 60 * 1000); // 2 minutes
    
    console.log('✅ Cooldown monitoring started!');
    console.log('💡 Press Ctrl+C to stop');
}

main();
