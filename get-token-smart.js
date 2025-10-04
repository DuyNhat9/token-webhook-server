#!/usr/bin/env node
import 'dotenv/config';
import { chromium } from 'playwright';
import fs from 'fs';
import clipboard from 'clipboardy';

const KEY_ID = process.env.KEY_ID || 'F24AAF7D-8CE8-4425-99A2-1C89CD24D954';
const OUTPUT_FILE = process.env.OUTPUT_FILE || 'token.txt';

async function main() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        console.log('🔑 Opening login page...');
        await page.goto('https://tokencursor.io.vn/app');
        
        // Fill key
        await page.fill('input[name="key"]', KEY_ID);
        console.log('✅ Key filled');
        
        // Submit
        await page.click('button[type="submit"]');
        console.log('✅ Form submitted');
        
        // Wait for redirect
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Check and close notification modal if present
        try {
            console.log('🔍 Checking for notification modal...');
            
            // Wait a bit for modal to appear
            await page.waitForTimeout(1000);
            
            // Try to find and close the modal
            const modalCloseButton = await page.$('button[aria-label="Close"], .modal button:has-text("X"), .modal .close, [data-testid="close-modal"]');
            const modalUnderstandButton = await page.$('button:has-text("Đã hiểu"), button:has-text("Understood")');
            
            if (modalCloseButton) {
                console.log('✅ Found modal close button, clicking...');
                await modalCloseButton.click();
                await page.waitForTimeout(500);
            } else if (modalUnderstandButton) {
                console.log('✅ Found modal "Đã hiểu" button, clicking...');
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
                            console.log(`✅ Found modal button with selector: ${selector}`);
                            await button.click();
                            await page.waitForTimeout(500);
                            break;
                        }
                    } catch (e) {
                        // Continue to next selector
                    }
                }
            }
            
            console.log('✅ Modal handling completed');
        } catch (error) {
            console.log('⚠️ No modal found or error handling modal:', error.message);
        }
        
        // Get page content to check status
        const bodyText = await page.evaluate(() => document.body.innerText || '');
        
        // Extract key information
        const keyIdMatch = bodyText.match(/Key ID[:\s]*([A-F0-9-]+)/);
        const statusMatch = bodyText.match(/Trạng thái[:\s]*([^\\n]+)/);
        const tokensReceivedMatch = bodyText.match(/Số token đã nhận[:\s]*(\d+)/);
        const lastTokenMatch = bodyText.match(/Lần lấy token cuối[:\s]*([^\\n]+)/);
        const cooldownMatch = bodyText.match(/Chờ[:\s]*([^\\n]+)/);
        
        console.log('📊 Account Status:');
        if (keyIdMatch) console.log(`   Key ID: ${keyIdMatch[1]}`);
        if (statusMatch) console.log(`   Status: ${statusMatch[1]}`);
        if (tokensReceivedMatch) console.log(`   Tokens received: ${tokensReceivedMatch[1]}`);
        if (lastTokenMatch) console.log(`   Last token: ${lastTokenMatch[1]}`);
        
        // Check for cooldown
        if (cooldownMatch) {
            console.log(`   ⏰ Cooldown: ${cooldownMatch[1]}`);
            console.log('❌ Token is on cooldown. Please wait before trying again.');
            process.exit(1);
        }
        
        // Find and click "Lấy Token" button
        const buttons = await page.$$('button');
        let tokenButtonClicked = false;
        
        for (let i = 0; i < buttons.length; i++) {
            const text = await buttons[i].textContent();
            if (text && text.trim() === 'Lấy Token') {
                console.log('🎯 Clicking "Lấy Token" button...');
                await buttons[i].click();
                tokenButtonClicked = true;
                break;
            }
        }
        
        if (!tokenButtonClicked) {
            console.log('❌ "Lấy Token" button not available');
            process.exit(1);
        }
        
        // Wait for token to appear
        await page.waitForTimeout(3000);
        
        // Extract token from page text
        const newBodyText = await page.evaluate(() => document.body.innerText || '');
        const jwtMatch = newBodyText.match(/eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/);
        
        if (!jwtMatch) {
            throw new Error('Token not found on page');
        }
        
        const token = jwtMatch[0];
        console.log('🎉 Token acquired successfully!');
        
        // Display token info
        try {
            const parts = token.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                console.log('📄 Token Info:');
                console.log(`   Subject: ${payload.sub || 'N/A'}`);
                console.log(`   Expires: ${payload.exp ? new Date(payload.exp * 1000).toLocaleString('vi-VN') : 'N/A'}`);
                console.log(`   Type: ${payload.type || 'N/A'}`);
                console.log(`   Issuer: ${payload.iss || 'N/A'}`);
                
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
            }
        } catch (err) {
            console.log('⚠️  Could not decode token info');
        }
        
        console.log(`🎫 Token: ${token.substring(0, 50)}...`);
        
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
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

main();
