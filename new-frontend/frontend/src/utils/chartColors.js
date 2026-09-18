export const CHART_COLORS = [
  "#0072B2",
  "#E69F00",
  "#009E73",
  "#CC79A7",
  "#56B4E9",
  "#D55E00",
  "#F0E442",
  "#000000",
];

export const getChartColor = (index = 0) =>
  CHART_COLORS[index % CHART_COLORS.length];