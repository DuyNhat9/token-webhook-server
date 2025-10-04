const https = require('https');

const TELEGRAM_BOT_TOKEN = '8393051379:AAFjXE1Ww6iRjcldkkVfFzD6ySj36HlP7Zs';
const TELEGRAM_CHAT_ID = 7489189724; // Chat ID của David Tran (dạng số)

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

// Test sending message
async function testSendMessage() {
    try {
        if (TELEGRAM_CHAT_ID === 'YOUR_CHAT_ID') {
            console.log('❌ Please update TELEGRAM_CHAT_ID in this script first!');
            console.log('📝 Steps:');
            console.log('1. Get your Chat ID from @userinfobot');
            console.log('2. Update TELEGRAM_CHAT_ID in this script');
            console.log('3. Run this script again');
            return;
        }
        
        console.log('🧪 Testing Telegram bot with Chat ID:', TELEGRAM_CHAT_ID);
        
        const testMessage = {
            chat_id: TELEGRAM_CHAT_ID,
            text: '🎉 *BOT HOẠT ĐỘNG!*\n\n✅ Chat ID: ' + TELEGRAM_CHAT_ID + '\n👤 Bot: @Token_sever_bot\n\n🤖 Bot đã sẵn sàng nhận token!',
            parse_mode: 'Markdown'
        };
        
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
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the test
testSendMessage().catch(console.error);
