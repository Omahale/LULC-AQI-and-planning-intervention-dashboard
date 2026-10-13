import {
  Satellite,
  Map,
  Brain,
  Database,
  Leaf,
} from "lucide-react";

function About() {
  return (
    <div className="page">

      <div className="page-heading">

        <div>

          <p className="eyebrow">
            PROJECT INFORMATION
          </p>

          <h1>About the Project</h1>

          <p>
            LULC & Air Quality Environmental Monitoring System.
          </p>

        </div>

      </div>

      <div className="about-hero">

        <div className="about-logo">
          <Leaf size={30} />
        </div>

        <h2>
          Environmental Intelligence for Nashik
        </h2>

        <p>
          This platform combines Land Use Land Cover
          classification, GIS analysis, air quality monitoring
          and machine learning to understand environmental
          changes across Nashik.
        </p>

      </div>

      <div className="technology-grid">

        <div className="technology-card">

          <Satellite size={30} />

          <h3>
            Satellite Data
          </h3>

          <p>
            Satellite imagery can be used to generate LULC
            maps and identify land-cover changes.
          </p>

        </div>

        <div className="technology-card">

          <Map size={30} />

          <h3>
            GIS Analysis
          </h3>

          <p>
            Spatial analysis helps identify pollution hotspots
            and relationships between LULC and AQI.
          </p>

        </div>

        <div className="technology-card">

          <Brain size={30} />

          <h3>
            Machine Learning
          </h3>

          <p>
            ML models can forecast future AQI values using
            historical environmental data.
          </p>

        </div>

        <div className="technology-card">

          <Database size={30} />

          <h3>
            Environmental Data
          </h3>

          <p>
            AQI, PM2.5, PM10 and land-cover datasets are
            integrated for analysis.
          </p>

        </div>

      </div>

      <div className="workflow">

        <h2>
          System Workflow
        </h2>

        <div className="workflow-steps">

          <span>Satellite Data</span>

          <b>→</b>

          <span>LULC Classification</span>

          <b>→</b>

          <span>AQI Data</span>

          <b>→</b>

          <span>GIS Analysis</span>

          <b>→</b>

          <span>ML Prediction</span>

          <b>→</b>

          <span>Insights</span>

        </div>

      </div>

    </div>
  );
}

export default About;