import { execSync } from 'child_process';

// Configuration
const REGION = process.env.REGION;
const API_NAME = 'airport-data-api';

// Route configurations matching the Lambda functions
const ROUTES = [
    { path: '/airports/{airportId}', method: 'GET', function: 'data-api-getAirport' },
    { path: '/airports/{airportId}', method: 'POST', function: 'data-api-createAirport' },
    { path: '/airports/{airportId}', method: 'PUT', function: 'data-api-updateAirport' },
    { path: '/airports/{airportId}', method: 'DELETE', function: 'data-api-deleteAirport' },
    { path: '/airports/routes', method: 'POST', function: 'data-api-getAirportRoutes' },
    { path: '/airports/airlines', method: 'POST', function: 'data-api-getAirportAirlines' }
];

function executeCommand(cmd) {
    try {
        const output = execSync(cmd, { encoding: 'utf-8' });
        return output.trim();
    } catch (error) {
        console.error('Error executing command:', error);
        throw error;
    }
}

function createApiGateway() {
    console.log('Creating API Gateway...');
    const cmd = `aws apigatewayv2 create-api \
        --name ${API_NAME} \
        --protocol-type HTTP \
        --region ${REGION} \
        --cors-configuration AllowOrigins="*",AllowMethods="GET,POST,PUT,DELETE,OPTIONS",AllowHeaders="*" \
        --query 'ApiId' \
        --output text`;
    
    return executeCommand(cmd);
}

function getLambdaArn(functionName) {
    console.log(`Getting ARN for Lambda function: ${functionName}`);
    const cmd = `aws lambda get-function \
        --function-name ${functionName} \
        --region ${REGION} \
        --query 'Configuration.FunctionArn' \
        --output text`;
    
    return executeCommand(cmd);
}

function createIntegration(apiId, lambdaArn) {
    console.log(`Creating integration for Lambda: ${lambdaArn}`);
    const cmd = `aws apigatewayv2 create-integration \
        --api-id ${apiId} \
        --integration-type AWS_PROXY \
        --integration-uri ${lambdaArn} \
        --payload-format-version "2.0" \
        --region ${REGION} \
        --query 'IntegrationId' \
        --output text`;
    
    return executeCommand(cmd);
}

function addLambdaPermission(functionName, apiId, statementId) {
    console.log(`Adding permission for Lambda: ${functionName}`);
    const cmd = `aws lambda add-permission \
        --function-name ${functionName} \
        --statement-id "apigateway-invoke-${statementId}" \
        --action lambda:InvokeFunction \
        --principal apigateway.amazonaws.com \
        --source-arn "arn:aws:apigateway:${REGION}::/apis/${apiId}" \
        --region ${REGION}`;
    
    executeCommand(cmd);
}

function createRoute(apiId, method, path, integrationId) {
    console.log(`Creating route: ${method} ${path}`);
    const routeKey = `${method} ${path}`;
    const cmd = `aws apigatewayv2 create-route \
        --api-id ${apiId} \
        --route-key "${routeKey}" \
        --target "integrations/${integrationId}" \
        --region ${REGION}`;
    
    executeCommand(cmd);
}

function createDefaultStage(apiId) {
    console.log('Creating default stage...');
    const cmd = `aws apigatewayv2 create-stage \
        --api-id ${apiId} \
        --stage-name '$default' \
        --auto-deploy \
        --region ${REGION}`;
    
    executeCommand(cmd);
}

function getApiEndpoint(apiId) {
    console.log('Getting API endpoint...');
    const cmd = `aws apigatewayv2 get-api \
        --api-id ${apiId} \
        --region ${REGION} \
        --query 'ApiEndpoint' \
        --output text`;
    
    return executeCommand(cmd);
}

function main() {
    try {
        // Create API Gateway
        const apiId = createApiGateway();
        console.log('API Gateway created with ID:', apiId);

        // Create integrations and routes for each Lambda function
        const integrations = new Map();
        
        for (const route of ROUTES) {
            // Only create integration if we haven't already created one for this function
            if (!integrations.has(route.function)) {
                const lambdaArn = getLambdaArn(route.function);
                const integrationId = createIntegration(apiId, lambdaArn);
                integrations.set(route.function, integrationId);
                
                // Add Lambda permission
                addLambdaPermission(route.function, apiId, integrationId);
            }
            
            // Create route
            const integrationId = integrations.get(route.function);
            createRoute(apiId, route.method, route.path, integrationId);
        }

        // Create default stage
        createDefaultStage(apiId);

        // Get and display the API endpoint
        const endpoint = getApiEndpoint(apiId);
        console.log('\nAPI Gateway setup complete!');
        console.log('API Endpoint:', endpoint);

    } catch (error) {
        console.error('Error in main process:', error);
        process.exit(1);
    }
}

// Validate required environment variables
if (!process.env.REGION) {
    console.error('Missing required environment variable: REGION');
    process.exit(1);
}

main(); 