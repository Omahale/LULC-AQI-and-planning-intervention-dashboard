"""
Earth Engine service layer for the NMC LULC dashboard backend.

Tries to authenticate with a real GEE service account and read your
classified LULC asset. If credentials are missing/invalid (e.g. during
local development before you've set up gee-key.json), it automatically
falls back to the sample CSV/JSON files in backend/data/ so the API
never breaks the frontend.
"""

import os
import json
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
AREA_STATS_CSV = os.path.join(DATA_DIR, "nmc_lulc_area_stats.csv")
ACCURACY_JSON = os.path.join(DATA_DIR, "nmc_lulc_accuracy.json")

_ee_initialized = False
_ee_init_error = None


def _try_init_ee():
    """Attempt to initialize Earth Engine with a service account.
    Returns True on success, False on failure (and caches the reason)."""
    global _ee_initialized, _ee_init_error

    if _ee_initialized:
        return True

    try:
        import ee  # imported lazily so the backend still runs if the
                   # earthengine-api package or credentials aren't set up yet

        key_path = os.getenv("GEE_KEY_PATH")
        service_account = os.getenv("GEE_SERVICE_ACCOUNT_EMAIL")

        if not key_path or not service_account or not os.path.exists(key_path):
            _ee_init_error = (
                "GEE credentials not configured or key file not found. "
                "Set GEE_SERVICE_ACCOUNT_EMAIL and GEE_KEY_PATH in .env "
                "to enable live Earth Engine data."
            )
            return False

        credentials = ee.ServiceAccountCredentials(service_account, key_path)
        ee.Initialize(credentials, project=os.getenv("GEE_PROJECT_ID"))
        _ee_initialized = True
        return True

    except Exception as exc:  # noqa: BLE001 - we want to catch anything and fall back
        _ee_init_error = str(exc)
        return False


def get_lulc_tile_url():
    """Returns a live GEE tile URL for the classified LULC asset,
    or a fallback flag if GEE isn't configured yet."""
    asset_id = os.getenv("GEE_LULC_ASSET_ID")

    if not asset_id or not _try_init_ee():
        return {
            "available": False,
            "tile_url": None,
            "reason": _ee_init_error or "GEE_LULC_ASSET_ID not set in .env",
        }

    try:
        import ee

        lulc = ee.Image(asset_id)
        vis_params = {
            "min": 0,
            "max": 4,
            "palette": ["0000FF", "006400", "FFFF00", "FF7777", "800080"],
        }
        map_id_dict = lulc.getMapId(vis_params)
        return {
            "available": True,
            "tile_url": map_id_dict["tile_fetcher"].url_format,
            "reason": None,
        }
    except Exception as exc:  # noqa: BLE001
        return {"available": False, "tile_url": None, "reason": str(exc)}


def get_area_stats():
    """Returns class-wise area (km2) and percentage.
    Tries live GEE first, falls back to the sample CSV."""
    asset_id = os.getenv("GEE_LULC_ASSET_ID")
    boundary_id = os.getenv("GEE_NMC_BOUNDARY_ASSET_ID")

    if asset_id and boundary_id and _try_init_ee():
        try:
            import ee

            lulc = ee.Image(asset_id)
            aoi = ee.FeatureCollection(boundary_id).geometry()

            pixel_area = ee.Image.pixelArea().divide(1e6)
            area_image = pixel_area.addBands(lulc)

            stats = area_image.reduceRegion(
                reducer=ee.Reducer.sum().group(groupField=1, groupName="class"),
                geometry=aoi,
                scale=10,
                maxPixels=1e13,
                tileScale=16,
            ).getInfo()

            class_names = ["Water", "Vegetation", "Cropland", "Built-up", "Barren/Open"]
            total_km2 = aoi.area(1).divide(1e6).getInfo()

            rows = []
            for g in stats.get("groups", []):
                class_id = int(g["class"])
                area_km2 = round(g["sum"], 2)
                rows.append(
                    {
                        "class_id": class_id,
                        "class_name": class_names[class_id],
                        "area_km2": area_km2,
                        "percent": round((area_km2 / total_km2) * 100, 1),
                    }
                )
            return {"source": "live_gee", "data": rows}

        except Exception:
            pass  # fall through to sample data below

    df = pd.read_csv(AREA_STATS_CSV)
    return {"source": "sample_fallback", "data": df.to_dict(orient="records")}


def get_accuracy_stats():
    """Returns Overall Accuracy, Kappa, Producer's/User's Accuracy.
    Currently served from the exported JSON (accuracy is computed once during
    training in your GEE script, not recalculated live on every API call)."""
    with open(ACCURACY_JSON, "r") as f:
        data = json.load(f)
    return {"source": "exported_file", "data": data}
