"""
NaviFreight Market Entry Timing Quantile Labeler
Evaluates whether an as-of date represents an optimal dip fixture entry point:
Condition: current_rate <= forward_30d_p10 (10th percentile floor)
"""

import os
import sys
import pandas as pd
import numpy as np

# Windows console utf-8 configuration
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, 'scripts', 'data_cache', 'bdry_real_history.csv')

def evaluate_entry(as_of_date="2023-11-15"):
    print("\n" + "=" * 70)
    print("      NAVIFREIGHT OPTIMAL ENTRY TIMING QUANTILE LABELER               ")
    print("=" * 70)
    
    if os.path.exists(CSV_PATH):
        df_raw = pd.read_csv(CSV_PATH, index_col=0, parse_dates=True)
        df = df_raw['bdry_close']
    else:
        import yfinance as yf
        df = yf.download("BDRY", start="2018-03-01", progress=False)["Close"]
        if isinstance(df, pd.DataFrame):
            df = df.iloc[:, 0]
            
    as_of = pd.Timestamp(as_of_date)
    if as_of not in df.index:
        # Find closest date
        idx = df.index.get_indexer([as_of], method='nearest')[0]
        as_of = df.index[idx]
        
    current_rate = float(df.loc[as_of])
    
    # Next 30 trading days
    loc_idx = df.index.get_loc(as_of)
    forward_window = df.iloc[loc_idx + 1 : loc_idx + 31]
    p10_forward = float(forward_window.quantile(0.10))
    p50_forward = float(forward_window.median())
    p90_forward = float(forward_window.quantile(0.90))
    
    label_good_entry = int(current_rate <= p10_forward)
    
    print(f"As-of date:              {as_of.strftime('%Y-%m-%d')}")
    print(f"Current spot rate:       ${current_rate:.2f} /share (BDRY)")
    print(f"Forward 30d P10 floor:   ${p10_forward:.2f} /share (10th percentile)")
    print(f"Forward 30d Median:      ${p50_forward:.2f} /share (50th percentile)")
    print(f"Forward 30d P90 stress:  ${p90_forward:.2f} /share (90th percentile)")
    print("-" * 70)
    print(f"Label (good entry):      {label_good_entry}")
    
    if label_good_entry == 1:
        print("[ACTION]: OPTIMAL MARKET ENTRY DIP DETECTED!")
        print(f"  * Current spot rate (${current_rate:.2f}) is at or below the 10th percentile floor (${p10_forward:.2f}).")
        print("  * Recommendation: Execute spot fixture immediately to capture bottom rates before forward surge.")
    else:
        print("[ACTION]: NOT A LOW-DIP ENTRY POINT")
        print(f"  * Current spot rate (${current_rate:.2f}) exceeds forward P10 floor (${p10_forward:.2f}).")
        print("  * Recommendation: Lock COA contract or wait for seasonal correction.")
    print("=" * 70 + "\n")

if __name__ == '__main__':
    target_date = sys.argv[1] if len(sys.argv) > 1 else "2023-11-15"
    evaluate_entry(target_date)
