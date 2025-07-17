# Serverless Framework API for Couchbase

This project demonstrates how to build a Serverless Framework-based API that interfaces with Couchbase's Data API to manage airport data from the travel-sample dataset.

**Note:** The FTS features require:
1. A Full Text Search index with geo-spatial mapping on hotel documents
2. The travel-sample dataset with hotel documents in the `inventory.hotel` collection
3. Hotels must have geo coordinates (`geo.lat` and `geo.lon` fields) for proximity search

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Serverless Framework](https://www.serverless.com/) installed globally
- [AWS CLI](https://aws.amazon.com/cli/) configured
- [Couchbase Capella](https://www.couchbase.com/products/capella/) cluster with Data API enabled
- Couchbase [travel-sample](https://docs.couchbase.com/dotnet-sdk/current/ref/travel-app-data-model.html) bucket loaded

## Setup

1. Clone the repository
2. Navigate to the serverless-framework directory:
```bash
cd serverless-framework
```
3. Install Serverless Framework globally:
```bash
npm install -g serverless
```
4. Install dependencies:
```bash
npm install
```
5. Configure your database (see [Database Configuration](../README.md#database-configuration) in the main README)

6. Configure your environment variables:
   Create a `.env` file with your Couchbase credentials:
   ```
   DATA_API_ENDPOINT=https://your-cluster.cloud.couchbase.com
   DATA_API_USERNAME=your-database-username
   DATA_API_PASSWORD=your-database-password
   ```
7. Configure AWS credentials:
   ```bash
   aws configure
   ```

## FTS Index Setup

Before using the hotel search functionality, you need to create a Full Text Search index. Use the Node.js script provided in the root of the repository.

See [../scripts/README.md](../scripts/README.md) for detailed instructions on creating the required `hotel-geo-index` for geo-spatial hotel searches.

## Development

Run the API locally:
```bash
npm run offline
```

The API will be available at `http://localhost:3000`

## Testing

### Integration Testing

This project includes integration tests that validate the API against your deployed endpoints.

Run integration tests against your deployed API:

```bash
# Set the API base URL environment variable
export API_BASE_URL="https://your-api-id.execute-api.us-east-1.amazonaws.com"

# Run the tests
npm run test
```

**Getting your API URL:**

After deployment, get your API URL from:
```bash
npx serverless info
```

Look for the `endpoints:` section and copy the base URL from any endpoint (e.g., `https://8id6ofste2.execute-api.us-east-1.amazonaws.com`).


## Deployment

### Prerequisites

- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- [Serverless Framework](https://www.serverless.com/) installed globally

### Deploy

Deploy the API:
```bash
# Deploy to default stage (dev)
npm run deploy

# Deploy to specific stage
npm run deploy:dev
npm run deploy:prod
```


## Project Structure

```
src/
├── handlers/          # Lambda function handlers
│   ├── createAirport.js
│   ├── getAirport.js
│   ├── updateAirport.js
│   ├── deleteAirport.js
│   ├── getAirportRoutes.js
│   ├── getAirportAirlines.js
│   └── getHotelsNearAirport.js
├── utils/             # Utility functions
│   └── couchbaseApi.js
test/                  # Integration tests
├── airport.test.js
└── utils/
    └── testHelpers.js
serverless.yml         # Serverless Framework configuration
package.json          # Dependencies and scripts
```

## Cleanup

Remove the deployed stack:
```bash
npm run remove
```