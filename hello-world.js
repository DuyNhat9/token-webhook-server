import http from 'http';

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
        message: 'Hello World from Railway!',
        status: 'ok',
        timestamp: new Date().toISOString()
    }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Hello World server running on port ${PORT}`);
});
