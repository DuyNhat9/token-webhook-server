const https = require('https');

const RAILWAY_URL = 'https://token-webhook-server-production.up.railway.app';
const SLACK_WEBHOOK = 'YOUR_SLACK_WEBHOOK_URL'; // Thay bằng webhook URL của bạn

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

// Function to send token to Slack
async function sendTokenToSlack() {
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
        
        // Create Slack message
        const slackMessage = {
            text: "🎉 *TOKEN MỚI ĐƯỢC LẤY!*",
            blocks: [
                {
                    type: "header",
                    text: {
                        type: "plain_text",
                        text: "🎉 TOKEN MỚI ĐƯỢC LẤY!"
                    }
                },
                {
                    type: "section",
                    text: {
                        type: "mrkdwn",
                        text: `*🔑 Token:*\n\`\`\`${tokenData.token}\`\`\``
                    }
                },
                {
                    type: "section",
                    fields: [
                        {
                            type: "mrkdwn",
                            text: `*👤 Subject:*\n${tokenData.info.subject}`
                        },
                        {
                            type: "mrkdwn",
                            text: `*⏰ Expires:*\n${tokenData.info.expires}`
                        },
                        {
                            type: "mrkdwn",
                            text: `*⏱️ Time Left:*\n${Math.floor(tokenData.info.timeLeft / 3600)}h ${Math.floor((tokenData.info.timeLeft % 3600) / 60)}m`
                        },
                        {
                            type: "mrkdwn",
                            text: `*🏷️ Type:*\n${tokenData.info.type}`
                        }
                    ]
                },
                {
                    type: "context",
                    elements: [
                        {
                            type: "mrkdwn",
                            text: `📅 ${new Date().toLocaleString('vi-VN')} | 🤖 Railway Token Server`
                        }
                    ]
                }
            ]
        };
        
        // Send to Slack
        console.log('📤 Sending token to Slack...');
        const slackResponse = await makeRequest(SLACK_WEBHOOK, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(slackMessage)
        });
        
        if (slackResponse.status === 200) {
            console.log('✅ Token sent to Slack successfully!');
        } else {
            console.log('❌ Failed to send to Slack:', slackResponse.data);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the script
console.log('🚀 Starting Slack token sender...');
sendTokenToSlack().then(() => {
    console.log('✅ Script completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});
