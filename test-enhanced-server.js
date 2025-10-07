#!/usr/bin/env node
import 'dotenv/config';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'your-secret-api-key-123';

async function testEnhancedServer() {
    console.log('🧪 Testing Enhanced Token Server...');
    console.log(`🔗 Server URL: ${SERVER_URL}`);
    
    try {
        // Test health endpoint
        console.log('\n1️⃣ Testing health endpoint...');
        const healthResponse = await fetch(`${SERVER_URL}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health check:', healthData);
        
        // Test status endpoint
        console.log('\n2️⃣ Testing status endpoint...');
        const statusResponse = await fetch(`${SERVER_URL}/status`);
        const statusData = await statusResponse.json();
        console.log('✅ Status check:', statusData);
        
        // Test token endpoint
        console.log('\n3️⃣ Testing token endpoint...');
        const tokenResponse = await fetch(`${SERVER_URL}/token`);
        if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            console.log('✅ Token available:', {
                hasToken: !!tokenData.token,
                lastUpdate: tokenData.lastUpdate,
                tokenPreview: tokenData.token ? tokenData.token.substring(0, 50) + '...' : 'None'
            });
        } else {
            const errorData = await tokenResponse.json();
            console.log('⚠️ No token available:', errorData.message);
        }
        
        // Test refresh endpoint
        console.log('\n4️⃣ Testing refresh endpoint...');
        const refreshResponse = await fetch(`${SERVER_URL}/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: API_KEY })
        });
        
        const refreshData = await refreshResponse.json();
        if (refreshData.success) {
            console.log('✅ Token refreshed successfully!');
            console.log('📄 Token info:', refreshData.info);
        } else {
            console.log('❌ Refresh failed:', refreshData.message);
            if (refreshData.cooldown) {
                console.log(`⏰ Cooldown: ${refreshData.cooldown} seconds`);
            }
            if (refreshData.availableButtons) {
                console.log('🔍 Available buttons:', refreshData.availableButtons);
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testEnhancedServer();
