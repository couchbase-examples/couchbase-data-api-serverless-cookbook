# AWS Lambda API for Couchbase

This project demonstrates how to build a serverless API using **AWS Lambda and API Gateway** that interfaces with Couchbase's Data API to manage airport data from the travel-sample dataset.

## Overview

The API provides a comprehensive Airport Information System that manages airport data and provides related travel information from the Couchbase travel-sample dataset:

### Airport Management (CRUD Operations)
- `GET /airports/{airportId}` - Retrieve an airport document
- `POST /airports/{airportId}` - Create a new airport document
- `PUT /airports/{airportId}` - Update an existing airport document
- `DELETE /airports/{airportId}` - Delete an airport document

### Airport Information Queries
- `POST /airports/routes` - Find routes for a specific airport
- `POST /airports/airlines` - Find airlines that service a specific airport
- `POST /airports/hotels/nearby` - Find hotels near a specific airport using geo-spatial FTS

## Prerequisites

- [Node.js](https://nodejs.org/) (v22.x or later)
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- AWS IAM Role with Lambda and API Gateway permissions
- Couchbase Server with Data API enabled
- Couchbase travel-sample bucket loaded

## Setup

1. Clone the repository
    ```
    git clone https://github.com/couchbase-examples/couchbase-data-api-serverless-cookbook.git
    ```
2. Navigate to the aws-lambdas directory:
    ```bash
    cd couchbase-data-api-serverless-cookbook/aws-lambdas
    ```
3. Install dependencies:
    ```bash
    npm install
    ```
4. Configure your environment variables:
   - Remove the `.sample` extension from the `.env.sample` file:
   ```bash
   mv .env.sample .env
   ```
   - Update the `.env` file with your values:
   ```
   # Lambda Configuration
   LAMBDA_ROLE=<aws_lambda_role_arn>
   REGION=<aws_region>
   MEMORY_SIZE=128
   TIMEOUT=3

   # Cluster Credentials
   BASE_URL=<capella-data-api-endpoint>
   CLUSTER_PASSWORD=<capella-cluster-password>
   USERNAME=<capella-cluster-username>
   ```

## FTS Index Setup

Before using the hotel search functionality, you need to create a Full Text Search index:

```bash
npm run create-fts-index
```

This creates a geo-spatial FTS index called `hotel-geo-index` that enables proximity searches for hotels near airports. The index will be built in the background and will be ready for use shortly after creation.

## Deployment

### Deploy Lambda Functions

Run the deployment script:
```bash
npm run deploy-airport-lambdas
```

This script will:
1. Create zip files for each Lambda function
2. Deploy the functions to AWS Lambda
3. Configure environment variables and runtime settings

### Deploy API Gateway

Run the API Gateway deployment script:
```bash
npm run deploy-airport-api
```

This script will:
1. Create a new HTTP API Gateway
2. Set up Lambda integrations
3. Configure routes and CORS settings
4. Create a default stage
5. Output the API endpoint URL

## Testing

### Local Testing

Run the local test suite:
```bash
npm run test-airport-api-local
```

### API Gateway Integration Testing

The integration tests will automatically discover your API Gateway endpoint and test all API operations through it:

```bash
npm run test-airport-api-aws
```

This will:
- Automatically find your API Gateway endpoint
- Test all API operations end-to-end
- Verify response formats and status codes
- Test error handling and edge cases

## API Examples

### Get an airport
```bash
curl https://your-api-gateway-url/airports/airport_1254
```

### Create an airport
```bash
curl -X POST https://your-api-gateway-url/airports/airport_new \
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
curl -X PUT https://your-api-gateway-url/airports/airport_1254 \
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
curl -X DELETE https://your-api-gateway-url/airports/airport_1254
```

### Find routes for an airport
```bash
curl -X POST https://your-api-gateway-url/airports/routes \
  -H "Content-Type: application/json" \
  -d '{
    "airportCode": "LAX"
  }'
```

### Find airlines for an airport
```bash
curl -X POST https://your-api-gateway-url/airports/airlines \
  -H "Content-Type: application/json" \
  -d '{
    "airportCode": "LAX"
  }'
```

### Find hotels near an airport
```bash
curl -X POST https://your-api-gateway-url/airports/hotels/nearby \
  -H "Content-Type: application/json" \
  -d '{
    "airportId": "airport_1254",
    "distance": "10km"
  }'
```

## Project Structure

```
aws-lambdas/
├── src/                   # Lambda function handlers
│   ├── createAirport.mjs
│   ├── getAirport.mjs
│   ├── updateAirport.mjs
│   ├── deleteAirport.mjs
│   ├── getAirportRoutes.mjs
│   ├── getAirportAirlines.mjs
│   └── getHotelsNearAirport.mjs
├── scripts/               # Deployment scripts
│   ├── deploy_airport_lambda_functions.mjs
│   ├── deploy_api_gateway_with_integrations.mjs
│   └── create-fts-index.mjs
├── tests/                 # Test suites
│   ├── airport_api_local.test.mjs
│   └── airport_api_aws.test.mjs
└── README.md
```

## License

Apache 2.0
