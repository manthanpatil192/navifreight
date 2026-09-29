"""
NaviFreight - Render Backend 24/7 Keep-Alive Daemon
Pings https://navifreight.onrender.com/api/health every 5 minutes
Prevents Render Free Tier from ever going into 45-second sleep mode.
"""

import time
import urllib.request
import json
from datetime import datetime

TARGET_URL = "https://navifreight.onrender.com/api/health"
PING_INTERVAL_SEC = 300  # 5 minutes (Render sleeps after 15 min of inactivity)

def ping():
    now_str = datetime.now().strftime("%H:%M:%S")
    try:
        t0 = time.time()
        req = urllib.request.Request(
            TARGET_URL,
            headers={"User-Agent": "NaviFreight-KeepAlive/1.0"}
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            elapsed_ms = int((time.time() - t0) * 1000)
            status = resp.status
            data = json.loads(resp.read().decode('utf-8'))
            uptime = data.get('uptimeSeconds', 0)
            print(f"[{now_str}]  AWAKE | Status: {status} | Latency: {elapsed_ms}ms | Server Uptime: {uptime}s")
    except Exception as e:
        print(f"[{now_str}]  WARNING | Ping failed: {e}")

if __name__ == "__main__":
    print("=" * 60)
    print("  NaviFreight Render Keep-Alive Daemon (Zero Cold Start)")
    print(f"  Target: {TARGET_URL}")
    print(f"  Pinging every {PING_INTERVAL_SEC} seconds (Render idle limit: 15 min)")
    print("=" * 60)
    
    # Run immediate first ping
    ping()
    
    while True:
        time.sleep(PING_INTERVAL_SEC)
        ping()
