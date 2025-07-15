# GCP Cloud Functions API for Couchbase

This project demonstrates how to build a serverless API using **[GCP Cloud Functions and API Gateway](https://cloud.google.com/api-gateway/docs/get-started-cloud-functions)** that interfaces with Couchbase's Data API to manage airport data from the travel-sample dataset.

**Note:** The FTS features require:
1. A Full Text Search index with geo-spatial mapping on hotel documents
2. The travel-sample dataset with hotel documents in the `inventory.hotel` collection
3. Hotels must have geo coordinates (`geo.lat` and `geo.lon` fields) for proximity search

## Prerequisites

- [Node.js](https://nodejs.org/) (v22.x or later)
- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) configured with appropriate credentials.
- Google Cloud Project with Cloud Functions and API Gateway with [services enabled.](https://cloud.google.com/api-gateway/docs/secure-traffic-gcloud#enabling_required_services)
- [Couchbase Capella](https://www.couchbase.com/products/capella/) cluster with Data API enabled.
- Couchbase [travel-sample](https://docs.couchbase.com/dotnet-sdk/current/ref/travel-app-data-model.html) bucket loaded.

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
    
4. Configure your database (see [Database Configuration](../README.md#database-configuration) in the main README)

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

Note: The API gateway deployment usually takes a few minutes to complete.

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


