const puppeteer = require('puppeteer');

const KEY_ID = 'KEY-8GFN9U3L0U';

async function testModalDebug() {
    console.log('🧪 Testing modal handling with debug...');
    
    let browser = null;
    let page = null;
    
    try {
        // Force download Chromium
        process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'false';
        
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
        
        // Take screenshot before modal handling
        await page.screenshot({ path: 'debug-before-modal.png' });
        console.log('📸 Screenshot saved: debug-before-modal.png');
        
        // Check for modal
        console.log('🔍 Checking for modal...');
        
        // Get all buttons and their text
        const buttons = await page.$$('button');
        console.log(`🔍 Found ${buttons.length} buttons on page`);
        
        for (let i = 0; i < buttons.length; i++) {
            const text = await page.evaluate(el => el.textContent, buttons[i]);
            const visible = await page.evaluate(el => {
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null;
            }, buttons[i]);
            
            console.log(`Button ${i}: "${text}" (visible: ${visible})`);
            
            if (text && (text.includes('Đã hiểu') || text.includes('Understood'))) {
                console.log('✅ Found "Đã hiểu" button, clicking...');
                await buttons[i].click();
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Take screenshot after clicking
                await page.screenshot({ path: 'debug-after-click.png' });
                console.log('📸 Screenshot saved: debug-after-click.png');
                break;
            }
        }
        
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
        await page.screenshot({ path: 'debug-final-result.png' });
        console.log('📸 Final screenshot saved: debug-final-result.png');
        
        console.log('✅ Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testModalDebug();
