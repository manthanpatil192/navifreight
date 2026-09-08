import urllib.request
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}

url1 = "https://www.sciencedirect.com/science/article/abs/pii/S1366554520307481"
url2 = "https://www.sciencedirect.com/science/article/abs/pii/S0191261524002121"

for label, url in [("Paper 1", url1), ("Paper 2", url2)]:
    try:
        req = urllib.request.Request(url, headers=headers)
        html = urllib.request.urlopen(req, timeout=10).read().decode('utf-8', errors='ignore')
        title = re.search(r'<title>(.*?)</title>', html)
        print(f"{label} Title:", title.group(1) if title else "Not found")
        # Look for abstract or description
        desc = re.search(r'<meta name="description" content="(.*?)"', html)
        if desc:
            print(f"{label} Description:", desc.group(1))
        # Look for abstract div
        abstract = re.search(r'class="abstract[^"]*"[^>]*>(.*?)</div>', html, re.DOTALL)
        if abstract:
            clean = re.sub(r'<[^>]+>', ' ', abstract.group(1))
            print(f"{label} Abstract:", clean[:500])
    except Exception as e:
        print(f"{label} Error:", e)
