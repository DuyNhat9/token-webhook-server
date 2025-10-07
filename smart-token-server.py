import os
import time
import json
import sys
import threading
from datetime import datetime
from flask import Flask, jsonify, request
import logging
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException, WebDriverException
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

class SeleniumTokenServer:
    def __init__(self):
        self.key_id = os.getenv('KEY_ID', 'KEY-8GFN9U3L0U')
        self.current_token = None
        self.token_info = None
        self.last_update = 0
        self.is_fetching = False
        self.auto_refresh = False
        self.refresh_interval = 900  # 15 minutes default
        self.cooldown_until = 0
        self.driver = None

    def log_with_time(self, message):
        now = datetime.now()
        time_str = now.strftime('%H:%M:%S')
        date_str = now.strftime('%d/%m/%Y')
        log_message = f'[{time_str} {date_str}] {message}'
        logger.info(log_message)
        print(log_message)

    def send_telegram_message(self, token):
        try:
            bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
            chat_id = os.getenv('TELEGRAM_CHAT_ID')

            if not bot_token or not chat_id:
                self.log_with_time("⚠️ Telegram credentials not configured")
                return False

            message = f"🎉 **Token mới được lấy thành công!**\n\n"
            message += f"🔑 **Token:** `{token}`\n"
            message += f"⏰ **Thời gian:** {datetime.now().strftime('%H:%M:%S %d/%m/%Y')}\n"
            message += f"🌐 **Server:** Selenium Token Server"

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

    def setup_browser(self):
        """Setup Chrome browser"""
        self.log_with_time('🌐 Setting up browser...')
        
        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--headless=new")
        chrome_options.add_argument("--disable-web-security")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--disable-extensions")
        chrome_options.add_argument("--disable-plugins")
        chrome_options.add_argument("--disable-images")
        chrome_options.add_argument("--no-first-run")
        chrome_options.add_argument("--disable-background-timer-throttling")
        chrome_options.add_argument("--disable-backgrounding-occluded-windows")
        chrome_options.add_argument("--disable-renderer-backgrounding")
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            self.driver.set_page_load_timeout(30)
            self.driver.implicitly_wait(10)
            self.log_with_time('✅ Browser ready')
            return True
        except Exception as e:
            self.log_with_time(f'❌ Browser setup failed: {e}')
            return False

    def login_and_get_token(self):
        """Login and get token using Selenium"""
        if not self.driver:
            if not self.setup_browser():
                return {'success': False, 'error': 'Browser setup failed'}

        try:
            self.log_with_time('🔑 Logging into tokencursor.io.vn...')
            
            # Navigate to login page
            self.driver.get('https://tokencursor.io.vn/login')
            self.log_with_time('📡 Login page loaded')
            time.sleep(3)
            
            # Find key input field
            key_input = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, 'input[name="key"]'))
            )
            self.log_with_time('📝 Found key input field')
            
            # Clear and fill key
            key_input.clear()
            key_input.send_keys(self.key_id)
            self.log_with_time(f'⌨️ Entered key: {self.key_id}')
            
            # Find and click login button
            login_button = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, 'button[type="submit"]'))
            )
            self.log_with_time('🔘 Found login button')
            
            # Click login button
            login_button.click()
            self.log_with_time('🔄 Clicking login button...')
            time.sleep(5)
            
            # Check if redirected to app page
            current_url = self.driver.current_url
            if 'app' in current_url:
                self.log_with_time('✅ Login successful, on app page')
                
                # Handle any popups
                try:
                    understood_button = WebDriverWait(self.driver, 5).until(
                        EC.element_to_be_clickable((By.XPATH, '//button[contains(text(), "Đã hiểu")]'))
                    )
                    understood_button.click()
                    self.log_with_time('✅ Clicked "Đã hiểu" button')
                    time.sleep(2)
                except TimeoutException:
                    self.log_with_time('⚠️ No popup found')
                
                # Look for token button with multiple possible texts
                try:
                    # Try different button texts
                    button_texts = [
                        '//button[contains(text(), "Lấy Token")]',
                        '//button[contains(text(), "Get Token")]',
                        '//button[contains(text(), "Token")]',
                        '//button[contains(text(), "Lấy")]',
                        '//button[contains(text(), "Get")]'
                    ]
                    
                    get_token_button = None
                    for button_text in button_texts:
                        try:
                            get_token_button = WebDriverWait(self.driver, 5).until(
                                EC.element_to_be_clickable((By.XPATH, button_text))
                            )
                            self.log_with_time(f'✅ Found token button with text: {button_text}')
                            break
                        except TimeoutException:
                            continue
                    
                    if not get_token_button:
                        # Check if there's a cooldown message
                        page_source = self.driver.page_source
                        if 'Chờ' in page_source and 'nữa' in page_source:
                            self.log_with_time('⏰ Key is on cooldown')
                            return {'success': False, 'error': 'Key is on cooldown', 'cooldown': True}
                        
                        # Debug: Log page content
                        self.log_with_time('📄 Debug: Looking for any buttons...')
                        buttons = self.driver.find_elements(By.TAG_NAME, 'button')
                        for i, btn in enumerate(buttons[:5]):  # Check first 5 buttons
                            try:
                                text = btn.text.strip()
                                if text:
                                    self.log_with_time(f'📄 Button {i+1}: "{text}"')
                            except:
                                pass
                        
                        raise TimeoutException("No token button found")
                    
                    self.log_with_time('✅ Found "Lấy Token" button')
                    
                    # Click the button
                    get_token_button.click()
                    self.log_with_time('🔄 Clicking "Lấy Token" button...')
                    time.sleep(5)
                    
                    # Look for token in page content
                    page_source = self.driver.page_source
                    
                    # Look for JWT tokens
                    import re
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
            else:
                self.log_with_time('❌ Login failed, still on login page')
                return {'success': False, 'error': 'Login failed'}
                
        except Exception as e:
            self.log_with_time(f'❌ Token fetching failed: {e}')
            return {'success': False, 'error': str(e)}

    def fetch_token(self):
        """Fetch token using Selenium"""
        if self.is_fetching:
            return {'success': False, 'error': 'Already fetching token'}
        
        # Check cooldown
        if time.time() < self.cooldown_until:
            return {'success': False, 'error': 'Key is on cooldown', 'cooldown': True}
        
        self.is_fetching = True
        
        try:
            result = self.login_and_get_token()
            
            if result['success']:
                self.current_token = result['token']
                self.token_info = result
                self.last_update = time.time()
                self.cooldown_until = 0
                self.log_with_time(f'✅ Token fetched successfully: {result["token"][:30]}...')
                self.send_telegram_message(result['token'])
            else:
                if result.get('cooldown'):
                    self.cooldown_until = time.time() + 300  # 5 minutes cooldown
                    self.log_with_time("⏰ Key on cooldown for 5 minutes")
                self.log_with_time(f"❌ Token fetch failed: {result.get('error', 'Unknown error')}")
            
            return result
                
        except Exception as e:
            self.log_with_time(f'❌ Token fetching failed: {e}')
            return {'success': False, 'error': str(e)}
        finally:
            self.is_fetching = False

    def auto_refresh_worker(self):
        while self.auto_refresh:
            try:
                self.log_with_time("🔄 Auto-refresh: Attempting to fetch token...")
                result = self.fetch_token()
                
                if result['success']:
                    self.log_with_time("✅ Auto-refresh: Token fetched successfully!")
                else:
                    if result.get('cooldown'):
                        cooldown_minutes = 5
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

    def cleanup(self):
        """Cleanup browser resources"""
        if self.driver:
            try:
                self.driver.quit()
                self.log_with_time('🧹 Browser cleaned up')
            except:
                pass

server = SeleniumTokenServer()

@app.route('/')
def home():
    return jsonify({
        'message': 'Selenium Token Server',
        'status': 'running',
        'version': '1.0.0',
        'endpoints': {
            '/token': 'Get current token',
            '/fetch': 'Fetch new token',
            '/status': 'Get server status',
            '/auto-refresh': 'Manage auto-refresh'
        }
    })

@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'threads': threading.active_count(),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/token')
def get_token():
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
def fetch_token_endpoint():
    result = server.fetch_token()
    return jsonify(result)

@app.route('/status')
def get_status():
    return jsonify({
        'success': True,
        'status': 'running',
        'current_token': server.current_token is not None,
        'last_update': server.last_update,
        'is_fetching': server.is_fetching,
        'key_id': server.key_id,
        'auto_refresh': server.auto_refresh,
        'cooldown_until': server.cooldown_until
    })

@app.route('/auto-refresh', methods=['POST'])
def start_auto_refresh_endpoint():
    try:
        data = request.get_json() or {}
        interval = data.get('interval', 900)
        
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
def stop_auto_refresh_endpoint():
    try:
        if server.stop_auto_refresh():
            return jsonify({'success': True, 'message': 'Auto-refresh stopped'})
        else:
            return jsonify({'success': False, 'error': 'Auto-refresh not running'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/auto-refresh/status', methods=['GET'])
def auto_refresh_status():
    return jsonify({
        'success': True,
        'auto_refresh': server.auto_refresh,
        'interval': server.refresh_interval,
        'is_running': server.auto_refresh
    })

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8080))
    server.log_with_time(f'🚀 Starting Selenium Token Server on port {port}')
    server.log_with_time(f'🔑 Using key: {server.key_id}')
    
    server.log_with_time('🧪 Testing token fetch on startup...')
    result = server.fetch_token()
    if result['success']:
        server.log_with_time(f'✅ Startup test successful: {result["token"][:30]}...')
    else:
        server.log_with_time(f'⚠️ Startup test failed: {result.get("error", "Unknown error")}')
    
    auto_refresh_env = os.getenv('AUTO_REFRESH', 'true').lower()
    if auto_refresh_env in ('1', 'true', 'yes', 'on'):
        try:
            interval_env = int(os.getenv('AUTO_REFRESH_INTERVAL', '900'))
        except ValueError:
            interval_env = 900
        started = server.start_auto_refresh(interval=interval_env)
        if started:
            server.log_with_time(f'🔄 Auto-refresh enabled (interval: {interval_env}s)')
        else:
            server.log_with_time('⚠️ Auto-refresh was already running')
    
    try:
        app.run(host='0.0.0.0', port=port, debug=False)
    finally:
        server.cleanup()
