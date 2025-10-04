#!/usr/bin/env node
import 'dotenv/config';
import { chromium } from 'playwright';

const KEY_ID = process.env.KEY_ID || 'F24AAF7D-8CE8-4425-99A2-1C89CD24D954';

async function quickModalTest() {
    console.log('🚀 Quick Modal Test - Testing modal handling...');
    
    const browser = await chromium.launch({ 
        headless: true,
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    });
    const page = await browser.newPage();

    try {
        console.log('🔑 Opening website...');
        await page.goto('https://tokencursor.io.vn/app');
        
        // Fill key and submit
        await page.fill('input[name="key"]', KEY_ID);
        await page.click('button[type="submit"]');
        console.log('✅ Form submitted');
        
        // Wait for redirect
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        // Check for modal and try to close it
        console.log('🔍 Checking for modal...');
        
        const modalStrategies = [
            // Strategy 1: Look for "Đã hiểu" button
            async () => {
                const button = await page.$('button:has-text("Đã hiểu")');
                if (button) {
                    await button.click();
                    return 'Đã hiểu button';
                }
                return null;
            },
            // Strategy 2: Look for close button with X
            async () => {
                const button = await page.$('button:has-text("X"), .modal .close');
                if (button) {
                    await button.click();
                    return 'X close button';
                }
                return null;
            },
            // Strategy 3: Look for any modal button
            async () => {
                const buttons = await page.$$('.modal button, [role="dialog"] button');
                if (buttons.length > 0) {
                    await buttons[0].click();
                    return 'First modal button';
                }
                return null;
            }
        ];
        
        let modalClosed = false;
        for (let i = 0; i < modalStrategies.length && !modalClosed; i++) {
            try {
                const result = await modalStrategies[i]();
                if (result) {
                    console.log(`✅ Modal closed using: ${result}`);
                    modalClosed = true;
                    await page.waitForTimeout(1000);
                }
            } catch (error) {
                console.log(`⚠️ Strategy ${i + 1} failed: ${error.message}`);
            }
        }
        
        if (!modalClosed) {
            console.log('⚠️ No modal found or could not close modal');
        }
        
        // Check if "Lấy Token" button is now visible
        const bodyText = await page.evaluate(() => document.body.innerText || '');
        const hasTokenButton = bodyText.includes('Lấy Token');
        
        console.log(`🎯 "Lấy Token" button visible: ${hasTokenButton ? '✅' : '❌'}`);
        
        if (hasTokenButton) {
            console.log('🎉 SUCCESS: Modal handling works! Token button is accessible.');
        } else {
            console.log('❌ FAILED: Token button still not accessible after modal handling.');
        }
        
        // Check for cooldown
        const cooldownMatch = bodyText.match(/Chờ[:\s]*([^\n]+)/);
        if (cooldownMatch) {
            console.log(`⏰ Cooldown: ${cooldownMatch[1]}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await browser.close();
    }
}

quickModalTest();
