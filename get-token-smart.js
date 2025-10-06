#!/usr/bin/env node
import 'dotenv/config';
import { chromium } from 'playwright';
import fs from 'fs';
import clipboard from 'clipboardy';

const KEY_ID = process.env.KEY_ID || 'KEY-8GFN9U3L0U';
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
        
        // Check and close notification modal if present (BEFORE filling form)
        try {
            console.log('🔍 Checking for initial notification modal...');
            
            // Wait a bit for modal to appear
            await page.waitForTimeout(2000);
            
            // Try to find and close the modal using multiple strategies
            const modalStrategies = [
                // Strategy 1: Look for "Đã hiểu" button (most likely)
                async () => {
                    const buttons = await page.$$('button');
                    for (const btn of buttons) {
                        const text = await page.evaluate(el => el.textContent, btn);
                        if (text && (text.includes('Đã hiểu') || text.includes('Understood'))) {
                            await btn.click();
                            console.log('✅ Clicked "Đã hiểu" button');
                            return true;
                        }
                    }
                    return false;
                },
                // Strategy 2: Look for close button with X
                async () => {
                    const buttons = await page.$$('button');
                    for (const btn of buttons) {
                        const text = await page.evaluate(el => el.textContent, btn);
                        if (text && (text.includes('X') || text.includes('×') || text.includes('✕'))) {
                            await btn.click();
                            console.log('✅ Clicked X button');
                            return true;
                        }
                    }
                    return false;
                },
                // Strategy 3: Try alternative selectors
                async () => {
                    const selectors = [
                        '.modal button[type="button"]',
                        '.notification-modal button',
                        '[role="dialog"] button',
                        '.popup button'
                    ];
                    
                    for (const selector of selectors) {
                        try {
                            const button = await page.$(selector);
                            if (button) {
                                await button.click();
                                console.log(`✅ Clicked modal button with selector: ${selector}`);
                                return true;
                            }
                        } catch (e) {
                            // Continue to next selector
                        }
                    }
                    return false;
                }
            ];
            
            let modalClosed = false;
            for (const strategy of modalStrategies) {
                try {
                    if (await strategy()) {
                        modalClosed = true;
                        break;
                    }
                } catch (e) {
                    console.log(`⚠️ Modal strategy failed: ${e.message}`);
                }
            }
            
            if (modalClosed) {
                console.log('✅ Modal closed successfully');
                // Wait a bit for modal to disappear
                await page.waitForTimeout(1000);
            } else {
                console.log('⚠️ Could not find or close modal, continuing...');
            }
        } catch (e) {
            console.log(`⚠️ Error handling modal: ${e.message}`);
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
