#!/usr/bin/env python3
"""
Minimal Debug - Just get page content
"""

import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

def minimal_debug():
    print('🔍 Minimal Debug')
    
    # Setup browser
    chrome_options = Options()
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    
    driver = webdriver.Chrome(chrome_options=chrome_options)
    
    try:
        # Go to app page directly
        print('📡 Going to app page...')
        driver.get('https://tokencursor.io.vn/app')
        time.sleep(5)
        
        # Get page content
        print('📄 Getting page content...')
        page_source = driver.page_source
        
        # Look for JWT tokens
        import re
        jwt_matches = re.findall(r'eyJ[A-Za-z0-9+/=]{20,}', page_source)
        print(f'🎯 Found {len(jwt_matches)} JWT matches:')
        for i, match in enumerate(jwt_matches):
            print(f'   {i+1}: {match} (length: {len(match)})')
        
        # Save to file
        with open('minimal_debug.txt', 'w', encoding='utf-8') as f:
            f.write(page_source)
        
        print('💾 Content saved to minimal_debug.txt')
        
    except Exception as e:
        print(f'❌ Error: {e}')
    finally:
        driver.quit()

if __name__ == "__main__":
    minimal_debug()
