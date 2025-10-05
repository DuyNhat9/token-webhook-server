const puppeteer = require('puppeteer');

async function testLocal() {
    console.log('🔍 Testing with local Chrome...');
    
    const browser = await puppeteer.launch({
        headless: false, // Show browser
        slowMo: 1000,   // Slow down to see what's happening
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ]
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('📡 Going to https://key-token.com/');
        await page.goto('https://key-token.com/', { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });
        
        console.log('⏳ Waiting 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const url = page.url();
        const title = await page.title();
        const text = await page.evaluate(() => document.body.innerText);
        
        console.log('📍 Current URL:', url);
        console.log('📄 Title:', title);
        console.log('📝 Text length:', text.length);
        console.log('📝 First 300 chars:', text.substring(0, 300));
        
        // Check for forms/inputs
        const hasInput = await page.$('input') !== null;
        const hasButton = await page.$('button') !== null;
        const hasForm = await page.$('form') !== null;
        
        console.log('🔍 Elements found:');
        console.log('  - Input:', hasInput);
        console.log('  - Button:', hasButton);
        console.log('  - Form:', hasForm);
        
        // Take screenshot
        await page.screenshot({ 
            path: './local-test-screenshot.png',
            fullPage: true 
        });
        console.log('📸 Screenshot saved as local-test-screenshot.png');
        
        console.log('\n⏳ Browser will stay open for 30 seconds for manual inspection...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await browser.close();
        console.log('✅ Browser closed');
    }
}

testLocal().catch(console.error);
