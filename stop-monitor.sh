#!/bin/bash

# Script to stop automatic token monitoring
echo "🛑 Stopping Token Monitor..."

# Kill the process
if pkill -f "auto-token.js"; then
    echo "✅ Token monitor stopped successfully"
else
    echo "⚠️  No token monitor process found"
fi

# Remove PID file
if [ -f "logs/token-monitor.pid" ]; then
    rm logs/token-monitor.pid
    echo "🗑️  PID file removed"
fi

echo "🏁 Monitor stopped"
