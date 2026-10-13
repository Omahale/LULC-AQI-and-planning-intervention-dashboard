import { api } from "./api";

export const aqiService = {
  getCurrent: () => api.get("/api/aqi/current"),
  getAreaBreakdown: () => api.get("/api/aqi/areas"),
  getAreaSummary: () => api.get("/api/aqi/areas"),
  getTrend: (params) => {
    if (!params) return api.get("/api/aqi/trend");
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        query.append(k, v);
      }
    });
    const queryString = query.toString();
    return api.get(`/api/aqi/trend${queryString ? `?${queryString}` : ""}`);
  },
  getHistorical: () => api.get("/api/aqi/historical"),
  getHotspots: () => api.get("/api/aqi/hotspots"),
  getNmcBoundary: () => api.get("/api/boundary/nmc"),
};
