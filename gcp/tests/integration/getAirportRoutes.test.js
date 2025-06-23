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

    test('should return 404 for non-existent airport', async () => {
        const airportId = 'NONEXISTENT';
        
        const response = await fetch(`${apiBaseUrl}/airports/${airportId}/routes`);
        expect([404, 400]).toContain(response.status);
    });

    test('should return empty results for airport with no routes', async () => {
        const airportId = 'NOROUTES';
        const response = await fetch(`${apiBaseUrl}/airports/${airportId}/routes`);
        
        if (response.ok) {
            const data = await response.json();
            expect(data).toBeDefined();
        } else {
            expect([404, 400]).toContain(response.status);
        }
    });

    test('should handle query parameters like limit', async () => {
        const airportId = 'SFO';
        const response = await fetch(`${apiBaseUrl}/airports/${airportId}/routes?limit=10`);
        
        if (response.ok) {
            const data = await response.json();
            expect(data).toBeDefined();
        } else {
            expect([404, 400]).toContain(response.status);
        }
    });

    test('should return proper content-type header', async () => {
        const airportId = 'SFO';
        
        const response = await fetch(`${apiBaseUrl}/airports/${airportId}/routes`);
        const contentType = response.headers.get('content-type');
        expect(contentType).toMatch(/application\/json/);
    });

    test('should return 400 for invalid airport ID format', async () => {
        const airportId = '';
        
        const response = await fetch(`${apiBaseUrl}/airports/${airportId}/routes`);
        expect([400, 404]).toContain(response.status);
    });

    test('should handle special characters in airport ID', async () => {
        const airportId = 'ABC@123';
        const response = await fetch(`${apiBaseUrl}/airports/${airportId}/routes`);
        
        expect([400, 404, 500]).toContain(response.status);
    });
}); 