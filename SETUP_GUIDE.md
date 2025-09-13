# 🚀 IoT Data Management Platform - Setup Guide

## Prerequisites

Before running the project, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download here](https://git-scm.com/)
- **Docker** (optional, for containerized deployment) - [Download here](https://www.docker.com/)

## 📁 Project Structure

```
Intelligent-IoT-Data-Management/
├── frontend/                 # React.js frontend
├── newBackend/              # Node.js backend
├── new-frontend/            # Alternative frontend
├── data_science/            # ML algorithms and data processing
├── Docker/                  # Docker configuration
└── datasets/                # Sample data files
```

## 🚀 Quick Start (Recommended)

### Option 1: Run Individual Services

#### 1. Start the Backend Server

```bash
# Navigate to backend directory
cd newBackend

# Install dependencies
npm install

# Start the server
npm start
```

**Backend will be available at:**
- HTTP API: `http://localhost:3000`
- WebSocket: `ws://localhost:8080`
- Health Check: `http://localhost:3000/health`

#### 2. Start the Frontend (Terminal 2)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

**Frontend will be available at:**
- `http://localhost:5173` (Vite default port)

### Option 2: Docker Deployment (Full Stack)

```bash
# Navigate to project root
cd Intelligent-IoT-Data-Management

# Start all services with Docker Compose
docker-compose -f Docker/docker-compose.yaml up -d
```

**Services will be available at:**
- Frontend: `http://localhost:80`
- Backend: `http://localhost:3000`
- Database: `localhost:5432`
- Monitoring: `http://localhost:9090` (Prometheus)
- Visualization: `http://localhost:3001` (Grafana)

## 🔧 Detailed Setup Instructions

### Backend Setup (Node.js)

1. **Navigate to backend directory:**
   ```bash
   cd newBackend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   # or
   npm run dev
   ```

4. **Verify backend is running:**
   - Open `http://localhost:3000` in your browser
   - You should see "IoT Data Management Backend is running"
   - Check health at `http://localhost:3000/health`

### Frontend Setup (React.js)

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Verify frontend is running:**
   - Open `http://localhost:5173` in your browser
   - You should see the IoT Data Management Platform interface

### Alternative Frontend Setup (new-frontend)

If you want to use the alternative frontend:

```bash
cd new-frontend/frontend
npm install
npm run dev
```

## 🌐 API Endpoints

Once the backend is running, you can access these endpoints:

### Data Endpoints
- `GET /api/streams` - Get all sensor data
- `GET /api/stream-names` - Get available stream names
- `POST /api/filter-streams` - Filter data by streams

### Analysis Endpoints
- `POST /api/correlations` - Perform correlation analysis
- `POST /api/anomalies` - Perform anomaly detection
- `POST /api/export` - Export data (JSON/CSV)

### System Endpoints
- `GET /api/algorithms` - Get available ML algorithms
- `GET /api/statistics` - Get dataset statistics
- `GET /health` - Health check

### WebSocket
- `ws://localhost:8080` - Real-time data streaming

## 🧪 Testing the API

### Test Backend Health
```bash
curl http://localhost:3000/health
```

### Test Data Retrieval
```bash
curl http://localhost:3000/api/streams
```

### Test Correlation Analysis
```bash
curl -X POST http://localhost:3000/api/correlations \
  -H "Content-Type: application/json" \
  -d '{
    "streams": ["Temperature", "Voltage Charge", "Humidity"],
    "start_date": "2025-03-19T15:00:00.000Z",
    "end_date": "2025-03-19T16:00:00.000Z"
  }'
```

### Test Anomaly Detection
```bash
curl -X POST http://localhost:3000/api/anomalies \
  -H "Content-Type: application/json" \
  -d '{
    "streams": ["Temperature", "Voltage Charge"],
    "start_date": "2025-03-19T15:00:00.000Z",
    "end_date": "2025-03-19T16:00:00.000Z",
    "algorithm_type": "z_score"
  }'
```

## 🔍 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill process using port 3000
   npx kill-port 3000
   
   # Kill process using port 5173
   npx kill-port 5173
   ```

2. **Dependencies Not Installed**
   ```bash
   # Clear npm cache and reinstall
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **CORS Issues**
   - The backend is configured with CORS enabled
   - If you still have issues, check the CORS configuration in `newBackend/BackendCode/server.js`

4. **WebSocket Connection Issues**
   - Ensure WebSocket server is running on port 8080
   - Check browser console for connection errors

### Logs and Debugging

**Backend Logs:**
```bash
cd newBackend
npm start
# Check console output for errors
```

**Frontend Logs:**
```bash
cd frontend
npm run dev
# Check browser console and terminal output
```

## 📊 Data Science Features

The platform includes several data science capabilities:

### Available Algorithms
- **Correlation Analysis**: correlation, mean, volatility
- **Anomaly Detection**: z_score, isolation_forest

### Sample Data
- Pre-loaded with 80,000+ sensor data points
- Includes temperature, humidity, voltage, and other sensor readings
- Data spans multiple time periods for testing

## 🚀 Production Deployment

### Using Docker

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose -f Docker/docker-compose.yaml up -d
   ```

2. **Access services:**
   - Frontend: `http://localhost:80`
   - Backend: `http://localhost:3000`
   - Database: `localhost:5432`

### Environment Variables

Create a `.env` file in the project root:

```env
# Backend Configuration
PORT=3000
WS_PORT=8080

# Database Configuration (if using PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=iot_data
DB_USER=postgres
DB_PASSWORD=123456

# Frontend Configuration
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:8080
```

## 📚 Next Steps

1. **Explore the Frontend**: Navigate through the dashboard and try different features
2. **Test API Endpoints**: Use the provided curl commands or Postman
3. **Connect WebSocket**: Test real-time data streaming
4. **Run Analysis**: Try correlation analysis and anomaly detection
5. **Export Data**: Test the export functionality

## 🆘 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Check the console logs for error messages
4. Ensure all services are running on the correct ports

## 🎉 Success!

Once everything is running, you should have:
- ✅ Backend API server running on port 3000
- ✅ WebSocket server running on port 8080
- ✅ Frontend application running on port 5173
- ✅ Full IoT data management platform ready to use!

Happy coding! 🚀
