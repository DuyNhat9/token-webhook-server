#!/bin/bash

echo "🔒 Giải pháp an toàn - Tắt iCloud services một lần..."
echo "===================================================="

# Tắt iCloud services một lần (không monitor)
echo "Tắt iCloud services..."

# Tắt các dịch vụ iCloud
sudo launchctl disable system/com.apple.bird
sudo launchctl disable system/com.apple.cloudd
sudo launchctl disable system/com.apple.FileProvider
sudo launchctl disable system/com.apple.cloudphotod

# Tắt iCloud qua defaults
defaults write com.apple.bird disable -bool true
defaults write com.apple.cloudd disable -bool true
defaults write com.apple.FileProvider disable -bool true
defaults write com.apple.cloudphotod disable -bool true
defaults write com.apple.iCloudDrive disable -bool true
defaults write com.apple.CloudKit disable -bool true

# Kill iCloud processes một lần
sudo pkill -9 -f bird
sudo pkill -9 -f fileproviderd
sudo pkill -9 -f cloudd

echo "✅ Đã tắt iCloud services an toàn!"
echo ""
echo "📋 Cách sử dụng:"
echo "1. Chạy script này khi iCloud restart"
echo "2. Không có script monitor tự động"
echo "3. An toàn cho máy và pin"
echo ""
echo "🔄 Để bật lại iCloud:"
echo "sudo launchctl enable system/com.apple.bird"
echo "sudo launchctl enable system/com.apple.cloudd"
