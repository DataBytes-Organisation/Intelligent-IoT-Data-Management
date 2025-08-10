//handles server setup and configuration for the Express backend

require('dotenv').config({ path: '../.env' }); //Load .env from root

const express = require('express');
const cors = require('cors');

const mockRoutes = require('./routes/mock');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Backend is running');
});

//Mount mock routes
app.use('/api', mockRoutes);

//Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});