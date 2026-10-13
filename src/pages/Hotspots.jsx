import { useEffect, useState } from "react";
import {
  Flame,
  MapPin,
  AlertTriangle,
} from "lucide-react";

import { aqiService } from "../services/aqiService";

function Hotspots() {
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadHotspots = async () => {
      try {
        const res = await aqiService.getHotspots();
        if (!cancelled) {
          const nextHotspots = [...(res?.data || [])].sort(
            (a, b) => (b.priority_score || b.aqi || 0) - (a.priority_score || a.aqi || 0)
          );
          setHotspots(nextHotspots);
        }
      } catch (err) {
        console.error("Hotspots data load failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadHotspots();
    return () => {
      cancelled = true;
    };
  }, []);

  const getRiskClass = (risk) => {
    const normalized = String(risk || "Moderate").toLowerCase();
    if (normalized.includes("critical")) return "risk critical-risk";
    if (normalized.includes("very high") || normalized.includes("high")) return "risk high-risk";
    return "risk moderate-risk";
  };

  return (
    <div className="page">

      <div className="page-heading">
        <div>
          <p className="eyebrow">
            POLLUTION MONITORING
          </p>

          <h1>Intervention Ranking</h1>

          <p>
            Exposure-weighted hotspot ranking based on pollution load and population vulnerability.
          </p>
        </div>
      </div>

      <div className="hotspot-grid">

        {loading ? (
          <div className="analysis-message">
            <AlertTriangle size={22} />
            <p>Calculating hotspot priority scores...</p>
          </div>
        ) : hotspots.length === 0 ? (
          <div className="analysis-message">
            <AlertTriangle size={22} />
            <p>No hotspot data is available yet. Please check the live AQI feed.</p>
          </div>
        ) : hotspots.map((spot) => {
          const score = spot.priority_score ?? spot.aqi ?? 0;
          const riskLevel = spot.priority_level || spot.risk || "Moderate";

          return (
            <div
              className="hotspot-card"
              key={`${spot.location}-${spot.rank}`}
            >

              <div className="hotspot-rank">
                #{spot.rank}
              </div>

              <div className="hotspot-icon">
                <Flame size={23} />
              </div>

              <div className="hotspot-content">

                <h3>{spot.location}</h3>

                <span>
                  <MapPin size={11} />
                  Dominant pollutant: {spot.pollutant}
                </span>

                <div className="hotspot-bottom">
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    <span style={{ fontSize: "0.68rem", color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      Priority score
                    </span>
                    <strong>
                      {score}
                    </strong>
                  </div>

                  <label className={getRiskClass(riskLevel)}>
                    {riskLevel}
                  </label>
                </div>

                <div style={{ marginTop: "0.6rem", color: "#cbd5e1", fontSize: "0.72rem" }}>
                  AQI {spot.aqi} • vulnerability {spot.vulnerability_factor || "1.0"}
                </div>

              </div>

            </div>
          );
        })}

      </div>

      <div className="panel">

        <div className="panel-header">

          <div>
            <h2>Pollution Hotspot Analysis</h2>
          </div>

        </div>

        <div className="analysis-message">

          <AlertTriangle size={22} />

          <p>
            Pollution hotspots are prioritized by exposure-weighted risk, combining pollutant concentration,
            population density, sensitive receptors, and land-use vulnerability to decide where intervention
            should happen first.
          </p>

        </div>

      </div>

    </div>
  );
}

export default Hotspots;