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

    test('should return 400 for invalid airport ID format', async () => {
        const airportId = '';
        
        const response = await fetch(`${apiBaseUrl}/airports/${airportId}`);
        expect([400, 404]).toContain(response.status);
    });

    test('should handle special characters in airport ID', async () => {
        const airportId = 'ABC@123';
        
        const response = await fetch(`${apiBaseUrl}/airports/${airportId}`);
        expect([400, 404, 500]).toContain(response.status);
    });

    test('should return proper content-type header', async () => {
        const airportId = 'SFO';
        
        const response = await fetch(`${apiBaseUrl}/airports/${airportId}`);
        const contentType = response.headers.get('content-type');
        if (response.ok) {
            expect(contentType).toMatch(/application\/json/);
        } else {
            expect(contentType).toMatch(/application\/json|text\/plain/);
        }
    });
}); 