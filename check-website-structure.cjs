const puppeteer = require('puppeteer');

async function checkWebsiteStructure() {
    let browser;
    try {
        console.log('🌐 Opening browser to check website structure...');
        
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        
        // Navigate to the website
        console.log('📡 Navigating to website...');
        await page.goto('https://tokencursor.io.vn/app', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // Wait for page to load
        await page.waitForTimeout(5000);
        
        // Get page title
        const title = await page.title();
        console.log('📄 Page title:', title);
        
        // Get current URL
        const currentUrl = page.url();
        console.log('📍 Current URL:', currentUrl);
        
        // Get all input elements
        const inputs = await page.$$eval('input', inputs => 
            inputs.map(input => ({
                type: input.type,
                placeholder: input.placeholder,
                name: input.name,
                id: input.id,
                className: input.className
            }))
        );
        console.log('📝 Found', inputs.length, 'input elements:');
        inputs.forEach((input, index) => {
            console.log(`   Input ${index}:`, input);
        });
        
        // Get all button elements
        const buttons = await page.$$eval('button', buttons => 
            buttons.map(btn => ({
                text: btn.textContent.trim(),
                type: btn.type,
                className: btn.className,
                id: btn.id
            }))
        );
        console.log('🔘 Found', buttons.length, 'button elements:');
        buttons.forEach((btn, index) => {
            console.log(`   Button ${index}:`, btn);
        });
        
        // Get all form elements
        const forms = await page.$$eval('form', forms => 
            forms.map(form => ({
                action: form.action,
                method: form.method,
                className: form.className,
                id: form.id
            }))
        );
        console.log('📋 Found', forms.length, 'form elements:');
        forms.forEach((form, index) => {
            console.log(`   Form ${index}:`, form);
        });
        
        // Get page content preview
        const pageContent = await page.content();
        console.log('📄 Page content preview (first 500 chars):');
        console.log(pageContent.substring(0, 500) + '...');
        
        // Check if there's a cooldown message
        const cooldownPatterns = [
            /Chờ\s+(\d+):(\d+)\s+nữa/,
            /(\d+):(\d+)\s+nữa/,
            /(\d+)\s+phút\s+nữa/,
            /(\d+)\s+giây\s+nữa/
        ];
        
        for (const pattern of cooldownPatterns) {
            const match = pageContent.match(pattern);
            if (match) {
                console.log('⏰ Cooldown detected:', match[0]);
                break;
            }
        }
        
        // Check if there's a token
        const jwtPattern = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/;
        const tokenMatch = pageContent.match(jwtPattern);
        if (tokenMatch) {
            console.log('🎉 JWT token found in page content!');
            console.log('Token:', tokenMatch[0]);
        } else {
            console.log('❌ No JWT token found in page content');
        }
        
    } catch (error) {
        console.error('❌ Error checking website:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Main function
async function main() {
    console.log('🚀 CHECKING WEBSITE STRUCTURE...');
    console.log('=================================');
    
    await checkWebsiteStructure();
    
    console.log('\n✅ Website structure check completed');
}

main();
