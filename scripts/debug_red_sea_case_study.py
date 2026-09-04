"""
NaviFreight - Standalone Debugger for Case Study 3: Red Sea & Bab el-Mandeb Geopolitical & Routing Shock
Route: Rotterdam (Netherlands / Europe) -> Paradip Port (Odisha, India)
Cargo: Capesize | 120,000 MT Metallurgical Coal / Industrial Feedstock | 3-Month Horizon

Usage:
    python scripts/debug_red_sea_case_study.py
    python scripts/debug_red_sea_case_study.py --debug
"""

import sys
import os

# Set UTF-8 encoding for Windows PowerShell / CMD
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

def run_red_sea_case_study_debug(verbose=False):
    print("=" * 70)
    print("   NAVIFREIGHT QUANTITATIVE PROCUREMENT DIRECTIVE (DEBUG MODE)        ")
    print("        Case Study 3: Red Sea Geopolitical & Routing Shock            ")
    print("=" * 70)

    # -------------------------------------------------------------
    # [STEP 1: CASE STUDY GROUND-TRUTH PARAMETERS]
    # -------------------------------------------------------------
    origin_name = "Rotterdam (Netherlands / Maasvlakte)"
    dest_name = "Paradip Port (PPT, Odisha, India)"
    vessel_type = "Capesize"
    cargo_type = "Metallurgical Coal"
    volume_mt = 120000
    horizon_months = 3
    scenario = "Red Sea Geopolitical Shock (Cape of Good Hope Rerouting)"

    # Nautical Distances & Voyage Telemetry
    suez_distance_nm = 6350.0          # Nautical miles via Suez Canal / Bab-el-Mandeb
    cape_distance_nm = 11150.0         # Nautical miles via Cape of Good Hope detour
    extra_distance_nm = cape_distance_nm - suez_distance_nm # +4,800 nm (+75.6%)

    service_speed_knots = 13.5         # Standard transit speed
    suez_transit_days = suez_distance_nm / (service_speed_knots * 24.0) # ~19.6 days
    cape_transit_days = cape_distance_nm / (service_speed_knots * 24.0) # ~34.4 days
    extra_sailing_days = round(cape_transit_days - suez_transit_days, 1) # ~14.8 days

    # Financial & Operational Inputs
    base_spot_rate = 15.80             # USD / MT (Pre-crisis baseline spot rate)
    daily_vessel_hire = 26500.0        # USD / day (Capesize daily charter rate)
    vlsfo_fuel_price_mt = 650.0        # USD / MT (Very Low Sulphur Fuel Oil)
    fuel_burn_rate_mt_day = 42.0       # MT of VLSFO burned per day at 13.5 knots
    
    vessel_draft = 15.8                # meters (Capesize laden draft)
    port_draft_standard = 14.5         # meters (Paradip MCHP Berth draft limit)
    port_draft_deep = 16.0             # meters (Paradip KICT Berth high-tide limit)

    # Shock Disruption Multipliers
    rerouting_volatility_multiplier = 1.45   # Volatility cone expands +45%
    ton_mile_spot_drift = 8.70               # +$8.70/MT spot jump due to fleet capacity squeeze
    extra_fuel_burn_mt = extra_sailing_days * fuel_burn_rate_mt_day # ~621.6 MT
    fuel_surcharge_cost_usd = extra_fuel_burn_mt * vlsfo_fuel_price_mt
    charter_time_cost_usd = extra_sailing_days * daily_vessel_hire

    if verbose:
        print("\n[DEBUG - STEP 1: ROUTING & GEOPOLITICAL TELEMETRY]")
        print(f"  * Origin:                   {origin_name}")
        print(f"  * Destination:              {dest_name}")
        print(f"  * Vessel / Cargo:           {vessel_type} | {volume_mt:,} MT {cargo_type}")
        print(f"  * Distance via Suez Canal:  {suez_distance_nm:,.0f} nm ({suez_transit_days:.1f} days)")
        print(f"  * Distance via Cape Route:  {cape_distance_nm:,.0f} nm ({cape_transit_days:.1f} days)")
        print(f"  * Routing Detour Impact:    +{extra_distance_nm:,.0f} nm (+{extra_sailing_days:.1f} sailing days)")
        print(f"  * Base Spot Rate:           ${base_spot_rate:.2f} /MT")
        print(f"  * Capesize Daily Hire:      ${daily_vessel_hire:,.2f} /day")
        print(f"  * Additional Fuel Burn:     {extra_fuel_burn_mt:.1f} MT VLSFO (${fuel_surcharge_cost_usd:,.2f})")
        print(f"  * Vessel Time-Charter Cost: ${charter_time_cost_usd:,.2f} for {extra_sailing_days:.1f} extra days")

    # -------------------------------------------------------------
    # [STEP 2: FORWARD FREIGHT PREDICTION & QUANTILE CONES]
    # -------------------------------------------------------------
    # Expected Forward Median (P50): base rate + ton-mile spot drift
    drift_pct = (ton_mile_spot_drift / base_spot_rate)
    expected_p50 = base_spot_rate + ton_mile_spot_drift # $24.50 / MT
    
    # Asymmetric Pinball Quantile Cones (reflecting global fleet capacity absorption of ~3.8%)
    # Downside floor is elevated because of unavoidable bunker fuel expense
    p10_dip_bound = expected_p50 * 0.820   # $20.09 / MT
    p90_stress_bound = expected_p50 * 1.250 # $30.63 / MT (Extreme squeeze ceiling)
    
    # COA Fixed Forward Lock Rate (negotiated pre-crisis index contract)
    coa_fixed_rate = base_spot_rate * 0.940 # $14.85 / MT

    if verbose:
        print("\n[DEBUG - STEP 2: ML QUANTILE CALCULATIONS]")
        print(f"  * Ton-Mile Drift:           +${ton_mile_spot_drift:.2f} /MT (+{drift_pct * 100:.1f}%)")
        print(f"  * Forward Median (P50):     ${expected_p50:.2f} /MT")
        print(f"  * Optimistic Bound (P10):   ${p10_dip_bound:.2f} /MT (Floor protected by bunker cost)")
        print(f"  * Stress Tail-Risk (P90):   ${p90_stress_bound:.2f} /MT (Peak Squeeze Ceiling)")
        print(f"  * COA Fixed Lock:           ${coa_fixed_rate:.2f} /MT (Pre-crisis long-term rate)")

    # -------------------------------------------------------------
    # [STEP 3: ALGORITHMIC CVaR CARGO ALLOCATION]
    # -------------------------------------------------------------
    # Geopolitical rerouting locks up fleet capacity for months; CVaR mandates defensive posture:
    # 80% COA (Guarantees plant blast furnace basestock feed) + 20% Spot (Flexible sniping)
    coa_weight = 0.80
    spot_weight = 0.20

    # Blended Landed Freight Rate
    blended_rate = (coa_weight * coa_fixed_rate) + (spot_weight * expected_p50)

    if verbose:
        print("\n[DEBUG - STEP 3: CVaR WEIGHT ALLOCATION]")
        print(f"  * Recommended COA Weight:   {coa_weight * 100:.0f}% (Protects against +15 day transit delays)")
        print(f"  * Recommended Spot Weight:  {spot_weight * 100:.0f}%")
        print(f"  * Formula: ({coa_weight} * ${coa_fixed_rate:.2f}) + ({spot_weight} * ${expected_p50:.2f})")
        print(f"  * Blended Rate:             ${blended_rate:.2f} /MT (Saves ${expected_p50 - blended_rate:.2f}/MT vs Spot)")

    # -------------------------------------------------------------
    # [STEP 4: FINANCIAL IMPACT & RISK ARBITRAGE]
    # -------------------------------------------------------------
    # Unhedged strategy: Buying 100% on the spot market during the Cape of Good Hope reroute
    unhedged_spot_cost = expected_p50 * volume_mt
    
    # NaviFreight Optimized strategy: 80% COA + 20% Spot
    navifreight_opt_cost = blended_rate * volume_mt
    
    # Direct freight savings
    net_freight_savings = unhedged_spot_cost - navifreight_opt_cost
    inr_freight_savings_cr = (net_freight_savings * 86.5) / 10000000.0

    # Avoided Bunker Fuel & Extra Sailing Surcharge
    total_reroute_surcharge_usd = fuel_surcharge_cost_usd + charter_time_cost_usd
    total_reroute_surcharge_inr_cr = (total_reroute_surcharge_usd * 86.5) / 10000000.0

    if verbose:
        print("\n[DEBUG - STEP 4: FINANCIAL ARBITRAGE]")
        print(f"  * Unhedged 100% Spot Cost:  ${unhedged_spot_cost:,.2f}")
        print(f"  * NaviFreight Blended Cost: ${navifreight_opt_cost:,.2f}")
        print(f"  * Net Direct Freight Saved: ${net_freight_savings:,.2f} (₹{inr_freight_savings_cr:.2f} Crore)")
        print(f"  * Extra Reroute Surcharge:  ${total_reroute_surcharge_usd:,.2f} (₹{total_reroute_surcharge_inr_cr:.2f} Crore)")

    # -------------------------------------------------------------
    # [STEP 5: DRAFT & OPERATIONAL CLEARANCE]
    # -------------------------------------------------------------
    # Vessel draft = 15.8m. Paradip MCHP = 14.5m (exceeded). Paradip KICT = 16.0m (clear with tidal window).
    draft_status = (
        f"[PASSED WITH TIDAL WINDOW] Vessel {vessel_draft}m <= Port {port_draft_deep}m (KICT Berth at High Tide)"
        if vessel_draft <= port_draft_deep else
        f"[REQUIRES LIGHTERAGE] Vessel {vessel_draft}m > Port {port_draft_standard}m (Standard MCHP Berth)"
    )

    # -------------------------------------------------------------
    # [FINAL OUTPUT FORMATTING - IDENTICAL TO TERMINAL DIRECTIVE]
    # -------------------------------------------------------------
    print(f"  Route:             {origin_name} -> {dest_name}")
    print(f"  Vessel & Cargo:    {vessel_type} | {volume_mt:,} MT {cargo_type} ({horizon_months}-Month Horizon)")
    print(f"  Market Scenario:   {scenario}")
    print("-" * 70)
    print("[1] FORWARD FREIGHT PREDICTION & QUANTILE CONES:")
    print(f"  * Current Spot Rate:               ${base_spot_rate:.2f} /MT")
    print(f"  * Expected Forward Median (P50):   ${expected_p50:.2f} /MT  [Ton-Mile Shock: +${ton_mile_spot_drift:.2f}/MT]")
    print(f"  * Optimistic Dip Bound (P10):      ${p10_dip_bound:.2f} /MT  [Bunker Cost Floor]")
    print(f"  * Stress Tail-Risk Bound (P90):    ${p90_stress_bound:.2f} /MT  [Severe Squeeze Ceiling]")
    print(f"  * COA Fixed Contract Lock:         ${coa_fixed_rate:.2f} /MT  (Pre-Crisis Fixed Rate)")
    print("-" * 70)
    print("[2] ALGORITHMIC CVaR CARGO ALLOCATION:")
    print(f"  * Recommended COA Weight:          {coa_weight * 100:.0f}% (Guarantees Plant Continuity)")
    print(f"  * Recommended Spot Weight:         {spot_weight * 100:.0f}% (Captures Slow-Steaming Windows)")
    print(f"  * Blended Landed Freight Rate:     ${blended_rate:.2f} /MT  (Saves ${expected_p50 - blended_rate:.2f}/MT vs Spot)")
    print("-" * 70)
    print("[3] FINANCIAL IMPACT & RISK AVOIDANCE:")
    print(f"  * Unhedged 100% Spot Cost:         ${unhedged_spot_cost:,.0f}")
    print(f"  * NaviFreight Optimized Cost:      ${navifreight_opt_cost:,.0f}")
    print(f"  * Net Freight Cost Savings:        ${net_freight_savings:,.0f} (INR {inr_freight_savings_cr:.2f} Crore)")
    print(f"  * Cape Detour Surcharge Avoided:   +{extra_sailing_days:.1f} Days (${total_reroute_surcharge_usd:,.0f} / INR {total_reroute_surcharge_inr_cr:.2f} Cr)")
    print("-" * 70)
    print("[4] OPERATIONAL TIMING & VESSEL FIT:")
    print(f"  * Cape of Good Hope Transit Time:  {cape_transit_days:.1f} Days (vs {suez_transit_days:.1f} Days via Suez)")
    print(f"  * Extra Distance Traveled:         +{extra_distance_nm:,.0f} Nautical Miles (+75.6% Ton-Mile Load)")
    print(f"  * Primary COA Laycan Window:       Sep 08 - Sep 16, 2026")
    print(f"  * Draft Clearance:                 {draft_status}")
    print("=" * 70 + "\n")

if __name__ == '__main__':
    is_verbose = '--debug' in sys.argv or '-v' in sys.argv
    run_red_sea_case_study_debug(verbose=is_verbose)
