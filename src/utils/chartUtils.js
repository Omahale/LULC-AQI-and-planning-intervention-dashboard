// Small helpers for formatting API data into shapes recharts expects.

export function formatAreaStatsForPie(areaStatsResponse) {
  if (!areaStatsResponse?.data) return [];
  return areaStatsResponse.data.map((row) => ({
    name: row.class_name,
    area: row.area_km2,
    percentage: row.percent,
  }));
}
