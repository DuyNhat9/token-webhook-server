const https = require('https');

const TELEGRAM_BOT_TOKEN = '8393051379:AAFjXE1Ww6iRjcldkkVfFzD6ySj36HlP7Zs';
const TELEGRAM_CHAT_ID = 7489189724; // Chat ID của bạn

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

// Quick test
async function quickTest() {
    try {
        console.log('⚡ QUICK TEST - Gửi tin nhắn ngay!');
        console.log('================================\n');
        
        const testMessage = {
            chat_id: TELEGRAM_CHAT_ID,
            text: '🎉 *BOT HOẠT ĐỘNG!*\n\n✅ Chat ID: ' + TELEGRAM_CHAT_ID + '\n👤 Username: David Tran\n\n🤖 Bot đã sẵn sàng nhận token!',
            parse_mode: 'Markdown'
        };
        
        console.log('📤 Sending test message...');
        const sendResponse = await makeRequest(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testMessage)
        });
        
        if (sendResponse.data.ok) {
            console.log('✅ Test message sent successfully!');
            console.log('📱 Message ID:', sendResponse.data.result.message_id);
            console.log('\n🎯 NEXT STEPS:');
            console.log('1. Set Chat ID in Railway:');
            console.log(`   railway variables --set TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID}"`);
            console.log('2. Test Railway server:');
            console.log('   node test-telegram-railway.cjs');
        } else {
            console.log('❌ Failed to send test message:', sendResponse.data);
            console.log('\n💡 Có thể bạn cần gửi tin nhắn cho bot trước:');
            console.log('1. Mở Telegram');
            console.log('2. Tìm @Token_sever_bot');
            console.log('3. Gửi tin nhắn bất kỳ (ví dụ: /start)');
            console.log('4. Chạy lại script này');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the test
quickTest().catch(console.error);
