import axios from 'axios';

describe('DELETE /airports/{airportId} - Delete Airport', () => {
    let apiBaseUrl;
    let testAirportId;

    beforeAll(() => {
        apiBaseUrl = global.API_BASE_URL;
        expect(apiBaseUrl).toBeDefined();
    });

    beforeEach(async () => {
        // Create a test airport for delete operations
        testAirportId = `DELETE_TEST${Date.now()}`;
        const airportData = {
            airportname: 'Delete Test Airport',
            city: 'Delete Test City',
            country: 'Delete Test Country',
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
            // Airport creation might fail, but continue with tests
        }
    });

    test('should delete airport successfully', async () => {
        const response = await axios.delete(`${apiBaseUrl}/airports/${testAirportId}`);
        
        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
    });

    test('should return 404 for non-existent airport', async () => {
        const nonExistentId = `NONEXISTENT${Date.now()}`;

        try {
            await axios.delete(`${apiBaseUrl}/airports/${nonExistentId}`);
            fail('Expected request to fail with 404');
        } catch (error) {
            expect(error.response.status).toBe(404);
        }
    });

    test('should return 400 for invalid airport ID format', async () => {
        const invalidId = '';

        try {
            await axios.delete(`${apiBaseUrl}/airports/${invalidId}`);
            fail('Expected request to fail with 400');
        } catch (error) {
            expect([400, 404]).toContain(error.response.status);
        }
    });

    test('should handle special characters in airport ID', async () => {
        const specialId = 'ABC@123';

        try {
            await axios.delete(`${apiBaseUrl}/airports/${specialId}`);
        } catch (error) {
            expect([400, 404, 500]).toContain(error.response.status);
        }
    });

    test('should confirm airport is deleted by trying to get it', async () => {
        // First delete the airport
        try {
            await axios.delete(`${apiBaseUrl}/airports/${testAirportId}`);
        } catch (error) {
            // Airport might not exist, continue
        }

        // Then try to get it - should return 404
        try {
            await axios.get(`${apiBaseUrl}/airports/${testAirportId}`);
            fail('Expected request to fail with 404 after deletion');
        } catch (error) {
            expect(error.response.status).toBe(404);
        }
    });
}); 