import { api } from "./api";

export const lulcService = {
  getTileUrl: () => api.get("/api/lulc/tile-url"),
  getAreaStats: () => api.get("/api/lulc/area-stats"),
  getAccuracy: () => api.get("/api/lulc/accuracy"),
};
