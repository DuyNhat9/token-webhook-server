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

// Test with manual chat ID
async function testWithManualChatId() {
    try {
        console.log('🧪 Testing with manual Chat ID...');
        
        // You can try with a common chat ID format
        // But first, let's try to get your chat ID from a different approach
        
        console.log('📝 Please follow these steps:');
        console.log('1. Open Telegram');
        console.log('2. Search for @userinfobot');
        console.log('3. Send /start to @userinfobot');
        console.log('4. Copy your Chat ID from the response');
        console.log('5. Come back here and we will test with that Chat ID');
        
        // For now, let's try to send a message to a test chat ID
        // This will help us understand if the bot can send messages at all
        
        console.log('\n🔍 Testing bot sending capability...');
        
        // Try to send a message to a test chat (this will fail but show us the error)
        const testMessage = {
            chat_id: 123456789, // This is a fake chat ID
            text: 'Test message',
            parse_mode: 'Markdown'
        };
        
        const sendResponse = await makeRequest(`https://api.telegram.org/bot8393051379:AAFjXE1Ww6iRjcldkkVfFzD6ySj36HlP7Zs/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testMessage)
        });
        
        console.log('📊 Send test response:', JSON.stringify(sendResponse.data, null, 2));
        
        if (sendResponse.data.error_code === 400) {
            console.log('✅ Bot can send messages (got expected error for fake chat ID)');
        } else {
            console.log('❌ Unexpected response:', sendResponse.data);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Alternative: Create a simple webhook to receive messages
async function createWebhook() {
    try {
        console.log('🔗 Setting up webhook...');
        
        // Set webhook to receive messages
        const webhookUrl = 'https://your-domain.com/webhook'; // This won't work without a real domain
        const webhookResponse = await makeRequest(`https://api.telegram.org/bot8393051379:AAFjXE1Ww6iRjcldkkVfFzD6ySj36HlP7Zs/setWebhook?url=${webhookUrl}`);
        
        console.log('📊 Webhook response:', webhookResponse.data);
        
    } catch (error) {
        console.error('❌ Webhook error:', error.message);
    }
}

// Main function
async function main() {
    console.log('🚀 Telegram Bot Setup Helper');
    console.log('============================\n');
    
    await testWithManualChatId();
    
    console.log('\n📋 MANUAL STEPS:');
    console.log('1. Open Telegram');
    console.log('2. Search for @userinfobot');
    console.log('3. Send /start to get your Chat ID');
    console.log('4. Copy the Chat ID number');
    console.log('5. Run: railway variables --set TELEGRAM_CHAT_ID="YOUR_CHAT_ID"');
    console.log('6. Test: node test-telegram-railway.cjs');
}

main().catch(console.error);
