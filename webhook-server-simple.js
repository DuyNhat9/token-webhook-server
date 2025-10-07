import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

// Environment variables
const KEY_ID = process.env.KEY_ID;
const API_KEY = process.env.API_KEY;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// Global variables
let currentToken = null;
let tokenInfo = null;
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

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: (Date.now() - serverStartTime) / 1000,
        lastUpdate: lastUpdate,
        hasToken: !!currentToken
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
        tokenInfo: tokenInfo
    });
});

// Manual token upload endpoint (for testing)
app.post('/upload-token', async (req, res) => {
    const { token, apiKey } = req.body;

    logWithTime(`🔍 Debug: Received apiKey: "${apiKey}", Expected: "${API_KEY}"`);
    
    if (apiKey !== API_KEY) {
        logWithTime(`❌ API key mismatch: "${apiKey}" !== "${API_KEY}"`);
        return res.status(401).json({ error: 'Invalid API key' });
    }

    if (!token || !token.startsWith('eyJ')) {
        return res.status(400).json({ error: 'Invalid token format' });
    }

    try {
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

        logWithTime(`✅ Token uploaded successfully`);
        logWithTime(`📄 Token Info: ${JSON.stringify(tokenInfo, null, 2)}`);

        // Send webhook notification if configured
        if (WEBHOOK_URL) {
            try {
                await fetch(WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: `🎉 **Token Updated Successfully!**\n\`\`\`json\n${JSON.stringify(tokenInfo, null, 2)}\n\`\`\``
                    })
                });
            } catch (error) {
                logWithTime(`⚠️ Webhook notification failed: ${error.message}`);
            }
        }

        res.json({
            success: true,
            message: 'Token uploaded successfully',
            token: token,
            info: tokenInfo
        });

    } catch (error) {
        logWithTime(`❌ Error uploading token: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to upload token',
            error: error.message
        });
    }
});

// Force refresh endpoint (placeholder - requires manual token upload)
app.post('/refresh', async (req, res) => {
    const { apiKey } = req.body;

    if (apiKey !== API_KEY) {
        return res.status(401).json({ error: 'Invalid API key' });
    }

    res.json({
        success: true,
        message: 'Manual token upload required. Use /upload-token endpoint with your token.',
        instructions: {
            endpoint: '/upload-token',
            method: 'POST',
            body: {
                token: 'your-jwt-token-here',
                apiKey: API_KEY
            }
        }
    });
});

// Auto refresh endpoint (for cron jobs)
app.post('/auto-refresh', async (req, res) => {
    const { secret } = req.body;

    if (secret !== process.env.CRON_SECRET) {
        return res.status(401).json({ error: 'Invalid secret' });
    }

    res.json({
        success: true,
        message: 'Auto refresh endpoint ready. Manual token upload required.',
        currentToken: !!currentToken,
        lastUpdate: lastUpdate
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    logWithTime(`🚀 Token server started on port ${PORT}`);
    logWithTime(`📡 Endpoints:`);
    logWithTime(`   GET  /health - Health check`);
    logWithTime(`   GET  /token - Get current token`);
    logWithTime(`   GET  /status - Get server status`);
    logWithTime(`   POST /refresh - Force refresh token (requires API key)`);
    logWithTime(`   POST /auto-refresh - Auto refresh (for cron)`);
    logWithTime(`   POST /upload-token - Upload token manually (requires API key)`);
    
    logWithTime(`🔧 Environment variables:`);
    logWithTime(`   KEY_ID: ${KEY_ID ? 'Set' : 'Not set'}`);
    logWithTime(`   API_KEY: ${API_KEY ? 'Set' : 'Not set'}`);
    logWithTime(`   WEBHOOK_URL: ${WEBHOOK_URL ? 'Set' : 'Not set'}`);
    logWithTime(`   PORT: ${PORT}`);
    
    logWithTime(`📝 Note: This is a simplified server. Use /upload-token to manually upload tokens.`);
});