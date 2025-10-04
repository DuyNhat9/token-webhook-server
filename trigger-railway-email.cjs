const fetch = require('node-fetch');

const RAILWAY_URL = 'https://token-webhook-server-production.up.railway.app';
const API_KEY = 'your-secret-api-key-123'; // Thay bằng API key thực tế

// Function to trigger Railway server to send email
async function triggerRailwayEmail() {
    try {
        console.log('🚀 Triggering Railway server to send email...');
        
        // First, check server status
        console.log('📊 Checking server status...');
        const statusResponse = await fetch(`${RAILWAY_URL}/status`);
        const statusData = await statusResponse.json();
        console.log('✅ Server status:', statusData);
        
        // Get current token
        console.log('🔑 Getting current token...');
        const tokenResponse = await fetch(`${RAILWAY_URL}/token`);
        const tokenData = await tokenResponse.json();
        console.log('✅ Current token:', tokenData);
        
        // Force refresh to trigger email sending
        console.log('🔄 Force refreshing token to trigger email...');
        const refreshResponse = await fetch(`${RAILWAY_URL}/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey: API_KEY
            })
        });
        
        const refreshData = await refreshResponse.json();
        console.log('✅ Refresh response:', refreshData);
        
        // Wait a bit for email to be sent
        console.log('⏳ Waiting for email to be sent...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Check final status
        console.log('📊 Final server status...');
        const finalStatusResponse = await fetch(`${RAILWAY_URL}/status`);
        const finalStatusData = await finalStatusResponse.json();
        console.log('✅ Final status:', finalStatusData);
        
        console.log('🎉 Trigger completed! Check your email for the token list.');
        
    } catch (error) {
        console.error('❌ Error triggering Railway:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run the trigger
console.log('🚀 Starting Railway trigger...');
triggerRailwayEmail().then(() => {
    console.log('✅ Trigger completed');
    process.exit(0);
}).catch(error => {
    console.error('❌ Trigger failed:', error);
    process.exit(1);
});
