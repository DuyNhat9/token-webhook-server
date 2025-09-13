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
        
        // Find and click "Lấy Token" button
        const buttons = await page.$$('button');
        console.log(`Found ${buttons.length} buttons`);
        
        let tokenButtonClicked = false;
        for (let i = 0; i < buttons.length; i++) {
            const text = await buttons[i].textContent();
            console.log(`Button ${i}: "${text}"`);
            
            // Check if button is "Lấy Token" or shows cooldown
            if (text && (text.trim() === 'Lấy Token' || text.includes('Chờ') || text.includes('Token'))) {
                if (text.includes('Chờ')) {
                    console.log('⏰ Token is on cooldown:', text);
                    throw new Error(`Token cooldown active: ${text}`);
                } else {
                    console.log('🎯 Clicking "Lấy Token" button...');
                    await buttons[i].click();
                    tokenButtonClicked = true;
                    break;
                }
            }
        }
        
        if (!tokenButtonClicked) {
            throw new Error('Could not find "Lấy Token" button');
        }
        
        // Wait for token to appear
        await page.waitForTimeout(3000);
        
        // Extract token from page text
        const bodyText = await page.evaluate(() => document.body.innerText || '');
        const jwtMatch = bodyText.match(/eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/);
        
        if (!jwtMatch) {
            throw new Error('Token not found on page');
        }
        
        const token = jwtMatch[0];
        console.log('🎉 Token acquired!');
        console.log(token);
        
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
