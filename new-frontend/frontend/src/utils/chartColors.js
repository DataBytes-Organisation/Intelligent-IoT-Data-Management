export const CHART_COLORS = [
  "#2563eb",
  "#16a34a",
  "#9333ea",
  "#ea580c",
  "#0891b2",
  "#7c3aed",
];

export const getChartColor = (index = 0) =>
  CHART_COLORS[index % CHART_COLORS.length];