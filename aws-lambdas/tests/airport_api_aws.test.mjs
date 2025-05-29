import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import assert from 'assert';

// AWS Lambda configuration
const REGION = process.env.REGION;
const lambda = new LambdaClient({ region: REGION });

// Function names
const FUNCTIONS = {
    createAirport: 'data-api-createAirport',
    getAirport: 'data-api-getAirport',
    updateAirport: 'data-api-updateAirport',
    deleteAirport: 'data-api-deleteAirport',
    getAirportRoutes: 'data-api-getAirportRoutes',
    getAirportAirlines: 'data-api-getAirportAirlines'
};

// Test data
const TEST_AIRPORT = {
    airportname: "Test Airport",
    city: "Test City",
    country: "Test Country",
    faa: "TST",
    geo: {
        alt: 100,
        lat: 34.0522,
        lon: -118.2437
    },
    icao: "KTST",
    id: "test_airport_1",
    type: "airport",
    tz: "America/Los_Angeles"
};

// Validate environment variables
if (!REGION) {
    console.error('Missing required environment variable: REGION');
    process.exit(1);
}

async function invokeLambda(functionName, event = {}) {
    const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify({
            ...event,
            // Add API Gateway event structure
            requestContext: {
                http: {
                    method: event.httpMethod || 'GET'
                }
            }
        }),
        InvocationType: 'RequestResponse'
    });

    try {
        const response = await lambda.send(command);
        
        // Check for Lambda execution errors
        if (response.FunctionError) {
            const error = JSON.parse(Buffer.from(response.Payload).toString());
            console.error('Lambda execution error:', error);
            throw new Error(error.errorMessage);
        }

        const result = JSON.parse(Buffer.from(response.Payload).toString());
        return result;
    } catch (error) {
        console.error(`Error invoking ${functionName}:`, error);
        throw error;
    }
}

async function runTests() {
    console.log('Starting AWS Lambda tests...\n');
    let etag = null;

    try {
        // Test Create Airport Lambda
        console.log('Testing Create Airport Lambda function...');
        const createResult = await invokeLambda(FUNCTIONS.createAirport, {
            httpMethod: 'POST',
            pathParameters: {
                airportId: TEST_AIRPORT.id
            },
            body: JSON.stringify(TEST_AIRPORT)
        });
        console.log('Create Response:', createResult);
        assert.strictEqual(createResult.statusCode, 200, 'Create should return 200');
        assert.ok(createResult.headers['ETag'], 'Create should return an ETag');
        assert.ok(createResult.headers['X-CB-MutationToken'], 'Create should return a mutation token');
        console.log('✓ Create Airport Lambda test passed\n');

        // Save ETag for subsequent operations
        etag = createResult.headers['ETag'];

        // Test Get Airport Lambda
        console.log('Testing Get Airport Lambda function...');
        const getResult = await invokeLambda(FUNCTIONS.getAirport, {
            httpMethod: 'GET',
            pathParameters: {
                airportId: TEST_AIRPORT.id
            }
        });
        console.log('Get Response:', getResult);
        assert.strictEqual(getResult.statusCode, 200, 'Get should return 200');
        assert.ok(getResult.headers['ETag'], 'Get should return an ETag');
        const getData = JSON.parse(getResult.body);
        assert.strictEqual(getData.type, 'airport', 'Document should be of type airport');
        assert.strictEqual(getData.id, TEST_AIRPORT.id, 'Document should have correct ID');
        console.log('✓ Get Airport Lambda test passed\n');

        // Test Update Airport Lambda
        console.log('Testing Update Airport Lambda function...');
        const updatedAirport = {
            ...TEST_AIRPORT,
            airportname: "Updated Test Airport",
            city: "Updated Test City"
        };
        const updateResult = await invokeLambda(FUNCTIONS.updateAirport, {
            httpMethod: 'PUT',
            pathParameters: {
                airportId: TEST_AIRPORT.id
            },
            headers: {
                'If-Match': etag
            },
            body: JSON.stringify(updatedAirport)
        });
        console.log('Update Response:', updateResult);
        assert.strictEqual(updateResult.statusCode, 200, 'Update should return 200');
        assert.ok(updateResult.headers['ETag'], 'Update should return an ETag');
        assert.ok(updateResult.headers['X-CB-MutationToken'], 'Update should return a mutation token');
        console.log('✓ Update Airport Lambda test passed\n');

        // Test Get Airport Routes Lambda
        console.log('Testing Get Airport Routes Lambda function...');
        const routesResult = await invokeLambda(FUNCTIONS.getAirportRoutes, {
            httpMethod: 'POST',
            body: JSON.stringify({
                airportCode: 'SFO'
            })
        });
        console.log('Routes Response:', routesResult);
        assert.strictEqual(routesResult.statusCode, 200, 'Get Routes should return 200');
        const routesData = JSON.parse(routesResult.body);
        assert.ok(Array.isArray(routesData.routes), 'Response should include routes array');
        assert.ok(routesData.metadata, 'Response should include metadata');
        console.log('✓ Get Airport Routes Lambda test passed\n');

        // Test Get Airport Airlines Lambda
        console.log('Testing Get Airport Airlines Lambda function...');
        const airlinesResult = await invokeLambda(FUNCTIONS.getAirportAirlines, {
            httpMethod: 'POST',
            body: JSON.stringify({
                airportCode: 'SFO'
            })
        });
        console.log('Airlines Response:', airlinesResult);
        assert.strictEqual(airlinesResult.statusCode, 200, 'Get Airlines should return 200');
        const airlinesData = JSON.parse(airlinesResult.body);
        assert.ok(Array.isArray(airlinesData.airlines), 'Response should include airlines array');
        assert.ok(airlinesData.metadata, 'Response should include metadata');
        console.log('✓ Get Airport Airlines Lambda test passed\n');

        // Test Delete Airport Lambda
        console.log('Testing Delete Airport Lambda function...');
        const deleteResult = await invokeLambda(FUNCTIONS.deleteAirport, {
            httpMethod: 'DELETE',
            pathParameters: {
                airportId: TEST_AIRPORT.id
            },
            headers: {
                'If-Match': updateResult.headers['ETag']
            }
        });
        console.log('Delete Response:', deleteResult);
        assert.strictEqual(deleteResult.statusCode, 200, 'Delete should return 200');
        assert.ok(deleteResult.headers['X-CB-MutationToken'], 'Delete should return a mutation token');
        console.log('✓ Delete Airport Lambda test passed\n');

        // Verify Delete by attempting Get
        console.log('Verifying Delete operation...');
        const verifyDelete = await invokeLambda(FUNCTIONS.getAirport, {
            httpMethod: 'GET',
            pathParameters: {
                airportId: TEST_AIRPORT.id
            }
        });
        console.log('Verify Delete Response:', verifyDelete);
        assert.strictEqual(verifyDelete.statusCode, 404, 'Get after Delete should return 404');
        console.log('✓ Delete verification passed\n');

        console.log('All AWS Lambda tests passed! 🎉');

    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

// Run the tests
runTests(); 