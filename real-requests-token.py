#!/usr/bin/env python3
"""
Real Requests Token Fetcher - Actually interacts with tokencursor.io.vn
Uses requests to simulate real browser interactions
"""

import time
import sys
import os
import requests
from bs4 import BeautifulSoup
import re

class RealRequestsTokenFetcher:
    def __init__(self):
        self.session = requests.Session()
        self.key_id = 'KEY-8GFN9U3L0U'
        
        # Setup session headers to mimic real browser
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Cache-Control': 'max-age=0'
        })
        
    def log_with_time(self, message):
        """Log with timestamp"""
        from datetime import datetime
        now = datetime.now()
        time_str = now.strftime('%H:%M:%S')
        date_str = now.strftime('%d/%m/%Y')
        print(f'[{time_str} {date_str}] {message}')
    
    def login_to_system(self):
        """Login to tokencursor.io.vn using requests"""
        self.log_with_time('🔑 Logging into tokencursor.io.vn...')
        
        try:
            # Step 1: Get login page
            response = self.session.get('https://tokencursor.io.vn/login', timeout=15)
            self.log_with_time(f'📊 Login page status: {response.status_code}')
            
            if response.status_code != 200:
                self.log_with_time(f'❌ Login page failed: {response.status_code}')
                return False
            
            # Parse login form
            soup = BeautifulSoup(response.text, 'html.parser')
            form = soup.find('form')
            
            if not form:
                self.log_with_time('❌ No login form found')
                return False
            
            # Get form details
            form_action = form.get('action', '')
            form_method = form.get('method', 'post').lower()
            
            # Find input field
            key_input = form.find('input', {'type': 'text'}) or form.find('input', {'type': 'password'})
            if not key_input:
                self.log_with_time('❌ No key input field found')
                return False
            
            input_name = key_input.get('name', 'key')
            self.log_with_time(f'📝 Input field: {input_name}')
            
            # Prepare login data
            login_data = {
                input_name: self.key_id
            }
            
            # Determine submit URL
            submit_url = 'https://tokencursor.io.vn/login'
            if form_action:
                if form_action.startswith('/'):
                    submit_url = 'https://tokencursor.io.vn' + form_action
                elif not form_action.startswith('http'):
                    submit_url = 'https://tokencursor.io.vn/' + form_action
            
            self.log_with_time(f'📝 Submitting login with key: {self.key_id}')
            self.log_with_time(f'📡 Submit URL: {submit_url}')
            self.log_with_time(f'📡 Method: {form_method}')
            
            # Submit login form
            if form_method == 'post':
                response = self.session.post(submit_url, data=login_data, timeout=15, allow_redirects=True)
            else:
                response = self.session.get(submit_url, params=login_data, timeout=15, allow_redirects=True)
            
            self.log_with_time(f'📊 Login response: {response.status_code}')
            self.log_with_time(f'📡 Final URL: {response.url}')
            
            # Check if we're on app page
            if 'app' in response.url or 'Thông tin tài khoản' in response.text:
                self.log_with_time('✅ Login successful, on app page')
                return True
            else:
                self.log_with_time('⚠️ Login may have failed, trying direct app access')
                # Try to access app page directly
                app_response = self.session.get('https://tokencursor.io.vn/app', timeout=15)
                if app_response.status_code == 200:
                    self.log_with_time('✅ Direct app access successful')
                    return True
                else:
                    self.log_with_time(f'❌ Direct app access failed: {app_response.status_code}')
                    return False
                
        except Exception as e:
            self.log_with_time(f'❌ Login failed: {e}')
            return False
    
    def get_account_info(self):
        """Get account information from app page"""
        self.log_with_time('📊 Getting account information...')
        
        try:
            response = self.session.get('https://tokencursor.io.vn/app', timeout=15)
            self.log_with_time(f'📊 App page status: {response.status_code}')
            
            if response.status_code != 200:
                self.log_with_time(f'❌ App page failed: {response.status_code}')
                return None
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Look for account information
            if 'Thông tin tài khoản' in response.text:
                self.log_with_time('✅ Found account information section')
                
                # Extract account details
                account_info = {}
                
                # Look for Key ID
                key_id_match = re.search(r'KEY-[\*]{6,}[\w]+', response.text)
                if key_id_match:
                    account_info['key_id'] = key_id_match.group()
                    self.log_with_time(f'🔑 Key ID: {account_info["key_id"]}')
                
                # Look for status
                status_match = re.search(r'Key còn hạn đến [\d:]+ [\d/]+', response.text)
                if status_match:
                    account_info['status'] = status_match.group()
                    self.log_with_time(f'⏰ Status: {account_info["status"]}')
                
                # Look for token count
                token_count_match = re.search(r'Số token đã nhận[\s]*:?[\s]*(\d+)', response.text)
                if token_count_match:
                    account_info['token_count'] = token_count_match.group(1)
                    self.log_with_time(f'📊 Tokens received: {account_info["token_count"]}')
                
                # Look for last token time
                last_token_match = re.search(r'Lần lấy token cuối[\s]*:?[\s]*([\d:]+ [\d/]+)', response.text)
                if last_token_match:
                    account_info['last_token'] = last_token_match.group(1)
                    self.log_with_time(f'🕐 Last token: {account_info["last_token"]}')
                
                return account_info
            else:
                self.log_with_time('❌ Account information not found')
                return None
                
        except Exception as e:
            self.log_with_time(f'❌ Account info extraction failed: {e}')
            return None
    
    def click_get_token_button(self):
        """Simulate clicking the 'Lấy Token' button"""
        self.log_with_time('🎯 Looking for "Lấy Token" button...')
        
        try:
            # First, check if button exists on page
            response = self.session.get('https://tokencursor.io.vn/app', timeout=15)
            
            if 'Lấy Token' not in response.text:
                self.log_with_time('❌ "Lấy Token" button not found on page')
                return None
            
            self.log_with_time('✅ Found "Lấy Token" button on page')
            
            # Try to find the button's form or action
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Look for forms that might contain the button
            forms = soup.find_all('form')
            for form in forms:
                if 'Lấy Token' in form.get_text():
                    form_action = form.get('action', '')
                    form_method = form.get('method', 'post').lower()
                    
                    self.log_with_time(f'📝 Found form with "Lấy Token" button')
                    self.log_with_time(f'📡 Form action: {form_action}')
                    self.log_with_time(f'📡 Form method: {form_method}')
                    
                    # Try to submit the form
                    submit_url = 'https://tokencursor.io.vn/app'
                    if form_action:
                        if form_action.startswith('/'):
                            submit_url = 'https://tokencursor.io.vn' + form_action
                        elif not form_action.startswith('http'):
                            submit_url = 'https://tokencursor.io.vn/' + form_action
                    
                    # Get all form inputs
                    form_data = {}
                    inputs = form.find_all('input')
                    for inp in inputs:
                        name = inp.get('name')
                        value = inp.get('value', '')
                        if name:
                            form_data[name] = value
                    
                    self.log_with_time(f'📝 Form data: {form_data}')
                    
                    # Submit form
                    if form_method == 'post':
                        response = self.session.post(submit_url, data=form_data, timeout=15)
                    else:
                        response = self.session.get(submit_url, params=form_data, timeout=15)
                    
                    self.log_with_time(f'📊 Form submission response: {response.status_code}')
                    
                    # Look for token in response
                    token = self.extract_token_from_response(response.text)
                    if token:
                        return token
            
            # If no form found, try to simulate button click via JavaScript
            self.log_with_time('🔄 Simulating button click...')
            
            # Try to find any AJAX endpoint that might be called
            # Look for JavaScript that might handle the button click
            js_patterns = [
                r'fetch\(["\']([^"\']+)["\']',
                r'ajax\(["\']([^"\']+)["\']',
                r'\.post\(["\']([^"\']+)["\']',
                r'\.get\(["\']([^"\']+)["\']'
            ]
            
            for pattern in js_patterns:
                matches = re.findall(pattern, response.text)
                for match in matches:
                    if 'token' in match.lower() or 'get' in match.lower():
                        self.log_with_time(f'🎯 Found potential endpoint: {match}')
                        
                        # Try to call the endpoint
                        try:
                            endpoint_url = match
                            if not endpoint_url.startswith('http'):
                                endpoint_url = 'https://tokencursor.io.vn' + (endpoint_url if endpoint_url.startswith('/') else '/' + endpoint_url)
                            
                            token_response = self.session.get(endpoint_url, timeout=15)
                            self.log_with_time(f'📊 Endpoint response: {token_response.status_code}')
                            
                            token = self.extract_token_from_response(token_response.text)
                            if token:
                                return token
                        except:
                            continue
            
            # If no specific endpoint found, try to simulate the button click
            # by making a request to the app page with some parameters
            self.log_with_time('🔄 Trying to simulate button click...')
            
            # Try different approaches
            approaches = [
                {'action': 'get_token'},
                {'button': 'lấy_token'},
                {'token': 'get'},
                {'submit': 'lấy_token'}
            ]
            
            for approach in approaches:
                try:
                    response = self.session.post('https://tokencursor.io.vn/app', data=approach, timeout=15)
                    self.log_with_time(f'📊 Approach {approach} response: {response.status_code}')
                    
                    token = self.extract_token_from_response(response.text)
                    if token:
                        return token
                except:
                    continue
            
            self.log_with_time('❌ No token found after button simulation')
            return None
            
        except Exception as e:
            self.log_with_time(f'❌ Button click simulation failed: {e}')
            return None
    
    def extract_token_from_response(self, html):
        """Extract token from HTML response"""
        self.log_with_time('🔍 Extracting token from response...')
        
        try:
            soup = BeautifulSoup(html, 'html.parser')
            
            # Look for token patterns
            token_patterns = [
                r'token[_-]?[a-zA-Z0-9]{10,}',
                r'[a-zA-Z0-9]{20,}',
                r'KEY[_-]?[a-zA-Z0-9]{10,}',
                r'"[a-zA-Z0-9]{20,}"',
                r"'[a-zA-Z0-9]{20,}'"
            ]
            
            for pattern in token_patterns:
                matches = re.findall(pattern, html, re.IGNORECASE)
                for match in matches:
                    # Clean up the match
                    clean_match = match.strip('"\'')
                    if len(clean_match) > 15 and len(clean_match) < 100:
                        # Check if it looks like a real token
                        if any(char.isalnum() for char in clean_match):
                            self.log_with_time(f'🎉 Found potential token: {clean_match[:20]}...')
                            return clean_match
            
            # Look for specific token elements
            token_selectors = [
                '.token', '.result', '[class*="token"]', '[id*="token"]',
                'pre', 'code', '.output', '.response'
            ]
            
            for selector in token_selectors:
                try:
                    elements = soup.select(selector)
                    for element in elements:
                        text = element.get_text(strip=True)
                        if text and len(text) > 15 and len(text) < 100:
                            if any(char.isalnum() for char in text):
                                self.log_with_time(f'🎉 Found token in element: {text[:20]}...')
                                return text
                except:
                    continue
            
            return None
            
        except Exception as e:
            self.log_with_time(f'❌ Token extraction failed: {e}')
            return None
    
    def fetch_token(self):
        """Main token fetching function"""
        self.log_with_time('🚀 Real Requests Token Fetcher Starting...')
        
        try:
            # Login to system
            if not self.login_to_system():
                return None
            
            # Get account information
            account_info = self.get_account_info()
            if account_info:
                self.log_with_time('✅ Account information retrieved')
            
            # Click get token button
            token = self.click_get_token_button()
            
            if token:
                self.log_with_time(f'🎉 SUCCESS! Token: {token}')
                return {'success': True, 'token': token, 'method': 'requests'}
            else:
                self.log_with_time('❌ No token found')
                return None
                
        except Exception as e:
            self.log_with_time(f'❌ Token fetching failed: {e}')
            return None
    
    def run_test(self):
        """Run the test"""
        print('🎯 Real Requests Token Fetcher')
        print('📋 Actually interacts with tokencursor.io.vn')
        
        try:
            result = self.fetch_token()
            
            if result and result['success']:
                print(f'\n✅ SUCCESS!')
                print(f'🎯 Token: {result["token"]}')
                print(f'📏 Length: {len(result["token"])} characters')
                print(f'🔧 Method: {result["method"]}')
                
                # Save token to file
                with open('real_token.txt', 'w') as f:
                    f.write(result['token'])
                print('💾 Token saved to real_token.txt')
                
                return True
            else:
                print('\n❌ FAILED!')
                print('🔧 No token found')
                return False
                
        except Exception as e:
            print(f'\n💥 Test crashed: {e}')
            return False

def main():
    fetcher = RealRequestsTokenFetcher()
    success = fetcher.run_test()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
