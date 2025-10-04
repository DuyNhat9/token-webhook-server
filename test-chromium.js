const puppeteer = require('puppeteer');

async function testChromium() {
    console.log('🧪 Testing Chromium availability...');
    
    const strategies = [
        {
            name: 'System Chromium Browser',
            executablePath: '/usr/bin/chromium-browser',
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        },
        {
            name: 'System Chromium',
            executablePath: '/usr/bin/chromium',
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        },
        {
            name: 'Google Chrome',
            executablePath: '/usr/bin/google-chrome',
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        },
        {
            name: 'Puppeteer Default (Download)',
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    ];
    
    for (let i = 0; i < strategies.length; i++) {
        const strategy = strategies[i];
        console.log(`\n🔄 Testing strategy ${i + 1}: ${strategy.name}`);
        
        try {
            const browser = await puppeteer.launch(strategy);
            const page = await browser.newPage();
            await page.goto('https://example.com');
            const title = await page.title();
            console.log(`✅ ${strategy.name} - SUCCESS! Page title: ${title}`);
            await browser.close();
            return; // Exit on first success
        } catch (error) {
            console.log(`❌ ${strategy.name} - FAILED: ${error.message}`);
        }
    }
    
    console.log('\n❌ All strategies failed!');
}

testChromium().catch(console.error);
