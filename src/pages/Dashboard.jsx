import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import StatCard from "../components/StatCard";
import MapView from "../components/MapView";
import { dashboardStats } from "../data/dummyData";
import { aqiService } from "../services/aqiService";
import { lulcService } from "../services/lulcService";
import { formatAreaStatsForPie } from "../utils/chartUtils";

const pieColors = [
  "#16a34a",
  "#22c55e",
  "#f59e0b",
  "#94a3b8",
  "#38bdf8",
];

function Dashboard() {
  const AVAILABLE_YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016];
  const [lulcData, setLulcData] = useState([]);
  const [source, setSource] = useState(null);
  const [areaData, setAreaData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [selectedArea, setSelectedArea] = useState("Nashik NMC");
  const [selectedTrendYear, setSelectedTrendYear] = useState("2026");
  const [trendStation, setTrendStation] = useState("all");
  const [yearSummary, setYearSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadLulcDistribution = async () => {
      try {
        const areaRes = await lulcService.getAreaStats();
        if (!cancelled) {
          setLulcData(formatAreaStatsForPie(areaRes));
          setSource(areaRes.source);
        }
      } catch (err) {
        console.error("Dashboard LULC distribution load failed:", err);
      }
    };

    const loadAreaBreakdown = async () => {
      try {
        const areaRes = await aqiService.getAreaBreakdown();
        if (!cancelled) {
          const areas = areaRes?.data?.areas || areaRes?.areas || [];
          const normalizedAreas = areas.map((area) => ({
            id: area.area || area.station_name || "nashik-nmc",
            area: area.area || area.station_name || "Nashik NMC",
            station_name: area.station_name || area.area || "Nashik NMC",
            aqi: area.aqi ?? 0,
            pm25: area.pm25 ?? 0,
            pm10: area.pm10 ?? 0,
            no2: area.no2 ?? 0,
            so2: area.so2 ?? 0,
            co: area.co ?? 0,
            status: area.status || "Moderate",
          }));

          setAreaData(normalizedAreas);
        }
      } catch (err) {
        console.error("Dashboard AQI area breakdown load failed:", err);
      }
    };

    const loadTrend = async (yearVal = selectedTrendYear, stationVal = trendStation) => {
      try {
        const params = { year: yearVal };
        if (stationVal && stationVal !== "all") {
          params.station = stationVal;
        }
        const trendRes = await aqiService.getTrend(params);
        const payload = Array.isArray(trendRes?.data)
          ? trendRes.data
          : Array.isArray(trendRes?.data?.data)
            ? trendRes.data.data
            : [];

        if (!cancelled) {
          if (payload.length === 0) {
            setTrendData([]);
            setYearSummary(null);
            return;
          }

          const normalizedTrend = payload.map((item) => ({
            month: item.month || item.date || "Month",
            date: item.date,
            year: item.year,
            aqi: Number(item.aqi ?? item.value ?? 0),
            pm25: item.pm25,
            pm10: item.pm10,
            no2: item.no2,
            so2: item.so2,
            status: item.status,
          }));
          setTrendData(normalizedTrend);

          if (trendRes?.year_summary) {
            setYearSummary(trendRes.year_summary);
          } else {
            const valid = normalizedTrend.filter((p) => p.aqi > 0);
            if (valid.length > 0) {
              const avg = Math.round(valid.reduce((acc, c) => acc + c.aqi, 0) / valid.length);
              const minPt = [...valid].sort((a, b) => a.aqi - b.aqi)[0];
              const maxPt = [...valid].sort((a, b) => b.aqi - a.aqi)[0];
              setYearSummary({
                year: Number(yearVal),
                avg_aqi: avg,
                status: avg <= 50 ? "Good" : avg <= 100 ? "Satisfactory" : avg <= 200 ? "Moderate" : "Poor",
                min_month: minPt.month,
                min_aqi: minPt.aqi,
                max_month: maxPt.month,
                max_aqi: maxPt.aqi,
                months_count: payload.length,
              });
            } else {
              setYearSummary(null);
            }
          }
        }
      } catch (err) {
        console.error("Dashboard AQI trend load failed:", err);
        if (!cancelled) {
          setTrendData([]);
          setYearSummary(null);
        }
      }
    };

    loadLulcDistribution();
    loadAreaBreakdown();
    loadTrend();
    const intervalId = window.setInterval(loadLulcDistribution, 300000);
    const areaIntervalId = window.setInterval(loadAreaBreakdown, 300000);
    const trendIntervalId = window.setInterval(() => loadTrend(), 300000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.clearInterval(areaIntervalId);
      window.clearInterval(trendIntervalId);
    };
  }, [selectedTrendYear, trendStation]);

  useEffect(() => {
    if (areaData.length > 0 && !areaData.some((area) => area.area === selectedArea)) {
      setSelectedArea(areaData[0].area);
    }
  }, [areaData, selectedArea]);

  const selectedAreaData = areaData.find((area) => area.area === selectedArea) || areaData[0] || null;

  return (
    <div className="page">

      <div className="page-heading">
        <div>
          <p className="eyebrow">
            NASHIK ENVIRONMENTAL MONITORING
          </p>

          <h1>Dashboard Overview</h1>

          <p>
            Monitor land use, land cover and air quality
            across Nashik.
          </p>
          {source === "sample_fallback" && (
            <p className="data-source-note">
              Showing sample distribution — connect the GEE asset to update this live.
            </p>
          )}
        </div>

        <div className="date-badge">
          <span>Last Updated</span>
          <strong>20 Aug 2026</strong>
        </div>
      </div>

      {/* Statistics */}

      <div className="stats-grid">
        {dashboardStats.map((stat) => (
          <StatCard
            key={stat.title}
            {...stat}
          />
        ))}
      </div>

      <div
        className="panel"
        style={{
          marginTop: "1.5rem",
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(13, 27, 42, 0.9))",
          border: "1px solid rgba(45, 212, 191, 0.15)",
          boxShadow: "0 18px 32px rgba(15, 118, 110, 0.12)",
        }}
      >
        <div className="panel-header" style={{ alignItems: "center" }}>
          <div>
            <h2 style={{ color: "#f8fafc" }}>Area AQI Overview</h2>
            <p style={{ color: "#94a3b8" }}>Selected pollution condition within Nashik NMC</p>
          </div>

          <label
            htmlFor="area-selector"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.45rem",
              color: "#cbd5e1",
              fontSize: "0.78rem",
              fontWeight: 600,
            }}
          >
            <span style={{ color: "#a5f3fc" }}>Select area</span>
            <select
              id="area-selector"
              value={selectedArea}
              onChange={(event) => setSelectedArea(event.target.value)}
              style={{
                background: "linear-gradient(135deg, #0f172a 0%, #111827 100%)",
                color: "#f8fafc",
                border: "1px solid rgba(45, 212, 191, 0.5)",
                borderRadius: "0.75rem",
                padding: "0.7rem 0.9rem",
                minWidth: "190px",
                outline: "none",
                boxShadow: "0 0 0 1px rgba(45, 212, 191, 0.22)",
              }}
            >
              {areaData.map((area) => (
                <option key={area.id} value={area.area}>
                  {area.area}
                </option>
              ))}
            </select>
          </label>
        </div>

        {selectedAreaData ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "1rem",
              marginTop: "1.25rem",
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, rgba(15, 118, 110, 0.2), rgba(249, 115, 22, 0.16))",
                border: "1px solid rgba(45, 212, 191, 0.28)",
                borderRadius: "1rem",
                padding: "1rem 1rem 1.1rem",
                minHeight: "136px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <p style={{ margin: 0, color: "#a5f3fc", fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>AQI</p>
              <div>
                <h3 style={{ margin: "0.4rem 0 0.2rem", fontSize: "2.2rem", color: "#f8fafc", lineHeight: 1 }}>{selectedAreaData.aqi}</h3>
                <span style={{ color: "#fbbf24", fontWeight: 700, fontSize: "0.82rem" }}>{selectedAreaData.status}</span>
              </div>
            </div>

            {[
              ["PM2.5", selectedAreaData.pm25],
              ["PM10", selectedAreaData.pm10],
              ["NO2", selectedAreaData.no2],
              ["SO2", selectedAreaData.so2],
              ["CO", selectedAreaData.co],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  background: "rgba(15, 23, 42, 0.72)",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  borderRadius: "1rem",
                  padding: "1rem 1rem 1.1rem",
                  minHeight: "136px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.75rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</p>
                <div>
                  <h3 style={{ margin: "0.45rem 0 0.2rem", fontSize: "1.7rem", color: "#f8fafc", lineHeight: 1 }}>{value}</h3>
                  <span style={{ color: "#cbd5e1", fontSize: "0.72rem" }}>µg/m³</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ marginTop: "1rem", color: "#cbd5e1" }}>Loading AQI area data...</p>
        )}
      </div>

      {/* Charts */}

      <div className="dashboard-grid">

        <div className="panel large-panel">

          <div className="panel-header" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
            <div>
              <h2>AQI Trend — Year {selectedTrendYear}</h2>
              <p>
                Month-by-month air quality index across whole year {selectedTrendYear} ({trendData.length} months available)
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <label htmlFor="year-select" style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 600 }}>
                  Year:
                </label>
                <select
                  id="year-select"
                  aria-label="Select Year"
                  value={selectedTrendYear}
                  onChange={(e) => setSelectedTrendYear(e.target.value)}
                  style={{
                    background: "#1e293b",
                    color: "#f8fafc",
                    border: "1px solid #475569",
                    borderRadius: "6px",
                    padding: "0.35rem 0.65rem",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {AVAILABLE_YEARS.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr} {yr === 2026 ? "(9 Months)" : yr === 2016 ? "(10 Months)" : "(12 Months)"}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <label htmlFor="trend-station-select" style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 600 }}>
                  Station:
                </label>
                <select
                  id="trend-station-select"
                  aria-label="Select Station"
                  value={trendStation}
                  onChange={(e) => setTrendStation(e.target.value)}
                  style={{
                    background: "#1e293b",
                    color: "#f8fafc",
                    border: "1px solid #475569",
                    borderRadius: "6px",
                    padding: "0.35rem 0.65rem",
                    fontSize: "0.82rem",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  <option value="all">All Stations (City Average)</option>
                  <option value="Gangapur Road">Gangapur Road</option>
                  <option value="Pandav Nagari">Pandav Nagari</option>
                  <option value="MIDC Ambad">MIDC Ambad</option>
                  <option value="Hirawadi">Hirawadi</option>
                </select>
              </div>

              <span className="chart-badge">
                {selectedTrendYear}
              </span>
            </div>
          </div>

          {/* Quick Year Navigation Pills */}
          <div style={{ display: "flex", gap: "0.35rem", padding: "0 1.25rem 0.6rem", flexWrap: "wrap", overflowX: "auto" }}>
            {AVAILABLE_YEARS.map((yr) => {
              const isActive = String(selectedTrendYear) === String(yr);
              return (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setSelectedTrendYear(String(yr))}
                  style={{
                    padding: "0.22rem 0.6rem",
                    fontSize: "0.72rem",
                    borderRadius: "6px",
                    border: isActive ? "1px solid #f97316" : "1px solid rgba(255,255,255,0.08)",
                    background: isActive ? "#f97316" : "rgba(255,255,255,0.03)",
                    color: isActive ? "#ffffff" : "#94a3b8",
                    fontWeight: isActive ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {yr}
                </button>
              );
            })}
          </div>

          {/* Year Summary Indicators */}
          {yearSummary && (
            <div style={{ display: "flex", gap: "1.2rem", padding: "0 1.25rem 0.75rem", fontSize: "0.75rem", color: "#94a3b8", flexWrap: "wrap", alignItems: "center" }}>
              <span>Annual Average: <strong style={{ color: "#f97316" }}>{yearSummary.avg_aqi} AQI</strong> ({yearSummary.status})</span>
              <span>•</span>
              <span>Cleanest Month: <strong style={{ color: "#22c55e" }}>{yearSummary.min_month} ({yearSummary.min_aqi} AQI)</strong></span>
              <span>•</span>
              <span>Peak Month: <strong style={{ color: "#ef4444" }}>{yearSummary.max_month} ({yearSummary.max_aqi} AQI)</strong></span>
              <span>•</span>
              <span>Data Points: <strong style={{ color: "#38bdf8" }}>{yearSummary.months_count} Months Monitored</strong></span>
            </div>
          )}

          <div className="chart-container">
            {trendData.length === 0 ? (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#cbd5e1",
                fontSize: "0.95rem",
              }}>
                No AQI trend available yet.
              </div>
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart data={trendData}>

                  <defs>
                    <linearGradient
                      id="aqiGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#f97316"
                        stopOpacity={0.3}
                      />

                      <stop
                        offset="95%"
                        stopColor="#f97316"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis dataKey="month" />

                  <YAxis />

                  <Tooltip />

                  <Area
                    type="monotone"
                    dataKey="aqi"
                    stroke="#f97316"
                    fill="url(#aqiGradient)"
                    strokeWidth={3}
                  />

                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* LULC */}

        <div className="panel">

          <div className="panel-header">
            <div>
              <h2>LULC Distribution</h2>
              <p>Current Land Cover</p>
            </div>
          </div>

          <div className="pie-container">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>

                <Pie
                  data={lulcData}
                  dataKey="area"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {lulcData.map(
                    (item, index) => (
                      <Cell
                        key={item.name}
                        fill={pieColors[index]}
                      />
                    )
                  )}
                </Pie>

                <Tooltip />

              </PieChart>
            </ResponsiveContainer>

          </div>

          <div className="lulc-legend">

            {lulcData.map(
              (item, index) => (
                <div key={item.name}>

                  <span
                    style={{
                      background:
                        pieColors[index],
                    }}
                  ></span>

                  <label>
                    {item.name}
                  </label>

                  <strong>
                    {item.percentage}%
                  </strong>

                </div>
              )
            )}

          </div>

        </div>

      </div>

      {/* Maps */}

      <div className="map-grid">

        <div className="panel map-panel">

          <div className="panel-header">
            <div>
              <h2>LULC Land Cover Map</h2>
              <p>Satellite-based classification across Nashik</p>
            </div>
          </div>

          <MapView showHotspots={false} />

        </div>

        <div className="panel map-panel">

          <div className="panel-header">
            <div>
              <h2>Pollution Monitoring Map</h2>
              <p>Air quality hotspots across Nashik</p>
            </div>

            <button className="outline-button">
              View Full Map
            </button>
          </div>

          <MapView showLulcLayer={false} />

        </div>

      </div>

    </div>
  );
}

export default Dashboard;