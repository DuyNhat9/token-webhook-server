#!/bin/bash

echo "🔍 Kiểm tra tác động của script monitor..."
echo "=========================================="

echo "1. Launch Agent status:"
launchctl list | grep preventicloud

echo ""
echo "2. Log file size:"
ls -lh /Users/davidtran/Desktop/k/icloud_monitor.log

echo ""
echo "3. Số lần chạy trong 1 giờ:"
tail -60 /Users/davidtran/Desktop/k/icloud_monitor.log | wc -l

echo ""
echo "4. CPU usage hiện tại:"
top -l 1 -o cpu -n 5 | head -8

echo ""
echo "5. iCloud processes:"
ps aux | grep -E "(bird|fileproviderd|cloudd)" | grep -v grep | wc -l

echo ""
echo "6. Log gần nhất:"
tail -3 /Users/davidtran/Desktop/k/icloud_monitor.log
