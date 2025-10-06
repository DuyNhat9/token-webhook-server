#!/usr/bin/env python3
"""
Test Telegram configuration for Smart Token Server
"""

import requests
import json

# Server URL
SERVER_URL = "http://10.250.19.32:8080"

# Telegram credentials
BOT_TOKEN = "8393051379:AAFjXE1Ww6iRjcldkkVfFzD6ySj36HlP7Zs"
CHAT_ID = "7489189724"

def test_telegram_config():
    """Test Telegram configuration"""
    print("🔧 Configuring Telegram...")
    
    # Configure Telegram
    config_data = {
        "bot_token": BOT_TOKEN,
        "chat_id": CHAT_ID
    }
    
    try:
        response = requests.post(
            f"{SERVER_URL}/telegram/config",
            json=config_data,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Telegram configured successfully!")
            print(f"Bot info: {result.get('bot_info', {}).get('first_name', 'Unknown')}")
            return True
        else:
            print(f"❌ Configuration failed: {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_telegram_message():
    """Test sending message to Telegram"""
    print("\n📱 Testing Telegram message...")
    
    try:
        response = requests.post(
            f"{SERVER_URL}/telegram/test",
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Test message sent successfully!")
            print(f"Message: {result.get('message', 'Unknown')}")
            return True
        else:
            print(f"❌ Test failed: {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_token_fetch():
    """Test token fetch (should send to Telegram)"""
    print("\n🎯 Testing token fetch with Telegram...")
    
    try:
        response = requests.get(
            f"{SERVER_URL}/fetch",
            timeout=60
        )
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("✅ Token fetched successfully!")
                print(f"Token: {result.get('token', 'Unknown')[:30]}...")
                print("📱 Check your Telegram for the message!")
                return True
            else:
                print(f"❌ Token fetch failed: {result.get('error', 'Unknown')}")
                return False
        else:
            print(f"❌ Request failed: {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testing Smart Token Server with Telegram")
    print("=" * 50)
    
    # Step 1: Configure Telegram
    if test_telegram_config():
        # Step 2: Test message
        if test_telegram_message():
            # Step 3: Test token fetch
            test_token_fetch()
    
    print("\n" + "=" * 50)
    print("🎉 Test completed!")
