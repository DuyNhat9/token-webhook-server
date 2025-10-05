#!/usr/bin/env python3
"""
Smart Token Server - Python version for Railway deployment
"""

import os
import time
import json
import sys
import requests
import threading
from datetime import datetime
from flask import Flask, jsonify, request
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
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
        self.auto_refresh = False
        self.refresh_interval = 300  # 5 minutes default
        self.refresh_thread = None
        
    def log_with_time(self, message):
        """Log with timestamp"""
        now = datetime.now()
        time_str = now.strftime('%H:%M:%S')
        date_str = now.strftime('%d/%m/%Y')
        print(f'[{time_str} {date_str}] {message}')
    
    def send_telegram_message(self, token):
        """Send token to Telegram"""
        try:
            bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
            chat_id = os.getenv('TELEGRAM_CHAT_ID')
            
            if not bot_token or not chat_id:
                self.log_with_time("⚠️ Telegram credentials not configured")
                return False
            
            message = f"🎉 **Token mới được lấy thành công!**\n\n"
            message += f"🔑 **Token:** `{token}`\n"
            message += f"⏰ **Thời gian:** {datetime.now().strftime('%H:%M:%S %d/%m/%Y')}\n"
            message += f"🌐 **Server:** Railway Smart Token Server"
            
            url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
            data = {
                'chat_id': chat_id,
                'text': message,
                'parse_mode': 'Markdown'
            }
            
            response = requests.post(url, data=data, timeout=10)
            if response.status_code == 200:
                self.log_with_time("✅ Token sent to Telegram successfully")
                return True
            else:
                self.log_with_time(f"❌ Failed to send to Telegram: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_with_time(f"❌ Telegram error: {str(e)}")
            return False
    
    def auto_refresh_worker(self):
        """Background worker for auto-refresh"""
        while self.auto_refresh:
            try:
                self.log_with_time("🔄 Auto-refresh: Attempting to fetch token...")
                result = self.fetch_token()
                
                if result['success']:
                    self.log_with_time("✅ Auto-refresh: Token fetched successfully!")
                else:
                    if result.get('cooldown'):
                        self.log_with_time("⏰ Auto-refresh: Key on cooldown, waiting...")
                    else:
                        self.log_with_time(f"❌ Auto-refresh failed: {result.get('error', 'Unknown')}")
                
                # Wait for next refresh
                self.log_with_time(f"⏳ Auto-refresh: Waiting {self.refresh_interval} seconds...")
                time.sleep(self.refresh_interval)
                
            except Exception as e:
                self.log_with_time(f"❌ Auto-refresh error: {e}")
                time.sleep(60)  # Wait 1 minute on error
    
    def start_auto_refresh(self, interval=300):
        """Start auto-refresh in background"""
        if self.auto_refresh:
            self.log_with_time("⚠️ Auto-refresh already running")
            return False
        
        self.auto_refresh = True
        self.refresh_interval = interval
        self.refresh_thread = threading.Thread(target=self.auto_refresh_worker, daemon=True)
        self.refresh_thread.start()
        self.log_with_time(f"🚀 Auto-refresh started (interval: {interval}s)")
        return True
    
    def stop_auto_refresh(self):
        """Stop auto-refresh"""
        if not self.auto_refresh:
            self.log_with_time("⚠️ Auto-refresh not running")
            return False
        
        self.auto_refresh = False
        self.log_with_time("🛑 Auto-refresh stopped")
        return True
    
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
            service = Service(executable_path=chromedriver_path)
            driver = webdriver.Chrome(
                options=chrome_options,
                service=service
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
                
                # Send to Telegram
                self.send_telegram_message(result['token'])
            
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

@app.route('/telegram/config', methods=['POST'])
def config_telegram():
    """Configure Telegram webhook"""
    try:
        data = request.get_json()
        bot_token = data.get('bot_token')
        chat_id = data.get('chat_id')
        
        if not bot_token or not chat_id:
            return jsonify({'success': False, 'error': 'bot_token and chat_id are required'}), 400
        
        # Test Telegram connection
        url = f"https://api.telegram.org/bot{bot_token}/getMe"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            # Set environment variables (for this session)
            os.environ['TELEGRAM_BOT_TOKEN'] = bot_token
            os.environ['TELEGRAM_CHAT_ID'] = chat_id
            
            return jsonify({
                'success': True,
                'message': 'Telegram configured successfully',
                'bot_info': response.json()['result']
            })
        else:
            return jsonify({'success': False, 'error': 'Invalid bot token'}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/telegram/test', methods=['POST'])
def test_telegram():
    """Test Telegram webhook"""
    try:
        if server.send_telegram_message("🧪 Test message from Smart Token Server"):
            return jsonify({'success': True, 'message': 'Test message sent successfully'})
        else:
            return jsonify({'success': False, 'error': 'Failed to send test message'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/auto-refresh', methods=['POST'])
def start_auto_refresh():
    """Start auto-refresh"""
    try:
        data = request.get_json() or {}
        interval = data.get('interval', 300)  # Default 5 minutes
        
        if server.start_auto_refresh(interval):
            return jsonify({
                'success': True, 
                'message': f'Auto-refresh started with {interval}s interval',
                'interval': interval
            })
        else:
            return jsonify({'success': False, 'error': 'Auto-refresh already running'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/auto-refresh', methods=['DELETE'])
def stop_auto_refresh():
    """Stop auto-refresh"""
    try:
        if server.stop_auto_refresh():
            return jsonify({'success': True, 'message': 'Auto-refresh stopped'})
        else:
            return jsonify({'success': False, 'error': 'Auto-refresh not running'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/auto-refresh/status', methods=['GET'])
def auto_refresh_status():
    """Get auto-refresh status"""
    return jsonify({
        'success': True,
        'auto_refresh': server.auto_refresh,
        'interval': server.refresh_interval,
        'is_running': server.auto_refresh
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
    
    # Auto-start auto-refresh if enabled via environment
    auto_refresh_env = os.getenv('AUTO_REFRESH', 'false').lower()
    if auto_refresh_env in ('1', 'true', 'yes', 'on'):
        try:
            interval_env = int(os.getenv('AUTO_REFRESH_INTERVAL', '300'))
        except ValueError:
            interval_env = 300
        started = server.start_auto_refresh(interval=interval_env)
        if started:
            print(f'🔄 Auto-refresh enabled (interval: {interval_env}s)')
        else:
            print('⚠️ Auto-refresh was already running')
    
    app.run(host='0.0.0.0', port=port, debug=False)
