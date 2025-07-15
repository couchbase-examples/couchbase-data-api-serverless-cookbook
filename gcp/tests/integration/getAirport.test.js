describe('GET /airports/{airportId} - Get Airport', () => {
    let apiBaseUrl;

    beforeAll(() => {
        apiBaseUrl = global.API_BASE_URL;
        expect(apiBaseUrl).toBeDefined();
    });

    test('should get airport data successfully with valid airport ID', async () => {
        const airportId = 'SFO';
        const response = await fetch(`${apiBaseUrl}/airports/${airportId}`);
        
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toBeDefined();
        expect(typeof data).toBe('object');
    });

    test('should return 404 for non-existent airport', async () => {
        const airportId = 'NONEXISTENT';
        
        const response = await fetch(`${apiBaseUrl}/airports/${airportId}`);
        expect(response.status).toBe(404);
        const data = await response.text();
        expect(data).toContain('Airport not found');
    });
}); 