const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 STARTING AUTO RAILWAY MONITOR...');
console.log('===================================');
console.log('📱 This script will monitor Railway server automatically');
console.log('📱 It will send you tokens via Telegram when available');
console.log('💡 Press Ctrl+C to stop\n');

// Start the auto monitor script
const monitorProcess = spawn('node', [path.join(__dirname, 'auto-monitor-railway.cjs')], {
    stdio: 'inherit',
    shell: true
});

// Handle process events
monitorProcess.on('error', (error) => {
    console.error('❌ Failed to start monitor:', error.message);
});

monitorProcess.on('close', (code) => {
    console.log(`\n📊 Monitor process exited with code ${code}`);
    if (code !== 0) {
        console.log('🔄 Restarting monitor in 5 seconds...');
        setTimeout(() => {
            console.log('🔄 Restarting...');
            startMonitor();
        }, 5000);
    }
});

// Handle Ctrl+C
process.on('SIGINT', () => {
    console.log('\n🛑 Stopping auto monitor...');
    monitorProcess.kill('SIGINT');
    process.exit(0);
});

function startMonitor() {
    const newProcess = spawn('node', [path.join(__dirname, 'auto-monitor-railway.cjs')], {
        stdio: 'inherit',
        shell: true
    });
    
    newProcess.on('error', (error) => {
        console.error('❌ Failed to restart monitor:', error.message);
    });
    
    newProcess.on('close', (code) => {
        console.log(`\n📊 Monitor process exited with code ${code}`);
        if (code !== 0) {
            console.log('🔄 Restarting monitor in 5 seconds...');
            setTimeout(() => {
                console.log('🔄 Restarting...');
                startMonitor();
            }, 5000);
        }
    });
}

console.log('✅ Auto monitor started!');
console.log('💡 The monitor will run continuously and send you tokens automatically');
console.log('💡 Press Ctrl+C to stop the monitor');
