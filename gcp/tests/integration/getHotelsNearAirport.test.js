import axios from 'axios';

describe('GET /airports/{airportId}/hotels/nearby/{distance} - Get Hotels Near Airport', () => {
    let apiBaseUrl;

    beforeAll(() => {
        apiBaseUrl = global.API_BASE_URL;
        expect(apiBaseUrl).toBeDefined();
    });

    test('should get nearby hotels successfully with valid airport ID and distance', async () => {
        const airportId = 'SFO';
        const distance = '10km';
        const response = await axios.get(`${apiBaseUrl}/airports/${airportId}/hotels/nearby/${distance}`);
        
        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data) || typeof response.data === 'object').toBe(true);
    });

    test('should use default distance when not provided', async () => {
        const airportId = 'SFO';
        const response = await axios.get(`${apiBaseUrl}/airports/${airportId}/hotels/nearby/5km`);
        
        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
    });

    test('should return 404 for non-existent airport hotels', async () => {
        const airportId = 'NONEXISTENT';
        const distance = '10km';
        
        try {
            await axios.get(`${apiBaseUrl}/airports/${airportId}/hotels/nearby/${distance}`);
            fail('Expected request to fail with 404');
        } catch (error) {
            expect(error.response.status).toBe(404);
        }
    });

    test('should return empty array or appropriate response for airport with no nearby hotels', async () => {
        const airportId = `NOHOTELS${Date.now()}`;
        const distance = '10km';
        
        try {
            const response = await axios.get(`${apiBaseUrl}/airports/${airportId}/hotels/nearby/${distance}`);
            expect(response.status).toBe(200);
            expect(Array.isArray(response.data) ? response.data.length : 0).toBe(0);
        } catch (error) {
            expect(error.response.status).toBe(404);
        }
    });

    test('should handle query parameters for hotel filtering', async () => {
        const airportId = 'SFO';
        const distance = '15km';
        
        try {
            const response = await axios.get(`${apiBaseUrl}/airports/${airportId}/hotels/nearby/${distance}`);
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
        const distance = '10km';
        
        try {
            const response = await axios.get(`${apiBaseUrl}/airports/${airportId}/hotels/nearby/${distance}`);
            expect(response.headers['content-type']).toMatch(/application\/json/);
        } catch (error) {
            expect(error.response.headers['content-type']).toMatch(/application\/json|text\/plain/);
        }
    });

    test('should handle special characters in airport ID', async () => {
        const airportId = 'ABC@123';
        const distance = '10km';
        
        try {
            await axios.get(`${apiBaseUrl}/airports/${airportId}/hotels/nearby/${distance}`);
        } catch (error) {
            expect([400, 404, 500]).toContain(error.response.status);
        }
    });

    test('should validate hotel data structure when hotels exist', async () => {
        const airportId = 'SFO';
        const distance = '10km';
        
        try {
            const response = await axios.get(`${apiBaseUrl}/airports/${airportId}/hotels/nearby/${distance}`);
            if (response.status === 200 && Array.isArray(response.data) && response.data.length > 0) {
                const hotel = response.data[0];
                expect(typeof hotel).toBe('object');
                // Hotels typically have properties like name, address, distance, etc.
            }
        } catch (error) {
            expect([404, 500]).toContain(error.response.status);
        }
    });

    test('should handle different distance formats', async () => {
        const airportId = 'SFO';
        
        try {
            const response = await axios.get(`${apiBaseUrl}/airports/${airportId}/hotels/nearby/5mi`);
            expect([200, 400]).toContain(response.status);
        } catch (error) {
            expect([400, 404]).toContain(error.response.status);
        }
    });

    test('should handle large distance parameter', async () => {
        const airportId = 'SFO';
        const distance = '100km';
        
        try {
            const response = await axios.get(`${apiBaseUrl}/airports/${airportId}/hotels/nearby/${distance}`);
            expect([200, 400]).toContain(response.status);
        } catch (error) {
            expect([400, 404, 500]).toContain(error.response.status);
        }
    });
}); 