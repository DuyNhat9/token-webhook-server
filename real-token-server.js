import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { chromium } from 'playwright';
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

// Get real token function
async function getToken() {
    if (isGettingToken) {
        logWithTime('⏳ Token fetch already in progress, skipping...');
        return { success: false, error: 'Already fetching' };
    }

    isGettingToken = true;
    let browser = null;

    try {
        logWithTime('🔑 Getting real token from website...');
        
        // Launch browser with optimized settings for Railway
        browser = await chromium.launch({ 
            headless: true,
            executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--single-process',
                '--disable-crash-reporter',
                '--no-crashpad',
                '--disable-software-rasterizer',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--disable-field-trial-config',
                '--disable-background-networking',
                '--disable-back-forward-cache',
                '--disable-breakpad',
                '--disable-client-side-phishing-detection',
                '--disable-component-extensions-with-background-pages',
                '--disable-component-update',
                '--no-default-browser-check',
                '--disable-default-apps',
                '--disable-extensions',
                '--disable-features=AcceptCHFrame,AvoidUnnecessaryBeforeUnloadCheckSync,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate',
                '--allow-pre-commit-input',
                '--disable-hang-monitor',
                '--disable-ipc-flooding-protection',
                '--disable-popup-blocking',
                '--disable-prompt-on-repost',
                '--force-color-profile=srgb',
                '--metrics-recording-only',
                '--no-first-run',
                '--password-store=basic',
                '--use-mock-keychain',
                '--no-service-autorun',
                '--export-tagged-pdf',
                '--disable-search-engine-choice-screen',
                '--unsafely-disable-devtools-self-xss-warnings',
                '--edge-skip-compat-layer-relaunch',
                '--enable-automation',
                '--hide-scrollbars',
                '--mute-audio',
                '--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4',
                '--remote-debugging-pipe',
                '--no-startup-window'
            ]
        });
        
        const page = await browser.newPage();
        
        // Set viewport and user agent
        await page.setViewport({ width: 1280, height: 720 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Navigate to website
        logWithTime('🌐 Navigating to website...');
        await page.goto('https://tokencursor.io.vn/app', { 
            waitUntil: 'networkidle',
            timeout: 30000 
        });
        
        // Wait for page to load
        await page.waitForTimeout(3000);
        
        // Fill key
        await page.fill('input[name="key"]', KEY_ID);
        logWithTime('✅ Key filled');
        
        // Submit form
        await page.click('button[type="submit"]');
        logWithTime('✅ Form submitted');
        
        // Wait for redirect
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Check for cooldown
        const bodyText = await page.evaluate(() => document.body.innerText || '');
        const cooldownMatch = bodyText.match(/Chờ[:\s]*([^\n]+)/);
        
        if (cooldownMatch) {
            logWithTime(`⏰ Cooldown: ${cooldownMatch[1]}`);
            return { success: false, error: `Token on cooldown: ${cooldownMatch[1]}` };
        }
        
        // Find and click "Lấy Token" button
        const buttons = await page.$$('button');
        let tokenButtonClicked = false;
        
        for (let i = 0; i < buttons.length; i++) {
            const text = await buttons[i].textContent();
            if (text && text.trim() === 'Lấy Token') {
                logWithTime('🎯 Clicking "Lấy Token" button...');
                await buttons[i].click();
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
        const newBodyText = await page.evaluate(() => document.body.innerText || '');
        const jwtMatch = newBodyText.match(/eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/);
        
        if (!jwtMatch) {
            logWithTime('❌ Token not found on page');
            return { success: false, error: 'Token not found' };
        }
        
        const token = jwtMatch[0];
        logWithTime('🎉 Real token acquired successfully!');
        
        // Parse token info
        let tokenInfo = {};
        try {
            const parts = token.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                tokenInfo = {
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
        lastUpdate = new Date().toISOString();
        
        // Send to Telegram
        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN', { 
            timeZone: 'Asia/Ho_Chi_Minh',
            hour12: false 
        });
        const dateStr = now.toLocaleDateString('vi-VN');
        
        const message = `🎉 TOKEN MỚI TỪ RAILWAY\n\n📅 Thời gian: ${timeStr} ${dateStr}\n🔑 Token: ${token}\n👤 Subject: ${tokenInfo.subject}\n⏰ Expires: ${tokenInfo.expires}\n⏱️ Time Left: ${Math.floor(tokenInfo.timeLeft / 3600)}h ${Math.floor((tokenInfo.timeLeft % 3600) / 60)}m\n🤖 From: Railway Token Server`;
        
        await sendToTelegram(message);
        
        return { success: true, token, info: tokenInfo };
        
    } catch (error) {
        logWithTime(`❌ Error getting token: ${error.message}`);
        return { success: false, error: error.message };
    } finally {
        if (browser) {
            await browser.close();
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
        mode: 'real'
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
        mode: 'real'
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
    logWithTime(`🚀 Real token server started on port ${PORT}`);
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
    logWithTime(`🎯 Mode: REAL TOKEN`);
    
    // Initial token fetch
    logWithTime('🔄 Initial token fetch...');
    setTimeout(() => {
        autoRefresh();
    }, 5000);
});
