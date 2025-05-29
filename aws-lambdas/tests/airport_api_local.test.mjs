import assert from 'assert';
import { handler as createAirportHandler } from '../handlers/createAirport.mjs';
import { handler as getAirportHandler } from '../handlers/getAirport.mjs';
import { handler as updateAirportHandler } from '../handlers/updateAirport.mjs';
import { handler as deleteAirportHandler } from '../handlers/deleteAirport.mjs';
import { handler as getAirportRoutesHandler } from '../handlers/getAirportRoutes.mjs';
import { handler as getAirportAirlinesHandler } from '../handlers/getAirportAirlines.mjs';

// Test configuration
const TEST_CONFIG = {
    BASE_URL: process.env.BASE_URL,
    CLUSTER_PASSWORD: process.env.CLUSTER_PASSWORD,
    USERNAME: process.env.USERNAME
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
const requiredEnvVars = ['BASE_URL', 'CLUSTER_PASSWORD', 'USERNAME'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars.join(', '));
    process.exit(1);
}

async function runTests() {
    console.log('Starting local tests...\n');
    let etag = null;

    try {
        // Test Create Airport
        console.log('Testing Create Airport operation...');
        const createResult = await createAirportHandler({
            pathParameters: {
                airportId: TEST_AIRPORT.id
            },
            body: JSON.stringify(TEST_AIRPORT)
        });
        assert.strictEqual(createResult.statusCode, 200, 'Create should return 200');
        assert.ok(createResult.headers['ETag'], 'Create should return an ETag');
        assert.ok(createResult.headers['X-CB-MutationToken'], 'Create should return a mutation token');
        console.log('✓ Create Airport test passed\n');

        // Save ETag for subsequent operations
        etag = createResult.headers['ETag'];

        // Test Get Airport
        console.log('Testing Get Airport operation...');
        const getResult = await getAirportHandler({
            pathParameters: {
                airportId: TEST_AIRPORT.id
            }
        });
        assert.strictEqual(getResult.statusCode, 200, 'Get should return 200');
        assert.ok(getResult.headers['ETag'], 'Get should return an ETag');
        const getData = JSON.parse(getResult.body);
        assert.strictEqual(getData.type, 'airport', 'Document should be of type airport');
        assert.strictEqual(getData.id, TEST_AIRPORT.id, 'Document should have correct ID');
        console.log('✓ Get Airport test passed\n');

        // Test Update Airport
        console.log('Testing Update Airport operation...');
        const updatedAirport = {
            ...TEST_AIRPORT,
            airportname: "Updated Test Airport",
            city: "Updated Test City"
        };
        const updateResult = await updateAirportHandler({
            pathParameters: {
                airportId: TEST_AIRPORT.id
            },
            headers: {
                'If-Match': etag
            },
            body: JSON.stringify(updatedAirport)
        });
        assert.strictEqual(updateResult.statusCode, 200, 'Update should return 200');
        assert.ok(updateResult.headers['ETag'], 'Update should return an ETag');
        assert.ok(updateResult.headers['X-CB-MutationToken'], 'Update should return a mutation token');
        console.log('✓ Update Airport test passed\n');

        // Test Get Airport Routes
        console.log('Testing Get Airport Routes operation...');
        const routesResult = await getAirportRoutesHandler({
            body: JSON.stringify({
                airportCode: 'SFO'
            })
        });
        assert.strictEqual(routesResult.statusCode, 200, 'Get Routes should return 200');
        const routesData = JSON.parse(routesResult.body);
        assert.ok(Array.isArray(routesData.routes), 'Response should include routes array');
        assert.ok(routesData.metadata, 'Response should include metadata');
        console.log('✓ Get Airport Routes test passed\n');

        // Test Get Airport Airlines
        console.log('Testing Get Airport Airlines operation...');
        const airlinesResult = await getAirportAirlinesHandler({
            body: JSON.stringify({
                airportCode: 'SFO'
            })
        });
        assert.strictEqual(airlinesResult.statusCode, 200, 'Get Airlines should return 200');
        const airlinesData = JSON.parse(airlinesResult.body);
        assert.ok(Array.isArray(airlinesData.airlines), 'Response should include airlines array');
        assert.ok(airlinesData.metadata, 'Response should include metadata');
        console.log('✓ Get Airport Airlines test passed\n');

        // Test Delete Airport
        console.log('Testing Delete Airport operation...');
        const deleteResult = await deleteAirportHandler({
            pathParameters: {
                airportId: TEST_AIRPORT.id
            },
            headers: {
                'If-Match': updateResult.headers['ETag']
            }
        });
        assert.strictEqual(deleteResult.statusCode, 200, 'Delete should return 200');
        assert.ok(deleteResult.headers['X-CB-MutationToken'], 'Delete should return a mutation token');
        console.log('✓ Delete Airport test passed\n');

        // Verify Delete by attempting Get
        console.log('Verifying Delete operation...');
        const verifyDelete = await getAirportHandler({
            pathParameters: {
                airportId: TEST_AIRPORT.id
            }
        });
        assert.strictEqual(verifyDelete.statusCode, 404, 'Get after Delete should return 404');
        console.log('✓ Delete verification passed\n');

        console.log('All local tests passed! 🎉');

    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

// Run the tests
runTests(); 