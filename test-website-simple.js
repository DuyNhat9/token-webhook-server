const puppeteer = require('puppeteer');

async function testWebsite() {
    console.log('🔍 Testing website locally...');
    
    const browser = await puppeteer.launch({
        headless: false, // Show browser for debugging
        slowMo: 100,    // Slow down for observation
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('📡 Navigating to https://key-token.com/');
        await page.goto('https://key-token.com/', { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });
        
        console.log('⏳ Waiting 5 seconds for page to load...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const url = page.url();
        console.log(`📍 Current URL: ${url}`);
        
        const title = await page.title();
        console.log(`📄 Page title: ${title}`);
        
        const content = await page.content();
        console.log(`📝 Page content length: ${content.length}`);
        
        const visibleText = await page.evaluate(() => {
            return document.body.innerText || document.body.textContent || '';
        });
        console.log(`👁️ Visible text: "${visibleText.substring(0, 200)}..."`);
        
        // Check if it's redirected or different domain
        if (!url.includes('key-token.com')) {
            console.log(`⚠️ Redirected to different domain: ${url}`);
        }
        
        // Take screenshot
        await page.screenshot({ 
            path: './screenshot-test.png',
            fullPage: true 
        });
        console.log('📸 Screenshot saved as screenshot-test.png');
        
        // Check for any forms or interactive elements
        const hasInput = await page.$('input') !== null;
        const hasButton = await page.$('button') !== null;
        const hasForm = await page.$('form') !== null;
        const hasDivs = await page.$('div') !== null;
        
        console.log(`🔍 Elements: Input:${hasInput} Button:${hasButton} Form:${hasForm} Div:${hasDivs}`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        console.log('⏳ Keeping browser open for 10 seconds for manual inspection...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        await browser.close();
        console.log('✅ Browser closed');
    }
}

testWebsite().catch(console.error);
