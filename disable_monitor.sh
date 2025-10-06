#!/bin/bash

echo "🛑 Tắt hệ thống monitor iCloud..."
echo "================================="

echo "1. Tắt Launch Agent..."
launchctl unload ~/Library/LaunchAgents/com.user.preventicloud.plist

echo "2. Xóa Launch Agent file..."
rm -f ~/Library/LaunchAgents/com.user.preventicloud.plist

echo "3. Kill script đang chạy..."
pkill -f prevent_icloud

echo "4. Xóa lock file..."
rm -f /Users/davidtran/Desktop/k/icloud_monitor.lock

echo "✅ Đã tắt hoàn toàn hệ thống monitor!"
echo ""
echo "📋 Để bật lại:"
echo "./setup_icloud_prevention.sh"
