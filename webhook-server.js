#!/usr/bin/env node
import 'dotenv/config';
import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';
import express from 'express';
import cors from 'cors';

const KEY_ID = process.env.KEY_ID || 'F24AAF7D-8CE8-4425-99A2-1C89CD24D954';
const WEBHOOK_URL = process.env.WEBHOOK_URL; // Discord/Slack webhook
const API_KEY = process.env.API_KEY || 'your-secret-api-key'; // Bảo mật API
const PORT = process.env.PORT || 3000;

// Log environment variables for debugging
console.log('🔧 Environment variables:');
console.log(`   KEY_ID: ${KEY_ID ? 'Set' : 'Not set'}`);
console.log(`   API_KEY: ${API_KEY ? 'Set' : 'Not set'}`);
console.log(`   WEBHOOK_URL: ${WEBHOOK_URL ? 'Set' : 'Not set'}`);
console.log(`   PORT: ${PORT}`);

const app = express();
app.use(cors());
app.use(express.json());

// Store latest token
let latestToken = null;
let tokenInfo = null;
let lastUpdate = null;

function logWithTime(message) {
    const now = new Date().toLocaleString('vi-VN');
    const logMessage = `[${now}] ${message}`;
    console.log(logMessage);
    return logMessage;
}

async function notify(message) {
    if (WEBHOOK_URL) {
        try {
            await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text: message,
                    username: 'Token Server',
                    icon_emoji: ':robot_face:'
                })
            });
            logWithTime('📢 Notification sent');
        } catch (error) {
            logWithTime(`⚠️  Failed to send notification: ${error.message}`);
        }
    }
}

async function getToken() {
    const browser = await chromium.launch({ 
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
            '--disable-crashpad',
            '--remote-debugging-pipe',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-images',
            '--disable-javascript',
            '--disable-default-apps'
        ]
    });
    const page = await browser.newPage();

    try {
        logWithTime('🔑 Getting token...');
        await page.goto('https://tokencursor.io.vn/app', { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
        });
        
        // Fill key
        await page.fill('input[name="key"]', KEY_ID);
        
        // Submit
        await page.click('button[type="submit"]');
        
        // Wait for redirect
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        // Get page content to check status
        const bodyText = await page.evaluate(() => document.body.innerText || '');
        
        // Check for cooldown
        const cooldownMatch = bodyText.match(/Chờ[:\s]*([^\\n]+)/);
        if (cooldownMatch) {
            const cooldown = cooldownMatch[1];
            logWithTime(`⏰ Token on cooldown: ${cooldown}`);
            return { success: false, cooldown: cooldown };
        }
        
        // Find and click "Lấy Token" button
        const buttons = await page.$$('button');
        let tokenButtonClicked = false;
        
        for (const btn of buttons) {
            const text = await btn.textContent();
            if (text && (text.trim() === 'Lấy Token' || text.includes('Lấy Token'))) {
                logWithTime('🎯 Clicking "Lấy Token" button...');
                await btn.click();
                tokenButtonClicked = true;
                break;
            }
        }
        
        // Try alternative selectors
        if (!tokenButtonClicked) {
            try {
                const tokenBtn = await page.$('button:has-text("Lấy Token")');
                if (tokenBtn) {
                    logWithTime('🎯 Clicking "Lấy Token" button (alternative selector)...');
                    await tokenBtn.click();
                    tokenButtonClicked = true;
                }
            } catch (e) {
                logWithTime('⚠️  Alternative selector failed');
            }
        }
        
        if (!tokenButtonClicked) {
            logWithTime('❌ "Lấy Token" button not available - checking for cooldown...');
            // Check if there's a cooldown message
            const cooldownText = await page.evaluate(() => {
                const body = document.body.innerText || '';
                const cooldownMatch = body.match(/Chờ[:\s]*([^\n]+)/);
                return cooldownMatch ? cooldownMatch[1] : null;
            });
            
            if (cooldownText) {
                return { success: false, cooldown: cooldownText };
            }
            
            return { success: false, error: 'Button not available' };
        }
        
        // Wait for token to appear
        await page.waitForTimeout(3000);
        
        // Extract token from page text
        const newBodyText = await page.evaluate(() => document.body.innerText || '');
        const jwtMatch = newBodyText.match(/eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/);
        
        if (!jwtMatch) {
            logWithTime('❌ Token not found on page');
            return { success: false, error: 'Token not found' };
        }
        
        const token = jwtMatch[0];
        logWithTime('🎉 Token acquired successfully!');
        
        // Decode token info
        let tokenData = null;
        try {
            const parts = token.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                tokenData = {
                    subject: payload.sub,
                    expires: payload.exp ? new Date(payload.exp * 1000).toLocaleString('vi-VN') : null,
                    type: payload.type,
                    issuer: payload.iss,
                    scope: payload.scope,
                    timeLeft: payload.exp ? Math.floor((payload.exp * 1000 - Date.now()) / (1000 * 60 * 60)) : null
                };
            }
        } catch (err) {
            logWithTime('⚠️  Could not decode token info');
        }
        
        // Update global variables
        latestToken = token;
        tokenInfo = tokenData;
        lastUpdate = new Date();
        
        // Save to file
        fs.writeFileSync('token.txt', token, 'utf8');
        logWithTime(`💾 Token saved`);
        
        // Send notification
        await notify(`🎉 New token retrieved!\nExpires: ${tokenData?.expires || 'N/A'}\nTime left: ${tokenData?.timeLeft || 'N/A'} hours`);
        
        return { success: true, token: token, info: tokenData };
        
    } catch (error) {
        const errorMsg = `❌ Error: ${error.message}`;
        logWithTime(errorMsg);
        return { success: false, error: error.message };
    } finally {
        await browser.close();
    }
}

// API Routes

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        uptime: process.uptime(),
        lastUpdate: lastUpdate,
        hasToken: !!latestToken
    });
});

// Get current token (public)
app.get('/token', (req, res) => {
    if (!latestToken) {
        return res.status(404).json({ error: 'No token available' });
    }
    
    res.json({
        token: latestToken,
        info: tokenInfo,
        lastUpdate: lastUpdate,
        timeLeft: tokenInfo?.timeLeft
    });
});

// Force refresh token (protected)
app.post('/refresh', async (req, res) => {
    const { apiKey } = req.body;
    
    if (apiKey !== API_KEY) {
        return res.status(401).json({ error: 'Invalid API key' });
    }
    
    logWithTime('🔄 Manual token refresh requested');
    const result = await getToken();
    
    if (result.success) {
        res.json({
            success: true,
            message: 'Token refreshed successfully',
            token: result.token,
            info: result.info
        });
    } else {
        res.status(400).json({
            success: false,
            message: result.error || 'Failed to refresh token',
            cooldown: result.cooldown
        });
    }
});

// Get token status
app.get('/status', (req, res) => {
    res.json({
        hasToken: !!latestToken,
        lastUpdate: lastUpdate,
        tokenInfo: tokenInfo,
        uptime: process.uptime()
    });
});

// Auto-refresh endpoint (for cron jobs)
app.post('/auto-refresh', async (req, res) => {
    const { secret } = req.body;
    
    if (secret !== process.env.CRON_SECRET) {
        return res.status(401).json({ error: 'Invalid secret' });
    }
    
    logWithTime('⏰ Auto-refresh triggered');
    const result = await getToken();
    
    res.json({
        success: result.success,
        message: result.success ? 'Token refreshed' : result.error,
        cooldown: result.cooldown
    });
});

// Skip Playwright browser installation in containerized environment
if (!process.env.CONTAINERIZED) {
    try {
        logWithTime('🔧 Installing Playwright browsers...');
        execSync('npx playwright install chromium', { stdio: 'inherit' });
        logWithTime('✅ Playwright browsers installed');
    } catch (error) {
        logWithTime(`⚠️  Failed to install Playwright browsers: ${error.message}`);
    }
} else {
    logWithTime('🔧 Skipping Playwright browser installation in containerized environment');
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
    logWithTime(`🚀 Token server started on port ${PORT}`);
    logWithTime(`📡 Endpoints:`);
    logWithTime(`   GET  /health - Health check`);
    logWithTime(`   GET  /token - Get current token`);
    logWithTime(`   GET  /status - Get server status`);
    logWithTime(`   POST /refresh - Force refresh token (requires API key)`);
    logWithTime(`   POST /auto-refresh - Auto refresh (for cron)`);
    
    // Initial token fetch
    setTimeout(async () => {
        logWithTime('🔄 Initial token fetch...');
        try {
            await getToken();
        } catch (error) {
            logWithTime(`❌ Initial token fetch failed: ${error.message}`);
        }
    }, 10000); // Increased delay to allow browser installation
});

// Graceful shutdown
process.on('SIGINT', () => {
    logWithTime('🛑 Server shutting down...');
    notify('🛑 Token server stopped');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logWithTime('🛑 Server shutting down...');
    notify('🛑 Token server stopped');
    process.exit(0);
});
