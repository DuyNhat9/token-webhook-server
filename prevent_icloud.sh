#!/bin/bash

# Script ngăn iCloud restart tự động
LOG_FILE="/Users/davidtran/Desktop/k/icloud_monitor.log"

# Ghi log
echo "$(date): Kiểm tra iCloud processes..." >> $LOG_FILE

# Kiểm tra và kill các process iCloud
if pgrep -f "bird" > /dev/null; then
    echo "$(date): Tìm thấy bird process, đang kill..." >> $LOG_FILE
    sudo pkill -9 -f bird
    echo "$(date): Đã kill bird" >> $LOG_FILE
fi

if pgrep -f "fileproviderd" > /dev/null; then
    echo "$(date): Tìm thấy fileproviderd process, đang kill..." >> $LOG_FILE
    sudo pkill -9 -f fileproviderd
    echo "$(date): Đã kill fileproviderd" >> $LOG_FILE
fi

if pgrep -f "cloudd" > /dev/null; then
    echo "$(date): Tìm thấy cloudd process, đang kill..." >> $LOG_FILE
    sudo pkill -9 -f cloudd
    echo "$(date): Đã kill cloudd" >> $LOG_FILE
fi

# Kiểm tra CPU usage
CPU_USAGE=$(ps aux | awk 'NR>1 {sum+=$3} END {print sum}')
if (( $(echo "$CPU_USAGE > 50" | bc -l) )); then
    echo "$(date): CPU usage cao: $CPU_USAGE%, kiểm tra iCloud..." >> $LOG_FILE
    # Kill tất cả iCloud processes
    sudo pkill -9 -f "iCloud"
    sudo pkill -9 -f "CloudKit"
    sudo pkill -9 -f "FileProvider"
    echo "$(date): Đã kill tất cả iCloud processes" >> $LOG_FILE
fi

echo "$(date): Hoàn thành kiểm tra" >> $LOG_FILE
