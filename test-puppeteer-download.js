const puppeteer = require('puppeteer');

async function testPuppeteerDownload() {
    console.log('🧪 Testing Puppeteer Chromium download...');
    
    // Force download
    process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'false';
    delete process.env.PUPPETEER_EXECUTABLE_PATH;
    
    console.log('🔧 Environment variables:');
    console.log('PUPPETEER_SKIP_CHROMIUM_DOWNLOAD:', process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD);
    console.log('PUPPETEER_EXECUTABLE_PATH:', process.env.PUPPETEER_EXECUTABLE_PATH);
    
    let browser = null;
    let page = null;
    
    try {
        console.log('🚀 Launching Puppeteer...');
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        console.log('✅ Browser launched successfully!');
        
        page = await browser.newPage();
        await page.goto('https://example.com');
        const title = await page.title();
        console.log('✅ Page loaded successfully! Title:', title);
        
        console.log('🎉 Puppeteer download test PASSED!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Full error:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testPuppeteerDownload();
