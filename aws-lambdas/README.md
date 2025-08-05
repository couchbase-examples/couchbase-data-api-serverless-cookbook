# AWS Lambda API for Couchbase

This project demonstrates how to build a serverless API using **AWS Lambda and API Gateway** that interfaces with Couchbase's Data API to manage airport data from the travel-sample dataset.

Note: The FTS features require:
1. A Full Text Search index with geo-spatial mapping on hotel documents
2. The travel-sample dataset with hotel documents in the inventory.hotel collection
3. Hotels must have geo coordinates (`geo.lat` and `geo.lon` fields) for proximity search

## API Endpoints

Once deployed, the API Gateway will provide the following endpoints:

### Airport Management
- `POST /airports` - Create a new airport
- `GET /airports/{airportId}` - Get airport by ID
- `PUT /airports/{airportId}` - Update an existing airport
- `DELETE /airports/{airportId}` - Delete an airport (returns 204 No Content)

### Airport Queries
- `GET /airports/{airportCode}/routes` - Get all routes for an airport
- `GET /airports/{airportCode}/airlines` - Get all airlines servicing an airport
- `GET /airports/{airportId}/hotels/nearby/{distance}` - Find hotels near an airport

## Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or later)
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- [Serverless Framework](https://www.serverless.com/) installed globally
- [Couchbase Capella](https://www.couchbase.com/products/capella/) cluster with Data API enabled
- Couchbase [travel-sample bucket](https://docs.couchbase.com/dotnet-sdk/current/ref/travel-app-data-model.html) loaded

## Setup

1. **Clone the repository**
    ```bash
    git clone https://github.com/couchbase-examples/couchbase-data-api-serverless-cookbook.git
    ```

2. **Navigate to the aws-lambdas directory**
    ```bash
    cd couchbase-data-api-serverless-cookbook/aws-lambdas
    ```

3. **Install dependencies**
    ```bash
    npm install
    ```

4. **Install Serverless Framework as a dev dependency**
    ```bash
    npm install -d serverless
    ```

5. **Configure environment variables**
   Create a `.env` file in the `aws-lambdas` directory:
   ```bash
   touch .env
   ```
   
   Add your Couchbase Data API credentials and AWS configuration:
   ```
   # Couchbase Data API Configuration
   DATA_API_ENDPOINT=https://your-cluster.cloud.couchbase.com
   DATA_API_USERNAME=your-database-username
   DATA_API_PASSWORD=your-database-password
   
   # AWS Configuration (optional - defaults to ap-south-1)
   AWS_REGION=ap-south-1
   ```

## FTS Index Setup

Before using the hotel search functionality, you need to create a Full Text Search index. Use the Node.js script provided in the root of the repository.

See [../scripts/README.md](../scripts/README.md) for detailed instructions on creating the required `hotel-geo-index` for geo-spatial hotel searches.

## Deployment

This project uses the **Serverless Framework** for deployment, which provides a simple and efficient way to deploy all Lambda functions and API Gateway configuration together.

### Authentication

Before deploying, ensure your AWS CLI is properly authenticated. 

**Note:** This guide uses **IAM user long-term credentials** with `aws configure` as it's the easiest method to get started. However, [AWS does not recommend this approach](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-authentication.html) for production environments due to security considerations. For production deployments, consider using [IAM Identity Center short-term credentials](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html) or other more secure authentication methods.

### Setup with AWS Configure

```bash
aws configure
```

This will prompt you for:
- AWS Access Key ID
- AWS Secret Access Key  
- Default region name
- Default output format (json recommended)

For detailed instructions on creating IAM users and access keys, see the [AWS documentation](https://docs.aws.amazon.com/cli/latest/userguide/cli-authentication-user.html).


### Deploy to AWS

1. **Deploy to default stage (dev)**
   ```bash
   npm run deploy
   ```

2. **Deploy to specific stage**
   ```bash
   # Deploy to dev stage
   npm run deploy:dev
   
   # Deploy to production stage
   npm run deploy:prod
   ```

3. **Deploy to specific region**
   ```bash
   # Option 1: Using command line parameter
   npm run deploy -- --region us-west-2
   
   # Option 2: Using environment variable (set AWS_REGION in .env file)
   npm run deploy
   ```


### Local Development

Run the API locally for development:
```bash
npm run offline
```

## Testing

Run the local test suite:
```bash
npm run test-unit
npm run test-integration
```

## Project Structure

Here's the structure of the aws-lambdas directory:

```
aws-lambdas/
├── package.json                          # Dependencies and npm scripts
├── serverless.yml                        # Serverless Framework configuration
├── README.md                             
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


## License

Apache 2.0
