import urllib.request
import os
import sys
import time
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

url = 'https://dl.google.com/android/repository/android-ndk-r27b-windows.zip'
dest = os.path.expanduser('~\\Downloads\\android-ndk-r27b-windows.zip')

print(f"Downloading {url} to {dest}")
req = urllib.request.Request(url, method='HEAD')
with urllib.request.urlopen(req) as response:
    total_size = int(response.headers.get('Content-Length', 0))

print(f"Total expected size: {total_size} bytes ({total_size / (1024*1024):.2f} MB)")

while True:
    current_size = os.path.getsize(dest) if os.path.exists(dest) else 0
    if total_size > 0 and current_size >= total_size:
        print(f"\nDownload complete! {current_size} bytes.")
        break
    
    print(f"\nCurrent size: {current_size} bytes. Resuming...")
    req = urllib.request.Request(url)
    if current_size > 0:
        req.headers['Range'] = f'bytes={current_size}-'
    
    try:
        with urllib.request.urlopen(req, timeout=10) as response, open(dest, 'ab') as f:
            while True:
                chunk = response.read(1024 * 1024 * 5) # 5MB chunks
                if not chunk:
                    break
                f.write(chunk)
                current_size += len(chunk)
                print(f"Progress: {current_size / (1024*1024):.2f} MB / {total_size / (1024*1024):.2f} MB", end='\r')
    except Exception as e:
        print(f"\nError: {e}. Retrying in 2 seconds...")
        time.sleep(2)
