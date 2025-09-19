import http from 'http';

const server = http.createServer((req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const url = req.url;
    const method = req.method;

    if (url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'ok', 
            message: 'Server is healthy',
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        }));
    } else if (url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'ok', 
            message: 'Server is running',
            timestamp: new Date().toISOString()
        }));
    } else if (url === '/token') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            error: 'No token available',
            message: 'Token service not implemented yet'
        }));
    } else if (url === '/refresh' && method === 'POST') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            message: 'Refresh endpoint - Puppeteer not implemented yet',
            status: 'ok'
        }));
    } else if (url === '/auto-refresh' && method === 'POST') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            message: 'Auto-refresh endpoint - Puppeteer not implemented yet',
            status: 'ok'
        }));
    } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            message: 'Hello from working server!',
            status: 'ok',
            endpoints: ['/health', '/status', '/token', '/refresh', '/auto-refresh'],
            timestamp: new Date().toISOString()
        }));
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Working server running on port ${PORT}`);
    console.log(`Available endpoints:`);
    console.log(`  GET  /health`);
    console.log(`  GET  /status`);
    console.log(`  GET  /token`);
    console.log(`  POST /refresh`);
    console.log(`  POST /auto-refresh`);
});
