import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { aqiService } from "../services/aqiService";
import fallbackMonthly from "../data/nashik_aqi_monthly.json";

function AQIAnalytics() {
  const [trendData, setTrendData] = useState([]);
  const [currentMetrics, setCurrentMetrics] = useState({
    avgAqi: 83,
    maxAqi: 182,
    pm25: 39,
    pm10: 79,
  });
  const [pollutants, setPollutants] = useState([
    { name: "PM10", value: 79.7, max: 200, unit: "µg/m³" },
    { name: "PM2.5", value: 39.4, max: 120, unit: "µg/m³" },
    { name: "NO₂", value: 14.9, max: 100, unit: "µg/m³" },
    { name: "SO₂", value: 7.3, max: 80, unit: "µg/m³" },
    { name: "CO", value: 0.6, max: 10, unit: "mg/m³" },
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const trendRes = await aqiService.getTrend({ period: "1y" });
        const list = Array.isArray(trendRes?.data) ? trendRes.data : fallbackMonthly?.overall?.slice(-12) || [];
        if (!cancelled && list.length > 0) {
          setTrendData(list);
          const validAqis = list.map((item) => item.aqi).filter((a) => a > 0);
          if (validAqis.length > 0) {
            const avg = Math.round(validAqis.reduce((a, b) => a + b, 0) / validAqis.length);
            const mx = Math.max(...validAqis);
            const latest = list[list.length - 1];
            setCurrentMetrics({
              avgAqi: avg,
              maxAqi: mx,
              pm25: Math.round(latest.pm25 || 39),
              pm10: Math.round(latest.pm10 || 79),
            });
            if (latest.pm10) {
              setPollutants([
                { name: "PM10", value: latest.pm10, max: 200, unit: "µg/m³" },
                { name: "PM2.5", value: latest.pm25, max: 120, unit: "µg/m³" },
                { name: "NO₂", value: latest.no2, max: 100, unit: "µg/m³" },
                { name: "SO₂", value: latest.so2 || 6.5, max: 80, unit: "µg/m³" },
                { name: "CO", value: latest.co || 0.5, max: 10, unit: "mg/m³" },
              ]);
            }
          }
        }
      } catch (err) {
        console.warn("AQIAnalytics trend load failed, using fallback:", err);
        if (!cancelled && fallbackMonthly?.overall) {
          setTrendData(fallbackMonthly.overall.slice(-12));
        }
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">AIR QUALITY ANALYSIS</p>
          <h1>AQI Analytics</h1>
          <p>Analyze empirical AQI and pollutant concentrations from Nashik monitoring stations.</p>
        </div>
      </div>

      <div className="metric-row">
        <div className="metric-box">
          <span>Average AQI</span>
          <strong>{currentMetrics.avgAqi}</strong>
          <small style={{ color: "#38bdf8", marginTop: "0.2rem" }}>NAQI: Satisfactory</small>
        </div>

        <div className="metric-box">
          <span>Maximum AQI</span>
          <strong>{currentMetrics.maxAqi}</strong>
          <small style={{ color: "#f97316", marginTop: "0.2rem" }}>Peak 12-Month Observation</small>
        </div>

        <div className="metric-box">
          <span>PM2.5</span>
          <strong>{currentMetrics.pm25} µg/m³</strong>
          <small style={{ color: "#22c55e", marginTop: "0.2rem" }}>NAQI standard: 60 µg/m³</small>
        </div>

        <div className="metric-box">
          <span>PM10</span>
          <strong>{currentMetrics.pm10} µg/m³</strong>
          <small style={{ color: "#eab308", marginTop: "0.2rem" }}>NAQI standard: 100 µg/m³</small>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel large-panel">
          <div className="panel-header">
            <div>
              <h2>Monthly AQI</h2>
              <p>Continuous monthly AQI variation (Real Monitoring Data)</p>
            </div>
            <span className="chart-badge">Active Stations</span>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px" }}
                  formatter={(val) => [`${val} AQI`, "Nashik AQI"]}
                />
                <Bar dataKey="aqi" fill="#f97316" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h2>Pollutants</h2>
              <p>Mean concentrations (µg/m³)</p>
            </div>
          </div>

          <div className="pollutant-list">
            {pollutants.map((pollutant) => (
              <div className="pollutant-item" key={pollutant.name}>
                <div>
                  <strong>{pollutant.name}</strong>
                  <span>{pollutant.value} {pollutant.unit}</span>
                </div>

                <div className="progress">
                  <div
                    style={{
                      width: `${Math.min((pollutant.value / pollutant.max) * 100, 100)}%`,
                      backgroundColor: pollutant.name.includes("PM") ? "#f97316" : "#38bdf8",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AQIAnalytics;