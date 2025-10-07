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
    console.log('🚀 TESTING FULL TOKEN SENDING...');
    console.log('=================================');
    
    // Token bạn cung cấp (có vẻ bị thiếu phần cuối)
    const providedToken = 'yJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJnb29nbGUtb2F1dGgyfHVzZXJfMDFLNEdEV05XNkhFMlE0UDRFU1Y1WEo5SjMiLCJ0aW1lIjoiMTc1NzE5MzA3NSIsInJhbmRvbW5lc3MiOiI2ZWYzMTRmNy1kNTBiLTRhZDIiLCJleHAiOjE3NjIzNzcwNzUsImlzcyI6Imh0dHBzOi8vYXV0aGVudGljYXRpb24uY3Vyc29yLnNoIiwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCBvZmZsaW5lX2FjY2VzcyIsImF1ZCI6Imh0dHBzOi8vY3Vyc29yLmNvbSIsInR5cGUiOiJzZXNzaW9uIn0.UcPPYyhXlOUetAef9t3RKOPb-72neKWO10BbS1fIvdk';
    
    // Token đầy đủ từ Railway (nếu có)
    const fullToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJnb29nbGUtb2F1dGgyfHVzZXJfMDFLNEdEV05XNkhFMlE0UDRFU1Y1WEo5SjMiLCJ0aW1lIjoiMTc1NzE5MzA3NSIsInJhbmRvbW5lc3MiOiI2ZWYzMTRmNy1kNTBiLTRhZDIiLCJleHAiOjE3NjIzNzcwNzUsImlzcyI6Imh0dHBzOi8vYXV0aGVudGljYXRpb24uY3Vyc29yLnNoIiwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCBvZmZsaW5lX2FjY2VzcyIsImF1ZCI6Imh0dHBzOi8vY3Vyc29yLmNvbSIsInR5cGUiOiJzZXNzaW9uIn0.UcPPYyhXlOUetAef9t3RKOPb-72neKWO10BbS1fIvdk';
    
    console.log('📝 Provided token length:', providedToken.length);
    console.log('📝 Full token length:', fullToken.length);
    console.log('📝 Provided token preview:', providedToken.substring(0, 100) + '...');
    console.log('📝 Full token preview:', fullToken.substring(0, 100) + '...');
    
    // Test 1: Token bạn cung cấp
    console.log('\n1️⃣ Testing with provided token...');
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { 
        timeZone: 'Asia/Ho_Chi_Minh',
        hour12: false 
    });
    const dateStr = now.toLocaleDateString('vi-VN');
    
    let message1 = `🎉 TOKEN TEST (PROVIDED)\n\n`;
    message1 += `📅 Thời gian: ${timeStr} ${dateStr}\n`;
    message1 += `🔑 Token: ${providedToken}\n`;
    message1 += `📏 Length: ${providedToken.length} characters\n`;
    message1 += `🤖 From: Test Script`;
    
    console.log('📝 Message 1 length:', message1.length);
    console.log('📝 Message 1 preview:', message1.substring(0, 200) + '...');
    
    const response1 = await sendTelegramMessage(message1);
    if (response1 && response1.data.ok) {
        console.log('✅ Message 1 sent successfully!');
        console.log('📱 Message ID:', response1.data.result.message_id);
    } else {
        console.log('❌ Message 1 failed:', response1?.data?.description || 'Unknown error');
    }
    
    // Test 2: Token đầy đủ
    console.log('\n2️⃣ Testing with full token...');
    let message2 = `🎉 TOKEN TEST (FULL)\n\n`;
    message2 += `📅 Thời gian: ${timeStr} ${dateStr}\n`;
    message2 += `🔑 Token: ${fullToken}\n`;
    message2 += `📏 Length: ${fullToken.length} characters\n`;
    message2 += `🤖 From: Test Script`;
    
    console.log('📝 Message 2 length:', message2.length);
    console.log('📝 Message 2 preview:', message2.substring(0, 200) + '...');
    
    const response2 = await sendTelegramMessage(message2);
    if (response2 && response2.data.ok) {
        console.log('✅ Message 2 sent successfully!');
        console.log('📱 Message ID:', response2.data.result.message_id);
    } else {
        console.log('❌ Message 2 failed:', response2?.data?.description || 'Unknown error');
    }
    
    console.log('\n✅ Full token tests completed');
}

main();
