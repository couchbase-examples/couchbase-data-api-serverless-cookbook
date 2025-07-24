describe('GET /airports/{airportId}/routes - Get Airport Routes', () => {
    let apiBaseUrl;

    beforeAll(() => {
        apiBaseUrl = global.API_BASE_URL;
        expect(apiBaseUrl).toBeDefined();
    });

    test('should get airport routes successfully with valid airport ID', async () => {
        const airportId = 'SFO';
        const response = await fetch(`${apiBaseUrl}/airports/${airportId}/routes`);
        
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toBeDefined();
        expect(Array.isArray(data.results) || Array.isArray(data)).toBe(true);
    });

}); 