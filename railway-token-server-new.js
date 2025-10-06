import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8080;

// Environment variables
const KEY_ID = process.env.KEY_ID || 'KEY-8GFN9U3L0U';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Force Puppeteer to download its own Chromium for Railway
process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'false';
process.env.PUPPETEER_DOWNLOAD_HOST = 'https://storage.googleapis.com';
process.env.PUPPETEER_CACHE_DIR = '/tmp/puppeteer-cache';
delete process.env.PUPPETEER_EXECUTABLE_PATH;

// Global variables
let currentToken = null;
let tokenInfo = null;
let lastUpdate = null;
let serverStartTime = Date.now();
let isGettingToken = false;
let browserInstance = null;
let consecutiveErrors = 0;
let maxConsecutiveErrors = 5;

// Process monitoring
let lastHealthCheck = Date.now();
let memoryUsage = process.memoryUsage();

// Middleware
app.use(cors());
app.use(express.json());

// Process monitoring function
function monitorProcess() {
    const now = Date.now();
    memoryUsage = process.memoryUsage();
    
    if (now - lastHealthCheck > 300000) { // 5 minutes
        logWithTime(`📊 Memory Usage: RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB, Heap: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`);
        lastHealthCheck = now;
    }
}

// Logging function
function logWithTime(message) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const dateStr = now.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    console.log(`[${timeStr} ${dateStr}] ${message}`);
}

// Browser launch function
async function launchBrowser() {
    const strategies = [
        // Strategy 1: Let Puppeteer download Chromium (recommended for Railway)
        {
            headless: true,
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
        // Strategy 2: Use system Chromium if available
        {
            headless: true,
            executablePath: '/usr/bin/chromium',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security'
            ]
        },
        // Strategy 3: Use chromium-browser if available
        {
            headless: true,
            executablePath: '/usr/bin/chromium-browser',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        },
        // Strategy 4: Minimal args with bundled Chromium
        {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        },
        // Strategy 5: Ultra minimal
        {
            headless: true,
            args: ['--no-sandbox']
        },
        // Strategy 6: Try with google-chrome if available
        {
            headless: true,
            executablePath: '/usr/bin/google-chrome',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        },
        // Strategy 7: Last resort - no args
        {
            headless: true,
            args: []
        }
    ];

    for (let i = 0; i < strategies.length; i++) {
        try {
            logWithTime(`🔄 Trying browser launch strategy ${i + 1}...`);
            const browser = await puppeteer.launch(strategies[i]);
            
            // Test if browser is actually working
            const testPage = await browser.newPage();
            await testPage.goto('about:blank');
            await testPage.close();
            
            browserInstance = browser;
            logWithTime(`✅ Browser launched successfully with strategy ${i + 1}`);
            return browser;
        } catch (error) {
            logWithTime(`❌ Strategy ${i + 1} failed: ${error.message}`);
            if (error.stderr) {
                logWithTime(`stderr: ${error.stderr}`);
            }
            if (i === strategies.length - 1) {
                throw new Error('All browser launch strategies failed');
            }
        }
    }
}

// Get real token function
async function getToken() {
    if (isGettingToken) {
        logWithTime('⏳ Token fetch already in progress, skipping...');
        return { success: false, error: 'Already fetching' };
    }

    isGettingToken = true;
    let browser = null;
    let page = null;

    try {
        logWithTime('🔑 Getting real token from website...');
        
        // Launch browser
        browser = await launchBrowser();
        page = await browser.newPage();

        // Set viewport and user agent
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Navigate to the website
        await page.goto('https://key-token.com/', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });

        // Wait for page to load and check for modal
        await page.waitForTimeout(2000);

        // Check for and close modal BEFORE filling form
        try {
            logWithTime('🔍 Checking for notification modal...');
            
            // Wait for modal to appear (if it exists)
            await page.waitForSelector('button', { timeout: 3000 });
            
            // Get all buttons and check their text
            const buttons = await page.$$('button');
            let modalClosed = false;
            
            for (const button of buttons) {
                const text = await page.evaluate(el => el.textContent, button);
                if (text && (text.includes('Đã hiểu') || text.includes('X') || text.includes('Close') || text.includes('OK'))) {
                    logWithTime(`✅ Found modal close button: "${text}"`);
                    await button.click();
                    await page.waitForTimeout(1000);
                    modalClosed = true;
                    break;
                }
            }
            
            if (modalClosed) {
                logWithTime('✅ Modal closed successfully');
            } else {
                logWithTime('ℹ️ No modal found or already closed');
            }
        } catch (error) {
            logWithTime(`ℹ️ Modal check completed: ${error.message}`);
        }

        // Fill in the key
        logWithTime('📝 Filling in the key...');
        await page.type('input[type="text"]', KEY_ID);
        await page.waitForTimeout(1000);

        // Click the "Get Token" button
        logWithTime('🔘 Clicking Get Token button...');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);

        // Wait for token to appear
        logWithTime('⏳ Waiting for token to appear...');
        await page.waitForSelector('.token-result, .result, [class*="token"], [class*="result"]', { timeout: 10000 });

        // Extract token
        const token = await page.evaluate(() => {
            // Try multiple selectors for token
            const selectors = [
                '.token-result',
                '.result',
                '[class*="token"]',
                '[class*="result"]',
                'pre',
                'code',
                '.output',
                '.response'
            ];
            
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element && element.textContent && element.textContent.trim().length > 10) {
                    return element.textContent.trim();
                }
            }
            
            // If no specific token element found, look for any text that looks like a token
            const allElements = document.querySelectorAll('*');
            for (const element of allElements) {
                const text = element.textContent;
                if (text && text.length > 20 && text.length < 200 && 
                    (text.includes('token') || text.includes('key') || text.includes('auth'))) {
                    return text.trim();
                }
            }
            
            return null;
        });

        if (!token) {
            throw new Error('Token not found on page');
        }

        logWithTime(`✅ Token extracted successfully: ${token.substring(0, 20)}...`);
        
        // Update global variables
        currentToken = token;
        tokenInfo = {
            token: token,
            timestamp: new Date().toISOString(),
            source: 'website'
        };
        lastUpdate = Date.now();
        consecutiveErrors = 0;

        return { success: true, token: token };

    } catch (error) {
        logWithTime(`❌ Error getting token: ${error.message}`);
        consecutiveErrors++;
        return { success: false, error: error.message };
    } finally {
        isGettingToken = false;
        if (page) {
            try { await page.close(); } catch (e) {}
        }
        if (browser) {
            try { await browser.close(); } catch (e) {}
        }
    }
}

// Auto refresh function
async function autoRefresh() {
    if (consecutiveErrors >= maxConsecutiveErrors) {
        logWithTime('🚨 Too many consecutive errors, restarting server...');
        // Send notification before restart
        if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
            try {
                const fetch = (await import('node-fetch')).default;
                await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: TELEGRAM_CHAT_ID,
                        text: `🚨 Token Server Restarting\nConsecutive errors: ${consecutiveErrors}\nTime: ${new Date().toISOString()}`
                    })
                });
            } catch (e) {
                logWithTime(`Failed to send restart notification: ${e.message}`);
            }
        }
        process.exit(1);
    }

    logWithTime('🔄 Auto token refresh triggered');
    const result = await getToken();
    
    if (!result.success) {
        logWithTime(`❌ Auto refresh failed: ${result.error}`);
    } else {
        logWithTime('✅ Auto refresh successful');
    }
}

// Routes
app.get('/health', (req, res) => {
    monitorProcess();
    res.json({
        status: 'healthy',
        uptime: Date.now() - serverStartTime,
        memory: memoryUsage,
        lastUpdate: lastUpdate ? new Date(lastUpdate).toISOString() : null,
        consecutiveErrors: consecutiveErrors
    });
});

app.get('/token', (req, res) => {
    if (!currentToken) {
        return res.status(404).json({ error: 'No token available' });
    }
    
    res.json({
        token: currentToken,
        info: tokenInfo,
        lastUpdate: lastUpdate ? new Date(lastUpdate).toISOString() : null
    });
});

app.get('/status', (req, res) => {
    res.json({
        status: 'running',
        uptime: Date.now() - serverStartTime,
        memory: memoryUsage,
        hasToken: !!currentToken,
        lastUpdate: lastUpdate ? new Date(lastUpdate).toISOString() : null,
        consecutiveErrors: consecutiveErrors,
        isGettingToken: isGettingToken
    });
});

app.post('/refresh', async (req, res) => {
    logWithTime('🔄 Manual token refresh requested');
    const result = await getToken();
    
    if (result.success) {
        res.json({ success: true, token: result.token });
    } else {
        res.status(500).json({ success: false, error: result.error });
    }
});

app.post('/auto-refresh', async (req, res) => {
    logWithTime('🔄 Auto refresh endpoint called');
    await autoRefresh();
    res.json({ success: true, message: 'Auto refresh triggered' });
});

app.post('/send-token', async (req, res) => {
    if (!currentToken) {
        return res.status(404).json({ error: 'No token available' });
    }
    
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        return res.status(400).json({ error: 'Telegram credentials not configured' });
    }
    
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: `🔑 Current Token:\n\`${currentToken}\`\n\n⏰ Updated: ${lastUpdate ? new Date(lastUpdate).toISOString() : 'Unknown'}`,
                parse_mode: 'Markdown'
            })
        });
        
        if (response.ok) {
            logWithTime('✅ Token sent to Telegram successfully');
            res.json({ success: true, message: 'Token sent to Telegram' });
        } else {
            throw new Error(`Telegram API error: ${response.status}`);
        }
    } catch (error) {
        logWithTime(`❌ Failed to send token to Telegram: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    logWithTime(`🚀 Ultra Robust Token Server (Puppeteer) started on port ${PORT}`);
    logWithTime('📡 Endpoints:');
    logWithTime('   GET  /health - Health check');
    logWithTime('   GET  /token - Get current token');
    logWithTime('   GET  /status - Get server status');
    logWithTime('   POST /refresh - Force refresh token');
    logWithTime('   POST /auto-refresh - Auto refresh (for cron)');
    logWithTime('   POST /send-token - Send token to Telegram');
    logWithTime('🔧 Environment variables:');
    logWithTime(`   KEY_ID: ${KEY_ID ? 'Set' : 'Not set'}`);
    logWithTime(`   TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN ? 'Set' : 'Not set'}`);
    logWithTime(`   TELEGRAM_CHAT_ID: ${TELEGRAM_CHAT_ID ? 'Set' : 'Not set'}`);
    logWithTime(`   PORT: ${PORT}`);
    logWithTime('🎯 Mode: ULTRA ROBUST TOKEN SERVER (PUPPETEER)');
    logWithTime('🔄 Initial token fetch...');
    
    // Initial token fetch
    setTimeout(autoRefresh, 2000);
    
    // Auto refresh every 5 minutes
    setInterval(autoRefresh, 5 * 60 * 1000);
    
    // Process monitoring every minute
    setInterval(monitorProcess, 60 * 1000);
});
