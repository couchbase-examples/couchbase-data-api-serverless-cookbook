
const WORKER_URL = process.env.WORKER_URL;

console.log(` Testing against deployed Worker: ${WORKER_URL}`);

// Test data
const TEST_AIRPORT_ID = `test_airport_${Date.now()}`;
const TEST_AIRPORT = {
	airportname: "Test Integration Airport",
	city: "Test City",
	country: "Test Country",
	faa: "TST",
	geo: {
		alt: 100,
		lat: 34.0522,
		lon: -118.2437
	},
	icao: "KTST",
	id: TEST_AIRPORT_ID,
	type: "airport",
	tz: "America/Los_Angeles"
};

async function makeRequest(method, path, body = null) {
	const url = new URL(path, WORKER_URL);
	
	const options = {
		method,
		headers: {
			'Content-Type': 'application/json'
		}
	};

	if (body) {
		options.body = JSON.stringify(body);
	}

	console.log(`${method} ${url}`);
	if (body) {
		console.log('Request body:', JSON.stringify(body, null, 2));
	}

	const response = await fetch(url, options);
	let responseData;
	
	const contentType = response.headers.get('content-type');
	if (contentType && contentType.includes('application/json')) {
		try {
			responseData = await response.json();
		} catch (e) {
			responseData = await response.text();
		}
	} else {
		responseData = await response.text();
	}
	
	return {
		status: response.status,
		body: responseData
	};
}

function assert(condition, message) {
	if (!condition) {
		throw new Error(` ${message}`);
	}
	console.log(` ${message}`);
}

async function runTests() {
	try {
		console.log('\n=== Airport CRUD Operations ===');
		
		// Test 1: Create Airport
		console.log('\n1. Creating airport...');
		const createResult = await makeRequest('POST', '/airports', TEST_AIRPORT);
		assert(createResult.status === 201, 'Create should return 201');
		assert(createResult.body.message === 'Airport Created Successfully', 'Should return success message');

		// Test 2: Get Airport
		console.log('\n2. Getting created airport...');
		const getResult = await makeRequest('GET', `/airports/${TEST_AIRPORT_ID}`);
		assert(getResult.status === 200, 'Get should return 200');
		assert(getResult.body.id === TEST_AIRPORT_ID, 'Should return correct airport ID');

		// Test 3: Update Airport
		console.log('\n3. Updating airport...');
		const updatedAirport = { ...TEST_AIRPORT, airportname: "Updated Test Airport" };
		const updateResult = await makeRequest('PUT', `/airports/${TEST_AIRPORT_ID}`, updatedAirport);
		assert(updateResult.status === 200, 'Update should return 200');
		assert(updateResult.body.message === 'Airport Updated Successfully', 'Should return success message');

		// Test 4: Verify Update
		console.log('\n4. Verifying update...');
		const verifyResult = await makeRequest('GET', `/airports/${TEST_AIRPORT_ID}`);
		assert(verifyResult.status === 200, 'Get should return 200');
		assert(verifyResult.body.airportname === "Updated Test Airport", 'Should show updated name');

		console.log('\n=== Query Operations ===');

		// Test 5: Get Routes
		console.log('\n5. Getting airport routes...');
		const routesResult = await makeRequest('GET', '/airports/SFO/routes');
		assert(routesResult.status === 200, 'Routes should return 200');
		assert(routesResult.body && typeof routesResult.body === 'object', 'Should return route data');

		// Test 6: Get Airlines
		console.log('\n6. Getting airport airlines...');
		const airlinesResult = await makeRequest('GET', '/airports/SFO/airlines');
		assert(airlinesResult.status === 200, 'Airlines should return 200');
		assert(airlinesResult.body && typeof airlinesResult.body === 'object', 'Should return airline data');

		// Test 7: Get Hotels Near Airport (FTS)
		console.log('\n7. Getting hotels near airport using FTS...');
		const hotelsResult = await makeRequest('GET', `/airports/${TEST_AIRPORT_ID}/hotels/nearby/150km`);
		assert(hotelsResult.status === 200, 'Hotels FTS search should return 200');
		
		console.log('\n=== Error Handling ===');

		// Test 8: 404 Error
		console.log('\n8. Testing 404 error...');
		const notFoundResult = await makeRequest('GET', '/airports/NONEXISTENT123');
		assert(notFoundResult.status === 404, 'Should return 404 for non-existent airport');

		// Test 9: 400 Error
		console.log('\n9. Testing 400 error...');
		const invalidResult = await makeRequest('POST', '/airports', { airportname: "Invalid" });
		assert(invalidResult.status === 400, 'Should return 400 for missing required fields');

		console.log('\n=== Cleanup ===');

		// Test 10: Delete Airport
		console.log('\n10. Deleting test airport...');
		const deleteResult = await makeRequest('DELETE', `/airports/${TEST_AIRPORT_ID}`);
		assert(deleteResult.status === 200, 'Delete should return 200');
		assert(deleteResult.body.message && deleteResult.body.message.includes('deleted successfully'), 'Should return success message');

		// Test 11: Verify Delete
		console.log('\n11. Verifying deletion...');
		const deletedResult = await makeRequest('GET', `/airports/${TEST_AIRPORT_ID}`);
		assert(deletedResult.status === 404, 'Should return 404 after deletion');

		console.log('\n All integration tests passed!');
		
	} catch (error) {
		console.error('\n Integration test failed:', error.message);
		process.exit(1);
	}
}

runTests(); 