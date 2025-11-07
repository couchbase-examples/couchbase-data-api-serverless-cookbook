# Couchbase Data API Serverless Cookbook

> **Important:** This cookbook demonstrates building **serverless REST APIs** that use **Couchbase Data API** under the hood. Your applications interact with standard REST endpoints, while the serverless functions handle all communication with Couchbase's Data API internally.

This cookbook demonstrates how to build serverless REST APIs across multiple cloud platforms (AWS Lambda, Azure Functions, Cloudflare Workers, and Google Cloud Functions) that interface with Couchbase's Data API to manage airport data from the travel-sample dataset.

## Overview

This cookbook provides a comprehensive Airport Information System that manages airport data and provides related travel information from the Couchbase travel-sample dataset. Each serverless implementation exposes REST API endpoints that internally call Couchbase's Data API, following REST API principles while abstracting the underlying Data API interactions.

### Architecture

The serverless functions act as a REST API layer that interfaces with Couchbase Data API. Here's how the request flow works:

**REST API Flow:**
1. **Client Request**: Your application sends a standard HTTP request to the REST API endpoint (e.g., `POST /airports`)
2. **Serverless Function Layer**: 
   - Receives and validates the incoming HTTP request
   - Extracts required parameters (path parameters, query strings, request body)
   - Performs business logic and data transformation
   - Authenticates with Couchbase Data API using stored credentials
3. **Couchbase Data API Call**: The serverless function makes an HTTP request to Couchbase's Data API endpoint with proper authentication headers
4. **Response Processing**: The serverless function receives the Data API response, formats it appropriately, and returns it to the client

### Learn More About Couchbase Data API

This cookbook's serverless functions are built on top of Couchbase's Data API. To learn more about the underlying API:

- **[Get Started with Data API](https://docs.couchbase.com/cloud/data-api-guide/data-api-start.html)** - Complete guide covering setup, authentication, and networking options
- **[Data API Reference](https://docs.couchbase.com/cloud/data-api-reference/index.html)** - Full API reference for all available endpoints (document operations, queries, search, etc.)

Understanding these resources will help you extend the serverless functions or build custom integrations.

## Platform Tutorials

Choose your preferred serverless platform to get started:

- **AWS Lambda**: [View Tutorial](./aws-lambdas/README.md)
- **Cloudflare Workers**: [View Tutorial](./cloudflare-workers/README.md)
- **Azure Functions**: [View Tutorial](./azure-functions/README.md)
- **Google Cloud Functions**: [View Tutorial](./gcp/README.md)

### Architecture Diagrams

![Data API Architecture Architecture](./assets/DataAPI%20Architecture%20Diagram.drawio.png)

### Core Features

#### Airport Management (CRUD Operations)
- `GET /airports/{document_key}` - Retrieve an airport document
- `POST /airports` - Create a new airport document
- `PUT /airports/{document_key}` - Update an existing airport document
- `DELETE /airports/{document_key}` - Delete an airport document

#### Airport Information Queries
- `GET /airports/{airport_code}/routes` - Find routes for a specific airport
- `GET /airports/{airport_code}/airlines` - Find airlines that service a specific airport

#### Full Text Search (FTS) Features
- `GET /airports/{airport_id}/hotels/nearby/{distance}` - Find hotels near a specific airport within a specific distance

## Prerequisites

- [Couchbase Capella](https://www.couchbase.com/products/capella/) cluster
- Couchbase [travel-sample](https://docs.couchbase.com/cloud/clusters/data-service/import-data-documents.html) bucket loaded

## Database Configuration

### Enable the Data API

Before you can use this cookbook, you must enable the Data API for your Couchbase Capella cluster. Follow the instructions in the [Couchbase documentation](https://docs.couchbase.com/cloud/data-api-guide/data-api-start.html#enable-the-data-api) to:

1. Enable the Data API for your cluster
2. Copy the Data API endpoint URL (you'll need this for `DATA_API_ENDPOINT`)

### Setup Database Connection

To connect to your Capella cluster, please follow the [instructions](https://docs.couchbase.com/cloud/get-started/connect.html).

Specifically, you need to do the following:

1. Create [database credentials](https://docs.couchbase.com/cloud/clusters/manage-database-users.html) to access the travel-sample bucket (Read and Write permissions) used in the application
2. [Allow access](https://docs.couchbase.com/cloud/clusters/allow-ip-address.html) to the Cluster from the IP on which the application is running

### Required Environment Variables
The following Couchbase Data API credentials are required:
- `DATA_API_USERNAME` - Your Couchbase database username (from the database credentials created in step 1 above)
- `DATA_API_PASSWORD` - Your Couchbase database password (from the database credentials created in step 1 above)
- `DATA_API_ENDPOINT` - Your Couchbase Data API endpoint URL (obtained when enabling the Data API)

## FTS Index Setup

The hotel proximity search functionality requires a Full Text Search index with geo-spatial mapping on hotel documents. The index (`hotel-geo-index`) enables proximity searches on hotel documents and must be created before using the hotel search functionality.

### Creating the FTS Index

A common Node.js script is provided to create the required geo-spatial FTS index. See [scripts/README.md](./scripts/README.md) for detailed instructions on how to create the FTS index.



## REST API Endpoints & Usage Examples

> **Note:** These are the **REST API endpoints** that your client applications will use. Behind the scenes, the serverless functions translate these REST calls into Couchbase Data API requests, handling authentication and data transformation automatically.

The following examples demonstrate how to interact with the REST API endpoints:

### Get an airport
```bash
curl https://your-api-endpoint/airports/airport_1254
```

### Create an airport
```bash
curl -X POST https://your-api-endpoint/airports \
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
    "id": "airport_9999",
    "type": "airport",
    "tz": "America/Los_Angeles"
  }'
```

Note: The `id` field in the request body becomes the document key in Couchbase and the rest of document will be the value.

### Update an airport
```bash
curl -X PUT https://your-api-endpoint/airports/airport_1254 \
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
curl -X DELETE https://your-api-endpoint/airports/airport_1254
```

### Find routes for an airport
```bash
curl https://your-api-endpoint/airports/LAX/routes
```

### Find airlines for an airport
```bash
curl https://your-api-endpoint/airports/LAX/airlines
```

### Find hotels near an airport
```bash
curl https://your-api-endpoint/airports/airport_1254/hotels/nearby/50km
```

**Path Parameters:**
- `airport_id`: Airport document ID (required) - e.g., airport_1254, airport_1255
- `distance`: Search radius (required) - e.g., 50km, 10km

**Prerequisites for hotel search:** Make sure you have created the FTS index (`hotel-geo-index`) before using this endpoint.

## License

Apache 2.0