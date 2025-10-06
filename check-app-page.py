#!/usr/bin/env python3
"""
Check App Page - See what's actually on the app page
"""

import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

def check_app_page():
    print('🔍 Check App Page')
    
    # Setup browser
    chrome_options = Options()
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    
    driver = webdriver.Chrome(chrome_options=chrome_options)
    
    try:
        # Login first
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
        print('📡 Going to app page...')
        driver.get('https://tokencursor.io.vn/app')
        time.sleep(5)
        
        # Get current URL
        current_url = driver.current_url
        print(f'📍 Current URL: {current_url}')
        
        # Get page title
        title = driver.title
        print(f'📄 Page title: {title}')
        
        # Get all text on page
        all_text = driver.find_element(By.TAG_NAME, "body").text
        print(f'📊 Visible text length: {len(all_text)}')
        
        # Show first 1000 chars
        print('\n📝 First 1000 chars of visible text:')
        print(all_text[:1000])
        
        # Look for buttons
        buttons = driver.find_elements(By.TAG_NAME, "button")
        print(f'\n🔘 Found {len(buttons)} buttons:')
        for i, button in enumerate(buttons):
            try:
                text = button.text.strip()
                if text:
                    print(f'   {i+1}: "{text}"')
            except:
                pass
        
        # Look for any text containing "Token" or "Lấy"
        if 'Token' in all_text or 'Lấy' in all_text:
            print('\n🎯 Found "Token" or "Lấy" in page text!')
        else:
            print('\n❌ No "Token" or "Lấy" found in page text')
        
        # Save page content
        with open('app_page_content.txt', 'w', encoding='utf-8') as f:
            f.write(f"URL: {current_url}\n")
            f.write(f"Title: {title}\n")
            f.write(f"Text Length: {len(all_text)}\n\n")
            f.write("=== VISIBLE TEXT ===\n")
            f.write(all_text)
        
        print('\n💾 Page content saved to app_page_content.txt')
        
    except Exception as e:
        print(f'❌ Error: {e}')
    finally:
        driver.quit()

if __name__ == "__main__":
    check_app_page()
