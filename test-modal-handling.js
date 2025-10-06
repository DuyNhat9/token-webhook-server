#!/usr/bin/env node
import 'dotenv/config';
import { chromium } from 'playwright';

const KEY_ID = process.env.KEY_ID || 'F24AAF7D-8CE8-4425-99A2-1C89CD24D954';

function logWithTime(message) {
    const now = new Date().toLocaleString('vi-VN');
    console.log(`[${now}] ${message}`);
}

async function testModalHandling() {
    const browser = await chromium.launch({ 
        headless: false, // Show browser for testing
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    });
    const page = await browser.newPage();

    try {
        logWithTime('🔑 Opening login page...');
        await page.goto('https://tokencursor.io.vn/app');
        
        // Fill key
        await page.fill('input[name="key"]', KEY_ID);
        logWithTime('✅ Key filled');
        
        // Submit
        await page.click('button[type="submit"]');
        logWithTime('✅ Form submitted');
        
        // Wait for redirect
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        // Take screenshot before modal handling
        await page.screenshot({ path: 'before-modal-handling.png' });
        logWithTime('📸 Screenshot taken: before-modal-handling.png');
        
        // Check and close notification modal if present
        try {
            logWithTime('🔍 Checking for notification modal...');
            
            // Wait a bit for modal to appear
            await page.waitForTimeout(2000);
            
            // Try to find and close the modal
            const modalCloseButton = await page.$('button[aria-label="Close"], .modal button:has-text("X"), .modal .close, [data-testid="close-modal"]');
            const modalUnderstandButton = await page.$('button:has-text("Đã hiểu"), button:has-text("Understood")');
            
            if (modalCloseButton) {
                logWithTime('✅ Found modal close button, clicking...');
                await modalCloseButton.click();
                await page.waitForTimeout(1000);
            } else if (modalUnderstandButton) {
                logWithTime('✅ Found modal "Đã hiểu" button, clicking...');
                await modalUnderstandButton.click();
                await page.waitForTimeout(1000);
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
                            await page.waitForTimeout(1000);
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
        
        // Take screenshot after modal handling
        await page.screenshot({ path: 'after-modal-handling.png' });
        logWithTime('📸 Screenshot taken: after-modal-handling.png');
        
        // Get page content to check status
        const bodyText = await page.evaluate(() => document.body.innerText || '');
        
        // Check if we can see the "Lấy Token" button
        const hasTokenButton = bodyText.includes('Lấy Token');
        logWithTime(`🎯 "Lấy Token" button visible: ${hasTokenButton ? '✅' : '❌'}`);
        
        // Check for cooldown
        const cooldownMatch = bodyText.match(/Chờ[:\s]*([^\n]+)/);
        if (cooldownMatch) {
            logWithTime(`⏰ Cooldown detected: ${cooldownMatch[1]}`);
        }
        
        // Try to click "Lấy Token" button if available
        if (hasTokenButton) {
            try {
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
                
                if (tokenButtonClicked) {
                    await page.waitForTimeout(3000);
                    await page.screenshot({ path: 'after-token-click.png' });
                    logWithTime('📸 Screenshot taken: after-token-click.png');
                    
                    // Check for token
                    const newBodyText = await page.evaluate(() => document.body.innerText || '');
                    const jwtMatch = newBodyText.match(/eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/);
                    
                    if (jwtMatch) {
                        logWithTime('🎉 Token found!');
                        logWithTime(`🎫 Token: ${jwtMatch[0].substring(0, 50)}...`);
                    } else {
                        logWithTime('❌ No token found after clicking button');
                    }
                }
            } catch (error) {
                logWithTime(`❌ Error clicking token button: ${error.message}`);
            }
        }
        
        logWithTime('✅ Test completed successfully');
        
    } catch (error) {
        logWithTime(`❌ Error: ${error.message}`);
    } finally {
        await browser.close();
    }
}

testModalHandling();
