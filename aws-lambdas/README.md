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

## Prerequisites

- [Node.js](https://nodejs.org/) (v22.x or later)
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- AWS IAM Role with Lambda and API Gateway permissions
- Couchbase Server with Data API enabled
- Couchbase travel-sample bucket loaded

## Setup

1. Clone the repository
2. Navigate to the aws-lambdas directory:
    ```bash
    cd aws-lambdas
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
   TIMEOUT=30

   # Cluster Credentials
   BASE_URL=<capella-data-api-endpoint>
   CLUSTER_PASSWORD=<capella-cluster-password>
   USERNAME=<capella-cluster-username>
   ```

## Deployment

### Deploy Lambda Functions

Run the deployment script:
```bash
node scripts/deploy_airport_lambda_functions.mjs
```

This script will:
1. Create zip files for each Lambda function
2. Deploy the functions to AWS Lambda
3. Configure environment variables and runtime settings

### Deploy API Gateway

Run the API Gateway deployment script:
```bash
node scripts/deploy_api_gateway_with_integrations.mjs
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
node tests/airport_api_local.test.mjs
```

### AWS Lambda Testing

Run the AWS Lambda test suite:
```bash
node tests/airport_api_aws.test.mjs
```

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
  -H "If-Match: \"your-etag-value\"" \
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
curl -X DELETE https://your-api-gateway-url/airports/airport_1254 \
  -H "If-Match: \"your-etag-value\""
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

## Project Structure

```
aws-lambdas/
├── src/                    # Lambda function handlers
│   ├── createAirport.mjs
│   ├── getAirport.mjs
│   ├── updateAirport.mjs
│   ├── deleteAirport.mjs
│   ├── getAirportRoutes.mjs
│   └── getAirportAirlines.mjs
├── scripts/               # Deployment scripts
│   ├── deploy_airport_lambda_functions.mjs
│   └── deploy_api_gateway_with_integrations.mjs
├── tests/                 # Test suites
│   ├── airport_api_local.test.mjs
│   └── airport_api_aws.test.mjs
└── README.md
```

## License

Apache 2.0
