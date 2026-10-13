# NMC LULC/AQI Dashboard — Backend

Flask API that serves your Google Earth Engine LULC classification (and
placeholder AQI/prediction data) to the React frontend.

## Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

## Connect your real GEE data

1. In GEE, export your classified LULC image as an **Asset** (not just Drive):
   ```javascript
   Export.image.toAsset({
     image: lulc.toByte(),
     description: 'NMC_LULC_Asset',
     assetId: 'projects/YOUR_PROJECT_ID/assets/NMC_LULC_2024_v2',
     region: aoi, scale: 10, maxPixels: 1e13
   });
   ```
   Also export your `nmc` boundary FeatureCollection as an asset the same way.

2. Create a GCP Service Account with Earth Engine access, download its JSON key,
   place it in `backend/gee-key.json` (or any path).

3. Fill in `.env`:
   - `MONGO_URI=mongodb://localhost:27017/lulc_aqi` for local MongoDB
   - or `MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/lulc_aqi?retryWrites=true&w=majority` for MongoDB Atlas
   - `MONGO_DB_NAME=lulc_aqi` (optional if you want to override the DB name from the URI)
   - `JWT_SECRET_KEY=your-secret`
   - `GEE_SERVICE_ACCOUNT_EMAIL`
   - `GEE_KEY_PATH` (path to the JSON key)
   - `GEE_PROJECT_ID`
   - `GEE_LULC_ASSET_ID`
   - `GEE_NMC_BOUNDARY_ASSET_ID`

### MongoDB Atlas setup

1. Create a MongoDB Atlas cluster and database user.
2. Copy the connection string from Atlas and replace the password and cluster name.
3. Paste it into `.env` as `MONGO_URI`.
4. Ensure your IP address is whitelisted in Atlas Network Access.
5. Restart the Flask server.

Example:

```env
MONGO_URI=mongodb+srv://myuser:MyPassword123@cluster0.abcd12e.mongodb.net/lulc_aqi?retryWrites=true&w=majority
MONGO_DB_NAME=lulc_aqi
JWT_SECRET_KEY=my-super-secret-key
```

If these aren't set, the API automatically serves the sample data in
`backend/data/` instead of crashing — useful for frontend development
before your GEE asset is ready.

## Run

```bash
python app.py
```

Runs on `http://localhost:5000` by default.

## Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/health` | Health check |
| `GET /api/lulc/tile-url` | Live GEE tile URL for the map layer |
| `GET /api/lulc/area-stats` | Class-wise area (km²) and % |
| `GET /api/lulc/accuracy` | Overall Accuracy, Kappa, Producer's/User's Accuracy |
| `GET /api/aqi/current` | Current AQI reading (placeholder until a real AQI API is connected) |
| `GET /api/aqi/trend` | AQI trend over time (placeholder) |
| `GET /api/aqi/hotspots` | Pollution hotspot locations (placeholder) |
| `GET /api/prediction` | AQI forecast (placeholder until a model is trained) |

## Replacing placeholders with real data later

- **AQI**: edit `services/aqi_service.py` — set `AQI_API_URL`,
  `AQI_TREND_URL`, and `AQI_HOTSPOTS_URL` to a live provider (CPCB, OpenAQ,
  or a custom endpoint). The route and response shape stay the same, so the
  frontend needs no changes.
- **Prediction**: edit `services/prediction_service.py` once you train a
  real forecasting model.
- **Accuracy**: `services/ee_service.py` currently reads accuracy from the
  exported JSON since it's computed once during training. Replace
  `backend/data/nmc_lulc_accuracy.json` with your real exported confusion
  matrix numbers.
