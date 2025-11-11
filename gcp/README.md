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
- [Couchbase Capella](https://www.couchbase.com/products/capella/) cluster with [Data API enabled](https://docs.couchbase.com/cloud/data-api-guide/data-api-start.html#enable-the-data-api).
- Couchbase [travel-sample](https://docs.couchbase.com/cloud/clusters/data-service/import-data-documents.html) bucket loaded.

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
   MEMORY=256Mi
   TIMEOUT=120s
   RUNTIME=nodejs22

   # Cluster Credentials
   DATA_API_ENDPOINT=<capella-data-api-endpoint>
   DATA_API_USERNAME=<capella-cluster-username>
   DATA_API_PASSWORD=<capella-cluster-password>
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

Note: The API gateway deployment usually takes a few minutes to complete.

This script will:
1. Create a new API Gateway
2. Set up Cloud Function integrations
3. Create a gateway and output the API endpoint URL

#### Important: API Gateway Permissions

If you encounter `403 Forbidden` errors when testing the API endpoints, grant the default Compute Engine service account permission to invoke Cloud Run. In this setup, API Gateway uses that identity under the hood, and this is required because Cloud Functions are deployed with authentication enabled by default

**Grant the required permission:**

```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

# Grant Cloud Run Invoker role to the Compute Engine default service account
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/run.invoker"
```

**Alternative method - if you know your project number:**
```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
    --role="roles/run.invoker"
```

You can find your project number in the [Google Cloud Console](https://console.cloud.google.com) project settings or by running:
```bash
gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)"
```

## Testing

### Integration Testing

The integration tests will automatically discover your API Gateway endpoint and test all API operations through it:
```bash
npm run test
```


