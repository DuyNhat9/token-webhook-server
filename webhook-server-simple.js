#!/usr/bin/env node
import 'dotenv/config';
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

// Simple token fetch using fetch API (no browser automation)
async function getToken() {
    try {
        logWithTime('🔑 Getting token...');
        
        // Try to get token from local file first
        try {
            const localToken = fs.readFileSync('token.txt', 'utf8').trim();
            if (localToken && localToken.startsWith('eyJ')) {
                logWithTime('📄 Using existing token from file');
                
                // Decode token info
                try {
                    const parts = localToken.split('.');
                    if (parts.length === 3) {
                        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                        tokenInfo = {
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
                
                latestToken = localToken;
                lastUpdate = new Date();
                
                return { success: true, token: localToken, info: tokenInfo };
            }
        } catch (error) {
            logWithTime('⚠️  No local token found');
        }
        
        // If no local token, return error (browser automation not available)
        logWithTime('❌ Browser automation not available on server');
        return { success: false, error: 'Browser automation not available' };
        
    } catch (error) {
        const errorMsg = `❌ Error: ${error.message}`;
        logWithTime(errorMsg);
        return { success: false, error: error.message };
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

// Upload token endpoint
app.post('/upload-token', async (req, res) => {
    const { token, apiKey } = req.body;
    
    if (apiKey !== API_KEY) {
        return res.status(401).json({ error: 'Invalid API key' });
    }
    
    if (!token || !token.startsWith('eyJ')) {
        return res.status(400).json({ error: 'Invalid token format' });
    }
    
    try {
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
        logWithTime(`💾 Token uploaded and saved`);
        
        // Send notification
        await notify(`🎉 Token uploaded!\nExpires: ${tokenData?.expires || 'N/A'}\nTime left: ${tokenData?.timeLeft || 'N/A'} hours`);
        
        res.json({
            success: true,
            message: 'Token uploaded successfully',
            token: token,
            info: tokenData
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
    }, 2000);
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
