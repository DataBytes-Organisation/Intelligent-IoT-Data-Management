# Frontend-Backend Integration Guide

## Overview
This integration connects the React frontend with the Node.js backend API for real-time IoT data management.

## Backend Setup

1. **Start the Backend Server:**
   ```bash
   cd BackendCode
   npm install
   npm start
   ```
   The backend will run on `http://localhost:3000`

2. **Verify Backend is Running:**
   ```bash
   curl http://localhost:3000/api/streams
   ```

## Frontend Setup

1. **Install Dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the Frontend:**
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

## Integration Features

### API Mode Toggle
- The Dashboard now has a toggle button to switch between:
  - **Mock Mode**: Uses local JSON data (default)
  - **API Mode**: Uses backend API endpoints

### Available API Endpoints

1. **GET /api/streams** - Get all sensor data
2. **GET /api/stream-names** - Get available stream names
3. **POST /api/filter-streams** - Filter data by stream names
4. **POST /api/analyze** - Run correlation analysis
5. **POST /api/analyze-corr** - Get correlation matrix
6. **POST /api/visualize** - Generate visualizations

### Error Handling
- Automatic fallback to mock data if API fails
- Loading states for all API calls
- Error messages displayed to user

## Testing the Integration

1. **Start both servers** (backend on :3000, frontend on :5173)
2. **Open the frontend** in your browser
3. **Click the toggle button** to switch to "API Mode (Backend)"
4. **Select streams** and observe data loading from backend
5. **Check browser console** for any errors

## Troubleshooting

### Backend Not Running
- Error: "Failed to fetch sensor data"
- Solution: Start the backend server first

### CORS Issues
- Error: "CORS policy" errors
- Solution: Backend already has CORS enabled

### Data Not Loading
- Check browser network tab for failed requests
- Verify backend is running on correct port
- Check backend console for errors

## File Structure

```
new-frontend/frontend/src/
├── services/
│   └── api.js                 # API service functions
├── hooks/
│   ├── useSensorData.js       # Updated to use API
│   ├── useStreamNames.js      # Updated to use API
│   └── useFilteredData.js     # Updated to use API
├── components/
│   └── Dashboard.jsx          # Updated with API toggle
└── utils/
    └── testIntegration.js     # Integration test script
```

## Next Steps

1. **Test all API endpoints** with different data sets
2. **Add more error handling** for specific use cases
3. **Implement real-time updates** with WebSocket
4. **Add data export functionality** via API
5. **Integrate correlation analysis** from backend
