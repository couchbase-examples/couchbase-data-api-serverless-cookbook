# Azure Functions API for Couchbase

This project demonstrates how to build an Azure Functions-based API that interfaces with Couchbase's Data API to manage airport data from the travel-sample dataset.

**Note:** The FTS features require:
1. A Full Text Search index with geo-spatial mapping on hotel documents
2. The travel-sample dataset with hotel documents in the `inventory.hotel` collection
3. Hotels must have geo coordinates (`geo.lat` and `geo.lon` fields) for proximity search

## Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or later)
- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/) configured with appropriate credentials
- [Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local) (v4.x)
- Azure subscription with Functions and API Management permissions
- [Couchbase Capella](https://www.couchbase.com/products/capella/) cluster with [Data API enabled](https://docs.couchbase.com/cloud/data-api-guide/data-api-start.html#enable-the-data-api)
- Couchbase [travel-sample](https://docs.couchbase.com/cloud/clusters/data-service/import-data-documents.html) bucket loaded

## Setup

1. Clone the repository
2. Navigate to the azure-functions directory:
```bash
cd azure-functions
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

### Local Configuration

For local development, you only need to configure Couchbase credentials in `local.settings.json`:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "DATA_API_ENDPOINT": "https://your-capella-data-api-endpoint",
    "DATA_API_USERNAME": "your-capella-cluster-username",
    "DATA_API_PASSWORD": "your-capella-cluster-password"
  }
}
```

**Note:** For local development, you only need the Couchbase credentials. Azure deployment settings are not required for local testing.

Start the development server:
```bash
npm start
```

## Deployment

### Prerequisites

- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/) installed and configured
- Azure subscription with Functions and API Management permissions

### Authentication

```bash
az login
```

### Environment Variables

**For Deployment Scripts (Azure settings):**

Configure these in your `local.settings.json` for deployment automation:

```json
{
  "IsEncrypted": false,
  "Values": {
    "SUBSCRIPTION_ID": "your-azure-subscription-id",
    "RESOURCE_GROUP": "your-resource-group-name",
    "AZURE_LOCATION": "eastus",
    "STORAGE_ACCOUNT": "your-storage-account-name",
    "FUNCTION_APP": "your-function-app-name",
    "APIM_NAME": "your-apim-name"
  }
}
```

**Important:** Azure resource names must be globally unique across the entire Azure platform. Use unique names or add timestamps to avoid conflicts.


**Note:** Couchbase credentials are automatically configured during deployment from your `local.settings.json` file.

### Deploy Functions

```bash
npm run deploy
```

This will:
- Create Azure resources (Resource Group, Storage Account, Function App)
- Deploy your functions to Azure
- **Automatically configure Couchbase credentials** from your `local.settings.json`

### Deploy API Management

For production deployment with API Management:

```bash
npm run deploy-apim
```

The API will be available at `https://{apim-name}.azure-api.net/airports`

## Testing

This project includes comprehensive integration tests that validate all API operations through your APIM gateway.

### Running Tests

Run integration tests:

```bash
# Set your APIM gateway URL
BASE_URL=https://your-apim-name.azure-api.net npm test
```

## Project Structure

```
src/
├── functions/         # Azure Functions handlers
│   ├── createAirport.ts
│   ├── getAirport.ts
│   ├── updateAirport.ts
│   ├── deleteAirport.ts
│   ├── getAirportRoutes.ts
│   ├── getAirportAirlines.ts
│   └── getHotelsNearAirport.ts
├── utils/             # Utility functions
│   ├── config.ts
│   └── errors.ts
tests/
└── integration.test.mjs  # Integration tests
scripts/
├── deploy.mjs         # Functions deployment script
└── deploy-apim.mjs   # API Management deployment script
```