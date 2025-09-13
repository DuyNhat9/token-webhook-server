#!/usr/bin/env node
import 'dotenv/config';
import fs from 'fs';

const SERVER_URL = process.env.SERVER_URL || 'https://your-server.railway.app';
const API_KEY = process.env.API_KEY || 'your-secret-api-key';

async function requestToken() {
    try {
        console.log('🔗 Connecting to token server...');
        
        // Get current token
        const response = await fetch(`${SERVER_URL}/token`);
        
        if (!response.ok) {
            if (response.status === 404) {
                console.log('❌ No token available on server');
                console.log('🔄 Requesting new token...');
                
                // Request refresh
                const refreshResponse = await fetch(`${SERVER_URL}/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ apiKey: API_KEY })
                });
                
                const refreshData = await refreshResponse.json();
                
                if (refreshData.success) {
                    console.log('✅ Token refreshed successfully!');
                    console.log(`🎫 Token: ${refreshData.token.substring(0, 50)}...`);
                    console.log(`📄 Info:`, refreshData.info);
                    
                    // Save token locally
                    fs.writeFileSync('token.txt', refreshData.token, 'utf8');
                    console.log('💾 Token saved to token.txt');
                    
                    return refreshData.token;
                } else {
                    console.log('❌ Failed to refresh token:', refreshData.message);
                    if (refreshData.cooldown) {
                        console.log(`⏰ Cooldown: ${refreshData.cooldown}`);
                    }
                    return null;
                }
            } else {
                throw new Error(`Server error: ${response.status}`);
            }
        }
        
        const data = await response.json();
        console.log('✅ Token retrieved from server!');
        console.log(`🎫 Token: ${data.token.substring(0, 50)}...`);
        console.log(`📄 Info:`, data.info);
        console.log(`⏰ Last update: ${data.lastUpdate}`);
        
        // Save token locally
        fs.writeFileSync('token.txt', data.token, 'utf8');
        console.log('💾 Token saved to token.txt');
        
        return data.token;
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return null;
    }
}

async function checkStatus() {
    try {
        console.log('📊 Checking server status...');
        
        const response = await fetch(`${SERVER_URL}/status`);
        const data = await response.json();
        
        console.log('📈 Server Status:');
        console.log(`   Has Token: ${data.hasToken ? '✅' : '❌'}`);
        console.log(`   Last Update: ${data.lastUpdate || 'Never'}`);
        console.log(`   Uptime: ${Math.floor(data.uptime / 3600)}h ${Math.floor((data.uptime % 3600) / 60)}m`);
        
        if (data.tokenInfo) {
            console.log(`   Token Info:`, data.tokenInfo);
        }
        
    } catch (error) {
        console.error('❌ Error checking status:', error.message);
    }
}

async function forceRefresh() {
    try {
        console.log('🔄 Force refreshing token...');
        
        const response = await fetch(`${SERVER_URL}/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: API_KEY })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Token refreshed successfully!');
            console.log(`🎫 Token: ${data.token.substring(0, 50)}...`);
            console.log(`📄 Info:`, data.info);
            
            // Save token locally
            fs.writeFileSync('token.txt', data.token, 'utf8');
            console.log('💾 Token saved to token.txt');
            
            return data.token;
        } else {
            console.log('❌ Failed to refresh token:', data.message);
            if (data.cooldown) {
                console.log(`⏰ Cooldown: ${data.cooldown}`);
            }
            return null;
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return null;
    }
}

// Main function
async function main() {
    const command = process.argv[2];
    
    switch (command) {
        case 'get':
        case 'token':
            await requestToken();
            break;
            
        case 'status':
            await checkStatus();
            break;
            
        case 'refresh':
            await forceRefresh();
            break;
            
        default:
            console.log('🎫 Token Client - Remote Token Request');
            console.log('');
            console.log('Usage:');
            console.log('  node client-request.js get     - Get current token');
            console.log('  node client-request.js status  - Check server status');
            console.log('  node client-request.js refresh - Force refresh token');
            console.log('');
            console.log('Environment variables:');
            console.log('  SERVER_URL - Your server URL (default: https://your-server.railway.app)');
            console.log('  API_KEY    - Your API key for protected endpoints');
            break;
    }
}

main();
