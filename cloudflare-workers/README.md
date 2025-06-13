# Cloudflare Workers API for Couchbase

This project demonstrates how to build a Cloudflare Workers-based API using the [**Hono framework**](https://developers.cloudflare.com/workers/frameworks/framework-guides/hono/) that interfaces with Couchbase's Data API to manage airport data from the travel-sample dataset.

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
4. Configure your database (see [Database Configuration](../README.md#database-configuration) in the main README)
5. Configure your environment variables (see [Deployment section](#deployment) for details)



## FTS Index Setup

Before using the hotel search functionality, you need to create a Full Text Search index. Use the Node.js script provided in the root of the repository.

See [../scripts/README.md](../scripts/README.md) for detailed instructions on creating the required `hotel-geo-index` for geo-spatial hotel searches.

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
