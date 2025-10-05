const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Global variables
let currentToken = null;
let tokenInfo = null;
let lastUpdate = 0;
let consecutiveErrors = 0;
let isFetching = false;

// Configuration
const KEY_ID = process.env.KEY_ID || 'your-key-here';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

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

// Logging function
function logWithTime(message) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { 
        timeZone: 'Asia/Ho_Chi_Minh',
        hour12: false 
    });
    const dateStr = now.toLocaleDateString('vi-VN');
    console.log(`[${timeStr} ${dateStr}] ${message}`);
}

// Browser launch function
async function launchBrowser() {
    const strategies = [
        // Strategy 1: Use system Chromium (fastest)
        {
            headless: true,
            executablePath: '/usr/bin/chromium',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--single-process'
            ]
        },
        // Strategy 2: Use system Chrome
        {
            headless: true,
            executablePath: '/usr/bin/chromium-browser',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ]
        },
        // Strategy 3: Use Google Chrome
        {
            headless: true,
            executablePath: '/usr/bin/google-chrome',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ]
        }
    ];

    for (let i = 0; i < strategies.length; i++) {
        try {
            logWithTime(`🔄 Trying browser launch strategy ${i + 1}...`);
            const browser = await puppeteer.launch(strategies[i]);
            logWithTime(`✅ Browser launched successfully with strategy ${i + 1}`);
            return browser;
        } catch (error) {
            logWithTime(`❌ Strategy ${i + 1} failed: ${error.message}`);
            if (i === strategies.length - 1) throw error;
        }
    }
}

// UI Detection function
async function detectUI(page) {
    logWithTime('🔍 Detecting UI elements...');
    
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
    
    logWithTime(`📊 UI Detection Results:`);
    logWithTime(`  - Inputs: ${detection.inputs.length}`);
    logWithTime(`  - Buttons: ${detection.buttons.length}`);
    logWithTime(`  - Token elements: ${detection.tokens.length}`);
    logWithTime(`  - Forms: ${detection.forms.length}`);
    logWithTime(`  - All interactive elements: ${detection.allElements.length}`);
    
    return detection;
}

// Smart token extraction
async function extractTokenSmart(page, uiDetection) {
    logWithTime('🧠 Smart token extraction...');
    
    // Method 1: Check existing token elements
    for (const tokenEl of uiDetection.tokens) {
        if (tokenEl.visible && tokenEl.text.length > 15) {
            logWithTime(`✅ Found token in element: ${tokenEl.selector}`);
            return tokenEl.text;
        }
    }
    
    // Method 2: Check localStorage/sessionStorage
    const storageToken = await page.evaluate(() => {
        const keys = [...Object.keys(localStorage), ...Object.keys(sessionStorage)];
        for (const key of keys) {
            if (key.toLowerCase().includes('token') || key.toLowerCase().includes('key') || key.toLowerCase().includes('auth')) {
                const value = localStorage.getItem(key) || sessionStorage.getItem(key);
                if (value && value.length > 15) {
                    return value;
                }
            }
        }
        return null;
    });
    
    if (storageToken) {
        logWithTime(`✅ Found token in storage: ${storageToken.substring(0, 20)}...`);
        return storageToken;
    }
    
    // Method 3: Check window variables
    const windowToken = await page.evaluate(() => {
        const tokenVars = ['token', 'apiKey', 'api_key', 'auth', 'authToken', 'accessToken', 'key'];
        for (const varName of tokenVars) {
            if (window[varName] && typeof window[varName] === 'string' && window[varName].length > 15) {
                return window[varName];
            }
        }
        return null;
    });
    
    if (windowToken) {
        logWithTime(`✅ Found token in window variables: ${windowToken.substring(0, 20)}...`);
        return windowToken;
    }
    
    // Method 4: Analyze page text for token patterns
    const pageText = await page.evaluate(() => {
        return document.body.innerText || document.body.textContent || '';
    });
    
    const tokenPatterns = [
        /[A-Za-z0-9]{20,}/g,
        /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}/g,
        /[A-Za-z0-9+/]{20,}={0,2}/g,
        /[A-Za-z0-9._-]{20,}/g
    ];
    
    for (const pattern of tokenPatterns) {
        const matches = pageText.match(pattern);
        if (matches) {
            for (const match of matches.slice(0, 5)) {
                if (match.length >= 15) {
                    logWithTime(`✅ Found potential token in text: ${match.substring(0, 20)}...`);
                    return match;
                }
            }
        }
    }
    
    return null;
}

// Main token fetching function
async function getTokenFromWebsite() {
    if (isFetching) {
        throw new Error('Already fetching');
    }
    
    isFetching = true;
    let browser = null;
    
    try {
        logWithTime('🔑 Getting token from website...');
        
        // Launch browser
        browser = await launchBrowser();
        const page = await browser.newPage();
        
        // Set viewport and user agent
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Navigate to website
        await page.goto('https://key-token.com/', {
            waitUntil: 'networkidle0',
            timeout: 60000
        });
        
        logWithTime('⏳ Waiting for page to load...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Detect UI elements
        const uiDetection = await detectUI(page);
        
        // Try to extract token directly
        const directToken = await extractTokenSmart(page, uiDetection);
        if (directToken) {
            logWithTime(`🎉 Token found directly: ${directToken.substring(0, 20)}...`);
            return { success: true, token: directToken, method: 'direct' };
        }
        
        // If no direct token, try to fill form
        if (uiDetection.inputs.length > 0 && uiDetection.buttons.length > 0) {
            logWithTime('📝 Attempting to fill form...');
            
            // Find best input
            const bestInput = uiDetection.inputs.find(input => 
                input.visible && (
                    input.placeholder?.toLowerCase().includes('key') ||
                    input.name?.toLowerCase().includes('key') ||
                    input.id?.toLowerCase().includes('key')
                )
            ) || uiDetection.inputs.find(input => input.visible);
            
            if (bestInput) {
                await page.type(bestInput.selector, KEY_ID);
                logWithTime(`✅ Filled input: ${bestInput.selector}`);
                
                // Find best button
                const bestButton = uiDetection.buttons.find(button => 
                    button.visible && (
                        button.text.toLowerCase().includes('token') ||
                        button.text.toLowerCase().includes('submit') ||
                        button.text.toLowerCase().includes('generate')
                    )
                ) || uiDetection.buttons.find(button => button.visible);
                
                if (bestButton) {
                    await page.click(bestButton.selector);
                    logWithTime(`✅ Clicked button: ${bestButton.selector}`);
                    
                    // Wait for response
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    
                    // Try to extract token again
                    const newUiDetection = await detectUI(page);
                    const newToken = await extractTokenSmart(page, newUiDetection);
                    
                    if (newToken) {
                        logWithTime(`🎉 Token found after form submission: ${newToken.substring(0, 20)}...`);
                        return { success: true, token: newToken, method: 'form' };
                    }
                }
            }
        }
        
        // Take screenshot for debugging
        try {
            await page.screenshot({ path: '/tmp/debug-screenshot.png' });
            logWithTime('📸 Debug screenshot saved');
        } catch (e) {
            logWithTime(`📸 Screenshot failed: ${e.message}`);
        }
        
        throw new Error('No token found with any method');
        
    } catch (error) {
        logWithTime(`❌ Error getting token: ${error.message}`);
        throw error;
    } finally {
        isFetching = false;
        if (browser) {
            await browser.close();
        }
    }
}

// Auto refresh function
async function autoRefresh() {
    try {
        logWithTime('🔄 Auto token refresh triggered');
        const result = await getTokenFromWebsite();
        
        if (result.success) {
            currentToken = result.token;
            tokenInfo = {
                token: result.token,
                timestamp: new Date().toISOString(),
                source: result.method,
                method: result.method
            };
            lastUpdate = Date.now();
            consecutiveErrors = 0;
            logWithTime(`✅ Token updated successfully via ${result.method}`);
        }
    } catch (error) {
        consecutiveErrors++;
        logWithTime(`❌ Auto refresh failed: ${error.message}`);
    }
}

// Express routes
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

app.get('/token', (req, res) => {
    if (currentToken) {
        res.json({
            success: true,
            token: currentToken,
            info: tokenInfo,
            lastUpdate: new Date(lastUpdate).toISOString()
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'No token available'
        });
    }
});

app.get('/status', (req, res) => {
    res.json({
        status: 'running',
        hasToken: !!currentToken,
        lastUpdate: lastUpdate ? new Date(lastUpdate).toISOString() : null,
        consecutiveErrors,
        isFetching,
        uptime: process.uptime()
    });
});

app.post('/refresh', async (req, res) => {
    try {
        await autoRefresh();
        res.json({ success: true, message: 'Refresh completed' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/auto-refresh', async (req, res) => {
    if (isFetching) {
        return res.status(429).json({ success: false, message: 'Already fetching' });
    }
    
    try {
        await autoRefresh();
        res.json({ success: true, message: 'Auto refresh completed' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Telegram notification function
async function sendTelegramMessage(message) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        logWithTime('⚠️ Telegram credentials not set');
        return;
    }
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
        
        if (response.ok) {
            logWithTime('✅ Telegram message sent');
        } else {
            logWithTime(`❌ Telegram send failed: ${response.status}`);
        }
    } catch (error) {
        logWithTime(`❌ Telegram error: ${error.message}`);
    }
}

app.post('/send-token', async (req, res) => {
    if (!currentToken) {
        return res.status(404).json({ success: false, message: 'No token available' });
    }
    
    const message = `🔑 <b>Token Update</b>\n\n` +
                   `Token: <code>${currentToken}</code>\n` +
                   `Method: ${tokenInfo?.method || 'unknown'}\n` +
                   `Time: ${new Date().toISOString()}`;
    
    await sendTelegramMessage(message);
    res.json({ success: true, message: 'Token sent to Telegram' });
});

// Start server
app.listen(PORT, () => {
    logWithTime(`🚀 Smart Token Server started on port ${PORT}`);
    logWithTime('📡 Endpoints:');
    logWithTime('   GET  /health - Health check');
    logWithTime('   GET  /token - Get current token');
    logWithTime('   GET  /status - Get server status');
    logWithTime('   POST /refresh - Force refresh token');
    logWithTime('   POST /auto-refresh - Auto refresh (for cron)');
    logWithTime('   POST /send-token - Send token to Telegram');
    
    // Initial token fetch
    setTimeout(() => {
        logWithTime('🔄 Initial token fetch...');
        autoRefresh();
    }, 2000);
    
    // Auto refresh every 5 minutes
    setInterval(autoRefresh, 5 * 60 * 1000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logWithTime('🛑 Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    logWithTime('🛑 Shutting down gracefully...');
    process.exit(0);
});
