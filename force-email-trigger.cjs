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

// Function to trigger email
async function triggerEmail() {
    try {
        console.log('🚀 Triggering Railway server to send email...');
        
        // Check server status
        console.log('📊 Checking server status...');
        const statusResponse = await makeRequest(`${RAILWAY_URL}/status`);
        console.log('✅ Server status:', statusResponse.data);
        
        // Get current token
        console.log('🔑 Getting current token...');
        const tokenResponse = await makeRequest(`${RAILWAY_URL}/token`);
        console.log('✅ Current token:', tokenResponse.data);
        
        // Try to trigger refresh (might be in cooldown)
        console.log('🔄 Attempting to refresh token...');
        try {
            const refreshResponse = await makeRequest(`${RAILWAY_URL}/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    apiKey: 'your-secret-api-key-123'
                })
            });
            console.log('✅ Refresh response:', refreshResponse.data);
        } catch (error) {
            console.log('⚠️ Refresh failed (might be in cooldown):', error.message);
        }
        
        // Wait for email to be sent
        console.log('⏳ Waiting for email to be sent...');
        await new Promise(resolve => setTimeout(resolve, 15000));
        
        // Check final status
        console.log('📊 Final server status...');
        const finalStatusResponse = await makeRequest(`${RAILWAY_URL}/status`);
        console.log('✅ Final status:', finalStatusResponse.data);
        
        console.log('🎉 Trigger completed! Check your email for the token list.');
        console.log('📧 If no email received, server might be in cooldown or email failed.');
        
    } catch (error) {
        console.error('❌ Error triggering Railway:', error.message);
    }
}

// Run the trigger
console.log('🚀 Starting Railway email trigger...');
triggerEmail().then(() => {
    console.log('✅ Trigger completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Trigger failed:', error);
    process.exit(1);
});
