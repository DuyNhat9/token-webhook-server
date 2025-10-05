#!/usr/bin/env python3
"""
Real Login Test - Actually try to login to tokencursor.io.vn
"""

import requests
from bs4 import BeautifulSoup
import time

def real_login_test():
    print('🔑 Real Login Test - tokencursor.io.vn')
    
    session = requests.Session()
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
    })
    
    key_id = 'KEY-8GFN9U3L0U'
    
    try:
        # Step 1: Get login page
        print('\n📡 Step 1: Getting login page...')
        response = session.get('https://tokencursor.io.vn/login', timeout=15)
        print(f'Status: {response.status_code}')
        
        if response.status_code != 200:
            print(f'❌ Login page failed: {response.status_code}')
            return False
        
        # Parse form
        soup = BeautifulSoup(response.text, 'html.parser')
        form = soup.find('form')
        
        if not form:
            print('❌ No form found')
            return False
        
        print('✅ Form found')
        print(f'Action: {form.get("action", "None")}')
        print(f'Method: {form.get("method", "None")}')
        
        # Find input field
        key_input = form.find('input', {'type': 'password'}) or form.find('input', {'type': 'text'})
        if not key_input:
            print('❌ No key input found')
            return False
        
        input_name = key_input.get('name', 'key')
        print(f'Input name: {input_name}')
        
        # Step 2: Try different login methods
        print('\n📝 Step 2: Trying login methods...')
        
        # Method 1: POST to login
        print('🔄 Method 1: POST to /login')
        login_data = {input_name: key_id}
        
        try:
            response = session.post('https://tokencursor.io.vn/login', data=login_data, timeout=15, allow_redirects=True)
            print(f'Response: {response.status_code}')
            print(f'Final URL: {response.url}')
            
            if 'app' in response.url or 'Thông tin tài khoản' in response.text:
                print('✅ Login successful via POST')
                return check_app_page(session)
            else:
                print('⚠️ POST login may have failed')
        except Exception as e:
            print(f'❌ POST login failed: {e}')
        
        # Method 2: Try different endpoints
        print('\n🔄 Method 2: Trying different endpoints...')
        
        endpoints = [
            'https://tokencursor.io.vn/api/login',
            'https://tokencursor.io.vn/api/auth',
            'https://tokencursor.io.vn/auth/login',
            'https://tokencursor.io.vn/login/submit'
        ]
        
        for endpoint in endpoints:
            try:
                print(f'Trying: {endpoint}')
                response = session.post(endpoint, data=login_data, timeout=15, allow_redirects=True)
                print(f'Response: {response.status_code}')
                
                if response.status_code == 200 and ('app' in response.url or 'Thông tin tài khoản' in response.text):
                    print(f'✅ Login successful via {endpoint}')
                    return check_app_page(session)
            except Exception as e:
                print(f'❌ {endpoint} failed: {e}')
        
        # Method 3: Try with different headers
        print('\n🔄 Method 3: Trying with different headers...')
        
        session.headers.update({
            'Content-Type': 'application/x-www-form-urlencoded',
            'Origin': 'https://tokencursor.io.vn',
            'Referer': 'https://tokencursor.io.vn/login'
        })
        
        try:
            response = session.post('https://tokencursor.io.vn/login', data=login_data, timeout=15, allow_redirects=True)
            print(f'Response: {response.status_code}')
            print(f'Final URL: {response.url}')
            
            if 'app' in response.url or 'Thông tin tài khoản' in response.text:
                print('✅ Login successful with headers')
                return check_app_page(session)
        except Exception as e:
            print(f'❌ Header login failed: {e}')
        
        # Method 4: Try GET with params
        print('\n🔄 Method 4: Trying GET with params...')
        
        try:
            response = session.get('https://tokencursor.io.vn/login', params=login_data, timeout=15, allow_redirects=True)
            print(f'Response: {response.status_code}')
            print(f'Final URL: {response.url}')
            
            if 'app' in response.url or 'Thông tin tài khoản' in response.text:
                print('✅ Login successful via GET')
                return check_app_page(session)
        except Exception as e:
            print(f'❌ GET login failed: {e}')
        
        print('\n❌ All login methods failed')
        return False
        
    except Exception as e:
        print(f'❌ Login test failed: {e}')
        return False

def check_app_page(session):
    """Check if we can access app page"""
    print('\n📊 Step 3: Checking app page...')
    
    try:
        response = session.get('https://tokencursor.io.vn/app', timeout=15)
        print(f'App page status: {response.status_code}')
        print(f'App page URL: {response.url}')
        
        if response.status_code == 200:
            if 'Thông tin tài khoản' in response.text:
                print('✅ Found account information')
                
                # Extract account info
                if 'KEY-******3L0U' in response.text:
                    print('🔑 Key ID: KEY-******3L0U')
                if 'Key còn hạn đến' in response.text:
                    print('⏰ Status: Key valid')
                if 'Số token đã nhận' in response.text:
                    print('📊 Tokens received: Found')
                if 'Lần lấy token cuối' in response.text:
                    print('🕐 Last token: Found')
                
                if 'Lấy Token' in response.text:
                    print('✅ Found "Lấy Token" button')
                    
                    # Try to click the button
                    return try_get_token(session)
                else:
                    print('❌ "Lấy Token" button not found')
                    return False
            else:
                print('❌ Account information not found')
                return False
        else:
            print(f'❌ App page failed: {response.status_code}')
            return False
            
    except Exception as e:
        print(f'❌ App page check failed: {e}')
        return False

def try_get_token(session):
    """Try to get token"""
    print('\n🎯 Step 4: Trying to get token...')
    
    try:
        # Try different approaches to get token
        approaches = [
            {'action': 'get_token'},
            {'button': 'lấy_token'},
            {'token': 'get'},
            {'submit': 'lấy_token'},
            {'get_token': '1'},
            {'lấy_token': '1'}
        ]
        
        for approach in approaches:
            try:
                print(f'Trying approach: {approach}')
                response = session.post('https://tokencursor.io.vn/app', data=approach, timeout=15)
                print(f'Response: {response.status_code}')
                
                # Look for token in response
                if response.status_code == 200:
                    # Check for token patterns
                    import re
                    token_patterns = [
                        r'token[_-]?[a-zA-Z0-9]{10,}',
                        r'[a-zA-Z0-9]{20,}',
                        r'KEY[_-]?[a-zA-Z0-9]{10,}'
                    ]
                    
                    for pattern in token_patterns:
                        matches = re.findall(pattern, response.text, re.IGNORECASE)
                        for match in matches:
                            if len(match) > 15 and len(match) < 100:
                                print(f'🎉 Found token: {match}')
                                return True
            except Exception as e:
                print(f'❌ Approach {approach} failed: {e}')
        
        print('❌ No token found')
        return False
        
    except Exception as e:
        print(f'❌ Token retrieval failed: {e}')
        return False

if __name__ == "__main__":
    success = real_login_test()
    if success:
        print('\n🎉 SUCCESS! Login and token retrieval worked!')
    else:
        print('\n❌ FAILED! Could not login or get token')
