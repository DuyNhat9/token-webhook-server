#!/bin/bash

# Script to start automatic token monitoring
echo "🚀 Starting Token Monitor..."

# Check if already running
if pgrep -f "auto-token.js" > /dev/null; then
    echo "⚠️  Token monitor is already running"
    echo "To stop it, run: pkill -f auto-token.js"
    exit 1
fi

# Create log directory if it doesn't exist
mkdir -p logs

# Start the monitor in background
nohup /opt/homebrew/opt/node@20/bin/node auto-token.js > logs/token-monitor.log 2>&1 &

# Get the PID
PID=$!
echo "✅ Token monitor started with PID: $PID"
echo "📄 Logs are being written to: logs/token-monitor.log"
echo "🛑 To stop: pkill -f auto-token.js"
echo "📊 To view logs: tail -f logs/token-monitor.log"

# Save PID to file
echo $PID > logs/token-monitor.pid
echo "💾 PID saved to: logs/token-monitor.pid"
