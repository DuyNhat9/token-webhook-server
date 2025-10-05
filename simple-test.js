#!/usr/bin/env node
/**
 * Simple Test - Just check files and basic setup
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Simple System Check...');

// Check key files
const files = [
    'smart-token-server.js',
    'package.json',
    'railway.json',
    'nixpacks.toml'
];

let allGood = true;

files.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}: Found`);
    } else {
        console.log(`❌ ${file}: Missing`);
        allGood = false;
    }
});

// Check package.json content
if (fs.existsSync('package.json')) {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log(`📦 Package: ${pkg.name} v${pkg.version}`);
    console.log(`🚀 Start: ${pkg.scripts?.start || 'Not set'}`);
}

// Check smart-token-server.js has key functions
if (fs.existsSync('smart-token-server.js')) {
    const content = fs.readFileSync('smart-token-server.js', 'utf8');
    const hasExpress = content.includes('express');
    const hasPuppeteer = content.includes('puppeteer');
    const hasLaunch = content.includes('launchBrowser');
    
    console.log(`🔧 Express: ${hasExpress ? '✅' : '❌'}`);
    console.log(`🔧 Puppeteer: ${hasPuppeteer ? '✅' : '❌'}`);
    console.log(`🔧 Launch Browser: ${hasLaunch ? '✅' : '❌'}`);
}

if (allGood) {
    console.log('\n✅ System Check: PASSED');
    console.log('🚀 Ready to deploy!');
    console.log('💡 Run: ./deploy-smart.sh');
} else {
    console.log('\n❌ System Check: FAILED');
    console.log('🔧 Fix missing files first');
}
