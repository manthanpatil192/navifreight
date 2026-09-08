import urllib.request
import json
import re

# Try fetching via Google Search or Bing API or Unpaywall
doi2 = "10.1016/j.trb.2024.103088"
req = urllib.request.Request(f"https://api.unpaywall.org/v2/{doi2}?email=researcher@university.edu")
try:
    res = urllib.request.urlopen(req)
    data = json.loads(res.read())
    print("Unpaywall oa_locations:", len(data.get("oa_locations", [])))
    for loc in data.get("oa_locations", []):
        print("URL:", loc.get("url"))
except Exception as e:
    print("Unpaywall error:", e)

# Let's search arxiv or dblp or google
req2 = urllib.request.Request(f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pmc&term={doi2}&retmode=json")
try:
    res2 = urllib.request.urlopen(req2)
    print("PMC:", res2.read().decode())
except Exception as e:
    print("PMC error:", e)
