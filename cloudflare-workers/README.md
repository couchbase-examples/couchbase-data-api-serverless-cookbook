# Cloudflare Workers API for Couchbase

This project demonstrates how to build a Cloudflare Workers-based API using the [**Hono framework**](https://developers.cloudflare.com/workers/frameworks/framework-guides/hono/) that interfaces with Couchbase's Data API to manage airport data from the travel-sample dataset.

## Overview

The API provides a comprehensive Airport Information System that manages airport data and provides related travel information from the Couchbase travel-sample dataset:

### Airport Management (CRUD Operations)
- `GET /airports/{document_key}` - Retrieve an airport document
- `POST /airports/{document_key}` - Create a new airport document
- `PUT /airports/{document_key}` - Update an existing airport document
- `DELETE /airports/{document_key}` - Delete an airport document

### Airport Information Queries
- `GET /airports/{airport_code}/routes` - Find routes for a specific airport
- `GET /airports/{airport_code}/airlines` - Find airlines that service a specific airport

### Full Text Search (FTS) Features
- `GET /airports/{airport_id}/hotels/nearby/{distance}` - Find hotels near a specific airport within a specific distance

**Note:** The FTS features require:
1. A Full Text Search index with geo-spatial mapping on hotel documents
2. The travel-sample dataset with hotel documents in the `inventory.hotel` collection
3. Hotels must have geo coordinates (`geo.lat` and `geo.lon` fields) for proximity search

## Prerequisites

- [Node.js](https://nodejs.org/) (v20 or later)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- [Cloudflare account](https://dash.cloudflare.com/) with verified email
- [Couchbase Capella](https://www.couchbase.com/products/capella/) cluster with Data API enabled
- Couchbase [travel-sample](https://docs.couchbase.com/dotnet-sdk/current/ref/travel-app-data-model.html) bucket loaded

## Setup

1. Clone the repository
2. Navigate to the cloudflare-workers directory:
```bash
cd cloudflare-workers
```
3. Install dependencies:
```bash
npm install
```
4. Configure your database (see Database Configuration section)
5. Configure your environment variables (see Deployment section for details)

## Database Configuration

Setup Database Configuration
To know more about connecting to your Capella cluster, please follow the [instructions](https://docs.couchbase.com/cloud/get-started/connect.html).

Specifically, you need to do the following:

1. Create [database credentials](https://docs.couchbase.com/cloud/clusters/manage-database-users.html) to access the travel-sample bucket (Read and Write) used in the application.
2. [Allow access](https://docs.couchbase.com/cloud/clusters/allow-ip-address.html) to the Cluster from the IP on which the application is running.

## FTS Index Setup

Before using the hotel search functionality, you need to create a Full Text Search index. A script is provided to create the required geo-spatial FTS index:

### Using the FTS Index Creation Script

1. Set your environment variables:
```bash
export DATA_API_USERNAME="your_username"
export DATA_API_PASSWORD="your_password"
export DATA_API_ENDPOINT="your_endpoint"
```

2. Run the script to create the FTS index:
```bash
./scripts/create-fts-index.sh
```

This script creates a geo-spatial FTS index called `hotel-geo-index` that enables proximity searches on hotel documents. The index must be created before using the hotel search functionality.

**Note:** The index creation is a one-time setup process. Once created, the index will be built in the background and will be ready for use with the hotel search endpoint.

## Development

Start the development server:
```bash
npm run dev
```

## Testing

This project includes comprehensive unit tests for all handler functions using [Vitest](https://vitest.dev/) and the [@cloudflare/vitest-pool-workers](https://developers.cloudflare.com/workers/testing/vitest-integration/) testing framework.

### Running Tests

Run all tests:
```bash
npm run test
```

Run specific test categories:
```bash
# Run only handler tests
npm run test:handlers

# Run a specific test file
npm test test/handlers/getHotelsNearAirport.spec.ts
```

## Deployment

### Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/) with verified email
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed

### Authentication

```bash
wrangler login
```

### Environment Variables

Set your Couchbase Data API credentials using one of these methods:

**Option 1: Cloudflare Dashboard (Recommended)**
1. Deploy first: `npm run deploy`
2. Go to [Workers Dashboard](https://dash.cloudflare.com/) → Your Worker → Settings → Environment Variables
3. Add: `DATA_API_USERNAME`, `DATA_API_PASSWORD`, `DATA_API_ENDPOINT` as secrets

**Option 2: CLI Secrets**
```bash
wrangler secret put DATA_API_USERNAME
wrangler secret put DATA_API_PASSWORD
wrangler secret put DATA_API_ENDPOINT
```

**Option 3: wrangler.jsonc (Development only)**
```json
{
  "vars": {
    "DATA_API_USERNAME": "your_username",
    "DATA_API_PASSWORD": "your_password",
    "DATA_API_ENDPOINT": "your_endpoint"
  }
}
```

### Deploy

```bash
npm run deploy
```

## API Examples

### Get an airport
```bash
curl https://your-worker.your-subdomain.workers.dev/airports/airport_1254
```

### Create an airport
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/airports/airport_new \
  -H "Content-Type: application/json" \
  -d '{"airportname": "Test Airport", "city": "Test City", "country": "Test Country", "faa": "TST", "geo": {"alt": 100, "lat": 34.0522, "lon": -118.2437}, "icao": "KTST", "id": 9999, "type": "airport", "tz": "America/Los_Angeles"}'
```

### Update an airport
```bash
curl -X PUT https://your-worker.your-subdomain.workers.dev/airports/airport_1254 \
  -H "Content-Type: application/json" \
  -d '{"airportname": "Updated Airport", "city": "Updated City", "country": "Updated Country", "faa": "UPD", "geo": {"alt": 200, "lat": 35.0522, "lon": -119.2437}, "icao": "KUPD", "id": 1254, "type": "airport", "tz": "America/Los_Angeles"}'
```

### Delete an airport
```bash
curl -X DELETE https://your-worker.your-subdomain.workers.dev/airports/airport_1254
```

### Find routes for an airport
```bash
curl https://your-worker.your-subdomain.workers.dev/airports/LAX/routes
```

### Find airlines for an airport
```bash
curl https://your-worker.your-subdomain.workers.dev/airports/LAX/airlines
```

### Find hotels near an airport with specific distance
```bash
curl "https://your-worker.your-subdomain.workers.dev/airports/airport_1254/hotels/nearby/50km"
```

**Path Parameters:**
- `airport_id`: Airport document ID (required) - e.g., airport_1254, airport_1255
- `distance`: Search radius (required) - e.g., 50km, 10km

**Prerequisites:** Make sure you have created the FTS index using the provided script before using this endpoint.

## Project Structure

```
scripts/               # Utility scripts
└── create-fts-index.sh # Script to create FTS index for hotel search
src/
├── handlers/          # API route handlers
│   ├── createAirport.ts
│   ├── getAirport.ts
│   ├── updateAirport.ts
│   ├── deleteAirport.ts
│   ├── getAirportRoutes.ts
│   ├── getAirportAirlines.ts
│   └── getHotelsNearAirport.ts
├── types/             # TypeScript type definitions
│   ├── airport.ts
│   ├── hotel.ts
│   └── env.ts
├── utils/             # Utility functions
└── index.ts           # Main application entry point
test/
├── handlers/          # Handler unit tests
│   ├── createAirport.spec.ts
│   ├── getAirport.spec.ts
│   ├── updateAirport.spec.ts
│   ├── deleteAirport.spec.ts
│   ├── getAirportRoutes.spec.ts
│   ├── getAirportAirlines.spec.ts
│   └── getHotelsNearAirport.spec.ts
├── utils/             # Test utilities and helpers
│   └── testHelpers.ts
└── setup.ts           # Test setup configuration
```

## License

Apache 2.0 