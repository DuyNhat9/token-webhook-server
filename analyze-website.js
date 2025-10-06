const express = require('express');
const puppeteer = require('puppeteer');

async function analyzeWebsite() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('🔍 Analyzing website: https://key-token.com/');
        
        // Navigate to website
        await page.goto('https://key-token.com/', { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });
        
        // Wait for full load
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Get page content
        const content = await page.content();
        console.log('📄 Page content length:', content.length);
        
        // Analyze HTML structure
        const analysis = await page.evaluate(() => {
            return {
                title: document.title,
                url: window.location.href,
                elements: {
                    inputs: document.querySelectorAll('input').length,
                    buttons: document.querySelectorAll('button').length,
                    forms: document.querySelectorAll('form').length,
                    divs: document.querySelectorAll('div').length,
                    spans: document.querySelectorAll('span').length,
                    links: document.querySelectorAll('a').length
                },
                text: document.body.innerText,
                scripts: Array.from(document.querySelectorAll('script')).map(s => s.src || 'inline'),
                stylesheets: Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.href)
            };
        });
        
        console.log('📊 Analysis Results:');
        console.log('Title:', analysis.title);
        console.log('URL:', analysis.url);
        console.log('Elements:', analysis.elements);
        console.log('Scripts:', analysis.scripts.slice(0, 5));
        console.log('Stylesheets:', analysis.stylesheets.slice(0, 5));
        console.log('Text content:', analysis.text.substring(0, 500));
        
        // Look for any elements that might contain tokens or keys
        const tokenElements = await page.evaluate(() => {
            const selectors = [
                '[class*="token"]',
                '[class*="key"]',
                '[class*="auth"]',
                '[class*="result"]',
                '[class*="output"]',
                'pre', 'code',
                '[id*="token"]',
                '[id*="key"]',
                '[data-token]',
                '[data-key]'
            ];
            
            const found = [];
            selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                    if (el.textContent && el.textContent.trim().length > 10) {
                        found.push({
                            selector,
                            text: el.textContent.substring(0, 100),
                            className: el.className,
                            id: el.id
                        });
                    }
                });
            });
            
            return found;
        });
        
        console.log('🔍 Token elements found:', tokenElements);
        
        // Take screenshot
        await page.screenshot({ path: '/tmp/website-analysis.png', fullPage: true });
        console.log('📸 Screenshot saved');
        
        // Check for dynamic content loading
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const afterWait = await page.evaluate(() => {
            return {
                contentLength: document.body.innerText.length,
                elements: {
                    inputs: document.querySelectorAll('input').length,
                    buttons: document.querySelectorAll('button').length,
                    forms: document.querySelectorAll('form').length
                }
            };
        });
        
        console.log('⏰ After waiting:', afterWait);
        
        // Check for any JavaScript errors or network requests
        const networkRequests = await page.evaluate(() => {
            return {
                resources: window.performance.getEntriesByType('resource').length,
                errors: window.console.errors || []
            };
        });
        
        console.log('🌐 Network requests:', networkRequests);
        
        await browser.close();
        
        return {
            analysis,
            tokenElements,
            content,
            afterWait,
            networkRequests
        };
        
    } catch (error) {
        console.error('❌ Error analyzing website:', error.message);
        await browser.close();
        throw error;
    }
}

// Run analysis
analyzeWebsite().then(result => {
    console.log('\n✅ Analysis completed!');
    console.log('📋 Summary:');
    console.log('- Title:', result.analysis.title);
    console.log('- Elements:', result.analysis.elements);
    console.log('- Token elements:', result.tokenElements.length);
    console.log('- Content length:', result.content.length);
}).catch(error => {
    console.error('❌ Analysis failed:', error.message);
});
