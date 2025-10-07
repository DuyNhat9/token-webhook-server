import 'dotenv/config';
import express from 'express';
import puppeteer from 'puppeteer';

const app = express();
const PORT = process.env.PORT || 3000;

// Environment variables
const KEY_ID = process.env.KEY_ID || 'F24AAF7D-8CE8-4425-99A2-1C89CD24D954';

// Global variables
let currentToken = null;
let tokenInfo = null;
let lastUpdate = null;
let serverStartTime = Date.now();
let isGettingToken = false;

// Middleware
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

// Enhanced token fetching function
async function getTokenFromWebsite() {
    if (isGettingToken) {
        logWithTime('⏳ Token fetch already in progress, skipping...');
        return;
    }

    isGettingToken = true;
    let browser = null;

    try {
        logWithTime('🔑 Getting token from website...');
        
        // Enhanced browser launch options
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
                '--disable-features=VizDisplayCompositor',
                '--disable-extensions',
                '--disable-plugins',
                '--disable-images',
                '--disable-javascript',
                '--disable-default-apps'
            ],
            timeout: 30000
        };

        browser = await puppeteer.launch(launchOptions);
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

        // Navigate to the website
        logWithTime('🌐 Navigating to website...');
        await page.goto('https://tokencursor.io.vn/app', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });

        // Wait for page stability
        await page.waitForTimeout(3000);

        // Wait for the form
        await page.waitForSelector('input[name="key"]', { timeout: 15000 });
        logWithTime('✅ Form loaded');

        // Clear and fill the key input
        await page.evaluate((k) => {
            const el = document.querySelector('input[name="key"]');
            if (el) { 
                el.value = '';
                el.focus();
            }
        }, KEY_ID);
        
        await page.type('input[name="key"]', KEY_ID, { delay: 50 });
        logWithTime('✅ Key filled');

        // Submit the form
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

        // Enhanced cooldown detection
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
        isGettingToken: isGettingToken
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

// Force refresh endpoint
app.post('/refresh', async (req, res) => {
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
        res.status(500).json({
            success: false,
            message: 'Failed to refresh token',
            error: result.error,
            cooldown: result.cooldown,
            availableButtons: result.availableButtons
        });
    }
});

// Start server and initial token fetch
app.listen(PORT, '0.0.0.0', async () => {
    logWithTime(`🚀 Simple test server started on port ${PORT}`);
    logWithTime(`📡 Endpoints:`);
    logWithTime(`   GET  /health - Health check`);
    logWithTime(`   GET  /token - Get current token`);
    logWithTime(`   POST /refresh - Force refresh token`);
    
    logWithTime(`🔧 Environment variables:`);
    logWithTime(`   KEY_ID: ${KEY_ID ? 'Set' : 'Not set'}`);
    logWithTime(`   PORT: ${PORT}`);
    
    // Initial token fetch
    logWithTime('🔄 Initial token fetch...');
    setTimeout(async () => {
        const result = await getTokenFromWebsite();
        if (result.success) {
            logWithTime('🎉 Token retrieved successfully!');
            logWithTime(`🔑 Token: ${result.token}`);
            logWithTime(`📄 Info: ${JSON.stringify(result.info, null, 2)}`);
        } else {
            logWithTime(`❌ Token fetch failed: ${result.error}`);
        }
    }, 5000);
});