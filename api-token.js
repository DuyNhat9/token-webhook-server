#!/usr/bin/env node
import 'dotenv/config';
import fs from 'fs';
import clipboard from 'clipboardy';

const KEY_ID = process.env.KEY_ID || 'F24AAF7D-8CE8-4425-99A2-1C89CD24D954';
const OUTPUT_FILE = process.env.OUTPUT_FILE || 'token.txt';

async function loginWithAPI() {
    try {
        console.log('🔑 Logging in via API...');
        
        const response = await fetch('https://tokencursor.io.vn/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            },
            body: JSON.stringify({
                key: KEY_ID
            })
        });
        
        if (!response.ok) {
            throw new Error(`Login failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Login successful');
        console.log('Response:', JSON.stringify(data, null, 2));
        
        return data;
        
    } catch (error) {
        console.error('❌ Login error:', error.message);
        return null;
    }
}

async function getUserInfo() {
    try {
        console.log('👤 Getting user info...');
        
        const response = await fetch('https://tokencursor.io.vn/api/me', {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Get user info failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ User info retrieved');
        console.log('Response:', JSON.stringify(data, null, 2));
        
        return data;
        
    } catch (error) {
        console.error('❌ Get user info error:', error.message);
        return null;
    }
}

async function getTokenFromAPI() {
    try {
        console.log('🎯 Getting token via API...');
        
        const response = await fetch('https://tokencursor.io.vn/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Get token failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Token retrieved');
        console.log('Response:', JSON.stringify(data, null, 2));
        
        return data;
        
    } catch (error) {
        console.error('❌ Get token error:', error.message);
        return null;
    }
}

async function main() {
    console.log('🚀 Testing API endpoints...');
    
    // Try login
    const loginResult = await loginWithAPI();
    if (!loginResult) {
        console.log('❌ Login failed, stopping...');
        return;
    }
    
    // Try get user info
    const userInfo = await getUserInfo();
    if (!userInfo) {
        console.log('❌ Get user info failed, stopping...');
        return;
    }
    
    // Try get token
    const tokenResult = await getTokenFromAPI();
    if (!tokenResult) {
        console.log('❌ Get token failed, stopping...');
        return;
    }
    
    // Extract token from response
    if (tokenResult.token) {
        const token = tokenResult.token;
        console.log('🎉 Token acquired via API!');
        console.log(`Token: ${token.substring(0, 50)}...`);
        
        // Save to file
        fs.writeFileSync(OUTPUT_FILE, token, 'utf8');
        console.log(`💾 Saved to ${OUTPUT_FILE}`);
        
        // Copy to clipboard
        try {
            await clipboard.write(token);
            console.log('📋 Copied to clipboard');
        } catch (err) {
            console.log('⚠️  Could not copy to clipboard');
        }
    } else {
        console.log('❌ No token found in API response');
    }
}

main();
