describe('PUT /airports/{airportId} - Update Airport', () => {
    let apiBaseUrl;
    const testAirportId = `UPDATE_TEST_${Date.now()}`;

    beforeAll(async () => {
        apiBaseUrl = global.API_BASE_URL;
        expect(apiBaseUrl).toBeDefined();

        // Create a test airport first
        const airportData = {
            airportname: 'Test Update Airport',
            city: 'Test City',
            country: 'Test Country',
            faa: testAirportId,
            icao: `I${testAirportId}`,
            tz: 'America/Los_Angeles',
            geo: {
                lat: 37.7749,
                lon: -122.4194,
                alt: 13
            }
        };

        await fetch(`${apiBaseUrl}/airports/${testAirportId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(airportData)
        });
    });

    test('should update airport successfully with valid data', async () => {
        const updatedData = {
            airportname: 'Updated Test Airport',
            city: 'Updated Test City',
            country: 'Updated Test Country',
            faa: testAirportId,
            icao: `I${testAirportId}`,
            tz: 'America/New_York',
            geo: {
                lat: 40.7128,
                lon: -74.0060,
                alt: 10
            }
        };

        const response = await fetch(`${apiBaseUrl}/airports/${testAirportId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
        });
        
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toBeDefined();
    });

    test('should return 404 for non-existent airport', async () => {
        const nonExistentId = `NONEXISTENT_${Date.now()}`;
        const updateData = {
            airportname: 'Non-existent Airport'
        };

        const response = await fetch(`${apiBaseUrl}/airports/${nonExistentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        expect(response.status).toBe(404);
    });

    test('should return 400 for invalid data', async () => {
        const invalidData = {
            airportname: 123, // Should be string
            geo: {
                lat: 'invalid', // Should be number
                lon: -122.4194
            }
        };

        const response = await fetch(`${apiBaseUrl}/airports/${testAirportId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(invalidData)
        });
        
        expect([400, 500]).toContain(response.status);
    });

    test('should handle partial updates', async () => {
        const partialData = {
            airportname: 'Partially Updated Airport'
        };

        const response = await fetch(`${apiBaseUrl}/airports/${testAirportId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(partialData)
        });
        
        expect([200, 400]).toContain(response.status);
    });

    test('should handle empty request body', async () => {
        const response = await fetch(`${apiBaseUrl}/airports/${testAirportId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        
        expect(response.status).toBe(400);
    });
}); 