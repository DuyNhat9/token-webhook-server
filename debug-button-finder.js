#!/usr/bin/env node
import 'dotenv/config';
import puppeteer from 'puppeteer';

const KEY_ID = process.env.KEY_ID || 'F24AAF7D-8CE8-4425-99A2-1C89CD24D954';

async function debugButtonFinder() {
    const browser = await puppeteer.launch({ 
        headless: false, // Show browser for debugging
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    try {
        console.log('🔍 Starting button debugging...');
        
        // Navigate to website
        await page.goto('https://tokencursor.io.vn/app', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000);
        
        // Fill and submit form
        await page.type('input[name="key"]', KEY_ID, { delay: 50 });
        await page.click('button[type="submit"]');
        await page.waitForTimeout(5000);
        
        // Get full page content
        const fullPageContent = await page.evaluate(() => document.body.innerText || '');
        console.log('📄 Full page content:');
        console.log(fullPageContent);
        console.log('\n' + '='.repeat(80) + '\n');
        
        // Get all buttons and clickable elements
        const allButtons = await page.$$eval('*', elements => 
            elements
                .filter(el => {
                    const tagName = el.tagName.toLowerCase();
                    const text = (el.textContent || '').trim();
                    const hasOnclick = !!el.onclick;
                    const isClickable = tagName === 'button' || tagName === 'a' || tagName === 'div' || tagName === 'span';
                    
                    return isClickable && (text.length > 0 || hasOnclick);
                })
                .map(el => ({
                    tagName: el.tagName.toLowerCase(),
                    text: (el.textContent || '').trim(),
                    className: el.className || '',
                    id: el.id || '',
                    onclick: el.onclick ? 'has-onclick' : 'no-onclick',
                    type: el.type || '',
                    href: el.href || ''
                }))
        );
        
        console.log('🔍 All clickable elements:');
        allButtons.forEach((btn, index) => {
            console.log(`${index + 1}. [${btn.tagName}] "${btn.text}" (${btn.className}) (${btn.id}) (${btn.onclick})`);
        });
        
        // Look for token-related buttons
        console.log('\n🎯 Token-related buttons:');
        const tokenButtons = allButtons.filter(btn => 
            btn.text.toLowerCase().includes('token') ||
            btn.text.toLowerCase().includes('lấy') ||
            btn.text.toLowerCase().includes('get') ||
            btn.text.toLowerCase().includes('nhận') ||
            btn.text.toLowerCase().includes('tạo')
        );
        
        tokenButtons.forEach((btn, index) => {
            console.log(`${index + 1}. [${btn.tagName}] "${btn.text}" (${btn.className}) (${btn.id})`);
        });
        
        // Check for cooldown messages
        console.log('\n⏰ Checking for cooldown messages:');
        const cooldownPatterns = [
            /Chờ.*(\d+).*phút/,
            /Chờ.*(\d+).*giây/,
            /(\d+):(\d+).*nữa/,
            /cooldown/i,
            /wait/i,
            /Thời gian chờ/
        ];
        
        cooldownPatterns.forEach(pattern => {
            const match = fullPageContent.match(pattern);
            if (match) {
                console.log(`✅ Cooldown detected: ${match[0]}`);
            }
        });
        
        // Get page HTML for inspection
        const pageHTML = await page.content();
        console.log('\n📄 Page HTML (first 2000 chars):');
        console.log(pageHTML.substring(0, 2000));
        
        // Wait for user to inspect
        console.log('\n⏳ Browser will stay open for 30 seconds for manual inspection...');
        await page.waitForTimeout(30000);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await browser.close();
    }
}

debugButtonFinder();
