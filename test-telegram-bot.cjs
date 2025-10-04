const https = require('https');

const TELEGRAM_BOT_TOKEN = '8393051379:AAFjXE1Ww6iRjcldkkVfFzD6ySj36HlP7Zs';

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

// Function to test bot token
async function testBotToken() {
    try {
        console.log('🤖 Testing Telegram bot token...');
        console.log('📱 Bot: @Token_sever_bot');
        console.log('🔑 Token:', TELEGRAM_BOT_TOKEN);
        
        // Test bot info
        console.log('\n📊 Getting bot info...');
        const botInfoResponse = await makeRequest(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
        
        if (botInfoResponse.data.ok) {
            console.log('✅ Bot token is valid!');
            console.log('📋 Bot Info:', botInfoResponse.data.result);
        } else {
            console.log('❌ Bot token is invalid:', botInfoResponse.data);
            return;
        }
        
        // Get updates to find chat ID
        console.log('\n📨 Getting updates to find chat ID...');
        const updatesResponse = await makeRequest(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`);
        
        if (updatesResponse.data.ok) {
            const updates = updatesResponse.data.result;
            console.log('📊 Updates count:', updates.length);
            
            if (updates.length > 0) {
                console.log('✅ Found chat IDs:');
                updates.forEach((update, index) => {
                    if (update.message && update.message.chat) {
                        const chat = update.message.chat;
                        console.log(`   ${index + 1}. Chat ID: ${chat.id} (${chat.first_name || 'Unknown'} ${chat.last_name || ''})`);
                        console.log(`      Type: ${chat.type}`);
                        console.log(`      Username: @${chat.username || 'N/A'}`);
                    }
                });
                
                // Use the first chat ID for testing
                const firstChatId = updates[0].message.chat.id;
                console.log(`\n🎯 Using Chat ID: ${firstChatId} for testing`);
                
                // Send test message
                console.log('\n📤 Sending test message...');
                const testMessage = {
                    chat_id: firstChatId,
                    text: '🎉 Test message from Railway Token Server!\n\nBot is working correctly! ✅',
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
                    console.log('📱 Check your Telegram for the test message!');
                } else {
                    console.log('❌ Failed to send test message:', sendResponse.data);
                }
                
            } else {
                console.log('⚠️ No messages found. Please send a message to @Token_sever_bot first!');
                console.log('📝 Steps:');
                console.log('1. Open Telegram');
                console.log('2. Search for @Token_sever_bot');
                console.log('3. Send any message (like /start or Hello)');
                console.log('4. Run this script again');
            }
        } else {
            console.log('❌ Failed to get updates:', updatesResponse.data);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the test
console.log('🚀 Starting Telegram bot test...');
testBotToken().then(() => {
    console.log('✅ Test completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
});
