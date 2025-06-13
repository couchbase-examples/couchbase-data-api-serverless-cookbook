# Couchbase Data API Tutorial

This tutorial demonstrates how to work with Couchbase's Data API to manage airport data from the travel-sample dataset.

## Overview

This provides a comprehensive Airport Information System that manages airport data and provides related travel information from the Couchbase travel-sample dataset.

### Architecture Diagrams

#### Cloudflare Workers
![Cloudflare Workers Architecture](./assets/cloudflare-workers.svg)

#### AWS Lambda
*Architecture diagram will be added*

### Core Features

#### Airport Management (CRUD Operations)
- `GET /airports/{document_key}` - Retrieve an airport document
- `POST /airports/{document_key}` - Create a new airport document
- `PUT /airports/{document_key}` - Update an existing airport document
- `DELETE /airports/{document_key}` - Delete an airport document

#### Airport Information Queries
- `GET /airports/{airport_code}/routes` - Find routes for a specific airport
- `GET /airports/{airport_code}/airlines` - Find airlines that service a specific airport

#### Full Text Search (FTS) Features
- `GET /airports/{airport_id}/hotels/nearby/{distance}` - Find hotels near a specific airport within a specific distance

## Prerequisites

- [Couchbase Capella](https://www.couchbase.com/products/capella/) cluster with Data API enabled
- Couchbase [travel-sample](https://docs.couchbase.com/dotnet-sdk/current/ref/travel-app-data-model.html) bucket loaded

## Database Configuration

### Setup Database Connection
To connect to your Capella cluster, please follow the [instructions](https://docs.couchbase.com/cloud/get-started/connect.html).

Specifically, you need to do the following:

1. Create [database credentials](https://docs.couchbase.com/cloud/clusters/manage-database-users.html) to access the travel-sample bucket (Read and Write permissions) used in the application
2. [Allow access](https://docs.couchbase.com/cloud/clusters/allow-ip-address.html) to the Cluster from the IP on which the application is running

### Required Environment Variables
The following Couchbase Data API credentials are required:
- `DATA_API_USERNAME` - Your Couchbase database username
- `DATA_API_PASSWORD` - Your Couchbase database password  
- `DATA_API_ENDPOINT` - Your Couchbase Data API endpoint URL

## FTS Index Setup

The hotel proximity search functionality requires a Full Text Search index with geo-spatial mapping on hotel documents. The index (`hotel-geo-index`) enables proximity searches on hotel documents and must be created before using the hotel search functionality.

### Creating the FTS Index

A common Node.js script is provided to create the required geo-spatial FTS index. See [scripts/README.md](./scripts/README.md) for detailed instructions on how to create the FTS index.



## API Examples

The following examples demonstrate the API endpoints that interface with Couchbase's Data API:

### Get an airport
```bash
curl https://your-api-endpoint/airports/airport_1254
```

### Create an airport
```bash
curl -X POST https://your-api-endpoint/airports/airport_new \
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