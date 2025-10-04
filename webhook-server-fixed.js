import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import puppeteer from 'puppeteer';
import nodemailer from 'nodemailer';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;

// Environment variables
const KEY_ID = process.env.KEY_ID;
const API_KEY = process.env.API_KEY;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;
const EMAIL_TO = process.env.EMAIL_TO;

// Global variables
let currentToken = null;
let tokenInfo = null;
let lastUpdate = null;
let serverStartTime = Date.now();
let isGettingToken = false;
let tokenFetchTimeout = null;

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

// Force reset token fetch lock
function resetTokenFetchLock() {
    if (isGettingToken) {
        logWithTime('🔓 Force resetting token fetch lock');
        isGettingToken = false;
    }
    if (tokenFetchTimeout) {
        clearTimeout(tokenFetchTimeout);
        tokenFetchTimeout = null;
    }
}

// Auto token fetching function with improved error handling
async function getTokenFromWebsite() {
    if (isGettingToken) {
        logWithTime('⏳ Token fetch already in progress, skipping...');
        return;
    }

    isGettingToken = true;
    let browser = null;

    // Set timeout to prevent hanging
    const timeoutId = setTimeout(() => {
        logWithTime('⏰ Token fetch timeout - force resetting lock');
        resetTokenFetchLock();
    }, 120000); // 2 minutes timeout

    try {
        logWithTime('🔑 Getting token from website...');
        
        // Launch browser with optimized settings for Railway/Alpine
        const launchOptions = {
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
                '--single-process',
                '--disable-crash-reporter',
                '--no-crashpad',
                '--disable-features=CrashpadAPI',
                '--crashpad-handler=/bin/true',
                '--remote-debugging-pipe',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
            timeout: 60000 // 1 minute launch timeout
        };

        try {
            browser = await puppeteer.launch(launchOptions);
            logWithTime('✅ Browser launched successfully');
        } catch (e) {
            logWithTime(`⚠️ Launch with executablePath failed (${e.message}). Retrying without executablePath...`);
            delete launchOptions.executablePath;
            browser = await puppeteer.launch(launchOptions);
            logWithTime('✅ Browser launched without executablePath');
        }

        const page = await browser.newPage();
        
        // Set viewport and user agent
        await page.setViewport({ width: 1280, height: 720 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Navigate to the website
        logWithTime('🌐 Navigating to website...');
        await page.goto('https://tokencursor.io.vn/app', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });

        // Additional wait for page stability
        await page.waitForTimeout(3000);

        // Wait for the form
        await page.waitForSelector('input[name="key"]', { timeout: 10000 });
        logWithTime('✅ Form loaded');

        // Fill the key input
        await page.evaluate((k) => {
            const el = document.querySelector('input[name="key"]');
            if (el) { el.value = ''; }
        }, KEY_ID);
        await page.type('input[name="key"]', KEY_ID, { delay: 10 });
        logWithTime('✅ Key filled');

        // Submit the form
        const submitBtn = await page.$('button[type="submit"]');
        if (submitBtn) {
            await Promise.all([
                submitBtn.click(),
                page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {}),
            ]);
            logWithTime('✅ Form submitted');
        }

        // Wait for token to appear
        await page.waitForTimeout(5000);
        
        // Try to find token in various ways
        let token = null;
        let tokenInfo = null;

        // Method 1: Look for token in page content
        const pageContent = await page.content();
        const tokenMatch = pageContent.match(/token["\s]*[:=]["\s]*([a-zA-Z0-9\-_]+)/i);
        if (tokenMatch) {
            token = tokenMatch[1];
            logWithTime('✅ Token found in page content');
        }

        // Method 2: Look for token in localStorage
        if (!token) {
            try {
                const localStorage = await page.evaluate(() => {
                    return Object.keys(localStorage).reduce((acc, key) => {
                        acc[key] = localStorage.getItem(key);
                        return acc;
                    }, {});
                });
                
                for (const [key, value] of Object.entries(localStorage)) {
                    if (key.toLowerCase().includes('token') && value && value.length > 10) {
                        token = value;
                        logWithTime('✅ Token found in localStorage');
                        break;
                    }
                }
            } catch (e) {
                logWithTime('⚠️ Could not access localStorage');
            }
        }

        if (token) {
            // Create token info
            tokenInfo = {
                subject: 'Railway Token',
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                timeLeft: 24 * 60 * 60,
                timestamp: new Date().toISOString()
            };

            // Update global variables
            currentToken = token;
            lastUpdate = new Date().toISOString();

            logWithTime(`🎉 Token retrieved successfully: ${token.substring(0, 20)}...`);

            // Send notifications
            await sendTokenNotifications(token, tokenInfo);

            return { success: true, token, info: tokenInfo };
        } else {
            logWithTime('❌ No token found on page');
            return { success: false, error: 'No token found' };
        }

    } catch (error) {
        logWithTime(`❌ Error getting token: ${error.message}`);
        return { success: false, error: error.message };
    } finally {
        clearTimeout(timeoutId);
        if (browser) {
            try {
                await browser.close();
                logWithTime('✅ Browser closed');
            } catch (e) {
                logWithTime(`⚠️ Error closing browser: ${e.message}`);
            }
        }
        isGettingToken = false;
        logWithTime('🔓 Token fetch lock released');
    }
}

// Send token notifications
async function sendTokenNotifications(token, tokenInfo) {
    // Send to Telegram
    try {
        const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
        
        if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
            const message = `🎉 TOKEN MỚI TỪ RAILWAY\n\n🔑 Token: ${token}\n👤 Subject: ${tokenInfo.subject}\n⏰ Expires: ${tokenInfo.expires}\n🤖 From: Railway Token Server`;
            
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: message
                })
            });
            logWithTime('📱 Token sent to Telegram');
        }
    } catch (error) {
        logWithTime(`❌ Failed to send Telegram: ${error.message}`);
    }

    // Send to Email
    try {
        if (GMAIL_USER && GMAIL_PASS && EMAIL_TO) {
            const transporter = nodemailer.createTransporter({
                service: 'gmail',
                auth: {
                    user: GMAIL_USER,
                    pass: GMAIL_PASS
                }
            });

            const mailOptions = {
                from: GMAIL_USER,
                to: EMAIL_TO,
                subject: `Token mới từ Railway - ${new Date().toLocaleString('vi-VN')}`,
                html: `
                    <h2>🎉 Token mới từ Railway</h2>
                    <p><strong>Token:</strong> ${token}</p>
                    <p><strong>Subject:</strong> ${tokenInfo.subject}</p>
                    <p><strong>Expires:</strong> ${tokenInfo.expires}</p>
                    <p><strong>Time:</strong> ${new Date().toLocaleString('vi-VN')}</p>
                `
            };

            await transporter.sendMail(mailOptions);
            logWithTime('📧 Token sent to email');
        }
    } catch (error) {
        logWithTime(`❌ Failed to send email: ${error.message}`);
    }
}

// Auto refresh function
async function autoRefresh() {
    logWithTime('🔄 Auto token refresh triggered');
    
    if (isGettingToken) {
        logWithTime('⏳ Token fetch already in progress, scheduling retry...');
        tokenFetchTimeout = setTimeout(() => {
            logWithTime('⏰ Auto-retry: Attempting to get token...');
            autoRefresh();
        }, 60000); // Retry in 1 minute
        return;
    }

    const result = await getTokenFromWebsite();
    if (result.success) {
        logWithTime('✅ Auto refresh successful');
    } else {
        logWithTime(`❌ Auto refresh failed: ${result.error}`);
        // Schedule retry
        tokenFetchTimeout = setTimeout(() => {
            logWithTime('⏰ Scheduling retry in 60 seconds');
            autoRefresh();
        }, 60000);
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
        isGettingToken: isGettingToken
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
        lastUpdate: lastUpdate
    });
});

app.post('/refresh', async (req, res) => {
    const { apiKey } = req.body;
    
    if (apiKey !== API_KEY) {
        return res.status(401).json({ error: 'Invalid API key' });
    }

    const result = await getTokenFromWebsite();
    
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

app.post('/reset-lock', (req, res) => {
    resetTokenFetchLock();
    res.json({ message: 'Token fetch lock reset' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    logWithTime(`🚀 Auto token server started on port ${PORT}`);
    logWithTime(`📡 Endpoints:`);
    logWithTime(`   GET  /health - Health check`);
    logWithTime(`   GET  /token - Get current token`);
    logWithTime(`   GET  /status - Get server status`);
    logWithTime(`   POST /refresh - Force refresh token (requires API key)`);
    logWithTime(`   POST /auto-refresh - Auto refresh (for cron)`);
    logWithTime(`   POST /reset-lock - Reset token fetch lock`);
    logWithTime(`🔧 Environment variables:`);
    logWithTime(`   KEY_ID: ${KEY_ID ? 'Set' : 'Not set'}`);
    logWithTime(`   API_KEY: ${API_KEY ? 'Set' : 'Not set'}`);
    logWithTime(`   TELEGRAM_BOT_TOKEN: ${process.env.TELEGRAM_BOT_TOKEN ? 'Set' : 'Not set'}`);
    logWithTime(`   TELEGRAM_CHAT_ID: ${process.env.TELEGRAM_CHAT_ID ? 'Set' : 'Not set'}`);
    logWithTime(`   GMAIL_USER: ${GMAIL_USER ? 'Set' : 'Not set'}`);
    logWithTime(`   EMAIL_TO: ${EMAIL_TO ? 'Set' : 'Not set'}`);
    logWithTime(`   PORT: ${PORT}`);
    
    // Initial token fetch
    logWithTime('🔄 Initial token fetch...');
    setTimeout(() => {
        autoRefresh();
    }, 5000); // Wait 5 seconds before first fetch
});
