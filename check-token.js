#!/usr/bin/env node
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const TOKEN_FILE = process.env.OUTPUT_FILE || 'token.txt';
const KEY_ID = process.env.KEY_ID || 'F24AAF7D-8CE8-4425-99A2-1C89CD24D954';

function logInfo(message) {
    console.log(`ℹ️  ${message}`);
}

function logError(message) {
    console.error(`❌ ${message}`);
}

function logSuccess(message) {
    console.log(`✅ ${message}`);
}

function checkTokenFile() {
    const tokenPath = path.resolve(process.cwd(), TOKEN_FILE);
    
    if (!fs.existsSync(tokenPath)) {
        logError(`Token file not found: ${tokenPath}`);
        return false;
    }
    
    const token = fs.readFileSync(tokenPath, 'utf8').trim();
    
    if (!token) {
        logError('Token file is empty');
        return false;
    }
    
    // Basic JWT validation (3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) {
        logError('Token does not appear to be a valid JWT format');
        return false;
    }
    
    const stats = fs.statSync(tokenPath);
    const ageMinutes = Math.floor((Date.now() - stats.mtime.getTime()) / (1000 * 60));
    
    logSuccess(`Token found and appears valid`);
    logInfo(`Token length: ${token.length} characters`);
    logInfo(`File age: ${ageMinutes} minutes`);
    logInfo(`Key ID: ${KEY_ID}`);
    
    // Show first and last few characters for verification
    const preview = token.length > 50 
        ? `${token.substring(0, 20)}...${token.substring(token.length - 20)}`
        : token;
    logInfo(`Token preview: ${preview}`);
    
    return true;
}

function checkLogs() {
    const logFiles = ['run.log', 'launchd.log', 'launchd-error.log'];
    
    logInfo('Checking log files...');
    
    for (const logFile of logFiles) {
        const logPath = path.resolve(process.cwd(), logFile);
        if (fs.existsSync(logPath)) {
            const stats = fs.statSync(logPath);
            const size = stats.size;
            const ageMinutes = Math.floor((Date.now() - stats.mtime.getTime()) / (1000 * 60));
            
            console.log(`📄 ${logFile}: ${size} bytes, last modified ${ageMinutes} minutes ago`);
            
            if (logFile === 'launchd-error.log' && size > 0) {
                logError('Error log has content - check for issues');
                const content = fs.readFileSync(logPath, 'utf8');
                console.log('Last few lines:');
                console.log(content.split('\n').slice(-5).join('\n'));
            }
        } else {
            console.log(`📄 ${logFile}: not found`);
        }
    }
}

function main() {
    console.log('🔍 Token Automation Status Check\n');
    
    const tokenValid = checkTokenFile();
    console.log('');
    checkLogs();
    
    console.log('\n📋 Quick Commands:');
    console.log('  Run once:     npm run get-token');
    console.log('  Show browser: HEADFUL=1 npm run get-token');
    console.log('  Check status: node check-token.js');
    console.log('  View logs:    tail -f run.log');
    
    if (!tokenValid) {
        console.log('\n⚠️  Token appears invalid or missing. Run "npm run get-token" to refresh.');
        process.exit(1);
    }
}

main();
