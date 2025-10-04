const puppeteer = require('puppeteer');

const KEY_ID = 'KEY-8GFN9U3L0U';

async function testModalHandling() {
    console.log('🧪 Testing modal handling...');
    
    let browser = null;
    let page = null;
    
    try {
        browser = await puppeteer.launch({
            headless: false, // Show browser for debugging
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        
        console.log('🌐 Navigating to website...');
        await page.goto('https://tokencursor.io.vn/app', { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
        });
        
        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check for modal
        console.log('🔍 Checking for modal...');
        
        // Take screenshot before modal handling
        await page.screenshot({ path: 'before-modal.png' });
        console.log('📸 Screenshot saved: before-modal.png');
        
        // Try to find and close modal
        const buttons = await page.$$('button');
        console.log(`🔍 Found ${buttons.length} buttons on page`);
        
        for (let i = 0; i < buttons.length; i++) {
            const text = await page.evaluate(el => el.textContent, buttons[i]);
            console.log(`Button ${i}: "${text}"`);
            
            if (text && (text.includes('Đã hiểu') || text.includes('Understood'))) {
                console.log('✅ Found "Đã hiểu" button, clicking...');
                await buttons[i].click();
                await new Promise(resolve => setTimeout(resolve, 1000));
                break;
            }
        }
        
        // Take screenshot after modal handling
        await page.screenshot({ path: 'after-modal.png' });
        console.log('📸 Screenshot saved: after-modal.png');
        
        // Try to fill form
        console.log('🔑 Trying to fill key...');
        await page.type('input[name="key"]', KEY_ID);
        console.log('✅ Key filled');
        
        // Try to click submit button
        console.log('🔄 Trying to click submit button...');
        await page.click('button[type="submit"]');
        console.log('✅ Form submitted');
        
        // Wait and take final screenshot
        await new Promise(resolve => setTimeout(resolve, 3000));
        await page.screenshot({ path: 'final-result.png' });
        console.log('📸 Final screenshot saved: final-result.png');
        
        console.log('✅ Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testModalHandling();
