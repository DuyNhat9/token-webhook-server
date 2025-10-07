#!/usr/bin/env node
import 'dotenv/config';
import { chromium } from 'playwright';

const KEY_ID = process.env.KEY_ID || 'F24AAF7D-8CE8-4425-99A2-1C89CD24D954';

async function main() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        console.log('🔑 Checking token status...');
        await page.goto('https://tokencursor.io.vn/app');
        
        // Fill key
        await page.fill('input[name="key"]', KEY_ID);
        
        // Submit
        await page.click('button[type="submit"]');
        
        // Wait for redirect
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Get page content
        const bodyText = await page.evaluate(() => document.body.innerText || '');
        
        // Extract key information
        const keyIdMatch = bodyText.match(/Key ID[:\s]*([A-F0-9-]+)/);
        const statusMatch = bodyText.match(/Trạng thái[:\s]*([^\\n]+)/);
        const tokensReceivedMatch = bodyText.match(/Số token đã nhận[:\s]*(\d+)/);
        const lastTokenMatch = bodyText.match(/Lần lấy token cuối[:\s]*([^\\n]+)/);
        const cooldownMatch = bodyText.match(/Chờ[:\s]*([^\\n]+)/);
        
        console.log('📊 Token Status:');
        if (keyIdMatch) console.log(`   Key ID: ${keyIdMatch[1]}`);
        if (statusMatch) console.log(`   Status: ${statusMatch[1]}`);
        if (tokensReceivedMatch) console.log(`   Tokens received: ${tokensReceivedMatch[1]}`);
        if (lastTokenMatch) console.log(`   Last token: ${lastTokenMatch[1]}`);
        if (cooldownMatch) {
            console.log(`   ⏰ Cooldown: ${cooldownMatch[1]}`);
        } else {
            console.log('   ✅ Token available for retrieval');
        }
        
        // Check buttons
        const buttons = await page.$$('button');
        console.log(`\\n🔘 Buttons found: ${buttons.length}`);
        for (let i = 0; i < buttons.length; i++) {
            const text = await buttons[i].textContent();
            console.log(`   Button ${i}: "${text}"`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await browser.close();
    }
}

main();
