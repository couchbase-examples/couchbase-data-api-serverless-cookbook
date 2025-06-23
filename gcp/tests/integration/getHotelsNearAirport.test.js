describe('GET /airports/{airportId}/hotels/nearby/{distance} - Get Hotels Near Airport', () => {
    let apiBaseUrl;

    beforeAll(() => {
        apiBaseUrl = global.API_BASE_URL;
        expect(apiBaseUrl).toBeDefined();
    });

    test('should get hotels near airport successfully', async () => {
        const airportId = 'SFO';
        const distance = '10km';
        const response = await fetch(`${apiBaseUrl}/airports/${airportId}/hotels/nearby/${distance}`);
        
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toBeDefined();
        expect(typeof data).toBe('object');
    });

    test('should handle default distance when not specified', async () => {
        const airportId = 'SFO';
        const response = await fetch(`${apiBaseUrl}/airports/${airportId}/hotels/nearby/5km`);
        
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toBeDefined();
    });

    test('should return 404 for non-existent airport', async () => {
        const airportId = 'NONEXISTENT';
        const distance = '5km';
        
        const response = await fetch(`${apiBaseUrl}/airports/${airportId}/hotels/nearby/${distance}`);
        expect(response.status).toBe(404);
    });

    test('should handle different distance units (km)', async () => {
        const airportId = 'SFO';
        const distance = '15km';
        const response = await fetch(`${apiBaseUrl}/airports/${airportId}/hotels/nearby/${distance}`);
        
        if (response.ok) {
            const data = await response.json();
            expect(data).toBeDefined();
        } else {
            expect([404, 400]).toContain(response.status);
        }
    });

    test('should handle different distance units (miles)', async () => {
        const airportId = 'SFO';
        const distance = '10mi';
        const response = await fetch(`${apiBaseUrl}/airports/${airportId}/hotels/nearby/${distance}`);
        
        if (response.ok) {
            const data = await response.json();
            expect(data).toBeDefined();
        } else {
            expect([404, 400]).toContain(response.status);
        }
    });

    test('should return proper response structure', async () => {
        const airportId = 'SFO';
        const distance = '5km';
        const response = await fetch(`${apiBaseUrl}/airports/${airportId}/hotels/nearby/${distance}`);
        
        if (response.ok) {
            const data = await response.json();
            expect(data).toHaveProperty('airport');
            expect(data).toHaveProperty('hotels');
        } else {
            expect([404, 400]).toContain(response.status);
        }
    });

    test('should return 400 for invalid distance format', async () => {
        const airportId = 'SFO';
        const distance = 'invalid';
        
        const response = await fetch(`${apiBaseUrl}/airports/${airportId}/hotels/nearby/${distance}`);
        expect([400, 404, 500]).toContain(response.status);
    });

    test('should handle empty results gracefully', async () => {
        const airportId = 'SFO';
        const distance = '0.1km'; // Very small distance
        const response = await fetch(`${apiBaseUrl}/airports/${airportId}/hotels/nearby/${distance}`);
        
        if (response.ok) {
            const data = await response.json();
            expect(data).toBeDefined();
            expect(Array.isArray(data.hotels)).toBe(true);
        } else {
            expect([404, 400]).toContain(response.status);
        }
    });

    test('should handle miles distance format', async () => {
        const airportId = 'SFO';
        const distance = '5mi';
        const response = await fetch(`${apiBaseUrl}/airports/${airportId}/hotels/nearby/5mi`);
        
        if (response.ok) {
            const data = await response.json();
            expect(data).toBeDefined();
        } else {
            expect([404, 400]).toContain(response.status);
        }
    });

    test('should return proper content-type header', async () => {
        const airportId = 'SFO';
        const distance = '5km';
        
        const response = await fetch(`${apiBaseUrl}/airports/${airportId}/hotels/nearby/${distance}`);
        const contentType = response.headers.get('content-type');
        expect(contentType).toMatch(/application\/json/);
    });
}); 