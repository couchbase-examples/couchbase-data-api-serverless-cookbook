import assert from 'assert';
import { execSync } from 'child_process';

// Configuration
const REGION = process.env.REGION;
let API_ENDPOINT;

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

function executeCommand(cmd) {
    try {
        const output = execSync(cmd, { encoding: 'utf-8' });
        return output.trim();
    } catch (error) {
        console.error('Error executing command:', error);
        throw error;
    }
}

async function getApiEndpoint() {
    try {
        const cmd = `aws apigatewayv2 get-apis \
            --region ${REGION} \
            --query "Items[?Name=='airport-data-api'].ApiEndpoint" \
            --output text`;
        
        const endpoint = executeCommand(cmd);
        if (!endpoint) {
            throw new Error('Could not find airport-data-api');
        }
        
        return endpoint;
    } catch (error) {
        console.error('Failed to get API endpoint:', error);
        throw error;
    }
}

async function makeRequest(method, path, body = null, headers = {}) {
    const url = new URL(path, API_ENDPOINT);
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        console.log(`Making ${method} request to ${url}`);
        if (body) {
            console.log('Request body:', JSON.stringify(body, null, 2));
        }
        if (Object.keys(headers).length > 0) {
            console.log('Request headers:', headers);
        }

        const response = await fetch(url, options);
        let responseData;
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            try {
                responseData = await response.json();
            } catch (e) {
                const textData = await response.text();
                console.error('Failed to parse JSON response:', textData);
                responseData = { error: 'InvalidResponse', message: textData };
            }
        } else {
            const textData = await response.text();
            responseData = { error: 'InvalidResponse', message: textData };
        }
        
        // Log detailed response information for non-200 responses
        if (response.status !== 200) {
            console.error('Request failed with status:', response.status);
            console.error('Response headers:', Object.fromEntries(response.headers.entries()));
            console.error('Response body:', responseData);
        }
        
        return {
            statusCode: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            body: responseData
        };
    } catch (error) {
        console.error(`API request failed: ${method} ${path}`);
        console.error('Error details:', error);
        throw error;
    }
}

async function runTests() {
    console.log('Starting API Gateway Integration Tests...\n');
    
    try {
        // Get API endpoint
        console.log('Getting API Gateway endpoint...');
        API_ENDPOINT = await getApiEndpoint();
        console.log(`Using API endpoint: ${API_ENDPOINT}\n`);
        
        let etag = null;

        // Test Create Airport
        console.log('Testing Create Airport...');
        const createResult = await makeRequest(
            'POST',
            `/airports/${TEST_AIRPORT.id}`,
            TEST_AIRPORT
        );
        assert.strictEqual(createResult.statusCode, 200, 'Create should return 200');
        assert.ok(createResult.headers.etag, 'Create should return an ETag');
        console.log('✓ Create Airport test passed\n');

        // Save ETag for subsequent operations
        etag = createResult.headers.etag;

        // Test Get Airport
        console.log('Testing Get Airport...');
        const getResult = await makeRequest('GET', `/airports/${TEST_AIRPORT.id}`);
        assert.strictEqual(getResult.statusCode, 200, 'Get should return 200');
        assert.ok(getResult.headers.etag, 'Get should return an ETag');
        assert.strictEqual(getResult.body.type, 'airport', 'Document should be of type airport');
        assert.strictEqual(getResult.body.id, TEST_AIRPORT.id, 'Document should have correct ID');
        console.log('✓ Get Airport test passed\n');

        // Test Update Airport
        console.log('Testing Update Airport...');
        const updatedAirport = {
            ...TEST_AIRPORT,
            airportname: "Updated Test Airport",
            city: "Updated Test City"
        };
        const updateResult = await makeRequest(
            'PUT',
            `/airports/${TEST_AIRPORT.id}`,
            updatedAirport,
            { 'If-Match': etag }
        );
        assert.strictEqual(updateResult.statusCode, 200, 'Update should return 200');
        assert.ok(updateResult.headers.etag, 'Update should return an ETag');
        console.log('✓ Update Airport test passed\n');

        // Test Get Airport Routes
        console.log('Testing Get Airport Routes...');
        const routesResult = await makeRequest(
            'GET',
            '/airports/routes?airportCode=SFO'
        );
        assert.strictEqual(routesResult.statusCode, 200, 'Get Routes should return 200');
        assert.ok(Array.isArray(routesResult.body.routes), 'Response should include routes array');
        assert.ok(routesResult.body.metadata, 'Response should include metadata');
        console.log('✓ Get Airport Routes test passed\n');

        // Test Get Airport Airlines
        console.log('Testing Get Airport Airlines...');
        const airlinesResult = await makeRequest(
            'GET',
            '/airports/airlines?airportCode=SFO'
        );
        assert.strictEqual(airlinesResult.statusCode, 200, 'Get Airlines should return 200');
        assert.ok(Array.isArray(airlinesResult.body.airlines), 'Response should include airlines array');
        assert.ok(airlinesResult.body.metadata, 'Response should include metadata');
        console.log('✓ Get Airport Airlines test passed\n');

        // Test Delete Airport
        console.log('Testing Delete Airport...');
        const deleteResult = await makeRequest(
            'DELETE',
            `/airports/${TEST_AIRPORT.id}`,
            null,
            { 'If-Match': updateResult.headers.etag }
        );
        assert.strictEqual(deleteResult.statusCode, 200, 'Delete should return 200');
        console.log('✓ Delete Airport test passed\n');

        // Verify Delete
        console.log('Verifying Delete operation...');
        const verifyDelete = await makeRequest('GET', `/airports/${TEST_AIRPORT.id}`);
        assert.strictEqual(verifyDelete.statusCode, 404, 'Get after Delete should return 404');
        console.log('✓ Delete verification passed\n');

        // Test Get Hotels Near Airport
        console.log('Testing Get Hotels Near Airport...');
        const hotelsResult = await makeRequest(
            'GET',
            '/airports/hotels/nearby?airportId=airport_1254&distance=10km'
        );
        assert.strictEqual(hotelsResult.statusCode, 200, 'Get Hotels should return 200');
        assert.ok(hotelsResult.body.airport, 'Response should include airport details');
        assert.ok(Array.isArray(hotelsResult.body.hotels), 'Response should include hotels array');
        assert.ok(typeof hotelsResult.body.total_hotels_found === 'number', 'Response should include total_hotels_found');
        assert.strictEqual(hotelsResult.body.search_criteria.distance, '10km', 'Response should include correct search distance');
        console.log('✓ Get Hotels Near Airport test passed\n');

        console.log('All API Gateway integration tests passed! 🎉');

    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

// Run the tests
runTests(); 