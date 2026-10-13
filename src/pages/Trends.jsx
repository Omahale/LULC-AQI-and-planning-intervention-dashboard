import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Activity,
  Calendar,
  Layers,
  MapPin,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

import { aqiService } from "../services/aqiService";
import fallbackYearly from "../data/nashik_aqi_yearly.json";
import fallbackMonthly from "../data/nashik_aqi_monthly.json";

function Trends() {
  const [activeTab, setActiveTab] = useState("aqi_trend"); // 'aqi_trend' | 'stations' | 'pollutants' | 'lulc'
  const [historicalData, setHistoricalData] = useState(fallbackYearly);
  const [monthlyData, setMonthlyData] = useState(fallbackMonthly?.overall || []);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const res = await aqiService.getHistorical();
        if (!cancelled && res) {
          if (res.yearly && res.yearly.length > 0) {
            setHistoricalData({
              overall: res.yearly,
              station_comparison: res.station_comparison || fallbackYearly.station_comparison,
              summary: res.summary || fallbackYearly.summary,
            });
          }
          if (res.monthly && res.monthly.length > 0) {
            setMonthlyData(res.monthly);
          }
        }
      } catch (err) {
        console.warn("Using bundled historical datasets fallback:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const yearlyOverall = historicalData?.overall || fallbackYearly.overall || [];
  const stationComp = historicalData?.station_comparison || fallbackYearly.station_comparison || [];
  const summary = historicalData?.summary || fallbackYearly.summary || {};

  // LULC comparison trajectory
  const lulcTrend = [
    { year: "2018", builtUp: 95, forest: 450, agriculture: 550, aqi: 81 },
    { year: "2020", builtUp: 120, forest: 442, agriculture: 535, aqi: 65 },
    { year: "2022", builtUp: 145, forest: 432, agriculture: 525, aqi: 77 },
    { year: "2024", builtUp: 172, forest: 424, agriculture: 515, aqi: 85 },
    { year: "2026", builtUp: 185, forest: 418, agriculture: 508, aqi: 66 },
  ];

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">DECENNIAL ENVIRONMENTAL RESEARCH (2016–2026)</p>
          <h1>Environmental & AQI Trends</h1>
          <p>
            Long-term empirical analysis of air quality and land cover dynamics in Nashik Municipal Corporation across 24,921 monitoring records.
          </p>
        </div>
      </div>

      {/* Summary KPI row */}
      <div className="metric-row">
        <div className="metric-box">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>10-Year Mean AQI</span>
            <Activity size={18} color="#f97316" />
          </div>
          <strong>{summary.ten_year_avg_aqi || 83.3}</strong>
          <small style={{ color: "#38bdf8", marginTop: "0.2rem" }}>NAQI: Satisfactory / Moderate</small>
        </div>

        <div className="metric-box">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Cleanest Year (Pandemic Dip)</span>
            <TrendingDown size={18} color="#22c55e" />
          </div>
          <strong>AQI 65.0 (2020)</strong>
          <small style={{ color: "#22c55e", marginTop: "0.2rem" }}>Lockdown traffic & industrial pause</small>
        </div>

        <div className="metric-box">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Peak Smog Year</span>
            <AlertTriangle size={18} color="#ef4444" />
          </div>
          <strong>AQI 116.7 (2017)</strong>
          <small style={{ color: "#ef4444", marginTop: "0.2rem" }}>Winter inversion & particulate spike</small>
        </div>

        <div className="metric-box">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Highest Burden Station</span>
            <MapPin size={18} color="#eab308" />
          </div>
          <strong>MIDC Ambad</strong>
          <small style={{ color: "#eab308", marginTop: "0.2rem" }}>Avg AQI ~107 (Industrial Zone)</small>
        </div>
      </div>

      {/* Main Analysis Panel */}
      <div className="panel" style={{ marginTop: "1.5rem" }}>
        <div className="panel-header" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
          <div>
            <h2>Historical Trend Visualizations</h2>
            <p>Empirical continuous time series from 4 official MPCB monitoring stations</p>
          </div>

          <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: "8px", padding: "4px", gap: "2px" }}>
            <button
              type="button"
              onClick={() => setActiveTab("aqi_trend")}
              style={{
                padding: "0.4rem 0.85rem",
                fontSize: "0.78rem",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                background: activeTab === "aqi_trend" ? "#f97316" : "transparent",
                color: activeTab === "aqi_trend" ? "#ffffff" : "#94a3b8",
                fontWeight: 600,
                transition: "all 0.15s ease",
              }}
            >
              Decadal AQI (2016–2026)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("stations")}
              style={{
                padding: "0.4rem 0.85rem",
                fontSize: "0.78rem",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                background: activeTab === "stations" ? "#f97316" : "transparent",
                color: activeTab === "stations" ? "#ffffff" : "#94a3b8",
                fontWeight: 600,
                transition: "all 0.15s ease",
              }}
            >
              Station Comparison
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("pollutants")}
              style={{
                padding: "0.4rem 0.85rem",
                fontSize: "0.78rem",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                background: activeTab === "pollutants" ? "#f97316" : "transparent",
                color: activeTab === "pollutants" ? "#ffffff" : "#94a3b8",
                fontWeight: 600,
                transition: "all 0.15s ease",
              }}
            >
              Pollutant Trajectory
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("lulc")}
              style={{
                padding: "0.4rem 0.85rem",
                fontSize: "0.78rem",
                borderRadius: "6px",
                border: "none",
                cursor: "pointer",
                background: activeTab === "lulc" ? "#f97316" : "transparent",
                color: activeTab === "lulc" ? "#ffffff" : "#94a3b8",
                fontWeight: 600,
                transition: "all 0.15s ease",
              }}
            >
              LULC vs AQI
            </button>
          </div>
        </div>

        <div className="trend-chart" style={{ height: "380px", marginTop: "1rem" }}>
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === "aqi_trend" && (
              <LineChart data={yearlyOverall} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="year" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[40, 140]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
                  formatter={(value) => [`${value} AQI`, "Nashik City Average"]}
                  labelFormatter={(label) => `Year: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="aqi"
                  name="Nashik NMC AQI"
                  stroke="#f97316"
                  strokeWidth={3.5}
                  dot={{ r: 5, fill: "#f97316" }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            )}

            {activeTab === "stations" && (
              <LineChart data={stationComp} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="year" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[50, 130]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
                  formatter={(val, name) => [val ? `${val} AQI` : "N/A", name]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Gangapur Road"
                  name="Gangapur Road (Residential)"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  connectNulls
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="MIDC Ambad"
                  name="MIDC Ambad (Industrial)"
                  stroke="#ef4444"
                  strokeWidth={3}
                  connectNulls
                  dot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="Pandav Nagari"
                  name="Pandav Nagari (Highway / Comm)"
                  stroke="#eab308"
                  strokeWidth={2.5}
                  connectNulls
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="Hirawadi"
                  name="Hirawadi (Panchavati)"
                  stroke="#a855f7"
                  strokeWidth={2.5}
                  connectNulls
                  dot={{ r: 4 }}
                />
              </LineChart>
            )}

            {activeTab === "pollutants" && (
              <LineChart data={yearlyOverall} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="year" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" label={{ value: "µg/m³", angle: -90, position: "insideLeft", fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
                  formatter={(val, name) => [`${val} µg/m³`, name]}
                />
                <Legend />
                <Line type="monotone" dataKey="pm10" name="PM10" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="pm25" name="PM2.5" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="no2" name="NO₂" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="so2" name="SO₂" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            )}

            {activeTab === "lulc" && (
              <LineChart data={lulcTrend} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="year" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" label={{ value: "Area (km²)", angle: -90, position: "insideLeft", fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
                  formatter={(val, name) => [name === "AQI Index" ? `${val} AQI` : `${val} km²`, name]}
                />
                <Legend />
                <Line type="monotone" dataKey="builtUp" name="Built-Up Area (km²)" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="forest" name="Vegetation / Green Cover" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="agriculture" name="Agricultural Land" stroke="#eab308" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Historical Data Table */}
      <div className="panel" style={{ marginTop: "1.5rem" }}>
        <div className="panel-header">
          <div>
            <h2>Nashik City Decadal Summary Table (2016–2026)</h2>
            <p>Annual mean concentrations derived from official MPCB continuous monitoring</p>
          </div>
        </div>

        <div style={{ overflowX: "auto", marginTop: "0.5rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #334155", color: "#94a3b8" }}>
                <th style={{ padding: "0.6rem 0.8rem" }}>Year</th>
                <th style={{ padding: "0.6rem 0.8rem" }}>Mean AQI</th>
                <th style={{ padding: "0.6rem 0.8rem" }}>NAQI Status</th>
                <th style={{ padding: "0.6rem 0.8rem" }}>PM2.5 (µg/m³)</th>
                <th style={{ padding: "0.6rem 0.8rem" }}>PM10 (µg/m³)</th>
                <th style={{ padding: "0.6rem 0.8rem" }}>NO₂ (µg/m³)</th>
                <th style={{ padding: "0.6rem 0.8rem" }}>SO₂ (µg/m³)</th>
                <th style={{ padding: "0.6rem 0.8rem" }}>Active Stations</th>
                <th style={{ padding: "0.6rem 0.8rem" }}>Observations</th>
              </tr>
            </thead>
            <tbody>
              {yearlyOverall.map((row) => (
                <tr key={row.year} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "0.6rem 0.8rem", fontWeight: 600, color: "#f8fafc" }}>{row.year}</td>
                  <td style={{ padding: "0.6rem 0.8rem", color: "#f97316", fontWeight: 700 }}>{row.aqi}</td>
                  <td style={{ padding: "0.6rem 0.8rem" }}>
                    <span
                      style={{
                        padding: "0.2rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        background:
                          row.status === "Satisfactory"
                            ? "rgba(34, 197, 94, 0.15)"
                            : row.status === "Moderate"
                            ? "rgba(234, 179, 8, 0.15)"
                            : "rgba(239, 68, 68, 0.15)",
                        color:
                          row.status === "Satisfactory"
                            ? "#22c55e"
                            : row.status === "Moderate"
                            ? "#eab308"
                            : "#ef4444",
                      }}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td style={{ padding: "0.6rem 0.8rem" }}>{row.pm25}</td>
                  <td style={{ padding: "0.6rem 0.8rem" }}>{row.pm10}</td>
                  <td style={{ padding: "0.6rem 0.8rem" }}>{row.no2}</td>
                  <td style={{ padding: "0.6rem 0.8rem" }}>{row.so2}</td>
                  <td style={{ padding: "0.6rem 0.8rem", color: "#38bdf8" }}>{row.stations_reporting || 1} stations</td>
                  <td style={{ padding: "0.6rem 0.8rem", color: "#94a3b8" }}>{row.samples?.toLocaleString() || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Research Methodology Callout */}
      <div className="insight-grid" style={{ marginTop: "1.5rem" }}>
        <div className="insight-card">
          <span>Decadal Built-up Growth</span>
          <strong style={{ color: "#f97316" }}>+89%</strong>
          <p>Rapid urban sprawl detected between 2018 and 2026 across Nashik's southern and western fringes.</p>
        </div>

        <div className="insight-card">
          <span>Vegetation Loss</span>
          <strong style={{ color: "#ef4444" }}>-7.1%</strong>
          <p>Tree canopy and riparian green buffering reduced along developing highway growth corridors.</p>
        </div>

        <div className="insight-card">
          <span>Particulate Dominance</span>
          <strong style={{ color: "#eab308" }}>PM10 &gt; PM2.5</strong>
          <p>Road dust resuspension and construction activity are primary drivers of air quality stress in Nashik.</p>
        </div>
      </div>
    </div>
  );
}

export default Trends;