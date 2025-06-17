# GCP Cloud Functions API for Couchbase

This project demonstrates how to build a serverless API using **GCP Cloud Functions and API Gateway** that interfaces with Couchbase's Data API to manage airport data from the travel-sample dataset.

**Note:** The FTS features require:
1. A Full Text Search index with geo-spatial mapping on hotel documents
2. The travel-sample dataset with hotel documents in the `inventory.hotel` collection
3. Hotels must have geo coordinates (`geo.lat` and `geo.lon` fields) for proximity search

## Overview

The API provides a comprehensive Airport Information System that manages airport data and provides related travel information from the Couchbase travel-sample dataset:

### Airport Management (CRUD Operations)
- `GET /airports/{airportId}` - Retrieve an airport document
- `POST /airports/{airportId}` - Create a new airport document
- `PUT /airports/{airportId}` - Update an existing airport document
- `DELETE /airports/{airportId}` - Delete an airport document

### Airport Information Queries
- `GET /airports/{airportCode}/routes` - Find routes for a specific airport
- `GET /airports/{airportCode}/airlines` - Find airlines that service a specific airport
- `GET /airports/{airportId}/hotels/nearby/{distance}` - Find hotels near a specific airport using geo-spatial FTS

## Prerequisites

- [Node.js](https://nodejs.org/) (v22.x or later)
- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) configured with appropriate credentials
- Google Cloud Project with Cloud Functions and API Gateway with [services enabled](https://cloud.google.com/api-gateway/docs/secure-traffic-gcloud#enabling_required_services)
- [Couchbase Capella](https://www.couchbase.com/products/capella/) cluster with Data API enabled
- Couchbase [travel-sample](https://docs.couchbase.com/dotnet-sdk/current/ref/travel-app-data-model.html) bucket loaded

## Setup

1. Clone the repository
    ```bash
    git clone https://github.com/couchbase-examples/couchbase-data-api-serverless-cookbook.git
    ```
    
2. Navigate to the gcp directory:
    ```bash
    cd couchbase-data-api-serverless-cookbook/gcp
    ```
    
3. Install dependencies:
    ```bash
    npm install
    ```
    
4. Configure your environment variables:
   Copy the example environment file and update with your values:
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your actual values:
   ```env
   # Google Cloud Function Configuration
   PROJECT_ID=<gcp-project-id>
   REGION=europe-west1
   MEMORY=128Mi
   TIMEOUT=120s
   RUNTIME=nodejs22

   # Cluster Credentials
   DATA_API_ENDPOINT=<capella-data-api-endpoint>
   DB_USERNAME=<capella-cluster-username>
   DB_PASSWORD=<capella-cluster-password>
   DB_BUCKET_NAME=travel-sample
   DB_SCOPE=inventory
   DB_COLLECTION=airport
   ```

5. Authenticate with Google Cloud:
   ```bash
   gcloud auth login
   ```

## FTS Index Setup

Before using the hotel search functionality, you need to create a Full Text Search index. Use the Node.js script provided in the root of the repository.

See [../scripts/README.md](../scripts/README.md) for detailed instructions on creating the required `hotel-geo-index` for geo-spatial hotel searches.


## Deployment

### Deploy Cloud Functions

First, deploy your Cloud Functions:

```bash
npm run deploy-gcp-cloud-function
```

This will deploy all functions defined in the `FUNCTIONS` array in `config.js`.

### Deploy API Gateway

After functions are deployed, run the API Gateway deployment:

```bash
npm run deploy-api-gateway
```

This script will:
1. Create a new API Gateway
2. Set up Cloud Function integrations
3. Create a gateway and output the API endpoint URL

## Testing

### Integration Testing

The integration tests will automatically discover your API Gateway endpoint and test all API operations through it:
```bash
npm run test
```

This will:
- Test all API operations end-to-end
- Verify response formats and status codes
- Test error handling and edge cases

## API Examples

All examples use the API Gateway URL:

### Get an airport
```bash
curl "https://your-gateway-url.gateway.dev/airports/airport_1254"
```

### Create an airport
```bash
curl -X POST "https://your-gateway-url.gateway.dev/airports/airport_new" \
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

### Update an airport
```bash
curl -X PUT "https://your-gateway-url.gateway.dev/airports/airport_1254" \
  -H "Content-Type: application/json" \
  -d '{
    "airportname": "Updated Airport",
    "city": "Updated City",
    "country": "Updated Country",
    "faa": "UPD",
    "geo": {
      "alt": 200,
      "lat": 35.0522,
      "lon": -119.2437
    },
    "icao": "KUPD",
    "id": 1254,
    "type": "airport",
    "tz": "America/Los_Angeles"
  }'
```

### Delete an airport
```bash
curl -X DELETE "https://your-gateway-url.gateway.dev/airports/airport_1254"
```

### Find routes for an airport
```bash
curl "https://your-gateway-url.gateway.dev/airports/LAX/routes"
```

### Find airlines for an airport
```bash
curl "https://your-gateway-url.gateway.dev/airports/LAX/airlines"
```

### Find hotels near an airport
```bash
curl "https://your-gateway-url.gateway.dev/airports/airport_1254/hotels/nearby/10km"
```

