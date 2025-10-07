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
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Global variables
let currentToken = null;
let tokenInfo = null;
let lastUpdate = null;
let serverStartTime = Date.now();
let isGettingToken = false;
let retryTimeout = null;

// Middleware
app.use(cors());
app.use(express.json());

// Enhanced logging function
function logWithTime(message) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { 
        timeZone: 'Asia/Ho_Chi_Minh',
        hour12: false 
    });
    const dateStr = now.toLocaleDateString('vi-VN');
    console.log(`[${timeStr} ${dateStr}] ${message}`);
}

// Enhanced Telegram sending function
async function sendAllTokensTelegram(token, tokenInfo) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        logWithTime('⚠️ Telegram credentials not configured, skipping Telegram notification');
        return;
    }

    try {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN', { 
            timeZone: 'Asia/Ho_Chi_Minh',
            hour12: false 
        });
        const dateStr = now.toLocaleDateString('vi-VN');

        let message = `🎉 *TOKEN MỚI TỪ RAILWAY*\n\n`;
        message += `📅 *Thời gian:* ${timeStr} ${dateStr}\n`;
        message += `🔑 *Token:*\n\`\`\`${token}\`\`\`\n`;
        message += `👤 *Subject:* ${tokenInfo.subject}\n`;
        message += `⏰ *Expires:* ${tokenInfo.expires}\n`;
        message += `⏱️ *Time Left:* ${Math.floor(tokenInfo.timeLeft / 3600)}h ${Math.floor((tokenInfo.timeLeft % 3600) / 60)}m\n`;
        message += `🏷️ *Type:* ${tokenInfo.type}\n`;
        message += `🏢 *Issuer:* ${tokenInfo.issuer}\n`;
        message += `🤖 *From:* Railway Token Server`;

        logWithTime('📤 Sending token to Telegram...');
        const telegramMessage = {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        };
        
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
            try {
                const telegramResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(telegramMessage),
                    timeout: 10000
                });
                
                const telegramData = await telegramResponse.json();
                
                if (telegramData.ok) {
                    logWithTime('✅ Token sent to Telegram successfully!');
                    logWithTime('📱 Message ID:', telegramData.result.message_id);
                    break;
                } else {
                    throw new Error(telegramData.description || 'Unknown error');
                }
            } catch (error) {
                retryCount++;
                logWithTime(`❌ Telegram attempt ${retryCount}/${maxRetries} failed: ${error.message}`);
                
                if (retryCount < maxRetries) {
                    logWithTime(`⏳ Retrying Telegram in 2 seconds...`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } else {
                    logWithTime(`❌ All Telegram attempts failed.`);
                }
            }
        }
        
    } catch (error) {
        logWithTime('❌ Telegram failed:', error.message);
    }
}

// Enhanced token fetching function with better debugging
async function getTokenFromWebsite() {
    if (isGettingToken) {
        logWithTime('⏳ Token fetch already in progress, skipping...');
        return;
    }

    isGettingToken = true;
    let browser = null;

    try {
        logWithTime('🔑 Getting token from website...');
        
        // Enhanced browser launch options for Railway
        const isContainer = !!process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CONTAINERIZED === '1';
        const commonArgs = isContainer ? [
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
            '--disable-features=VizDisplayCompositor',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-images',
            '--disable-javascript',
            '--disable-default-apps'
        ] : [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ];

        const launchOptions = {
            headless: 'new',
            args: commonArgs,
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
            timeout: 30000
        };

        try {
            browser = await puppeteer.launch(launchOptions);
        } catch (e) {
            if (launchOptions.executablePath) {
                logWithTime(`⚠️ Launch with executablePath failed (${e.message}). Retrying without executablePath...`);
                delete launchOptions.executablePath;
                browser = await puppeteer.launch(launchOptions);
            } else {
                throw e;
            }
        }

        const page = await browser.newPage();
        
        // Enhanced page settings
        await page.setViewport({ width: 1280, height: 720 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Set request interception to block unnecessary resources
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            const resourceType = req.resourceType();
            if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // Navigate to the website with enhanced error handling
        logWithTime('🌐 Navigating to website...');
        await page.goto('https://tokencursor.io.vn/app', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });

        // Wait for page stability
        await page.waitForTimeout(3000);

        // Wait for the form with enhanced selector detection
        await page.waitForSelector('input[name="key"]', { timeout: 15000 });
        logWithTime('✅ Form loaded');

        // Clear and fill the key input with enhanced typing
        await page.evaluate((k) => {
            const el = document.querySelector('input[name="key"]');
            if (el) { 
                el.value = '';
                el.focus();
            }
        }, KEY_ID);
        
        await page.type('input[name="key"]', KEY_ID, { delay: 50 });
        logWithTime('✅ Key filled');

        // Submit the form with enhanced click handling
        const submitBtn = await page.$('button[type="submit"]');
        if (submitBtn) {
            await Promise.all([
                submitBtn.click(),
                page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {}),
            ]);
            logWithTime('✅ Form submitted');
        }

        // Wait for page to load after submission
        await page.waitForTimeout(5000);

        // Enhanced network idle wait
        try {
            await page.waitForNetworkIdle({ timeout: 15000 });
        } catch (error) {
            logWithTime('⚠️ Network idle wait timeout, continuing...');
        }

        // Navigate to /app if still on /login
        try {
            const urlNow = page.url();
            if (urlNow.includes('/login')) {
                logWithTime('🔄 Still on login page, navigating to /app...');
                await page.goto('https://tokencursor.io.vn/app', { waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
                await page.waitForTimeout(3000);
            }
        } catch (_) {}

        // Enhanced debugging - Get full page content
        const fullPageContent = await page.evaluate(() => document.body.innerText || '');
        logWithTime(`🔍 Full page content (first 500 chars): ${fullPageContent.substring(0, 500)}...`);

        // Enhanced cooldown detection with more patterns
        const cooldownPatterns = [
            /Chờ (\d+):(\d+) nữa/,
            /Chờ (\d+) phút (\d+) giây/,
            /(\d+):(\d+) nữa/,
            /cooldown/i,
            /wait/i,
            /Chờ.*(\d+).*phút/,
            /Chờ.*(\d+).*giây/,
            /Thời gian chờ/,
            /Please wait/
        ];
        
        for (const pattern of cooldownPatterns) {
            const match = fullPageContent.match(pattern);
            if (match) {
                let minutes = 0, seconds = 0;
                
                if (pattern.source.includes('phút')) {
                    minutes = parseInt(match[1]);
                    seconds = parseInt(match[2] || 0);
                } else {
                    minutes = parseInt(match[1]);
                    seconds = parseInt(match[2] || 0);
                }
                
                const totalSeconds = minutes * 60 + seconds;
                logWithTime(`⏰ Cooldown detected: ${minutes}:${seconds} remaining (${totalSeconds}s total)`);
                
                // Send webhook notification about cooldown
                if (WEBHOOK_URL) {
                    try {
                        await fetch(WEBHOOK_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                content: `⏰ **Token Cooldown Active**\n\n⏳ **Time remaining:** ${minutes}:${seconds}\n🔄 **Next attempt:** ${new Date(Date.now() + totalSeconds * 1000).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`
                            })
                        });
                    } catch (error) {
                        logWithTime(`⚠️ Webhook notification failed: ${error.message}`);
                    }
                }
                
                return { success: false, cooldown: totalSeconds, reason: 'cooldown' };
            }
        }

        // ULTRA ENHANCED button finding with multiple strategies
        let tokenButton = null;
        
        logWithTime('🔍 Starting enhanced button search...');
        
        // Strategy 1: Look for exact text match with multiple variations
        const allButtonsHandles = await page.$$('button, input[type="button"], a, div[role="button"], span[role="button"], div[onclick]');
        logWithTime(`🔍 Found ${allButtonsHandles.length} potential buttons`);
        
        for (const h of allButtonsHandles) {
            const txt = (await h.evaluate(el => (el.textContent || el.value || '').trim())).toLowerCase();
            logWithTime(`🔍 Checking button: "${txt}"`);
            
            if (txt.includes('lấy token') || 
                txt.includes('token') || 
                txt.includes('lấy') ||
                txt.includes('get token') ||
                txt.includes('nhận token') ||
                txt.includes('tạo token')) {
                tokenButton = h;
                logWithTime(`✅ Found token button: "${txt}"`);
                break;
            }
        }
        
        // Strategy 2: Look for button with specific attributes
        if (!tokenButton) {
            logWithTime('🔍 Trying attribute-based search...');
            const attributeSelectors = [
                'button[class*="token"]',
                'button[id*="token"]', 
                'button[data-testid*="token"]',
                'button[onclick*="token"]',
                'input[value*="token"]',
                'a[href*="token"]',
                'div[onclick*="token"]'
            ];
            
            for (const selector of attributeSelectors) {
                tokenButton = await page.$(selector);
                if (tokenButton) {
                    logWithTime(`✅ Found token button by selector: ${selector}`);
                    break;
                }
            }
        }
        
        // Strategy 3: Look for any clickable element with token-related text
        if (!tokenButton) {
            logWithTime('🔍 Trying comprehensive text search...');
            const allClickableElements = await page.$$('*');
            
            for (const element of allClickableElements) {
                try {
                    const tagName = await element.evaluate(el => el.tagName.toLowerCase());
                    const text = await element.evaluate(el => (el.textContent || '').trim().toLowerCase());
                    const onclick = await element.evaluate(el => el.onclick ? 'has-onclick' : 'no-onclick');
                    
                    if ((tagName === 'button' || tagName === 'div' || tagName === 'span' || tagName === 'a') &&
                        (text.includes('token') || text.includes('lấy') || text.includes('get')) &&
                        (onclick === 'has-onclick' || tagName === 'button')) {
                        tokenButton = element;
                        logWithTime(`✅ Found potential token button: "${text}" (${tagName})`);
                        break;
                    }
                } catch (e) {
                    // Skip elements that can't be evaluated
                    continue;
                }
            }
        }
        
        if (!tokenButton) {
            // Get all buttons for debugging
            const allButtons = await page.$$eval('button, input[type="button"], a, div[role="button"]', buttons => 
                buttons.map(btn => ({
                    text: btn.textContent || btn.value || '',
                    type: btn.type || 'button',
                    className: btn.className || '',
                    id: btn.id || '',
                    onclick: btn.onclick ? 'has-onclick' : 'no-onclick',
                    tagName: btn.tagName.toLowerCase()
                }))
            );
            
            logWithTime(`❌ "Lấy Token" button not found. Available buttons: ${JSON.stringify(allButtons, null, 2)}`);
            
            // Also get page HTML for debugging
            const pageHTML = await page.content();
            logWithTime(`🔍 Page HTML (first 1000 chars): ${pageHTML.substring(0, 1000)}...`);
            
            return { success: false, error: 'Button not found', availableButtons: allButtons, pageHTML: pageHTML.substring(0, 2000) };
        }

        // Enhanced button clicking
        await tokenButton.click();
        logWithTime('🎯 Clicked "Lấy Token" button');

        // Wait for token to appear with multiple attempts
        let token = null;
        for (let attempt = 0; attempt < 5; attempt++) {
            await page.waitForTimeout(1000);
            
            token = await page.evaluate(() => {
                const textContent = document.body.textContent;
                const jwtRegex = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/;
                const match = textContent.match(jwtRegex);
                return match ? match[0] : null;
            });
            
            if (token && token.startsWith('eyJ')) {
                break;
            }
            
            logWithTime(`⏳ Token not found yet, attempt ${attempt + 1}/5...`);
        }

        if (!token || !token.startsWith('eyJ')) {
            logWithTime('❌ Token not found on page after multiple attempts');
            return { success: false, error: 'Token not found' };
        }

        // Enhanced token decoding
        const parts = token.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        
        tokenInfo = {
            subject: payload.sub,
            expires: new Date(payload.exp * 1000).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
            type: payload.type,
            issuer: payload.iss,
            timeLeft: Math.round((payload.exp * 1000 - Date.now()) / (1000 * 60 * 60))
        };

        currentToken = token;
        lastUpdate = new Date().toISOString();

        logWithTime('🎉 Token acquired successfully!');
        logWithTime(`📄 Token Info: ${JSON.stringify(tokenInfo, null, 2)}`);

        // Send Telegram notification
        await sendAllTokensTelegram(token, tokenInfo);

        // Send webhook notification
        if (WEBHOOK_URL) {
            try {
                await fetch(WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: `🎉 **Token Retrieved Successfully!**\n\`\`\`json\n${JSON.stringify(tokenInfo, null, 2)}\n\`\`\``
                    })
                });
            } catch (error) {
                logWithTime(`⚠️ Webhook notification failed: ${error.message}`);
            }
        }

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

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: (Date.now() - serverStartTime) / 1000,
        lastUpdate: lastUpdate,
        hasToken: !!currentToken,
        isGettingToken: isGettingToken,
        nextRetry: retryTimeout ? 'scheduled' : 'none'
    });
});

// Get current token
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

// Get server status
app.get('/status', (req, res) => {
    res.json({
        server: 'running',
        uptime: (Date.now() - serverStartTime) / 1000,
        hasToken: !!currentToken,
        lastUpdate: lastUpdate,
        tokenInfo: tokenInfo,
        isGettingToken: isGettingToken,
        nextRetry: retryTimeout ? 'scheduled' : 'none'
    });
});

// Force refresh endpoint
app.post('/refresh', async (req, res) => {
    const { apiKey } = req.body;

    if (apiKey !== API_KEY) {
        return res.status(401).json({ error: 'Invalid API key' });
    }

    logWithTime('🔄 Manual token refresh requested');
    const result = await getTokenFromWebsite();

    if (result.success) {
        res.json({
            success: true,
            message: 'Token refreshed successfully',
            token: result.token,
            info: result.info
        });
    } else {
        if (result.cooldown) {
            try {
                scheduleRetry(result.cooldown);
            } catch (e) {
                logWithTime(`⚠️ Failed to schedule retry after cooldown: ${e.message}`);
            }
        }
        res.status(500).json({
            success: false,
            message: 'Failed to refresh token',
            error: result.error,
            cooldown: result.cooldown,
            availableButtons: result.availableButtons
        });
    }
});

// Auto refresh endpoint (for cron jobs)
app.post('/auto-refresh', async (req, res) => {
    const { secret } = req.body;

    if (secret !== process.env.CRON_SECRET) {
        return res.status(401).json({ error: 'Invalid secret' });
    }

    logWithTime('🔄 Auto token refresh triggered (async)');
    res.status(202).json({ success: true, message: 'Refresh started' });

    setImmediate(async () => {
        const result = await getTokenFromWebsite();
        
        if (!result) {
            logWithTime('⏳ Token fetch already in progress (async trigger), will retry in 60s');
            return scheduleRetry(60);
        }
        
        if (!result.success && result.cooldown) {
            scheduleRetry(result.cooldown);
        } else if (!result.success) {
            const retryDelay = Math.min(300, 60 * Math.pow(2, 0));
            scheduleRetry(retryDelay);
        }
    });
});

// Enhanced retry function with exponential backoff
async function scheduleRetry(seconds) {
    if (retryTimeout) {
        clearTimeout(retryTimeout);
    }
    
    logWithTime(`⏰ Scheduling retry in ${seconds} seconds (${Math.round(seconds/60)} minutes)`);
    retryTimeout = setTimeout(async () => {
        logWithTime('🔄 Auto-retry: Attempting to get token...');
        const result = await getTokenFromWebsite();
        
        if (!result) {
            logWithTime('⏳ Token fetch already in progress, scheduling short retry in 60s');
            return scheduleRetry(60);
        }
        
        if (!result.success && result.cooldown) {
            scheduleRetry(result.cooldown);
        } else if (!result.success) {
            const retryDelay = Math.min(300, 60 * Math.pow(2, 0));
            scheduleRetry(retryDelay);
        }
    }, seconds * 1000);
}

// Start server and initial token fetch
app.listen(PORT, '0.0.0.0', async () => {
    logWithTime(`🚀 Enhanced Railway token server started on port ${PORT}`);
    logWithTime(`📡 Endpoints:`);
    logWithTime(`   GET  /health - Health check`);
    logWithTime(`   GET  /token - Get current token`);
    logWithTime(`   GET  /status - Get server status`);
    logWithTime(`   POST /refresh - Force refresh token (requires API key)`);
    logWithTime(`   POST /auto-refresh - Auto refresh (for cron)`);
    
    logWithTime(`🔧 Environment variables:`);
    logWithTime(`   KEY_ID: ${KEY_ID ? 'Set' : 'Not set'}`);
    logWithTime(`   API_KEY: ${API_KEY ? 'Set' : 'Not set'}`);
    logWithTime(`   WEBHOOK_URL: ${WEBHOOK_URL ? 'Set' : 'Not set'}`);
    logWithTime(`   TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN ? 'Set' : 'Not set'}`);
    logWithTime(`   TELEGRAM_CHAT_ID: ${TELEGRAM_CHAT_ID ? 'Set' : 'Not set'}`);
    logWithTime(`   GMAIL_USER: ${GMAIL_USER ? 'Set' : 'Not set'}`);
    logWithTime(`   EMAIL_TO: ${EMAIL_TO ? 'Set' : 'Not set'}`);
    logWithTime(`   PORT: ${PORT}`);
    
    // Initial token fetch
    logWithTime('🔄 Initial token fetch...');
    setTimeout(async () => {
        const result = await getTokenFromWebsite();
        if (!result.success && result.cooldown) {
            scheduleRetry(result.cooldown);
        } else if (!result.success) {
            const retryDelay = Math.min(300, 60 * Math.pow(2, 0));
            scheduleRetry(retryDelay);
        }
    }, 5000);
});
