import fetch from 'node-fetch';

const BASE_URL = process.env.RAILWAY_URL || 'http://localhost:8080';

async function testEndpoints() {
    console.log('🧪 Testing Railway deployment...\n');
    
    const endpoints = [
        { method: 'GET', path: '/health', name: 'Health Check' },
        { method: 'GET', path: '/status', name: 'Server Status' },
        { method: 'GET', path: '/token', name: 'Get Token' },
        { method: 'POST', path: '/refresh', name: 'Force Refresh' },
        { method: 'POST', path: '/auto-refresh', name: 'Auto Refresh' }
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`🔍 Testing ${endpoint.name}...`);
            
            const response = await fetch(`${BASE_URL}${endpoint.path}`, {
                method: endpoint.method,
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${endpoint.name}: OK`);
                console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}...`);
            } else {
                console.log(`❌ ${endpoint.name}: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.log(`❌ ${endpoint.name}: ${error.message}`);
        }
        console.log('');
    }
    
    console.log('🎉 Test completed!');
}

// Run tests
testEndpoints().catch(console.error);
