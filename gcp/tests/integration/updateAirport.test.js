import axios from 'axios';

describe('PUT /airports/{airportId} - Update Airport', () => {
    let apiBaseUrl;
    let testAirportId;

    beforeAll(() => {
        apiBaseUrl = global.API_BASE_URL;
        expect(apiBaseUrl).toBeDefined();
        testAirportId = `UPDATE_TEST${Date.now()}`;
    });

    beforeEach(async () => {
        // Create a test airport for update operations
        const airportData = {
            airportname: 'Update Test Airport',
            city: 'Update Test City',
            country: 'Update Test Country',
            faa: testAirportId,
            icao: `I${testAirportId}`,
            tz: 'America/Los_Angeles',
            geo: {
                lat: 37.7749,
                lon: -122.4194,
                alt: 13
            }
        };

        try {
            await axios.post(`${apiBaseUrl}/airports/${testAirportId}`, airportData);
        } catch (error) {
            // Airport might already exist, continue with tests
        }
    });

    test('should update airport successfully with valid data', async () => {
        const updatedData = {
            airportname: 'Updated Airport Name',
            city: 'Updated City',
            country: 'Updated Country',
            faa: testAirportId,
            icao: `I${testAirportId}`,
            tz: 'America/New_York',
            geo: {
                lat: 40.7128,
                lon: -74.0060,
                alt: 10
            }
        };

        const response = await axios.put(`${apiBaseUrl}/airports/${testAirportId}`, updatedData);
        
        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
    });

    test('should return 404 for non-existent airport', async () => {
        const nonExistentId = `NONEXISTENT${Date.now()}`;
        const updateData = {
            airportname: 'Updated Airport',
            city: 'Updated City',
            country: 'Updated Country'
        };

        try {
            await axios.put(`${apiBaseUrl}/airports/${nonExistentId}`, updateData);
            fail('Expected request to fail with 404');
        } catch (error) {
            expect(error.response.status).toBe(404);
        }
    });

    test('should return 400 for invalid data types', async () => {
        const invalidData = {
            airportname: 123, // Should be string
            city: 'Updated City',
            country: 'Updated Country',
            geo: {
                lat: 'invalid', // Should be number
                lon: -122.4194,
                alt: 13
            }
        };

        try {
            await axios.put(`${apiBaseUrl}/airports/${testAirportId}`, invalidData);
            fail('Expected request to fail with 400');
        } catch (error) {
            expect(error.response.status).toBe(400);
        }
    });

    test('should handle partial updates', async () => {
        const partialData = {
            airportname: 'Partially Updated Airport'
        };

        try {
            const response = await axios.put(`${apiBaseUrl}/airports/${testAirportId}`, partialData);
            expect([200, 400]).toContain(response.status);
        } catch (error) {
            expect([400, 404]).toContain(error.response.status);
        }
    });

    test('should handle empty request body', async () => {
        try {
            await axios.put(`${apiBaseUrl}/airports/${testAirportId}`, {});
            fail('Expected request to fail with 400');
        } catch (error) {
            expect(error.response.status).toBe(400);
        }
    });
}); 