#!/bin/bash

echo "🔍 Kiểm tra iCloud đơn giản..."
echo "=============================="

echo "1. iCloud processes:"
ICLOUD_COUNT=$(ps aux | grep -E "(bird|fileproviderd|cloudd)" | grep -v grep | wc -l)
echo "Số iCloud processes: $ICLOUD_COUNT"

if [ "$ICLOUD_COUNT" -gt 0 ]; then
    echo "❌ iCloud đang chạy:"
    ps aux | grep -E "(bird|fileproviderd|cloudd)" | grep -v grep
    echo ""
    echo "🔧 Chạy script tắt:"
    echo "./safe_disable_icloud.sh"
else
    echo "✅ iCloud đã dừng"
fi

echo ""
echo "2. CPU usage:"
top -l 1 -o cpu -n 3 | head -6
