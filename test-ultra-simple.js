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
        return { success: false, error: 'in_progress' };
    }

    isGettingToken = true;
    let browser = null;

    try {
        logWithTime('🔑 Getting token from website...');
        
        // Simple browser launch options
        const launchOptions = {
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ],
            timeout: 30000
        };

        browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();
        
        // Basic page settings
        await page.setViewport({ width: 1280, height: 720 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Navigate to the website
        logWithTime('🌐 Navigating to website...');
        await page.goto('https://tokencursor.io.vn/app', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });

        // Wait for page stability
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Wait for the form (be flexible on selector)
        let keyInput = await page.$('input[name="key"]');
        if (!keyInput) keyInput = await page.$('input[type="text"]');
        if (!keyInput) keyInput = (await page.$$('input'))[0];
        if (!keyInput) throw new Error('Key input not found');
        logWithTime('✅ Form loaded');

        // Clear and fill the key input
        await keyInput.click({ clickCount: 3 }).catch(() => {});
        await keyInput.press('Backspace').catch(() => {});
        await keyInput.type(KEY_ID, { delay: 30 });
        logWithTime('✅ Key filled');

        // Click Đăng nhập explicitly (fallback to pressing Enter)
        let loginButton = null;
        const candidates = await page.$$('button, [role="button"], input[type="submit"], a');
        for (const el of candidates) {
            const txt = (await el.evaluate(e => (e.textContent || e.value || '').trim().toLowerCase())) || '';
            if (txt.includes('đăng nhập') || txt.includes('dang nhap') || txt.includes('login')) {
                loginButton = el; break;
            }
        }
        if (loginButton) {
            await Promise.all([
                loginButton.click(),
                page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {}),
            ]);
            logWithTime('✅ Clicked Đăng nhập');
        } else {
            await keyInput.press('Enter');
            await new Promise(r => setTimeout(r, 2000));
            logWithTime('🔁 Submitted with Enter');
        }

        // Wait for page to load after submission
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Ensure we are on /app; if still on login, force navigate
        try {
            let urlNow = page.url();
            if (urlNow.includes('/login')) {
                logWithTime('🔄 Still on login page, navigating to /app...');
                await page.goto('https://tokencursor.io.vn/app', { waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
                await new Promise(resolve => setTimeout(resolve, 3000));
                urlNow = page.url();
            }
            logWithTime(`🌍 Current URL: ${urlNow}`);
        } catch (_) {}

        // If an info modal blocks the page, click "Đã hiểu" first
        try {
            for (let i = 0; i < 5; i++) {
                const modalBtn = await (async () => {
                    const candidates = await page.$$('button, [role="button"], .btn');
                    for (const el of candidates) {
                        const txt = (await el.evaluate(e => (e.textContent || e.value || '').trim().toLowerCase())) || '';
                        if (txt.includes('đã hiểu') || txt.includes('da hieu') || txt.includes('ok') || txt.includes('close')) {
                            return el;
                        }
                    }
                    return null;
                })();
                if (modalBtn) {
                    await modalBtn.click().catch(() => {});
                    logWithTime('✅ Clicked modal "Đã hiểu"');
                    await new Promise(r => setTimeout(r, 500));
                    break;
                }
                await new Promise(r => setTimeout(r, 300));
            }
        } catch (e) {
            logWithTime(`⚠️ Modal dismiss attempt failed: ${e.message}`);
        }

        // Get page content for debugging
        const fullPageContent = await page.evaluate(() => document.body.innerText || '');
        logWithTime(`🔍 Full page content (first 500 chars): ${fullPageContent.substring(0, 500)}...`);

        // Look for cooldown
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

        // Look for token button
        let tokenButton = null;
        logWithTime('🔍 Looking for token button...');

        // Scroll to ensure dynamic content loads
        await page.evaluate(async () => { window.scrollTo(0, document.body.scrollHeight); });
        await new Promise(r => setTimeout(r, 500));
        await page.evaluate(async () => { window.scrollTo(0, 0); });

        // Strategy 1: any element whose innerText contains token keywords
        tokenButton = await page.evaluateHandle(() => {
            const keywords = ['lấy token', 'token', 'get token', 'nhận token', 'tạo token'];
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
            const candidates = [];
            while (walker.nextNode()) {
                const el = walker.currentNode;
                const text = (el.textContent || '').trim().toLowerCase();
                if (!text) continue;
                if (keywords.some(k => text.includes(k))) candidates.push(el);
            }
            // Prefer clickable ones
            return candidates.find(el => el.tagName === 'BUTTON' || el.getAttribute('role') === 'button' || typeof el.onclick === 'function' || el.hasAttribute('onclick')) || candidates[0] || null;
        });

        // Strategy 2: explicit selectors if still not found
        if (!tokenButton || (await tokenButton.asElement()) === null) {
            const selectors = [
                'button[class*="token"]',
                'button[id*="token"]',
                'button[data-testid*="token"]',
                'a[href*="token"]',
                'div[role="button"][class*="token"]'
            ];
            for (const sel of selectors) {
                const el = await page.$(sel);
                if (el) { tokenButton = el; break; }
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
            
            return { success: false, error: 'Button not found', availableButtons: allButtons };
        }

        // Click the button
        await (await tokenButton.asElement?.() || tokenButton).click();
        logWithTime('🎯 Clicked "Lấy Token" button');

        // Wait for token to appear
        let token = null;
        for (let attempt = 0; attempt < 5; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
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

        // Decode token
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
    logWithTime(`🚀 Ultra simple test server started on port ${PORT}`);
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
