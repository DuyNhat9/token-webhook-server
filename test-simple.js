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
        console.log('📄 Page title:', await page.title());
        
        // Look for token in different ways
        console.log('\n🔍 Searching for token...');
        
        // Method 1: Look for textarea with token
        const textareas = await page.$$('textarea');
        console.log(`Found ${textareas.length} textareas`);
        
        for (let i = 0; i < textareas.length; i++) {
            const value = await textareas[i].inputValue();
            if (value && value.length > 50) {
                console.log(`✅ Token found in textarea ${i}:`);
                console.log(value.substring(0, 100) + '...');
                return;
            }
        }
        
        // Method 2: Look for any element with JWT-like content
        const allElements = await page.$$('*');
        console.log(`Checking ${allElements.length} elements for JWT...`);
        
        for (let i = 0; i < Math.min(allElements.length, 100); i++) {
            const text = await allElements[i].textContent();
            if (text && text.includes('eyJ')) {
                console.log(`✅ JWT found in element ${i}:`);
                console.log(text.substring(0, 100) + '...');
                return;
            }
        }
        
        // Method 3: Get all page text and search
        const pageText = await page.textContent('body');
        const jwtMatch = pageText.match(/eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/);
        if (jwtMatch) {
            console.log('✅ JWT found in page text:');
            console.log(jwtMatch[0].substring(0, 100) + '...');
            return;
        }
        
        console.log('❌ No token found');
        console.log('Page content preview:', pageText.substring(0, 500));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await browser.close();
    }
}

main();
