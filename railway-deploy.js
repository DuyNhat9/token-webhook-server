#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 Auto Deploy to Railway');

// Check if Railway CLI is installed
try {
    execSync('railway --version', { stdio: 'ignore' });
    console.log('✅ Railway CLI found');
} catch (error) {
    console.log('❌ Railway CLI not found. Installing...');
    try {
        execSync('npm install -g @railway/cli', { stdio: 'inherit' });
        console.log('✅ Railway CLI installed');
    } catch (installError) {
        console.log('❌ Failed to install Railway CLI');
        console.log('Please install manually: npm install -g @railway/cli');
        process.exit(1);
    }
}

// Login to Railway
console.log('🔐 Logging into Railway...');
try {
    execSync('railway login', { stdio: 'inherit' });
    console.log('✅ Logged into Railway');
} catch (error) {
    console.log('❌ Failed to login to Railway');
    process.exit(1);
}

// Deploy to Railway
console.log('🚀 Deploying to Railway...');
try {
    execSync('railway up', { stdio: 'inherit' });
    console.log('✅ Deployed to Railway successfully!');
} catch (error) {
    console.log('❌ Failed to deploy to Railway');
    process.exit(1);
}

// Set environment variables
console.log('⚙️  Setting environment variables...');
const envVars = [
    'KEY_ID=F24AAF7D-8CE8-4425-99A2-1C89CD24D954',
    'API_KEY=your-secret-api-key-123',
    'WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook',
    'CRON_SECRET=your-cron-secret-456'
];

for (const envVar of envVars) {
    try {
        execSync(`railway variables set ${envVar}`, { stdio: 'inherit' });
        console.log(`✅ Set ${envVar.split('=')[0]}`);
    } catch (error) {
        console.log(`❌ Failed to set ${envVar.split('=')[0]}`);
    }
}

console.log('🎉 Deployment completed!');
console.log('📡 Your server URL will be shown above');
console.log('🔧 Don\'t forget to:');
console.log('   1. Update WEBHOOK_URL with your Discord webhook');
console.log('   2. Test your API endpoints');
console.log('   3. Set up GitHub Actions for auto-refresh');
