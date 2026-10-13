import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { lulcService } from "../services/lulcService";
import { LULC_CLASSES } from "../utils/mapUtils";
import { formatAreaStatsForPie } from "../utils/chartUtils";

function LULCAnalytics() {
  const [areaData, setAreaData] = useState([]);
  const [accuracy, setAccuracy] = useState(null);
  const [source, setSource] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [areaRes, accRes] = await Promise.all([
          lulcService.getAreaStats(),
          lulcService.getAccuracy(),
        ]);
        if (!cancelled) {
          setAreaData(formatAreaStatsForPie(areaRes));
          setSource(areaRes.source);
          setAccuracy(accRes.data);
        }
      } catch (err) {
        console.error("LULCAnalytics load failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const intervalId = window.setInterval(load, 300000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const colors = LULC_CLASSES.map((c) => c.color);

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">LAND COVER ANALYSIS</p>
          <h1>LULC Analytics</h1>
          <p>
            Analyze land use and land cover distribution across Nashik
            Municipal Corporation (Sentinel-2 + Random Forest classification).
          </p>
          {source === "sample_fallback" && (
            <p className="data-source-note">
              Showing sample data — connect backend/.env to your GEE asset for live results.
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="panel">
          <p>Loading LULC data...</p>
        </div>
      ) : (
        <>
          <div className="dashboard-grid">
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2>LULC Distribution</h2>
                  <p>Area by land-cover class</p>
                </div>
              </div>

              <div className="big-pie">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={areaData}
                      dataKey="area"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={125}
                    >
                      {areaData.map((item, index) => (
                        <Cell key={item.name} fill={colors[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2>Land Cover Classes</h2>
                  <p>Nashik Municipal Corporation</p>
                </div>
              </div>

              <div className="lulc-table">
                {areaData.map((item, index) => (
                  <div className="lulc-row" key={item.name}>
                    <div>
                      <span
                        className="class-dot"
                        style={{ background: colors[index] }}
                      ></span>
                      <strong>{item.name}</strong>
                    </div>
                    <span>{item.area} km²</span>
                    <strong>{item.percentage}%</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {accuracy && (
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2>Classification Accuracy</h2>
                  <p>Random Forest validation (spatially independent samples)</p>
                </div>
              </div>

              <div className="change-grid">
                <div className="change-card positive">
                  <span>Overall Accuracy</span>
                  <strong>{(accuracy.overall_accuracy * 100).toFixed(1)}%</strong>
                </div>
                <div className="change-card positive">
                  <span>Kappa Coefficient</span>
                  <strong>{accuracy.kappa.toFixed(3)}</strong>
                </div>
              </div>

              <div className="lulc-table">
                {Object.entries(accuracy.producers_accuracy || {}).map(
                  ([className, value]) => (
                    <div className="lulc-row" key={className}>
                      <div>
                        <strong>{className}</strong>
                      </div>
                      <span>Producer's: {(value * 100).toFixed(1)}%</span>
                      <strong>
                        User's:{" "}
                        {(
                          (accuracy.users_accuracy?.[className] || 0) * 100
                        ).toFixed(1)}
                        %
                      </strong>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default LULCAnalytics;
