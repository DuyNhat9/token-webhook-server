#!/usr/bin/env node
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const TOKEN_FILE = process.env.OUTPUT_FILE || 'token.txt';

function logWithTime(message) {
    const now = new Date().toLocaleString('vi-VN');
    console.log(`[${now}] ${message}`);
}

function displayToken(token) {
    if (!token) {
        console.log('❌ No token available');
        return;
    }
    
    // Decode JWT payload (without verification)
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            console.log('❌ Invalid token format');
            return;
        }
        
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        
        console.log('🎫 Current Token:');
        console.log(`   Token: ${token.substring(0, 50)}...`);
        console.log(`   Subject: ${payload.sub || 'N/A'}`);
        console.log(`   Issuer: ${payload.iss || 'N/A'}`);
        console.log(`   Expires: ${payload.exp ? new Date(payload.exp * 1000).toLocaleString('vi-VN') : 'N/A'}`);
        console.log(`   Type: ${payload.type || 'N/A'}`);
        console.log(`   Scope: ${payload.scope || 'N/A'}`);
        
        // Check if token is expired
        if (payload.exp) {
            const now = Math.floor(Date.now() / 1000);
            const timeLeft = payload.exp - now;
            if (timeLeft > 0) {
                const hours = Math.floor(timeLeft / 3600);
                const minutes = Math.floor((timeLeft % 3600) / 60);
                console.log(`   ⏰ Time left: ${hours}h ${minutes}m`);
            } else {
                console.log('   ⚠️  Token expired');
            }
        }
        
    } catch (error) {
        console.log('❌ Error decoding token:', error.message);
        console.log(`   Raw token: ${token.substring(0, 100)}...`);
    }
}

function main() {
    const tokenPath = path.resolve(process.cwd(), TOKEN_FILE);
    
    if (!fs.existsSync(tokenPath)) {
        logWithTime('❌ Token file not found');
        console.log(`   Expected: ${tokenPath}`);
        console.log('   Run "npm run get-token" to get a token first');
        return;
    }
    
    const token = fs.readFileSync(tokenPath, 'utf8').trim();
    
    if (!token) {
        logWithTime('❌ Token file is empty');
        return;
    }
    
    logWithTime('📄 Reading current token...');
    displayToken(token);
}

main();
