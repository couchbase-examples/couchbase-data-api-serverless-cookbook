# Couchbase Airport API - Serverless Framework

A Serverless Framework implementation of the Couchbase Airport API, providing REST API endpoints for managing airport data using Couchbase's Data API.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Serverless Framework](https://www.serverless.com/) installed globally
- [AWS CLI](https://aws.amazon.com/cli/) configured
- [Couchbase Capella](https://www.couchbase.com/products/capella/) cluster with Data API enabled
- Couchbase [travel-sample](https://docs.couchbase.com/dotnet-sdk/current/ref/travel-app-data-model.html) bucket loaded

## Setup

1. **Install Serverless Framework globally**:
   ```bash
   npm install -g serverless
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file with your Couchbase credentials:
   ```
   DATA_API_ENDPOINT=https://your-cluster.cloud.couchbase.com
   DATA_API_USERNAME=your-database-username
   DATA_API_PASSWORD=your-database-password
   ```

4. **Configure AWS credentials**:
   ```bash
   aws configure
   ```

## Deployment

Deploy the API:
```bash
# Deploy to default stage (dev)
npm run deploy

# Deploy to specific stage
npm run deploy:dev
npm run deploy:prod
```

## Local Development

Run the API locally:
```bash
npm run offline
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Airport Management (CRUD Operations)
- `GET /airports/{airportId}` - Retrieve an airport document
- `POST /airports/{airportId}` - Create a new airport document
- `PUT /airports/{airportId}` - Update an existing airport document
- `DELETE /airports/{airportId}` - Delete an airport document

### Airport Information Queries
- `GET /airports/{airportCode}/routes` - Find routes for a specific airport
- `GET /airports/{airportCode}/airlines` - Find airlines that service a specific airport

### Full Text Search (FTS) Features
- `GET /airports/{airportId}/hotels/nearby/{distance}` - Find hotels near a specific airport within a specific distance

## API Examples

### Get an airport
```bash
curl https://your-api-id.execute-api.region.amazonaws.com/dev/airports/airport_1254
```

### Create an airport
```bash
curl -X POST https://your-api-id.execute-api.region.amazonaws.com/dev/airports/airport_new \
  -H "Content-Type: application/json" \
  -d '{
    "airportname": "Test Airport",
    "city": "Test City",
    "country": "Test Country",
    "faa": "TST",
    "geo": {
      "alt": 100,
      "lat": 34.0522,
      "lon": -118.2437
    },
    "icao": "KTST",
    "id": 9999,
    "type": "airport",
    "tz": "America/Los_Angeles"
  }'
```

### Find routes for an airport
```bash
curl https://your-api-id.execute-api.region.amazonaws.com/dev/airports/LAX/routes
```

### Find hotels near an airport
```bash
curl https://your-api-id.execute-api.region.amazonaws.com/dev/airports/airport_1254/hotels/nearby/50km
```

## FTS Index Setup

The hotel proximity search functionality requires a Full Text Search index with geo-spatial mapping on hotel documents. The index (`hotel-geo-index`) enables proximity searches on hotel documents and must be created before using the hotel search functionality.

To create this index, you can use the FTS index creation script from the parent project:

```bash
# From the parent directory
cd ../scripts
npm install
npm run create-fts-index
```

## Testing

### Integration Testing

Run integration tests against your deployed API:

```bash
# Set the API Gateway URL environment variable
export API_GATEWAY_URL="https://your-api-id.execute-api.us-east-1.amazonaws.com"

# Run the tests
npm run test
```

**Getting your API URL:**

After deployment, get your API URL from:
```bash
npx serverless info
```

Look for the line containing `HttpApiUrl` and copy that URL.

The integration tests will:
- Test all CRUD operations (Create, Read, Update, Delete)
- Verify query operations (routes, airlines)
- Test Full-Text Search functionality
- Validate error handling

## Cleanup

Remove the deployed stack:
```bash
npm run remove
```

## License

Apache 2.0 