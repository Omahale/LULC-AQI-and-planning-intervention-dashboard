// Shared map constants used across MapView and LULC pages.

export const LULC_CLASSES = [
  { id: 0, name: "Water", color: "#0000FF" },
  { id: 1, name: "Vegetation", color: "#006400" },
  { id: 2, name: "Cropland", color: "#FFFF00" },
  { id: 3, name: "Built-up", color: "#FF7777" },
  { id: 4, name: "Barren/Open", color: "#800080" },
];

export function getAQIColor(aqi) {
  if (aqi <= 50) return "#16a34a";
  if (aqi <= 100) return "#84cc16";
  if (aqi <= 200) return "#f59e0b";
  if (aqi <= 300) return "#f97316";
  return "#dc2626";
}
