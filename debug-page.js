#!/usr/bin/env node
import 'dotenv/config';
import { chromium } from 'playwright';

const KEY_ID = process.env.KEY_ID || 'F24AAF7D-8CE8-4425-99A2-1C89CD24D954';

async function main() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log('Opening login page...');
        await page.goto('https://tokencursor.io.vn/app', { waitUntil: 'domcontentloaded' });

        // Fill the key and submit
        const inputSelectors = [
            'input[name="key"]',
            'input[type="text"]',
            'input[placeholder*="Key" i]',
            'input',
        ];
        
        let filled = false;
        for (const s of inputSelectors) {
            const el = await page.$(s);
            if (el) {
                await el.fill(KEY_ID);
                filled = true;
                break;
            }
        }
        
        if (!filled) throw new Error('Could not find key input field.');

        const submitSelectors = [
            'button[type="submit"]',
            'button:has-text("Đăng nhập")',
            'text=Đăng nhập',
            'button',
        ];
        
        let clicked = false;
        for (const s of submitSelectors) {
            const el = await page.$(s);
            if (el) {
                await Promise.all([
                    page.waitForLoadState('networkidle'),
                    el.click(),
                ]);
                clicked = true;
                break;
            }
        }
        
        if (!clicked) throw new Error('Could not find submit button.');

        // Wait for page to load
        await page.waitForTimeout(3000);

        console.log('\n=== PAGE CONTENT DEBUG ===');
        
        // Get all text content
        const bodyText = await page.evaluate(() => document.body.innerText || '');
        console.log('Body text length:', bodyText.length);
        console.log('First 500 chars:', bodyText.substring(0, 500));
        
        // Look for all textareas
        const textareas = await page.$$('textarea');
        console.log('\nFound textareas:', textareas.length);
        for (let i = 0; i < textareas.length; i++) {
            const value = await textareas[i].evaluate(el => el.value || '');
            console.log(`Textarea ${i}:`, value.substring(0, 100));
        }
        
        // Look for all inputs
        const inputs = await page.$$('input');
        console.log('\nFound inputs:', inputs.length);
        for (let i = 0; i < inputs.length; i++) {
            const value = await inputs[i].evaluate(el => el.value || '');
            const type = await inputs[i].evaluate(el => el.type || '');
            console.log(`Input ${i} (${type}):`, value.substring(0, 100));
        }
        
        // Look for elements with "token" in class or id
        const tokenElements = await page.$$('[class*="token"], [id*="token"], [data-token]');
        console.log('\nFound token-related elements:', tokenElements.length);
        for (let i = 0; i < tokenElements.length; i++) {
            const text = await tokenElements[i].evaluate(el => el.textContent || '');
            console.log(`Token element ${i}:`, text.substring(0, 100));
        }
        
        // Look for JWT patterns
        const jwtPattern = /[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_]{10,}/g;
        const matches = bodyText.match(jwtPattern);
        console.log('\nJWT matches found:', matches ? matches.length : 0);
        if (matches) {
            matches.forEach((match, i) => {
                console.log(`JWT ${i}:`, match.substring(0, 50) + '...');
            });
        }
        
        console.log('\nPress Enter to close browser...');
        await new Promise(resolve => {
            process.stdin.once('data', () => resolve());
        });
        
    } catch (err) {
        console.error(`Error: ${err.message || String(err)}`);
    } finally {
        await page.close();
        await context.close();
        await browser.close();
    }
}

main();
