#!/usr/bin/env python3
"""
Simple Debug - Just get the page content after clicking "Lấy Token"
"""

import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def debug_token():
    print('🔍 Simple Debug - Getting page content after "Lấy Token"')
    
    # Setup browser
    chrome_options = Options()
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    
    driver = webdriver.Chrome(chrome_options=chrome_options)
    
    try:
        # Login
        print('🔑 Logging in...')
        driver.get('https://tokencursor.io.vn/login')
        time.sleep(3)
        
        # Enter key
        key_input = driver.find_element(By.CSS_SELECTOR, 'input[type="text"], input[type="password"]')
        key_input.clear()
        key_input.send_keys('KEY-8GFN9U3L0U')
        
        # Click login
        login_button = driver.find_element(By.XPATH, '//button[contains(text(), "Đăng nhập")]')
        login_button.click()
        time.sleep(5)
        
        # Go to app page
        driver.get('https://tokencursor.io.vn/app')
        time.sleep(3)
        
        # Handle popup
        try:
            understood_button = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.XPATH, '//button[contains(text(), "Đã hiểu")]'))
            )
            understood_button.click()
            time.sleep(2)
        except:
            print('⚠️ No popup found')
        
        # Click "Lấy Token"
        print('🎯 Clicking "Lấy Token"...')
        get_token_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, '//button[contains(text(), "Lấy Token")]'))
        )
        get_token_button.click()
        time.sleep(5)
        
        # Get page content
        print('📄 Getting page content...')
        page_source = driver.page_source
        all_text = driver.find_element(By.TAG_NAME, "body").text
        
        print(f'📊 Page source length: {len(page_source)}')
        print(f'📊 Visible text length: {len(all_text)}')
        
        # Look for JWT tokens
        import re
        jwt_matches = re.findall(r'eyJ[A-Za-z0-9+/=]{20,}', page_source)
        print(f'🎯 Found {len(jwt_matches)} JWT matches:')
        for i, match in enumerate(jwt_matches):
            print(f'   {i+1}: {match} (length: {len(match)})')
        
        # Save to file
        with open('debug_content.txt', 'w', encoding='utf-8') as f:
            f.write("=== PAGE SOURCE ===\n")
            f.write(page_source)
            f.write("\n\n=== VISIBLE TEXT ===\n")
            f.write(all_text)
        
        print('💾 Content saved to debug_content.txt')
        
        # Show first 500 chars of visible text
        print('\n📝 First 500 chars of visible text:')
        print(all_text[:500])
        
    except Exception as e:
        print(f'❌ Error: {e}')
    finally:
        driver.quit()

if __name__ == "__main__":
    debug_token()
