#!/bin/bash

echo "🔋 Tối ưu pin an toàn..."
echo "======================="

# Tối ưu cài đặt năng lượng
echo "1. Tối ưu cài đặt năng lượng..."
sudo pmset -a displaysleep 2
sudo pmset -a disksleep 5
sudo pmset -a sleep 5
sudo pmset -a womp 0
sudo pmset -a ring 0
sudo pmset -a autorestart 0
sudo pmset -a powernap 0
sudo pmset -a standby 0
sudo pmset -a autopoweroff 0

# Tắt các dịch vụ không cần thiết
echo "2. Tắt các dịch vụ không cần thiết..."
sudo launchctl disable system/com.apple.progressd
sudo launchctl disable system/com.apple.dataaccess.dataaccessd
sudo launchctl disable system/com.apple.inputanalyticsd
sudo launchctl disable system/com.apple.photolibraryd
sudo launchctl disable system/com.apple.CommCenter
sudo launchctl disable system/com.apple.replicatord
sudo launchctl disable system/com.apple.keyboardservicesd
sudo launchctl disable system/com.apple.accessibility.axassetsd
sudo launchctl disable system/com.apple.applespell

# Tắt các dịch vụ mạng không cần
echo "3. Tắt các dịch vụ mạng không cần..."
sudo launchctl disable system/com.apple.mDNSResponder
sudo launchctl disable system/com.apple.networkd

# Tắt các dịch vụ media không cần
echo "4. Tắt các dịch vụ media không cần..."
sudo launchctl disable system/com.apple.mediaremoteagent
sudo launchctl disable system/com.apple.FontWorker
sudo launchctl disable system/com.apple.quicklook

# Tắt các dịch vụ accessibility không cần
echo "5. Tắt các dịch vụ accessibility không cần..."
sudo launchctl disable system/com.apple.universalaccessAuthWarn
sudo launchctl disable system/com.apple.accessibility.AXVisualSupportAgent

# Tắt các dịch vụ commerce và analytics
echo "6. Tắt các dịch vụ commerce và analytics..."
sudo launchctl disable system/com.apple.commerce
sudo launchctl disable system/com.apple.peopled

# Tắt các dịch vụ không cần thiết khác
echo "7. Tắt các dịch vụ không cần thiết khác..."
sudo launchctl disable system/com.apple.trustd.agent
sudo launchctl disable system/com.apple.cfprefsd.xpc.agent
sudo launchctl disable system/com.apple.WindowManager.agent
sudo launchctl disable system/com.apple.ContextStoreAgent

echo "✅ Hoàn thành tối ưu pin an toàn!"
echo ""
echo "📋 Các script đã tạo:"
echo "1. safe_disable_icloud.sh - Tắt iCloud an toàn"
echo "2. check_icloud_simple.sh - Kiểm tra iCloud đơn giản"
echo "3. optimize_battery.sh - Tối ưu pin"
echo ""
echo "🔧 Cách sử dụng:"
echo "1. Chạy ./optimize_battery.sh để tối ưu pin"
echo "2. Chạy ./check_icloud_simple.sh để kiểm tra iCloud"
echo "3. Chạy ./safe_disable_icloud.sh khi iCloud restart"
