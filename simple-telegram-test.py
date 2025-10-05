#!/usr/bin/env python3
"""
Simple Telegram test
"""

import requests
import time

# Test different URLs
URLS = [
    "http://10.250.19.32:8080",
    "https://token-webhook-server-production.up.railway.app"
]

BOT_TOKEN = "8393051379:AAFjXE1Ww6iRjcldkkVfFzD6ySj36HlP7Zs"
CHAT_ID = "7489189724"

def test_url(url):
    """Test if URL is accessible"""
    try:
        print(f"🔍 Testing {url}...")
        response = requests.get(f"{url}/health", timeout=5)
        if response.status_code == 200:
            print(f"✅ {url} is accessible!")
            return url
        else:
            print(f"❌ {url} returned {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ {url} error: {e}")
        return None

def configure_telegram(url):
    """Configure Telegram"""
    try:
        print(f"🔧 Configuring Telegram on {url}...")
        data = {
            "bot_token": BOT_TOKEN,
            "chat_id": CHAT_ID
        }
        response = requests.post(f"{url}/telegram/config", json=data, timeout=10)
        if response.status_code == 200:
            print("✅ Telegram configured successfully!")
            return True
        else:
            print(f"❌ Configuration failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testing Smart Token Server URLs")
    print("=" * 50)
    
    working_url = None
    for url in URLS:
        working_url = test_url(url)
        if working_url:
            break
        time.sleep(2)
    
    if working_url:
        print(f"\n🎯 Using {working_url}")
        configure_telegram(working_url)
    else:
        print("\n❌ No working URL found")
