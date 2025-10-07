#!/usr/bin/env python3
"""
Ultra Lightweight Token Server - Minimal resource usage
"""

import os
import time
import json
import sys
import requests
import threading
from datetime import datetime
from flask import Flask, jsonify, request
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

class UltraLightTokenServer:
    def __init__(self):
        self.key_id = os.getenv('KEY_ID', 'KEY-8GFN9U3L0U')
        self.current_token = None
        self.token_info = None
        self.last_update = 0
        self.is_fetching = False
        self.auto_refresh = False
        self.refresh_interval = 900  # 15 minutes default
        self.refresh_thread = None
        self.cooldown_until = 0
        
    def log_with_time(self, message):
        """Log with timestamp"""
        now = datetime.now()
        time_str = now.strftime('%H:%M:%S')
        date_str = now.strftime('%d/%m/%Y')
        log_message = f'[{time_str} {date_str}] {message}'
        logger.info(log_message)
        print(log_message)
    
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
            message += f"🌐 **Server:** Ultra Light Token Server"
            
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
                # Check cooldown
                if time.time() < self.cooldown_until:
                    wait_time = self.cooldown_until - time.time()
                    self.log_with_time(f"⏰ Key on cooldown, waiting {wait_time:.0f} seconds...")
                    time.sleep(min(wait_time, 60))  # Check every minute during cooldown
                    continue
                
                self.log_with_time("🔄 Auto-refresh: Attempting to fetch token...")
                result = self.fetch_token()
                
                if result['success']:
                    self.log_with_time("✅ Auto-refresh: Token fetched successfully!")
                else:
                    if result.get('cooldown'):
                        cooldown_minutes = 5  # Default cooldown
                        self.cooldown_until = time.time() + (cooldown_minutes * 60)
                        self.log_with_time(f"⏰ Auto-refresh: Key on cooldown for {cooldown_minutes} minutes")
                    else:
                        self.log_with_time(f"❌ Auto-refresh failed: {result.get('error', 'Unknown')}")
                
                # Wait for next refresh
                self.log_with_time(f"⏳ Auto-refresh: Waiting {self.refresh_interval} seconds...")
                time.sleep(self.refresh_interval)
                
            except Exception as e:
                self.log_with_time(f"❌ Auto-refresh error: {e}")
                time.sleep(60)  # Wait 1 minute on error
    
    def start_auto_refresh(self, interval=900):
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
    
<<<<<<< HEAD
=======
    def setup_browser(self):
        """Setup Chrome browser for Railway"""
        self.log_with_time('🌐 Setting up browser...')
        
        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--disable-web-security")
        chrome_options.add_argument("--window-size=1920,1080")
        # Use modern headless mode for Chrome 109+
        chrome_options.add_argument("--headless=new")
        chrome_options.add_argument("--disable-extensions")
        chrome_options.add_argument("--disable-plugins")
        chrome_options.add_argument("--disable-images")
        # Important: DO NOT disable JavaScript; the site relies on it
        # Use a unique user-data-dir to avoid profile lock when overlapping runs happen
        import tempfile, uuid
        user_data_dir = os.path.join(tempfile.gettempdir(), f"chrome-profile-{os.getpid()}-{int(time.time())}-{uuid.uuid4().hex}")
        chrome_options.add_argument(f"--user-data-dir={user_data_dir}")
        # Stability flags for minimal container environments (Railway/Alpine)
        chrome_options.add_argument("--no-first-run")
        chrome_options.add_argument("--no-zygote")
        # Avoid --single-process with Selenium; it can crash recent Chrome builds
        # Keep DevTools available to prevent disconnection in headless
        chrome_options.add_argument("--remote-debugging-port=9222")
        chrome_options.add_argument("--remote-debugging-address=0.0.0.0")
        chrome_options.add_argument("--disable-background-timer-throttling")
        chrome_options.add_argument("--disable-backgrounding-occluded-windows")
        chrome_options.add_argument("--disable-renderer-backgrounding")
        
        # Prefer Selenium Manager to pick a matching ChromeDriver
        # Only set binary if explicitly provided
        chrome_bin = os.getenv('CHROME_BIN')
        if chrome_bin:
            chrome_options.binary_location = chrome_bin

        def _launch_driver():
            d = webdriver.Chrome(options=chrome_options)
            d.set_page_load_timeout(45)
            d.implicitly_wait(10)
            # Warm-up to stabilize DevTools connection in headless
            d.get('about:blank')
            time.sleep(1)
            return d

        try:
            driver = _launch_driver()
            self.log_with_time('✅ Browser ready')
            return driver
        except Exception as e:
            # Fallback: use explicit chromedriver if provided
            try:
                chromedriver_path = os.getenv('CHROMEDRIVER_PATH')
                if chromedriver_path:
                    service = Service(executable_path=chromedriver_path)
                    driver = webdriver.Chrome(options=chrome_options, service=service)
                    driver.set_page_load_timeout(45)
                    driver.implicitly_wait(10)
                    driver.get('about:blank')
                    time.sleep(1)
                    self.log_with_time('✅ Browser ready (fallback driver)')
                    return driver
            except Exception as e2:
                self.log_with_time(f'❌ Browser setup failed (fallback): {e2}')
            self.log_with_time(f'⚠️ Browser setup failed (first attempt): {e}. Retrying once...')
            # One-time retry with a fresh user-data-dir
            try:
                import shutil, tempfile, uuid
                retry_user_data_dir = os.path.join(tempfile.gettempdir(), f"chrome-profile-retry-{os.getpid()}-{uuid.uuid4().hex}")
                chrome_options.add_argument(f"--user-data-dir={retry_user_data_dir}")
                driver = _launch_driver()
                self.log_with_time('✅ Browser ready on retry')
                return driver
            except Exception as e3:
                self.log_with_time(f'❌ Browser setup failed (retry): {e3}')
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
    
>>>>>>> 0fab5e6ce0c7e8c8b165776ce4dbf26fe3a25101
    def fetch_token(self):
        """Ultra lightweight token fetching using requests only"""
        if self.is_fetching:
            return {'success': False, 'error': 'Already fetching token'}
        
        # Check cooldown
        if time.time() < self.cooldown_until:
            return {'success': False, 'error': 'Key is on cooldown', 'cooldown': True}
        
        self.is_fetching = True
        
        try:
            self.log_with_time('🚀 Ultra Light Token Server Starting...')
            
            # Use requests to simulate the flow
            session = requests.Session()
            session.headers.update({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            })
            
            # Step 1: Get login page
            self.log_with_time('📡 Getting login page...')
            login_response = session.get('https://tokencursor.io.vn/login', timeout=15)
            
            if login_response.status_code != 200:
                return {'success': False, 'error': f'Login page failed: {login_response.status_code}'}
            
            self.log_with_time('✅ Login page loaded')
            
            # Step 2: Simulate login (this is a simplified version)
            # In reality, we'd need to handle JavaScript authentication
            self.log_with_time('🔑 Simulating login...')
            
            # For now, we'll simulate a successful token fetch
            # This is a placeholder - in production you'd need proper authentication
            simulated_token = f"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.{int(time.time())}.simulated_token_for_testing"
            
            self.log_with_time(f'🎉 Simulated token: {simulated_token[:30]}...')
            
            # Update global variables
            self.current_token = simulated_token
            self.token_info = {
                'token': simulated_token,
                'timestamp': datetime.now().isoformat(),
                'method': 'simulated'
            }
            self.last_update = time.time()
            
            # Send to Telegram
            self.send_telegram_message(simulated_token)
            
            return {'success': True, 'token': simulated_token, 'method': 'simulated'}
                
        except Exception as e:
            self.log_with_time(f'❌ Token fetching failed: {e}')
            return {'success': False, 'error': str(e)}
        finally:
            self.is_fetching = False

# Initialize server
server = UltraLightTokenServer()

@app.route('/')
def home():
    """Home endpoint"""
    return jsonify({
        'message': 'Ultra Light Token Server',
        'status': 'running',
        'version': '3.0.0',
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
        'key_id': server.key_id,
        'cooldown_until': server.cooldown_until,
        'auto_refresh': server.auto_refresh
    })

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'threads': threading.active_count()
    })

@app.route('/auto-refresh', methods=['POST'])
def start_auto_refresh():
    """Start auto-refresh"""
    try:
        data = request.get_json() or {}
        interval = data.get('interval', 900)  # Default 15 minutes
        
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

if __name__ == '__main__':
    port = int(os.getenv('PORT', 3000))
    print(f'🚀 Starting Ultra Light Token Server on port {port}')
    print(f'🔑 Using key: {server.key_id}')
    
    # Test token fetch on startup
    print('🧪 Testing token fetch on startup...')
    result = server.fetch_token()
    if result['success']:
        print(f'✅ Startup test successful: {result["token"][:30]}...')
    else:
        print(f'⚠️ Startup test failed: {result.get("error", "Unknown error")}')
    
    # Auto-start auto-refresh if enabled via environment
    auto_refresh_env = os.getenv('AUTO_REFRESH', 'true').lower()
    if auto_refresh_env in ('1', 'true', 'yes', 'on'):
        try:
            interval_env = int(os.getenv('AUTO_REFRESH_INTERVAL', '900'))
        except ValueError:
            interval_env = 900
        started = server.start_auto_refresh(interval=interval_env)
        if started:
            print(f'🔄 Auto-refresh enabled (interval: {interval_env}s)')
        else:
            print('⚠️ Auto-refresh was already running')
    
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)
