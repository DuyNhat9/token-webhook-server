#!/bin/bash

# Script tắt iCloud services
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

echo "Đã tắt iCloud services"
