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

// Function to login and get token
async function loginAndGetToken() {
    let browser;
    try {
        console.log('🌐 Opening browser to login and get token...');
        
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
        
        // Check current URL
        const currentUrl = page.url();
        console.log('📍 Current URL:', currentUrl);
        
        // Fill the key (new structure uses password input)
        console.log('🔍 Looking for key input...');
        await page.waitForSelector('input[type="password"]', { timeout: 10000 });
        console.log('✅ Key input found');
        
        // Fill the key
        const keyId = process.env.KEY_ID || 'F24A****************************D954';
        await page.type('input[type="password"]', keyId);
        console.log('✅ Key filled');
        
        // Submit the form
        await page.click('button[type="submit"]');
        console.log('✅ Form submitted');
        
        // Wait for page to load and redirect
        await page.waitForTimeout(5000);
        
        // Check new URL
        const newUrl = page.url();
        console.log('📍 New URL:', newUrl);
        
        // If still on login page, try to navigate to app
        if (newUrl.includes('/login')) {
            console.log('🔄 Still on login page, trying to navigate to app...');
            await page.goto('https://tokencursor.io.vn/app', { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            await page.waitForTimeout(3000);
        }
        
        // Check final URL
        const finalUrl = page.url();
        console.log('📍 Final URL:', finalUrl);
        
        // Look for buttons
        const buttons = await page.$$eval('button', buttons => 
            buttons.map(btn => btn.textContent.trim())
        );
        console.log('Found', buttons.length, 'buttons:');
        buttons.forEach((btn, index) => {
            console.log(`Button ${index}: "${btn}"`);
        });
        
        // Look for any text content that might indicate the page state
        const pageContent = await page.content();
        console.log('📄 Page content preview (first 1000 chars):');
        console.log(pageContent.substring(0, 1000) + '...');
        
        // Check for cooldown message
        const cooldownPatterns = [
            /Chờ\s+(\d+):(\d+)\s+nữa/,
            /(\d+):(\d+)\s+nữa/,
            /(\d+)\s+phút\s+nữa/,
            /(\d+)\s+giây\s+nữa/
        ];
        
        for (const pattern of cooldownPatterns) {
            const match = pageContent.match(pattern);
            if (match) {
                console.log('⏰ Cooldown detected:', match[0]);
                
                // Send cooldown notification
                const now = new Date();
                const timeStr = now.toLocaleTimeString('vi-VN', { 
                    timeZone: 'Asia/Ho_Chi_Minh',
                    hour12: false 
                });
                const dateStr = now.toLocaleDateString('vi-VN');
                
                let message = `⏰ THÔNG BÁO THỜI GIAN CHỜ\n\n`;
                message += `📅 Thời gian: ${timeStr} ${dateStr}\n`;
                message += `⏳ Thời gian chờ: ${match[0]}\n`;
                message += `🔄 Trạng thái: Đang trong thời gian chờ\n`;
                message += `🤖 From: Local Token Getter\n`;
                message += `🔗 Website: https://tokencursor.io.vn/app`;
                
                console.log('📤 Sending cooldown notification...');
                const telegramResponse = await sendTelegramMessage(message);
                
                if (telegramResponse && telegramResponse.data.ok) {
                    console.log('✅ Cooldown notification sent successfully!');
                    console.log('📱 Message ID:', telegramResponse.data.result.message_id);
                }
                
                return { cooldown: match[0] };
            }
        }
        
        // Check for token
        const jwtPattern = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/;
        const tokenMatch = pageContent.match(jwtPattern);
        
        if (tokenMatch) {
            const token = tokenMatch[0];
            console.log('🎉 FOUND JWT in page text!');
            console.log(token);
            
            // Decode JWT to get info
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const now = new Date();
                const timeStr = now.toLocaleTimeString('vi-VN', { 
                    timeZone: 'Asia/Ho_Chi_Minh',
                    hour12: false 
                });
                const dateStr = now.toLocaleDateString('vi-VN');
                
                const expires = new Date(payload.exp * 1000);
                const expiresStr = expires.toLocaleTimeString('vi-VN', { 
                    timeZone: 'Asia/Ho_Chi_Minh',
                    hour12: false 
                }) + ' ' + expires.toLocaleDateString('vi-VN');
                
                const timeLeft = Math.floor((payload.exp * 1000 - now.getTime()) / 1000);
                const timeLeftHours = Math.floor(timeLeft / 3600);
                const timeLeftMinutes = Math.floor((timeLeft % 3600) / 60);
                const timeLeftSeconds = timeLeft % 60;
                
                console.log('📄 Token Info:');
                console.log('   Subject:', payload.sub);
                console.log('   Expires:', expiresStr);
                console.log('   Time Left:', `${timeLeftHours}h ${timeLeftMinutes}m ${timeLeftSeconds}s`);
                console.log('   Type:', payload.type || 'session');
                console.log('   Issuer:', payload.iss);
                
                // Create Telegram message
                let message = `🎉 TOKEN MỚI ĐƯỢC LẤY!\n\n`;
                message += `📅 Thời gian: ${timeStr} ${dateStr}\n`;
                message += `🔑 Token: ${token}\n`;
                message += `👤 Subject: ${payload.sub}\n`;
                message += `⏰ Expires: ${expiresStr}\n`;
                message += `⏱️ Time Left: ${timeLeftHours}h ${timeLeftMinutes}m ${timeLeftSeconds}s\n`;
                message += `🏷️ Type: ${payload.type || 'session'}\n`;
                message += `🏢 Issuer: ${payload.iss}\n\n`;
                message += `🤖 From: Local Token Getter\n`;
                message += `🔗 Website: https://tokencursor.io.vn/app`;
                
                // Send to Telegram
                console.log('📤 Sending token to Telegram...');
                const telegramResponse = await sendTelegramMessage(message);
                
                if (telegramResponse && telegramResponse.data.ok) {
                    console.log('✅ Token sent to Telegram successfully!');
                    console.log('📱 Message ID:', telegramResponse.data.result.message_id);
                } else {
                    console.log('❌ Failed to send to Telegram:', telegramResponse?.data?.description || 'Unknown error');
                }
                
                return {
                    token,
                    subject: payload.sub,
                    expires: expiresStr,
                    timeLeft: timeLeft,
                    type: payload.type || 'session',
                    issuer: payload.iss
                };
                
            } catch (e) {
                console.log('❌ Error decoding JWT:', e.message);
                return null;
            }
        } else {
            console.log('❌ No JWT token found in page content');
            return null;
        }
        
    } catch (error) {
        console.error('❌ Error getting token:', error.message);
        return null;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Main function
async function main() {
    console.log('🚀 LOGIN AND GET TOKEN...');
    console.log('==========================');
    
    const result = await loginAndGetToken();
    
    if (result) {
        if (result.cooldown) {
            console.log('\n⏰ COOLDOWN DETECTED!');
            console.log('══════════════════════════════════════════════════');
            console.log('Cooldown:', result.cooldown);
            console.log('══════════════════════════════════════════════════');
        } else {
            console.log('\n✅ TOKEN RETRIEVED SUCCESSFULLY!');
            console.log('══════════════════════════════════════════════════');
            console.log('Token:', result.token);
            console.log('Subject:', result.subject);
            console.log('Expires:', result.expires);
            console.log('Time Left:', Math.floor(result.timeLeft / 3600) + 'h ' + Math.floor((result.timeLeft % 3600) / 60) + 'm');
            console.log('Type:', result.type);
            console.log('Issuer:', result.issuer);
            console.log('══════════════════════════════════════════════════');
        }
    } else {
        console.log('\n❌ Failed to get token');
    }
    
    console.log('\n✅ Script completed');
}

main();
