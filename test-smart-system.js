const puppeteer = require('puppeteer');

async function testSmartSystem() {
    console.log('🧠 Testing Smart Token System...');
    
    const browser = await puppeteer.launch({
        headless: true, // Faster in headless
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--single-process'
        ]
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('📡 Navigating to website...');
        await page.goto('https://key-token.com/', {
            waitUntil: 'domcontentloaded', // Faster than networkidle0
            timeout: 15000 // Reduced timeout
        });
        
        console.log('⏳ Waiting for page to load...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Reduced wait time
        
        // UI Detection patterns
        const UI_PATTERNS = {
            inputSelectors: [
                'input[type="text"]',
                'input[type="password"]',
                'input[placeholder*="key"]',
                'input[placeholder*="Key"]',
                'input[name*="key"]',
                'input[name*="Key"]',
                'input[class*="key"]',
                'input[class*="Key"]',
                'input[id*="key"]',
                'input[id*="Key"]',
                'input[aria-label*="key"]',
                'input[aria-label*="Key"]',
                'input'
            ],
            buttonSelectors: [
                'button[type="submit"]',
                'button:contains("Get Token")',
                'button:contains("Lấy Token")',
                'button:contains("Token")',
                'button:contains("Submit")',
                'button:contains("Gửi")',
                'button:contains("Generate")',
                'button:contains("Create")',
                'button.btn-primary',
                'button.btn',
                'button[class*="submit"]',
                'button[class*="generate"]',
                'button[class*="create"]',
                'button'
            ],
            tokenSelectors: [
                '.token-result',
                '.result',
                '[class*="token"]',
                '[class*="result"]',
                '[class*="key"]',
                '[class*="auth"]',
                '[id*="token"]',
                '[id*="key"]',
                '[data-token]',
                '[data-key]',
                'pre',
                'code',
                '.output',
                '.response',
                '.token',
                '.key',
                '.auth',
                '.api-key',
                '.access-token'
            ]
        };
        
        // Detect UI elements
        console.log('🔍 Detecting UI elements...');
        const detection = await page.evaluate((patterns) => {
            const result = {
                inputs: [],
                buttons: [],
                tokens: [],
                forms: [],
                allElements: []
            };
            
            // Detect inputs
            patterns.inputSelectors.forEach(selector => {
                try {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                        result.inputs.push({
                            selector,
                            type: el.type,
                            placeholder: el.placeholder,
                            name: el.name,
                            id: el.id,
                            className: el.className,
                            visible: el.offsetParent !== null
                        });
                    });
                } catch (e) {}
            });
            
            // Detect buttons
            patterns.buttonSelectors.forEach(selector => {
                try {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                        result.buttons.push({
                            selector,
                            text: el.textContent.trim(),
                            type: el.type,
                            className: el.className,
                            id: el.id,
                            visible: el.offsetParent !== null
                        });
                    });
                } catch (e) {}
            });
            
            // Detect token elements
            patterns.tokenSelectors.forEach(selector => {
                try {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => {
                        const text = el.textContent.trim();
                        if (text && text.length > 10) {
                            result.tokens.push({
                                selector,
                                text: text.substring(0, 100),
                                className: el.className,
                                id: el.id,
                                visible: el.offsetParent !== null
                            });
                        }
                    });
                } catch (e) {}
            });
            
            // Detect forms
            const forms = document.querySelectorAll('form');
            forms.forEach(form => {
                result.forms.push({
                    action: form.action,
                    method: form.method,
                    className: form.className,
                    id: form.id
                });
            });
            
            // Get all interactive elements
            const allInteractive = document.querySelectorAll('input, button, select, textarea, a[href]');
            allInteractive.forEach(el => {
                result.allElements.push({
                    tag: el.tagName,
                    type: el.type,
                    text: el.textContent.trim().substring(0, 50),
                    className: el.className,
                    id: el.id,
                    visible: el.offsetParent !== null
                });
            });
            
            return result;
        }, UI_PATTERNS);
        
        console.log('\n📊 UI Detection Results:');
        console.log(`  - Inputs: ${detection.inputs.length}`);
        console.log(`  - Buttons: ${detection.buttons.length}`);
        console.log(`  - Token elements: ${detection.tokens.length}`);
        console.log(`  - Forms: ${detection.forms.length}`);
        console.log(`  - All interactive elements: ${detection.allElements.length}`);
        
        // Show detailed results
        if (detection.inputs.length > 0) {
            console.log('\n🔍 Inputs found:');
            detection.inputs.forEach((input, i) => {
                console.log(`  ${i + 1}. ${input.selector} - ${input.type} - "${input.placeholder || input.name || input.id}" - Visible: ${input.visible}`);
            });
        }
        
        if (detection.buttons.length > 0) {
            console.log('\n🔍 Buttons found:');
            detection.buttons.forEach((button, i) => {
                console.log(`  ${i + 1}. ${button.selector} - "${button.text}" - Visible: ${button.visible}`);
            });
        }
        
        if (detection.tokens.length > 0) {
            console.log('\n🔍 Token elements found:');
            detection.tokens.forEach((token, i) => {
                console.log(`  ${i + 1}. ${token.selector} - "${token.text}" - Visible: ${token.visible}`);
            });
        }
        
        if (detection.allElements.length > 0) {
            console.log('\n🔍 All interactive elements:');
            detection.allElements.slice(0, 10).forEach((el, i) => {
                console.log(`  ${i + 1}. ${el.tag} - ${el.type} - "${el.text}" - Visible: ${el.visible}`);
            });
        }
        
        // Check page content
        const pageText = await page.evaluate(() => {
            return document.body.innerText || document.body.textContent || '';
        });
        
        console.log('\n📝 Page content:');
        console.log(`  - Length: ${pageText.length}`);
        console.log(`  - First 300 chars: "${pageText.substring(0, 300)}"`);
        
        // Check for token patterns
        const tokenPatterns = [
            /[A-Za-z0-9]{20,}/g,
            /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}/g,
            /[A-Za-z0-9+/]{20,}={0,2}/g,
            /[A-Za-z0-9._-]{20,}/g
        ];
        
        console.log('\n🔍 Token patterns found:');
        tokenPatterns.forEach((pattern, i) => {
            const matches = pageText.match(pattern);
            if (matches) {
                console.log(`  Pattern ${i + 1}: ${matches.length} matches`);
                matches.slice(0, 3).forEach(match => {
                    console.log(`    - "${match.substring(0, 30)}..."`);
                });
            }
        });
        
        // Take screenshot
        await page.screenshot({ 
            path: './smart-test-screenshot.png',
            fullPage: true 
        });
        console.log('\n📸 Screenshot saved as smart-test-screenshot.png');
        
        console.log('\n⏳ Browser will stay open for 30 seconds for manual inspection...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await browser.close();
        console.log('✅ Browser closed');
    }
}

testSmartSystem().catch(console.error);
