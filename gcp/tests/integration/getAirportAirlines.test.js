describe('GET /airports/{airportId}/airlines - Get Airport Airlines', () => {
    let apiBaseUrl;

    beforeAll(() => {
        apiBaseUrl = global.API_BASE_URL;
        expect(apiBaseUrl).toBeDefined();
    });

    test('should get airport airlines successfully with valid airport ID', async () => {
        const airportId = 'SFO';
        const response = await fetch(`${apiBaseUrl}/airports/${airportId}/airlines`);
        
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toBeDefined();
        expect(Array.isArray(data.results) || Array.isArray(data)).toBe(true);
    });
}); 