const puppeteer = require('puppeteer');

async function quickTest() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    try {
        await page.goto('https://key-token.com/', { timeout: 15000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('URL:', page.url());
        console.log('Title:', await page.title());
        
        const content = await page.content();
        const text = await page.evaluate(() => document.body.innerText);
        
        console.log('Content length:', content.length);
        console.log('Text length:', text.length);
        console.log('First 200 chars:', text.substring(0, 200));
        
        if (text.includes('for sale')) {
            console.log('❌ Website shows "for sale" message');
        } else if (text.length > 500) {
            console.log('✅ Website has substantial content');
        } else {
            console.log('⚠️ Website has minimal content');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await browser.close();
    }
}

quickTest();
