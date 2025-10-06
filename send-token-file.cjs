const https = require('https');
const fs = require('fs');

const RAILWAY_URL = 'https://token-webhook-server-production.up.railway.app';

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

// Function to send token to file
async function sendTokenToFile() {
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
        
        // Create token content
        const tokenContent = `
🎉 TOKEN MỚI ĐƯỢC LẤY!
══════════════════════════════════════════════════
🔑 Token: ${tokenData.token}
👤 Subject: ${tokenData.info.subject}
⏰ Expires: ${tokenData.info.expires}
⏱️ Time Left: ${Math.floor(tokenData.info.timeLeft / 3600)}h ${Math.floor((tokenData.info.timeLeft % 3600) / 60)}m
🏷️ Type: ${tokenData.info.type}
🏢 Issuer: ${tokenData.info.issuer}
📅 Time: ${new Date().toLocaleString('vi-VN')}
🤖 From: Railway Token Server
══════════════════════════════════════════════════
`;
        
        // Save to multiple files
        const files = [
            'current-token.txt',
            'token-latest.txt',
            'tokens-backup.txt'
        ];
        
        files.forEach(file => {
            if (file === 'tokens-backup.txt') {
                // Append to backup file
                fs.appendFileSync(file, `\n${tokenContent}\n`);
            } else {
                // Overwrite current token files
                fs.writeFileSync(file, tokenContent);
            }
        });
        
        console.log('✅ Token saved to files:');
        files.forEach(file => {
            console.log(`   📄 ${file}`);
        });
        
        // Also save as JSON
        const jsonContent = {
            token: tokenData.token,
            info: tokenData.info,
            timestamp: new Date().toISOString(),
            source: 'Railway Token Server'
        };
        
        fs.writeFileSync('current-token.json', JSON.stringify(jsonContent, null, 2));
        console.log('   📄 current-token.json');
        
        // Display token
        console.log('\n' + tokenContent);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the script
console.log('🚀 Starting file token sender...');
sendTokenToFile().then(() => {
    console.log('✅ Script completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});
