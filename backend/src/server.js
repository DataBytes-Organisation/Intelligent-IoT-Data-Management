require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});
const app = require("./app");
const { startThingSpeakPolling } = require("./services/thingspeakService");
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  startThingSpeakPolling();
});
