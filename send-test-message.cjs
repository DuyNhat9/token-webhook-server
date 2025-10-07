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

// Test sending message to bot
async function sendTestMessage() {
    try {
        console.log('🧪 Testing Telegram bot...');
        
        // First, get updates to see if there are any messages
        console.log('📨 Getting updates...');
        const updatesResponse = await makeRequest(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`);
        
        if (updatesResponse.data.ok && updatesResponse.data.result.length > 0) {
            console.log('✅ Found messages!');
            const latestMessage = updatesResponse.data.result[updatesResponse.data.result.length - 1];
            const chatId = latestMessage.message.chat.id;
            const username = latestMessage.message.from.username || latestMessage.message.from.first_name;
            
            console.log('📱 Chat ID:', chatId);
            console.log('👤 Username:', username);
            
            // Send test message back
            console.log('📤 Sending test message...');
            const testMessage = {
                chat_id: chatId,
                text: '🧪 *TEST MESSAGE*\n\n✅ Bot is working correctly!\n\n📱 Chat ID: ' + chatId + '\n👤 Username: ' + username,
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
                console.log('\n🎉 SUCCESS! Your Chat ID is:', chatId);
                console.log('📝 Now you can set it in Railway:');
                console.log(`railway variables --set TELEGRAM_CHAT_ID="${chatId}"`);
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
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the test
sendTestMessage().catch(console.error);
