#!/usr/bin/env node
import 'dotenv/config';
import { chromium } from 'playwright';
import fs from 'fs';
import clipboard from 'clipboardy';

const KEY_ID = process.env.KEY_ID || 'F24AAF7D-8CE8-4425-99A2-1C89CD24D954';
const OUTPUT_FILE = process.env.OUTPUT_FILE || 'token.txt';
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL) || 60000; // 1 minute default

function logWithTime(message) {
    const now = new Date().toLocaleString('vi-VN');
    console.log(`[${now}] ${message}`);
}

async function getToken() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        logWithTime('🔑 Opening login page...');
        await page.goto('https://tokencursor.io.vn/app');
        
        // Fill key
        await page.fill('input[name="key"]', KEY_ID);
        
        // Submit
        await page.click('button[type="submit"]');
        
        // Wait for redirect
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Check and close notification modal if present
        try {
            logWithTime('🔍 Checking for notification modal...');
            
            // Wait a bit for modal to appear
            await page.waitForTimeout(1000);
            
            // Try to find and close the modal
            const modalCloseButton = await page.$('button[aria-label="Close"], .modal button:has-text("X"), .modal .close, [data-testid="close-modal"]');
            const modalUnderstandButton = await page.$('button:has-text("Đã hiểu"), button:has-text("Understood")');
            
            if (modalCloseButton) {
                logWithTime('✅ Found modal close button, clicking...');
                await modalCloseButton.click();
                await page.waitForTimeout(500);
            } else if (modalUnderstandButton) {
                logWithTime('✅ Found modal "Đã hiểu" button, clicking...');
                await modalUnderstandButton.click();
                await page.waitForTimeout(500);
            } else {
                // Try alternative selectors for modal
                const modalSelectors = [
                    '.modal button[type="button"]',
                    '.notification-modal button',
                    '[role="dialog"] button',
                    '.popup button',
                    'button:has-text("×")',
                    'button:has-text("✕")'
                ];
                
                for (const selector of modalSelectors) {
                    try {
                        const button = await page.$(selector);
                        if (button) {
                            logWithTime(`✅ Found modal button with selector: ${selector}`);
                            await button.click();
                            await page.waitForTimeout(500);
                            break;
                        }
                    } catch (e) {
                        // Continue to next selector
                    }
                }
            }
            
            logWithTime('✅ Modal handling completed');
        } catch (error) {
            logWithTime('⚠️ No modal found or error handling modal:', error.message);
        }
        
        // Get page content to check status
        const bodyText = await page.evaluate(() => document.body.innerText || '');
        
        // Check for cooldown
        const cooldownMatch = bodyText.match(/Chờ[:\s]*([^\\n]+)/);
        if (cooldownMatch) {
            logWithTime(`⏰ Token on cooldown: ${cooldownMatch[1]}`);
            return { success: false, cooldown: cooldownMatch[1] };
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
            }
        } catch (err) {
            logWithTime('⚠️  Could not decode token info');
        }
        
        logWithTime(`🎫 Token: ${token.substring(0, 50)}...`);
        
        // Save to file
        fs.writeFileSync(OUTPUT_FILE, token, 'utf8');
        logWithTime(`💾 Saved to ${OUTPUT_FILE}`);
        
        // Copy to clipboard
        try {
            await clipboard.write(token);
            logWithTime('📋 Copied to clipboard');
        } catch (err) {
            logWithTime('⚠️  Could not copy to clipboard');
        }
        
        return { success: true, token: token };
        
    } catch (error) {
        logWithTime(`❌ Error: ${error.message}`);
        return { success: false, error: error.message };
    } finally {
        await browser.close();
    }
}

async function main() {
    logWithTime('🚀 Starting automatic token monitor...');
    logWithTime(`⏱️  Check interval: ${CHECK_INTERVAL / 1000} seconds`);
    
    let consecutiveErrors = 0;
    const maxErrors = 5;
    
    while (true) {
        try {
            const result = await getToken();
            
            if (result.success) {
                consecutiveErrors = 0;
                logWithTime('✅ Token retrieved successfully');
                
                // Wait longer after successful retrieval
                logWithTime(`⏳ Waiting ${CHECK_INTERVAL * 2 / 1000} seconds before next check...`);
                await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL * 2));
            } else if (result.cooldown) {
                consecutiveErrors = 0;
                logWithTime(`⏰ Cooldown active: ${result.cooldown}`);
                
                // Wait shorter during cooldown
                logWithTime(`⏳ Waiting ${CHECK_INTERVAL / 2 / 1000} seconds before next check...`);
                await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL / 2));
            } else {
                consecutiveErrors++;
                logWithTime(`❌ Failed to get token (${consecutiveErrors}/${maxErrors})`);
                
                if (consecutiveErrors >= maxErrors) {
                    logWithTime('🛑 Too many consecutive errors, stopping...');
                    break;
                }
                
                // Wait longer on error
                logWithTime(`⏳ Waiting ${CHECK_INTERVAL} seconds before retry...`);
                await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
            }
            
        } catch (error) {
            consecutiveErrors++;
            logWithTime(`💥 Unexpected error: ${error.message}`);
            
            if (consecutiveErrors >= maxErrors) {
                logWithTime('🛑 Too many consecutive errors, stopping...');
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
    process.exit(0);
});

process.on('SIGTERM', () => {
    logWithTime('🛑 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

main();
