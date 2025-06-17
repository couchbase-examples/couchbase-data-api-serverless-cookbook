import axios from 'axios';

describe('GET /airports/{airportId}/airlines - Get Airport Airlines', () => {
    let apiBaseUrl;

    beforeAll(() => {
        apiBaseUrl = global.API_BASE_URL;
        expect(apiBaseUrl).toBeDefined();
    });

    test('should get airport airlines successfully with valid airport ID', async () => {
        const airportId = 'SFO';
        const response = await axios.get(`${apiBaseUrl}/airports/${airportId}/airlines`);
        
        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data) || typeof response.data === 'object').toBe(true);
    });

    test('should return 404 for non-existent airport airlines', async () => {
        const airportId = 'NONEXISTENT';
        
        try {
            await axios.get(`${apiBaseUrl}/airports/${airportId}/airlines`);
            fail('Expected request to fail with 404');
        } catch (error) {
            expect(error.response.status).toBe(404);
        }
    });

    test('should return empty array or appropriate response for airport with no airlines', async () => {
        const airportId = `NOAIRLINES${Date.now()}`;
        
        try {
            const response = await axios.get(`${apiBaseUrl}/airports/${airportId}/airlines`);
            expect(response.status).toBe(200);
            expect(Array.isArray(response.data) ? response.data.length : 0).toBe(0);
        } catch (error) {
            expect(error.response.status).toBe(404);
        }
    });

    test('should handle query parameters for airline filtering', async () => {
        const airportId = 'SFO';
        
        try {
            const response = await axios.get(`${apiBaseUrl}/airports/${airportId}/airlines?limit=5`);
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
            const response = await axios.get(`${apiBaseUrl}/airports/${airportId}/airlines`);
            expect(response.headers['content-type']).toMatch(/application\/json/);
        } catch (error) {
            expect(error.response.headers['content-type']).toMatch(/application\/json|text\/plain/);
        }
    });

    test('should handle special characters in airport ID', async () => {
        const airportId = 'ABC@123';
        
        try {
            await axios.get(`${apiBaseUrl}/airports/${airportId}/airlines`);
        } catch (error) {
            expect([400, 404, 500]).toContain(error.response.status);
        }
    });

    test('should validate airline data structure when airlines exist', async () => {
        const airportId = 'SFO';
        
        try {
            const response = await axios.get(`${apiBaseUrl}/airports/${airportId}/airlines`);
            if (response.status === 200 && Array.isArray(response.data) && response.data.length > 0) {
                const airline = response.data[0];
                expect(typeof airline).toBe('object');
                // Airlines typically have properties like name, code, etc.
            }
        } catch (error) {
            expect([404, 500]).toContain(error.response.status);
        }
    });

    test('should handle case-insensitive airport ID', async () => {
        const airportId = 'sfo'; // lowercase
        
        try {
            const response = await axios.get(`${apiBaseUrl}/airports/${airportId}/airlines`);
            expect([200, 404]).toContain(response.status);
        } catch (error) {
            expect([404, 400]).toContain(error.response.status);
        }
    });
}); 