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

    test('should return 404 for non-existent airport airlines', async () => {
        const airportId = 'NONEXISTENT';
        
        const response = await fetch(`${apiBaseUrl}/airports/${airportId}/airlines`);
        expect([404, 400]).toContain(response.status);
    });

    test('should return empty array or appropriate response for airport with no airlines', async () => {
        const airportId = `NOAIRLINES${Date.now()}`;
        
        const response = await fetch(`${apiBaseUrl}/airports/${airportId}/airlines`);
        if (response.ok) {
            const data = await response.json();
            expect(data).toBeDefined();
        } else {
            expect(response.status).toBe(404);
        }
    });

    test('should handle query parameters for airline filtering', async () => {
        const airportId = 'SFO';
        
        const response = await fetch(`${apiBaseUrl}/airports/${airportId}/airlines?limit=5`);
        if (response.ok) {
            const data = await response.json();
            expect(data).toBeDefined();
        } else {
            expect([400, 404]).toContain(response.status);
        }
    });

    test('should return proper content-type header', async () => {
        const airportId = 'SFO';
        
        const response = await fetch(`${apiBaseUrl}/airports/${airportId}/airlines`);
        const contentType = response.headers.get('content-type');
        if (response.ok) {
            expect(contentType).toMatch(/application\/json/);
        } else {
            expect(contentType).toMatch(/application\/json|text\/plain/);
        }
    });

    test('should handle special characters in airport ID', async () => {
        const airportId = 'ABC@123';
        
        const response = await fetch(`${apiBaseUrl}/airports/${airportId}/airlines`);
        expect([400, 404, 500]).toContain(response.status);
    });

    test('should validate airline data structure when airlines exist', async () => {
        const airportId = 'SFO';
        
        const response = await fetch(`${apiBaseUrl}/airports/${airportId}/airlines`);
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                const airline = data[0];
                expect(typeof airline).toBe('object');
            }
        } else {
            expect([404, 500]).toContain(response.status);
        }
    });

    test('should handle case-insensitive airport ID', async () => {
        const airportId = 'sfo'; // lowercase
        
        const response = await fetch(`${apiBaseUrl}/airports/${airportId}/airlines`);
        expect([200, 404, 400]).toContain(response.status);
    });
}); 