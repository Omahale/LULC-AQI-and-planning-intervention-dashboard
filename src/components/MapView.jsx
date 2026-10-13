import { useEffect, useState } from "react";
import * as ReactLeaflet from "react-leaflet";

import "leaflet/dist/leaflet.css";
import { lulcService } from "../services/lulcService";
import { aqiService } from "../services/aqiService";
import { getAQIColor, LULC_CLASSES } from "../utils/mapUtils";
import nmcBoundaryGeoJson from "../data/nmc_boundary.json";

const { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON } = ReactLeaflet;

// Official MPCB continuous air quality monitoring stations in Nashik
const MPCB_STATIONS = [
  {
    id: "304",
    name: "Gangapur Road",
    lat: 20.0043,
    lon: 73.7886,
    zone: "Residential / Institutional",
    dominantPollutant: "PM2.5",
    aqi: 105,
    pm25: 48,
    pm10: 98,
  },
  {
    id: "5779",
    name: "Pandav Nagari",
    lat: 19.9572,
    lon: 73.7654,
    zone: "Commercial / Highway (NH-3)",
    dominantPollutant: "PM10",
    aqi: 122,
    pm25: 54,
    pm10: 112,
  },
  {
    id: "5781",
    name: "MIDC Ambad",
    lat: 19.9324,
    lon: 73.7312,
    zone: "Industrial Manufacturing Area",
    dominantPollutant: "PM10",
    aqi: 182,
    pm25: 84,
    pm10: 178,
  },
  {
    id: "5782",
    name: "Hirawadi",
    lat: 20.0245,
    lon: 73.8182,
    zone: "High-Density Residential (Panchavati)",
    dominantPollutant: "PM10",
    aqi: 128,
    pm25: 58,
    pm10: 118,
  },
];

function MapView({ showLulcLayer = true, showHotspots = true, autoRefreshMs = 300000 }) {
  const [hotspots, setHotspots] = useState([]);
  const [lulcTile, setLulcTile] = useState({ available: false, tile_url: null, reason: null });
  const [loading, setLoading] = useState(true);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadLulc() {
      try {
        const tileRes = await lulcService.getTileUrl();
        if (!cancelled) {
          setLulcTile(tileRes);
          setRefreshToken((prev) => prev + 1);
          if (tileRes?.available) {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("MapView LULC data load failed:", err);
        if (!cancelled) {
          setLulcTile({ available: false, tile_url: null, reason: "LULC tile fetch failed" });
          setLoading(false);
        }
      }
    }

    async function loadHotspots() {
      try {
        const hotspotsRes = await aqiService.getHotspots();
        if (!cancelled) {
          setHotspots(hotspotsRes?.data || []);
        }
      } catch (err) {
        console.error("MapView hotspot data load failed:", err);
        if (!cancelled) {
          setHotspots([]);
        }
      }
    }

    if (showLulcLayer) {
      loadLulc();
      loadHotspots();

      const intervalId = window.setInterval(() => {
        loadLulc();
        loadHotspots();
      }, autoRefreshMs);

      return () => {
        cancelled = true;
        window.clearInterval(intervalId);
      };
    }

    setLoading(false);
    return () => {
      cancelled = true;
    };
  }, [showLulcLayer, autoRefreshMs]);

  return (
    <div className="map-container">
      <MapContainer
        center={[20.0059, 73.7933]}
        zoom={12}
        scrollWheelZoom={true}
        className="leaflet-map"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* NMC Nashik Master Study Area Boundary */}
        {GeoJSON && nmcBoundaryGeoJson && (
          <GeoJSON
            data={nmcBoundaryGeoJson}
            style={{
              color: "#0284c7",
              weight: 2.5,
              opacity: 0.9,
              dashArray: "5 5",
              fillColor: "#38bdf8",
              fillOpacity: 0.05,
            }}
          />
        )}

        {/* Live Earth Engine LULC Layer */}
        {showLulcLayer && lulcTile.available && (
          <TileLayer
            key={`${lulcTile.tile_url || "lulc"}-${refreshToken}`}
            attribution="NMC LULC (Sentinel-2 + Random Forest)"
            url={lulcTile.tile_url}
            opacity={0.7}
          />
        )}

        {/* Official MPCB Continuous Monitoring Stations */}
        {MPCB_STATIONS.map((station) => {
          const color = getAQIColor(station.aqi);
          return (
            <CircleMarker
              key={`station-${station.id}`}
              center={[station.lat, station.lon]}
              radius={10}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor: color,
                fillOpacity: 0.9,
              }}
            >
              <Popup>
                <div style={{ fontSize: "0.85rem", lineHeight: "1.4" }}>
                  <strong style={{ color: "#0f172a", fontSize: "0.95rem" }}>{station.name} Station</strong>
                  <br />
                  <span style={{ color: "#64748b", fontSize: "0.75rem" }}>MPCB Site #{station.id} • {station.zone}</span>
                  <hr style={{ margin: "0.35rem 0", borderColor: "#e2e8f0" }} />
                  <div><strong>AQI:</strong> <span style={{ color, fontWeight: 700 }}>{station.aqi}</span> ({station.aqi > 150 ? "Unhealthy" : "Moderate"})</div>
                  <div><strong>Dominant Pollutant:</strong> {station.dominantPollutant}</div>
                  <div><strong>PM2.5:</strong> {station.pm25} µg/m³ • <strong>PM10:</strong> {station.pm10} µg/m³</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Exposure Risk Hotspots */}
        {showHotspots && hotspots.map((spot) => {
          const color = getAQIColor(spot.aqi);
          return (
            <CircleMarker
              key={`hotspot-${spot.location}-${spot.rank || 0}`}
              center={[spot.lat, spot.lon]}
              radius={14}
              pathOptions={{
                color: color,
                weight: 1.5,
                fillColor: color,
                fillOpacity: 0.45,
              }}
            >
              <Popup>
                <div style={{ fontSize: "0.85rem" }}>
                  <strong>{spot.location}</strong>
                  <br />
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Hotspot Priority #{spot.rank || "—"}</span>
                  <br />
                  AQI: <strong style={{ color }}>{spot.aqi}</strong>
                  <br />
                  Risk Level: <strong>{spot.risk || spot.priority_level || "Moderate"}</strong>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {showLulcLayer && !loading && !lulcTile.available && (
        <p className="map-note">
          NMC boundary (Shapefile) &amp; MPCB monitoring stations loaded.
          Live GEE raster offline ({lulcTile.reason || "GEE asset not configured"}).
        </p>
      )}

      {showLulcLayer && lulcTile.available && (
        <div className="map-legend">
          {LULC_CLASSES.map((c) => (
            <div key={c.id} className="map-legend-item">
              <span
                className="map-legend-swatch"
                style={{ background: c.color }}
              ></span>
              <span>{c.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MapView;
