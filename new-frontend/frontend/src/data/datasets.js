export const datasets = [
  {
    id: "temp-01",
    name: "Sensor 1",
    description: "Temperature readings",
    type: "temperature",
    status: "live",
    anomalies24h: 2,
    gradient: "from-teal-600 to-teal-500",
  },
  {
    id: "hum-02",
    name: "Sensor 2",
    description: "Humidity monitoring",
    type: "humidity",
    status: "live",
    anomalies24h: 0,
    gradient: "from-orange-600 to-amber-500",
  },
  {
    id: "aqi-03",
    name: "Sensor 3",
    description: "Air quality index",
    type: "air",
    status: "offline",
    anomalies24h: 5,
    gradient: "from-violet-600 to-fuchsia-500",
  },
];
