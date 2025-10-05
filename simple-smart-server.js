const express = require('express');
const puppeteer = require('puppeteer');

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

// Simple browser launch
async function launchBrowser() {
    try {
        logWithTime('🔄 Launching browser...');
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--single-process'
            ]
        });
        logWithTime('✅ Browser launched successfully');
        return browser;
    } catch (error) {
        logWithTime(`❌ Browser launch failed: ${error.message}`);
        throw error;
    }
}

// Smart UI detection
async function detectUI(page) {
    logWithTime('🔍 Detecting UI elements...');
    
    const detection = await page.evaluate(() => {
        const result = {
            inputs: [],
            buttons: [],
            tokens: [],
            allText: ''
        };
        
        // Get all inputs
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            result.inputs.push({
                type: input.type,
                placeholder: input.placeholder,
                name: input.name,
                id: input.id,
                className: input.className,
                visible: input.offsetParent !== null
            });
        });
        
        // Get all buttons
        const buttons = document.querySelectorAll('button');
        buttons.forEach(button => {
            result.buttons.push({
                text: button.textContent.trim(),
                type: button.type,
                className: button.className,
                id: button.id,
                visible: button.offsetParent !== null
            });
        });
        
        // Look for token-like elements
        const tokenSelectors = [
            '.token', '.key', '.auth', '.result', '.output',
            '[class*="token"]', '[class*="key"]', '[class*="auth"]',
            'pre', 'code', '.api-key', '.access-token'
        ];
        
        tokenSelectors.forEach(selector => {
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
        });
        
        // Get all text content
        result.allText = document.body.innerText || document.body.textContent || '';
        
        return result;
    });
    
    logWithTime(`📊 Found: ${detection.inputs.length} inputs, ${detection.buttons.length} buttons, ${detection.tokens.length} token elements`);
    
    return detection;
}

// Extract token from various sources
async function extractToken(page, detection) {
    logWithTime('🧠 Extracting token...');
    
    // Method 1: Check existing token elements
    for (const tokenEl of detection.tokens) {
        if (tokenEl.visible && tokenEl.text.length > 15) {
            logWithTime(`✅ Found token in element: ${tokenEl.selector}`);
            return tokenEl.text;
        }
    }
    
    // Method 2: Check localStorage
    const storageToken = await page.evaluate(() => {
        const keys = [...Object.keys(localStorage), ...Object.keys(sessionStorage)];
        for (const key of keys) {
            if (key.toLowerCase().includes('token') || key.toLowerCase().includes('key')) {
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
    
    // Method 3: Analyze text for token patterns
    const text = detection.allText;
    const patterns = [
        /[A-Za-z0-9]{20,}/g,
        /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}/g,
        /[A-Za-z0-9+/]{20,}={0,2}/g
    ];
    
    for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
            for (const match of matches.slice(0, 3)) {
                if (match.length >= 15) {
                    logWithTime(`✅ Found potential token: ${match.substring(0, 20)}...`);
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
        
        browser = await launchBrowser();
        const page = await browser.newPage();
        
        // Set viewport
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Navigate to website
        await page.goto('https://key-token.com/', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        
        logWithTime('⏳ Waiting for page to load...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Detect UI
        const detection = await detectUI(page);
        
        // Try to extract token directly
        const directToken = await extractToken(page, detection);
        if (directToken) {
            logWithTime(`🎉 Token found: ${directToken.substring(0, 20)}...`);
            return { success: true, token: directToken, method: 'direct' };
        }
        
        // Try form submission if inputs and buttons exist
        if (detection.inputs.length > 0 && detection.buttons.length > 0) {
            logWithTime('📝 Trying form submission...');
            
            // Find best input
            const input = detection.inputs.find(inp => inp.visible) || detection.inputs[0];
            if (input) {
                await page.type(`input[type="${input.type}"]`, KEY_ID);
                logWithTime(`✅ Filled input: ${input.type}`);
                
                // Find best button
                const button = detection.buttons.find(btn => 
                    btn.visible && (
                        btn.text.toLowerCase().includes('token') ||
                        btn.text.toLowerCase().includes('submit') ||
                        btn.text.toLowerCase().includes('get')
                    )
                ) || detection.buttons.find(btn => btn.visible);
                
                if (button) {
                    await page.click('button');
                    logWithTime(`✅ Clicked button: ${button.text}`);
                    
                    // Wait for response
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    
                    // Try to extract token again
                    const newDetection = await detectUI(page);
                    const newToken = await extractToken(page, newDetection);
                    
                    if (newToken) {
                        logWithTime(`🎉 Token found after form: ${newToken.substring(0, 20)}...`);
                        return { success: true, token: newToken, method: 'form' };
                    }
                }
            }
        }
        
        // Take screenshot for debugging
        try {
            await page.screenshot({ path: '/tmp/debug.png' });
            logWithTime('📸 Screenshot saved');
        } catch (e) {
            logWithTime(`📸 Screenshot failed: ${e.message}`);
        }
        
        throw new Error('No token found');
        
    } catch (error) {
        logWithTime(`❌ Error: ${error.message}`);
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
        logWithTime('🔄 Auto refresh triggered');
        const result = await getTokenFromWebsite();
        
        if (result.success) {
            currentToken = result.token;
            tokenInfo = {
                token: result.token,
                timestamp: new Date().toISOString(),
                method: result.method
            };
            lastUpdate = Date.now();
            consecutiveErrors = 0;
            logWithTime(`✅ Token updated via ${result.method}`);
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

// Start server
app.listen(PORT, () => {
    logWithTime(`🚀 Simple Smart Token Server started on port ${PORT}`);
    logWithTime('📡 Endpoints:');
    logWithTime('   GET  /health - Health check');
    logWithTime('   GET  /token - Get current token');
    logWithTime('   GET  /status - Get server status');
    logWithTime('   POST /refresh - Force refresh token');
    logWithTime('   POST /auto-refresh - Auto refresh');
    
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
    logWithTime('🛑 Shutting down...');
    process.exit(0);
});

process.on('SIGINT', () => {
    logWithTime('🛑 Shutting down...');
    process.exit(0);
});
