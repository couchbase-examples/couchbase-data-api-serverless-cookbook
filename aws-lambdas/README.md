# AWS Lambda API for Couchbase

This project demonstrates how to build a serverless API using **AWS Lambda and API Gateway** that interfaces with Couchbase's Data API to manage airport data from the travel-sample dataset.

Note: The FTS features require:
1. A Full Text Search index with geo-spatial mapping on hotel documents
2. The travel-sample dataset with hotel documents in the inventory.hotel collection
3. Hotels must have geo coordinates (`geo.lat` and `geo.lon` fields) for proximity search

## Prerequisites

- [Node.js](https://nodejs.org/) (v22.x or later)
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- [AWS IAM Role](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles.html) with Lambda and API Gateway permissions
- [Couchbase Capella](https://www.couchbase.com/products/capella/) cluster with Data API enabled
- Couchbase [travel-sample bucket](https://docs.couchbase.com/dotnet-sdk/current/ref/travel-app-data-model.html) loaded

## Setup

1. Clone the repository
    ```
    git clone https://github.com/couchbase-examples/couchbase-data-api-serverless-cookbook.git
    ```
2. Navigate to the aws-lambdas directory:
    ```bash
    cd couchbase-data-api-serverless-cookbook/aws-lambdas
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
   TIMEOUT=3

   # Cluster Credentials
   BASE_URL=<capella-data-api-endpoint>
   CLUSTER_PASSWORD=<capella-cluster-password>
   USERNAME=<capella-cluster-username>
   ```

## FTS Index Setup

Before using the hotel search functionality, you need to create a Full Text Search index. Use the Node.js script provided in the root of the repository.

See [../scripts/README.md](../scripts/README.md) for detailed instructions on creating the required `hotel-geo-index` for geo-spatial hotel searches.

## Testing

### Local Testing

Run the local test suite:
```bash
npm run test-airport-api-local
```

### API Gateway Integration Testing

The integration tests will automatically discover your API Gateway endpoint and test all API operations through it:

```bash
npm run test-airport-api-aws
```

This will:
- Automatically find your API Gateway endpoint
- Test all API operations end-to-end
- Verify response formats and status codes
- Test error handling and edge cases

## Deployment

### Authentication

Before deploying, ensure your AWS CLI is properly authenticated. 

**Note:** This guide uses **IAM user long-term credentials** with `aws configure` as it's the easiest method to get started. However, [AWS does not recommend this approach](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-authentication.html) for production environments due to security considerations. For production deployments, consider using [IAM Identity Center short-term credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html) or other more secure authentication methods.

#### Setup with AWS Configure
```bash
aws configure
```
This will prompt you for:
- AWS Access Key ID
- AWS Secret Access Key  
- Default region name
- Default output format (json recommended)

For detailed instructions on creating IAM users and access keys, see the [AWS documentation](https://docs.aws.amazon.com/cli/latest/userguide/cli-authentication-user.html).

### Deploy Lambda Functions

Run the deployment script:
```bash
npm run deploy-airport-lambdas
```

This script will:
1. Create zip files for each Lambda function
2. Deploy the functions to AWS Lambda
3. Configure environment variables and runtime settings

### Deploy API Gateway

Run the API Gateway deployment script:
```bash
npm run deploy-airport-api
```

This script will:
1. Create a new HTTP API Gateway
2. Set up Lambda integrations
3. Configure routes and CORS settings
4. Create a default stage
5. Output the API endpoint URL

## Project Structure

Here's the structure of the aws-lambdas directory containing Lambda functions, deployment scripts, and tests:

```
aws-lambdas/
├── package.json                          # Dependencies and command definitions
├── README.md                             
├── scripts/                              # Deployment automation
│   ├── deploy_airport_lambda_functions.mjs
│   └── deploy_api_gateway_with_integrations.mjs
├── src/                                  # Lambda function handlers
│   ├── createAirport.mjs
│   ├── deleteAirport.mjs
│   ├── getAirport.mjs
│   ├── getAirportAirlines.mjs
│   ├── getAirportRoutes.mjs
│   ├── getHotelsNearAirport.mjs
│   └── updateAirport.mjs
└── tests/                                # Test suites
    ├── integration.test.mjs
    └── unit.test.mjs
```
