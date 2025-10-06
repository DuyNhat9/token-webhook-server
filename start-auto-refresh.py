#!/usr/bin/env python3
"""
Start auto-refresh for continuous token fetching
"""

import requests
import time

# Server URL
SERVER_URL = "https://token-webhook-server-production.up.railway.app"

def start_auto_refresh(interval=300):
    """Start auto-refresh with specified interval"""
    print(f"🚀 Starting auto-refresh with {interval}s interval...")
    
    try:
        data = {"interval": interval}
        response = requests.post(f"{SERVER_URL}/auto-refresh", json=data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Auto-refresh started successfully!")
            print(f"Message: {result.get('message', 'Unknown')}")
            print(f"Interval: {result.get('interval', 'Unknown')}s")
            return True
        else:
            print(f"❌ Failed to start auto-refresh: {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def check_auto_refresh_status():
    """Check auto-refresh status"""
    print("📊 Checking auto-refresh status...")
    
    try:
        response = requests.get(f"{SERVER_URL}/auto-refresh/status", timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Status retrieved successfully!")
            print(f"Auto-refresh: {'Running' if result.get('auto_refresh') else 'Stopped'}")
            print(f"Interval: {result.get('interval', 'Unknown')}s")
            print(f"Is running: {result.get('is_running', False)}")
            return True
        else:
            print(f"❌ Failed to get status: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def stop_auto_refresh():
    """Stop auto-refresh"""
    print("🛑 Stopping auto-refresh...")
    
    try:
        response = requests.delete(f"{SERVER_URL}/auto-refresh", timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Auto-refresh stopped successfully!")
            print(f"Message: {result.get('message', 'Unknown')}")
            return True
        else:
            print(f"❌ Failed to stop auto-refresh: {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🔄 Smart Token Server Auto-Refresh Control")
    print("=" * 50)
    
    # Check current status
    check_auto_refresh_status()
    
    print("\n🚀 Starting auto-refresh...")
    # Start auto-refresh with 5 minute interval
    if start_auto_refresh(300):
        print("\n✅ Auto-refresh is now running!")
        print("📱 You will receive tokens via Telegram automatically!")
        print("⏰ Interval: 5 minutes (300 seconds)")
        print("🔄 Server will continuously fetch tokens and send to Telegram")
        
        # Check status again
        print("\n📊 Final status check:")
        check_auto_refresh_status()
    else:
        print("\n❌ Failed to start auto-refresh")
    
    print("\n" + "=" * 50)
    print("🎉 Auto-refresh setup completed!")
