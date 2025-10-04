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

// Auto setup function
async function autoSetup() {
    console.log('🚀 AUTO TELEGRAM SETUP');
    console.log('======================\n');
    
    try {
        // Step 1: Test bot
        console.log('1️⃣ Testing bot...');
        const botInfoResponse = await makeRequest(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
        
        if (!botInfoResponse.data.ok) {
            console.log('❌ Bot token không hợp lệ!');
            return;
        }
        
        console.log('✅ Bot hoạt động:', botInfoResponse.data.result.username);
        
        // Step 2: Check for messages
        console.log('\n2️⃣ Checking for messages...');
        const updatesResponse = await makeRequest(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`);
        
        if (updatesResponse.data.ok && updatesResponse.data.result.length > 0) {
            console.log('✅ Tìm thấy tin nhắn!');
            const latestMessage = updatesResponse.data.result[updatesResponse.data.result.length - 1];
            const chatId = latestMessage.message.chat.id;
            const username = latestMessage.message.from.username || latestMessage.message.from.first_name;
            
            console.log('📱 Chat ID:', chatId);
            console.log('👤 Username:', username);
            
            // Step 3: Send test message
            console.log('\n3️⃣ Sending test message...');
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
                
                // Step 4: Set Railway variables
                console.log('\n4️⃣ Setting Railway variables...');
                console.log('📝 Run this command:');
                console.log(`railway variables --set TELEGRAM_CHAT_ID="${chatId}"`);
                
                // Step 5: Test Railway
                console.log('\n5️⃣ Testing Railway server...');
                console.log('📝 Run this command:');
                console.log('node test-telegram-railway.cjs');
                
                console.log('\n🎉 SETUP COMPLETE!');
                console.log('==================');
                console.log('✅ Bot is working');
                console.log('✅ Chat ID found:', chatId);
                console.log('✅ Test message sent');
                console.log('✅ Ready for Railway integration');
                
            } else {
                console.log('❌ Failed to send test message:', sendResponse.data);
            }
            
        } else {
            console.log('⚠️ Chưa có tin nhắn nào.');
            console.log('\n📱 MANUAL STEPS:');
            console.log('1. Mở Telegram');
            console.log('2. Tìm @Token_sever_bot');
            console.log('3. Gửi tin nhắn bất kỳ (ví dụ: /start)');
            console.log('4. Chạy lại script này: node auto-telegram-setup.cjs');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the setup
autoSetup().catch(console.error);
