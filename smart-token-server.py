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
    
    def _authenticate_and_get_token(self, session):
        """Try to authenticate with key and get token"""
        try:
            self.log_with_time('🔐 Attempting key authentication...')
            
            # Try to find login form and submit key
            login_data = {
                'key': self.key_id,
                'password': '',  # Empty password if not needed
            }
            
            # Try POST to login endpoint
            login_response = session.post('https://tokencursor.io.vn/login', data=login_data, timeout=15)
            
            if login_response.status_code == 200:
                self.log_with_time('✅ Key authentication successful')
                
                # Now try to get app page again
                app_response = session.get('https://tokencursor.io.vn/app', timeout=15)
                if app_response.status_code == 200:
                    page_content = app_response.text
                    
                    # Look for token again
                    import re
                    jwt_patterns = [
                        r'eyJ[A-Za-z0-9+/=]{50,}',
                        r'eyJ[A-Za-z0-9+/=]{100,}',
                    ]
                    
                    for pattern in jwt_patterns:
                        matches = re.findall(pattern, page_content)
                        if matches:
                            token = matches[0]
                            self.log_with_time(f'🎉 Authenticated token found: {token[:30]}...')
                            return {'success': True, 'token': token, 'method': 'authenticated'}
            
            self.log_with_time('❌ Key authentication failed')
            return {'success': False, 'error': 'Key authentication failed'}
            
        except Exception as e:
            self.log_with_time(f'❌ Authentication error: {e}')
            return {'success': False, 'error': f'Authentication error: {e}'}
    
    def _fallback_app_page_scraping(self, session):
        """Fallback method to scrape app page"""
        try:
            self.log_with_time('🔄 Fallback: Trying app page scraping...')
            
            # Try to access app page directly
            app_response = session.get('https://tokencursor.io.vn/app', timeout=15)
            
            if app_response.status_code != 200:
                self.log_with_time(f'❌ App page failed: {app_response.status_code}')
                return {'success': False, 'error': f'App page failed: {app_response.status_code}'}
            
            page_content = app_response.text
            self.log_with_time(f'📄 App page loaded, content length: {len(page_content)}')
            
            # Check for cooldown message
            if 'Chờ' in page_content and 'nữa' in page_content:
                self.log_with_time('⏰ Key is on cooldown')
                return {'success': False, 'error': 'Key is on cooldown', 'cooldown': True}
            
            # Look for JWT tokens
            import re
            jwt_patterns = [
                r'eyJ[A-Za-z0-9+/=]{50,}',
                r'eyJ[A-Za-z0-9+/=]{100,}',
            ]
            
            real_token = None
            for pattern in jwt_patterns:
                matches = re.findall(pattern, page_content)
                if matches:
                    real_token = matches[0]
                    break
            
            if real_token:
                self.log_with_time(f'🎉 Fallback token found: {real_token[:30]}...')
                return {'success': True, 'token': real_token, 'method': 'fallback_scraping'}
            else:
                self.log_with_time('❌ No token found in fallback scraping')
                return {'success': False, 'error': 'No token found in fallback scraping'}
                
        except Exception as e:
            self.log_with_time(f'❌ Fallback scraping error: {e}')
            return {'success': False, 'error': f'Fallback error: {e}'}
    
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
            
            # Step 2: Try to get token via API
            self.log_with_time('🔑 Getting token via API...')
            
            # Try API endpoint first
            api_response = session.post('https://tokencursor.io.vn/api/token', 
                json={'key': self.key_id},
                headers={
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Referer': 'https://tokencursor.io.vn/login',
                    'Origin': 'https://tokencursor.io.vn'
                },
                timeout=15
            )
            
            if api_response.status_code == 200:
                try:
                    api_data = api_response.json()
                    if 'token' in api_data:
                        real_token = api_data['token']
                        self.log_with_time(f'🎉 API token found: {real_token[:30]}...')
                    elif 'error' in api_data:
                        error_msg = api_data.get('message', 'Unknown API error')
                        self.log_with_time(f'❌ API error: {error_msg}')
                        return {'success': False, 'error': f'API error: {error_msg}'}
                    else:
                        self.log_with_time('❌ No token in API response')
                        return {'success': False, 'error': 'No token in API response'}
                except Exception as e:
                    self.log_with_time(f'❌ API response parsing failed: {e}')
                    return {'success': False, 'error': f'API parsing failed: {e}'}
            else:
                self.log_with_time(f'❌ API failed: {api_response.status_code}')
                # Fallback to app page scraping
                return self._fallback_app_page_scraping(session)
            
            # Update global variables
            self.current_token = real_token
            self.token_info = {
                'token': real_token,
                'timestamp': datetime.now().isoformat(),
                'method': 'requests'
            }
            self.last_update = time.time()
            
            # Send to Telegram
            self.send_telegram_message(real_token)
            
            return {'success': True, 'token': real_token, 'method': 'requests'}
                
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
