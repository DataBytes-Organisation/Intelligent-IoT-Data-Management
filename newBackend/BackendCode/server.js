//handles server setup and configuration for the Express backend

const app = require('./app');

//Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
