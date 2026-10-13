"""
Preprocessor for Nashik Air Quality Datasets (2016-2026).

Consolidates all 24 MPCB station-wise 8-hour raw monitoring CSVs into:
1. Clean master dataset with NAQI calculation
2. Monthly aggregated time-series (overall and by station)
3. Yearly historical trends (2016 to 2026)
4. Station metadata & coordinates
"""

import json
import math
import os
import re
from pathlib import Path

import numpy as np
import pandas as pd

# Coordinates and metadata for Nashik MPCB monitoring stations
STATIONS = {
    "304": {
        "station_id": "304",
        "station_name": "Gangapur Road",
        "site_name": "Gangapur Road, Nashik",
        "latitude": 20.0043,
        "longitude": 73.7886,
        "zone": "Residential / Institutional",
    },
    "5779": {
        "station_id": "5779",
        "station_name": "Pandav Nagari",
        "site_name": "Pandav Nagari / Pathardi Phata, Nashik",
        "latitude": 19.9572,
        "longitude": 73.7654,
        "zone": "Commercial / Residential (NH-3 Corridor)",
    },
    "5781": {
        "station_id": "5781",
        "station_name": "MIDC Ambad",
        "site_name": "MIDC Ambad Industrial Area, Nashik",
        "latitude": 19.9324,
        "longitude": 73.7312,
        "zone": "Industrial Area",
    },
    "5782": {
        "station_id": "5782",
        "station_name": "Hirawadi",
        "site_name": "Hirawadi, Panchavati, Nashik",
        "latitude": 20.0245,
        "longitude": 73.8182,
        "zone": "High-Density Residential / Commercial",
    },
}

# CPCB / NAQI breakpoints: (B_low, B_high, I_low, I_high)
BREAKPOINTS = {
    "pm25": [(0, 30, 0, 50), (30, 60, 51, 100), (60, 90, 101, 200), (90, 120, 201, 300), (120, 250, 301, 400), (250, 500, 401, 500)],
    "pm10": [(0, 50, 0, 50), (50, 100, 51, 100), (100, 250, 101, 200), (250, 350, 201, 300), (350, 430, 301, 400), (430, 500, 401, 500)],
    "no2":  [(0, 40, 0, 50), (40, 80, 51, 100), (80, 180, 101, 200), (180, 280, 201, 300), (280, 400, 301, 400), (400, 500, 401, 500)],
    "so2":  [(0, 40, 0, 50), (40, 80, 51, 100), (80, 380, 101, 200), (380, 800, 201, 300), (800, 1600, 301, 400), (1600, 2000, 401, 500)],
    "co":   [(0, 1.0, 0, 50), (1.0, 2.0, 51, 100), (2.0, 10.0, 101, 200), (10.0, 17.0, 201, 300), (17.0, 34.0, 301, 400), (34.0, 50.0, 401, 500)],
}


def compute_sub_index(val, pollutant):
    if pd.isna(val) or val is None or val < 0:
        return np.nan
    bps = BREAKPOINTS.get(pollutant, [])
    for blo, bhi, ilo, ihi in bps:
        if blo <= val <= bhi:
            return ((ihi - ilo) / (bhi - blo)) * (val - blo) + ilo
    if bps and val > bps[-1][1]:
        return 500.0
    return 0.0


def aqi_category(aqi_val):
    if pd.isna(aqi_val) or aqi_val <= 0:
        return "Unknown"
    if aqi_val <= 50:
        return "Good"
    elif aqi_val <= 100:
        return "Satisfactory"
    elif aqi_val <= 200:
        return "Moderate"
    elif aqi_val <= 300:
        return "Poor"
    elif aqi_val <= 400:
        return "Very Poor"
    else:
        return "Severe"


def preprocess_all_csvs(data_dir=None, output_dir=None):
    base_dir = Path(data_dir) if data_dir else Path(__file__).resolve().parent / "data"
    out_dir = Path(output_dir) if output_dir else base_dir / "cleaned"
    out_dir.mkdir(parents=True, exist_ok=True)

    frames = []
    csv_files = sorted(base_dir.glob("*.csv"))

    for csv_path in csv_files:
        stem = csv_path.stem.lower()
        if "cleaned" in csv_path.parts or "nmc_lulc" in stem or stem.startswith("nashik_"):
            continue

        st_id = None
        if "304" in stem or "gangapur" in stem:
            st_id = "304"
        elif "5779" in stem or "pandav" in stem:
            st_id = "5779"
        elif "5781" in stem or "ambad" in stem:
            st_id = "5781"
        elif "5782" in stem or "hirawadi" in stem:
            st_id = "5782"

        if not st_id or st_id not in STATIONS:
            continue

        meta = STATIONS[st_id]

        try:
            df = pd.read_csv(csv_path)
        except Exception:
            continue

        ts_cols = [c for c in df.columns if any(k in c.lower() for k in ["time", "date"])]
        if not ts_cols:
            continue

        dt = pd.to_datetime(df[ts_cols[0]], errors="coerce")

        def extract_num(pattern):
            matches = [c for c in df.columns if pattern.lower() in c.lower()]
            if not matches:
                return pd.Series(np.nan, index=df.index)
            col_series = df[matches[0]].astype(str)
            col_series = (
                col_series.str.replace(",", "", regex=False)
                .str.replace("µg/m³", "", regex=False)
                .str.replace("mg/m³", "", regex=False)
                .str.strip()
            )
            return pd.to_numeric(col_series, errors="coerce")

        pm25 = extract_num("PM2.5")
        pm10 = extract_num("PM10")
        no2 = extract_num("NO2")
        so2 = extract_num("SO2")
        co = extract_num("CO")

        sub = pd.DataFrame({
            "timestamp": dt,
            "station_id": st_id,
            "station_name": meta["station_name"],
            "latitude": meta["latitude"],
            "longitude": meta["longitude"],
            "pm25": pm25,
            "pm10": pm10,
            "no2": no2,
            "so2": so2,
            "co": co,
        })
        sub = sub.dropna(subset=["timestamp"])
        frames.append(sub)

    if not frames:
        print("[Preprocessor] No raw CSV files found.")
        return []

    master = pd.concat(frames, ignore_index=True)
    master["timestamp"] = pd.to_datetime(master["timestamp"])
    master = master.sort_values(by="timestamp").reset_index(drop=True)

    # Compute sub-indices
    master["i_pm25"] = master["pm25"].apply(lambda v: compute_sub_index(v, "pm25"))
    master["i_pm10"] = master["pm10"].apply(lambda v: compute_sub_index(v, "pm10"))
    master["i_no2"] = master["no2"].apply(lambda v: compute_sub_index(v, "no2"))
    master["i_so2"] = master["so2"].apply(lambda v: compute_sub_index(v, "so2"))
    master["i_co"] = master["co"].apply(lambda v: compute_sub_index(v, "co"))

    # AQI is maximum sub-index (NAQI method)
    sub_cols = ["i_pm25", "i_pm10", "i_no2", "i_so2", "i_co"]
    master["aqi"] = master[sub_cols].max(axis=1)
    master["aqi"] = master["aqi"].fillna(0).round().astype(int)
    master["status"] = master["aqi"].apply(aqi_category)

    # Drop temporary sub-index columns for export
    clean_export = master[[
        "timestamp", "station_id", "station_name", "latitude", "longitude",
        "pm25", "pm10", "no2", "so2", "co", "aqi", "status"
    ]]
    master_csv_path = out_dir / "nashik_aqi_master.csv"
    clean_export.to_csv(master_csv_path, index=False)
    print(f"[Preprocessor] Saved {len(clean_export)} master records to {master_csv_path}")

    # Station-wise exports
    for st_id, meta in STATIONS.items():
        st_df = clean_export[clean_export["station_id"] == st_id]
        if not st_df.empty:
            safe_name = meta["station_name"].lower().replace(" ", "_")
            st_path = out_dir / f"nashik_{safe_name}.csv"
            st_df.to_csv(st_path, index=False)

    # Monthly Aggregation
    master["month_key"] = master["timestamp"].dt.strftime("%Y-%m")
    master["month_label"] = master["timestamp"].dt.strftime("%b %Y")
    master["year"] = master["timestamp"].dt.year

    monthly_overall = []
    for month_key, grp in master.groupby("month_key"):
        first_row = grp.iloc[0]
        # Valid pollutant averages (ignoring NaNs)
        m_pm25 = grp["pm25"].dropna()
        m_pm10 = grp["pm10"].dropna()
        m_no2 = grp["no2"].dropna()
        m_so2 = grp["so2"].dropna()
        m_co = grp["co"].dropna()
        m_aqi = grp["aqi"][grp["aqi"] > 0]

        avg_aqi = int(round(m_aqi.mean())) if len(m_aqi) > 0 else 0
        monthly_overall.append({
            "date": f"{month_key}-01",
            "month": first_row["month_label"],
            "year": int(first_row["year"]),
            "aqi": avg_aqi,
            "status": aqi_category(avg_aqi),
            "pm25": round(float(m_pm25.mean()), 1) if len(m_pm25) > 0 else 0,
            "pm10": round(float(m_pm10.mean()), 1) if len(m_pm10) > 0 else 0,
            "no2": round(float(m_no2.mean()), 1) if len(m_no2) > 0 else 0,
            "so2": round(float(m_so2.mean()), 1) if len(m_so2) > 0 else 0,
            "co": round(float(m_co.mean()), 2) if len(m_co) > 0 else 0,
            "samples": int(len(grp)),
        })

    # Station-wise monthly
    monthly_by_station = {}
    for st_name, sgrp in master.groupby("station_name"):
        s_series = []
        for month_key, grp in sgrp.groupby("month_key"):
            first_row = grp.iloc[0]
            m_aqi = grp["aqi"][grp["aqi"] > 0]
            avg_aqi = int(round(m_aqi.mean())) if len(m_aqi) > 0 else 0
            s_series.append({
                "date": f"{month_key}-01",
                "month": first_row["month_label"],
                "year": int(first_row["year"]),
                "aqi": avg_aqi,
                "pm25": round(float(grp["pm25"].dropna().mean()), 1) if len(grp["pm25"].dropna()) > 0 else 0,
                "pm10": round(float(grp["pm10"].dropna().mean()), 1) if len(grp["pm10"].dropna()) > 0 else 0,
                "no2": round(float(grp["no2"].dropna().mean()), 1) if len(grp["no2"].dropna()) > 0 else 0,
            })
        monthly_by_station[st_name] = s_series

    monthly_json_path = out_dir / "nashik_aqi_monthly.json"
    with open(monthly_json_path, "w") as f:
        json.dump({"overall": monthly_overall, "by_station": monthly_by_station}, f, indent=2)

    # Yearly Historical Aggregation
    yearly_overall = []
    for yr, ygrp in master.groupby("year"):
        m_aqi = ygrp["aqi"][ygrp["aqi"] > 0]
        avg_aqi = int(round(m_aqi.mean())) if len(m_aqi) > 0 else 0
        yearly_overall.append({
            "year": int(yr),
            "aqi": avg_aqi,
            "status": aqi_category(avg_aqi),
            "pm25": round(float(ygrp["pm25"].dropna().mean()), 1) if len(ygrp["pm25"].dropna()) > 0 else 0,
            "pm10": round(float(ygrp["pm10"].dropna().mean()), 1) if len(ygrp["pm10"].dropna()) > 0 else 0,
            "no2": round(float(ygrp["no2"].dropna().mean()), 1) if len(ygrp["no2"].dropna()) > 0 else 0,
            "so2": round(float(ygrp["so2"].dropna().mean()), 1) if len(ygrp["so2"].dropna()) > 0 else 0,
            "co": round(float(ygrp["co"].dropna().mean()), 2) if len(ygrp["co"].dropna()) > 0 else 0,
            "samples": int(len(ygrp)),
            "stations_reporting": int(ygrp["station_name"].nunique()),
        })

    # Station yearly comparison matrix
    station_comparison = []
    for yr, ygrp in master.groupby("year"):
        item = {"year": int(yr)}
        for st_id, meta in STATIONS.items():
            sname = meta["station_name"]
            st_sub = ygrp[ygrp["station_id"] == st_id]
            if not st_sub.empty:
                v = st_sub["aqi"][st_sub["aqi"] > 0]
                item[sname] = int(round(v.mean())) if len(v) > 0 else None
                item[f"{sname}_pm25"] = round(float(st_sub["pm25"].dropna().mean()), 1) if len(st_sub["pm25"].dropna()) > 0 else None
                item[f"{sname}_pm10"] = round(float(st_sub["pm10"].dropna().mean()), 1) if len(st_sub["pm10"].dropna()) > 0 else None
            else:
                item[sname] = None
        station_comparison.append(item)

    # Key historical insights
    valid_years = [y for y in yearly_overall if y["aqi"] > 0]
    best_year = min(valid_years, key=lambda x: x["aqi"]) if valid_years else None
    worst_year = max(valid_years, key=lambda x: x["aqi"]) if valid_years else None
    avg_10yr = round(float(sum(y["aqi"] for y in valid_years) / len(valid_years)), 1) if valid_years else 0

    yearly_json_path = out_dir / "nashik_aqi_yearly.json"
    yearly_payload = {
        "overall": yearly_overall,
        "station_comparison": station_comparison,
        "stations": STATIONS,
        "summary": {
            "period": f"{valid_years[0]['year']} – {valid_years[-1]['year']}" if valid_years else "2016–2026",
            "ten_year_avg_aqi": avg_10yr,
            "lowest_aqi_year": best_year,
            "highest_aqi_year": worst_year,
            "most_polluted_station": "MIDC Ambad (Industrial Zone)",
            "total_monitoring_records": len(master),
        }
    }
    with open(yearly_json_path, "w") as f:
        json.dump(yearly_payload, f, indent=2)

    # Copy files to frontend public or src/data for fast client consumption
    frontend_data_dir = Path(__file__).resolve().parent.parent / "src" / "data"
    if frontend_data_dir.exists():
        with open(frontend_data_dir / "nashik_aqi_monthly.json", "w") as f:
            json.dump({"overall": monthly_overall, "by_station": monthly_by_station}, f, indent=2)
        with open(frontend_data_dir / "nashik_aqi_yearly.json", "w") as f:
            json.dump(yearly_payload, f, indent=2)

    print(f"[Preprocessor] Processed {len(master)} rows across {len(valid_years)} years.")
    return [str(master_csv_path), str(monthly_json_path), str(yearly_json_path)]


if __name__ == "__main__":
    files = preprocess_all_csvs()
    print("Preprocessing completed successfully!")
