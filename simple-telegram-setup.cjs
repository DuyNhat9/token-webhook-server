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

// Simple setup function
async function simpleSetup() {
    console.log('🚀 SIMPLE TELEGRAM SETUP');
    console.log('========================\n');
    
    console.log('📱 CÁCH ĐƠN GIẢN NHẤT:');
    console.log('1. Mở Telegram');
    console.log('2. Tìm @BotFather');
    console.log('3. Gửi /newbot');
    console.log('4. Đặt tên bot (ví dụ: "My Token Bot")');
    console.log('5. Đặt username (ví dụ: "my_token_bot_2025")');
    console.log('6. Copy token mới');
    console.log('7. Gửi /start cho bot mới của bạn');
    console.log('8. Chạy script này với token mới\n');
    
    // Test với bot hiện tại
    console.log('🧪 Testing current bot...');
    const TELEGRAM_BOT_TOKEN = '8393051379:AAFjXE1Ww6iRjcldkkVfFzD6ySj36HlP7Zs';
    
    try {
        // Get bot info
        const botInfoResponse = await makeRequest(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
        
        if (botInfoResponse.data.ok) {
            console.log('✅ Bot hiện tại hoạt động:', botInfoResponse.data.result.username);
            console.log('📱 Bot: @' + botInfoResponse.data.result.username);
            
            // Get updates
            const updatesResponse = await makeRequest(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`);
            
            if (updatesResponse.data.ok && updatesResponse.data.result.length > 0) {
                console.log('✅ Tìm thấy tin nhắn!');
                const latestMessage = updatesResponse.data.result[updatesResponse.data.result.length - 1];
                const chatId = latestMessage.message.chat.id;
                const username = latestMessage.message.from.username || latestMessage.message.from.first_name;
                
                console.log('🎉 SUCCESS!');
                console.log('📱 Chat ID:', chatId);
                console.log('👤 Username:', username);
                
                // Send test message
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
                console.log('⚠️ Chưa có tin nhắn nào. Hãy gửi tin nhắn cho bot trước!');
                console.log('📝 Steps:');
                console.log('1. Mở Telegram');
                console.log('2. Tìm @Token_sever_bot');
                console.log('3. Gửi tin nhắn bất kỳ (ví dụ: /start)');
                console.log('4. Chạy lại script này');
            }
            
        } else {
            console.log('❌ Bot token không hợp lệ:', botInfoResponse.data);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the setup
simpleSetup().catch(console.error);
