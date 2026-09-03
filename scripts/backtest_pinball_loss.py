"""
NaviFreight True Quantile Regression (Pinball Loss) Walk-Forward Backtest
Empirical validation of 3 separate Gradient Boosted Decision Tree models:
  - Model 1: Low End (alpha = 0.10, Pinball Loss)
  - Model 2: Median  (alpha = 0.50, Pinball Loss / Median)
  - Model 3: High End (alpha = 0.90, Pinball Loss)

Evaluates real out-of-sample asymmetric uncertainty bands on 2,124 days of BDRY data.
"""

import os
import sys
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import RobustScaler

# Windows console utf-8 configuration
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, 'scripts', 'data_cache', 'bdry_real_history.csv')

def pinball_loss(y_true, y_pred, alpha):
    """
    Asymmetric Pinball Loss (Quantile Scoring Function):
    L_alpha(y, y_hat) = max(alpha * (y - y_hat), (alpha - 1) * (y - y_hat))
    """
    err = y_true - y_pred
    return np.mean(np.maximum(alpha * err, (alpha - 1.0) * err))

def load_and_prepare_data():
    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(f"Missing {CSV_PATH}. Run scripts/train_and_save_model.py first.")
    df = pd.read_csv(CSV_PATH, index_col=0, parse_dates=True).sort_index()
    
    # 13 Point-in-time features without lookahead
    df['ret_5d'] = df['bdry_close'].pct_change(5)
    df['ret_21d'] = df['bdry_close'].pct_change(21)
    df['ret_63d'] = df['bdry_close'].pct_change(63)
    df['ret_126d'] = df['bdry_close'].pct_change(126)
    
    df['ma_20'] = df['bdry_close'].rolling(20).mean()
    df['ma_50'] = df['bdry_close'].rolling(50).mean()
    df['ma_200'] = df['bdry_close'].rolling(200).mean()
    df['ratio_close_ma20'] = df['bdry_close'] / df['ma_20']
    df['ratio_close_ma50'] = df['bdry_close'] / df['ma_50']
    df['ratio_ma50_ma200'] = df['ma_50'] / df['ma_200']
    
    roll_std = df['bdry_close'].rolling(20).std()
    df['bollinger_pct_b'] = (df['bdry_close'] - (df['ma_20'] - 2 * roll_std)) / (4 * roll_std + 1e-6)
    df['volatility_21d'] = df['bdry_close'].pct_change(1).rolling(21).std() * np.sqrt(252)
    
    df['brent_ret_21d'] = df['brent_close'].pct_change(21)
    df['brent_ratio_ma50'] = df['brent_close'] / df['brent_close'].rolling(50).mean()
    df['month'] = df.index.month
    df['is_monsoon'] = df['month'].isin([6, 7, 8, 9]).astype(int)
    
    # Target: 21 trading days forward (~30 calendar days)
    df['forward_close_21d'] = df['bdry_close'].shift(-21)
    df['forward_ret_21d'] = (df['forward_close_21d'] - df['bdry_close']) / df['bdry_close']
    
    return df.dropna().copy()

def run_pinball_walk_forward(df):
    feature_cols = [
        'ret_5d', 'ret_21d', 'ret_63d', 'ret_126d',
        'ratio_close_ma20', 'ratio_close_ma50', 'ratio_ma50_ma200',
        'bollinger_pct_b', 'volatility_21d',
        'brent_ret_21d', 'brent_ratio_ma50',
        'month', 'is_monsoon'
    ]
    
    initial_train = 504  # 2 years burn-in
    step = 21           # 1 month forward
    n = len(df)
    
    actual_prices = []
    p10_prices, p50_prices, p90_prices = [], [], []
    actual_returns, p10_returns, p50_returns, p90_returns = [], [], [], []
    
    folds = (n - step - initial_train) // step
    print("\n" + "=" * 70)
    print("   TRAINING 3 SEPARATE PINBALL LOSS MODELS (P10, P50, P90 GBDT)   ")
    print("=" * 70)
    print(f"Total Evaluated Folds:      {folds} expanding monthly windows")
    print(f"Total Dataset Size:         {n} daily trading sessions")
    print(f"Evaluating out-of-sample quantile divergence...")
    
    fold_idx = 0
    for train_end in range(initial_train, n - step, step):
        test_end = min(train_end + step, n)
        
        train_data = df.iloc[:train_end]
        test_data = df.iloc[train_end:test_end]
        
        scaler = RobustScaler()
        X_train = scaler.fit_transform(train_data[feature_cols].values)
        X_test = scaler.transform(test_data[feature_cols].values)
        y_train = train_data['forward_ret_21d'].values
        y_test = test_data['forward_ret_21d'].values
        base_test_prices = test_data['bdry_close'].values
        
        # 1. P10 Low-End Model (alpha = 0.10)
        reg_p10 = GradientBoostingRegressor(loss='quantile', alpha=0.10, n_estimators=35, max_depth=2, learning_rate=0.05, random_state=42)
        reg_p10.fit(X_train, y_train)
        pred_p10 = reg_p10.predict(X_test)
        
        # 2. P50 Median Model (alpha = 0.50)
        reg_p50 = GradientBoostingRegressor(loss='quantile', alpha=0.50, n_estimators=35, max_depth=2, learning_rate=0.05, random_state=42)
        reg_p50.fit(X_train, y_train)
        pred_p50 = reg_p50.predict(X_test)
        
        # 3. P90 High-End Model (alpha = 0.90)
        reg_p90 = GradientBoostingRegressor(loss='quantile', alpha=0.90, n_estimators=35, max_depth=2, learning_rate=0.05, random_state=42)
        reg_p90.fit(X_train, y_train)
        pred_p90 = reg_p90.predict(X_test)
        
        # Store returns
        actual_returns.extend(y_test)
        p10_returns.extend(pred_p10)
        p50_returns.extend(pred_p50)
        p90_returns.extend(pred_p90)
        
        # Calculate actual future prices vs predicted quantile bounds
        actual_forward_p = base_test_prices * (1 + y_test)
        pred_p10_p = base_test_prices * (1 + pred_p10)
        pred_p50_p = base_test_prices * (1 + pred_p50)
        pred_p90_p = base_test_prices * (1 + pred_p90)
        
        actual_prices.extend(actual_forward_p)
        p10_prices.extend(pred_p10_p)
        p50_prices.extend(pred_p50_p)
        p90_prices.extend(pred_p90_p)
        
        fold_idx += 1
        
    actual_prices = np.array(actual_prices)
    p10_prices = np.array(p10_prices)
    p50_prices = np.array(p50_prices)
    p90_prices = np.array(p90_prices)
    
    actual_returns = np.array(actual_returns)
    p10_returns = np.array(p10_returns)
    p50_returns = np.array(p50_returns)
    p90_returns = np.array(p90_returns)
    
    # 1. Empirical Interval Coverage (Did actual price fall between P10 and P90?)
    in_interval = (actual_prices >= p10_prices) & (actual_prices <= p90_prices)
    coverage_pct = np.mean(in_interval) * 100
    
    # 2. Left and Right Tail Breach Rates
    below_p10 = np.mean(actual_prices < p10_prices) * 100
    above_p90 = np.mean(actual_prices > p90_prices) * 100
    
    # 3. Pinball Losses (Quantile Scored Losses)
    loss_p10 = pinball_loss(actual_returns, p10_returns, 0.10)
    loss_p50 = pinball_loss(actual_returns, p50_returns, 0.50)
    loss_p90 = pinball_loss(actual_returns, p90_returns, 0.90)
    
    # 4. Asymmetry Ratio: Right Tail Spread vs Left Tail Spread
    right_tail_spread = np.mean(p90_prices - p50_prices)
    left_tail_spread = np.mean(p50_prices - p10_prices)
    asymmetry_ratio = right_tail_spread / (left_tail_spread + 1e-6)
    
    # 5. Median MAPE
    mape = np.mean(np.abs((actual_prices - p50_prices) / actual_prices)) * 100
    
    print("\n" + "=" * 70)
    print("      REAL PINBALL LOSS WALK-FORWARD BACKTEST RESULTS                 ")
    print("=" * 70)
    print(f"Total Out-of-Sample Test Days:       {len(actual_prices)} days across {fold_idx} folds")
    print(f"Median Point Forecast MAPE (P50):    {mape:.2f}%")
    print(f"Empirical 90% Band Coverage:         {coverage_pct:.2f}%  (Target: 90.00%)")
    print("-" * 70)
    print("TAIL BREACH RATES (Scored by Pinball Loss):")
    print(f"  * Bottom Tail Breach (< P10):      {below_p10:.2f}%  (Target: 10.00%)")
    print(f"  * Upper Tail Breach  (> P90):      {above_p90:.2f}%  (Target: 10.00%)")
    print("-" * 70)
    print("PINBALL QUANTILE LOSS VALUES:")
    print(f"  * P10 Pinball Loss (alpha = 0.10): {loss_p10:.4f}")
    print(f"  * P50 Pinball Loss (alpha = 0.50): {loss_p50:.4f}")
    print(f"  * P90 Pinball Loss (alpha = 0.90): {loss_p90:.4f}")
    print("-" * 70)
    print("LEARNED SPREAD ASYMMETRY (Fat Right Tail):")
    print(f"  * Average Upside Spike (P90 - P50): +${right_tail_spread:.2f} /share")
    print(f"  * Average Downside Dip  (P50 - P10): -${left_tail_spread:.2f} /share")
    print(f"  * Asymmetry Factor:                 {asymmetry_ratio:.2f}x (Upside spikes are {asymmetry_ratio:.2f}x larger!)")
    print("=" * 70 + "\n")
    
    return {
        'coverage': coverage_pct,
        'below_p10': below_p10,
        'above_p90': above_p90,
        'loss_p10': loss_p10,
        'loss_p50': loss_p50,
        'loss_p90': loss_p90,
        'asymmetry': asymmetry_ratio,
        'mape': mape
    }

if __name__ == '__main__':
    data = load_and_prepare_data()
    run_pinball_walk_forward(data)
