describe('DELETE /airports/{airportId} - Delete Airport', () => {
    let apiBaseUrl;
    const testAirportId = `TEST_DELETE_AIRPORT`;

    beforeAll(async () => {
        apiBaseUrl = global.API_BASE_URL;
        expect(apiBaseUrl).toBeDefined();

        // Create a test airport for deletion
        const airportData = {
            id: testAirportId,
            airportname: 'Delete Test Airport',
            city: 'Delete Test City',
            country: 'Delete Test Country',
            faa: testAirportId,
            icao: `I${testAirportId}`,
            tz: 'America/Los_Angeles',
            geo: {
                lat: 37.7749,
                lon: -122.4194,
                alt: 13
            }
        };

        await fetch(`${apiBaseUrl}/airports`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(airportData)
        });
    });

    afterAll(async () => {
        try {
            await fetch(`${apiBaseUrl}/airports/${testAirportId}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.warn(`Failed to cleanup test airport:`, error);
        }
    });

    test('should delete airport successfully', async () => {
        const response = await fetch(`${apiBaseUrl}/airports/${testAirportId}`, {
            method: 'DELETE'
        });
        
        expect(response.status).toBe(204);
    });

    test('should return 404 for non-existent airport', async () => {
        const nonExistentId = `NONEXISTENT_${Date.now()}`;
        
        const response = await fetch(`${apiBaseUrl}/airports/${nonExistentId}`, {
            method: 'DELETE'
        });
        
        expect(response.status).toBe(404);
    });

    test('should handle special characters in airport ID', async () => {
        const specialId = 'ABC@123';
        
        const response = await fetch(`${apiBaseUrl}/airports/${specialId}`, {
            method: 'DELETE'
        });
        
        expect([400, 404, 500]).toContain(response.status);
    });

    test('should handle double deletion', async () => {
        const response = await fetch(`${apiBaseUrl}/airports/${testAirportId}`, {
            method: 'DELETE'
        });
        
        expect([204, 404]).toContain(response.status);
    });

    test('should verify airport is actually deleted', async () => {
        const response = await fetch(`${apiBaseUrl}/airports/${testAirportId}`);
        
        expect(response.status).toBe(404);
    });
}); 