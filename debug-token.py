#!/usr/bin/env python3
"""
Debug Token Script - See what's actually on the page after clicking "Lấy Token"
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

class DebugTokenFetcher:
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
    
    def login_and_debug(self):
        """Login and debug token extraction"""
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
            
            # Navigate to app page
            self.driver.get('https://tokencursor.io.vn/app')
            time.sleep(3)
            
            # Handle notification popup
            try:
                understood_button = WebDriverWait(self.driver, 5).until(
                    EC.element_to_be_clickable((By.XPATH, '//button[contains(text(), "Đã hiểu")]'))
                )
                understood_button.click()
                self.log_with_time('✅ Clicked "Đã hiểu" button')
                time.sleep(2)
            except:
                self.log_with_time('⚠️ No popup found')
            
            # Find and click "Lấy Token" button
            get_token_button = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, '//button[contains(text(), "Lấy Token")]'))
            )
            
            self.log_with_time('✅ Found "Lấy Token" button')
            
            # Click the button
            get_token_button.click()
            self.log_with_time('🔄 Clicking "Lấy Token" button...')
            
            # Wait for response
            time.sleep(5)
            
            # DEBUG: Get all page content
            self.log_with_time('🔍 DEBUG: Analyzing page content...')
            
            # Get page source
            page_source = self.driver.page_source
            self.log_with_time(f'📄 Page source length: {len(page_source)} characters')
            
            # Get all visible text
            all_text = self.driver.find_element(By.TAG_NAME, "body").text
            self.log_with_time(f'📝 All visible text length: {len(all_text)} characters')
            
            # Look for any text that might be a token
            import re
            
            # Check for JWT patterns
            jwt_patterns = [
                r'eyJ[A-Za-z0-9+/=]{20,}',
                r'eyJ[A-Za-z0-9+/=]{50,}',
                r'eyJ[A-Za-z0-9+/=]{100,}',
            ]
            
            for pattern in jwt_patterns:
                matches = re.findall(pattern, page_source)
                if matches:
                    self.log_with_time(f'🎯 Found JWT matches with pattern {pattern}:')
                    for i, match in enumerate(matches):
                        self.log_with_time(f'   Match {i+1}: {match[:50]}... (length: {len(match)})')
            
            # Check for any long alphanumeric strings
            long_strings = re.findall(r'[a-zA-Z0-9]{30,}', page_source)
            if long_strings:
                self.log_with_time(f'🔍 Found {len(long_strings)} long strings:')
                for i, string in enumerate(long_strings[:10]):  # Show first 10
                    self.log_with_time(f'   String {i+1}: {string[:50]}... (length: {len(string)})')
            
            # Check all elements for text content
            self.log_with_time('🔍 Checking all elements for token content...')
            elements = self.driver.find_elements(By.CSS_SELECTOR, '*')
            token_candidates = []
            
            for element in elements:
                try:
                    text = element.text.strip()
                    if text and len(text) > 20:
                        # Check if it looks like a token
                        if any(char.isalnum() for char in text):
                            token_candidates.append((element.tag_name, text[:50], len(text)))
                except:
                    pass
            
            if token_candidates:
                self.log_with_time(f'🎯 Found {len(token_candidates)} potential token elements:')
                for tag, text, length in token_candidates[:10]:  # Show first 10
                    self.log_with_time(f'   {tag}: {text}... (length: {length})')
            
            # Save debug info to file
            with open('debug_page_content.txt', 'w', encoding='utf-8') as f:
                f.write("=== PAGE SOURCE ===\n")
                f.write(page_source)
                f.write("\n\n=== VISIBLE TEXT ===\n")
                f.write(all_text)
            
            self.log_with_time('💾 Debug content saved to debug_page_content.txt')
            
            return True
                
        except Exception as e:
            self.log_with_time(f'❌ Debug failed: {e}')
            return False
        finally:
            if self.driver:
                self.log_with_time('🔒 Closing browser...')
                self.driver.quit()
    
    def run_debug(self):
        """Run the debug"""
        print('🔍 Debug Token Script')
        print('📋 Analyzing what happens after clicking "Lấy Token"')
        
        try:
            if not self.setup_browser():
                return False
            
            success = self.login_and_debug()
            
            if success:
                print('\n✅ DEBUG COMPLETED!')
                print('📄 Check debug_page_content.txt for full page content')
                return True
            else:
                print('\n❌ DEBUG FAILED!')
                return False
                
        except Exception as e:
            print(f'\n💥 Debug crashed: {e}')
            return False

def main():
    debugger = DebugTokenFetcher()
    success = debugger.run_debug()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
