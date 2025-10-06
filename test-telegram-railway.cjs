const https = require('https');

const RAILWAY_URL = 'https://token-webhook-server-production.up.railway.app';
const TELEGRAM_BOT_TOKEN = '8393051379:AAFjXE1Ww6iRjcldkkVfFzD6ySj36HlP7Zs';
const TELEGRAM_CHAT_ID = '7489189724'; // Chat ID của David Tran

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

// Test Railway server
async function testRailwayServer() {
    try {
        console.log('🚀 Testing Railway server...');
        
        // Test health endpoint
        console.log('1️⃣ Testing health endpoint...');
        const healthResponse = await makeRequest(`${RAILWAY_URL}/health`);
        console.log('Health Status:', healthResponse.status);
        console.log('Health Data:', healthResponse.data);
        
        // Test token endpoint
        console.log('\n2️⃣ Testing token endpoint...');
        const tokenResponse = await makeRequest(`${RAILWAY_URL}/token`);
        console.log('Token Status:', tokenResponse.status);
        if (tokenResponse.status === 200) {
            console.log('✅ Token available:', tokenResponse.data.token ? 'Yes' : 'No');
            console.log('Token Info:', tokenResponse.data.info);
        } else {
            console.log('❌ Token not available:', tokenResponse.data);
        }
        
        // Test status endpoint
        console.log('\n3️⃣ Testing status endpoint...');
        const statusResponse = await makeRequest(`${RAILWAY_URL}/status`);
        console.log('Status:', statusResponse.data);
        
        // Test force Telegram endpoint
        console.log('\n4️⃣ Testing force Telegram endpoint...');
        if (TELEGRAM_CHAT_ID === 'YOUR_CHAT_ID') {
            console.log('⚠️ Please configure Chat ID first!');
            console.log('📝 Steps to get Chat ID:');
            console.log('1. Send message to @Token_sever_bot');
            console.log('2. Run: node test-telegram-bot.cjs');
            console.log('3. Copy Chat ID and update this script');
        } else {
            const telegramResponse = await makeRequest(`${RAILWAY_URL}/force-telegram`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            console.log('Force Telegram Status:', telegramResponse.status);
            console.log('Force Telegram Response:', telegramResponse.data);
        }
        
    } catch (error) {
        console.error('❌ Error testing Railway server:', error.message);
    }
}

// Test Telegram bot directly
async function testTelegramBot() {
    if (TELEGRAM_CHAT_ID === 'YOUR_CHAT_ID') {
        console.log('⚠️ Please configure Chat ID first!');
        return;
    }
    
    try {
        console.log('\n📱 Testing Telegram bot directly...');
        
        const message = {
            chat_id: TELEGRAM_CHAT_ID,
            text: '🧪 *TEST MESSAGE*\n\nThis is a test from Railway server!\n\n✅ Bot is working correctly!',
            parse_mode: 'Markdown'
        };
        
        const response = await makeRequest(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(message)
        });
        
        if (response.data.ok) {
            console.log('✅ Telegram test successful!');
            console.log('📱 Message ID:', response.data.result.message_id);
        } else {
            console.log('❌ Telegram test failed:', response.data);
        }
        
    } catch (error) {
        console.error('❌ Error testing Telegram bot:', error.message);
    }
}

// Run tests
async function runTests() {
    console.log('🧪 Starting Railway + Telegram tests...\n');
    
    await testRailwayServer();
    await testTelegramBot();
    
    console.log('\n✅ Tests completed!');
}

runTests().catch(console.error);
