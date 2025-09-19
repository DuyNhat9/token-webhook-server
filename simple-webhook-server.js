import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Simple webhook server running',
        uptime: process.uptime()
    });
});

app.get('/status', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

app.get('/token', (req, res) => {
    res.json({
        error: 'No token available',
        message: 'Token service not implemented yet'
    });
});

app.post('/refresh', async (req, res) => {
    res.json({
        message: 'Refresh endpoint - Puppeteer not implemented yet',
        status: 'ok'
    });
});

app.post('/auto-refresh', async (req, res) => {
    res.json({
        message: 'Auto-refresh endpoint - Puppeteer not implemented yet',
        status: 'ok'
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Simple webhook server running on port ${PORT}`);
    console.log(`Health check: http://0.0.0.0:${PORT}/health`);
    console.log(`Status: http://0.0.0.0:${PORT}/status`);
});
