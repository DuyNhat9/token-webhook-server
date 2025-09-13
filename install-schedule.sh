#!/bin/bash
# Script to install the token automation as a scheduled task

echo "Installing token automation scheduler..."

# Copy plist to LaunchAgents directory
cp com.user.token.plist ~/Library/LaunchAgents/

# Load the service
launchctl load ~/Library/LaunchAgents/com.user.token.plist

echo "✅ Token automation scheduled to run every 30 minutes"
echo "📁 Logs will be saved to:"
echo "   - /Users/davidtran/Desktop/k/run.log"
echo "   - /Users/davidtran/Desktop/k/launchd.log"
echo "   - /Users/davidtran/Desktop/k/launchd-error.log"
echo ""
echo "To stop the scheduler:"
echo "   launchctl unload ~/Library/LaunchAgents/com.user.token.plist"
echo ""
echo "To check status:"
echo "   launchctl list | grep com.user.token"
