import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import puppeteer from 'puppeteer';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

// Environment variables
const KEY_ID = process.env.KEY_ID;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Global variables
let currentToken = null;
let tokenInfo = null;
let lastUpdate = null;
let serverStartTime = Date.now();
let isGettingToken = false;

// Middleware
app.use(cors());
app.use(express.json());

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

// Send to Telegram
async function sendToTelegram(message) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        logWithTime('⚠️ Telegram not configured');
        return;
    }

    try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message
            })
        });
        logWithTime('📱 Message sent to Telegram');
    } catch (error) {
        logWithTime(`❌ Failed to send Telegram: ${error.message}`);
    }
}

// Ultra-robust browser launch for Railway
async function launchBrowser() {
    const strategies = [
        // Strategy 1: System Chromium with minimal args
        {
            executablePath: '/usr/bin/chromium-browser',
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ]
        },
        // Strategy 2: System Chromium with more stability flags
        {
            executablePath: '/usr/bin/chromium-browser',
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--single-process',
                '--no-crashpad',
                '--disable-crash-reporter',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-images',
                '--disable-javascript',
                '--disable-default-apps',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--disable-sync',
                '--disable-software-rasterizer',
                '--disable-canvas-aa',
                '--disable-flash-3d',
                '--disable-seccomp-filter-sandbox',
                '--disable-site-isolation-trials',
                '--disable-smooth-scrolling',
                '--disable-system-font-check',
                '--disable-threaded-animation',
                '--disable-threaded-scrolling',
                '--disable-v8-idle-tasks',
                '--disable-zero-copy',
                '--enable-webgl-image-chromium',
                '--force-color-profile=srgb',
                '--ignore-gpu-blocklist',
                '--max-gum-fps=10',
                '--mute-audio',
                '--no-managed-user-data',
                '--no-startup-window',
                '--enable-logging=stderr',
                '--v=1'
            ]
        },
        // Strategy 3: Let Puppeteer find browser
        {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ]
        },
        // Strategy 4: Ultra minimal
        {
            headless: true,
            args: ['--no-sandbox']
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
            
            logWithTime(`✅ Browser launched successfully with strategy ${i + 1}`);
            return browser;
        } catch (error) {
            logWithTime(`❌ Strategy ${i + 1} failed: ${error.message}`);
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
        
        browser = await launchBrowser();
        page = await browser.newPage();
        
        // Set minimal viewport and user agent
        await page.setViewport({ width: 1280, height: 720 });
        await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Navigate to website
        logWithTime('🌐 Navigating to website...');
        await page.goto('https://tokencursor.io.vn/app', { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
        });
        
        // Wait for page to load
        await page.waitForTimeout(3000);
        
        // Fill key
        await page.type('input[name="key"]', KEY_ID);
        logWithTime('✅ Key filled');
        
        // Submit form
        await page.click('button[type="submit"]');
        logWithTime('✅ Form submitted');
        
        // Wait for redirect
        await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);
        
        // Check for cooldown
        const bodyText = await page.evaluate(() => document.body.innerText);
        const cooldownMatch = bodyText.match(/Chờ[:\s]*([^\n]+)/);
        
        if (cooldownMatch) {
            logWithTime(`⏰ Cooldown: ${cooldownMatch[1]}`);
            return { success: false, error: `Token on cooldown: ${cooldownMatch[1]}` };
        }
        
        // Find and click "Lấy Token" button
        const buttons = await page.$$('button');
        let tokenButtonClicked = false;
        
        for (const button of buttons) {
            const text = await page.evaluate(el => el.textContent, button);
            if (text && text.trim() === 'Lấy Token') {
                logWithTime('🎯 Clicking "Lấy Token" button...');
                await button.click();
                tokenButtonClicked = true;
                break;
            }
        }
        
        if (!tokenButtonClicked) {
            logWithTime('❌ "Lấy Token" button not available');
            return { success: false, error: 'Button not available' };
        }
        
        // Wait for token to appear
        await page.waitForTimeout(3000);
        
        // Extract token
        const newBodyText = await page.evaluate(() => document.body.innerText);
        const jwtMatch = newBodyText.match(/eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/);
        
        if (!jwtMatch) {
            logWithTime('❌ Token not found on page');
            return { success: false, error: 'Token not found' };
        }
        
        const token = jwtMatch[0];
        logWithTime('🎉 Real token acquired successfully!');
        
        // Parse token info
        let parsedTokenInfo = {};
        try {
            const parts = token.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                parsedTokenInfo = {
                    subject: payload.sub || 'N/A',
                    expires: payload.exp ? new Date(payload.exp * 1000).toLocaleString('vi-VN') : 'N/A',
                    type: payload.type || 'N/A',
                    issuer: payload.iss || 'N/A',
                    timeLeft: payload.exp ? Math.max(0, payload.exp - Math.floor(Date.now() / 1000)) : 0
                };
            }
        } catch (e) {
            logWithTime('⚠️ Could not parse token info');
        }
        
        // Update global variables
        currentToken = token;
        tokenInfo = parsedTokenInfo;
        lastUpdate = new Date().toISOString();
        
        // Send to Telegram
        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN', { 
            timeZone: 'Asia/Ho_Chi_Minh',
            hour12: false 
        });
        const dateStr = now.toLocaleDateString('vi-VN');
        
        const message = `🎉 TOKEN MỚI TỪ RAILWAY\n\n📅 Thời gian: ${timeStr} ${dateStr}\n🔑 Token: ${token}\n👤 Subject: ${parsedTokenInfo.subject}\n⏰ Expires: ${parsedTokenInfo.expires}\n⏱️ Time Left: ${Math.floor(parsedTokenInfo.timeLeft / 3600)}h ${Math.floor((parsedTokenInfo.timeLeft % 3600) / 60)}m\n🤖 From: Railway Ultra Token Server`;
        
        await sendToTelegram(message);
        
        return { success: true, token, info: parsedTokenInfo };
        
    } catch (error) {
        logWithTime(`❌ Error getting token: ${error.message}`);
        return { success: false, error: error.message };
    } finally {
        if (page) {
            try {
                await page.close();
            } catch (e) {
                logWithTime('⚠️ Error closing page: ' + e.message);
            }
        }
        if (browser) {
            try {
                await browser.close();
            } catch (e) {
                logWithTime('⚠️ Error closing browser: ' + e.message);
            }
        }
        isGettingToken = false;
    }
}

// Auto refresh function
async function autoRefresh() {
    logWithTime('🔄 Auto token refresh triggered');
    
    if (isGettingToken) {
        logWithTime('⏳ Token fetch already in progress, skipping...');
        return;
    }

    const result = await getToken();
    if (result.success) {
        logWithTime('✅ Auto refresh successful');
    } else {
        logWithTime(`❌ Auto refresh failed: ${result.error}`);
    }
}

// Routes
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: (Date.now() - serverStartTime) / 1000,
        lastUpdate: lastUpdate,
        hasToken: !!currentToken,
        isGettingToken: isGettingToken
    });
});

app.get('/status', (req, res) => {
    res.json({
        server: 'running',
        uptime: (Date.now() - serverStartTime) / 1000,
        hasToken: !!currentToken,
        lastUpdate: lastUpdate,
        tokenInfo: tokenInfo,
        isGettingToken: isGettingToken,
        mode: 'ultra-robust-puppeteer'
    });
});

app.get('/token', (req, res) => {
    if (!currentToken) {
        return res.status(404).json({
            error: 'No token available',
            message: 'Token not yet retrieved. Use /refresh to get a new token.'
        });
    }

    res.json({
        token: currentToken,
        info: tokenInfo,
        lastUpdate: lastUpdate,
        mode: 'ultra-robust-puppeteer'
    });
});

app.post('/refresh', async (req, res) => {
    const result = await getToken();
    
    if (result.success) {
        res.json({
            success: true,
            message: 'Token refreshed successfully',
            token: result.token,
            info: result.info
        });
    } else {
        res.status(500).json({
            success: false,
            error: result.error
        });
    }
});

app.post('/auto-refresh', async (req, res) => {
    autoRefresh();
    res.json({ message: 'Auto refresh triggered' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    logWithTime(`🚀 Ultra Robust Token Server (Puppeteer) started on port ${PORT}`);
    logWithTime(`📡 Endpoints:`);
    logWithTime(`   GET  /health - Health check`);
    logWithTime(`   GET  /token - Get current token`);
    logWithTime(`   GET  /status - Get server status`);
    logWithTime(`   POST /refresh - Force refresh token`);
    logWithTime(`   POST /auto-refresh - Auto refresh (for cron)`);
    logWithTime(`🔧 Environment variables:`);
    logWithTime(`   KEY_ID: ${KEY_ID ? 'Set' : 'Not set'}`);
    logWithTime(`   TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN ? 'Set' : 'Not set'}`);
    logWithTime(`   TELEGRAM_CHAT_ID: ${TELEGRAM_CHAT_ID ? 'Set' : 'Not set'}`);
    logWithTime(`   PORT: ${PORT}`);
    logWithTime(`🎯 Mode: ULTRA ROBUST TOKEN SERVER (PUPPETEER)`);
    
    // Initial token fetch
    logWithTime('🔄 Initial token fetch...');
    setTimeout(() => {
        autoRefresh();
    }, 5000);
});