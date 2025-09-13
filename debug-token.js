#!/usr/bin/env node
import 'dotenv/config';
import { chromium } from 'playwright';

const KEY_ID = process.env.KEY_ID || 'F24AAF7D-8CE8-4425-99A2-1C89CD24D954';

async function main() {
    const browser = await chromium.launch({ headless: false });
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
        
        console.log('📍 Current URL:', page.url());
        
        // Look for all buttons and their text
        const buttons = await page.$$('button');
        console.log(`Found ${buttons.length} buttons:`);
        
        for (let i = 0; i < buttons.length; i++) {
            const text = await buttons[i].textContent();
            console.log(`Button ${i}: "${text}"`);
        }
        
        // Try to find and click "Lấy Token" button
        let tokenButton = null;
        for (const btn of buttons) {
            const text = await btn.textContent();
            if (text && text.trim() === 'Lấy Token') {
                tokenButton = btn;
                break;
            }
        }
        
        if (tokenButton) {
            console.log('🎯 Found "Lấy Token" button, clicking...');
            await tokenButton.click();
            await page.waitForTimeout(3000);
            
            // Now look for token
            console.log('🔍 Looking for token after clicking...');
            
            // Check for textarea
            const textareas = await page.$$('textarea');
            console.log(`Found ${textareas.length} textareas after click`);
            
            for (let i = 0; i < textareas.length; i++) {
                const value = await textareas[i].inputValue();
                console.log(`Textarea ${i} value: ${value.substring(0, 100)}...`);
                if (value && value.startsWith('eyJ')) {
                    console.log('🎉 FOUND TOKEN!');
                    console.log(value);
                    return;
                }
            }
            
            // Check page content for JWT
            const pageText = await page.textContent('body');
            const jwtMatch = pageText.match(/eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/);
            if (jwtMatch) {
                console.log('🎉 FOUND JWT in page text!');
                console.log(jwtMatch[0]);
                return;
            }
            
            console.log('❌ No token found after clicking');
            console.log('Page content preview:', pageText.substring(0, 500));
        } else {
            console.log('❌ "Lấy Token" button not found');
        }
        
        console.log('\nPress Enter to close...');
        await new Promise(resolve => {
            process.stdin.once('data', () => resolve());
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await browser.close();
    }
}

main();
