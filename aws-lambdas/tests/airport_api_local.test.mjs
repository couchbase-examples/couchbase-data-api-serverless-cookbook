import assert from 'assert';
import { handler as createAirportHandler } from '../src/createAirport.mjs';
import { handler as getAirportHandler } from '../src/getAirport.mjs';
import { handler as updateAirportHandler } from '../src/updateAirport.mjs';
import { handler as deleteAirportHandler } from '../src/deleteAirport.mjs';
import { handler as getAirportRoutesHandler } from '../src/getAirportRoutes.mjs';
import { handler as getAirportAirlinesHandler } from '../src/getAirportAirlines.mjs';
import { handler as getHotelsNearAirportHandler } from '../src/getHotelsNearAirport.mjs';

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
        assert.ok(createResult.headers['etag'], 'Create should return an ETag');
        assert.ok(createResult.headers['x-cb-mutationtoken'], 'Create should return a mutation token');
        console.log('✓ Create Airport test passed\n');

        // Save ETag for subsequent operations
        etag = createResult.headers['etag'];

        // Test Get Airport
        console.log('Testing Get Airport operation...');
        const getResult = await getAirportHandler({
            pathParameters: {
                airportId: TEST_AIRPORT.id
            }
        });
        assert.strictEqual(getResult.statusCode, 200, 'Get should return 200');
        assert.ok(getResult.headers['etag'], 'Get should return an ETag');
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
        assert.ok(updateResult.headers['etag'], 'Update should return an ETag');
        assert.ok(updateResult.headers['x-cb-mutationtoken'], 'Update should return a mutation token');
        console.log('✓ Update Airport test passed\n');

        // Test Get Airport Routes
        console.log('Testing Get Airport Routes operation...');
        const routesResult = await getAirportRoutesHandler({
            queryStringParameters: {
                airportCode: 'SFO'
            }
        });
        assert.strictEqual(routesResult.statusCode, 200, 'Get Routes should return 200');
        const routesData = JSON.parse(routesResult.body);
        assert.ok(Array.isArray(routesData.routes), 'Response should include routes array');
        assert.ok(routesData.metadata, 'Response should include metadata');
        console.log('✓ Get Airport Routes test passed\n');

        // Test Get Airport Airlines
        console.log('Testing Get Airport Airlines operation...');
        const airlinesResult = await getAirportAirlinesHandler({
            queryStringParameters: {
                airportCode: 'SFO'
            }
        });
        assert.strictEqual(airlinesResult.statusCode, 200, 'Get Airlines should return 200');
        const airlinesData = JSON.parse(airlinesResult.body);
        assert.ok(Array.isArray(airlinesData.airlines), 'Response should include airlines array');
        assert.ok(airlinesData.metadata, 'Response should include metadata');
        console.log('✓ Get Airport Airlines test passed\n');

        // Test Get Hotels Near Airport
        console.log('Testing Get Hotels Near Airport operation...');
        const hotelsResult = await getHotelsNearAirportHandler({
            queryStringParameters: {
                airportId: 'airport_1254',
                distance: '10km'
            }
        });
        assert.strictEqual(hotelsResult.statusCode, 200, 'Get Hotels should return 200');
        const hotelsData = JSON.parse(hotelsResult.body);
        assert.ok(hotelsData.airport, 'Response should include airport details');
        assert.ok(Array.isArray(hotelsData.hotels), 'Response should include hotels array');
        assert.ok(hotelsData.total_hotels_found >= 0, 'Response should include total_hotels_found');
        assert.ok(hotelsData.search_criteria.distance, 'Response should include search criteria');
        console.log('✓ Get Hotels Near Airport test passed\n');

        // Test Delete Airport
        console.log('Testing Delete Airport operation...');
        const deleteResult = await deleteAirportHandler({
            pathParameters: {
                airportId: TEST_AIRPORT.id
            },
            headers: {
                'If-Match': updateResult.headers['etag']
            }
        });
        assert.strictEqual(deleteResult.statusCode, 200, 'Delete should return 200');
        assert.ok(deleteResult.headers['x-cb-mutationtoken'], 'Delete should return a mutation token');
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