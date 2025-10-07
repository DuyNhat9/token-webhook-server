#!/usr/bin/env node
import 'dotenv/config';
import { chromium } from 'playwright';

const KEY_ID = process.env.KEY_ID || 'F24AAF7D-8CE8-4425-99A2-1C89CD24D954';

async function main() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Monitor network requests
    const requests = [];
    const responses = [];

    page.on('request', request => {
        requests.push({
            url: request.url(),
            method: request.method(),
            headers: request.headers(),
            postData: request.postData()
        });
        console.log(`📤 REQUEST: ${request.method()} ${request.url()}`);
    });

    page.on('response', response => {
        responses.push({
            url: response.url(),
            status: response.status(),
            headers: response.headers()
        });
        console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
    });

    try {
        console.log('🔍 Monitoring network requests...');
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
        
        // Click "Lấy Token" button
        const buttons = await page.$$('button');
        for (const btn of buttons) {
            const text = await btn.textContent();
            if (text && text.trim() === 'Lấy Token') {
                console.log('🎯 Clicking "Lấy Token" button...');
                await btn.click();
                break;
            }
        }
        
        // Wait for token to appear
        await page.waitForTimeout(3000);
        
        console.log('\n📊 Network Analysis:');
        console.log(`Total requests: ${requests.length}`);
        console.log(`Total responses: ${responses.length}`);
        
        // Look for API calls
        const apiCalls = requests.filter(req => 
            req.url.includes('/api/') || 
            req.url.includes('token') || 
            req.url.includes('auth') ||
            req.method !== 'GET'
        );
        
        console.log('\n🔍 API Calls found:');
        apiCalls.forEach((call, i) => {
            console.log(`${i + 1}. ${call.method} ${call.url}`);
            if (call.postData) {
                console.log(`   Data: ${call.postData.substring(0, 200)}...`);
            }
        });
        
        // Look for token in responses
        console.log('\n🔍 Checking responses for token data...');
        for (const resp of responses) {
            if (resp.url.includes('/api/') || resp.url.includes('token')) {
                console.log(`Response from ${resp.url}:`);
                console.log(`Status: ${resp.status}`);
                console.log(`Headers:`, resp.headers);
            }
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
