import { useState } from "react";
import MapView from "../components/MapView";

function MapPage() {
  const [filters, setFilters] = useState({
    location: "Nashik",
    year: "2025",
    mapLayer: "AQI Hotspots",
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
  };

  const mapConfig = {
    "AQI Hotspots": { showLulcLayer: false, showHotspots: true },
    LULC: { showLulcLayer: true, showHotspots: false },
    "PM2.5": { showLulcLayer: false, showHotspots: true },
    "PM10": { showLulcLayer: false, showHotspots: true },
  };

  const selectedMapConfig = mapConfig[appliedFilters.mapLayer] || mapConfig["AQI Hotspots"];

  return (
    <div className="page">

      <div className="page-heading">
        <div>
          <p className="eyebrow">
            GIS ANALYSIS
          </p>

          <h1>LULC & AQI Map</h1>

          <p>
            Explore air quality and land-use information
            across Nashik.
          </p>
        </div>
      </div>

      <div className="filter-bar">

        <div>
          <label htmlFor="location-filter">Location</label>

          <select
            id="location-filter"
            name="location"
            value={filters.location}
            onChange={handleFilterChange}
          >
            <option value="Nashik">Nashik</option>
            <option value="Nashik Municipal Corporation">Nashik Municipal Corporation</option>
          </select>
        </div>

        <div>
          <label htmlFor="year-filter">Year</label>

          <select
            id="year-filter"
            name="year"
            value={filters.year}
            onChange={handleFilterChange}
          >
            <option value="2025">2025</option>
            <option value="2022">2022</option>
            <option value="2020">2020</option>
            <option value="2018">2018</option>
          </select>
        </div>

        <div>
          <label htmlFor="map-layer-filter">Map Layer</label>

          <select
            id="map-layer-filter"
            name="mapLayer"
            value={filters.mapLayer}
            onChange={handleFilterChange}
          >
            <option value="AQI Hotspots">AQI Hotspots</option>
            <option value="LULC">LULC</option>
            <option value="PM2.5">PM2.5</option>
            <option value="PM10">PM10</option>
          </select>
        </div>

        <button className="primary-button" onClick={handleApplyFilters}>
          Apply Filters
        </button>

      </div>

      <div className="panel">

        <MapView
          showLulcLayer={selectedMapConfig.showLulcLayer}
          showHotspots={selectedMapConfig.showHotspots}
        />

      </div>

    </div>
  );
}

export default MapPage;