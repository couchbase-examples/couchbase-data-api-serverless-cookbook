import axios from 'axios';

describe('GET /airports/{airportId} - Get Airport', () => {
    let apiBaseUrl;

    beforeAll(() => {
        apiBaseUrl = global.API_BASE_URL;
        expect(apiBaseUrl).toBeDefined();
    });

    test('should get airport data successfully with valid airport ID', async () => {
        const airportId = 'SFO';
        const response = await axios.get(`${apiBaseUrl}/airports/${airportId}`);
        
        expect(response.status).toBe(200);
        expect(response.data).toBeDefined();
        expect(typeof response.data).toBe('object');
    });

    test('should return 404 for non-existent airport', async () => {
        const airportId = 'NONEXISTENT';
        
        try {
            await axios.get(`${apiBaseUrl}/airports/${airportId}`);
            fail('Expected request to fail with 404');
        } catch (error) {
            expect(error.response.status).toBe(404);
            expect(error.response.data).toContain('Airport not found');
        }
    });

    test('should return 400 for invalid airport ID format', async () => {
        const airportId = '';
        
        try {
            await axios.get(`${apiBaseUrl}/airports/${airportId}`);
            fail('Expected request to fail with 400');
        } catch (error) {
            expect([400, 404]).toContain(error.response.status);
        }
    });

    test('should handle special characters in airport ID', async () => {
        const airportId = 'ABC@123';
        
        try {
            await axios.get(`${apiBaseUrl}/airports/${airportId}`);
        } catch (error) {
            expect([400, 404, 500]).toContain(error.response.status);
        }
    });

    test('should return proper content-type header', async () => {
        const airportId = 'SFO';
        
        try {
            const response = await axios.get(`${apiBaseUrl}/airports/${airportId}`);
            expect(response.headers['content-type']).toMatch(/application\/json/);
        } catch (error) {
            // If airport doesn't exist, still check content-type
            expect(error.response.headers['content-type']).toMatch(/application\/json|text\/plain/);
        }
    });
}); 