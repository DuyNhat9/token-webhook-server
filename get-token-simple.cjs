const https = require('https');

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

// Function to get token
async function getToken() {
    try {
        console.log('🚀 Getting token from Railway server...');
        
        // Check server status
        console.log('📊 Checking server status...');
        const statusResponse = await makeRequest(`${RAILWAY_URL}/status`);
        console.log('✅ Server status:', statusResponse.data);
        
        if (!statusResponse.data.hasToken) {
            console.log('❌ No token available on server');
            console.log('🔄 Server might be in cooldown or restarting...');
            return;
        }
        
        // Get current token
        console.log('🔑 Getting current token...');
        const tokenResponse = await makeRequest(`${RAILWAY_URL}/token`);
        
        if (tokenResponse.status === 200) {
            const tokenData = tokenResponse.data;
            console.log('✅ Token retrieved successfully!');
            console.log('📄 Token:', tokenData.token);
            console.log('📊 Token Info:', tokenData.info);
            
            // Save token to file
            const fs = require('fs');
            const tokenContent = `Token: ${tokenData.token}\nSubject: ${tokenData.info.subject}\nExpires: ${tokenData.info.expires}\nTime Left: ${tokenData.info.timeLeft} seconds\nTimestamp: ${new Date().toLocaleString('vi-VN')}\n\n=== TOKEN BACKUP ===\n`;
            
            fs.appendFileSync('tokens-backup.txt', tokenContent);
            console.log('💾 Token saved to tokens-backup.txt');
            
            // Display token in a nice format
            console.log('\n🎉 TOKEN RETRIEVED SUCCESSFULLY!');
            console.log('═'.repeat(50));
            console.log(`Token: ${tokenData.token}`);
            console.log(`Subject: ${tokenData.info.subject}`);
            console.log(`Expires: ${tokenData.info.expires}`);
            console.log(`Time Left: ${Math.floor(tokenData.info.timeLeft / 3600)}h ${Math.floor((tokenData.info.timeLeft % 3600) / 60)}m`);
            console.log(`Type: ${tokenData.info.type}`);
            console.log(`Issuer: ${tokenData.info.issuer}`);
            console.log('═'.repeat(50));
            
        } else {
            console.log('❌ Failed to get token:', tokenResponse.data);
        }
        
    } catch (error) {
        console.error('❌ Error getting token:', error.message);
    }
}

// Run the script
console.log('🚀 Starting token retrieval...');
getToken().then(() => {
    console.log('✅ Script completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
});
