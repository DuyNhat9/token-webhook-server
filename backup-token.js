import 'dotenv/config';
import fs from 'fs';

// Script để backup token từ Railway server
const RAILWAY_URL = "https://token-webhook-server-production.up.railway.app";

async function backupToken() {
    try {
        console.log('🔄 Fetching token from Railway server...');
        
        const response = await fetch(`${RAILWAY_URL}/token`);
        const data = await response.json();
        
        if (data.token) {
            const tokenInfo = {
                token: data.token,
                info: data.info,
                lastUpdate: data.lastUpdate,
                backupTime: new Date().toISOString()
            };
            
            // Append to backup file
            const backupEntry = `\n=== TOKEN BACKUP ${new Date().toLocaleString('vi-VN')} ===\n` +
                              `Token: ${data.token}\n` +
                              `Subject: ${data.info?.subject || 'N/A'}\n` +
                              `Expires: ${data.info?.expires || 'N/A'}\n` +
                              `Time Left: ${data.info?.timeLeft || 'N/A'} minutes\n` +
                              `Last Update: ${data.lastUpdate || 'N/A'}\n` +
                              `Backup Time: ${new Date().toLocaleString('vi-VN')}\n`;
            
            fs.appendFileSync('tokens-backup.txt', backupEntry);
            
            console.log('✅ Token backed up successfully!');
            console.log('📄 Token Info:', data.info);
            console.log('💾 Saved to: tokens-backup.txt');
            
        } else {
            console.log('❌ No token available on server');
            console.log('Response:', data);
        }
        
    } catch (error) {
        console.log('❌ Error backing up token:', error.message);
    }
}

backupToken();
