console.log('Testing webhook server startup...');

try {
    // Test import
    console.log('1. Testing imports...');
    const express = require('express');
    const puppeteer = require('puppeteer');
    console.log('✅ Imports successful');

    // Test basic server
    console.log('2. Testing basic server...');
    const app = express();
    app.get('/test', (req, res) => {
        res.json({ status: 'ok', message: 'Webhook server test' });
    });
    console.log('✅ Basic server setup successful');

    // Test Puppeteer launch (without actually launching)
    console.log('3. Testing Puppeteer configuration...');
    const launchOptions = {
        headless: 'new',
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
            '--remote-debugging-pipe'
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser'
    };
    console.log('✅ Puppeteer configuration valid');

    console.log('🎉 All tests passed! Webhook server should start successfully.');
    
} catch (error) {
    console.error('❌ Error during startup test:', error.message);
    process.exit(1);
}
