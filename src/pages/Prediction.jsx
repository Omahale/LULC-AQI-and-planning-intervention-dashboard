import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  Brain,
  TrendingUp,
} from "lucide-react";

import { predictionData } from "../data/dummyData";

function Prediction() {
  return (
    <div className="page">

      <div className="page-heading">
        <div>
          <p className="eyebrow">
            MACHINE LEARNING
          </p>

          <h1>AQI Prediction</h1>

          <p>
            Forecast future air quality using machine learning.
          </p>
        </div>
      </div>

      <div className="prediction-banner">

        <div>
          <span>Current AQI</span>
          <strong>142</strong>
        </div>

        <div>
          <span>Tomorrow</span>
          <strong>158</strong>
        </div>

        <div>
          <span>ML Model</span>
          <strong>Random Forest</strong>
        </div>

        <div>
          <span>Model Score</span>
          <strong>91%</strong>
        </div>

      </div>

      <div className="panel">

        <div className="panel-header">

          <div>
            <h2>7-Day AQI Forecast</h2>
            <p>Predicted air quality index</p>
          </div>

          <Brain size={23} />

        </div>

        <div className="prediction-chart">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart data={predictionData}>

              <CartesianGrid
                strokeDasharray="3 3"
              />

              <XAxis dataKey="day" />

              <YAxis />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#7c3aed"
                strokeWidth={3}
                dot={{ r: 5 }}
              />

            </LineChart>
          </ResponsiveContainer>

        </div>

      </div>

      <div className="recommendation-box">

        <TrendingUp size={22} />

        <div>
          <strong>
            Prediction Insight
          </strong>

          <p>
            AQI is expected to remain in the moderate-to-high
            range during the next few days. Continuous
            environmental monitoring is recommended.
          </p>
        </div>

      </div>

    </div>
  );
}

export default Prediction;