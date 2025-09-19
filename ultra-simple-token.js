import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

// Environment variables
const KEY_ID = process.env.KEY_ID;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Global variables
let currentToken = null;
let lastUpdate = null;
let serverStartTime = Date.now();

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

// Simulate token fetch (for testing)
async function getToken() {
    logWithTime('🔑 Simulating token fetch...');
    
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate fake token for testing
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJleHAiOjE3MzQ2MjQwMDAsInR5cGUiOiJ0ZXN0In0.fake-signature';
    
    currentToken = fakeToken;
    lastUpdate = new Date().toISOString();
    
    // Send to Telegram
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { 
        timeZone: 'Asia/Ho_Chi_Minh',
        hour12: false 
    });
    const dateStr = now.toLocaleDateString('vi-VN');
    
    const message = `🎉 TOKEN MỚI TỪ RAILWAY (TEST)\n\n📅 Thời gian: ${timeStr} ${dateStr}\n🔑 Token: ${fakeToken}\n👤 Subject: test-user\n⏰ Expires: 2024-12-19 00:00:00\n🤖 From: Railway Token Server (Test Mode)`;
    
    await sendToTelegram(message);
    
    logWithTime('✅ Token simulation completed');
    return { success: true, token: fakeToken };
}

// Routes
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: (Date.now() - serverStartTime) / 1000,
        lastUpdate: lastUpdate,
        hasToken: !!currentToken
    });
});

app.get('/status', (req, res) => {
    res.json({
        server: 'running',
        uptime: (Date.now() - serverStartTime) / 1000,
        hasToken: !!currentToken,
        lastUpdate: lastUpdate,
        mode: 'test'
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
        lastUpdate: lastUpdate,
        mode: 'test'
    });
});

app.post('/refresh', async (req, res) => {
    const result = await getToken();
    
    if (result.success) {
        res.json({
            success: true,
            message: 'Token refreshed successfully (test mode)',
            token: result.token
        });
    } else {
        res.status(500).json({
            success: false,
            error: 'Failed to get token'
        });
    }
});

app.post('/auto-refresh', async (req, res) => {
    getToken();
    res.json({ message: 'Auto refresh triggered (test mode)' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    logWithTime(`🚀 Ultra simple token server started on port ${PORT}`);
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
    logWithTime(`🧪 Mode: TEST (simulated token)`);
    
    // Initial token fetch
    logWithTime('🔄 Initial token fetch (test mode)...');
    setTimeout(() => {
        getToken();
    }, 5000);
});
