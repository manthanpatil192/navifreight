import urllib.request
import urllib.parse
import re
import json

def search_ddg(query):
    url = 'https://html.duckduckgo.com/html/?q=' + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8', errors='ignore')
        matches = re.findall(r'class="result__snippet"[^>]*>(.*?)</a>', html)
        for i, m in enumerate(matches[:5]):
            clean = re.sub(r'<[^>]+>', '', m)
            print(f"Match {i+1}:\n{clean}\n")
    except Exception as e:
        print("Error:", e)

print("--- PAPER 1 (TRE 2020) ---")
search_ddg("Integrating fleet deployment into liner shipping vessel repositioning Daniel Wetzel Kevin Tierney")

print("\n--- PAPER 2 (TRB 2024) ---")
search_ddg("Liner fleet deployment and empty container repositioning under demand uncertainty: A robust optimization approach Xi Xiang")
