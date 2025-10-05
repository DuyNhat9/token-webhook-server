#!/usr/bin/env python3
"""
Smart Token Server - Python version for Railway deployment
"""

import os
import time
import json
import sys
from datetime import datetime
from flask import Flask, jsonify, request
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException

app = Flask(__name__)

class SmartTokenServer:
    def __init__(self):
        self.key_id = os.getenv('KEY_ID', 'KEY-8GFN9U3L0U')
        self.current_token = None
        self.token_info = None
        self.last_update = 0
        self.is_fetching = False
        
    def log_with_time(self, message):
        """Log with timestamp"""
        now = datetime.now()
        time_str = now.strftime('%H:%M:%S')
        date_str = now.strftime('%d/%m/%Y')
        print(f'[{time_str} {date_str}] {message}')
    
    def setup_browser(self):
        """Setup Chrome browser for Railway"""
        self.log_with_time('🌐 Setting up browser...')
        
        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--disable-web-security")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--headless")  # Headless for server
        chrome_options.add_argument("--disable-extensions")
        chrome_options.add_argument("--disable-plugins")
        chrome_options.add_argument("--disable-images")
        chrome_options.add_argument("--disable-javascript")
        
        # Use system Chrome/Chromium
        chrome_bin = os.getenv('CHROME_BIN', '/usr/bin/chromium')
        chromedriver_path = os.getenv('CHROMEDRIVER_PATH', '/usr/bin/chromedriver')
        
        chrome_options.binary_location = chrome_bin
        
        try:
            driver = webdriver.Chrome(
                chrome_options=chrome_options,
                service_args=[f'--chromedriver-path={chromedriver_path}']
            )
            driver.set_page_load_timeout(30)
            driver.implicitly_wait(10)
            self.log_with_time('✅ Browser ready')
            return driver
        except Exception as e:
            self.log_with_time(f'❌ Browser setup failed: {e}')
            return None
    
    def login_to_system(self, driver):
        """Login to tokencursor.io.vn"""
        self.log_with_time('🔑 Logging into tokencursor.io.vn...')
        
        try:
            # Navigate to login page
            driver.get('https://tokencursor.io.vn/login')
            self.log_with_time('📡 Login page loaded')
            time.sleep(3)
            
            # Find key input field
            key_input = driver.find_element(By.CSS_SELECTOR, 'input[type="text"], input[type="password"]')
            self.log_with_time('📝 Found key input field')
            
            # Clear and fill key
            key_input.clear()
            key_input.send_keys(self.key_id)
            self.log_with_time(f'⌨️ Entered key: {self.key_id}')
            
            # Find and click login button
            login_button = driver.find_element(By.XPATH, '//button[contains(text(), "Đăng nhập")]')
            self.log_with_time('🔘 Found login button')
            
            # Click login button
            login_button.click()
            self.log_with_time('🔄 Clicking login button...')
            time.sleep(5)
            
            # Navigate to app page
            driver.get('https://tokencursor.io.vn/app')
            time.sleep(3)
            
            # Check if redirected to login (failed login)
            current_url = driver.current_url
            if 'login' in current_url:
                self.log_with_time('❌ Login failed, still on login page')
                return False
            
            self.log_with_time('✅ Login successful, on app page')
            return True
                
        except Exception as e:
            self.log_with_time(f'❌ Login failed: {e}')
            return False
    
    def handle_notification_popup(self, driver):
        """Handle the notification popup"""
        self.log_with_time('🔔 Handling notification popup...')
        
        try:
            # Look for "Đã hiểu" button
            try:
                understood_button = WebDriverWait(driver, 5).until(
                    EC.element_to_be_clickable((By.XPATH, '//button[contains(text(), "Đã hiểu")]'))
                )
                understood_button.click()
                self.log_with_time('✅ Clicked "Đã hiểu" button')
                time.sleep(2)
                return True
            except TimeoutException:
                self.log_with_time('⚠️ "Đã hiểu" button not found')
            
            # Look for close button (X)
            try:
                close_button = driver.find_element(By.CSS_SELECTOR, 'button[aria-label="Close"], .close, [data-dismiss="modal"]')
                close_button.click()
                self.log_with_time('✅ Clicked close button')
                time.sleep(2)
                return True
            except:
                self.log_with_time('⚠️ Close button not found')
            
            self.log_with_time('ℹ️ No popup found, continuing...')
            return True
            
        except Exception as e:
            self.log_with_time(f'⚠️ Popup handling failed: {e}')
            return True  # Continue anyway
    
    def get_token_from_app(self, driver):
        """Get token from app page"""
        self.log_with_time('🎯 Getting token from app page...')
        
        try:
            # Handle popup first
            self.handle_notification_popup(driver)
            
            # Get page content to check status
            page_source = driver.page_source
            all_text = driver.find_element(By.TAG_NAME, "body").text
            
            # Check if there's a cooldown message
            if 'Chờ' in all_text and 'nữa' in all_text:
                self.log_with_time('⏰ Key is on cooldown, cannot get token now')
                return {'success': False, 'error': 'Key is on cooldown', 'cooldown': True}
            
            # Look for "Lấy Token" button
            try:
                get_token_button = WebDriverWait(driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, '//button[contains(text(), "Lấy Token")]'))
                )
                
                self.log_with_time('✅ Found "Lấy Token" button')
                
                # Click the button
                get_token_button.click()
                self.log_with_time('🔄 Clicking "Lấy Token" button...')
                time.sleep(5)
                
                # Look for token in page content
                import re
                page_source = driver.page_source
                
                # Look for JWT tokens
                jwt_patterns = [
                    r'eyJ[A-Za-z0-9+/=]{50,}',  # Full JWT
                    r'eyJ[A-Za-z0-9+/=]{100,}', # Very long JWT
                ]
                
                for pattern in jwt_patterns:
                    matches = re.findall(pattern, page_source)
                    if matches:
                        token = matches[0]
                        self.log_with_time(f'🎉 Found token: {token[:30]}...')
                        return {'success': True, 'token': token, 'method': 'selenium'}
                
                # If no JWT found, look for any long alphanumeric string
                long_strings = re.findall(r'[a-zA-Z0-9]{30,}', page_source)
                if long_strings:
                    # Use the longest string
                    token = max(long_strings, key=len)
                    if len(token) > 20:
                        self.log_with_time(f'🎉 Found potential token: {token[:30]}...')
                        return {'success': True, 'token': token, 'method': 'selenium'}
                
                self.log_with_time('⚠️ No token found after clicking button')
                return {'success': False, 'error': 'No token found after clicking'}
                
            except TimeoutException:
                self.log_with_time('❌ "Lấy Token" button not found')
                return {'success': False, 'error': 'Lấy Token button not found'}
                
        except Exception as e:
            self.log_with_time(f'❌ Token fetching failed: {e}')
            return {'success': False, 'error': str(e)}
    
    def fetch_token(self):
        """Main token fetching function"""
        if self.is_fetching:
            return {'success': False, 'error': 'Already fetching token'}
        
        self.is_fetching = True
        driver = None
        
        try:
            self.log_with_time('🚀 Smart Token Server Starting...')
            
            # Setup browser
            driver = self.setup_browser()
            if not driver:
                return {'success': False, 'error': 'Browser setup failed'}
            
            # Login to system
            if not self.login_to_system(driver):
                return {'success': False, 'error': 'Login failed'}
            
            # Get token from app
            result = self.get_token_from_app(driver)
            
            if result['success']:
                self.current_token = result['token']
                self.token_info = result
                self.last_update = time.time()
                self.log_with_time(f'✅ Token fetched successfully: {result["token"][:30]}...')
            
            return result
                
        except Exception as e:
            self.log_with_time(f'❌ Token fetching failed: {e}')
            return {'success': False, 'error': str(e)}
        finally:
            self.is_fetching = False
            if driver:
                self.log_with_time('🔒 Closing browser...')
                driver.quit()

# Initialize server
server = SmartTokenServer()

@app.route('/')
def home():
    """Home endpoint"""
    return jsonify({
        'message': 'Smart Token Server',
        'status': 'running',
        'version': '1.0.0',
        'endpoints': {
            '/token': 'Get current token',
            '/fetch': 'Fetch new token',
            '/status': 'Get server status'
        }
    })

@app.route('/token')
def get_token():
    """Get current token"""
    if server.current_token:
        return jsonify({
            'success': True,
            'token': server.current_token,
            'last_update': server.last_update,
            'method': server.token_info.get('method', 'unknown') if server.token_info else 'unknown'
        })
    else:
        return jsonify({
            'success': False,
            'error': 'No token available'
        })

@app.route('/fetch', methods=['POST', 'GET'])
def fetch_token():
    """Fetch new token"""
    result = server.fetch_token()
    return jsonify(result)

@app.route('/status')
def get_status():
    """Get server status"""
    return jsonify({
        'success': True,
        'status': 'running',
        'current_token': server.current_token is not None,
        'last_update': server.last_update,
        'is_fetching': server.is_fetching,
        'key_id': server.key_id
    })

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 3000))
    print(f'🚀 Starting Smart Token Server on port {port}')
    print(f'🔑 Using key: {server.key_id}')
    
    # Test token fetch on startup
    print('🧪 Testing token fetch on startup...')
    result = server.fetch_token()
    if result['success']:
        print(f'✅ Startup test successful: {result["token"][:30]}...')
    else:
        print(f'⚠️ Startup test failed: {result.get("error", "Unknown error")}')
    
    app.run(host='0.0.0.0', port=port, debug=False)
