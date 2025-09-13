# IoT Backend API

A Node.js Express API for the Intelligent IoT Data Management Platform.

## Quick Start

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start the Server:**
   ```bash
   npm start
   ```
   Or use the startup script:
   ```bash
   node start.js
   ```

3. **Test the API:**
   ```bash
   curl http://localhost:3000/api/streams
   ```

## API Endpoints

- `GET /api/streams` - Get all sensor data
- `GET /api/stream-names` - Get available stream names  
- `POST /api/filter-streams` - Filter data by stream names
- `POST /api/analyze` - Run correlation analysis
- `POST /api/analyze-corr` - Get correlation matrix
- `POST /api/visualize` - Generate visualizations

## Project Structure

```
BackendCode/
├── controllers/     # Request handlers
├── services/        # Business logic
├── repositories/    # Data access
├── middleware/      # Request validation
├── validation/      # Zod schemas
├── dtos/           # Data transfer objects
├── mock_data/      # Sample data files
└── __tests__/      # Unit tests
```

## Dependencies

- **express** - Web framework
- **cors** - Cross-origin requests
- **zod** - Schema validation
- **dotenv** - Environment variables

## Development

- **nodemon** - Auto-restart on changes
- **jest** - Testing framework
- **supertest** - API testing

## Data Sources

The API uses mock data from `mock_data/processed_data.json` for development. This contains sample IoT sensor readings that can be used for testing the frontend integration.
