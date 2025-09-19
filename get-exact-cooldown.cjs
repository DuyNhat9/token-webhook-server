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
        console.log('🌐 Opening browser to check exact cooldown...');
        
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        
        // Navigate to the website
        console.log('📡 Navigating to website...');
        await page.goto('https://tokencursor.io.vn/app', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // Wait for page to load
        await page.waitForTimeout(3000);
        
        // Look for cooldown information
        console.log('🔍 Looking for cooldown information...');
        
        // Try to find cooldown text
        const cooldownSelectors = [
            'text/Chờ',
            'text/nữa',
            '[class*="cooldown"]',
            '[class*="wait"]',
            '[class*="countdown"]'
        ];
        
        let cooldownText = '';
        let cooldownFound = false;
        
        for (const selector of cooldownSelectors) {
            try {
                const element = await page.$(selector);
                if (element) {
                    cooldownText = await page.evaluate(el => el.textContent, element);
                    if (cooldownText && cooldownText.includes('Chờ')) {
                        cooldownFound = true;
                        break;
                    }
                }
            } catch (e) {
                // Continue to next selector
            }
        }
        
        // If not found with selectors, try to get all text content
        if (!cooldownFound) {
            console.log('🔍 Searching in page content...');
            const pageContent = await page.content();
            
            // Look for cooldown patterns
            const cooldownPatterns = [
                /Chờ\s+(\d+):(\d+)\s+nữa/,
                /(\d+):(\d+)\s+nữa/,
                /(\d+)\s+phút\s+nữa/,
                /(\d+)\s+giây\s+nữa/
            ];
            
            for (const pattern of cooldownPatterns) {
                const match = pageContent.match(pattern);
                if (match) {
                    cooldownText = match[0];
                    cooldownFound = true;
                    break;
                }
            }
        }
        
        // Get account info
        let accountInfo = '';
        try {
            const accountSelectors = [
                '[class*="account"]',
                '[class*="info"]',
                'text/Thông tin tài khoản'
            ];
            
            for (const selector of accountSelectors) {
                try {
                    const element = await page.$(selector);
                    if (element) {
                        const text = await page.evaluate(el => el.textContent, element);
                        if (text && text.includes('Thông tin')) {
                            accountInfo = text;
                            break;
                        }
                    }
                } catch (e) {
                    // Continue
                }
            }
        } catch (e) {
            console.log('⚠️ Could not get account info');
        }
        
        // Get token count
        let tokenCount = '';
        try {
            const tokenCountPattern = /Số token đã nhận.*?(\d+)/;
            const pageContent = await page.content();
            const match = pageContent.match(tokenCountPattern);
            if (match) {
                tokenCount = match[1];
            }
        } catch (e) {
            console.log('⚠️ Could not get token count');
        }
        
        // Get key expiry
        let keyExpiry = '';
        try {
            const keyExpiryPattern = /Key còn hạn đến\s+([^<]+)/;
            const pageContent = await page.content();
            const match = pageContent.match(keyExpiryPattern);
            if (match) {
                keyExpiry = match[1].trim();
            }
        } catch (e) {
            console.log('⚠️ Could not get key expiry');
        }
        
        return {
            cooldownText,
            cooldownFound,
            accountInfo,
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

// Main function
async function main() {
    console.log('🚀 GETTING EXACT COOLDOWN TIME...');
    console.log('==================================');
    
    try {
        // 1. Get exact cooldown from website
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
        
        // 2. Create message
        let message = `⏰ THÔNG BÁO THỜI GIAN CHÍNH XÁC\n\n`;
        message += `📅 Thời gian: ${timeStr} ${dateStr}\n`;
        message += `🌐 Website: https://tokencursor.io.vn/app\n\n`;
        
        if (cooldownInfo.cooldownFound && cooldownInfo.cooldownText) {
            message += `⏳ Thời gian chờ: ${cooldownInfo.cooldownText}\n`;
            message += `🔄 Trạng thái: Đang trong thời gian chờ\n`;
        } else {
            message += `✅ Trạng thái: Có thể lấy token ngay\n`;
        }
        
        if (cooldownInfo.tokenCount) {
            message += `📊 Số token đã nhận: ${cooldownInfo.tokenCount}\n`;
        }
        
        if (cooldownInfo.keyExpiry) {
            message += `🔑 Key còn hạn đến: ${cooldownInfo.keyExpiry}\n`;
        }
        
        message += `\n🤖 From: Railway Token Server\n`;
        message += `🔗 Server: https://token-webhook-server-production.up.railway.app`;
        
        // 3. Send to Telegram
        console.log('📤 Sending exact cooldown info to Telegram...');
        const telegramResponse = await sendTelegramMessage(message);
        
        if (telegramResponse && telegramResponse.data.ok) {
            console.log('✅ Exact cooldown info sent successfully!');
            console.log('📱 Message ID:', telegramResponse.data.result.message_id);
            console.log('⏳ Cooldown:', cooldownInfo.cooldownText || 'Có thể lấy token ngay');
        } else {
            console.log('❌ Failed to send to Telegram:', telegramResponse?.data?.description || 'Unknown error');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    
    console.log('\n✅ Script completed');
}

main();
