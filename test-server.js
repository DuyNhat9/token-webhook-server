#!/usr/bin/env node
import 'dotenv/config';

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'your-secret-api-key-123';

async function testServer() {
    console.log('🧪 Testing Token Server...');
    console.log(`📡 Server URL: ${SERVER_URL}`);
    
    try {
        // Test health check
        console.log('\n1. Testing health check...');
        const healthResponse = await fetch(`${SERVER_URL}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health check:', healthData);
        
        // Test status
        console.log('\n2. Testing status...');
        const statusResponse = await fetch(`${SERVER_URL}/status`);
        const statusData = await statusResponse.json();
        console.log('✅ Status:', statusData);
        
        // Test token endpoint
        console.log('\n3. Testing token endpoint...');
        const tokenResponse = await fetch(`${SERVER_URL}/token`);
        if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json();
            console.log('✅ Token available:', {
                hasToken: !!tokenData.token,
                subject: tokenData.info?.subject,
                expires: tokenData.info?.expires,
                timeLeft: tokenData.info?.timeLeft
            });
        } else {
            const errorData = await tokenResponse.json();
            console.log('⚠️  No token available:', errorData.error);
        }
        
        // Test refresh endpoint
        console.log('\n4. Testing refresh endpoint...');
        const refreshResponse = await fetch(`${SERVER_URL}/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: API_KEY })
        });
        
        if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            console.log('✅ Refresh successful:', refreshData.message);
        } else {
            const errorData = await refreshResponse.json();
            console.log('❌ Refresh failed:', errorData.error);
        }
        
        console.log('\n🎉 Server test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testServer();
