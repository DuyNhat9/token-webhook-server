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

// Function to send simple Telegram message
async function sendSimpleTelegramMessage(message) {
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
        console.log('📤 Sending simple message to Telegram...');
        console.log('📝 Message length:', message.length);
        console.log('📝 Message preview:', message.substring(0, 100) + '...');
        
        const response = await makeRequest(telegramUrl, options);
        
        console.log('📊 Response status:', response.status);
        console.log('📊 Response data:', JSON.stringify(response.data, null, 2));
        
        if (response.data.ok) {
            console.log('✅ Simple message sent successfully!');
            console.log('📱 Message ID:', response.data.result.message_id);
            return true;
        } else {
            console.log('❌ Simple message failed:', response.data.description);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Simple message error:', error.message);
        return false;
    }
}

// Main function
async function main() {
    console.log('🚀 TESTING SIMPLE TELEGRAM MESSAGE...');
    console.log('=====================================');
    
    // Test 1: Very simple message
    console.log('\n1️⃣ Testing very simple message...');
    await sendSimpleTelegramMessage('🧪 Test message from local script');
    
    // Test 2: Message with token (short)
    console.log('\n2️⃣ Testing message with short token...');
    const shortToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.token';
    await sendSimpleTelegramMessage(`🔑 Token: ${shortToken}`);
    
    // Test 3: Message with long token
    console.log('\n3️⃣ Testing message with long token...');
    const longToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJnb29nbGUtb2F1dGgyfHVzZXJfMDFLNEhQNDg1MkJFUzNBMFpIQ1NQUDZYUUUiLCJ0aW1lIjoiMTc1NzIzNTI5NiIsInJhbmRvbW5lc3MiOiJkYzgyMTYzOS1mODRhLTQ0NGMiLCJleHAiOjE3NjI0MTkyOTYsImlzcyI6Imh0dHBzOi8vYXV0aGVudGljYXRpb24uY3Vyc29yLnNoIiwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCBvZmZsaW5lX2FjY2VzcyIsImF1ZCI6Imh0dHBzOi8vY3Vyc29yLmNvbSIsInR5cGUiOiJzZXNzaW9uIn0.CWWc9fPT8QSYt4-_FkLEkCpwyQffq2wMx7RyJi01-xo';
    await sendSimpleTelegramMessage(`🔑 Long Token: ${longToken}`);
    
    console.log('\n✅ Simple Telegram tests completed');
}

main();
