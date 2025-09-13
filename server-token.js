#!/usr/bin/env node
import 'dotenv/config';
import { chromium } from 'playwright';
import fs from 'fs';
import clipboard from 'clipboardy';

const KEY_ID = process.env.KEY_ID || 'F24AAF7D-8CE8-4425-99A2-1C89CD24D954';
const OUTPUT_FILE = process.env.OUTPUT_FILE || 'token.txt';
const WEBHOOK_URL = process.env.WEBHOOK_URL; // Discord/Slack notification
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL) || 1800000; // 30 minutes

function logWithTime(message) {
    const now = new Date().toLocaleString('vi-VN');
    const logMessage = `[${now}] ${message}`;
    console.log(logMessage);
    return logMessage;
}

async function notify(message) {
    if (WEBHOOK_URL) {
        try {
            await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text: message,
                    username: 'Token Monitor',
                    icon_emoji: ':robot_face:'
                })
            });
            logWithTime('📢 Notification sent');
        } catch (error) {
            logWithTime(`⚠️  Failed to send notification: ${error.message}`);
        }
    }
}

async function getToken() {
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // For server environments
    });
    const page = await browser.newPage();

    try {
        logWithTime('🔑 Opening login page...');
        await page.goto('https://tokencursor.io.vn/app', { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
        });
        
        // Fill key
        await page.fill('input[name="key"]', KEY_ID);
        
        // Submit
        await page.click('button[type="submit"]');
        
        // Wait for redirect
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Get page content to check status
        const bodyText = await page.evaluate(() => document.body.innerText || '');
        
        // Check for cooldown
        const cooldownMatch = bodyText.match(/Chờ[:\s]*([^\\n]+)/);
        if (cooldownMatch) {
            const cooldown = cooldownMatch[1];
            logWithTime(`⏰ Token on cooldown: ${cooldown}`);
            await notify(`⏰ Token cooldown: ${cooldown}`);
            return { success: false, cooldown: cooldown };
        }
        
        // Find and click "Lấy Token" button
        const buttons = await page.$$('button');
        let tokenButtonClicked = false;
        
        for (const btn of buttons) {
            const text = await btn.textContent();
            if (text && text.trim() === 'Lấy Token') {
                logWithTime('🎯 Clicking "Lấy Token" button...');
                await btn.click();
                tokenButtonClicked = true;
                break;
            }
        }
        
        if (!tokenButtonClicked) {
            logWithTime('❌ "Lấy Token" button not available');
            return { success: false, error: 'Button not available' };
        }
        
        // Wait for token to appear
        await page.waitForTimeout(3000);
        
        // Extract token from page text
        const newBodyText = await page.evaluate(() => document.body.innerText || '');
        const jwtMatch = newBodyText.match(/eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/);
        
        if (!jwtMatch) {
            logWithTime('❌ Token not found on page');
            return { success: false, error: 'Token not found' };
        }
        
        const token = jwtMatch[0];
        logWithTime('🎉 Token acquired successfully!');
        
        // Display token info
        try {
            const parts = token.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                logWithTime(`📄 Token Info:`);
                logWithTime(`   Subject: ${payload.sub || 'N/A'}`);
                logWithTime(`   Expires: ${payload.exp ? new Date(payload.exp * 1000).toLocaleString('vi-VN') : 'N/A'}`);
                logWithTime(`   Type: ${payload.type || 'N/A'}`);
                
                // Check if token is expired
                if (payload.exp) {
                    const now = Math.floor(Date.now() / 1000);
                    const timeLeft = payload.exp - now;
                    if (timeLeft > 0) {
                        const hours = Math.floor(timeLeft / 3600);
                        const minutes = Math.floor((timeLeft % 3600) / 60);
                        logWithTime(`   ⏰ Time left: ${hours}h ${minutes}m`);
                    } else {
                        logWithTime('   ⚠️  Token expired');
                    }
                }
            }
        } catch (err) {
            logWithTime('⚠️  Could not decode token info');
        }
        
        logWithTime(`🎫 Token: ${token.substring(0, 50)}...`);
        
        // Save to file
        fs.writeFileSync(OUTPUT_FILE, token, 'utf8');
        logWithTime(`💾 Saved to ${OUTPUT_FILE}`);
        
        // Copy to clipboard (if available)
        try {
            await clipboard.write(token);
            logWithTime('📋 Copied to clipboard');
        } catch (err) {
            logWithTime('⚠️  Could not copy to clipboard (server environment)');
        }
        
        // Send notification
        await notify(`🎉 Token retrieved successfully!\nExpires: ${payload.exp ? new Date(payload.exp * 1000).toLocaleString('vi-VN') : 'N/A'}`);
        
        return { success: true, token: token };
        
    } catch (error) {
        const errorMsg = `❌ Error: ${error.message}`;
        logWithTime(errorMsg);
        await notify(errorMsg);
        return { success: false, error: error.message };
    } finally {
        await browser.close();
    }
}

async function main() {
    logWithTime('🚀 Starting server token monitor...');
    logWithTime(`⏱️  Check interval: ${CHECK_INTERVAL / 1000 / 60} minutes`);
    
    let consecutiveErrors = 0;
    const maxErrors = 5;
    
    // Send startup notification
    await notify('🚀 Token monitor started on server');
    
    while (true) {
        try {
            const result = await getToken();
            
            if (result.success) {
                consecutiveErrors = 0;
                logWithTime('✅ Token retrieved successfully');
                
                // Wait longer after successful retrieval
                logWithTime(`⏳ Waiting ${CHECK_INTERVAL * 2 / 1000 / 60} minutes before next check...`);
                await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL * 2));
            } else if (result.cooldown) {
                consecutiveErrors = 0;
                logWithTime(`⏰ Cooldown active: ${result.cooldown}`);
                
                // Wait shorter during cooldown
                logWithTime(`⏳ Waiting ${CHECK_INTERVAL / 2 / 1000 / 60} minutes before next check...`);
                await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL / 2));
            } else {
                consecutiveErrors++;
                logWithTime(`❌ Failed to get token (${consecutiveErrors}/${maxErrors})`);
                
                if (consecutiveErrors >= maxErrors) {
                    logWithTime('🛑 Too many consecutive errors, stopping...');
                    await notify('🛑 Token monitor stopped due to too many errors');
                    break;
                }
                
                // Wait longer on error
                logWithTime(`⏳ Waiting ${CHECK_INTERVAL / 1000 / 60} minutes before retry...`);
                await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
            }
            
        } catch (error) {
            consecutiveErrors++;
            const errorMsg = `💥 Unexpected error: ${error.message}`;
            logWithTime(errorMsg);
            await notify(errorMsg);
            
            if (consecutiveErrors >= maxErrors) {
                logWithTime('🛑 Too many consecutive errors, stopping...');
                await notify('🛑 Token monitor stopped due to too many errors');
                break;
            }
            
            await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
        }
    }
    
    logWithTime('🏁 Monitor stopped');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    logWithTime('🛑 Received SIGINT, shutting down gracefully...');
    notify('🛑 Token monitor stopped by user');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logWithTime('🛑 Received SIGTERM, shutting down gracefully...');
    notify('🛑 Token monitor stopped by system');
    process.exit(0);
});

main();
