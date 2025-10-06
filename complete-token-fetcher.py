#!/usr/bin/env python3
"""
Complete Token Fetcher - Login first, then get full token
"""

import time
import re
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def complete_token_fetch():
    print('🎯 Complete Token Fetcher')
    print('📋 Login first, then get full token')
    
    # Setup browser
    chrome_options = Options()
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    
    driver = webdriver.Chrome(chrome_options=chrome_options)
    
    try:
        # Step 1: Login
        print('🔑 Step 1: Logging in...')
        driver.get('https://tokencursor.io.vn/login')
        time.sleep(3)
        
        # Enter key
        key_input = driver.find_element(By.CSS_SELECTOR, 'input[type="text"], input[type="password"]')
        key_input.clear()
        key_input.send_keys('KEY-8GFN9U3L0U')
        print('⌨️ Entered key: KEY-8GFN9U3L0U')
        
        # Click login
        login_button = driver.find_element(By.XPATH, '//button[contains(text(), "Đăng nhập")]')
        login_button.click()
        print('🔄 Clicking login button...')
        time.sleep(5)
        
        # Step 2: Go to app page
        print('📡 Step 2: Going to app page...')
        driver.get('https://tokencursor.io.vn/app')
        time.sleep(5)
        
        # Check if we're still on login page (redirected)
        current_url = driver.current_url
        if 'login' in current_url:
            print('⚠️ Still on login page, trying again...')
            time.sleep(2)
            driver.get('https://tokencursor.io.vn/app')
            time.sleep(5)
        
        # Step 3: Handle popup
        print('🔔 Step 3: Handling popup...')
        try:
            understood_button = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.XPATH, '//button[contains(text(), "Đã hiểu")]'))
            )
            understood_button.click()
            print('✅ Clicked "Đã hiểu" button')
            time.sleep(2)
        except:
            print('⚠️ No popup found')
        
        # Step 4: Click "Lấy Token"
        print('🎯 Step 4: Clicking "Lấy Token"...')
        try:
            get_token_button = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, '//button[contains(text(), "Lấy Token")]'))
            )
            get_token_button.click()
            print('✅ Clicked "Lấy Token" button')
            time.sleep(5)
        except Exception as e:
            print(f'❌ Could not find "Lấy Token" button: {e}')
            return None
        
        # Step 5: Extract token
        print('🔍 Step 5: Extracting token...')
        
        # Get page content
        page_source = driver.page_source
        all_text = driver.find_element(By.TAG_NAME, "body").text
        
        print(f'📊 Page source length: {len(page_source)}')
        print(f'📊 Visible text length: {len(all_text)}')
        
        # Look for JWT tokens with different patterns
        jwt_patterns = [
            r'eyJ[A-Za-z0-9+/=]{50,}',  # Full JWT
            r'eyJ[A-Za-z0-9+/=]{100,}', # Very long JWT
            r'eyJ[A-Za-z0-9+/=]{200,}', # Extra long JWT
        ]
        
        found_tokens = []
        for pattern in jwt_patterns:
            matches = re.findall(pattern, page_source)
            if matches:
                found_tokens.extend(matches)
        
        # Remove duplicates and sort by length
        found_tokens = list(set(found_tokens))
        found_tokens.sort(key=len, reverse=True)
        
        if found_tokens:
            print(f'🎉 Found {len(found_tokens)} JWT tokens:')
            for i, token in enumerate(found_tokens):
                print(f'   {i+1}: {token[:50]}... (length: {len(token)})')
            
            # Use the longest token
            best_token = found_tokens[0]
            print(f'✅ Best token: {best_token[:50]}... (length: {len(best_token)})')
            
            # Save token
            with open('complete_token.txt', 'w') as f:
                f.write(best_token)
            print('💾 Token saved to complete_token.txt')
            
            return best_token
        else:
            print('❌ No JWT tokens found')
            
            # Debug: Show some page content
            print('\n📝 First 500 chars of visible text:')
            print(all_text[:500])
            
            # Save debug content
            with open('debug_complete.txt', 'w', encoding='utf-8') as f:
                f.write("=== PAGE SOURCE ===\n")
                f.write(page_source)
                f.write("\n\n=== VISIBLE TEXT ===\n")
                f.write(all_text)
            print('💾 Debug content saved to debug_complete.txt')
            
            return None
        
    except Exception as e:
        print(f'❌ Error: {e}')
        return None
    finally:
        driver.quit()

if __name__ == "__main__":
    token = complete_token_fetch()
    if token:
        print(f'\n✅ SUCCESS!')
        print(f'🎯 Token: {token[:50]}...')
        print(f'📏 Length: {len(token)} characters')
    else:
        print(f'\n❌ FAILED!')
        print('🔧 No token found')
