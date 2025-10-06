#!/bin/bash

echo "🤖 Tắt các AI services của macOS..."
echo "=================================="

# 1. Tắt Intelligence Platform
echo "1. Tắt Intelligence Platform..."
sudo launchctl disable system/com.apple.intelligenceplatformd
sudo launchctl disable system/com.apple.intelligenceplatformd.compute
sudo launchctl disable system/com.apple.intelligencecontextd

# 2. Tắt Siri services
echo "2. Tắt Siri services..."
sudo launchctl disable system/com.apple.Siri
sudo launchctl disable system/com.apple.SiriNCService
sudo launchctl disable system/com.apple.siriactionsd
sudo launchctl disable system/com.apple.sirittsd
sudo launchctl disable system/com.apple.SiriTTSTrainingAgent

# 3. Tắt Speech services
echo "3. Tắt Speech services..."
sudo launchctl disable system/com.apple.corespeechd
sudo launchctl disable system/com.apple.corespeechd_system
sudo launchctl disable system/com.apple.assistantd
sudo launchctl disable system/com.apple.assistant_service

# 4. Tắt Voice services
echo "4. Tắt Voice services..."
sudo launchctl disable system/com.apple.TextToSpeech
sudo launchctl disable system/com.apple.TextToSpeechKonaSupport
sudo launchctl disable system/com.apple.TextToSpeechMauiSupport
sudo launchctl disable system/com.apple.TextToSpeechVoiceBankingSupport

# 5. Tắt Analytics services
echo "5. Tắt Analytics services..."
sudo launchctl disable system/com.apple.SiriAnalytics
sudo launchctl disable system/com.apple.IntelligenceFlowContextRuntime
sudo launchctl disable system/com.apple.BiomeSELFIngestor
sudo launchctl disable system/com.apple.IFTelemetrySELFIngestor
sudo launchctl disable system/com.apple.IFTranscriptSELFIngestor

# 6. Kill các AI processes
echo "6. Kill các AI processes..."
sudo pkill -9 -f IntelligencePlatform
sudo pkill -9 -f intelligencecontextd
sudo pkill -9 -f Siri
sudo pkill -9 -f siriactionsd
sudo pkill -9 -f sirittsd
sudo pkill -9 -f corespeechd
sudo pkill -9 -f assistantd
sudo pkill -9 -f TextToSpeech
sudo pkill -9 -f SiriAnalytics

# 7. Tắt qua defaults
echo "7. Tắt qua defaults..."
defaults write com.apple.Siri disable -bool true
defaults write com.apple.corespeechd disable -bool true
defaults write com.apple.assistantd disable -bool true
defaults write com.apple.intelligenceplatformd disable -bool true

echo "✅ Đã tắt các AI services!"
echo ""
echo "📋 Các AI services đã tắt:"
echo "1. Intelligence Platform (AI Core)"
echo "2. Siri & Voice AI"
echo "3. Speech & Audio AI"
echo "4. Analytics & Telemetry"
echo ""
echo "🔋 Lợi ích:"
echo "1. Tiết kiệm pin đáng kể"
echo "2. Giảm CPU usage"
echo "3. Giảm nhiệt độ"
echo "4. Tăng thời gian sử dụng"
echo ""
echo "🔄 Để bật lại:"
echo "sudo launchctl enable system/com.apple.Siri"
echo "sudo launchctl enable system/com.apple.intelligenceplatformd"
