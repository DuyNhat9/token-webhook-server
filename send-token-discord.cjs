const https = require('https');

const RAILWAY_URL = 'https://token-webhook-server-production.up.railway.app';
const DISCORD_WEBHOOK = 'YOUR_DISCORD_WEBHOOK_URL'; // Thay bằng webhook URL của bạn

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

// Function to send token to Discord
async function sendTokenToDiscord() {
    try {
        console.log('🚀 Getting token from Railway server...');
        
        // Get current token
        const tokenResponse = await makeRequest(`${RAILWAY_URL}/token`);
        
        if (tokenResponse.status !== 200) {
            console.log('❌ Failed to get token:', tokenResponse.data);
            return;
        }
        
        const tokenData = tokenResponse.data;
        console.log('✅ Token retrieved successfully!');
        
        // Create Discord message
        const discordMessage = {
            content: "🎉 **TOKEN MỚI ĐƯỢC LẤY!**",
            embeds: [{
                title: "Token Information",
                color: 0x00ff00,
                fields: [
                    {
                        name: "🔑 Token",
                        value: `\`\`\`${tokenData.token}\`\`\``,
                        inline: false
                    },
                    {
                        name: "👤 Subject",
                        value: tokenData.info.subject,
                        inline: true
                    },
                    {
                        name: "⏰ Expires",
                        value: tokenData.info.expires,
                        inline: true
                    },
                    {
                        name: "⏱️ Time Left",
                        value: `${Math.floor(tokenData.info.timeLeft / 3600)}h ${Math.floor((tokenData.info.timeLeft % 3600) / 60)}m`,
                        inline: true
                    },
                    {
                        name: "🏷️ Type",
                        value: tokenData.info.type,
                        inline: true
                    },
                    {
                        name: "🏢 Issuer",
                        value: tokenData.info.issuer,
                        inline: true
                    }
                ],
                timestamp: new Date().toISOString(),
                footer: {
                    text: "Railway Token Server"
                }
            }]
        };
        
        // Send to Discord
        console.log('📤 Sending token to Discord...');
        const discordResponse = await makeRequest(DISCORD_WEBHOOK, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(discordMessage)
        });
        
        if (discordResponse.status === 204) {
            console.log('✅ Token sent to Discord successfully!');
        } else {
            console.log('❌ Failed to send to Discord:', discordResponse.data);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the script
console.log('🚀 Starting Discord token sender...');
sendTokenToDiscord().then(() => {
    console.log('✅ Script completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});
