#!/bin/bash

# Script monitor iCloud tối ưu - chỉ chạy khi cần thiết
LOG_FILE="/Users/davidtran/Desktop/k/icloud_monitor.log"
LOCK_FILE="/Users/davidtran/Desktop/k/icloud_monitor.lock"

# Kiểm tra lock file để tránh chạy đồng thời
if [ -f "$LOCK_FILE" ]; then
    # Kiểm tra xem process có còn chạy không
    PID=$(cat "$LOCK_FILE")
    if ps -p $PID > /dev/null 2>&1; then
        exit 0
    else
        rm -f "$LOCK_FILE"
    fi
fi

# Tạo lock file
echo $$ > "$LOCK_FILE"

# Chỉ kiểm tra khi CPU usage cao hoặc có iCloud process
CPU_USAGE=$(ps aux | awk 'NR>1 {sum+=$3} END {print sum}')
HAS_ICLOUD=$(pgrep -f "bird\|fileproviderd\|cloudd" | wc -l)

if [ "$HAS_ICLOUD" -gt 0 ] || (( $(echo "$CPU_USAGE > 30" | bc -l) )); then
    echo "$(date): CPU: $CPU_USAGE%, iCloud processes: $HAS_ICLOUD" >> $LOG_FILE
    
    # Kill iCloud processes
    if pgrep -f "bird" > /dev/null; then
        sudo pkill -9 -f bird
        echo "$(date): Killed bird" >> $LOG_FILE
    fi
    
    if pgrep -f "fileproviderd" > /dev/null; then
        sudo pkill -9 -f fileproviderd
        echo "$(date): Killed fileproviderd" >> $LOG_FILE
    fi
    
    if pgrep -f "cloudd" > /dev/null; then
        sudo pkill -9 -f cloudd
        echo "$(date): Killed cloudd" >> $LOG_FILE
    fi
else
    # Chỉ ghi log khi có hoạt động
    echo "$(date): OK - CPU: $CPU_USAGE%, iCloud: $HAS_ICLOUD" >> $LOG_FILE
fi

# Xóa lock file
rm -f "$LOCK_FILE"
