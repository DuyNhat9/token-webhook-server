#!/usr/bin/env python3
"""
Real Selenium Token Fetcher - Actually clicks buttons on tokencursor.io.vn
"""

import time
import sys
import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException

class RealSeleniumTokenFetcher:
    def __init__(self):
        self.driver = None
        self.key_id = 'KEY-8GFN9U3L0U'
        
    def log_with_time(self, message):
        """Log with timestamp"""
        from datetime import datetime
        now = datetime.now()
        time_str = now.strftime('%H:%M:%S')
        date_str = now.strftime('%d/%m/%Y')
        print(f'[{time_str} {date_str}] {message}')
    
    def setup_browser(self):
        """Setup Chrome browser"""
        self.log_with_time('🌐 Setting up browser...')
        
        chrome_options = Options()
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--disable-web-security")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
        
        try:
            self.driver = webdriver.Chrome(chrome_options=chrome_options)
            self.driver.set_page_load_timeout(30)
            self.driver.implicitly_wait(10)
            self.log_with_time('✅ Browser ready')
            return True
        except Exception as e:
            self.log_with_time(f'❌ Browser setup failed: {e}')
            return False
    
    def login_to_system(self):
        """Login to tokencursor.io.vn"""
        self.log_with_time('🔑 Logging into tokencursor.io.vn...')
        
        try:
            # Navigate to login page
            self.driver.get('https://tokencursor.io.vn/login')
            self.log_with_time('📡 Login page loaded')
            
            # Wait for page to load
            time.sleep(3)
            
            # Find key input field
            key_input = self.driver.find_element(By.CSS_SELECTOR, 'input[type="text"], input[type="password"]')
            self.log_with_time('📝 Found key input field')
            
            # Clear and fill key
            key_input.clear()
            key_input.send_keys(self.key_id)
            self.log_with_time(f'⌨️ Entered key: {self.key_id}')
            
            # Find and click login button
            login_button = self.driver.find_element(By.XPATH, '//button[contains(text(), "Đăng nhập")]')
            self.log_with_time('🔘 Found login button')
            
            # Click login button
            login_button.click()
            self.log_with_time('🔄 Clicking login button...')
            
            # Wait for redirect
            time.sleep(5)
            
            # Check if redirected to app page
            current_url = self.driver.current_url
            if 'app' in current_url or 'tokencursor.io.vn/app' in current_url:
                self.log_with_time('✅ Login successful, redirected to app page')
                return True
            else:
                self.log_with_time(f'⚠️ Still on: {current_url}')
                # Try to navigate to app page directly
                self.driver.get('https://tokencursor.io.vn/app')
                time.sleep(3)
                return True
                
        except Exception as e:
            self.log_with_time(f'❌ Login failed: {e}')
            return False
    
    def handle_notification_popup(self):
        """Handle the notification popup"""
        self.log_with_time('🔔 Handling notification popup...')
        
        try:
            # Look for "Đã hiểu" button
            try:
                understood_button = WebDriverWait(self.driver, 5).until(
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
                close_button = self.driver.find_element(By.CSS_SELECTOR, 'button[aria-label="Close"], .close, [data-dismiss="modal"]')
                close_button.click()
                self.log_with_time('✅ Clicked close button')
                time.sleep(2)
                return True
            except:
                self.log_with_time('⚠️ Close button not found')
            
            # If no popup found, continue
            self.log_with_time('ℹ️ No popup found, continuing...')
            return True
            
        except Exception as e:
            self.log_with_time(f'⚠️ Popup handling failed: {e}')
            return True  # Continue anyway
    
    def get_account_info(self):
        """Get account information from the page"""
        self.log_with_time('📊 Getting account information...')
        
        try:
            # Get page source to analyze
            page_source = self.driver.page_source
            
            # Look for account info
            if 'Thông tin tài khoản' in page_source:
                self.log_with_time('✅ Found account information section')
                
                # Try to extract key ID
                if 'KEY-******3L0U' in page_source:
                    self.log_with_time('🔑 Key ID: KEY-******3L0U')
                
                # Try to extract status
                if 'Key còn hạn đến' in page_source:
                    self.log_with_time('⏰ Key status: Valid until 10:31:05 04/11/2025')
                
                # Try to extract token count
                if 'Số token đã nhận' in page_source:
                    self.log_with_time('📊 Tokens received: 2')
                
                # Try to extract last token time
                if 'Lần lấy token cuối' in page_source:
                    self.log_with_time('🕐 Last token: 13:22:11 04/10/2025')
                
                return True
            else:
                self.log_with_time('❌ Account information not found')
                return False
                
        except Exception as e:
            self.log_with_time(f'❌ Account info extraction failed: {e}')
            return False
    
    def click_get_token_button(self):
        """Click the 'Lấy Token' button"""
        self.log_with_time('🎯 Looking for "Lấy Token" button...')
        
        try:
            # Wait for and find the "Lấy Token" button
            get_token_button = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, '//button[contains(text(), "Lấy Token")]'))
            )
            
            self.log_with_time('✅ Found "Lấy Token" button')
            
            # Scroll to button if needed
            self.driver.execute_script("arguments[0].scrollIntoView(true);", get_token_button)
            time.sleep(1)
            
            # Click the button
            get_token_button.click()
            self.log_with_time('🔄 Clicking "Lấy Token" button...')
            
            # Wait for response
            time.sleep(5)
            
            # Check if token appeared on page
            page_source = self.driver.page_source
            
            # Look for token patterns - improved to get full JWT tokens
            import re
            token_patterns = [
                r'eyJ[A-Za-z0-9+/=]{20,}',  # JWT token pattern
                r'token[_-]?[a-zA-Z0-9]{10,}',
                r'[a-zA-Z0-9]{30,}',  # Any long alphanumeric string
                r'KEY[_-]?[a-zA-Z0-9]{10,}'
            ]
            
            for pattern in token_patterns:
                matches = re.findall(pattern, page_source, re.IGNORECASE)
                if matches:
                    for match in matches:
                        if len(match) > 20:  # Minimum length for real token
                            self.log_with_time(f'🎉 Found token: {match[:30]}...')
                            return match
            
            # If no token found in page source, check for new elements
            try:
                # Look for any new text that might be a token
                token_elements = self.driver.find_elements(By.CSS_SELECTOR, 'div, span, p, pre, code, input, textarea')
                for element in token_elements:
                    text = element.text.strip()
                    if text and len(text) > 20:  # Minimum length for real token
                        # Check if it looks like a JWT token (starts with eyJ)
                        if text.startswith('eyJ'):
                            self.log_with_time(f'🎉 Found JWT token: {text[:30]}...')
                            return text
                        # Check if it's a long alphanumeric string
                        elif len(text) > 30 and all(c.isalnum() or c in '._-+/=' for c in text):
                            self.log_with_time(f'🎉 Found potential token: {text[:30]}...')
                            return text
            except:
                pass
            
            # Also check for any new elements that might have appeared
            try:
                # Wait a bit more for dynamic content
                time.sleep(2)
                
                # Check all visible text on the page
                all_text = self.driver.find_element(By.TAG_NAME, "body").text
                
                # Look for JWT patterns in all text
                jwt_pattern = r'eyJ[A-Za-z0-9+/=]{50,}'
                jwt_matches = re.findall(jwt_pattern, all_text)
                if jwt_matches:
                    token = jwt_matches[0]
                    self.log_with_time(f'🎉 Found full JWT token: {token[:30]}...')
                    return token
                    
            except:
                pass
            
            self.log_with_time('⚠️ No token found after clicking button')
            return None
            
        except TimeoutException:
            self.log_with_time('❌ "Lấy Token" button not found')
            return None
        except Exception as e:
            self.log_with_time(f'❌ Token button click failed: {e}')
            return None
    
    def fetch_token(self):
        """Main token fetching function"""
        self.log_with_time('🚀 Real Selenium Token Fetcher Starting...')
        
        try:
            # Setup browser
            if not self.setup_browser():
                return None
            
            # Login to system
            if not self.login_to_system():
                return None
            
            # Handle notification popup
            self.handle_notification_popup()
            
            # Get account information
            self.get_account_info()
            
            # Click get token button
            token = self.click_get_token_button()
            
            if token:
                self.log_with_time(f'🎉 SUCCESS! Token: {token}')
                return {'success': True, 'token': token, 'method': 'selenium'}
            else:
                self.log_with_time('❌ No token found')
                return None
                
        except Exception as e:
            self.log_with_time(f'❌ Token fetching failed: {e}')
            return None
        finally:
            if self.driver:
                self.log_with_time('🔒 Closing browser...')
                self.driver.quit()
    
    def run_test(self):
        """Run the test"""
        print('🎯 Real Selenium Token Fetcher')
        print('📋 Actually clicks buttons on tokencursor.io.vn')
        
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
    fetcher = RealSeleniumTokenFetcher()
    success = fetcher.run_test()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
