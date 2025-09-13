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
        
        console.log('Initial URL:', page.url());

        // Fill the key
        const input = await page.$('input[name="key"]');
        if (!input) {
            console.log('Input not found, trying other selectors...');
            const input2 = await page.$('input[id="key"]');
            if (!input2) {
                console.log('No input found');
                return;
            }
            await input2.fill(KEY_ID);
        } else {
            await input.fill(KEY_ID);
        }

        // Submit
        const submitBtn = await page.$('button[type="submit"]');
        if (!submitBtn) {
            console.log('Submit button not found');
            return;
        }
        
        console.log('Clicking submit...');
        await submitBtn.click();

        // Wait for navigation
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        console.log('After login URL:', page.url());
        console.log('Page title:', await page.title());
        
        // Check if we're on the right page
        const bodyText = await page.evaluate(() => document.body.innerText || '');
        console.log('Body text length:', bodyText.length);
        console.log('First 200 chars:', bodyText.substring(0, 200));
        
        // Look for token-related elements
        const tokenElements = await page.$$('textarea, input, pre, code, [class*="token"], [id*="token"]');
        console.log('Found potential token elements:', tokenElements.length);
        
        for (let i = 0; i < tokenElements.length; i++) {
            const tagName = await tokenElements[i].evaluate(el => el.tagName);
            const value = await tokenElements[i].evaluate(el => el.value || '');
            const text = await tokenElements[i].evaluate(el => el.textContent || '');
            const className = await tokenElements[i].evaluate(el => el.className || '');
            const id = await tokenElements[i].evaluate(el => el.id || '');
            
            console.log(`Element ${i}: ${tagName}, class="${className}", id="${id}"`);
            console.log(`  Value: ${value.substring(0, 100)}`);
            console.log(`  Text: ${text.substring(0, 100)}`);
        }
        
        // Look for JWT patterns
        const jwtPattern = /[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_]{10,}/g;
        const matches = bodyText.match(jwtPattern);
        console.log('JWT matches found:', matches ? matches.length : 0);
        if (matches) {
            matches.forEach((match, i) => {
                console.log(`JWT ${i}: ${match.substring(0, 50)}...`);
            });
        }
        
        console.log('\nPress Enter to close...');
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
