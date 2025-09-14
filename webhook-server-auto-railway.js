import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import puppeteer from 'puppeteer';
import nodemailer from 'nodemailer';

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

// Email sending function
async function sendTokenEmail(token, tokenInfo) {
    if (!GMAIL_USER || !GMAIL_PASS || !EMAIL_TO) {
        logWithTime('⚠️ Email credentials not configured, skipping email notification');
        return;
    }

    try {
        const transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: GMAIL_USER,
                pass: GMAIL_PASS
            }
        });

        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN', { 
            timeZone: 'Asia/Ho_Chi_Minh',
            hour12: false 
        });
        const dateStr = now.toLocaleDateString('vi-VN');

        const subject = `Token ${timeStr} ${dateStr}`;
        
        const htmlContent = `
            <h2>🎉 Token Retrieved Successfully!</h2>
            <p><strong>Time:</strong> ${timeStr} ${dateStr}</p>
            <p><strong>Token:</strong></p>
            <div style="background: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace;">
                ${token}
            </div>
            <h3>Token Information:</h3>
            <ul>
                <li><strong>Subject:</strong> ${tokenInfo.subject}</li>
                <li><strong>Expires:</strong> ${tokenInfo.expires}</li>
                <li><strong>Type:</strong> ${tokenInfo.type}</li>
                <li><strong>Issuer:</strong> ${tokenInfo.issuer}</li>
                <li><strong>Time Left:</strong> ${tokenInfo.timeLeft} hours</li>
            </ul>
            <p><em>This token was automatically retrieved by the Railway server.</em></p>
        `;

        const mailOptions = {
            from: GMAIL_USER,
            to: EMAIL_TO,
            subject: subject,
            html: htmlContent
        };

        await transporter.sendMail(mailOptions);
        logWithTime(`📧 Token sent to email: ${EMAIL_TO}`);
        
    } catch (error) {
        logWithTime(`❌ Failed to send email: ${error.message}`);
    }
}

// Auto token fetching function
async function getTokenFromWebsite() {
    if (isGettingToken) {
        logWithTime('⏳ Token fetch already in progress, skipping...');
        return;
    }

    isGettingToken = true;
    let browser = null;

    try {
        logWithTime('🔑 Getting token from website...');
        
        // Launch browser with optimized settings for Railway
        browser = await puppeteer.launch({
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
                '--disable-renderer-backgrounding'
            ]
        });

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

        // Wait for the form to load
        await page.waitForSelector('input[name="key"]', { timeout: 10000 });
        logWithTime('✅ Form loaded');

        // Fill the key input
        await page.type('input[name="key"]', KEY_ID);
        logWithTime('✅ Key filled');

        // Submit the form
        await page.click('button[type="submit"]');
        logWithTime('✅ Form submitted');

        // Wait for the page to load after submission
        await page.waitForTimeout(3000);

        // Check for cooldown message with multiple patterns
        const cooldownText = await page.$eval('body', el => el.textContent).catch(() => '');
        logWithTime(`🔍 Page content check: ${cooldownText.substring(0, 200)}...`);
        
        // Check for various cooldown patterns
        const cooldownPatterns = [
            /Chờ (\d+):(\d+) nữa/,
            /Chờ (\d+) phút (\d+) giây/,
            /(\d+):(\d+) nữa/,
            /cooldown/i,
            /wait/i
        ];
        
        for (const pattern of cooldownPatterns) {
            const match = cooldownText.match(pattern);
            if (match) {
                let minutes = 0, seconds = 0;
                
                if (pattern.source.includes('phút')) {
                    minutes = parseInt(match[1]);
                    seconds = parseInt(match[2]);
                } else {
                    minutes = parseInt(match[1]);
                    seconds = parseInt(match[2]);
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

        // Look for the "Lấy Token" button with multiple selectors
        let tokenButton = null;
        
        // Try different selectors
        const selectors = [
            'button:has-text("Lấy Token")',
            'button[type="button"]:has-text("Lấy Token")',
            'button:contains("Lấy Token")',
            'input[type="button"][value*="Lấy Token"]',
            'button',
            'input[type="button"]'
        ];
        
        for (const selector of selectors) {
            try {
                tokenButton = await page.$(selector);
                if (tokenButton) {
                    const buttonText = await tokenButton.evaluate(el => el.textContent || el.value || '');
                    if (buttonText.includes('Lấy Token') || buttonText.includes('Token')) {
                        logWithTime(`✅ Found button with selector: ${selector}, text: "${buttonText}"`);
                        break;
                    }
                }
            } catch (e) {
                // Continue to next selector
            }
        }
        
        if (!tokenButton) {
            // Get all buttons for debugging
            const allButtons = await page.$$eval('button, input[type="button"]', buttons => 
                buttons.map(btn => ({
                    text: btn.textContent || btn.value || '',
                    type: btn.type || 'button',
                    className: btn.className || ''
                }))
            );
            logWithTime(`❌ "Lấy Token" button not found. Available buttons: ${JSON.stringify(allButtons)}`);
            return { success: false, error: 'Button not found', availableButtons: allButtons };
        }

        // Click the "Lấy Token" button
        await tokenButton.click();
        logWithTime('🎯 Clicked "Lấy Token" button');

        // Wait for token to appear
        await page.waitForTimeout(2000);

        // Extract token from page
        const token = await page.evaluate(() => {
            // Look for JWT token in various places
            const textContent = document.body.textContent;
            const jwtRegex = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/;
            const match = textContent.match(jwtRegex);
            return match ? match[0] : null;
        });

        if (!token || !token.startsWith('eyJ')) {
            logWithTime('❌ Token not found on page');
            return { success: false, error: 'Token not found' };
        }

        // Decode token info
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

        // Send email notification
        await sendTokenEmail(token, tokenInfo);

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

// Get server status
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
        res.status(500).json({
            success: false,
            message: 'Failed to refresh token',
            error: result.error,
            cooldown: result.cooldown
        });
    }
});

// Auto refresh endpoint (for cron jobs)
app.post('/auto-refresh', async (req, res) => {
    const { secret } = req.body;

    if (secret !== process.env.CRON_SECRET) {
        return res.status(401).json({ error: 'Invalid secret' });
    }

    logWithTime('🔄 Auto token refresh triggered');
    const result = await getTokenFromWebsite();

    res.json({
        success: result.success,
        message: result.success ? 'Token refreshed successfully' : 'Failed to refresh token',
        error: result.error,
        cooldown: result.cooldown
    });
});

// Auto-retry function
async function scheduleRetry(seconds) {
    logWithTime(`⏰ Scheduling retry in ${seconds} seconds (${Math.round(seconds/60)} minutes)`);
    setTimeout(async () => {
        logWithTime('🔄 Auto-retry: Attempting to get token...');
        const result = await getTokenFromWebsite();
        if (!result.success && result.cooldown) {
            // Schedule another retry if still in cooldown
            scheduleRetry(result.cooldown);
        }
    }, seconds * 1000);
}

// Start server and initial token fetch
app.listen(PORT, '0.0.0.0', async () => {
    logWithTime(`🚀 Auto token server started on port ${PORT}`);
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
    logWithTime(`   GMAIL_USER: ${GMAIL_USER ? 'Set' : 'Not set'}`);
    logWithTime(`   EMAIL_TO: ${EMAIL_TO ? 'Set' : 'Not set'}`);
    logWithTime(`   PORT: ${PORT}`);
    
    // Initial token fetch
    logWithTime('🔄 Initial token fetch...');
    setTimeout(async () => {
        const result = await getTokenFromWebsite();
        if (!result.success && result.cooldown) {
            // Schedule retry when cooldown ends
            scheduleRetry(result.cooldown);
        }
    }, 5000);
});
