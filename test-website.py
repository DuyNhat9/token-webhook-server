#!/usr/bin/env python3
"""
Test Website - Check what's actually on tokencursor.io.vn
"""

import requests
from bs4 import BeautifulSoup

def test_website():
    print('🔍 Testing tokencursor.io.vn website...')
    
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })
    
    try:
        # Test login page
        print('\n📡 Testing login page...')
        response = session.get('https://tokencursor.io.vn/login', timeout=15)
        print(f'Status: {response.status_code}')
        print(f'URL: {response.url}')
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Check for form
            form = soup.find('form')
            if form:
                print('✅ Form found')
                print(f'Action: {form.get("action", "None")}')
                print(f'Method: {form.get("method", "None")}')
                
                # Check inputs
                inputs = form.find_all('input')
                for inp in inputs:
                    print(f'Input: type={inp.get("type")}, name={inp.get("name")}, placeholder={inp.get("placeholder")}')
            else:
                print('❌ No form found')
            
            # Check for specific text
            if 'Đăng nhập' in response.text:
                print('✅ Found "Đăng nhập" text')
            if 'Key đăng nhập' in response.text:
                print('✅ Found "Key đăng nhập" text')
            if 'KEY-8GFN9U3L0U' in response.text:
                print('✅ Found key in page')
        
        # Test app page
        print('\n📡 Testing app page...')
        response = session.get('https://tokencursor.io.vn/app', timeout=15)
        print(f'Status: {response.status_code}')
        print(f'URL: {response.url}')
        
        if response.status_code == 200:
            # Check for specific text
            if 'Thông tin tài khoản' in response.text:
                print('✅ Found "Thông tin tài khoản"')
            if 'Lấy Token' in response.text:
                print('✅ Found "Lấy Token"')
            if 'KEY-******3L0U' in response.text:
                print('✅ Found masked key')
            if 'Key còn hạn đến' in response.text:
                print('✅ Found status info')
            if 'Số token đã nhận' in response.text:
                print('✅ Found token count')
            if 'Lần lấy token cuối' in response.text:
                print('✅ Found last token time')
            
            # Show page content
            print('\n📄 Page content preview:')
            print(response.text[:500] + '...' if len(response.text) > 500 else response.text)
        else:
            print(f'❌ App page failed: {response.status_code}')
            
    except Exception as e:
        print(f'❌ Test failed: {e}')

if __name__ == "__main__":
    test_website()
