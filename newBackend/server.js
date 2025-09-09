// newBackend/server.js
require('dotenv').config();
const app = require('./src/app');

console.log('DB cfg:', {
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  db: process.env.PGDATABASE,
  user: process.env.PGUSER
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
