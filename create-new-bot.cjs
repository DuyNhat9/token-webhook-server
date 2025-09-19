const https = require('https');

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

// Test with a different approach
async function testBot() {
    try {
        console.log('🧪 Testing Telegram bot with different approach...');
        
        // Test with the existing bot token
        const TELEGRAM_BOT_TOKEN = '8393051379:AAFjXE1Ww6iRjcldkkVfFzD6ySj36HlP7Zs';
        
        // Get bot info
        console.log('📊 Getting bot info...');
        const botInfoResponse = await makeRequest(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
        
        if (botInfoResponse.data.ok) {
            console.log('✅ Bot is valid:', botInfoResponse.data.result.username);
        } else {
            console.log('❌ Bot token is invalid:', botInfoResponse.data);
            return;
        }
        
        // Get updates with offset to clear old messages
        console.log('📨 Getting updates...');
        const updatesResponse = await makeRequest(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=-1`);
        
        console.log('📊 Updates response:', JSON.stringify(updatesResponse.data, null, 2));
        
        if (updatesResponse.data.ok && updatesResponse.data.result.length > 0) {
            console.log('✅ Found messages!');
            const latestMessage = updatesResponse.data.result[updatesResponse.data.result.length - 1];
            const chatId = latestMessage.message.chat.id;
            const username = latestMessage.message.from.username || latestMessage.message.from.first_name;
            
            console.log('🎉 SUCCESS!');
            console.log('📱 Chat ID:', chatId);
            console.log('👤 Username:', username);
            console.log('💬 Message:', latestMessage.message.text);
            
            // Send test message back
            console.log('📤 Sending test message...');
            const testMessage = {
                chat_id: chatId,
                text: '🎉 *BOT HOẠT ĐỘNG!*\n\n✅ Chat ID: ' + chatId + '\n👤 Username: ' + username + '\n\n🤖 Bot đã sẵn sàng nhận token!',
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
                console.log(`   railway variables --set TELEGRAM_CHAT_ID="${chatId}"`);
                console.log('2. Test Railway server:');
                console.log('   node test-telegram-railway.cjs');
            } else {
                console.log('❌ Failed to send test message:', sendResponse.data);
            }
            
        } else {
            console.log('⚠️ No messages found. Please try:');
            console.log('1. Make sure you sent a message to @Token_sever_bot');
            console.log('2. Wait a few seconds and try again');
            console.log('3. Check if the bot username is correct');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the test
testBot().catch(console.error);
