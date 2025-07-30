import assert from 'assert';

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------
// Provide the APIM gateway base URL via environment variable:
//   BASE_URL="https://my-apim-name.azure-api.net" npm test
// -----------------------------------------------------------------------------
const BASE_URL = process.env.BASE_URL;

if (!BASE_URL) {
    console.error('❌ BASE_URL environment variable is required');
    console.error('Example: BASE_URL=https://my-apim-name.azure-api.net npm test');
    process.exit(1);
}


const TEST_AIRPORT_ID = `test_airport_${Date.now()}`;
const TEST_AIRPORT = {
    airportname: "San Francisco International",
    city: "San Francisco",
    country: "United States",
    faa: "SFO",
    geo: {
        alt: 13,
        lat: 37.6213,
        lon: -122.3790
    },
    icao: "KSFO",
    id: TEST_AIRPORT_ID,
    type: "airport",
    tz: "America/Los_Angeles"
};


async function request(method, path, body = null, headers = {}) {
    const url = new URL(path, BASE_URL);
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers
        }
    };
    if (body) options.body = JSON.stringify(body);

    console.log(`${method} ${url}`);
    const resp = await fetch(url, options);
    const ct = resp.headers.get('content-type') || '';
    let data;
    if (ct.includes('application/json')) {
        try { data = await resp.json(); } catch { data = await resp.text(); }
    } else {
        data = await resp.text();
    }
    if (resp.status >= 400) {
        console.error('❌', resp.status, data);
    }
    return { status: resp.status, headers: Object.fromEntries(resp.headers.entries()), body: data };
}

// -----------------------------------------------------------------------------
// Main test sequence
// -----------------------------------------------------------------------------
async function run() {
    console.log('Using base URL:', BASE_URL);
    const basePath = '/airports';

    let etag;

    // 1. Create Airport
    const createRes = await request('POST', basePath, TEST_AIRPORT);
    assert.strictEqual(createRes.status, 201, 'Create should return 201');
    etag = createRes.headers.etag;
    assert.ok(etag, 'Create should return ETag');

    // 2. Get Airport
    const getRes = await request('GET', `${basePath}/${TEST_AIRPORT_ID}`);
    assert.strictEqual(getRes.status, 200, 'Get should return 200');
    assert.strictEqual(getRes.body.id, TEST_AIRPORT_ID, 'IDs should match');

    // 3. Update Airport
    const updated = { ...TEST_AIRPORT, airportname: 'Updated Test Airport', city: 'Updated Test City' };
    const updateRes = await request('PUT', `${basePath}/${TEST_AIRPORT_ID}`, updated, { 'If-Match': etag });
    assert.strictEqual(updateRes.status, 200, 'Update should return 200');
    const newEtag = updateRes.headers.etag || etag;

    // 4. Get Routes
    const routesRes = await request('GET', `${basePath}/SFO/routes`);
    assert.strictEqual(routesRes.status, 200, 'Routes should return 200');

    // 5. Get Airlines
    const airlinesRes = await request('GET', `${basePath}/SFO/airlines`);
    assert.strictEqual(airlinesRes.status, 200, 'Airlines should return 200');

    // 6. Hotels Near
    const hotelsRes = await request('GET', `${basePath}/${TEST_AIRPORT_ID}/hotels/nearby/150km`);
    assert.strictEqual(hotelsRes.status, 200, 'Hotels should return 200');

    // 7. Delete Airport
    const delRes = await request('DELETE', `${basePath}/${TEST_AIRPORT_ID}`, null, { 'If-Match': newEtag });
    assert.strictEqual(delRes.status, 204, 'Delete should return 204');

    // 8. Verify gone
    const verifyRes = await request('GET', `${basePath}/${TEST_AIRPORT_ID}`);
    assert.strictEqual(verifyRes.status, 404, 'Airport should be deleted');

    console.log('\n All Azure APIM integration tests passed!');
}

run().catch(err => {
    console.error('Integration test failed:', err);
    process.exit(1);
}); 