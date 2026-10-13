import { api } from "./api";

export const predictionService = {
  getForecast: () => api.get("/api/prediction"),
};
