// Offline contract tests for the AWS Lambda handlers.
// They stub global fetch, so no Capella cluster or .env file is needed:
//   npm run test-offline
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.DATA_API_ENDPOINT = 'https://data-api.example.com';
process.env.DATA_API_USERNAME = 'user';
process.env.DATA_API_PASSWORD = 'p@ss';

const { handler: getAirport } = await import('../src/getAirport.mjs');
const { handler: createAirport } = await import('../src/createAirport.mjs');
const { handler: updateAirport } = await import('../src/updateAirport.mjs');
const { handler: deleteAirport } = await import('../src/deleteAirport.mjs');
const { handler: getAirportRoutes } = await import('../src/getAirportRoutes.mjs');
const { handler: getAirportAirlines } = await import('../src/getAirportAirlines.mjs');
const { handler: getHotelsNearAirport } = await import('../src/getHotelsNearAirport.mjs');

const AUTH = `Basic ${Buffer.from('user:p@ss').toString('base64')}`;
const DOC_URL = 'https://data-api.example.com/v1/buckets/travel-sample/scopes/inventory/collections/airport/documents';
const QUERY_URL = 'https://data-api.example.com/_p/query/query/service';
const FTS_URL = 'https://data-api.example.com/_p/fts/api/bucket/travel-sample/scope/inventory/index/hotel-geo-index/query';

const realFetch = globalThis.fetch;
let calls;
let replies;

// Queue the Data API replies the handler will receive, in call order.
function reply(status, body) {
    replies.push(new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }));
}

beforeEach(() => {
    calls = [];
    replies = [];
    globalThis.fetch = async (url, init) => {
        calls.push({ url, ...init });
        if (replies.length === 0) throw new Error(`unexpected fetch ${url}`);
        return replies.shift();
    };
});

afterEach(() => {
    globalThis.fetch = realFetch;
});

const READ_HEADERS = { 'Accept': 'application/json', 'Authorization': AUTH };
const WRITE_HEADERS = { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': AUTH };

test('getAirport sends an authenticated GET and adds the id', async () => {
    reply(200, { airportname: 'SFO' });
    const res = await getAirport({ pathParameters: { airportId: 'airport 1' } });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(JSON.parse(res.body), { airportname: 'SFO', id: 'airport 1' });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, `${DOC_URL}/airport%201`);
    assert.equal(calls[0].method, 'GET');
    assert.deepEqual(calls[0].headers, READ_HEADERS);
    assert.equal(calls[0].body, undefined);
});

test('getAirport maps a Data API 404', async () => {
    reply(404, 'not found');
    const res = await getAirport({ pathParameters: { airportId: 'missing' } });
    assert.equal(res.statusCode, 404);
    assert.deepEqual(JSON.parse(res.body), { error: 'Airport does not exist' });
});

test('createAirport POSTs the document without its id', async () => {
    reply(201, '');
    const res = await createAirport({ body: JSON.stringify({ id: 'a1', airportname: 'X' }) });
    assert.equal(res.statusCode, 201);
    assert.deepEqual(JSON.parse(res.body), { airportname: 'X', id: 'a1' });
    assert.equal(calls[0].url, `${DOC_URL}/a1`);
    assert.equal(calls[0].method, 'POST');
    assert.deepEqual(calls[0].headers, WRITE_HEADERS);
    assert.deepEqual(JSON.parse(calls[0].body), { airportname: 'X' });
});

test('createAirport maps a Data API 409', async () => {
    reply(409, 'exists');
    const res = await createAirport({ body: JSON.stringify({ id: 'a1' }) });
    assert.equal(res.statusCode, 409);
});

test('updateAirport PUTs the normalized document', async () => {
    reply(200, '');
    const doc = { airportname: 'X', city: 'C', country: 'K' };
    const res = await updateAirport({ pathParameters: { airportId: 'a1' }, body: JSON.stringify(doc) });
    assert.equal(res.statusCode, 200);
    assert.equal(calls[0].url, `${DOC_URL}/a1`);
    assert.equal(calls[0].method, 'PUT');
    assert.deepEqual(calls[0].headers, WRITE_HEADERS);
    assert.deepEqual(JSON.parse(calls[0].body), { ...doc, id: 'a1', type: 'airport' });
});

test('deleteAirport sends an authenticated DELETE', async () => {
    reply(200, '');
    const res = await deleteAirport({ pathParameters: { airportId: 'a1' } });
    assert.equal(res.statusCode, 204);
    assert.equal(calls[0].url, `${DOC_URL}/a1`);
    assert.equal(calls[0].method, 'DELETE');
    assert.deepEqual(calls[0].headers, READ_HEADERS);
});

for (const [name, handler, key] of [
    ['getAirportRoutes', getAirportRoutes, 'routes'],
    ['getAirportAirlines', getAirportAirlines, 'airlines'],
]) {
    test(`${name} POSTs a parameterized SQL++ query`, async () => {
        reply(200, { results: [{ x: 1 }], metrics: { resultCount: 1, executionTime: '1ms' } });
        const res = await handler({ pathParameters: { airportCode: 'SFO' } });
        assert.equal(res.statusCode, 200);
        assert.deepEqual(JSON.parse(res.body)[key], [{ x: 1 }]);
        assert.equal(calls[0].url, QUERY_URL);
        assert.equal(calls[0].method, 'POST');
        assert.deepEqual(calls[0].headers, WRITE_HEADERS);
        assert.deepEqual(JSON.parse(calls[0].body).args, ['SFO', 'SFO']);
    });

    test(`${name} passes through Data API query errors`, async () => {
        reply(400, 'bad query');
        const res = await handler({ pathParameters: { airportCode: 'SFO' } });
        assert.equal(res.statusCode, 400);
        assert.deepEqual(JSON.parse(res.body), { error: 'bad query' });
    });
}

test('getHotelsNearAirport GETs the airport, then POSTs the FTS geo query', async () => {
    reply(200, { faa: 'SFO', airportname: 'San Francisco', geo: { lat: 37.6, lon: -122.4 } });
    reply(200, { total_hits: 1, hits: [{ score: 0.5, fields: { name: 'Hotel' } }] });
    const res = await getHotelsNearAirport({ pathParameters: { airportId: 'a1', distance: '10km' } });
    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.total_hotels_found, 1);
    assert.deepEqual(body.hotels, [{ name: 'Hotel', score: 0.5 }]);

    assert.equal(calls.length, 2);
    assert.equal(calls[0].url, `${DOC_URL}/a1`);
    assert.equal(calls[0].method, 'GET');
    assert.deepEqual(calls[0].headers, READ_HEADERS);
    assert.equal(calls[1].url, FTS_URL);
    assert.equal(calls[1].method, 'POST');
    assert.deepEqual(calls[1].headers, WRITE_HEADERS);
    const fts = JSON.parse(calls[1].body);
    assert.equal(fts.query.distance, '10km');
    assert.deepEqual(fts.query.location, { lon: -122.4, lat: 37.6 });
});

test('handlers return 500 without calling the Data API when config is missing', async () => {
    const saved = process.env.DATA_API_PASSWORD;
    delete process.env.DATA_API_PASSWORD;
    try {
        const res = await getAirport({ pathParameters: { airportId: 'a1' } });
        assert.equal(res.statusCode, 500);
        assert.match(JSON.parse(res.body).error, /DATA_API_PASSWORD/);
        assert.equal(calls.length, 0);
    } finally {
        process.env.DATA_API_PASSWORD = saved;
    }
});
