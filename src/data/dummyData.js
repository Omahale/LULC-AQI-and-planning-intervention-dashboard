export const dashboardStats = [
  {
    title: "Current AQI",
    value: "142",
    unit: "AQI",
    status: "Moderate",
    icon: "activity",
  },
  {
    title: "PM2.5",
    value: "68",
    unit: "µg/m³",
    status: "High",
    icon: "wind",
  },
  {
    title: "PM10",
    value: "102",
    unit: "µg/m³",
    status: "High",
    icon: "cloud",
  },
  {
    title: "Intervention Ranking",
    value: "12",
    unit: "Detected",
    status: "Attention",
    icon: "flame",
  },
];

export const aqiTrendData = [
  { month: "Jan", aqi: 108 },
  { month: "Feb", aqi: 115 },
  { month: "Mar", aqi: 124 },
  { month: "Apr", aqi: 132 },
  { month: "May", aqi: 128 },
  { month: "Jun", aqi: 142 },
  { month: "Jul", aqi: 151 },
  { month: "Aug", aqi: 138 },
  { month: "Sep", aqi: 145 },
  { month: "Oct", aqi: 157 },
  { month: "Nov", aqi: 149 },
  { month: "Dec", aqi: 142 },
];

export const pollutantData = [
  { name: "PM2.5", value: 68 },
  { name: "PM10", value: 102 },
  { name: "NO₂", value: 42 },
  { name: "SO₂", value: 18 },
  { name: "CO", value: 12 },
];

export const lulcData = [
  {
    name: "Agriculture",
    area: 510,
    percentage: 41,
  },
  {
    name: "Forest",
    area: 420,
    percentage: 33,
  },
  {
    name: "Built-up",
    area: 180,
    percentage: 14,
  },
  {
    name: "Barren Land",
    area: 75,
    percentage: 6,
  },
  {
    name: "Water",
    area: 65,
    percentage: 5,
  },
];

export const predictionData = [
  {
    day: "Today",
    actual: 142,
    predicted: 142,
  },
  {
    day: "Day 1",
    actual: null,
    predicted: 158,
  },
  {
    day: "Day 2",
    actual: null,
    predicted: 171,
  },
  {
    day: "Day 3",
    actual: null,
    predicted: 145,
  },
  {
    day: "Day 4",
    actual: null,
    predicted: 132,
  },
  {
    day: "Day 5",
    actual: null,
    predicted: 119,
  },
  {
    day: "Day 6",
    actual: null,
    predicted: 126,
  },
];

export const hotspots = [
  {
    rank: 1,
    location: "Satpur Industrial Area",
    aqi: 287,
    pollutant: "PM2.5",
    risk: "Critical",
  },
  {
    rank: 2,
    location: "Mumbai-Agra Highway",
    aqi: 251,
    pollutant: "PM10",
    risk: "Critical",
  },
  {
    rank: 3,
    location: "Nashik City Center",
    aqi: 221,
    pollutant: "PM2.5",
    risk: "High",
  },
  {
    rank: 4,
    location: "CBS Bus Stand",
    aqi: 210,
    pollutant: "PM10",
    risk: "High",
  },
  {
    rank: 5,
    location: "Panchavati Market",
    aqi: 198,
    pollutant: "PM2.5",
    risk: "High",
  },
];

export const trendData = [
  {
    year: "2018",
    builtUp: 95,
    forest: 450,
    agriculture: 550,
    aqi: 102,
  },
  {
    year: "2020",
    builtUp: 120,
    forest: 442,
    agriculture: 535,
    aqi: 118,
  },
  {
    year: "2022",
    builtUp: 145,
    forest: 432,
    agriculture: 525,
    aqi: 135,
  },
  {
    year: "2025",
    builtUp: 180,
    forest: 420,
    agriculture: 510,
    aqi: 142,
  },
];

export const alerts = [
  {
    type: "critical",
    title: "Critical AQI detected",
    description:
      "Satpur Industrial Area has reached an AQI level of 287.",
    time: "10 minutes ago",
  },
  {
    type: "warning",
    title: "PM2.5 threshold exceeded",
    description:
      "PM2.5 concentration exceeded the recommended threshold in Nashik City Center.",
    time: "35 minutes ago",
  },
  {
    type: "info",
    title: "LULC change detected",
    description:
      "Built-up area has increased significantly compared with the previous year.",
    time: "2 hours ago",
  },
];