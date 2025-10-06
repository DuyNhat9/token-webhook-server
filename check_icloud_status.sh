#!/bin/bash

echo "🔍 Kiểm tra trạng thái iCloud..."
echo "================================"

# Kiểm tra processes
echo "1. Kiểm tra iCloud processes:"
if pgrep -f "bird" > /dev/null; then
    echo "❌ bird đang chạy"
    ps aux | grep bird | grep -v grep
else
    echo "✅ bird đã dừng"
fi

if pgrep -f "fileproviderd" > /dev/null; then
    echo "❌ fileproviderd đang chạy"
    ps aux | grep fileproviderd | grep -v grep
else
    echo "✅ fileproviderd đã dừng"
fi

if pgrep -f "cloudd" > /dev/null; then
    echo "❌ cloudd đang chạy"
    ps aux | grep cloudd | grep -v grep
else
    echo "✅ cloudd đã dừng"
fi

# Kiểm tra CPU usage
echo ""
echo "2. CPU usage hiện tại:"
top -l 1 -o cpu -n 5 | head -10

# Kiểm tra log
echo ""
echo "3. Log gần nhất:"
tail -5 /Users/davidtran/Desktop/k/icloud_monitor.log
