import os
import sys
import time
import urllib.request
import zipfile

def download_resumable(url, destination_path, max_retries=10):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
    
    for attempt in range(max_retries):
        try:
            downloaded = 0
            if os.path.exists(destination_path):
                downloaded = os.path.getsize(destination_path)
                
            req = urllib.request.Request(url, headers=headers)
            if downloaded > 0:
                req.add_header('Range', f'bytes={downloaded}-')
                print(f"Resuming download from byte {downloaded} ({downloaded/1024/1024:.2f} MB)...")
            else:
                print("Starting fresh download...")
                
            with urllib.request.urlopen(req, timeout=30) as resp:
                content_range = resp.headers.get('Content-Range')
                status = resp.status
                
                # Check if server respects range
                mode = 'ab' if downloaded > 0 and status == 206 else 'wb'
                if mode == 'wb':
                    downloaded = 0
                    
                total_size = resp.headers.get('Content-Length')
                total_bytes = (int(total_size) + downloaded) if total_size else None
                
                with open(destination_path, mode) as f:
                    while True:
                        chunk = resp.read(64 * 1024)
                        if not chunk:
                            break
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total_bytes:
                            sys.stdout.write(f"\rProgress: {downloaded/1024/1024:.1f}/{total_bytes/1024/1024:.1f} MB ({(downloaded/total_bytes)*100:.1f}%)")
                        else:
                            sys.stdout.write(f"\rDownloaded: {downloaded/1024/1024:.1f} MB")
                        sys.stdout.flush()
                        
            print("\nDownload completed successfully!")
            return True
        except Exception as e:
            print(f"\n[Attempt {attempt+1}/{max_retries}] Network hiccup: {e}. Retrying in 2 seconds...")
            time.sleep(2)
            
    return False

def main():
    tools_dir = r"e:\hackathon\tools"
    os.makedirs(tools_dir, exist_ok=True)
    zip_path = os.path.join(tools_dir, "node.zip")
    extract_target = os.path.join(tools_dir, "node")
    
    url = "https://nodejs.org/dist/v20.18.0/node-v20.18.0-win-x64.zip"
    success = download_resumable(url, zip_path)
    if not success:
        print("Failed to download Node.js after retries.")
        sys.exit(1)
        
    print("Verifying and extracting zip archive...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(tools_dir)
        
    extracted_folder = os.path.join(tools_dir, "node-v20.18.0-win-x64")
    if os.path.exists(extract_target):
        import shutil
        shutil.rmtree(extract_target, ignore_errors=True)
    os.rename(extracted_folder, extract_target)
    
    node_exe = os.path.join(extract_target, "node.exe")
    npm_cmd = os.path.join(extract_target, "npm.cmd")
    print(f"\nNode.js ready at: {node_exe}")
    print(f"npm ready at: {npm_cmd}")
    print("SUCCESS")

if __name__ == '__main__':
    main()
