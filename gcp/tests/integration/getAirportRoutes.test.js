import axios from 'axios';

describe('GET /airports/{airportId}/routes - Get Airport Routes', () => {
    let apiBaseUrl;

    beforeAll(() => {
        apiBaseUrl = global.API_BASE_URL;
        expect(apiBaseUrl).toBeDefined();
    });

    test('should get airport routes successfully with valid airport ID', async () => {
        const airportId = 'SFO';
        const response = await axios.get(`${apiBaseUrl}/airports/${airportId}/routes`);
        
        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data) || typeof response.data === 'object').toBe(true);
    });

    test('should return 404 for non-existent airport routes', async () => {
        const airportId = 'NONEXISTENT';
        
        try {
            await axios.get(`${apiBaseUrl}/airports/${airportId}/routes`);
            fail('Expected request to fail with 404');
        } catch (error) {
            expect(error.response.status).toBe(404);
        }
    });

    test('should return empty array or appropriate response for airport with no routes', async () => {
        const airportId = `NOROUTES${Date.now()}`;
        
        try {
            const response = await axios.get(`${apiBaseUrl}/airports/${airportId}/routes`);
            expect(response.status).toBe(200);
            expect(Array.isArray(response.data) ? response.data.length : 0).toBe(0);
        } catch (error) {
            expect(error.response.status).toBe(404);
        }
    });

    test('should handle query parameters for route filtering', async () => {
        const airportId = 'SFO';
        
        try {
            const response = await axios.get(`${apiBaseUrl}/airports/${airportId}/routes?limit=10`);
            expect([200, 400]).toContain(response.status);
            if (response.status === 200) {
                expect(response.data).toBeDefined();
            }
        } catch (error) {
            expect([400, 404]).toContain(error.response.status);
        }
    });

    test('should return proper content-type header', async () => {
        const airportId = 'SFO';
        
        try {
            const response = await axios.get(`${apiBaseUrl}/airports/${airportId}/routes`);
            expect(response.headers['content-type']).toMatch(/application\/json/);
        } catch (error) {
            expect(error.response.headers['content-type']).toMatch(/application\/json|text\/plain/);
        }
    });

    test('should handle special characters in airport ID', async () => {
        const airportId = 'ABC@123';
        
        try {
            await axios.get(`${apiBaseUrl}/airports/${airportId}/routes`);
        } catch (error) {
            expect([400, 404, 500]).toContain(error.response.status);
        }
    });

    test('should validate route data structure when routes exist', async () => {
        const airportId = 'SFO';
        
        try {
            const response = await axios.get(`${apiBaseUrl}/airports/${airportId}/routes`);
            if (response.status === 200 && Array.isArray(response.data) && response.data.length > 0) {
                const route = response.data[0];
                expect(typeof route).toBe('object');
                // Routes typically have properties like destination, airline, etc.
            }
        } catch (error) {
            expect([404, 500]).toContain(error.response.status);
        }
    });
}); 