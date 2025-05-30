# Cloudflare Workers API for Couchbase

This project demonstrates how to build a Cloudflare Workers-based API using the **Hono framework** that interfaces with Couchbase's Data API to manage airport data from the travel-sample dataset.

## Overview

The API provides a comprehensive Airport Information System that manages airport data and provides related travel information from the Couchbase travel-sample dataset:

### Airport Management (CRUD Operations)
- `GET /airports/{document_key}` - Retrieve an airport document
- `POST /airports/{document_key}` - Create a new airport document
- `PUT /airports/{document_key}` - Update an existing airport document
- `DELETE /airports/{document_key}` - Delete an airport document

### Airport Information Queries
- `POST /airports/routes` - Find routes for a specific airport
- `POST /airports/airlines` - Find airlines that service a specific airport

### Full Text Search (FTS) Features
- `POST /fts/index/create` - Create FTS index for hotel geo-spatial search
- `POST /airports/hotels/nearby` - Find hotels near a specific airport using geo-spatial FTS

**Note:** The FTS features require:
1. A Full Text Search index with geo-spatial mapping on hotel documents
2. The travel-sample dataset with hotel documents in the `inventory.hotel` collection
3. Hotels must have geo coordinates (`geo.lat` and `geo.lon` fields) for proximity search

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- Couchbase Server with Data API enabled
- Couchbase travel-sample bucket loaded

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
4. Configure your environment variables in `wrangler.jsonc` or through Cloudflare dashboard:
```json
{
  "vars": {
    "DATA_API_USERNAME": "your_username",
    "DATA_API_PASSWORD": "your_password", 
    "DATA_API_ENDPOINT": "your_endpoint"
  }
}
```

## Development

Start the development server:
```bash
npm run dev
```

## Deployment

Deploy to Cloudflare Workers:
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
curl -X POST https://your-worker.your-subdomain.workers.dev/airports/routes \
  -H "Content-Type: application/json" \
  -d '{"airportCode": "LAX"}'
```

### Find airlines for an airport
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/airports/airlines \
  -H "Content-Type: application/json" \
  -d '{"airportCode": "LAX"}'
```

### Create FTS index for hotel search
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/fts/index/create \
  -H "Content-Type: application/json"
```

**Note:** This endpoint creates a geo-spatial FTS index called `hotel-geo-index` that enables proximity searches on hotel documents. The index must be created before using the hotel search functionality.

### Find hotels near an airport
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/airports/hotels/nearby \
  -H "Content-Type: application/json" \
  -d '{"airportCode": "SFO", "distance": "10km"}'
```

**Parameters:**
- `airportCode`: FAA or ICAO code for the airport (required)
- `distance`: Search radius (optional, default: "5km")

## Project Structure

```
src/
├── handlers/          # API route handlers
│   ├── createAirport.ts
│   ├── getAirport.ts
│   ├── updateAirport.ts
│   ├── deleteAirport.ts
│   ├── getAirportRoutes.ts
│   ├── getAirportAirlines.ts
│   ├── createFTSIndex.ts
│   └── getHotelsNearAirport.ts
├── types/             # TypeScript type definitions
│   ├── airport.ts
│   ├── hotel.ts
│   └── env.ts
├── utils/             # Utility functions
└── index.ts           # Main application entry point
```

## License

Apache 2.0 